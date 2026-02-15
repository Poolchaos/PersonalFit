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

interface ParsedMedication {
  name: string;
  type: 'prescription' | 'supplement' | 'otc';
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };
  frequency: {
    times_per_day: number;
    schedule_times?: string[];
  };
  purpose?: string;
  notes?: string;
  // SAFETY: Dosage validation fields
  requires_review?: boolean;
  dosage_warning?: string;
}

interface ParsingResult {
  success: boolean;
  medications: ParsedMedication[];
  suggestions?: string;
  error?: string;
  requires_user_confirmation?: boolean; // SAFETY: Flag when any medication needs review
}

/**
 * Parse free-form medication notes using Claude AI
 * Extracts structured medication data from natural language input
 */
export async function parseMedicationNotes(notes: string): Promise<ParsingResult> {
  if (!notes || notes.trim().length === 0) {
    return {
      success: false,
      medications: [],
      error: 'No medication notes provided',
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set - medication parsing unavailable');
    return {
      success: false,
      medications: [],
      error: 'AI parsing service not configured',
    };
  }

  try {
    const client = new Anthropic({ apiKey });

    const prompt = `You are a medical data extraction expert. Parse the following medication/supplement notes into a structured JSON array.

Extract ALL medications/supplements mentioned. For each one, determine:
- name: The medication/supplement name (e.g., "Vitamin D3", "Metformin", "Omega-3")
- type: "prescription" (Rx meds), "supplement" (vitamins, minerals, herbs), or "otc" (over-the-counter)
- dosage.amount: Numeric dose (e.g., 500, 1000, 10)
- dosage.unit: "mg", "ml", "iu", "mcg", "g", "tablets", or "capsules"
- dosage.form: "tablet", "capsule", "liquid", "injection", "topical", "powder", or "other"
- frequency.times_per_day: How many times per day (1-4 typical, default 1 if unclear)
- frequency.schedule_times: Array of times in HH:MM format if mentioned (e.g., ["09:00", "21:00"])
- purpose: Why taking it (if mentioned)
- notes: Any additional context (side effects, interactions, etc.)

If information is missing or unclear, make reasonable medical assumptions:
- Default to 1 time per day if not specified
- Infer common dosages for well-known supplements (e.g., Vitamin D3: 1000-5000 IU, Omega-3: 1000mg)
- Use "tablet" or "capsule" as default forms for pills
- Classify common items correctly (Vitamin C = supplement, Ibuprofen = otc, Metformin = prescription)

Return ONLY valid JSON with no markdown formatting. Format:
{
  "medications": [
    {
      "name": "Vitamin D3",
      "type": "supplement",
      "dosage": {
        "amount": 2000,
        "unit": "iu",
        "form": "capsule"
      },
      "frequency": {
        "times_per_day": 1,
        "schedule_times": ["09:00"]
      },
      "purpose": "Bone health and immune support",
      "notes": "Take with food"
    }
  ],
  "suggestions": "Consider tracking adherence daily for best results."
}

Notes to parse:
${notes}

Return valid JSON only:`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedData = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse AI response as JSON:', responseText);
      return {
        success: false,
        medications: [],
        error: 'Failed to parse AI response',
      };
    }

    // Validate and clean the parsed medications with DOSAGE SAFETY checks
    const medications: ParsedMedication[] = (parsedData.medications || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response type is validated at runtime
      .map((med: any) => {
        // Validate required fields
        if (!med.name || !med.type || !med.dosage || !med.frequency) {
          console.warn('Skipping invalid medication:', med);
          return null;
        }

        // Validate type
        if (!['prescription', 'supplement', 'otc'].includes(med.type)) {
          med.type = 'supplement'; // Default fallback
        }

        // Validate dosage
        if (!med.dosage.amount || !med.dosage.unit || !med.dosage.form) {
          console.warn('Invalid dosage for medication:', med.name);
          return null;
        }

        // SAFETY: Dosage range validation - flag potentially dangerous values
        const amount = Number(med.dosage.amount);
        const unit = String(med.dosage.unit).toLowerCase();
        let requiresReview = false;
        let dosageWarning: string | undefined;

        // Common medication sanity checks (unit-aware)
        const maxSafeDosages: Record<string, Record<string, number>> = {
          // Vitamins/Supplements
          'vitamin d': { iu: 10000, mcg: 250 },
          'vitamin d3': { iu: 10000, mcg: 250 },
          'vitamin c': { mg: 2000, g: 2 },
          'vitamin b12': { mcg: 2500, mg: 2.5 },
          'vitamin a': { iu: 10000, mcg: 3000 },
          'iron': { mg: 65, tablets: 2 },
          'calcium': { mg: 2500, g: 2.5 },
          'zinc': { mg: 40 },
          'omega-3': { mg: 3000, g: 3 },
          'fish oil': { mg: 3000, g: 3 },
          'magnesium': { mg: 400 },
          // Common OTC pain relievers
          'aspirin': { mg: 1000, tablets: 2 },
          'ibuprofen': { mg: 1200, tablets: 3 },
          'acetaminophen': { mg: 1000, tablets: 2 },
          'tylenol': { mg: 1000, tablets: 2 },
          'naproxen': { mg: 500, tablets: 1 },
          // Caffeine
          'caffeine': { mg: 400 },
        };

        const medNameLower = String(med.name).toLowerCase();
        const matchingMed = Object.entries(maxSafeDosages).find(([name]) =>
          medNameLower.includes(name)
        );

        if (matchingMed) {
          const [, limits] = matchingMed;
          const maxForUnit = limits[unit];
          if (maxForUnit && amount > maxForUnit) {
            requiresReview = true;
            dosageWarning = `Dosage ${amount}${unit} exceeds typical safe single dose of ${maxForUnit}${unit}`;
            console.warn(`DOSAGE WARNING for ${med.name}: ${dosageWarning}`);
          }
        }

        // Generic sanity checks for any medication
        if (unit === 'g' && amount > 10) {
          requiresReview = true;
          dosageWarning = dosageWarning || `Unusually high dose: ${amount}g`;
        }
        if (unit === 'mg' && amount > 5000) {
          requiresReview = true;
          dosageWarning = dosageWarning || `Unusually high dose: ${amount}mg - please verify`;
        }

        // Validate frequency
        if (!med.frequency.times_per_day || med.frequency.times_per_day < 1) {
          med.frequency.times_per_day = 1;
        }
        // Flag unusual frequency
        if (med.frequency.times_per_day > 6) {
          requiresReview = true;
          dosageWarning = (dosageWarning ? dosageWarning + '; ' : '') +
            `Unusual frequency: ${med.frequency.times_per_day}x/day`;
        }

        return {
          name: String(med.name).trim(),
          type: med.type,
          dosage: {
            amount: Number(med.dosage.amount),
            unit: med.dosage.unit,
            form: med.dosage.form,
          },
          frequency: {
            times_per_day: Number(med.frequency.times_per_day),
            schedule_times: med.frequency.schedule_times || undefined,
          },
          purpose: med.purpose ? String(med.purpose).trim() : undefined,
          notes: med.notes ? String(med.notes).trim() : undefined,
          // SAFETY: Add review flags
          requires_review: requiresReview,
          dosage_warning: dosageWarning,
        } as ParsedMedication;
      })
      .filter((med: ParsedMedication | null) => med !== null) as ParsedMedication[];

    // SAFETY: Check if any medications require user review
    const requiresUserConfirmation = medications.some(med => med.requires_review);

    return {
      success: true,
      medications,
      suggestions: parsedData.suggestions || undefined,
      requires_user_confirmation: requiresUserConfirmation,
    };
  } catch (error: unknown) {
    console.error('Error parsing medication notes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse medications';
    return {
      success: false,
      medications: [],
      error: errorMessage,
    };
  }
}
