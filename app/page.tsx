'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, Calendar, CheckCircle, Compass, Lock, Menu, Settings, Users, X } from "lucide-react"
import Link from 'next/link'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <a href="#" className="flex items-center">
                <Compass className="h-8 w-auto sm:h-10 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Life Compass</span>
              </a>
            </div>
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <Button variant="ghost" className="text-base font-medium text-gray-500 hover:text-gray-900">
                 <Link href="/login">Log in</Link>
              </Button>
              <Button className="ml-8 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
              <Link href="/signup">Sign up</Link>
              </Button>
            </div>
            <div className="md:hidden">
              <Button variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Button variant="ghost" className="w-full text-base font-medium text-gray-500 hover:text-gray-900">
              <Link href="/login">Log in</Link>
              </Button>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
              <Link href="/signup">Sign up</Link> 
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Navigate Your Life with</span>
            <span className="block text-indigo-600">Life Compass</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Set goals, track progress, and achieve your dreams with our all-in-one life management tool.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
              <Link href="/signup">Get started</Link> 
              </Button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Button variant="outline" className="w-full bg-white hover:bg-gray-50">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg font-semibold text-gray-900">Set Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-500">
                  Define and prioritize your personal and professional goals with our intuitive interface.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
              <CardHeader>
                <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg font-semibold text-gray-900">Plan Your Time</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-500">
                  Organize your schedule and manage your time effectively with our powerful planning tools.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
              <CardHeader>
                <BarChart2 className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg font-semibold text-gray-900">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-500">
                  Monitor your achievements and visualize your progress with insightful charts and analytics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 sm:mt-24">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 sm:p-8 lg:p-12">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Start your journey today
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                  Join thousands of users who have transformed their lives with Life Compass. Our easy-to-use platform helps you stay focused, motivated, and on track to achieve your goals.
                </p>
                <div className="mt-8">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500">
                  <Link href="/signup">Sign up for free</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-indigo-100">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <Users className="h-8 w-8 text-indigo-600 mb-2" />
                    <p className="text-lg font-semibold text-gray-900">10,000+</p>
                    <p className="text-sm text-gray-500">Active Users</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-8 w-8 text-indigo-600 mb-2" />
                    <p className="text-lg font-semibold text-gray-900">50,000+</p>
                    <p className="text-sm text-gray-500">Goals Achieved</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Lock className="h-8 w-8 text-indigo-600 mb-2" />
                    <p className="text-lg font-semibold text-gray-900">100%</p>
                    <p className="text-sm text-gray-500">Secure & Private</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Settings className="h-8 w-8 text-indigo-600 mb-2" />
                    <p className="text-lg font-semibold text-gray-900">24/7</p>
                    <p className="text-sm text-gray-500">Support</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
          
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2023 Life Compass, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}