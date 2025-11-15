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

      // TODO: Make actual API call to test the key
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
