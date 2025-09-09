import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-brand text-5xl font-bold">
            TalkWell
          </h1>
          <p className="text-muted-foreground">
            Welcome back to your health companion
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-secondary hover:text-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
