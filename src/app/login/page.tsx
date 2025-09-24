
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signIn, onAuthStateChange } from '@/lib/auth';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if already logged in
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setRedirecting(true);
        // Use window.location instead of router.push for more reliable navigation
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      setRedirecting(true);
      toast({
        title: 'Sign-in successful',
        description: 'Redirecting to dashboard...',
      });
      // Use window.location for more reliable navigation in Firebase Studio
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      toast({
        title: 'Sign-in failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  if (authLoading || redirecting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">
              {redirecting ? 'Redirecting to dashboard...' : 'Loading...'}
            </p>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
