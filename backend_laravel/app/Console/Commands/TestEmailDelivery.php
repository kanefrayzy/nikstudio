<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Exception;

class TestEmailDelivery extends Command
{
    protected $signature = 'email:test-delivery';
    protected $description = 'Test email delivery to info@nikstudio.pro from hello@nikstudio.pro';

    public function handle()
    {
        $this->info('Testing Email Delivery System...');
        
        $this->testDeliveryToRecipient();
        $this->testEmailAuthentication();
        $this->testEncryption();
        
        return 0;
    }
    
    private function testDeliveryToRecipient()
    {
        $this->info('Testing email delivery to info@nikstudio.pro...');
        
        try {
            $recipient = env('CONTACT_EMAIL_RECIPIENT', 'info@nikstudio.pro');
            $sender = env('MAIL_FROM_ADDRESS', 'hello@nikstudio.pro');
            
            Mail::raw(
                "This is a test email to verify delivery from {$sender} to {$recipient}.\n\n" .
                "Test performed at: " . now()->format('Y-m-d H:i:s') . "\n" .
                "SMTP Server: " . config('mail.mailers.smtp.host') . "\n" .
                "Port: " . config('mail.mailers.smtp.port') . "\n" .
                "Encryption: " . config('mail.mailers.smtp.encryption'),
                function ($message) use ($recipient, $sender) {
                    $message->to($recipient)
                            ->from($sender, 'NIK Studio')
                            ->subject('Email Delivery Test - ' . now()->format('Y-m-d H:i:s'));
                }
            );
            
            $this->info("✓ Email sent successfully from {$sender} to {$recipient}");
            $this->info('Please check the recipient inbox to confirm delivery.');
            
        } catch (Exception $e) {
            $this->error('✗ Email delivery failed: ' . $e->getMessage());
            Log::error('Email Delivery Test Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testEmailAuthentication()
    {
        $this->info('Testing SMTP authentication...');
        
        try {
            $username = config('mail.mailers.smtp.username');
            $host = config('mail.mailers.smtp.host');
            
            if ($username && $host) {
                $this->info("✓ SMTP credentials configured:");
                $this->line("  Username: {$username}");
                $this->line("  Host: {$host}");
                
                // Test authentication by sending an email
                Mail::raw('Authentication test', function ($message) {
                    $message->to(config('mail.from.address'))
                            ->subject('SMTP Authentication Test');
                });
                
                $this->info('✓ SMTP authentication successful');
            } else {
                $this->error('✗ SMTP credentials not properly configured');
            }
            
        } catch (Exception $e) {
            $this->error('✗ SMTP authentication failed: ' . $e->getMessage());
        }
    }
    
    private function testEncryption()
    {
        $this->info('Testing TLS/SSL encryption...');
        
        try {
            $encryption = config('mail.mailers.smtp.encryption');
            $port = config('mail.mailers.smtp.port');
            
            $this->info("✓ Encryption configured:");
            $this->line("  Type: {$encryption}");
            $this->line("  Port: {$port}");
            
            if ($encryption === 'ssl' && $port == 465) {
                $this->info('✓ SSL encryption on port 465 - Configuration correct');
            } elseif ($encryption === 'tls' && $port == 587) {
                $this->info('✓ TLS encryption on port 587 - Configuration correct');
            } else {
                $this->warn('! Encryption/port combination may need verification');
            }
            
        } catch (Exception $e) {
            $this->error('✗ Encryption test failed: ' . $e->getMessage());
        }
    }
}