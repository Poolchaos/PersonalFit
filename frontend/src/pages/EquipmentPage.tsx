import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { equipmentAPI } from '../api';
import type { Equipment } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../design-system';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: equipmentAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
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
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-neutral-900">{item.equipment_name}</h3>
                    <button
                      onClick={() => deleteMutation.mutate(item._id)}
                      className="text-error-DEFAULT hover:text-error-dark transition-colors"
                      disabled={deleteMutation.isPending}
                      title="Delete equipment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
    </Layout>
  );
}
