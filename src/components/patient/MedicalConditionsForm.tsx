'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MedicalCondition } from '@/db/schema';
import { z } from 'zod';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Create a form-specific schema that matches our form requirements
const medicalConditionFormSchema = z.object({
  conditionName: z.string().min(1, 'Condition name is required').max(255),
  conditionCode: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  status: z.enum(['active', 'inactive', 'resolved']).optional(),
  onsetDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
  diagnosisDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
  resolutionDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format'),
  description: z.string().optional(),
  notes: z.string().optional(),
  diagnosedBy: z.string().optional(),
});

type MedicalConditionInput = z.infer<typeof medicalConditionFormSchema>;

interface MedicalConditionsFormProps {
  conditions: MedicalCondition[];
  onConditionAdded?: () => void;
  onConditionUpdated?: () => void;
  onConditionDeleted?: () => void;
}

export default function MedicalConditionsForm({ 
  conditions, 
  onConditionAdded, 
  onConditionUpdated, 
  onConditionDeleted 
}: MedicalConditionsFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const form = useForm<MedicalConditionInput>({
    resolver: zodResolver(medicalConditionFormSchema),
    defaultValues: {
      conditionName: '',
      conditionCode: '',
      severity: undefined,
      status: 'active',
      onsetDate: '',
      diagnosisDate: '',
      resolutionDate: '',
      description: '',
      notes: '',
      diagnosedBy: '',
    },
  });

  const resetForm = () => {
    form.reset({
      conditionName: '',
      conditionCode: '',
      severity: undefined,
      status: 'active',
      onsetDate: '',
      diagnosisDate: '',
      resolutionDate: '',
      description: '',
      notes: '',
      diagnosedBy: '',
    });
    setEditingCondition(null);
    setError('');
  };

  const openDialog = (condition?: MedicalCondition) => {
    if (condition) {
      setEditingCondition(condition);
      form.reset({
        conditionName: condition.conditionName,
        conditionCode: condition.conditionCode || '',
        severity: condition.severity as 'mild' | 'moderate' | 'severe' | undefined,
        status: condition.status as 'active' | 'inactive' | 'resolved' | undefined,
        onsetDate: condition.onsetDate || '',
        diagnosisDate: condition.diagnosisDate || '',
        resolutionDate: condition.resolutionDate || '',
        description: condition.description || '',
        notes: condition.notes || '',
        diagnosedBy: condition.diagnosedBy || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const onSubmit = async (data: MedicalConditionInput) => {
    setIsLoading(true);
    setError('');

    try {
      // Clean up empty strings to undefined to match schema expectations
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? undefined : value])
      );

      console.log('Submitting medical condition data:', cleanedData);

      const url = editingCondition 
        ? `/api/patient/conditions/${editingCondition.id}`
        : '/api/patient/conditions';
      
      const method = editingCondition ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();
      console.log('Medical condition submission response:', result);

      if (response.ok) {
        closeDialog();
        if (editingCondition) {
          onConditionUpdated?.();
        } else {
          onConditionAdded?.();
        }
      } else {
        console.error('Medical condition submission failed:', result);
        setError(result.error || 'Failed to save condition');
        if (result.details) {
          console.error('Validation details:', result.details);
        }
      }
    } catch (err) {
      console.error('Network error during condition submission:', err);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCondition = async (conditionId: string) => {
    if (!confirm('Are you sure you want to delete this condition?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/conditions/${conditionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (response.ok) {
        onConditionDeleted?.();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete condition');
      }
    } catch {
      setError('Network error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Medical Conditions</h3>
          <p className="text-sm text-gray-600">Manage your current and past medical conditions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCondition ? 'Edit Medical Condition' : 'Add Medical Condition'}
              </DialogTitle>
              <DialogDescription>
                Enter details about the medical condition including dates and severity.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conditionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Hypertension, Diabetes"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conditionCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ICD-10 or SNOMED code"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger disabled={isLoading}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="onsetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onset Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diagnosisDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resolutionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diagnosedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosed By</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Healthcare provider name"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the condition"
                          {...field}
                          disabled={isLoading}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes or observations"
                          {...field}
                          disabled={isLoading}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingCondition ? 'Update' : 'Add Condition'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {conditions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No medical conditions recorded yet</p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Condition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conditions.map((condition) => (
            <Card key={condition.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{condition.conditionName}</CardTitle>
                    {condition.conditionCode && (
                      <p className="text-sm text-gray-500">Code: {condition.conditionCode}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(condition)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCondition(condition.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(condition.status || 'active')}`}>
                    {condition.status || 'Active'}
                  </span>
                  {condition.severity && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(condition.severity)}`}>
                      {condition.severity}
                    </span>
                  )}
                </div>
                
                {condition.description && (
                  <p className="text-sm text-gray-700 mb-2">{condition.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                  {condition.onsetDate && (
                    <div>Onset: {new Date(condition.onsetDate).toLocaleDateString()}</div>
                  )}
                  {condition.diagnosisDate && (
                    <div>Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}</div>
                  )}
                  {condition.diagnosedBy && (
                    <div>By: {condition.diagnosedBy}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
