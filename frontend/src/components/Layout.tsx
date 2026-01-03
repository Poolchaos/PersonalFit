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

import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { MobileBottomNav } from './navigation/MobileBottomNav';
import { XPBar } from './gamification/XPBar';
import { LogOut, Menu, X, User, Settings, ChevronDown } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    // Clear all cached data when logging out
    queryClient.clear();
    clearAuth();
    navigate('/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name[0]}${user.profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/workouts', label: 'Workouts' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/metrics', label: 'Metrics' },
    { path: '/accountability', label: 'Goals' },
    { path: '/equipment', label: 'Equipment' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop Header */}
      <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center flex-1 min-w-0">
              <Link
                to="/dashboard"
                className="flex items-center text-xl font-bold text-primary-500 hover:text-primary-600 transition-colors flex-shrink-0"
              >
                PersonalFit
              </Link>

              {/* Desktop Navigation - scrollable on smaller screens */}
              <div className="hidden md:flex md:ml-6 lg:ml-8 md:space-x-1 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
                <div className="flex space-x-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        location.pathname === item.path
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-4 p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* XP Bar */}
              <div className="hidden sm:block">
                <XPBar />
              </div>

              {/* Desktop Profile Dropdown */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                    {getUserInitials()}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <p className="text-sm font-medium text-neutral-900">
                        {user?.profile?.first_name && user?.profile?.last_name
                          ? `${user.profile.first_name} ${user.profile.last_name}`
                          : 'User'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          // Navigate to settings when we have the page
                          navigate('/profile'); // Temporary - use profile page
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-neutral-200 pt-1">
                      <button
                        onClick={handleLogout}
                        data-testid="logout-button"
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Logout Button (keep simple for mobile) */}
              <button
                onClick={handleLogout}
                data-testid="logout-button-mobile"
                className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {/* XP Bar on mobile */}
              <div className="pb-3 border-b border-neutral-200 mb-2">
                <XPBar />
              </div>

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Profile & Settings Section */}
              <div className="border-t border-neutral-200 pt-2 mt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
