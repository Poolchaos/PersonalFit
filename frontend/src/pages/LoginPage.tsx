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
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '../types';
import { Button, Input, Card } from '../design-system';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Invalid email or password';
      toast.error(message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="max-w-md w-full">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">PersonalFit</h1>
            <p className="text-neutral-600">Welcome back! Please login to your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />

            {loginMutation.isError && (
              <div className="p-3 bg-error-light/10 border border-error-light text-error-DEFAULT rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>
                  {loginMutation.error instanceof Error && loginMutation.error.message
                    ? loginMutation.error.message
                    : 'Invalid email or password. Please try again.'}
                </span>
              </div>
            )}

            <Button
              type="submit"
              loading={loginMutation.isPending}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
              Sign up
            </Link>
          </div>
        </Card>

        <div className="mt-8 text-center text-white text-sm">
          <p>Your self-hosted fitness companion</p>
          <p className="mt-1">Zero cost • Full privacy • Complete control</p>
        </div>
      </div>
    </div>
  );
}
