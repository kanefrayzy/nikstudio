<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactEmailRequest;
use App\Mail\ContactInquiryMail;
use App\Mail\ProjectInquiryMail;
use App\Models\ContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Mail\Mailable;
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
        $contactData = $request->validated();

        return $this->handleInquiry(
            $request,
            $contactData,
            fn (array $data) => new ContactInquiryMail($data),
            'Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.'
        );
    }

    /**
     * Send project inquiry email for specific project inquiries
     */
    public function sendProjectInquiry(ContactEmailRequest $request): JsonResponse
    {
        $contactData = $request->validated();

        // Ensure source is project for this endpoint
        $contactData['source'] = 'project';

        $projectTitle = $contactData['project_title'] ?? null;
        $successMessage = $projectTitle
            ? "Ваш запрос по проекту \"{$projectTitle}\" успешно отправлен. Мы свяжемся с вами в ближайшее время."
            : 'Ваш запрос по проекту успешно отправлен. Мы свяжемся с вами в ближайшее время.';

        return $this->handleInquiry(
            $request,
            $contactData,
            fn (array $data) => new ProjectInquiryMail($data),
            $successMessage
        );
    }

    /**
     * Общая обработка заявки: сохранение в БД, затем попытка отправки письма.
     *
     * Заявка сохраняется ДО отправки, поэтому недоступный SMTP не приводит
     * к потере лида — такие записи видны через ContactRequest::undelivered().
     *
     * @param  callable(array): Mailable  $mailableFactory
     */
    private function handleInquiry(
        Request $request,
        array $contactData,
        callable $mailableFactory,
        string $successMessage
    ): JsonResponse {
        $contactRequest = null;

        try {
            $contactRequest = ContactRequest::create([
                'name' => $contactData['name'],
                'email' => $contactData['email'],
                'company' => $contactData['company'] ?? null,
                'message' => $contactData['message'],
                'source' => $contactData['source'],
                'project_title' => $contactData['project_title'] ?? null,
                'consent_personal_data' => (bool) ($contactData['consent_personal_data'] ?? false),
                'marketing_consent' => (bool) ($contactData['marketing_consent'] ?? false),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            Log::info('Contact request saved', [
                'id' => $contactRequest->id,
                'name' => $contactData['name'],
                'email' => $contactData['email'],
                'company' => $contactData['company'] ?? null,
                'project_title' => $contactData['project_title'] ?? null,
                'source' => $contactData['source'],
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (Exception $e) {
            // Не смогли сохранить в БД — отправка письма остаётся единственным шансом
            Log::error('Failed to save contact request', [
                'error' => $e->getMessage(),
                'source' => $contactData['source'] ?? null,
            ]);
        }

        try {
            Mail::send($mailableFactory($contactData));

            $contactRequest?->markMailSent();

            Log::info('Contact email sent successfully', [
                'contact_request_id' => $contactRequest?->id,
                'mail_to' => config('mail.contact_recipient'),
                'from_email' => $contactData['email'],
                'source' => $contactData['source'],
            ]);

            return response()->json([
                'success' => true,
                'message' => $successMessage,
            ], 200);

        } catch (Exception $e) {
            $contactRequest?->markMailFailed($e->getMessage());

            Log::error('Failed to send contact email', [
                'contact_request_id' => $contactRequest?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'source' => $contactData['source'] ?? null,
            ]);

            // Заявка сохранена в БД — для клиента это успех, лид не потерян
            if ($contactRequest) {
                return response()->json([
                    'success' => true,
                    'message' => $successMessage,
                ], 200);
            }

            // Ни письма, ни записи в БД — только в этом случае сообщаем об ошибке
            if (str_contains($e->getMessage(), 'SMTP') ||
                str_contains($e->getMessage(), 'Connection') ||
                str_contains($e->getMessage(), 'Mail')) {

                return response()->json([
                    'success' => false,
                    'message' => 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже или свяжитесь с нами напрямую.',
                ], 500);
            }

            return response()->json([
                'success' => false,
                'message' => 'Произошла техническая ошибка. Пожалуйста, попробуйте позже.',
            ], 500);
        }
    }
}
