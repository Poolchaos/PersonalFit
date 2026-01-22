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

import { useForm } from 'react-hook-form';
import { forwardRef, useImperativeHandle } from 'react';
import BottleImageUpload, { type OCRResult } from './BottleImageUpload';
import type { Medication, CreateMedicationInput } from '../../types';

export interface MedicationFormHandle {
  submitForm: () => void;
}

interface MedicationFormProps {
  initialData?: Medication;
  onSubmit: (data: CreateMedicationInput) => void;
  isLoading: boolean;
}

const DOSAGE_UNITS = ['mg', 'ml', 'iu', 'mcg', 'g', 'tablets', 'capsules'] as const;
const DOSAGE_FORMS = ['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'other'] as const;
const MED_TYPES = ['prescription', 'supplement', 'otc'] as const;
const AFFECTS_METRICS = [
  'heart_rate',
  'blood_pressure',
  'sleep_quality',
  'energy_level',
  'strength',
  'endurance',
  'recovery',
  'weight',
  'mood',
] as const;

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const MedicationForm = forwardRef<MedicationFormHandle, MedicationFormProps>(
  ({ initialData, onSubmit, isLoading }, ref) => {
    "use no memo"; // Disable React Compiler due to react-hook-form watch() incompatibility

    const {
      register,
      handleSubmit,
      setValue,
      formState: { errors },
      watch,
  } = useForm<CreateMedicationInput>({
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          dosage: initialData.dosage,
          frequency: {
            ...initialData.frequency,
            days_of_week: initialData.frequency.days_of_week || [0, 1, 2, 3, 4, 5, 6],
          },
          inventory: {
            current_count: initialData.inventory.current_count,
            refill_threshold: initialData.inventory.refill_threshold,
          },
          health_tags: initialData.health_tags,
          warnings: initialData.warnings,
          affects_metrics: initialData.affects_metrics,
        }
      : {
          type: 'supplement',
          dosage: { amount: 1, unit: 'mg', form: 'tablet' },
          frequency: { times_per_day: 1, days_of_week: [0, 1, 2, 3, 4, 5, 6] },
          inventory: { current_count: 0, refill_threshold: 7 },
        },
  });

  const selectedDays = watch('frequency.days_of_week') || [];
  const selectedMetrics = watch('affects_metrics') || [];
  const selectedType = watch('type');

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(onSubmit)();
    },
  }));

  const handleOCRExtracted = (result: OCRResult) => {
    // Auto-fill form with extracted data
    setValue('name', result.medication_name);
    setValue('dosage.amount', result.dosage.amount);
    setValue('dosage.unit', result.dosage.unit);
    setValue('dosage.form', result.dosage.form);
    setValue('frequency.times_per_day', result.frequency.times_per_day);
    if (result.frequency.notes) {
      setValue('frequency.notes', result.frequency.notes);
    }
    setValue('warnings', result.warnings);
    setValue('health_tags', result.health_tags);
  };

  const handleOCRError = (error: string) => {
    console.error('OCR Error:', error);
    // Show error but allow manual entry
  };

  const toggleDay = (day: number) => {
    const current = selectedDays;
    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setValue('frequency.days_of_week', newDays);
  };

  const toggleMetric = (metric: string) => {
    const current = selectedMetrics;
    const newMetrics = current.includes(metric)
      ? current.filter((m) => m !== metric)
      : [...current, metric];
    setValue('affects_metrics', newMetrics);
  };

  const onFormSubmit = (data: CreateMedicationInput) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Bottle Image Upload with OCR */}
      <BottleImageUpload
        onExtracted={handleOCRExtracted}
        onError={handleOCRError}
        isLoading={isLoading}
      />

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medication Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Vitamin D3, Metformin, Creatine"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {MED_TYPES.map((type) => (
              <label
                key={type}
                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedType === type
                    ? type === 'prescription'
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : type === 'supplement'
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  value={type}
                  {...register('type')}
                  className="sr-only"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Dosage */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Dosage</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              {...register('dosage.amount', {
                required: 'Amount is required',
                min: { value: 0.001, message: 'Must be greater than 0' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select
              {...register('dosage.unit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {DOSAGE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form *</label>
            <select
              {...register('dosage.form')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {DOSAGE_FORMS.map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Schedule</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Times Per Day *
          </label>
          <input
            type="number"
            min="1"
            max="24"
            {...register('frequency.times_per_day', {
              required: true,
              min: 1,
              max: 24,
            })}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full font-medium transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="with_food"
            {...register('frequency.with_food')}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="with_food" className="text-sm text-gray-700">
            Take with food
          </label>
        </div>
      </div>

      {/* Inventory */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Inventory</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Count
            </label>
            <input
              type="number"
              min="0"
              {...register('inventory.current_count')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refill Reminder At
            </label>
            <input
              type="number"
              min="0"
              {...register('inventory.refill_threshold')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Health Context */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 border-b pb-2">Health Context (Optional)</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Affects Metrics
          </label>
          <div className="flex flex-wrap gap-2">
            {AFFECTS_METRICS.map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => toggleMetric(metric)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedMetrics.includes(metric)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {metric.replace('_', ' ')}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select which fitness metrics this medication may affect
          </p>
        </div>
      </div>

    </form>
  );
});

MedicationForm.displayName = 'MedicationForm';

export default MedicationForm;
