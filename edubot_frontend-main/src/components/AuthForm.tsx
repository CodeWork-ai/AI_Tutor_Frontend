// src/components/AuthForm.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { apiService, User } from '../services/api';
import { toast } from 'sonner';
import Forgot from './Forgot';
import Reset from './Reset';
 
interface AuthFormProps {
  onLogin: (user: User) => void;
}
 
export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
 
  // Separate state for login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false,
  });
 
  // Separate state for register form
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
  });
 
  // Login form handlers
  const handleLoginChange = (field: keyof typeof loginForm, value: string | boolean) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };
 
  // Register form handlers
  const handleRegisterChange = (field: keyof typeof registerForm, value: string | boolean) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  };
 
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
 
  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true };
  };
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!validateEmail(loginForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
 
    if (!loginForm.password) {
      toast.error('Please enter your password');
      return;
    }
 
    setIsLoading(true);
    try {
      const response = await apiService.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
 
      if (response.user) {
        toast.success('Login successful!');
        onLogin(response.user);
        setLoginForm({
          email: '',
          password: '',
          showPassword: false,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!registerForm.firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }
 
    if (!registerForm.lastName.trim()) {
      toast.error('Please enter your last name');
      return;
    }
 
    if (!validateEmail(registerForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
 
    const passwordValidation = validatePassword(registerForm.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message || 'Invalid password');
      return;
    }
 
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
 
    setIsLoading(true);
    try {
      await apiService.register({
        email: registerForm.email.trim(),
        firstname: registerForm.firstName.trim(),
        lastname: registerForm.lastName.trim(),
        password: registerForm.password,
        confirmpassword: registerForm.confirmPassword,
      });
 
      toast.success('Registration successful! Please log in with your credentials.');
 
      setRegisterForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false,
      });
 
      setActiveTab('login');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleResetSuccess = () => {
    setIsReset(false);
    setSubmittedEmail('');
    setIsForgot(false);
    toast.info('Password reset successful! You can now log in with your new password.');
  };
 
  const handleForgotSuccess = (email: string) => {
    toast.success('Reset link sent! Check your inbox.');
    setSubmittedEmail(email);
    setIsForgot(false);
    setIsReset(true);
  };
 
  if (isForgot) {
    return (
      <Forgot
        onBackToLogin={() => setIsForgot(false)}
        onReset={handleForgotSuccess}
      />
    );
  }
 
  if (isReset) {
    return (
      <Reset
        email={submittedEmail}
        onSuccess={handleResetSuccess}
      />
    );
  }
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="size-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
              <Sparkles className="size-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to EduBot</CardTitle>
            <CardDescription className="text-base mt-2">Your AI-powered academic tutor</CardDescription>
          </div>
        </CardHeader>
 
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
 
            {/* LOGIN TAB */}
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                  />
                </div>
 
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => handleLoginChange('showPassword', !loginForm.showPassword)}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      tabIndex={-1}
                      aria-label={loginForm.showPassword ? 'Hide password' : 'Show password'}
                    >
                      {loginForm.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type={loginForm.showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                  />
                </div>
 
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
 
              <Separator className="my-4" />
 
              <div className="text-center">
                <Button
                  variant="link"
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => setIsForgot(true)}
                  disabled={isLoading}
                >
                  Forgot your password?
                </Button>
              </div>
            </TabsContent>
 
            {/* REGISTER TAB */}
            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={registerForm.firstName}
                      onChange={(e) => handleRegisterChange('firstName', e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={registerForm.lastName}
                      onChange={(e) => handleRegisterChange('lastName', e.target.value)}
                      disabled={isLoading}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={registerForm.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                  />
                </div>
 
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="register-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => handleRegisterChange('showPassword', !registerForm.showPassword)}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      tabIndex={-1}
                      aria-label={registerForm.showPassword ? 'Hide password' : 'Show password'}
                    >
                      {registerForm.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Input
                    id="register-password"
                    type={registerForm.showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 8 characters)"
                    value={registerForm.password}
                    onChange={(e) => handleRegisterChange('password', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must include uppercase, lowercase, and number
                  </p>
                </div>
 
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <button
                      type="button"
                      onClick={() => handleRegisterChange('showConfirmPassword', !registerForm.showConfirmPassword)}
                      disabled={isLoading}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      tabIndex={-1}
                      aria-label={registerForm.showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {registerForm.showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Input
                    id="confirmPassword"
                    type={registerForm.showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                </div>
 
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
