'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MessageCircle, History, User, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center space-y-4">
          <h1 className="font-brand text-4xl font-bold">TalkWell</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-3 text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div>
              <h1 className="font-brand text-4xl font-bold">TalkWell</h1>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome back, {user.firstName}!
            </h2>
            <p className="text-muted-foreground">
              Your compassionate AI health companion dashboard
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="hover:bg-secondary/10 focus-visible:ring-secondary"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-secondary/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-secondary" />
                <CardTitle>Patient History</CardTitle>
              </div>
              <CardDescription>
                Manage your medical history and conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 focus-visible:ring-secondary"
                onClick={() => router.push('/patient-history')}
              >
                Manage History
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-secondary/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-secondary" />
                <CardTitle>Voice AI Consultation</CardTitle>
              </div>
              <CardDescription>
                Start a conversation with our AI nurse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-secondary hover:bg-secondary/90 focus-visible:ring-secondary"
                onClick={() => router.push('/voice-consultation')}
              >
                Start Consultation
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-secondary/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-secondary" />
                <CardTitle>Past Consultations</CardTitle>
              </div>
              <CardDescription>
                Review your previous AI consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/consultation-history')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-secondary/20">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-secondary" />
                <CardTitle>Account Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-foreground">{user.username}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-foreground">{user.firstName} {user.lastName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
