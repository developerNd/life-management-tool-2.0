'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../utils/api';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const user = await loginUser(email, password);
      login(user);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/taskpage'); // Redirect to task page after successful login
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const apiError = error as { response?: { data?: { errors?: { [key: string]: string[] } } } };
        if (apiError.response?.data?.errors) {
          setErrors(apiError.response.data.errors);
        } else {
          setErrors({ general: ['Invalid credentials. Please try again.'] });
        }
      } else {
        setErrors({ general: ['An unexpected error occurred. Please try again.'] });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to Productivity App</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errors.general && <div className="text-red-500 text-center">{errors.general[0]}</div>}
            {successMessage && <div className="text-green-500 text-center">{successMessage}</div>}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <div className="text-red-500 text-sm">{errors.email[0]}</div>}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <div className="text-red-500 text-sm">{errors.password[0]}</div>}
            </div>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
            <div className="text-center mt-4">
              <Link href="/signup" className="text-sm text-blue-600 hover:underline">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;