// src/components/Forgot.tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface ForgotProps {
  onBackToLogin: () => void;
  onReset?: (email: string) => void;
}

const Forgot: React.FC<ForgotProps> = ({ onBackToLogin, onReset }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await apiService.requestPasswordReset(email.trim());
      
      // SUCCESS: Show success state
      setSuccess(true);
      setError(null);
      
      // Show ONE success toast with a unique ID to prevent duplicates
      toast.success('Reset link sent! Check your inbox.', {
        id: `password-reset-${email.trim()}`,
        duration: 5000,
      });
      
      // Call onReset callback ONLY if provided (parent can handle navigation if needed)
      // Remove any toast calls from the parent component
      if (onReset) {
        onReset(email.trim());
      }
      
      // Keep email in state for display in success message
      
    } catch (err) {
      // ERROR: Handle and show error
      let errorMessage = 'Failed to send reset link. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess(false);
      
      // Show ONE error toast with a unique ID
      toast.error(errorMessage, {
        id: `password-reset-error-${Date.now()}`,
        duration: 5000,
      });
      
      console.error('Password reset error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSuccess(false);
    setError(null);
    setEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950 dark:via-teal-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div 
              className={`size-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                success 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}
            >
              {success ? (
                <CheckCircle className="size-6 text-white" />
              ) : (
                <Mail className="size-6 text-white" />
              )}
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {success ? 'Check your email' : 'Forgot your password?'}
          </CardTitle>
          
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {success 
              ? `We've sent a password reset link to ${email}. Please check your inbox and spam folder.`
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null); // Clear error when user types
                  }}
                  required
                  disabled={submitting}
                  className="focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md"
                disabled={submitting || !email.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="size-16 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                  Email sent successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  If you don't see it, check your spam folder.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={handleSendAnother}
              >
                Send another link
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <Button
              variant="link"
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={onBackToLogin}
              disabled={submitting}
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Forgot;
