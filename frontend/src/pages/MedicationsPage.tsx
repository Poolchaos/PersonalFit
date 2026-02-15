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

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { medicationAPI, medicationQueryKeys, profileAPI, queryKeys, workoutAPI } from '../api';
import type { Medication, TodaysMedication, CreateMedicationInput } from '../types';
import { Card, CardContent, Button, Modal, ConfirmModal, NumberPromptModal } from '../design-system';
import {
  Pill,
  Plus,
  Clock,
  AlertTriangle,
  Package,
  Trash2,
  Edit,
  X,
  BarChart3,
} from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import MedicationForm, { type MedicationFormHandle } from '../components/medications/MedicationForm';
import MedicationDoseCard from '../components/medications/MedicationDoseCard';
import MedicationParsingModal from '../components/medications/MedicationParsingModal';
import MedicationReminderBanner from '../components/medications/MedicationReminderBanner';
import AdherenceTab from '../components/medications/AdherenceTab';

export default function MedicationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [showParsingModal, setShowParsingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'refills' | 'adherence'>('today');
  const [dismissedOnboardingNote, setDismissedOnboardingNote] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [refillMedicationId, setRefillMedicationId] = useState<string | null>(null);
  const formRef = useRef<MedicationFormHandle>(null);

  // Fetch user profile to check for onboarding medications notes
  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: profileAPI.getProfile,
  });

  const onboardingMedicationsNotes = profileData?.user?.profile?.onboarding_medications_notes;

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

  // Log dose mutation with optimistic updates for instant UI feedback
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
    onMutate: async ({ medicationId, scheduledTime, status }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: medicationQueryKeys.today() });

      // Snapshot previous value
      const previousTodaysData = queryClient.getQueryData<{
        todaysDoses: TodaysMedication[];
      }>(medicationQueryKeys.today());

      // Optimistically update the cache
      if (previousTodaysData) {
        queryClient.setQueryData(medicationQueryKeys.today(), {
          ...previousTodaysData,
          todaysDoses: previousTodaysData.todaysDoses.map((med) =>
            med.medication._id === medicationId
              ? {
                  ...med,
                  doses: med.doses.map((dose) =>
                    dose.scheduled_time === scheduledTime
                      ? { ...dose, status }
                      : dose
                  ),
                }
              : med
          ),
        });
      }

      // Return context for rollback
      return { previousTodaysData };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'taken' ? 'Dose logged!' : 'Dose skipped');
    },
    onError: (_, __, context) => {
      // Rollback to previous value on error
      if (context?.previousTodaysData) {
        queryClient.setQueryData(medicationQueryKeys.today(), context.previousTodaysData);
      }
      toast.error('Failed to log dose');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.today() });
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.list() });
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

  // Regenerate workout plan mutation
  const regeneratePlanMutation = useMutation({
    mutationFn: () => workoutAPI.generate(),
    onSuccess: () => {
      toast.success('Your workout plan has been regenerated with your updated medications!');
      setShowRegenerateConfirm(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      // Navigate to workout plan review page
      setTimeout(() => navigate('/workout-plan-review'), 1000);
    },
    onError: () => {
      toast.error('Failed to regenerate plan. Please try again.');
    },
  });

  // Parse medications mutation
  const parseMedicationsMutation = useMutation({
    mutationFn: (notes: string) => medicationAPI.parseNotes(notes),
  });

  // Batch create medications mutation
  const batchCreateMutation = useMutation({
    mutationFn: async (medications: CreateMedicationInput[]) => {
      // Create all medications in sequence
      for (const med of medications) {
        await medicationAPI.create(med);
      }
      return medications.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully added ${count} medication${count !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all });
      setActiveTab('all'); // Switch to "All" tab to show the new medications
    },
    onError: () => {
      toast.error('Failed to add some medications. Please try again.');
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

  const handleParseMedications = async (notes: string) => {
    const result = await parseMedicationsMutation.mutateAsync(notes);
    return result;
  };

  const handleAddParsedMedications = (medications: CreateMedicationInput[]) => {
    batchCreateMutation.mutate(medications);
  };

  const handleLogDose = (
    medicationId: string,
    scheduledTime: string,
    status: 'taken' | 'skipped'
  ) => {
    logDoseMutation.mutate({ medicationId, scheduledTime, status });
  };

  const handleRefill = (id: string) => {
    setRefillMedicationId(id);
  };

  const handleRefillSubmit = (count: number) => {
    if (refillMedicationId) {
      refillMutation.mutate({ id: refillMedicationId, count });
      setRefillMedicationId(null);
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
          {/* Medication Reminder Banner */}
          <MedicationReminderBanner />

          {/* Onboarding Medications Note Banner */}
          {onboardingMedicationsNotes && !dismissedOnboardingNote && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Medications from Your Setup
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      We found these medications from your onboarding:
                    </p>
                    <div className="bg-white rounded p-2 text-sm text-gray-700 mb-3 border border-blue-100 whitespace-pre-wrap">
                      {onboardingMedicationsNotes}
                    </div>
                    <p className="text-xs text-blue-700 mb-3">
                      You can add detailed information for each medication below, or edit them anytime.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowParsingModal(true)}
                      >
                        Add Details to Medications
                      </Button>
                      <button
                        onClick={() => setDismissedOnboardingNote(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setDismissedOnboardingNote(true)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

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
            <div className="flex gap-2">
              {allMedications.length > 0 && (
                <Button
                  onClick={() => setShowRegenerateConfirm(true)}
                  variant="outline"
                  loading={regeneratePlanMutation.isPending}
                  className="flex items-center gap-2"
                  title="Regenerate your workout plan based on updated medications"
                >
                  Regenerate Plan
                </Button>
              )}
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Medication
              </Button>
            </div>
          </div>

          {/* Regenerate Plan Confirmation Modal */}
          {showRegenerateConfirm && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Regenerate Your Workout Plan?
                    </h3>
                    <p className="text-sm text-amber-800 mb-4">
                      Based on your updated medications, we can regenerate your workout plan to ensure it's optimized for your current health profile. This will replace your current plan.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => regeneratePlanMutation.mutate()}
                        loading={regeneratePlanMutation.isPending}
                      >
                        Yes, Regenerate Plan
                      </Button>
                      <button
                        onClick={() => setShowRegenerateConfirm(false)}
                        className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegenerateConfirm(false)}
                    className="text-amber-400 hover:text-amber-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

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
              { key: 'adherence', label: 'Adherence', icon: BarChart3 },
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
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div
                                className={`p-3 rounded-full flex-shrink-0 ${
                                  med.type === 'prescription'
                                    ? 'bg-purple-100 text-purple-600'
                                    : med.type === 'supplement'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                <Pill className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="font-semibold text-gray-900">{med.name}</h3>
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
                                  {med.inventory.current_count <= med.inventory.refill_threshold && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Low: {med.inventory.current_count}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {med.dosage.amount} {med.dosage.unit} • {med.frequency.times_per_day}x daily
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMedication(med)}
                                className="hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingMedication(med)}
                                className="hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
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

            {activeTab === 'adherence' && (
              <AdherenceTab
                onMedicationClick={(medicationId) => {
                  const medication = allMedications.find((m) => m._id === medicationId);
                  if (medication) {
                    setEditingMedication(medication);
                  }
                }}
              />
            )}
          </div>

          {/* Add/Edit Medication Modal */}
          <Modal
            isOpen={showForm || !!editingMedication}
            onClose={() => {
              setShowForm(false);
              setEditingMedication(null);
            }}
            title={editingMedication ? 'Edit Medication' : 'Add Medication'}
            size="lg"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMedication(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => formRef.current?.submitForm()}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingMedication
                    ? 'Update Medication'
                    : 'Add Medication'}
                </Button>
              </>
            }
          >
            <MedicationForm
              ref={formRef}
              initialData={editingMedication || undefined}
              onSubmit={editingMedication ? handleUpdateMedication : handleCreateMedication}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </Modal>

          <ConfirmModal
            isOpen={!!deletingMedication}
            onClose={() => setDeletingMedication(null)}
            onConfirm={() => {
              if (deletingMedication) {
                deleteMutation.mutate(deletingMedication._id);
                setDeletingMedication(null);
              }
            }}
            title="Remove Medication"
            message={`Are you sure you want to remove ${deletingMedication?.name}? This action cannot be undone.`}
            confirmText="Remove"
            variant="danger"
            loading={deleteMutation.isPending}
          />

          {/* Refill Count Modal */}
          <NumberPromptModal
            isOpen={!!refillMedicationId}
            onClose={() => setRefillMedicationId(null)}
            onSubmit={handleRefillSubmit}
            title="Refill Medication"
            message="How many pills/doses did you refill?"
            placeholder="Enter quantity"
            min={1}
            max={9999}
            submitText="Add Refill"
            loading={refillMutation.isPending}
          />

          {/* AI Medication Parsing Modal */}
          {onboardingMedicationsNotes && (
            <MedicationParsingModal
              isOpen={showParsingModal}
              onClose={() => setShowParsingModal(false)}
              notes={onboardingMedicationsNotes}
              onParse={handleParseMedications}
              onAddMedications={handleAddParsedMedications}
              isParsing={parseMedicationsMutation.isPending || batchCreateMutation.isPending}
            />
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}
