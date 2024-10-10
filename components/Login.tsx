'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Compass } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-100 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <div className="flex items-center justify-center">
            <Compass className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white mt-4">Welcome to Life Compass</CardTitle>
        </div>
        <CardHeader>
          <CardDescription className="text-center text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">{errors.general[0]}</div>
          )}
          {successMessage && (
            <div className="bg-green-50 text-green-600 px-4 py-2 rounded-md text-sm">{successMessage}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`bg-white ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email[0]}</div>}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`bg-white ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password[0]}</div>}
          </div>
          <Button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition duration-300 ease-in-out transform hover:scale-105">
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Button>
          <div className="text-center space-y-2 mt-4">
            <Link href="/signup" className="text-sm text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;