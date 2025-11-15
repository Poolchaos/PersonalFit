import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../api';
import { useAuthStore } from '../store/authStore';
import type { SignupData } from '../types';
import { Button, Input, Card } from '../design-system';
import { AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const signupMutation = useMutation({
    mutationFn: authAPI.signup,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/onboarding');
    },
  });

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    return errors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationErrors(['Passwords do not match']);
      return;
    }

    signupMutation.mutate(formData);
  };

  const passwordErrors = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="max-w-md w-full">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
            <p className="text-neutral-600">Start your fitness journey today!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={validationErrors.length > 0 && formData.password.length > 0 ? validationErrors.join(', ') : undefined}
              helperText="Must include: uppercase, lowercase, number (8+ chars)"
            />

            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword || ''}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              success={passwordsMatch ? 'Passwords match' : undefined}
              error={!passwordsMatch && (formData.confirmPassword?.length || 0) > 0 ? 'Passwords do not match' : undefined}
            />

            {signupMutation.isError && (
              <div className="p-3 bg-error-light/10 border border-error-light text-error-DEFAULT rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>
                  {signupMutation.error instanceof Error
                    ? signupMutation.error.message
                    : 'Registration failed. Please try again.'}
                </span>
              </div>
            )}

            <Button
              type="submit"
              loading={signupMutation.isPending}
              disabled={passwordErrors.length > 0 || !passwordsMatch}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </Card>

        <div className="mt-8 text-center text-white text-sm">
          <p>Join thousands of fitness enthusiasts</p>
          <p className="mt-1">Start your journey today</p>
        </div>
      </div>
    </div>
  );
}
