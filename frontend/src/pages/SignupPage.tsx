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

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import type { SignupData } from '../types';
import { AuroraBackground, GlassCard, GlassInput, GlassButton, LumiLogo } from '../components/auth';
import { AlertCircle, Check, X } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const signupMutation = useMutation({
    mutationFn: authAPI.signup,
    onSuccess: (data) => {
      // Clear all cached data from previous user
      queryClient.clear();
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/onboarding');
    },
  });

  const validatePassword = (password: string): { label: string; valid: boolean }[] => {
    return [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'One number', valid: /\d/.test(password) },
    ];
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const requirements = validatePassword(formData.password);
    const invalidReqs = requirements.filter((req) => !req.valid);

    if (invalidReqs.length > 0) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    signupMutation.mutate(formData);
  };

  const passwordRequirements = validatePassword(formData.password);
  const allRequirementsMet = passwordRequirements.every((req) => req.valid);
  const passwordsMatch = formData.password === formData.confirmPassword && (formData.confirmPassword?.length ?? 0) > 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated aurora background */}
      <AuroraBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <div className="mb-8">
            <LumiLogo />
          </div>

          {/* Glassmorphic card */}
          <GlassCard>
            {/* Headline */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">
                Your health, illuminated
              </h2>
              <p className="text-white/60">
                Join 50,000+ users taking control with AI
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <GlassInput
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />

              <div className="space-y-2">
                <GlassInput
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />

                {/* Password requirements */}
                {formData.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"
                  >
                    {passwordRequirements.map((req, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        {req.valid ? (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#10B981]" strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                          </div>
                        )}
                        <span className={req.valid ? 'text-white/90 font-medium' : 'text-white/50'}>
                          {req.label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <GlassInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />

                {/* Password match indicator */}
                {(formData.confirmPassword?.length ?? 0) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`flex items-center gap-2.5 text-sm p-3 rounded-xl backdrop-blur-md border ${
                      passwordsMatch
                        ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
                        : 'text-[#FF6B9D] bg-[#FF6B9D]/10 border-[#FF6B9D]/20'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                        </div>
                        <span className="font-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6B9D]/20 flex items-center justify-center">
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </div>
                        <span className="font-medium">Passwords do not match</span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {signupMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-error-light/20 backdrop-blur-sm border border-error-light/30 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <AlertCircle size={16} />
                  <span>
                    {signupMutation.error instanceof Error
                      ? signupMutation.error.message
                      : 'Registration failed. Please try again.'}
                  </span>
                </motion.div>
              )}

              <GlassButton
                type="submit"
                loading={signupMutation.isPending}
                disabled={!allRequirementsMet || !passwordsMatch}
                className="w-full"
              >
                Start my journey →
              </GlassButton>
            </form>

            {/* Sign in link */}
            <motion.div
              className="mt-6 text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <span className="text-white/60">Already exploring? </span>
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors relative group"
              >
                <span className="relative">
                  Sign in →
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full" />
                </span>
              </Link>
            </motion.div>
          </GlassCard>

          {/* Footer tagline */}
          <motion.div
            className="mt-8 text-center text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <p>Begin your transformation with AI</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
