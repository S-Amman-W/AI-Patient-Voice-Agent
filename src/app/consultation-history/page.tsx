'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PastConsultation } from '@/db/schema';
import { ArrowLeft, MessageSquare, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ConsultationHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [consultations, setConsultations] = useState<PastConsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchConsultations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch('/api/patient/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations);
      } else {
        setError('Failed to load consultation history');
      }
    } catch {
      setError('Failed to load consultation history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center space-y-4">
          <h1 className="font-brand text-4xl font-bold">TalkWell</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-3 text-muted-foreground">Loading consultation history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-secondary/10 focus-visible:ring-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="space-y-1">
              <div>
                <h1 className="font-brand text-4xl font-bold">TalkWell</h1>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Consultation History</h2>
              <p className="text-muted-foreground">Your past AI nurse consultations</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Button 
              onClick={() => router.push('/voice-consultation')}
              className="bg-secondary hover:bg-secondary/90 focus-visible:ring-secondary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Consultation
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultations.length}</div>
              <p className="text-xs text-muted-foreground">
                AI nurse interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultations.filter(c => {
                  const consultationDate = new Date(c.createdAt);
                  const now = new Date();
                  return consultationDate.getMonth() === now.getMonth() && 
                         consultationDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Recent consultations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Consultation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultations.length > 0 
                  ? new Date(consultations[consultations.length - 1].createdAt).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Most recent interaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No consultations yet</p>
              <Button onClick={() => router.push('/voice-consultation')}>
                Start Your First Consultation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {consultations.reverse().map((consultation, index) => (
              <Card key={consultation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{consultation.summary}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(consultation.createdAt).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(consultation.createdAt).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      {index < 3 ? "Recent" : "Archive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {consultation.symptoms && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Symptoms Discussed:</h4>
                      <p className="text-sm text-gray-600">{consultation.symptoms}</p>
                    </div>
                  )}

                  {consultation.diagnosis && consultation.diagnosis !== 'General consultation - no diagnosis provided' && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Assessment:</h4>
                      <p className="text-sm text-gray-600">{consultation.diagnosis}</p>
                    </div>
                  )}

                  {consultation.followUpContacts && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Follow-up Recommendations:</h4>
                      <p className="text-sm text-blue-600">{consultation.followUpContacts}</p>
                    </div>
                  )}

                  {consultation.disclaimer && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {consultation.disclaimer}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Medical Disclaimer */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Medical Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 text-sm">
            <p>
              All consultations shown here were conducted with an AI assistant and are for informational purposes only. 
              This information does not constitute professional medical advice, diagnosis, or treatment. Always consult 
              with qualified healthcare professionals for proper medical care. If you have a medical emergency, 
              call 911 immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
