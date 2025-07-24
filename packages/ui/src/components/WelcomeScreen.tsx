import { Book, FileText, Rocket, Settings, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onCreateScript?: () => void;
  onOpenSettings?: () => void;
}

export function WelcomeScreen({
  onGetStarted,
  onCreateScript,
  onOpenSettings,
}: WelcomeScreenProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900'>
      <div className='container mx-auto px-4 py-12'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <div className='flex items-center justify-center mb-6'>
            <div className='h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl'>
              <Rocket className='h-10 w-10 text-white' />
            </div>
          </div>
          <h1 className='text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4'>
            Welcome to{' '}
            <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              ScriptPilot
            </span>
          </h1>
          <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8'>
            The most advanced userscript manager for Chrome, Firefox, and Edge.
            Write powerful scripts to enhance any website with TypeScript
            support, Monaco Editor, and DevTools integration.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              onClick={onCreateScript}
              size='lg'
              className='px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300'
            >
              <FileText className='h-6 w-6 mr-2' />
              Create Your First Script
            </Button>
            <Button
              onClick={onGetStarted}
              variant='outline'
              size='lg'
              className='px-8 py-4 text-lg font-semibold border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
            >
              <Book className='h-6 w-6 mr-2' />
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
          <Card className='card-professional hover:shadow-2xl transform hover:scale-105 transition-all duration-300'>
            <CardHeader>
              <div className='h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4'>
                <Zap className='h-6 w-6 text-white' />
              </div>
              <CardTitle className='text-xl font-bold text-gray-900 dark:text-white'>
                Lightning Fast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 dark:text-gray-300'>
                Built with React, TypeScript, and Vite for blazing fast
                performance. Advanced bundling and optimization for minimal
                impact on browser speed.
              </p>
            </CardContent>
          </Card>

          <Card className='card-professional hover:shadow-2xl transform hover:scale-105 transition-all duration-300'>
            <CardHeader>
              <div className='h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4'>
                <FileText className='h-6 w-6 text-white' />
              </div>
              <CardTitle className='text-xl font-bold text-gray-900 dark:text-white'>
                Monaco Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 dark:text-gray-300'>
                The same editor that powers VS Code. Full TypeScript support,
                IntelliSense, syntax highlighting, and debugging capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className='card-professional hover:shadow-2xl transform hover:scale-105 transition-all duration-300'>
            <CardHeader>
              <div className='h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4'>
                <Settings className='h-6 w-6 text-white' />
              </div>
              <CardTitle className='text-xl font-bold text-gray-900 dark:text-white'>
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 dark:text-gray-300'>
                DevTools integration, plugin system, script management,
                auto-updates, and comprehensive userscript API support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card className='card-professional mb-12'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-center text-gray-900 dark:text-white'>
              🚀 Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center'>
                <div className='h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl'>
                  1
                </div>
                <h3 className='text-lg font-semibold mb-2 text-gray-900 dark:text-white'>
                  Create a Script
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Click "Create Your First Script" to open the Monaco Editor and
                  start writing powerful userscripts.
                </p>
              </div>

              <div className='text-center'>
                <div className='h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl'>
                  2
                </div>
                <h3 className='text-lg font-semibold mb-2 text-gray-900 dark:text-white'>
                  Configure Settings
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Set up URL patterns, permissions, and execution timing to
                  control where and how your script runs.
                </p>
              </div>

              <div className='text-center'>
                <div className='h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl'>
                  3
                </div>
                <h3 className='text-lg font-semibold mb-2 text-gray-900 dark:text-white'>
                  Save & Enjoy
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  Save your script and watch it automatically run on matching
                  websites. Edit anytime with full-featured tools.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Scripts */}
        <Card className='card-professional'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-center text-gray-900 dark:text-white'>
              🎯 Popular Script Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg border border-blue-200 dark:border-blue-700'>
                <h4 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                  🎨 Dark Mode Toggle
                </h4>
                <p className='text-sm text-blue-700 dark:text-blue-300 mb-3'>
                  Add a dark mode toggle to any website that doesn't have one.
                </p>
                <code className='text-xs bg-blue-900 text-blue-100 p-2 rounded block'>
                  // @match https://example.com/*
                  <br />
                  document.body.style.filter = 'invert(1)';
                </code>
              </div>

              <div className='p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg border border-purple-200 dark:border-purple-700'>
                <h4 className='font-semibold text-purple-900 dark:text-purple-100 mb-2'>
                  🔍 Enhanced Search
                </h4>
                <p className='text-sm text-purple-700 dark:text-purple-300 mb-3'>
                  Add keyboard shortcuts and enhanced search functionality.
                </p>
                <code className='text-xs bg-purple-900 text-purple-100 p-2 rounded block'>
                  // @grant GM_addStyle
                  <br />
                  // @match *://*/*
                  <br />
                  document.addEventListener('keydown', ...);
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center mt-12 pb-8'>
          <p className='text-gray-600 dark:text-gray-400'>
            Need help? Check out our{' '}
            <button
              onClick={onOpenSettings}
              className='text-blue-600 dark:text-blue-400 hover:underline font-medium'
            >
              settings and documentation
            </button>{' '}
            or start with a simple script example.
          </p>
        </div>
      </div>
    </div>
  );
}
