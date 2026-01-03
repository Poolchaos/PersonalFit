import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, TrendingUp, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { PageTransition } from '../components/layout/PageTransition';
import { metricsAPI, photosAPI, queryKeys } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Input } from '../design-system/components/Input';
import { MetricCardSkeleton } from '../design-system';
import WeightChart from '../components/charts/WeightChart';
import { getProgressImage } from '../utils/imageHelpers';
import type { BodyMetrics } from '../types';

interface MetricsResponse {
  metrics: BodyMetrics[];
}

export default function MetricsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<'front' | 'side' | 'back'>('front');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.metrics.history(),
    queryFn: metricsAPI.getAll,
  });

  const createMetricsMutation = useMutation({
    mutationFn: metricsAPI.create,
    // Optimistic update for metrics
    onMutate: async (newMetrics) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.metrics.history() });
      const previousData = queryClient.getQueryData<MetricsResponse>(queryKeys.metrics.history());

      const optimisticMetric: BodyMetrics = {
        _id: `temp-${Date.now()}`,
        user_id: '',
        measurement_date: newMetrics.measurement_date || new Date().toISOString(),
        weight_kg: newMetrics.weight_kg || 0,
        body_fat_percentage: newMetrics.body_fat_percentage || 0,
        notes: newMetrics.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MetricsResponse>(queryKeys.metrics.history(), (old) => ({
        metrics: [optimisticMetric, ...(old?.metrics || [])],
      }));

      setShowForm(false);
      toast.success('📊 Metrics recorded!');
      return { previousData };
    },
    onError: (_err, _newMetrics, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.metrics.history(), context.previousData);
      }
      toast.error('Failed to save metrics');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.history() });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ file, type, date }: { file: File; type: 'front' | 'side' | 'back'; date: string }) =>
      photosAPI.upload(file, type, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.history() });
      toast.success('📸 Photo uploaded successfully!');
      setPhotoFile(null);
    },
    onError: () => {
      toast.error('Failed to upload photo. Please try again.');
    },
  });

  const handleMetricsSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMetricsMutation.mutate({
      measurement_date: formData.get('measurement_date') as string,
      weight_kg: Number(formData.get('weight_kg')),
      body_fat_percentage: Number(formData.get('body_fat_percentage')),
      notes: formData.get('notes') as string,
    });
  };

  const handlePhotoUpload = () => {
    if (photoFile) {
      uploadPhotoMutation.mutate({
        file: photoFile,
        type: photoType,
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Body Metrics & Progress</h1>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="primary"
            data-testid="add-metrics-button"
          >
            {showForm ? 'Cancel' : '+ Add Metrics'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Add New Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMetricsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Date" name="measurement_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  <Input label="Weight (kg)" name="weight_kg" type="number" step="0.1" />
                  <Input label="Body Fat (%)" name="body_fat_percentage" type="number" step="0.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" rows={3} />
                </div>
                <Button type="submit" variant="primary" loading={createMetricsMutation.isPending}>
                  Save Metrics
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Upload Progress Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo Type</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value as 'front' | 'side' | 'back')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button
                onClick={handlePhotoUpload}
                disabled={!photoFile}
                loading={uploadPhotoMutation.isPending}
                variant="primary"
              >
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weight Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <MetricCardSkeleton />
              </div>
            ) : (
              <WeightChart metrics={data?.metrics || []} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            data?.metrics.map((metric: BodyMetrics) => (
            <Card key={metric._id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{new Date(metric.measurement_date).toLocaleDateString()}</h3>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {metric.weight_kg && (
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-gray-500">Weight</p>
                            <p className="font-semibold text-gray-900">{metric.weight_kg} kg</p>
                          </div>
                        </div>
                      )}
                      {metric.body_fat_percentage && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-accent" />
                          <div>
                            <p className="text-gray-500">Body Fat</p>
                            <p className="font-semibold text-gray-900">{metric.body_fat_percentage}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {metric.notes && <p className="mt-3 text-sm text-gray-600">{metric.notes}</p>}
                  </div>
                  {(metric.progress_photos?.front_url || metric.progress_photos?.side_url || metric.progress_photos?.back_url) && (
                    <div className="flex gap-2 ml-4">
                      {metric.progress_photos.front_url && (
                        <img src={metric.progress_photos.front_url} alt="Front" className="w-20 h-20 object-cover rounded-md border-2 border-neutral-200" />
                      )}
                      {metric.progress_photos.side_url && (
                        <img src={metric.progress_photos.side_url} alt="Side" className="w-20 h-20 object-cover rounded-md border-2 border-neutral-200" />
                      )}
                      {metric.progress_photos.back_url && (
                        <img src={metric.progress_photos.back_url} alt="Back" className="w-20 h-20 object-cover rounded-md border-2 border-neutral-200" />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))) || (
            <Card>
              <CardContent className="pt-6">
                {/* Empty State with Image */}
                <div className="text-center">
                  <div className="mb-6 rounded-lg overflow-hidden max-w-md mx-auto">
                    <img
                      src={getProgressImage('body-metrics')}
                      alt="Track your progress"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <Scale className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-1">No metrics recorded yet</p>
                  <p className="text-sm text-gray-400">Click "Add Metrics" to start tracking your progress</p>
                </div>
              </CardContent>
            </Card>
          )
          }
        </div>
        </div>
      </PageTransition>
    </Layout>
  );
}
