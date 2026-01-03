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
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
