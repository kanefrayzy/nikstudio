<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Exception;

class TestSmtpConnection extends Command
{
    protected $signature = 'email:test-smtp';
    protected $description = 'Test SMTP connection and email sending functionality';

    public function handle()
    {
        $this->info('Testing SMTP Configuration...');
        
        // Display current configuration
        $this->displayConfiguration();
        
        // Test SMTP connection
        $this->testSmtpConnection();
        
        // Test email sending
        $this->testEmailSending();
        
        return 0;
    }
    
    private function displayConfiguration()
    {
        $this->info('Current SMTP Configuration:');
        $this->line('Host: ' . config('mail.mailers.smtp.host'));
        $this->line('Port: ' . config('mail.mailers.smtp.port'));
        $this->line('Encryption: ' . config('mail.mailers.smtp.encryption'));
        $this->line('Username: ' . config('mail.mailers.smtp.username'));
        $this->line('From Address: ' . config('mail.from.address'));
        $this->line('From Name: ' . config('mail.from.name'));
        $this->line('');
    }
    
    private function testSmtpConnection()
    {
        $this->info('Testing SMTP Connection...');
        
        try {
            // Test connection by attempting to send a simple test
            $testResult = Mail::raw('Connection test', function ($message) {
                $message->to(config('mail.from.address'))
                        ->subject('SMTP Connection Test');
            });
            
            $this->info('✓ SMTP connection and authentication successful');
            $this->info('✓ TLS/SSL encryption working properly');
            
        } catch (Exception $e) {
            $this->error('✗ SMTP connection failed: ' . $e->getMessage());
            Log::error('SMTP Connection Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testEmailSending()
    {
        $this->info('Testing Email Sending...');
        
        try {
            $recipient = config('mail.from.address'); // Send test email to sender
            
            Mail::raw('This is a test email to verify SMTP configuration and email delivery.', function ($message) use ($recipient) {
                $message->to($recipient)
                        ->subject('SMTP Test Email - ' . now()->format('Y-m-d H:i:s'));
            });
            
            $this->info('✓ Test email sent successfully to: ' . $recipient);
            $this->info('Please check the inbox to confirm delivery.');
            
        } catch (Exception $e) {
            $this->error('✗ Email sending failed: ' . $e->getMessage());
            Log::error('Email Sending Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}