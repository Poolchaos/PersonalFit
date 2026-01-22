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

import * as Minio from 'minio';
import config from '../config';
import { Readable } from 'stream';

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: config.minio_endpoint,
  port: config.minio_port,
  useSSL: config.minio_use_ssl,
  accessKey: config.minio_access_key,
  secretKey: config.minio_secret_key,
});

const BUCKET_NAME = 'progress-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Initialize MinIO bucket
 */
export const initializeStorage = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`âœ“ MinIO bucket '${BUCKET_NAME}' created successfully`);

      // Set bucket policy to allow read access for authenticated users
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    } else {
      console.log(`âœ“ MinIO bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (error) {
    console.error('Failed to initialize MinIO storage:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: Express.Multer.File
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
};

/**
 * Generate unique filename with user ID and timestamp
 */
export const generateFilename = (
  userId: string,
  originalFilename: string,
  photoType: 'front' | 'side' | 'back' | 'medication-bottle'
): string => {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}/${photoType}/${timestamp}.${extension}`;
};

/**
 * Upload file to MinIO
 */
export const uploadPhoto = async (
  userId: string,
  file: Express.Multer.File,
  photoType: 'front' | 'side' | 'back' | 'medication-bottle'
): Promise<{ url: string; filename: string }> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = generateFilename(userId, file.originalname, photoType);

  // Convert buffer to stream
  const stream = Readable.from(file.buffer);

  // Upload to MinIO
  await minioClient.putObject(BUCKET_NAME, filename, stream, file.size, {
    'Content-Type': file.mimetype,
  });

  // Generate presigned URL for secure access (24 hours)
  const url = await generatePresignedUrl(filename);

  return { url, filename };
};

/**
 * Delete photo from MinIO
 */
export const deletePhoto = async (filename: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, filename);
  } catch (error) {
    console.error(`Failed to delete photo ${filename}:`, error);
    throw error;
  }
};

/**
 * Generate presigned URL for private photo access (expires in 24 hours)
 */
export const generatePresignedUrl = async (
  filename: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      filename,
      expirySeconds
    );
    return url;
  } catch (error) {
    console.error(`Failed to generate presigned URL for ${filename}:`, error);
    throw error;
  }
};

/**
 * Check if photo exists
 */
export const photoExists = async (filename: string): Promise<boolean> => {
  try {
    await minioClient.statObject(BUCKET_NAME, filename);
    return true;
  } catch {
    return false;
  }
};

/**
 * List all photos for a user
 */
export const listUserPhotos = async (
  userId: string
): Promise<Array<{ name: string; size: number; lastModified: Date }>> => {
  return new Promise((resolve, reject) => {
    const photos: Array<{ name: string; size: number; lastModified: Date }> = [];
    const stream = minioClient.listObjects(BUCKET_NAME, `${userId}/`, true);

    stream.on('data', (obj) => {
      if (obj.name && obj.size !== undefined && obj.lastModified) {
        photos.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      }
    });

    stream.on('error', (err) => {
      reject(err);
    });

    stream.on('end', () => {
      resolve(photos);
    });
  });
};
