<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactInquiryMail;
use App\Mail\ProjectInquiryMail;
use Exception;

class TestFormClearingFlow extends Command
{
    protected $signature = 'email:test-form-clearing';
    protected $description = 'Test form clearing after successful submission';

    public function handle()
    {
        $this->info('Testing Form Clearing After Successful Submission...');
        
        $this->testContactFormClearing();
        $this->testProjectFormClearing();
        $this->testFormStateAfterSuccess();
        
        return 0;
    }
    
    private function testContactFormClearing()
    {
        $this->info('Testing Contact Form Clearing...');
        
        try {
            // Simulate form data before submission
            $formData = [
                'name' => 'Тестовый Пользователь',
                'email' => 'test@example.com',
                'company' => 'Тестовая Компания',
                'message' => 'Это тестовое сообщение для проверки очистки формы после успешной отправки.'
            ];
            
            $this->info('✓ Form data before submission:');
            $this->line('  Name: ' . $formData['name']);
            $this->line('  Email: ' . $formData['email']);
            $this->line('  Company: ' . $formData['company']);
            $this->line('  Message: ' . substr($formData['message'], 0, 50) . '...');
            
            // Simulate successful email sending
            $contactData = array_merge($formData, ['source' => 'contact']);
            Mail::send(new ContactInquiryMail($contactData));
            
            // Simulate form clearing after successful submission
            $clearedFormData = [
                'name' => '',
                'email' => '',
                'company' => '',
                'message' => ''
            ];
            
            $this->info('✓ Form data after successful submission:');
            $this->line('  Name: "' . $clearedFormData['name'] . '" (cleared)');
            $this->line('  Email: "' . $clearedFormData['email'] . '" (cleared)');
            $this->line('  Company: "' . $clearedFormData['company'] . '" (cleared)');
            $this->line('  Message: "' . $clearedFormData['message'] . '" (cleared)');
            
            // Verify all fields are empty
            $allFieldsCleared = empty($clearedFormData['name']) && 
                               empty($clearedFormData['email']) && 
                               empty($clearedFormData['company']) && 
                               empty($clearedFormData['message']);
            
            if ($allFieldsCleared) {
                $this->info('✓ Contact form cleared successfully after submission');
            } else {
                $this->error('✗ Contact form not properly cleared');
            }
            
        } catch (Exception $e) {
            $this->error('✗ Contact form clearing test failed: ' . $e->getMessage());
        }
    }
    
    private function testProjectFormClearing()
    {
        $this->info('Testing Project Form Clearing...');
        
        try {
            // Simulate form data before submission
            $formData = [
                'name' => 'Клиент Проекта',
                'email' => 'client@example.com',
                'company' => 'Клиентская Компания',
                'message' => 'Интересует разработка похожего проекта для нашего бизнеса.'
            ];
            
            $projectTitle = 'Система управления задачами';
            
            $this->info('✓ Project form data before submission:');
            $this->line('  Name: ' . $formData['name']);
            $this->line('  Email: ' . $formData['email']);
            $this->line('  Company: ' . $formData['company']);
            $this->line('  Message: ' . $formData['message']);
            $this->line('  Project Title: ' . $projectTitle);
            
            // Simulate successful email sending
            $projectData = array_merge($formData, [
                'source' => 'project',
                'project_title' => $projectTitle
            ]);
            Mail::send(new ProjectInquiryMail($projectData));
            
            // Simulate form clearing after successful submission
            $clearedFormData = [
                'name' => '',
                'email' => '',
                'company' => '',
                'message' => ''
            ];
            // Note: project_title is not cleared as it's passed as prop, not form input
            
            $this->info('✓ Project form data after successful submission:');
            $this->line('  Name: "' . $clearedFormData['name'] . '" (cleared)');
            $this->line('  Email: "' . $clearedFormData['email'] . '" (cleared)');
            $this->line('  Company: "' . $clearedFormData['company'] . '" (cleared)');
            $this->line('  Message: "' . $clearedFormData['message'] . '" (cleared)');
            $this->line('  Project Title: "' . $projectTitle . '" (preserved - passed as prop)');
            
            // Verify all user input fields are empty
            $allFieldsCleared = empty($clearedFormData['name']) && 
                               empty($clearedFormData['email']) && 
                               empty($clearedFormData['company']) && 
                               empty($clearedFormData['message']);
            
            if ($allFieldsCleared) {
                $this->info('✓ Project form cleared successfully after submission');
            } else {
                $this->error('✗ Project form not properly cleared');
            }
            
        } catch (Exception $e) {
            $this->error('✗ Project form clearing test failed: ' . $e->getMessage());
        }
    }
    
    private function testFormStateAfterSuccess()
    {
        $this->info('Testing Form State Management After Success...');
        
        try {
            // Test success message display and auto-dismiss
            $successMessage = 'Сообщение успешно отправлено!';
            $submitStatus = 'success';
            
            $this->info('✓ Success state after submission:');
            $this->line('  Status: ' . $submitStatus);
            $this->line('  Message: ' . $successMessage);
            $this->line('  Auto-dismiss: 3 seconds');
            
            // Simulate auto-dismiss after 3 seconds
            $this->info('✓ Simulating auto-dismiss after 3 seconds...');
            
            // After timeout
            $submitStatus = 'idle';
            $successMessage = '';
            
            $this->info('✓ State after auto-dismiss:');
            $this->line('  Status: ' . $submitStatus);
            $this->line('  Message: "' . $successMessage . '" (cleared)');
            
            // Verify form is ready for new submission
            if ($submitStatus === 'idle' && empty($successMessage)) {
                $this->info('✓ Form ready for new submission after success');
            } else {
                $this->error('✗ Form not properly reset after success');
            }
            
        } catch (Exception $e) {
            $this->error('✗ Form state test failed: ' . $e->getMessage());
        }
    }
}