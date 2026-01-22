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

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { medicationAPI, medicationQueryKeys } from '../api';
import type { Medication, TodaysMedication, CreateMedicationInput } from '../types';
import { Card, CardContent, Button } from '../design-system';
import {
  Pill,
  Plus,
  X,
  Clock,
  AlertTriangle,
  Package,
  ChevronRight,
  Trash2,
  Edit,
} from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import MedicationForm from '../components/medications/MedicationForm';
import MedicationDoseCard from '../components/medications/MedicationDoseCard';

export default function MedicationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'refills'>('today');

  // Fetch today's doses
  const { data: todaysData, isLoading: loadingToday } = useQuery({
    queryKey: medicationQueryKeys.today(),
    queryFn: medicationAPI.getTodaysDoses,
  });

  // Fetch all medications
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: medicationQueryKeys.list(true),
    queryFn: () => medicationAPI.getAll(true),
  });

  // Fetch medications needing refill
  const { data: refillData } = useQuery({
    queryKey: medicationQueryKeys.refills(),
    queryFn: medicationAPI.getNeedingRefill,
  });

  // Create medication mutation
  const createMutation = useMutation({
    mutationFn: medicationAPI.create,
    onSuccess: () => {
      toast.success('Medication added successfully');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all });
    },
    onError: () => {
      toast.error('Failed to add medication');
    },
  });

  // Update medication mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMedicationInput> }) =>
      medicationAPI.update(id, data),
    onSuccess: () => {
      toast.success('Medication updated');
      setEditingMedication(null);
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all });
    },
    onError: () => {
      toast.error('Failed to update medication');
    },
  });

  // Delete medication mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => medicationAPI.delete(id),
    onSuccess: () => {
      toast.success('Medication removed');
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all });
    },
    onError: () => {
      toast.error('Failed to remove medication');
    },
  });

  // Log dose mutation
  const logDoseMutation = useMutation({
    mutationFn: ({
      medicationId,
      scheduledTime,
      status,
    }: {
      medicationId: string;
      scheduledTime: string;
      status: 'taken' | 'skipped';
    }) =>
      medicationAPI.logDose(medicationId, {
        scheduled_time: scheduledTime,
        status,
      }),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'taken' ? 'Dose logged!' : 'Dose skipped');
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.today() });
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.list() });
    },
    onError: () => {
      toast.error('Failed to log dose');
    },
  });

  // Refill mutation
  const refillMutation = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) =>
      medicationAPI.refill(id, count),
    onSuccess: () => {
      toast.success('Medication refilled');
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all });
    },
    onError: () => {
      toast.error('Failed to refill medication');
    },
  });

  const handleCreateMedication = (data: CreateMedicationInput) => {
    createMutation.mutate(data);
  };

  const handleUpdateMedication = (data: CreateMedicationInput) => {
    if (editingMedication) {
      updateMutation.mutate({ id: editingMedication._id, data });
    }
  };

  const handleLogDose = (
    medicationId: string,
    scheduledTime: string,
    status: 'taken' | 'skipped'
  ) => {
    logDoseMutation.mutate({ medicationId, scheduledTime, status });
  };

  const handleRefill = (id: string) => {
    const count = window.prompt('How many did you refill?');
    if (count && !isNaN(Number(count)) && Number(count) > 0) {
      refillMutation.mutate({ id, count: Number(count) });
    }
  };

  const todaysMedications = todaysData?.todaysDoses || [];
  const allMedications = allData?.medications || [];
  const refillMedications = refillData?.medications || [];

  // Count pending doses
  const pendingCount = todaysMedications.reduce((acc, med) => {
    return acc + med.doses.filter((d) => d.status === 'pending').length;
  }, 0);

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-7 h-7 text-blue-600" />
                Medications & Supplements
              </h1>
              <p className="text-gray-600 mt-1">
                Track your medications, supplements, and adherence
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Medication
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{allMedications.length}</div>
                <div className="text-sm text-blue-600">Active Medications</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{pendingCount}</div>
                <div className="text-sm text-green-600">Doses Pending Today</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-700">{refillMedications.length}</div>
                <div className="text-sm text-orange-600">Need Refill</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { key: 'today', label: "Today's Doses", icon: Clock },
              { key: 'all', label: 'All Medications', icon: Pill },
              { key: 'refills', label: 'Refills Needed', icon: Package },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'today' && (
              <>
                {loadingToday ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : todaysMedications.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No medications scheduled for today</p>
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(true)}
                        className="mt-4"
                      >
                        Add Your First Medication
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  todaysMedications.map((med: TodaysMedication) => (
                    <MedicationDoseCard
                      key={med.medication._id}
                      medication={med.medication}
                      doses={med.doses}
                      onLogDose={handleLogDose}
                      isPending={logDoseMutation.isPending}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'all' && (
              <>
                {loadingAll ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : allMedications.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No medications added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {allMedications.map((med: Medication) => (
                      <Card key={med._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-full ${
                                  med.type === 'prescription'
                                    ? 'bg-purple-100 text-purple-600'
                                    : med.type === 'supplement'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                <Pill className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{med.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {med.dosage.amount} {med.dosage.unit} • {med.frequency.times_per_day}x daily
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {med.inventory.current_count <= med.inventory.refill_threshold && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Low: {med.inventory.current_count}
                                </span>
                              )}
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  med.type === 'prescription'
                                    ? 'bg-purple-100 text-purple-700'
                                    : med.type === 'supplement'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {med.type}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMedication(med)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to remove this medication?')) {
                                    deleteMutation.mutate(med._id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'refills' && (
              <>
                {refillMedications.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">All medications are stocked up!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {refillMedications.map((med: Medication) => (
                      <Card key={med._id} className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{med.name}</h3>
                                <p className="text-sm text-orange-700">
                                  Only {med.inventory.current_count} remaining (refill at{' '}
                                  {med.inventory.refill_threshold})
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleRefill(med._id)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Refill
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Add/Edit Medication Modal */}
          {(showForm || editingMedication) && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">
                      {editingMedication ? 'Edit Medication' : 'Add Medication'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingMedication(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <MedicationForm
                    initialData={editingMedication || undefined}
                    onSubmit={editingMedication ? handleUpdateMedication : handleCreateMedication}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingMedication(null);
                    }}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
