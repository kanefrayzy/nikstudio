<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactEmailRequest;
use App\Mail\ContactInquiryMail;
use App\Mail\ProjectInquiryMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Exception;

class ContactController extends Controller
{
    /**
     * Send contact form email for collaboration inquiries
     */
    public function sendContactEmail(ContactEmailRequest $request): JsonResponse
    {
        try {
            $contactData = $request->validated();
            
            // Log the contact attempt
            Log::info('Contact form submission', [
                'name' => $contactData['name'],
                'email' => $contactData['email'],
                'company' => $contactData['company'] ?? null,
                'source' => $contactData['source'],
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Send email
            Mail::send(new ContactInquiryMail($contactData));

            Log::info('Contact email sent successfully', [
                'recipient_email' => $contactData['email'],
                'source' => $contactData['source']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.'
            ], 200);

        } catch (Exception $e) {
            Log::error('Failed to send contact email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            // Check if it's a mail-specific error
            if (str_contains($e->getMessage(), 'SMTP') || 
                str_contains($e->getMessage(), 'Connection') ||
                str_contains($e->getMessage(), 'Mail')) {
                
                return response()->json([
                    'success' => false,
                    'message' => 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.'
                ], 500);
            }

            return response()->json([
                'success' => false,
                'message' => 'Произошла техническая ошибка. Пожалуйста, попробуйте позже.'
            ], 500);
        }
    }

    /**
     * Send project inquiry email for specific project inquiries
     */
    public function sendProjectInquiry(ContactEmailRequest $request): JsonResponse
    {
        try {
            $contactData = $request->validated();
            
            // Ensure source is project for this endpoint
            $contactData['source'] = 'project';
            
            // Log the project inquiry attempt
            Log::info('Project inquiry submission', [
                'name' => $contactData['name'],
                'email' => $contactData['email'],
                'company' => $contactData['company'] ?? null,
                'project_title' => $contactData['project_title'] ?? null,
                'source' => $contactData['source'],
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Send email
            Mail::send(new ProjectInquiryMail($contactData));

            Log::info('Project inquiry email sent successfully', [
                'recipient_email' => $contactData['email'],
                'project_title' => $contactData['project_title'] ?? null,
                'source' => $contactData['source']
            ]);

            $projectTitle = $contactData['project_title'] ?? null;
            $message = $projectTitle 
                ? "Ваш запрос по проекту \"{$projectTitle}\" успешно отправлен. Мы свяжемся с вами в ближайшее время."
                : 'Ваш запрос по проекту успешно отправлен. Мы свяжемся с вами в ближайшее время.';

            return response()->json([
                'success' => true,
                'message' => $message
            ], 200);

        } catch (Exception $e) {
            Log::error('Failed to send project inquiry email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            // Check if it's a mail-specific error
            if (str_contains($e->getMessage(), 'SMTP') || 
                str_contains($e->getMessage(), 'Connection') ||
                str_contains($e->getMessage(), 'Mail')) {
                
                return response()->json([
                    'success' => false,
                    'message' => 'Произошла ошибка при отправке запроса по проекту. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.'
                ], 500);
            }

            return response()->json([
                'success' => false,
                'message' => 'Произошла техническая ошибка. Пожалуйста, попробуйте позже.'
            ], 500);
        }
    }
}