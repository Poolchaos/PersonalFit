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

import dotenv from 'dotenv';

dotenv.config();

interface Config {
  node_env: string;
  port: number;
  mongodb_uri: string;
  jwt_secret: string;
  jwt_expires_in: string;
  jwt_refresh_secret: string;
  jwt_refresh_expires_in: string;
  // Multi-LLM Provider Configuration
  openai_api_key: string;
  anthropic_api_key: string;
  gemini_api_key: string;
  moonshot_api_key: string;
  default_llm_provider: string;
  encryption_secret: string;
  cors_origin: string;
  minio_endpoint: string;
  minio_port: number;
  minio_use_ssl: boolean;
  minio_access_key: string;
  minio_secret_key: string;
  minio_external_url: string;
}

const config: Config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lumi',
  jwt_secret: process.env.JWT_SECRET || '',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '24h',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || '',
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Multi-LLM Provider API Keys
  openai_api_key: process.env.OPENAI_API_KEY || '',
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
  gemini_api_key: process.env.GEMINI_API_KEY || '',
  moonshot_api_key: process.env.MOONSHOT_API_KEY || '',
  default_llm_provider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
  encryption_secret: process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || '',
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  minio_endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  minio_port: parseInt(process.env.MINIO_PORT || '9000', 10),
  minio_use_ssl: process.env.MINIO_USE_SSL === 'true',
  minio_access_key: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  minio_secret_key: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  minio_external_url: process.env.MINIO_EXTERNAL_URL || 'http://localhost:9000',
};

// Validate required environment variables in production
if (config.node_env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
    'OPENAI_API_KEY',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'ENCRYPTION_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Block known weak/default secrets in production
  const KNOWN_WEAK_SECRETS = [
    'dev-secret-change-in-production',
    'dev-refresh-secret-change-in-production',
    'dev-encryption-secret-change-in-production',
    'your-secret-key-change-in-production',
    'your-refresh-secret-key-change-in-production',
    'your-encryption-secret-change-in-production',
    'changeme',
    'minioadmin',
    'minioadmin123',
  ];

  const weakSecretChecks: Array<{ name: string; value: string }> = [
    { name: 'JWT_SECRET', value: config.jwt_secret },
    { name: 'JWT_REFRESH_SECRET', value: config.jwt_refresh_secret },
    { name: 'ENCRYPTION_SECRET', value: config.encryption_secret },
    { name: 'MINIO_ACCESS_KEY', value: config.minio_access_key },
    { name: 'MINIO_SECRET_KEY', value: config.minio_secret_key },
  ];

  const weakSecrets = weakSecretChecks.filter(
    (check) => KNOWN_WEAK_SECRETS.includes(check.value) || check.value.length < 16
  );

  if (weakSecrets.length > 0) {
    throw new Error(
      `SECURITY ERROR: Weak or default secrets detected in production: ${weakSecrets.map((s) => s.name).join(', ')}. ` +
      `Please set strong, unique values for these environment variables.`
    );
  }
}

export default config;
