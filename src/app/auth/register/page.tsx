import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-brand text-5xl font-bold">
            TalkWell
          </h1>
          <p className="text-muted-foreground">
            Join your compassionate AI health companion
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-secondary hover:text-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
