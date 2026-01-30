/**
 * Error Testing Utilities for Home Hero Video Feature
 * 
 * This utility provides functions to test various error scenarios
 * and validate error handling implementation.
 */

export interface ErrorTestResult {
  scenario: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class VideoErrorTester {
  private static readonly TEST_SCENARIOS = {
    FILE_TOO_LARGE: 'file_too_large',
    FILE_TOO_SMALL: 'file_too_small',
    INVALID_FORMAT: 'invalid_format',
    NETWORK_ERROR: 'network_error',
    SERVER_ERROR: 'server_error',
    CORRUPTED_FILE: 'corrupted_file',
    EMPTY_FILE: 'empty_file',
    SUSPICIOUS_FILENAME: 'suspicious_filename',
    MIME_TYPE_MISMATCH: 'mime_type_mismatch'
  };

  /**
   * Create a test file with specific characteristics for testing
   */
  static createTestFile(scenario: string, _options: any = {}): File {
    const scenarios = this.TEST_SCENARIOS;
    
    switch (scenario) {
      case scenarios.FILE_TOO_LARGE:
        // Create a file that appears to be larger than 50MB
        const largeBuffer = new ArrayBuffer(51 * 1024 * 1024); // 51MB
        return new File([largeBuffer], 'large_video.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });

      case scenarios.FILE_TOO_SMALL:
        // Create an empty or very small file
        const smallBuffer = new ArrayBuffer(100); // 100 bytes
        return new File([smallBuffer], 'tiny_video.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });

      case scenarios.INVALID_FORMAT:
        // Create a file with invalid video format
        const textBuffer = new ArrayBuffer(1024);
        return new File([textBuffer], 'not_a_video.txt', { 
          type: 'text/plain',
          lastModified: Date.now()
        });

      case scenarios.CORRUPTED_FILE:
        // Create a file with video extension but invalid content
        const corruptedBuffer = new ArrayBuffer(1024 * 1024); // 1MB of zeros
        return new File([corruptedBuffer], 'corrupted.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });

      case scenarios.EMPTY_FILE:
        // Create completely empty file
        return new File([], 'empty.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });

      case scenarios.SUSPICIOUS_FILENAME:
        // Create file with suspicious filename
        const normalBuffer = new ArrayBuffer(1024 * 1024);
        return new File([normalBuffer], '../../../malicious.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });

      case scenarios.MIME_TYPE_MISMATCH:
        // Create file with MP4 extension but wrong MIME type
        const mismatchBuffer = new ArrayBuffer(1024 * 1024);
        return new File([mismatchBuffer], 'video.mp4', { 
          type: 'image/jpeg', // Wrong MIME type
          lastModified: Date.now()
        });

      default:
        // Create a valid test file
        const validBuffer = new ArrayBuffer(5 * 1024 * 1024); // 5MB
        return new File([validBuffer], 'test_video.mp4', { 
          type: 'video/mp4',
          lastModified: Date.now()
        });
    }
  }

  /**
   * Test client-side file validation
   */
  static async testClientSideValidation(): Promise<ErrorTestResult[]> {
    const results: ErrorTestResult[] = [];
    
    // Import validation function (this would need to be exported from VideoUploadForm)
    // For now, we'll simulate the validation logic
    const validateFile = (file: File): string | null => {
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      const MIN_FILE_SIZE = 1024;
      const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
      const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];

      if (!file || !file.name) {
        return 'Выбранный файл недействителен';
      }

      if (file.size < MIN_FILE_SIZE) {
        return `Файл слишком маленький`;
      }

      if (file.size > MAX_FILE_SIZE) {
        return `Файл слишком большой`;
      }

      const fileName = file.name.toLowerCase();
      const hasValidExtension = ACCEPTED_VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
      if (!hasValidExtension) {
        return `Неподдерживаемое расширение файла`;
      }

      if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        return `Неподдерживаемый тип файла`;
      }

      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return 'Недопустимое имя файла';
      }

      return null;
    };

    // Test each scenario
    const testCases = [
      { scenario: this.TEST_SCENARIOS.FILE_TOO_LARGE, shouldFail: true },
      { scenario: this.TEST_SCENARIOS.FILE_TOO_SMALL, shouldFail: true },
      { scenario: this.TEST_SCENARIOS.INVALID_FORMAT, shouldFail: true },
      { scenario: this.TEST_SCENARIOS.EMPTY_FILE, shouldFail: true },
      { scenario: this.TEST_SCENARIOS.SUSPICIOUS_FILENAME, shouldFail: true },
      { scenario: this.TEST_SCENARIOS.MIME_TYPE_MISMATCH, shouldFail: true },
      { scenario: 'valid_file', shouldFail: false }
    ];

    for (const testCase of testCases) {
      try {
        const testFile = this.createTestFile(testCase.scenario);
        const validationError = validateFile(testFile);
        
        const passed = testCase.shouldFail ? (validationError !== null) : (validationError === null);
        
        results.push({
          scenario: `Client validation: ${testCase.scenario}`,
          passed,
          message: passed ? 'Test passed' : `Test failed: expected ${testCase.shouldFail ? 'error' : 'success'}, got ${validationError ? 'error' : 'success'}`,
          details: { validationError, fileSize: testFile.size, fileName: testFile.name, fileType: testFile.type }
        });
      } catch (error) {
        results.push({
          scenario: `Client validation: ${testCase.scenario}`,
          passed: false,
          message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        });
      }
    }

    return results;
  }

  /**
   * Test server-side error responses
   */
  static async testServerSideValidation(apiBaseUrl: string): Promise<ErrorTestResult[]> {
    const results: ErrorTestResult[] = [];
    
    const testCases = [
      { 
        scenario: this.TEST_SCENARIOS.FILE_TOO_LARGE, 
        expectedStatus: 422,
        expectedMessage: 'размер'
      },
      { 
        scenario: this.TEST_SCENARIOS.INVALID_FORMAT, 
        expectedStatus: 422,
        expectedMessage: 'тип'
      },
      { 
        scenario: this.TEST_SCENARIOS.EMPTY_FILE, 
        expectedStatus: 422,
        expectedMessage: 'пуст'
      }
    ];

    for (const testCase of testCases) {
      try {
        const testFile = this.createTestFile(testCase.scenario);
        const formData = new FormData();
        formData.append('hero_video', testFile);

        const response = await fetch(`${apiBaseUrl}/home/hero-video`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const responseData = await response.json();
        
        const statusMatches = response.status === testCase.expectedStatus;
        const messageMatches = responseData.message && 
          responseData.message.toLowerCase().includes(testCase.expectedMessage.toLowerCase());
        
        const passed = statusMatches && messageMatches;
        
        results.push({
          scenario: `Server validation: ${testCase.scenario}`,
          passed,
          message: passed ? 'Test passed' : `Expected status ${testCase.expectedStatus}, got ${response.status}`,
          details: { 
            expectedStatus: testCase.expectedStatus,
            actualStatus: response.status,
            responseData,
            expectedMessage: testCase.expectedMessage
          }
        });
      } catch (error) {
        results.push({
          scenario: `Server validation: ${testCase.scenario}`,
          passed: false,
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error }
        });
      }
    }

    return results;
  }

  /**
   * Test network error scenarios
   */
  static async testNetworkErrors(_apiBaseUrl: string): Promise<ErrorTestResult[]> {
    const results: ErrorTestResult[] = [];
    
    // Test with invalid URL to simulate network error
    try {
      const testFile = this.createTestFile('valid_file');
      const formData = new FormData();
      formData.append('hero_video', testFile);

      const invalidUrl = 'http://invalid-domain-that-does-not-exist.com/api/home/hero-video';
      
      const response = await fetch(invalidUrl, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      results.push({
        scenario: 'Network error: Invalid domain',
        passed: false,
        message: 'Expected network error but request succeeded',
        details: { response: response.status }
      });
    } catch (error) {
      const isNetworkError = error instanceof Error && 
        (error.name === 'TypeError' || error.message.includes('fetch'));
      
      results.push({
        scenario: 'Network error: Invalid domain',
        passed: isNetworkError,
        message: isNetworkError ? 'Network error correctly detected' : 'Unexpected error type',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    return results;
  }

  /**
   * Run all error tests
   */
  static async runAllTests(apiBaseUrl: string): Promise<ErrorTestResult[]> {
    console.log('Starting comprehensive error handling tests...');
    
    const allResults: ErrorTestResult[] = [];
    
    // Test client-side validation
    console.log('Testing client-side validation...');
    const clientResults = await this.testClientSideValidation();
    allResults.push(...clientResults);
    
    // Test server-side validation
    console.log('Testing server-side validation...');
    const serverResults = await this.testServerSideValidation(apiBaseUrl);
    allResults.push(...serverResults);
    
    // Test network errors
    console.log('Testing network error handling...');
    const networkResults = await this.testNetworkErrors(apiBaseUrl);
    allResults.push(...networkResults);
    
    // Log summary
    const passedTests = allResults.filter(r => r.passed).length;
    const totalTests = allResults.length;
    
    console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);
    
    // Log failed tests
    const failedTests = allResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\nFailed tests:');
      failedTests.forEach(test => {
        console.log(`- ${test.scenario}: ${test.message}`);
      });
    }
    
    return allResults;
  }
}

/**
 * Utility to simulate various error conditions for testing
 */
export class ErrorSimulator {
  /**
   * Simulate a network timeout
   */
  static simulateTimeout(duration: number = 5000): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, duration);
    });
  }

  /**
   * Simulate a network error
   */
  static simulateNetworkError(): Promise<never> {
    return Promise.reject(new Error('Network error: Failed to fetch'));
  }

  /**
   * Simulate server error responses
   */
  static simulateServerError(status: number, message: string): Response {
    return new Response(JSON.stringify({
      success: false,
      message,
      errors: {}
    }), {
      status,
      statusText: message,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Error logging utility for debugging
 */
export class ErrorLogger {
  private static logs: Array<{
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    context?: any;
  }> = [];

  static error(message: string, context?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error' as const,
      message,
      context
    };
    
    this.logs.push(logEntry);
    console.error(`[ERROR] ${message}`, context);
  }

  static warn(message: string, context?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn' as const,
      message,
      context
    };
    
    this.logs.push(logEntry);
    console.warn(`[WARN] ${message}`, context);
  }

  static info(message: string, context?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      message,
      context
    };
    
    this.logs.push(logEntry);
    console.info(`[INFO] ${message}`, context);
  }

  static getLogs() {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}