// src/components/Forgot.tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';

interface ForgotProps {
  onBackToLogin: (target?: 'login' | 'register') => void;
  // onReset now receives optional token returned by the backend
  onReset?: (email: string, token?: string) => void;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
}

const Forgot: React.FC<ForgotProps> = ({ onBackToLogin, onReset }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Call the backend and inspect the response. Some backends return 200 with
      // { success: false, message: 'Account not found' } when the email does not exist.
      const res: any = await apiService.requestPasswordReset(trimmedEmail);
      console.debug('Password reset response (server):', res);

      // If backend explicitly indicates failure (account not found), show that exact
      // message to the user and redirect them back to login.
      if (res && res.success === false) {
        const serverMessage = res.message || 'Account not found.';
        setError(serverMessage);
        setSuccess(false);
        // Show the backend message in a toast too (exact message as requested)
        toast.error(serverMessage, { id: `password-reset-backend-${Date.now()}`, duration: 5000 });
        // Redirect back to login after a short delay so user sees the message
        setTimeout(() => onBackToLogin(), 1400);
        return;
      }

      // Otherwise, treat as a successful request and show the success UI
      setSuccess(true);
      setError(null);
      toast.success(res?.message || 'Password reset email has been sent. Check your inbox.', {
        id: `password-reset-success-${trimmedEmail}-${Date.now()}`,
        duration: 5000,
      });

      // Notify parent (AuthForm) that reset was initiated so it can show the Reset UI
      // If backend returned a token (useful for dev environments), pass it up so the
      // Reset form can pre-fill the token and avoid requiring the user to copy it
      // from the email.
      if (typeof (onReset) === 'function') {
        onReset(trimmedEmail, res?.token);
      }

    } catch (err) {
      // ERROR HANDLING: Proper Axios error handling
      let errorMessage = 'Unable to process your request. Please try again later.';
      
      // Handle Axios errors properly
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        
        if (axiosError.response) {
          // Server responded with error
          const responseData = axiosError.response.data;
          
          // Extract error message from various possible formats
          errorMessage = 
            responseData?.message || 
            responseData?.error || 
            responseData?.detail ||
            `Server error: ${axiosError.response.status}`;
          
          // Handle specific status codes
          if (axiosError.response.status === 429) {
            errorMessage = 'Too many requests. Please try again in a few minutes.';
          } else if (axiosError.response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        } else if (axiosError.request) {
          // Request made but no response received
          errorMessage = 'No response from server. Check your internet connection.';
        } else {
          // Error in request configuration
          errorMessage = axiosError.message || 'Failed to send request.';
        }
      } else if (err instanceof Error) {
        // Generic Error object
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess(false);
      
      // Show error toast with unique ID
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
                <CheckCircle className="size-6 text-green" />
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
              ? `If an account with that email exists, a password reset link has been sent. Please check your inbox and spam folder.`
              : 'Enter your email address and we\'ll send you a link to reset your password.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
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
                  className="focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {error && (
                <div 
                  className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md transition-all"
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

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                You'll receive an email with instructions to reset your password.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="size-16 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                  Email sent successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                  Click the link in the email to create a new password.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The link will expire in 1 hour for security reasons.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950 transition-all"
                onClick={handleSendAnother}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send another link
              </Button>
            </div>
          )}

          <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <Button
              variant="link"
              type="button"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              onClick={() => onBackToLogin()}
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
