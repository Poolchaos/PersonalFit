/**
 * Test script for Claude Vision OCR functionality
 * 
 * Usage: 
 * 1. Set ANTHROPIC_API_KEY in .env
 * 2. Run: npx ts-node scripts/test-vision-ocr.ts
 */

import { extractMedicationFromImage } from '../src/services/visionService';
import * as fs from 'fs';
import * as path from 'path';

async function testOCR() {
  console.log('🧪 Testing Claude Vision OCR...\n');

  // Create a simple test image (base64 encoded 1x1 pixel PNG)
  // In a real test, you would use an actual medication bottle photo
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  console.log('📸 Testing with sample image...');
  console.log('ℹ️  Note: This is a 1x1 pixel test image. For real testing, use actual medication bottle photos.\n');

  try {
    const result = await extractMedicationFromImage(testImageBase64);
    
    console.log('✅ OCR Extraction Successful!\n');
    console.log('📋 Extracted Data:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✨ Test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ OCR Test Failed:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Make sure ANTHROPIC_API_KEY is set in your .env file');
    }
    
    process.exit(1);
  }
}

// Check if API key is configured
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY not found in environment');
  console.log('\n📝 Setup instructions:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your Anthropic API key: ANTHROPIC_API_KEY=sk-ant-...');
  console.log('3. Run this script again');
  process.exit(1);
}

testOCR();
