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
import OpenAI from 'openai';
import HealthScore from '../models/HealthScore';
import mongoose from 'mongoose';

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CoachingRecommendation {
  priority: 'high' | 'medium' | 'low';
  pillar: 'fitness' | 'diet' | 'habits' | 'meds' | 'mental' | 'cross-pillar';
  title: string;
  message: string;
  action_items: string[];
}

/**
 * Generates personalized coaching recommendations based on health score analysis
 */
export async function generateCoachingRecommendations(
  userId: string,
  provider: 'anthropic' | 'openai' = 'anthropic'
): Promise<CoachingRecommendation[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get last 7 days of health scores
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentScores = await HealthScore.find({
    user_id: userObjectId,
    score_date: { $gte: sevenDaysAgo.toISOString().split('T')[0] },
  })
    .sort({ score_date: -1 })
    .limit(7);

  if (recentScores.length === 0) {
    return [
      {
        priority: 'medium',
        pillar: 'cross-pillar',
        title: 'Get Started',
        message: 'Begin tracking your health activities to receive personalized recommendations.',
        action_items: [
          'Complete your daily habit check-in',
          'Log a workout',
          'Upload a fridge scan for meal suggestions',
        ],
      },
    ];
  }

  // Convert Mongoose documents to plain objects with date strings
  const scoresData = recentScores.map((score) => ({
    total_score: score.total_score,
    score_date: score.score_date.toISOString().split('T')[0],
    pillars: score.pillars,
    reasons: score.reasons,
  }));

  const analysisData = prepareAnalysisData(scoresData);

  if (provider === 'anthropic') {
    return generateWithClaude(analysisData);
  } else {
    return generateWithGPT4(analysisData);
  }
}

/**
 * Prepare health score data for AI analysis
 */
function prepareAnalysisData(scores: Array<{
  total_score: number;
  score_date: string;
  pillars?: { fitness?: number; diet?: number; habits?: number; meds?: number; mental?: number };
  reasons?: string[];
}>): string {
  const latest = scores[0];
  const trend = scores.length > 1 ? scores[0].total_score - scores[scores.length - 1].total_score : 0;

  return `Health Score Analysis:
Current Total Score: ${latest.total_score}/100
7-Day Trend: ${trend > 0 ? '+' : ''}${trend} points

Pillar Breakdown:
- Fitness: ${latest.pillars?.fitness || 0}/100
- Diet: ${latest.pillars?.diet || 0}/100  
- Habits: ${latest.pillars?.habits || 0}/100
- Medications: ${latest.pillars?.meds || 0}/100
- Mental Wellness: ${latest.pillars?.mental || 0}/100

Recent Reasons:
${latest.reasons?.slice(0, 5).join('\n') || 'No recent activity'}

Historical Scores (Last 7 Days):
${scores.map((s) => `${s.score_date}: ${s.total_score}`).join('\n')}`;
}

/**
 * Generate recommendations using Claude
 */
async function generateWithClaude(analysisData: string): Promise<CoachingRecommendation[]> {
  const systemPrompt = `You are a holistic health coach analyzing a user's health data across multiple pillars: fitness, diet, habits, medications, and mental wellness.

Your goal is to provide 2-4 actionable, personalized recommendations that:
1. Identify the weakest pillar(s) needing attention
2. Recognize patterns and cross-pillar connections
3. Provide specific, achievable action items
4. Maintain an encouraging, supportive tone

Return ONLY a JSON array with this structure:
[
  {
    "priority": "high|medium|low",
    "pillar": "fitness|diet|habits|meds|mental|cross-pillar",
    "title": "Brief title (3-6 words)",
    "message": "Encouraging message with specific observation (1-2 sentences)",
    "action_items": ["Specific action 1", "Specific action 2", "Specific action 3"]
  }
]`;

  const userPrompt = `${analysisData}

Generate 2-4 personalized coaching recommendations for this user.`;

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude coaching error:', error);
    return getDefaultRecommendations();
  }
}

/**
 * Generate recommendations using GPT-4
 */
async function generateWithGPT4(analysisData: string): Promise<CoachingRecommendation[]> {
  const systemPrompt = `You are a holistic health coach analyzing a user's health data across multiple pillars: fitness, diet, habits, medications, and mental wellness.

Your goal is to provide 2-4 actionable, personalized recommendations that:
1. Identify the weakest pillar(s) needing attention
2. Recognize patterns and cross-pillar connections
3. Provide specific, achievable action items
4. Maintain an encouraging, supportive tone

Return ONLY a JSON array of recommendations.`;

  const userPrompt = `${analysisData}

Generate 2-4 personalized coaching recommendations. Return as JSON array:
[{"priority":"high|medium|low","pillar":"fitness|diet|habits|meds|mental|cross-pillar","title":"Brief title","message":"Encouraging message","action_items":["action1","action2","action3"]}]`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from GPT-4');
    }

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('GPT-4 coaching error:', error);
    return getDefaultRecommendations();
  }
}

/**
 * Fallback recommendations when AI is unavailable
 */
function getDefaultRecommendations(): CoachingRecommendation[] {
  return [
    {
      priority: 'high',
      pillar: 'cross-pillar',
      title: 'Build Consistency',
      message: 'Focus on completing your daily health loop every day this week.',
      action_items: [
        'Check in with your daily habits',
        'Complete scheduled workout',
        'Log at least 2 meals',
      ],
    },
    {
      priority: 'medium',
      pillar: 'habits',
      title: 'Strengthen Good Habits',
      message: 'Small daily wins compound into major health improvements.',
      action_items: [
        'Set reminders for habit check-ins',
        'Track water intake',
        'Maintain consistent sleep schedule',
      ],
    },
  ];
}
