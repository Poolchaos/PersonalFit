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

import { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../design-system';

export interface OCRResult {
  medication_name: string;
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'iu' | 'mcg' | 'g' | 'tablets' | 'capsules';
    form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'powder' | 'other';
  };
  frequency: {
    times_per_day: number;
    notes?: string;
  };
  warnings: string[];
  health_tags: string[];
  confidence_score: number;
  raw_text?: string;
}

interface BottleImageUploadProps {
  onExtracted: (result: OCRResult) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export default function BottleImageUpload({
  onExtracted,
  onError,
  isLoading = false,
}: BottleImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        setFileName(file.name);

        // Start extraction
        setExtracting(true);
        await extractMedicationInfo(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      onError(errorMessage);
    }
  };

  const extractMedicationInfo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/medications/extract-from-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract medication information');
      }

      const result = await response.json();
      setExtracted(result.data);
      onExtracted(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract medication information';
      onError(errorMessage);
      setExtracted(null);
    } finally {
      setExtracting(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setFileName('');
    setExtracted(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Scan Medication Bottle (Optional)
        </label>
        {extracted && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="w-4 h-4" />
            Auto-extracted
          </span>
        )}
      </div>

      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || extracting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading || extracting}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Take a clear photo of the medication bottle label for automatic information extraction.
              AI will extract dosage, frequency, warnings, and more.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading || extracting}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            disabled={isLoading || extracting}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={preview}
              alt="Bottle label preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
            {!extracting && extracted && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                ✓ Extracted
              </div>
            )}
            {extracting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin mb-2">⏳</div>
                  <p className="text-sm">Analyzing label...</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={clearImage}
              disabled={extracting}
              className="absolute top-2 left-2 bg-white rounded-full p-1 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* File Info */}
          <p className="text-xs text-gray-500">{fileName}</p>

          {/* Extracted Data Display */}
          {extracted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{extracted.medication_name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {extracted.dosage.amount} {extracted.dosage.unit} • {extracted.dosage.form}
                  </p>
                  <p className="text-xs text-gray-600">
                    {extracted.frequency.times_per_day}x daily
                    {extracted.frequency.notes && ` • ${extracted.frequency.notes}`}
                  </p>
                </div>
              </div>

              {extracted.warnings.length > 0 && (
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold mb-1">Warnings:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {extracted.warnings.slice(0, 3).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Confidence: {Math.round(extracted.confidence_score * 100)}%
                </span>
                <span className="text-gray-500">
                  Review & correct details before saving
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!extracted && !extracting && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700">
                <p className="font-semibold">Could not read bottle label</p>
                <p>Please ensure the label is clear and fully visible, then try again.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={clearImage}
              disabled={extracting}
              className="flex-1"
            >
              Change Photo
            </Button>
            {extracted && (
              <Button type="button" disabled className="flex-1 bg-green-600 text-white">
                ✓ Information Ready
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
