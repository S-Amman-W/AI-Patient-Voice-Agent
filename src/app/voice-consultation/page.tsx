'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VoiceChatInterface from '@/components/voice/VoiceChatInterface';
import { PatientProfile, MedicalCondition, PastConsultation } from '@/db/schema';
import { ConversationSummary } from '@/lib/vapi';
import { ArrowLeft, MessageSquare, Clock, FileText, AlertTriangle } from 'lucide-react';

export default function VoiceConsultationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [pastConsultations, setPastConsultations] = useState<PastConsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showSetupWarning, setShowSetupWarning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchPatientData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      
      // Fetch profile
      const profileResponse = await fetch('/api/patient/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.profile);
      }

      // Fetch conditions
      const conditionsResponse = await fetch('/api/patient/conditions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (conditionsResponse.ok) {
        const conditionsData = await conditionsResponse.json();
        setConditions(conditionsData.conditions);
      }

      // Fetch past consultations
      const consultationsResponse = await fetch('/api/patient/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json();
        setPastConsultations(consultationsData.consultations);
      }
    } catch {
      setError('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const handleConsultationEnd = (summary: ConversationSummary) => {
    // Update only the consultations list without full refresh
    setPastConsultations(prev => [...prev, {
      id: Date.now().toString(),
      userId: user!.id,
      summary: summary.summary,
      symptoms: summary.symptoms,
      diagnosis: summary.diagnosis,
      followUpContacts: summary.followUpContacts,
      disclaimer: summary.disclaimer,
      duration: summary.duration,
      transcript: summary.transcript,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    
    // Show success message
    console.log('Consultation completed:', summary);
  };

  const checkVapiSetup = () => {
    const hasVapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!hasVapiKey) {
      setShowSetupWarning(true);
    }
  };

  useEffect(() => {
    checkVapiSetup();
  }, []);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading voice consultation...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voice Consultation</h1>
              <p className="text-gray-600">Speak with your AI nurse assistant</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showSetupWarning && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Voice consultation requires VAPI configuration. Please add your VAPI_PUBLIC_KEY to the environment variables.
            </AlertDescription>
          </Alert>
        )}

        {/* Patient Context Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile ? 'Complete' : 'Incomplete'}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile ? 'Patient information available' : 'No profile data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Conditions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conditions.length}</div>
              <p className="text-xs text-muted-foreground">
                Active conditions in history
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Consultations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastConsultations.length}</div>
              <p className="text-xs text-muted-foreground">
                Previous AI consultations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Important Disclaimer */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important Medical Disclaimer:</strong> This AI nurse assistant provides general health guidance and support only. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare 
            professionals for proper medical care. In case of emergency, call 911 immediately.
          </AlertDescription>
        </Alert>

        {/* Voice Chat Interface */}
        <VoiceChatInterface
          profile={profile}
          conditions={conditions}
          pastConsultations={pastConsultations}
          onConsultationEnd={handleConsultationEnd}
        />

        {/* Recent Consultations */}
        {pastConsultations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Consultations
              </CardTitle>
              <CardDescription>
                Your past AI nurse consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastConsultations.slice(-3).map((consultation) => (
                  <div key={consultation.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{consultation.summary}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {consultation.symptoms && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Symptoms:</strong> {consultation.symptoms}
                      </p>
                    )}
                    {consultation.followUpContacts && (
                      <p className="text-xs text-blue-600">
                        <strong>Follow-up:</strong> {consultation.followUpContacts}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {pastConsultations.length > 3 && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/consultation-history')}
                  >
                    View All Consultations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
