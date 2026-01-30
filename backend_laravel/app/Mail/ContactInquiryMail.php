<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class ContactInquiryMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $contactData;
    public string $timestamp;

    /**
     * Create a new message instance.
     */
    public function __construct(array $contactData)
    {
        $this->contactData = $contactData;
        $this->timestamp = Carbon::now()->format('d.m.Y H:i:s');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: config('mail.from.address'),
            to: [config('mail.contact_recipient', 'info@nikstudio.pro')],
            subject: 'Новый запрос на сотрудничество',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.contact-inquiry',
            text: 'emails.contact-inquiry-text',
            with: [
                'contactData' => $this->contactData,
                'timestamp' => $this->timestamp,
                'source' => 'contact'
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