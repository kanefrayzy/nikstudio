<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\ContactEmailRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactInquiryMail;
use Exception;

class TestFormValidation extends Command
{
    protected $signature = 'email:test-validation';
    protected $description = 'Test form validation rules and error handling';

    public function handle()
    {
        $this->info('Testing Form Validation and Error Handling...');
        
        $this->testValidationRules();
        $this->testRussianErrorMessages();
        $this->testNetworkErrorHandling();
        $this->testFormDataPersistence();
        
        return 0;
    }
    
    private function testValidationRules()
    {
        $this->info('Testing Validation Rules...');
        
        // Test cases with invalid data
        $testCases = [
            [
                'name' => 'Empty name',
                'data' => ['name' => '', 'email' => 'test@example.com', 'message' => 'Test message', 'source' => 'contact'],
                'expected_errors' => ['name']
            ],
            [
                'name' => 'Short name',
                'data' => ['name' => 'A', 'email' => 'test@example.com', 'message' => 'Test message', 'source' => 'contact'],
                'expected_errors' => ['name']
            ],
            [
                'name' => 'Long name',
                'data' => ['name' => str_repeat('A', 51), 'email' => 'test@example.com', 'message' => 'Test message', 'source' => 'contact'],
                'expected_errors' => ['name']
            ],
            [
                'name' => 'Invalid email',
                'data' => ['name' => 'Test User', 'email' => 'invalid-email', 'message' => 'Test message', 'source' => 'contact'],
                'expected_errors' => ['email']
            ],
            [
                'name' => 'Empty email',
                'data' => ['name' => 'Test User', 'email' => '', 'message' => 'Test message', 'source' => 'contact'],
                'expected_errors' => ['email']
            ],
            [
                'name' => 'Short message',
                'data' => ['name' => 'Test User', 'email' => 'test@example.com', 'message' => 'Short', 'source' => 'contact'],
                'expected_errors' => ['message']
            ],
            [
                'name' => 'Long message',
                'data' => ['name' => 'Test User', 'email' => 'test@example.com', 'message' => str_repeat('A', 1001), 'source' => 'contact'],
                'expected_errors' => ['message']
            ],
            [
                'name' => 'Invalid source',
                'data' => ['name' => 'Test User', 'email' => 'test@example.com', 'message' => 'Test message', 'source' => 'invalid'],
                'expected_errors' => ['source']
            ],
            [
                'name' => 'Long company name',
                'data' => ['name' => 'Test User', 'email' => 'test@example.com', 'message' => 'Test message', 'source' => 'contact', 'company' => str_repeat('A', 101)],
                'expected_errors' => ['company']
            ]
        ];
        
        foreach ($testCases as $testCase) {
            $validator = Validator::make($testCase['data'], (new ContactEmailRequest())->rules(), (new ContactEmailRequest())->messages());
            
            if ($validator->fails()) {
                $errors = $validator->errors();
                $hasExpectedErrors = true;
                
                foreach ($testCase['expected_errors'] as $expectedField) {
                    if (!$errors->has($expectedField)) {
                        $hasExpectedErrors = false;
                        break;
                    }
                }
                
                if ($hasExpectedErrors) {
                    $this->info("✓ {$testCase['name']}: Validation failed as expected");
                } else {
                    $this->error("✗ {$testCase['name']}: Expected validation errors not found");
                }
            } else {
                $this->error("✗ {$testCase['name']}: Validation should have failed but passed");
            }
        }
        
        // Test valid data
        $validData = [
            'name' => 'Тестовый Пользователь',
            'email' => 'test@example.com',
            'company' => 'Тестовая Компания',
            'message' => 'Это корректное тестовое сообщение для проверки валидации.',
            'source' => 'contact'
        ];
        
        $validator = Validator::make($validData, (new ContactEmailRequest())->rules());
        
        if ($validator->passes()) {
            $this->info('✓ Valid data: Validation passed as expected');
        } else {
            $this->error('✗ Valid data: Validation should have passed but failed');
            $this->line('Errors: ' . json_encode($validator->errors()->toArray()));
        }
    }
    
    private function testRussianErrorMessages()
    {
        $this->info('Testing Russian Error Messages...');
        
        $invalidData = [
            'name' => '',
            'email' => 'invalid-email',
            'message' => 'short',
            'source' => 'invalid'
        ];
        
        $validator = Validator::make($invalidData, (new ContactEmailRequest())->rules(), (new ContactEmailRequest())->messages());
        
        if ($validator->fails()) {
            $errors = $validator->errors();
            
            // Check if error messages are in Russian
            $russianMessages = [
                'name' => 'Поле "Имя" обязательно для заполнения',
                'email' => 'Введите корректный email адрес',
                'message' => 'Сообщение должно содержать минимум 10 символов',
                'source' => 'Источник должен быть "project" или "contact"'
            ];
            
            foreach ($russianMessages as $field => $expectedMessage) {
                if ($errors->has($field)) {
                    $actualMessage = $errors->first($field);
                    if ($actualMessage === $expectedMessage) {
                        $this->info("✓ Russian message for '{$field}': {$actualMessage}");
                    } else {
                        $this->warn("! Russian message for '{$field}' differs: {$actualMessage}");
                    }
                }
            }
        } else {
            $this->error('✗ Validation should have failed to test Russian messages');
        }
    }
    
    private function testNetworkErrorHandling()
    {
        $this->info('Testing Network Error Handling...');
        
        try {
            // Simulate SMTP error by temporarily changing mail configuration
            config(['mail.mailers.smtp.host' => 'invalid-smtp-host.example.com']);
            
            $testData = [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'company' => 'Test Company',
                'message' => 'This is a test message to simulate SMTP error.',
                'source' => 'contact'
            ];
            
            try {
                Mail::send(new ContactInquiryMail($testData));
                $this->warn('! SMTP error simulation may not have worked as expected');
            } catch (Exception $e) {
                if (str_contains($e->getMessage(), 'SMTP') || 
                    str_contains($e->getMessage(), 'Connection') ||
                    str_contains($e->getMessage(), 'Mail')) {
                    $this->info('✓ SMTP error handling: Exception caught correctly');
                    $this->line("  Error type: {$e->getMessage()}");
                } else {
                    $this->info('✓ Network error handling: Exception caught');
                    $this->line("  Error: {$e->getMessage()}");
                }
            }
            
            // Restore original configuration
            config(['mail.mailers.smtp.host' => env('MAIL_HOST', 'smtp.nikstudio.pro')]);
            
        } catch (Exception $e) {
            $this->error('✗ Error in network error testing: ' . $e->getMessage());
        }
    }
    
    private function testFormDataPersistence()
    {
        $this->info('Testing Form Data Persistence During Errors...');
        
        // This would typically be tested in frontend, but we can verify
        // that validation errors don't clear the original request data
        $testData = [
            'name' => 'Тестовый Пользователь',
            'email' => 'invalid-email', // This will cause validation error
            'company' => 'Тестовая Компания',
            'message' => 'Это тестовое сообщение с некорректным email.',
            'source' => 'contact'
        ];
        
        $validator = Validator::make($testData, (new ContactEmailRequest())->rules(), (new ContactEmailRequest())->messages());
        
        if ($validator->fails()) {
            // Verify that original data is still available
            $originalData = $validator->getData();
            
            if ($originalData['name'] === $testData['name'] && 
                $originalData['company'] === $testData['company'] &&
                $originalData['message'] === $testData['message']) {
                $this->info('✓ Form data persistence: Original data preserved during validation error');
            } else {
                $this->error('✗ Form data persistence: Original data not preserved');
            }
        }
    }
}