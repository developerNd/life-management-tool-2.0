import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-purple-800 mb-2">Welcome to TaskMaster</CardTitle>
          <CardDescription className="text-xl text-gray-600">Boost your productivity with our powerful task management app</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-center text-gray-700">
            TaskMaster helps you organize, prioritize, and collaborate on tasks effortlessly. 
            Stay on top of your projects and achieve your goals with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto" size="lg">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Intuitive task management</li>
            <li>✓ Team collaboration features</li>
            <li>✓ Progress tracking and reporting</li>
            <li>✓ Customizable workflows</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}