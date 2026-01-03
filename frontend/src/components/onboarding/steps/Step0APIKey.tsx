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

import { Zap } from 'lucide-react';
import { Input, Button } from '../../../design-system';
import type { Step0Props } from './types';

export function Step0APIKey({
  data,
  setData,
  hasExistingKey,
  tokenTested,
  testAIConfigMutation,
}: Step0Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">OpenAI API Setup</h3>
        <p className="text-neutral-600 mb-6">
          PersonalFit uses AI to generate personalized workout plans. You'll need an OpenAI API key to get started.
        </p>
      </div>

      {hasExistingKey && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-success-900 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            API Key Already Configured
          </h4>
          <p className="text-sm text-success-800">
            You have an OpenAI API key on file. You can skip this step or update it with a new key below.
          </p>
        </div>
      )}

      {!hasExistingKey && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            How to get your API key:
          </h4>
          <ol className="text-sm text-primary-800 space-y-2 ml-4 list-decimal">
            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">platform.openai.com/api-keys</a></li>
            <li>Sign in or create an OpenAI account</li>
            <li>Click "Create new secret key"</li>
            <li>Copy the key and paste it below</li>
          </ol>
        </div>
      )}

      <Input
        label={hasExistingKey ? "Update OpenAI API Key (optional)" : "OpenAI API Key"}
        type="password"
        placeholder={hasExistingKey ? "Leave empty to use existing key" : "sk-..."}
        value={data.openai_token || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, openai_token: e.target.value })}
      />

      <div className="flex gap-3">
        {data.openai_token && (
          <Button
            onClick={() => testAIConfigMutation.mutate()}
            loading={testAIConfigMutation.isPending}
            disabled={!data.openai_token || data.openai_token.length < 20}
            variant="secondary"
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
        )}
        {tokenTested && (
          <div className="flex items-center gap-2 text-success-dark font-medium px-4 py-2 bg-success-50 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </div>
        )}
        {hasExistingKey && !data.openai_token && (
          <div className="flex items-center gap-2 text-success-dark font-medium px-4 py-2 bg-success-50 rounded-lg flex-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Using existing key
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        Your API key is securely stored and only used to generate your workouts. We never share it with third parties.
      </p>
    </div>
  );
}
