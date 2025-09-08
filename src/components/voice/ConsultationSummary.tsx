'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ConversationSummary } from '@/lib/vapi';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Phone, 
  Edit3,
  Save,
  X
} from 'lucide-react';

interface ConsultationSummaryProps {
  summary: ConversationSummary;
  onClose: () => void;
  onSave?: (editedSummary: ConversationSummary) => void;
}

export default function ConsultationSummary({ summary, onClose, onSave }: ConsultationSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary.summary);
  const [editedSymptoms, setEditedSymptoms] = useState(summary.symptoms);
  const [editedDiagnosis, setEditedDiagnosis] = useState(summary.diagnosis);
  const [editedFollowUp, setEditedFollowUp] = useState(summary.followUpContacts);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (onSave) {
      const updated: ConversationSummary = {
        ...summary,
        summary: editedSummary,
        symptoms: editedSymptoms,
        diagnosis: editedDiagnosis,
        followUpContacts: editedFollowUp,
      };
      onSave(updated);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSummary(summary.summary);
    setEditedSymptoms(summary.symptoms);
    setEditedDiagnosis(summary.diagnosis);
    setEditedFollowUp(summary.followUpContacts);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Consultation Complete
              </CardTitle>
              <CardDescription>
                Your consultation has been saved to your medical history
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(summary.duration)}
              </Badge>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Consultation Summary
            </h3>
            {isEditing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={3}
                className="w-full"
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {summary.summary}
              </p>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Symptoms Discussed</h3>
            {isEditing ? (
              <Textarea
                value={editedSymptoms}
                onChange={(e) => setEditedSymptoms(e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Symptoms mentioned during consultation..."
              />
            ) : (
              <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                {summary.symptoms || 'No specific symptoms mentioned'}
              </p>
            )}
          </div>

          {/* Assessment */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">AI Assessment</h3>
            {isEditing ? (
              <Textarea
                value={editedDiagnosis}
                onChange={(e) => setEditedDiagnosis(e.target.value)}
                rows={2}
                className="w-full"
                placeholder="AI nurse assessment and recommendations..."
              />
            ) : (
              <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                {summary.diagnosis}
              </p>
            )}
          </div>

          {/* Follow-up */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Follow-up Recommendations
            </h3>
            {isEditing ? (
              <Textarea
                value={editedFollowUp}
                onChange={(e) => setEditedFollowUp(e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Healthcare provider contacts and next steps..."
              />
            ) : (
              <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">
                {summary.followUpContacts}
              </p>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            </div>
          )}

          {/* Medical Disclaimer */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Medical Disclaimer:</strong> {summary.disclaimer}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Full Conversation Transcript</CardTitle>
          <CardDescription>
            Complete record of your consultation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {summary.transcript}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button onClick={onClose} size="lg">
          Return to Dashboard
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => window.print()}
        >
          Print Summary
        </Button>
      </div>
    </div>
  );
}
