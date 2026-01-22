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
  openai_api_key: string;
  anthropic_api_key: string;
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
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/personalfit',
  jwt_secret: process.env.JWT_SECRET || '',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '24h',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || '',
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  openai_api_key: process.env.OPENAI_API_KEY || '',
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
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
}

export default config;
