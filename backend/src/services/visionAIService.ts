/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of Lumi.
 *
 * Lumi is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectedFoodItem {
  name: string;
  quantity: string;
  unit: string;
  category: 'protein' | 'vegetable' | 'fruit' | 'grain' | 'dairy' | 'snack' | 'beverage' | 'other';
  freshness_estimate?: 'fresh' | 'moderate' | 'expiring_soon';
  confidence: number;
}

export interface VisionAnalysisResult {
  items: DetectedFoodItem[];
  total_items_detected: number;
  analysis_provider: 'anthropic' | 'openai';
  raw_response?: string;
}

/**
 * Analyzes a fridge/grocery/receipt image using AI vision models
 * @param imageUrl - Public URL of the image to analyze
 * @param source - Type of image: 'fridge', 'grocery', or 'receipt'
 * @param provider - AI provider to use: 'anthropic' or 'openai'
 */
export async function analyzeVisionImage(
  imageUrl: string,
  source: 'fridge' | 'grocery' | 'receipt',
  provider: 'anthropic' | 'openai' = 'anthropic'
): Promise<VisionAnalysisResult> {
  if (provider === 'anthropic') {
    return analyzeWithClaude(imageUrl, source);
  } else {
    return analyzeWithGPT4Vision(imageUrl, source);
  }
}

/**
 * Analyzes image using Claude 3.5 Sonnet with vision capabilities
 */
async function analyzeWithClaude(
  imageUrl: string,
  source: 'fridge' | 'grocery' | 'receipt'
): Promise<VisionAnalysisResult> {
  const systemPrompt = getSystemPrompt(source);
  const userPrompt = getUserPrompt(source);

  try {
    // Fetch image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Determine media type from URL or default to jpeg
    const mediaType = imageUrl.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    }, { timeout: 30000 });

    // Parse Claude's response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const parsedItems = parseVisionResponse(textContent.text);

    return {
      items: parsedItems,
      total_items_detected: parsedItems.length,
      analysis_provider: 'anthropic',
      raw_response: textContent.text,
    };
  } catch (error) {
    console.error('Claude vision analysis error:', error);
    throw new Error(`Vision AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes image using GPT-4 Vision
 */
async function analyzeWithGPT4Vision(
  imageUrl: string,
  source: 'fridge' | 'grocery' | 'receipt'
): Promise<VisionAnalysisResult> {
  const systemPrompt = getSystemPrompt(source);
  const userPrompt = getUserPrompt(source);

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from GPT-4 Vision');
    }

    const parsedItems = parseVisionResponse(responseText);

    return {
      items: parsedItems,
      total_items_detected: parsedItems.length,
      analysis_provider: 'openai',
      raw_response: responseText,
    };
  } catch (error) {
    console.error('GPT-4 Vision analysis error:', error);
    throw new Error(`Vision AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates system prompt based on image source
 */
function getSystemPrompt(source: 'fridge' | 'grocery' | 'receipt'): string {
  const basePrompt = `You are a food recognition AI assistant. Your task is to identify food items and provide structured data.

Rules:
- Be accurate and specific
- Estimate quantities when visible
- Categorize items properly
- Assess freshness for perishables when applicable
- Provide confidence scores (0.0 to 1.0)
- Return ONLY valid JSON, no extra text`;

  const sourceSpecific = {
    fridge: `\n\nContext: Analyzing a refrigerator interior. Focus on identifying:
- All visible food items and beverages
- Containers and packaging
- Freshness indicators (appearance, packaging date if visible)
- Quantity estimates based on visible portions`,

    grocery: `\n\nContext: Analyzing grocery items (bags, cart, or haul). Focus on:
- All purchased items
- Package sizes and quantities
- Brand names when clearly visible
- Item categories for meal planning`,

    receipt: `\n\nContext: Analyzing a purchase receipt. Focus on:
- Line items with food/beverage names
- Quantities purchased
- Extract only food-related items (ignore non-food purchases)
- Match items to food categories`,
  };

  return basePrompt + sourceSpecific[source];
}

/**
 * Generates user prompt based on image source
 */
function getUserPrompt(source: 'fridge' | 'grocery' | 'receipt'): string {
  return `Analyze this ${source} image and identify all food items. Return a JSON array with this structure:

[
  {
    "name": "item name",
    "quantity": "estimated quantity",
    "unit": "pieces/lbs/oz/container/etc",
    "category": "protein|vegetable|fruit|grain|dairy|snack|beverage|other",
    "freshness_estimate": "fresh|moderate|expiring_soon" (only for perishables),
    "confidence": 0.95
  }
]

Be thorough and identify every visible food item. Return ONLY the JSON array, no additional text.`;
}

/**
 * Parses AI response into structured food items
 */
function parseVisionResponse(responseText: string): DetectedFoodItem[] {
  try {
    // Extract JSON from response (handle cases where AI adds extra text)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('No JSON array found in response, attempting full parse');
      // Try parsing the whole response
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed) ? parsed : [];
    }

    const items = JSON.parse(jsonMatch[0]);

    // Validate and normalize items
    return items
      .filter((item: { name?: string; confidence?: number }) => item.name && item.confidence !== undefined)
      .map((item: { name: string; quantity?: string; unit?: string; category?: string; freshness_estimate?: string; confidence: number }) => ({
        name: item.name,
        quantity: item.quantity || '1',
        unit: item.unit || 'unit',
        category: item.category || 'other',
        freshness_estimate: item.freshness_estimate,
        confidence: Math.min(Math.max(item.confidence, 0), 1), // Clamp 0-1
      }));
  } catch (error) {
    console.error('Failed to parse vision response:', error);
    console.error('Raw response:', responseText);
    throw new Error('Failed to parse AI vision response');
  }
}

/**
 * Generates meal suggestions based on detected food items
 */
export async function generateMealSuggestions(
  items: DetectedFoodItem[],
  dietaryPreferences?: string[],
  provider: 'anthropic' | 'openai' = 'anthropic'
): Promise<string[]> {
  const itemsList = items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join('\n');

  const prompt = `Based on these available ingredients:
${itemsList}

${dietaryPreferences && dietaryPreferences.length > 0 ? `Dietary preferences: ${dietaryPreferences.join(', ')}\n\n` : ''}
Generate 3-5 practical meal suggestions that can be made with these ingredients. Focus on:
- Healthy, balanced meals
- Using ingredients that need to be consumed soon
- Simple preparation when possible
- Clear meal names (breakfast, lunch, dinner, or snack)

Return ONLY a JSON array of meal names, like: ["Meal Name 1", "Meal Name 2", "Meal Name 3"]`;

  try {
    if (provider === 'anthropic') {
      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }, { timeout: 30000 });

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in meal suggestions response');
      }

      return JSON.parse(jsonMatch[0]);
    } else {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
      }, { timeout: 30000 });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from GPT-4');
      }

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in meal suggestions response');
      }

      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Meal suggestion generation error:', error);
    throw new Error(`Failed to generate meal suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
