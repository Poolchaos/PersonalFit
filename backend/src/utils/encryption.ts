import crypto from 'crypto';
import config from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Derives encryption key from master secret using PBKDF2
 */
const deriveKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(
    config.encryption_secret || config.jwt_secret, // Fallback to jwt_secret if no dedicated encryption secret
    salt,
    100000, // iterations
    32, // key length
    'sha256'
  );
};

/**
 * Encrypts a string value (e.g., API key)
 * Returns: base64(salt:iv:authTag:encryptedData)
 */
export const encrypt = (text: string): string => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine: salt:iv:authTag:encryptedData
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
};

/**
 * Decrypts an encrypted string
 * Expects: base64(salt:iv:authTag:encryptedData)
 */
export const decrypt = (encryptedData: string): string => {
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Validates that decryption works (for testing)
 */
export const validateEncryption = (original: string, encrypted: string): boolean => {
  try {
    const decrypted = decrypt(encrypted);
    return decrypted === original;
  } catch {
    return false;
  }
};
