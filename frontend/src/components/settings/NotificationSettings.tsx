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

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Moon, TestTube, Loader2, Check, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribed,
  sendTestNotification,
} from '../../utils/pushNotifications';

interface NotificationPreferences {
  medication_reminders: {
    enabled: boolean;
    advance_minutes: number;
    escalation_minutes: number;
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    medication_reminders: {
      enabled: true,
      advance_minutes: 15,
      escalation_minutes: 30,
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await apiClient.get('/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    const supported = isPushSupported();
    setPushSupported(supported);

    if (supported) {
      const permission = getNotificationPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const subscribed = await isSubscribed();
        setPushEnabled(subscribed);
      }
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && !pushEnabled) {
      // Need to enable push first
      await handleEnablePush();
    }

    setPreferences((prev) => ({
      ...prev,
      medication_reminders: {
        ...prev.medication_reminders,
        enabled,
      },
    }));

    await savePreferences({
      enabled,
    });
  };

  const handleEnablePush = async () => {
    try {
      setLoading(true);

      // Request permission
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        toast.warning('Please allow notifications to receive medication reminders');
        return;
      }

      // Subscribe to push
      await subscribeToPushNotifications();
      setPushEnabled(true);

      // Enable medication reminders
      setPreferences((prev) => ({
        ...prev,
        medication_reminders: {
          ...prev.medication_reminders,
          enabled: true,
        },
      }));

      await savePreferences({ enabled: true });
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setLoading(true);
      await unsubscribeFromPushNotifications();
      setPushEnabled(false);

      // Disable medication reminders
      setPreferences((prev) => ({
        ...prev,
        medication_reminders: {
          ...prev.medication_reminders,
          enabled: false,
        },
      }));

      await savePreferences({ enabled: false });
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      toast.error('Failed to disable push notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceMinutesChange = async (minutes: number) => {
    setPreferences((prev) => ({
      ...prev,
      medication_reminders: {
        ...prev.medication_reminders,
        advance_minutes: minutes,
      },
    }));

    await savePreferences({ advance_minutes: minutes });
  };

  const handleEscalationMinutesChange = async (minutes: number) => {
    setPreferences((prev) => ({
      ...prev,
      medication_reminders: {
        ...prev.medication_reminders,
        escalation_minutes: minutes,
      },
    }));

    await savePreferences({ escalation_minutes: minutes });
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      medication_reminders: {
        ...prev.medication_reminders,
        quiet_hours: {
          ...prev.medication_reminders.quiet_hours,
          enabled,
        },
      },
    }));

    await savePreferences({
      quiet_hours: {
        ...preferences.medication_reminders.quiet_hours,
        enabled,
      },
    });
  };

  const handleQuietHoursTimeChange = async (
    type: 'start' | 'end',
    time: string
  ) => {
    const newQuietHours = {
      ...preferences.medication_reminders.quiet_hours,
      [type]: time,
    };

    setPreferences((prev) => ({
      ...prev,
      medication_reminders: {
        ...prev.medication_reminders,
        quiet_hours: newQuietHours,
      },
    }));

    await savePreferences({ quiet_hours: newQuietHours });
  };

  const savePreferences = async (updates: Record<string, unknown>) => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/preferences', updates);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!pushEnabled) {
      toast.warning('Please enable push notifications first');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      await sendTestNotification();
      setTestResult('success');
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResult('error');
      setTimeout(() => setTestResult(null), 3000);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!pushSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BellOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Push Notifications Not Supported
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Your browser doesn't support push notifications. You can still use
              in-app reminders when the app is open.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {preferences.medication_reminders.enabled ? (
              <Bell className="w-5 h-5 text-primary-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Medication Reminders
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified before it's time to take your medications
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.medication_reminders.enabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {notificationPermission === 'denied' && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}
      </div>

      {/* Timing Settings */}
      {preferences.medication_reminders.enabled && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Reminder Timing
            </h4>

            <div className="space-y-4">
              {/* Advance Notification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notify me{' '}
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {preferences.medication_reminders.advance_minutes} minutes
                  </span>{' '}
                  before each dose
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={preferences.medication_reminders.advance_minutes}
                  onChange={(e) =>
                    handleAdvanceMinutesChange(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={saving}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>

              {/* Escalation Notification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send follow-up reminder{' '}
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {preferences.medication_reminders.escalation_minutes} minutes
                  </span>{' '}
                  after scheduled time if not logged
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="15"
                  value={preferences.medication_reminders.escalation_minutes}
                  onChange={(e) =>
                    handleEscalationMinutesChange(parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={saving}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Off</span>
                  <span>2 hours</span>
                </div>
                {preferences.medication_reminders.escalation_minutes === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Follow-up reminders are disabled
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Moon className="w-5 h-5 text-indigo-500" />
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    Quiet Hours
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don't send notifications during these hours
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.medication_reminders.quiet_hours.enabled}
                  onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {preferences.medication_reminders.quiet_hours.enabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start
                  </label>
                  <input
                    type="time"
                    value={preferences.medication_reminders.quiet_hours.start}
                    onChange={(e) =>
                      handleQuietHoursTimeChange('start', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End
                  </label>
                  <input
                    type="time"
                    value={preferences.medication_reminders.quiet_hours.end}
                    onChange={(e) =>
                      handleQuietHoursTimeChange('end', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Test Notification */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TestTube className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    Test Notification
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send a test notification to make sure everything works
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestNotification}
                disabled={testing || saving || !pushEnabled}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : testResult === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sent!</span>
                  </>
                ) : testResult === 'error' ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Failed</span>
                  </>
                ) : (
                  <span>Send Test</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Push Status */}
      {preferences.medication_reminders.enabled && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  pushEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Push notifications are{' '}
                <span className="font-medium">
                  {pushEnabled ? 'enabled' : 'disabled'}
                </span>
              </span>
            </div>

            {pushEnabled && (
              <button
                onClick={handleDisablePush}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Disable
              </button>
            )}
          </div>
        </div>
      )}

      {/* Saving Indicator */}
      {saving && (
        <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
