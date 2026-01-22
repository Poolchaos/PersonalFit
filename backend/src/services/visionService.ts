/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 *
 * This file is part of PersonalFit.
 *
 * PersonalFit is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 *
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 *
 * See the LICENSE file for the full license text.
 */

import Anthropic from '@anthropic-ai/sdk';
import config from '../config';

const client = new Anthropic({
  apiKey: config.anthropic_api_key || process.env.ANTHROPIC_API_KEY,
});

export interface OCRResult {
  medication_name: string;
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };
  frequency: {
    times_per_day: number;
    notes?: string;
  };
  warnings: string[];
  health_tags: string[];
  confidence_score: number;
  raw_text?: string;
}

/**
 * Extract medication information from a bottle label image using Claude Vision
 */
export const extractMedicationFromImage = async (
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<OCRResult> => {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this medication or supplement bottle label and extract the following information in JSON format:

{
  "medication_name": "The name of the medication/supplement",
  "dosage": {
    "amount": number (extract from label),
    "unit": "mg" | "ml" | "iu" | "mcg" | "g" | "tablets" | "capsules",
    "form": "tablet" | "capsule" | "liquid" | "injection" | "topical" | "powder" | "other"
  },
  "frequency": {
    "times_per_day": number (extract from directions, default to 1 if unclear),
    "notes": "any special instructions like 'with food' or 'before bed'"
  },
  "warnings": ["list of warnings, side effects, or contraindications from label"],
  "health_tags": ["relevant health conditions or benefits"],
  "confidence_score": 0.0-1.0 (how confident you are in the extraction),
  "raw_text": "all text visible on the label"
}

Be conservative with dosage extraction. If unclear, use conservative estimates.
If this is not a medication or supplement bottle, return null.
Return ONLY valid JSON, no other text.`,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude Vision API');
    }

    // Parse the JSON response
    const result = JSON.parse(textContent.text);

    if (!result || !result.medication_name) {
      throw new Error('Could not extract medication information from image');
    }

    return result as OCRResult;
  } catch (error) {
    console.error('Error extracting medication from image:', error);
    throw error;
  }
};

/**
 * Validate and correct extracted medication data
 */
export const validateAndCorrectOCR = async (
  extractedData: OCRResult,
  userCorrections?: Partial<OCRResult>
): Promise<OCRResult> => {
  // Merge user corrections with extracted data
  const correctedData: OCRResult = {
    ...extractedData,
    ...userCorrections,
    dosage: {
      ...extractedData.dosage,
      ...userCorrections?.dosage,
    },
    frequency: {
      ...extractedData.frequency,
      ...userCorrections?.frequency,
    },
  };

  // Validate critical fields
  if (!correctedData.medication_name || correctedData.medication_name.trim().length === 0) {
    throw new Error('Medication name is required');
  }

  if (correctedData.dosage.amount <= 0) {
    throw new Error('Dosage amount must be greater than 0');
  }

  if (correctedData.frequency.times_per_day <= 0) {
    throw new Error('Frequency must be at least once per day');
  }

  // Ensure confidence score is between 0 and 1
  correctedData.confidence_score = Math.max(0, Math.min(1, correctedData.confidence_score));

  return correctedData;
};

/**
 * Batch extract from multiple bottle images
 */
export const extractFromMultipleImages = async (
  images: Array<{ base64: string; mimeType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }>
): Promise<OCRResult[]> => {
  const results = await Promise.allSettled(
    images.map((img) =>
      extractMedicationFromImage(img.base64, img.mimeType || 'image/jpeg')
    )
  );

  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<OCRResult>).value);
};
