'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Compass } from 'lucide-react';
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
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-100 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
        <div className="bg-indigo-600 p-4 flex items-center justify-center">
          <Compass className="h-6 w-6 text-white" />
          <CardTitle className="text-xl font-bold text-white ml-2">Join Life Compass</CardTitle>
        </div>
        <CardHeader className="pt-4 pb-2">
          <CardDescription className="text-center text-gray-600 text-sm">
            Create your account and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.general && <div className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs">{errors.general[0]}</div>}
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-medium text-gray-700">Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={`bg-white ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <div className="text-red-500 text-xs">{errors.name[0]}</div>}
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-gray-700">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`bg-white ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <div className="text-red-500 text-xs">{errors.email[0]}</div>}
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-medium text-gray-700">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className={`bg-white ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.password && <div className="text-red-500 text-xs">{errors.password[0]}</div>}
          </div>
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">Confirm Password</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`bg-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.confirmPassword && <div className="text-red-500 text-xs">{errors.confirmPassword[0]}</div>}
          </div>
          <Button onClick={handleSignUp} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition duration-300 ease-in-out transform hover:scale-105">
            <UserPlus className="mr-2 h-4 w-4" /> Sign Up
          </Button>
          <div className="text-center text-sm">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
              Already have an account? Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;