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
import { Bell, User, Shield, Database, Palette, HelpCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { Card } from '../design-system';
import NotificationSettings from '../components/settings/NotificationSettings';

type SettingsTab = 'notifications' | 'profile' | 'privacy' | 'data' | 'appearance' | 'help';

interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: typeof Bell;
  description: string;
}

const settingsTabs: SettingsTabConfig[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Manage notification preferences',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Update your profile information',
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    icon: Shield,
    description: 'Control your data and security settings',
  },
  {
    id: 'data',
    label: 'Data Management',
    icon: Database,
    description: 'Export or delete your data',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Customize theme and display',
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    description: 'Get help and documentation',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings />;

      case 'profile':
        return (
          <Card className="p-6">
            <p className="text-neutral-600">
              Profile settings are available on the{' '}
              <a href="/profile" className="text-primary-600 hover:underline">
                Profile page
              </a>
              .
            </p>
          </Card>
        );

      case 'privacy':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Privacy & Security</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-900">Self-Hosted Privacy</div>
                    <div className="text-sm text-neutral-600">
                      Your data stays on your server. We never see or access your information.
                    </div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Enabled
                  </div>
                </label>
              </div>
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium text-neutral-900 mb-2">Change Password</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Password management coming soon. Contact your admin to reset password.
                </p>
              </div>
            </div>
          </Card>
        );

      case 'data':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Data Management</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Export Your Data</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Download all your data in JSON format. Includes workouts, metrics, medications, and more.
                </p>
                <button
                  disabled
                  className="px-4 py-2 bg-neutral-100 text-neutral-400 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Export Data (Coming Soon)
                </button>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium text-red-600 mb-2">Delete Account</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  disabled
                  className="px-4 py-2 bg-red-100 text-red-400 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Delete Account (Coming Soon)
                </button>
              </div>
            </div>
          </Card>
        );

      case 'appearance':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-neutral-900 mb-2">Theme</label>
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 border-2 border-primary-500 bg-primary-50 rounded-lg text-sm font-medium">
                    ☀️ Light (Active)
                  </button>
                  <button
                    disabled
                    className="flex-1 px-4 py-3 border border-neutral-200 bg-neutral-50 text-neutral-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    🌙 Dark (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          </Card>
        );

      case 'help':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Help & Support</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Documentation</h4>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>
                    <a
                      href="https://github.com/Poolchaos/PersonalFit/blob/main/README.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      → README & Setup Guide
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/Poolchaos/PersonalFit/blob/main/CONTRIBUTING.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      → Contributing Guidelines
                    </a>
                  </li>
                </ul>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium text-neutral-900 mb-2">Report an Issue</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  Found a bug? Open an issue on GitHub.
                </p>
                <a
                  href="https://github.com/Poolchaos/PersonalFit/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Open Issue on GitHub →
                </a>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium text-neutral-900 mb-2">Version</h4>
                <p className="text-sm text-neutral-600">PersonalFit v1.0.0</p>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
            <p className="text-neutral-600 mt-1">Manage your account and application preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <Card className="p-2">
                <nav className="space-y-1">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden lg:inline">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">{renderTabContent()}</div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
