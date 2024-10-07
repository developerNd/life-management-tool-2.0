'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { signupUser } from '../utils/api';
import { useRouter } from 'next/navigation';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const { login } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: ['Passwords do not match'] });
      return;
    }
    try {
      const user = await signupUser(name, email, password);
      login(user);
      router.push('/taskpage'); // Redirect to task page after successful signup
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const apiError = error as { response?: { data?: { errors?: { [key: string]: string[] } } } };
        if (apiError.response?.data?.errors) {
          setErrors(apiError.response.data.errors);
        } else {
          setErrors({ general: ['An error occurred during sign up. Please try again.'] });
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
          <CardTitle className="text-2xl font-bold text-center">Sign Up for Productivity App</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errors.general && <div className="text-red-500 text-center">{errors.general[0]}</div>}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <div className="text-red-500 text-sm">{errors.name[0]}</div>}
            </div>
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
                placeholder="Create a password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <div className="text-red-500 text-sm">{errors.password[0]}</div>}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && <div className="text-red-500 text-sm">{errors.confirmPassword[0]}</div>}
            </div>
            <Button onClick={handleSignUp} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </Button>
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;