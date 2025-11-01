// src/components/Reset.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '../services/api';

// Props interface for when used as a child component
interface ResetProps {
  email?: string;
  // optional token provided by the backend (useful in dev/test where email contains token)
  resetTokenProp?: string;
  onSuccess?: () => void;
}

const Reset: React.FC<ResetProps> = ({ email: propEmail, resetTokenProp, onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract token and email from URL query parameters OR use props
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');
  
  // Use prop email if provided, otherwise use URL email
  const email = propEmail || urlEmail;
  const token = urlToken;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    // If a token was passed as a prop (from Forgot), use it and mark checked
    if (resetTokenProp) {
      setResetToken(resetTokenProp);
      setTokenChecked(true);
      return;
    }

    // Only check token once when using URL-based routing
    if (!tokenChecked && !propEmail) {
      if (!token) {
        toast.error('Invalid reset link. Please request a new password reset.');
        navigate('/forgot-password');
      }
      setTokenChecked(true);
    } else if (propEmail) {
      // If using as child component with props (no URL token), mark as checked
      setTokenChecked(true);
    }
  }, [token, navigate, tokenChecked, propEmail, resetTokenProp]);

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const updateStrength = (password: string) => {
    setStrength(calculateStrength(password));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (strength < 3) {
      const errorMsg = 'Password must meet strength requirements';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // When used as child component, require manual token entry
    const finalToken = token || resetToken;
    
    if (!finalToken) {
      const errorMsg = 'Password reset token is required. Please check your email for the reset token.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiService.resetPassword({
        resettoken: finalToken,
        newpassword: newPassword,
        confirmpassword: confirmPassword,
      });
      
      toast.success('Password reset successful!');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      
      // If onSuccess callback provided (child component), call it
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise redirect to login (route component)
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      let errorMessage = 'Failed to reset password. Please try again or request a new reset link.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Full error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render until token check is complete (only for URL-based routing)
  if (!tokenChecked) {
    return null;
  }

  // If no token and not using props (URL-based routing), don't render
  if (!token && !propEmail) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950 dark:to-teal-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105">
              <Lock className="size-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Enter your new password to reset your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show token input field only when used as child component without URL token */}
            {!token && propEmail && (
              <div className="space-y-2">
                <Label htmlFor="resetToken" className="text-sm font-medium">Reset Token</Label>
                <Input
                  id="resetToken"
                  type="text"
                  placeholder="Enter 6-digit token from email"
                  value={resetToken}
                  onChange={(e) => {
                    setResetToken(e.target.value);
                    setError(null);
                  }}
                  required
                  disabled={submitting}
                  className="focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the reset token
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  updateStrength(e.target.value);
                  setError(null);
                }}
                required
                minLength={8}
                disabled={submitting}
                className="focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="flex space-x-1 mt-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      i < strength ? 'bg-green-500 scale-100' : 'bg-gray-200 dark:bg-gray-700 scale-75'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium">{['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength]}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Re-enter password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                required
                disabled={submitting}
                className="focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {email && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Resetting for: <span className="font-medium">{email}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reset;
