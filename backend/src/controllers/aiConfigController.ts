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

import { Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/encryption';

export const getAIConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('+ai_config.api_key_encrypted');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return config without the encrypted API key
    const config = {
      provider: user.ai_config?.provider || 'openai',
      model: user.ai_config?.model,
      endpoint_url: user.ai_config?.endpoint_url,
      enabled: user.ai_config?.enabled || false,
      has_api_key: !!user.ai_config?.api_key_encrypted,
    };

    res.json({ ai_config: config });
  } catch (error) {
    console.error('Get AI config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAIConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { provider, api_key, model, endpoint_url, enabled } = req.body;

    const updateData: Record<string, unknown> = {};

    if (provider) {
      updateData['ai_config.provider'] = provider;
    }

    if (api_key) {
      // Encrypt the API key before storing
      updateData['ai_config.api_key_encrypted'] = encrypt(api_key);
    }

    if (model !== undefined) {
      updateData['ai_config.model'] = model;
    }

    if (endpoint_url !== undefined) {
      updateData['ai_config.endpoint_url'] = endpoint_url;
    }

    if (enabled !== undefined) {
      updateData['ai_config.enabled'] = enabled;
    }

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('+ai_config.api_key_encrypted');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return updated config without the encrypted API key
    const config = {
      provider: user.ai_config?.provider || 'openai',
      model: user.ai_config?.model,
      endpoint_url: user.ai_config?.endpoint_url,
      enabled: user.ai_config?.enabled || false,
      has_api_key: !!user.ai_config?.api_key_encrypted,
    };

    res.json({ ai_config: config, message: 'AI configuration updated successfully' });
  } catch (error) {
    console.error('Update AI config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const testAIConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('+ai_config.api_key_encrypted');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.ai_config?.enabled || !user.ai_config?.api_key_encrypted) {
      res.status(400).json({
        error: 'AI configuration not enabled or API key missing',
        success: false
      });
      return;
    }

    // Test decryption
    try {
      const decryptedKey = decrypt(user.ai_config.api_key_encrypted);

      // Validate key format based on provider
      if (user.ai_config.provider === 'openai' && !decryptedKey.startsWith('sk-')) {
        res.status(400).json({
          error: 'Invalid OpenAI API key format',
          success: false
        });
        return;
      }

      // Make actual API call to test the key with OpenAI
      if (user.ai_config.provider === 'openai') {
        try {
          const { validateOpenAIKey } = await import('../utils/openaiValidator');
          const validation = await validateOpenAIKey(decryptedKey.trim());

          if (validation.valid) {
            res.json({
              success: true,
              message: 'API key verified successfully with OpenAI',
              provider: user.ai_config.provider,
              details: validation.details
            });
          } else {
            res.status(401).json({
              error: validation.error || 'API key validation failed',
              errorCode: validation.errorCode,
              errorType: validation.errorType,
              success: false,
              details: validation.details
            });
          }
        } catch (apiError: unknown) {
          const error = apiError as { status?: number; message: string };
          console.error('OpenAI API key test failed:', error.message);
          res.status(401).json({
            error: `API test failed: ${error.message}`,
            success: false
          });
        }
        return;
      }

      // For non-OpenAI providers, just validate format for now
      res.json({
        success: true,
        message: 'AI configuration is valid',
        provider: user.ai_config.provider
      });
    } catch {
      res.status(500).json({
        error: 'Failed to decrypt API key',
        success: false
      });
    }
  } catch (error) {
    console.error('Test AI config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAIConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      {
        $unset: {
          'ai_config.api_key_encrypted': '',
        },
        $set: {
          'ai_config.enabled': false,
        },
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'AI API key deleted successfully' });
  } catch (error) {
    console.error('Delete AI config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
