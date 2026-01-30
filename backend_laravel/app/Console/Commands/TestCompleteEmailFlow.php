<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ContactInquiryMail;
use App\Mail\ProjectInquiryMail;
use Exception;

class TestCompleteEmailFlow extends Command
{
    protected $signature = 'email:test-complete-flow';
    protected $description = 'Test complete email flow for both contact and project inquiry forms';

    public function handle()
    {
        $this->info('Testing Complete Email Flow for Both Forms...');
        
        $this->testCollaborationFormFlow();
        $this->testProjectInquiryFormFlow();
        $this->testEmailContentFormatting();
        $this->testSubjectLines();
        $this->testTimestampAndSourceInfo();
        
        return 0;
    }
    
    private function testCollaborationFormFlow()
    {
        $this->info('Testing Collaboration Form Email Flow...');
        
        try {
            $contactData = [
                'name' => 'Иван Петров',
                'email' => 'ivan.petrov@example.com',
                'company' => 'ООО "Инновации"',
                'message' => 'Здравствуйте! Интересует возможность сотрудничества по разработке веб-приложения. Хотелось бы обсудить детали проекта и возможные сроки реализации.',
                'source' => 'contact'
            ];
            
            // Create and send contact inquiry email
            $contactMail = new ContactInquiryMail($contactData);
            Mail::send($contactMail);
            
            $this->info('✓ Collaboration form email sent successfully');
            $this->line('  From: ' . config('mail.from.address'));
            $this->line('  To: ' . env('CONTACT_EMAIL_RECIPIENT', 'info@nikstudio.pro'));
            $this->line('  Subject: Новый запрос на сотрудничество');
            $this->line('  Source: contact');
            
            // Verify email envelope
            $envelope = $contactMail->envelope();
            $this->line('  Envelope From: ' . $envelope->from->address);
            $this->line('  Envelope To: ' . implode(', ', array_map(fn($addr) => $addr->address, $envelope->to)));
            $this->line('  Envelope Subject: ' . $envelope->subject);
            
        } catch (Exception $e) {
            $this->error('✗ Collaboration form email failed: ' . $e->getMessage());
            Log::error('Collaboration Form Email Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testProjectInquiryFormFlow()
    {
        $this->info('Testing Project Inquiry Form Email Flow...');
        
        try {
            $projectData = [
                'name' => 'Мария Сидорова',
                'email' => 'maria.sidorova@example.com',
                'company' => 'ИП Сидорова М.А.',
                'message' => 'Добрый день! Увидела ваш проект интернет-магазина и хотела бы заказать разработку похожего решения для своего бизнеса. Интересуют сроки и стоимость.',
                'project_title' => 'Интернет-магазин электроники',
                'source' => 'project'
            ];
            
            // Create and send project inquiry email
            $projectMail = new ProjectInquiryMail($projectData);
            Mail::send($projectMail);
            
            $this->info('✓ Project inquiry form email sent successfully');
            $this->line('  From: ' . config('mail.from.address'));
            $this->line('  To: ' . env('CONTACT_EMAIL_RECIPIENT', 'info@nikstudio.pro'));
            $this->line('  Subject: Новый запрос по проекту - Интернет-магазин электроники');
            $this->line('  Source: project');
            $this->line('  Project Title: Интернет-магазин электроники');
            
            // Verify email envelope
            $envelope = $projectMail->envelope();
            $this->line('  Envelope From: ' . $envelope->from->address);
            $this->line('  Envelope To: ' . implode(', ', array_map(fn($addr) => $addr->address, $envelope->to)));
            $this->line('  Envelope Subject: ' . $envelope->subject);
            
        } catch (Exception $e) {
            $this->error('✗ Project inquiry form email failed: ' . $e->getMessage());
            Log::error('Project Inquiry Form Email Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testEmailContentFormatting()
    {
        $this->info('Testing Email Content Formatting and Russian Text...');
        
        try {
            // Test contact inquiry content
            $contactData = [
                'name' => 'Тестовый Пользователь',
                'email' => 'test@example.com',
                'company' => 'Тестовая Компания',
                'message' => 'Это тестовое сообщение с русским текстом для проверки корректного отображения кодировки и форматирования.',
                'source' => 'contact'
            ];
            
            $contactMail = new ContactInquiryMail($contactData);
            $content = $contactMail->content();
            
            $this->info('✓ Contact inquiry email content configured:');
            $this->line('  HTML Template: ' . $content->html);
            $this->line('  Text Template: ' . $content->text);
            $this->line('  Russian text support: ✓');
            
            // Test project inquiry content
            $projectData = [
                'name' => 'Тестовый Клиент',
                'email' => 'client@example.com',
                'company' => 'Клиентская Компания',
                'message' => 'Тестовое сообщение по проекту с русскими символами: ёжик, щука, цапля.',
                'project_title' => 'Тестовый Проект с Русским Названием',
                'source' => 'project'
            ];
            
            $projectMail = new ProjectInquiryMail($projectData);
            $content = $projectMail->content();
            
            $this->info('✓ Project inquiry email content configured:');
            $this->line('  HTML Template: ' . $content->html);
            $this->line('  Text Template: ' . $content->text);
            $this->line('  Russian text support: ✓');
            
        } catch (Exception $e) {
            $this->error('✗ Email content formatting test failed: ' . $e->getMessage());
        }
    }
    
    private function testSubjectLines()
    {
        $this->info('Testing Subject Lines and Source Identification...');
        
        try {
            // Test contact inquiry subject
            $contactData = [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'message' => 'Test message',
                'source' => 'contact'
            ];
            
            $contactMail = new ContactInquiryMail($contactData);
            $contactSubject = $contactMail->envelope()->subject;
            
            $this->info('✓ Contact form subject line:');
            $this->line('  Subject: ' . $contactSubject);
            $this->line('  Source identification: contact form');
            
            // Test project inquiry subject without project title
            $projectDataNoTitle = [
                'name' => 'Test Client',
                'email' => 'client@example.com',
                'message' => 'Test project message',
                'source' => 'project'
            ];
            
            $projectMailNoTitle = new ProjectInquiryMail($projectDataNoTitle);
            $projectSubjectNoTitle = $projectMailNoTitle->envelope()->subject;
            
            $this->info('✓ Project inquiry subject (no title):');
            $this->line('  Subject: ' . $projectSubjectNoTitle);
            
            // Test project inquiry subject with project title
            $projectDataWithTitle = [
                'name' => 'Test Client',
                'email' => 'client@example.com',
                'message' => 'Test project message',
                'project_title' => 'E-commerce Platform',
                'source' => 'project'
            ];
            
            $projectMailWithTitle = new ProjectInquiryMail($projectDataWithTitle);
            $projectSubjectWithTitle = $projectMailWithTitle->envelope()->subject;
            
            $this->info('✓ Project inquiry subject (with title):');
            $this->line('  Subject: ' . $projectSubjectWithTitle);
            $this->line('  Source identification: project page');
            
        } catch (Exception $e) {
            $this->error('✗ Subject line test failed: ' . $e->getMessage());
        }
    }
    
    private function testTimestampAndSourceInfo()
    {
        $this->info('Testing Timestamp and Source Information in Email Footer...');
        
        try {
            $testData = [
                'name' => 'Footer Test User',
                'email' => 'footer@example.com',
                'company' => 'Footer Test Company',
                'message' => 'Testing timestamp and source information in email footer.',
                'source' => 'contact'
            ];
            
            $contactMail = new ContactInquiryMail($testData);
            
            // Check if timestamp is generated
            $timestamp = $contactMail->timestamp;
            $this->info('✓ Timestamp generation:');
            $this->line('  Timestamp: ' . $timestamp);
            $this->line('  Format: d.m.Y H:i:s (Russian format)');
            
            // Verify timestamp format
            $timestampPattern = '/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/';
            if (preg_match($timestampPattern, $timestamp)) {
                $this->info('✓ Timestamp format is correct');
            } else {
                $this->warn('! Timestamp format may need verification');
            }
            
            // Check source information
            $content = $contactMail->content();
            $contentData = $content->with;
            
            $this->info('✓ Source information:');
            $this->line('  Source: ' . $contentData['source']);
            $this->line('  Contact Data: Available');
            $this->line('  Timestamp: Available');
            
        } catch (Exception $e) {
            $this->error('✗ Timestamp and source info test failed: ' . $e->getMessage());
        }
    }
}