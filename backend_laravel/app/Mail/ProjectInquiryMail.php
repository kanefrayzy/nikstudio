<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ProjectInquiryMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $contactData;
    public string $timestamp;
    public ?string $projectTitle;

    /**
     * Create a new message instance.
     */
    public function __construct(array $contactData)
    {
        $this->contactData = $contactData;
        $this->timestamp = Carbon::now()->format('d.m.Y H:i:s');
        $this->projectTitle = $contactData['project_title'] ?? null;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->projectTitle 
            ? "Новый запрос по проекту - {$this->projectTitle}"
            : 'Новый запрос по проекту';

        return new Envelope(
            from: config('mail.from.address'),
            to: [config('mail.contact_recipient', 'info@nikstudio.pro')],
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.project-inquiry',
            text: 'emails.project-inquiry-text',
            with: [
                'contactData' => $this->contactData,
                'timestamp' => $this->timestamp,
                'projectTitle' => $this->projectTitle,
                'source' => 'project'
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}