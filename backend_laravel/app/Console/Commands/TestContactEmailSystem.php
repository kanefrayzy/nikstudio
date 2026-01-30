<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ContactInquiryMail;
use App\Mail\ProjectInquiryMail;
use Exception;

class TestContactEmailSystem extends Command
{
    protected $signature = 'email:test-contact-system';
    protected $description = 'Test complete contact email system functionality';

    public function handle()
    {
        $this->info('Testing Complete Contact Email System...');
        
        $this->testContactInquiryEmail();
        $this->testProjectInquiryEmail();
        $this->testEmailConfiguration();
        
        return 0;
    }
    
    private function testContactInquiryEmail()
    {
        $this->info('Testing Contact Inquiry Email...');
        
        try {
            $testData = [
                'name' => 'Тестовый Пользователь',
                'email' => 'test@example.com',
                'company' => 'Тестовая Компания',
                'message' => 'Это тестовое сообщение для проверки системы отправки email.',
                'source' => 'contact'
            ];
            
            Mail::send(new ContactInquiryMail($testData));
            
            $this->info('✓ Contact inquiry email sent successfully');
            $this->line('  Subject: Новый запрос на сотрудничество');
            $this->line('  From: ' . config('mail.from.address'));
            $this->line('  To: ' . env('CONTACT_EMAIL_RECIPIENT', 'info@nikstudio.pro'));
            
        } catch (Exception $e) {
            $this->error('✗ Contact inquiry email failed: ' . $e->getMessage());
            Log::error('Contact Inquiry Email Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testProjectInquiryEmail()
    {
        $this->info('Testing Project Inquiry Email...');
        
        try {
            $testData = [
                'name' => 'Тестовый Клиент',
                'email' => 'client@example.com',
                'company' => 'Клиентская Компания',
                'message' => 'Интересует разработка похожего проекта.',
                'project_title' => 'Тестовый Проект',
                'source' => 'project'
            ];
            
            Mail::send(new ProjectInquiryMail($testData));
            
            $this->info('✓ Project inquiry email sent successfully');
            $this->line('  Subject: Новый запрос по проекту - Тестовый Проект');
            $this->line('  From: ' . config('mail.from.address'));
            $this->line('  To: ' . env('CONTACT_EMAIL_RECIPIENT', 'info@nikstudio.pro'));
            
        } catch (Exception $e) {
            $this->error('✗ Project inquiry email failed: ' . $e->getMessage());
            Log::error('Project Inquiry Email Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testEmailConfiguration()
    {
        $this->info('Verifying Email Configuration...');
        
        // Check mail configuration
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name');
        $recipient = env('CONTACT_EMAIL_RECIPIENT');
        
        $this->info('✓ Email Configuration:');
        $this->line("  From Address: {$fromAddress}");
        $this->line("  From Name: {$fromName}");
        $this->line("  Recipient: {$recipient}");
        
        // Verify SMTP settings
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $encryption = config('mail.mailers.smtp.encryption');
        $username = config('mail.mailers.smtp.username');
        
        $this->info('✓ SMTP Configuration:');
        $this->line("  Host: {$host}");
        $this->line("  Port: {$port}");
        $this->line("  Encryption: {$encryption}");
        $this->line("  Username: {$username}");
        
        // Check if sending from hello@nikstudio.pro to info@nikstudio.pro
        if ($fromAddress === 'hello@nikstudio.pro' && $recipient === 'info@nikstudio.pro') {
            $this->info('✓ Email routing configured correctly: hello@nikstudio.pro → info@nikstudio.pro');
        } else {
            $this->warn('! Email routing may need verification');
        }
    }
}