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

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, UploadCloud } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../design-system';
import { analyticsAPI, healthEcosystemAPI } from '../../api';

export function VisionScanUploader() {
  const [source, setSource] = useState<'fridge' | 'grocery' | 'receipt'>('fridge');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const upload = await healthEcosystemAPI.uploadVisionImage({ source, file });
      return healthEcosystemAPI.createVisionScan({
        source,
        image_url: upload.image.url,
        items: [],
        status: 'pending',
      });
    },
    onSuccess: () => {
      analyticsAPI.trackEvent('vision_scan_uploaded', { source });
      toast.success('Scan uploaded. We’ll process it for meal suggestions.');
      setFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload scan');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visionary Fridge Scan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(['fridge', 'grocery', 'receipt'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSource(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                source === option
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {option === 'fridge' ? 'Fridge' : option === 'grocery' ? 'Grocery' : 'Receipt'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-lg p-6 text-center gap-2">
          <Camera className="w-8 h-8 text-neutral-500" />
          <p className="text-sm text-neutral-700">
            Upload a clear photo for AI analysis
          </p>
          <p className="text-xs text-neutral-500">JPG, PNG, WebP • Max 10MB</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Select Photo
          </Button>
        </div>

        {file && (
          <div className="text-sm text-neutral-600">
            Selected: <span className="font-medium text-neutral-900">{file.name}</span>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => uploadMutation.mutate()}
          loading={uploadMutation.isPending}
          disabled={!file}
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload Scan
        </Button>
      </CardContent>
    </Card>
  );
}
