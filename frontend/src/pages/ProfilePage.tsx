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

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { profileAPI } from '../api';
import type { UserProfile, UserPreferences } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../design-system';
import { User, Settings } from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: profileAPI.getProfile,
  });

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});

  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
      setProfile({});
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: profileAPI.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Preferences updated successfully!');
      setPreferences({});
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handlePreferencesSubmit = (e: FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(preferences);
  };

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-neutral-900">Profile Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input
                  label="First Name"
                  type="text"
                  value={profile.first_name ?? data?.user.profile.first_name ?? ''}
                  placeholder="Enter first name"
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={profile.last_name ?? data?.user.profile.last_name ?? ''}
                  placeholder="Enter last name"
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={profile.height_cm ?? data?.user.profile.height_cm ?? ''}
                    placeholder="170"
                    onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={profile.weight_kg ?? data?.user.profile.weight_kg ?? ''}
                    placeholder="70"
                    onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                  />
                </div>
                <Button type="submit" loading={updateProfileMutation.isPending} className="w-full">
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Workout Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                <Input
                  label="Preferred Workout Duration (minutes)"
                  type="number"
                  value={preferences.preferred_workout_duration ?? data?.user.preferences.preferred_workout_duration ?? ''}
                  placeholder="60"
                  onChange={(e) => setPreferences({ ...preferences, preferred_workout_duration: Number(e.target.value) })}
                />
                <Button type="submit" loading={updatePreferencesMutation.isPending} className="w-full">
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Health Ecosystem Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesSubmit} className="space-y-5">
                <div className="space-y-4">
                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">Habit Engine</p>
                      <p className="text-sm text-neutral-600">Track good vs bad habits with a momentum score.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.habits_enabled ?? data?.user.preferences.habits_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, habits_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">Diet & Vision AI</p>
                      <p className="text-sm text-neutral-600">Enable fridge/grocery scans for meal suggestions.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.diet_ai_enabled ?? data?.user.preferences.diet_ai_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, diet_ai_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">Mental Wellness</p>
                      <p className="text-sm text-neutral-600">Enable mood and stress check‑ins.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.mental_wellness_enabled ?? data?.user.preferences.mental_wellness_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, mental_wellness_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">Unified Health Score</p>
                      <p className="text-sm text-neutral-600">Show an explainable health score across pillars.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.unified_health_score_enabled ?? data?.user.preferences.unified_health_score_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, unified_health_score_enabled: e.target.checked })}
                    />
                  </label>
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-4">
                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">AI Vision Processing</p>
                      <p className="text-sm text-neutral-600">Allow AI to analyze images for food detection.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.ai_vision_enabled ?? data?.user.preferences.ai_vision_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, ai_vision_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">AI Recommendations</p>
                      <p className="text-sm text-neutral-600">Allow AI to generate coaching suggestions.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.ai_recommendations_enabled ?? data?.user.preferences.ai_recommendations_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, ai_recommendations_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-neutral-900">AI Habit Suggestions</p>
                      <p className="text-sm text-neutral-600">Allow AI to suggest habit optimizations.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      checked={preferences.ai_habit_suggestions_enabled ?? data?.user.preferences.ai_habit_suggestions_enabled ?? false}
                      onChange={(e) => setPreferences({ ...preferences, ai_habit_suggestions_enabled: e.target.checked })}
                    />
                  </label>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Image Retention (Vision AI)
                  </label>
                  <select
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={preferences.vision_image_retention ?? data?.user.preferences.vision_image_retention ?? 'delete'}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        vision_image_retention: e.target.value as 'delete' | 'keep',
                      })
                    }
                  >
                    <option value="delete">Delete after processing (recommended)</option>
                    <option value="keep">Keep for history</option>
                  </select>
                </div>

                <Button type="submit" loading={updatePreferencesMutation.isPending} className="w-full">
                  Save Health Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
