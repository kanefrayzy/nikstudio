"use client";

import React, { useState } from 'react';

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VideoErrorTester, ErrorTestResult } from "@/utils/errorTestingUtils";
import { AlertCircle, CheckCircle, Play, FileText } from "lucide-react";

export default function ErrorTestingPage() {
  const [testResults, setTestResults] = useState<ErrorTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('all');

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL + '/api';
      
      let results: ErrorTestResult[] = [];
      
      if (selectedTest === 'all') {
        results = await VideoErrorTester.runAllTests(apiBaseUrl);
      } else if (selectedTest === 'client') {
        results = await VideoErrorTester.testClientSideValidation();
      } else if (selectedTest === 'server') {
        results = await VideoErrorTester.testServerSideValidation(apiBaseUrl);
      } else if (selectedTest === 'network') {
        results = await VideoErrorTester.testNetworkErrors(apiBaseUrl);
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
      setTestResults([{
        scenario: 'Test execution',
        passed: false,
        message: `Failed to run tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Error Handling Tests</h1>
        <span className="text-sm text-gray-500">
          Hero Video Feature Error Validation
        </span>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Run comprehensive error handling tests for the hero video feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Test Type:</label>
              <select 
                value={selectedTest} 
                onChange={(e) => setSelectedTest(e.target.value)}
                className="px-3 py-2 border rounded-md"
                disabled={isRunning}
              >
                <option value="all">All Tests</option>
                <option value="client">Client-side Validation</option>
                <option value="server">Server-side Validation</option>
                <option value="network">Network Error Handling</option>
              </select>
            </div>
            
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="mt-4 sm:mt-6"
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Test Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
            
            {totalTests > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  Success Rate: {((passedTests / totalTests) * 100).toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(passedTests / totalTests) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detailed Results</h2>
          
          {testResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${result.passed ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{result.scenario}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.passed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          Show Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {testResults.length === 0 && !isRunning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong> Select a test type and click "Run Tests" to validate error handling implementation. 
            This will test various error scenarios including file size limits, invalid formats, network errors, and server-side validation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}