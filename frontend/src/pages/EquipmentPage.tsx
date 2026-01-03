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
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { equipmentAPI, queryKeys } from '../api';
import type { Equipment } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../design-system';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition';
import { getEquipmentImage } from '../utils/imageHelpers';

interface EquipmentResponse {
  equipment: Equipment[];
}

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.equipment.list(),
    queryFn: equipmentAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: equipmentAPI.create,
    // Optimistic update for instant feedback
    onMutate: async (newEquipment) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.equipment.list() });
      const previousData = queryClient.getQueryData<EquipmentResponse>(queryKeys.equipment.list());

      // Create optimistic equipment entry
      const optimisticEquipment: Equipment = {
        _id: `temp-${Date.now()}`,
        user_id: '',
        equipment_name: newEquipment.equipment_name || '',
        equipment_type: newEquipment.equipment_type || 'other',
        quantity: newEquipment.quantity || 1,
        condition: newEquipment.condition || 'good',
        notes: newEquipment.notes || '',
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<EquipmentResponse>(queryKeys.equipment.list(), (old) => ({
        equipment: [...(old?.equipment || []), optimisticEquipment],
      }));

      setShowForm(false);
      return { previousData };
    },
    onError: (_err, _newEquipment, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.equipment.list(), context.previousData);
      }
      toast.error('Failed to add equipment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentAPI.delete,
    // Optimistic delete
    onMutate: async (equipmentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.equipment.list() });
      const previousData = queryClient.getQueryData<EquipmentResponse>(queryKeys.equipment.list());

      queryClient.setQueryData<EquipmentResponse>(queryKeys.equipment.list(), (old) => ({
        equipment: (old?.equipment || []).filter((item) => item._id !== equipmentId),
      }));

      return { previousData };
    },
    onError: (_err, _equipmentId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.equipment.list(), context.previousData);
      }
      toast.error('Failed to delete equipment');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.list() });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const equipment: Partial<Equipment> = {
      equipment_name: formData.get('equipment_name') as string,
      equipment_type: formData.get('equipment_type') as Equipment['equipment_type'],
      quantity: Number(formData.get('quantity')),
      condition: formData.get('condition') as Equipment['condition'],
      notes: formData.get('notes') as string,
    };
    createMutation.mutate(equipment);
  };

  return (
    <Layout>
      <PageTransition>
        <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-neutral-900">Equipment Inventory</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'}>
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Equipment'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Equipment Name</label>
                    <input name="equipment_name" required className="input-field" placeholder="e.g. Adjustable Dumbbells" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select name="equipment_type" required className="input-field">
                      <option value="free_weights">Free Weights</option>
                      <option value="machines">Machines</option>
                      <option value="cardio">Cardio</option>
                      <option value="bodyweight">Bodyweight</option>
                      <option value="resistance_bands">Resistance Bands</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input name="quantity" type="number" required className="input-field" defaultValue={1} />
                  </div>
                  <div>
                    <label className="label">Condition</label>
                    <select name="condition" required className="input-field">
                      <option value="new">New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea name="notes" className="input-field" rows={3} />
                </div>
                <Button type="submit" loading={createMutation.isPending} className="w-full">
                  Add Equipment
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.equipment && data.equipment.length > 0 ? (
            data.equipment.map((item) => (
              <Card key={item._id} hover>
                {/* Equipment Image */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={getEquipmentImage(item.equipment_name)}
                    alt={item.equipment_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => deleteMutation.mutate(item._id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-error-DEFAULT hover:text-error-dark hover:bg-white transition-all shadow-sm"
                      disabled={deleteMutation.isPending}
                      title="Delete equipment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Equipment Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">{item.equipment_name}</h3>
                  <div className="space-y-2 text-sm text-neutral-600">
                    <p><span className="font-medium text-neutral-700">Type:</span> {item.equipment_type.replace('_', ' ')}</p>
                    <p><span className="font-medium text-neutral-700">Quantity:</span> {item.quantity}</p>
                    <p><span className="font-medium text-neutral-700">Condition:</span> <span className={`capitalize ${item.condition === 'new' ? 'text-success-DEFAULT' : item.condition === 'good' ? 'text-primary-500' : 'text-warning-DEFAULT'}`}>{item.condition}</span></p>
                    {item.notes && <p className="text-xs mt-3 pt-3 border-t border-neutral-200">{item.notes}</p>}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Dumbbell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No equipment added yet. Click "Add Equipment" to get started.</p>
            </div>
          )}
        </div>
      </div>
      </PageTransition>
    </Layout>
  );
}
