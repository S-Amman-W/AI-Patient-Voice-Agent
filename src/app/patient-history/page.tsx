'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PatientProfileForm from '@/components/patient/PatientProfileForm';
import MedicalConditionsForm from '@/components/patient/MedicalConditionsForm';
import { PatientProfile, MedicalCondition } from '@/db/schema';
import { ArrowLeft, User, FileText, Heart, Pill, AlertTriangle, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function PatientHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
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
    } catch {
      setError('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const refreshData = () => {
    fetchData();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center space-y-4">
          <h1 className="font-brand text-4xl font-bold">TalkWell</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-3 text-muted-foreground">Loading patient history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.dateOfBirth,
      profile.gender,
      profile.phoneNumber,
      profile.streetAddress,
      profile.city,
      profile.state,
      profile.zipCode,
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const activeConditions = conditions.filter(c => c.status === 'active').length;
  const resolvedConditions = conditions.filter(c => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="max-w-7xl mx-auto p-6">
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
              <h2 className="text-xl font-semibold text-foreground">Patient History</h2>
              <p className="text-muted-foreground">Manage your medical information and history</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getProfileCompleteness()}%</div>
              <p className="text-xs text-muted-foreground">
                {profile ? 'Complete' : 'Not created'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Conditions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConditions}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedConditions}</div>
              <p className="text-xs text-muted-foreground">
                Past conditions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conditions.length}</div>
              <p className="text-xs text-muted-foreground">
                Medical records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="family">Family History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <PatientProfileForm
              initialData={profile ? {
                ...profile,
                dateOfBirth: profile.dateOfBirth || '',
                gender: profile.gender as 'male' | 'female' | 'other' | 'unknown' | undefined,
                phoneNumber: profile.phoneNumber || '',
                alternatePhone: profile.alternatePhone || '',
                streetAddress: profile.streetAddress || '',
                city: profile.city || '',
                state: profile.state || '',
                zipCode: profile.zipCode || '',
                country: profile.country || 'United States',
                emergencyContactName: profile.emergencyContactName || '',
                emergencyContactPhone: profile.emergencyContactPhone || '',
                emergencyContactRelationship: profile.emergencyContactRelationship || '',
                insuranceProvider: profile.insuranceProvider || '',
                insurancePolicyNumber: profile.insurancePolicyNumber || '',
                insuranceGroupNumber: profile.insuranceGroupNumber || '',
                medicalRecordNumber: profile.medicalRecordNumber || '',
                preferredLanguage: profile.preferredLanguage || 'English',
                communicationPreference: (profile.communicationPreference as 'email' | 'phone' | 'sms') || 'email',
              } : undefined}
              onSuccess={refreshData}
            />
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <MedicalConditionsForm
              conditions={conditions}
              onConditionAdded={refreshData}
              onConditionUpdated={refreshData}
              onConditionDeleted={refreshData}
            />
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Current Medications
                </CardTitle>
                <CardDescription>
                  Manage your current and past medications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Pill className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Medications management coming soon</p>
                  <p className="text-sm text-gray-400">
                    This feature will allow you to track your current medications, dosages, and schedules.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Allergies & Reactions
                </CardTitle>
                <CardDescription>
                  Track your known allergies and adverse reactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Allergies tracking coming soon</p>
                  <p className="text-sm text-gray-400">
                    This feature will help you maintain a record of allergies and adverse reactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Family Medical History
                </CardTitle>
                <CardDescription>
                  Record your family&apos;s medical history for better care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Family history tracking coming soon</p>
                  <p className="text-sm text-gray-400">
                    This feature will allow you to record your family&apos;s medical history.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
