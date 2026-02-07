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

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Sun, Moon, X } from 'lucide-react';
import { apiClient } from '../../api/client';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'morning' | 'evening';
  onComplete?: () => void;
}

const moodOptions = [
  { value: 'great', label: 'Great', emoji: '🤩' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'stressed', label: 'Stressed', emoji: '😰' },
];

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  type,
  onComplete,
}) => {
  const [mood, setMood] = useState('');
  const [sleepQuality, setSleepQuality] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [energyLevel, setEnergyLevel] = useState(0);
  const [waterIntake, setWaterIntake] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const resetForm = () => {
    setMood('');
    setSleepQuality(0);
    setSleepHours('');
    setEnergyLevel(0);
    setWaterIntake('');
    setNotes('');
    setInsights([]);
    setShowResults(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = type === 'morning' ? '/api/daily-loop/morning' : '/api/daily-loop/evening';

      const payload: Record<string, unknown> = {
        mood: mood || undefined,
        notes: notes || undefined,
      };

      if (type === 'morning') {
        if (sleepQuality > 0) payload.sleep_quality = sleepQuality;
        if (sleepHours) payload.sleep_hours = parseFloat(sleepHours);
        if (energyLevel > 0) payload.energy_level = energyLevel;
      } else {
        if (waterIntake) payload.water_intake = parseInt(waterIntake);
      }

      const response = await apiClient.post(endpoint, payload);

      if (response.data?.result?.insights) {
        setInsights(response.data.result.insights);
        setShowResults(true);
      } else {
        handleClose();
        onComplete?.();
      }
    } catch (error) {
      console.error('Check-in submission error:', error);
      toast.error('Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    handleClose();
    onComplete?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {!showResults ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                {type === 'morning' ? (
                  <Sun className="w-6 h-6 text-yellow-500" />
                ) : (
                  <Moon className="w-6 h-6 text-blue-500" />
                )}
                <h2 className="text-xl font-bold text-neutral-900">
                  {type === 'morning' ? 'Morning Check-In' : 'Evening Check-In'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  How are you feeling?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {moodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMood(option.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                        mood === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs text-neutral-600">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Morning-specific fields */}
              {type === 'morning' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sleep Quality
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSleepQuality(value)}
                          className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                            sleepQuality === value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sleepHours" className="block text-sm font-medium text-neutral-700 mb-2">
                      Hours of Sleep
                    </label>
                    <input
                      id="sleepHours"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="7.5"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Energy Level
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setEnergyLevel(value)}
                          className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                            energyLevel === value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Evening-specific fields */}
              {type === 'evening' && (
                <div>
                  <label htmlFor="waterIntake" className="block text-sm font-medium text-neutral-700 mb-2">
                    Water Intake (cups)
                  </label>
                  <input
                    id="waterIntake"
                    type="number"
                    min="0"
                    max="30"
                    value={waterIntake}
                    onChange={(e) => setWaterIntake(e.target.value)}
                    placeholder="8"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any thoughts or reflections..."
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-neutral-200">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results View */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  Check-In Complete!
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-neutral-700"
                  >
                    {insight}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
