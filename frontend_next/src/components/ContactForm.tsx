'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ContactEmailService, ContactFormData, EmailServiceError } from '@/lib/services/ContactEmailService';

type ContactFormProps = {
  className?: string;
  source?: 'project' | 'contact';
  projectTitle?: string;
};

type FieldErrors = {
  name: string[];
  email: string[];
  company: string[];
  message: string[];
  consent_personal_data: string[];
};

type TouchedFields = {
  name: boolean;
  email: boolean;
  company: boolean;
  message: boolean;
  consent_personal_data: boolean;
};

const ContactForm = ({ className = "", source = 'contact', projectTitle }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Антиспам. Поле-приманка скрыто от людей — его заполняют только боты,
  // которые проходят по всем input'ам формы
  const [honeypot, setHoneypot] = useState('');
  // Момент открытия формы: мгновенная отправка означает автозаполнение
  const formLoadedAt = useRef(0);
  useEffect(() => {
    formLoadedAt.current = Date.now();
  }, []);
  const [showPrivacyText, setShowPrivacyText] = useState(false);
  const [showMarketingText, setShowMarketingText] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    name: false,
    email: false,
    company: false,
    message: false,
    consent_personal_data: false
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    name: [],
    email: [],
    company: [],
    message: [],
    consent_personal_data: []
  });

  // Validation functions
  const validateName = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) {
      errors.push('Это поле обязательно для заполнения');
    } else if (value.trim().length < 2) {
      errors.push('Минимальная длина: 2 символа');
    }
    return errors;
  };

  const validateEmail = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) {
      errors.push('Это поле обязательно для заполнения');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push('Введите корректный email адрес');
      }
    }
    return errors;
  };

  const validateMessage = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) {
      errors.push('Это поле обязательно для заполнения');
    } else if (value.trim().length < 10) {
      errors.push('Минимальная длина: 10 символов');
    }
    return errors;
  };

  const validateField = (field: keyof typeof formData, value: string) => {
    let errors: string[] = [];

    switch (field) {
      case 'name':
        errors = validateName(value);
        break;
      case 'email':
        errors = validateEmail(value);
        break;
      case 'message':
        errors = validateMessage(value);
        break;
      default:
        errors = [];
    }

    setFieldErrors(prev => ({ ...prev, [field]: errors }));
    return errors;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate field if it has been touched
    if (touchedFields[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: keyof typeof formData) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    setTouchedFields({
      name: true,
      email: true,
      company: true,
      message: true,
      consent_personal_data: true
    });

    const nameErrors = validateField('name', formData.name);
    const emailErrors = validateField('email', formData.email);
    const messageErrors = validateField('message', formData.message);
    const consentErrors: string[] = consentPersonalData
      ? []
      : ['Необходимо согласие на обработку персональных данных'];
    setFieldErrors(prev => ({ ...prev, consent_personal_data: consentErrors }));

    const hasErrors =
      nameErrors.length > 0 ||
      emailErrors.length > 0 ||
      messageErrors.length > 0 ||
      consentErrors.length > 0;

    if (hasErrors) {
      setSubmitStatus('error');
      setSubmitMessage('Пожалуйста, исправьте ошибки в форме');
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);
      return;
    }

    setSubmitStatus('submitting');

    try {
      // Prepare form data for API call
      const emailData: ContactFormData = {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        message: formData.message,
        source,
        project_title: projectTitle,
        consent_personal_data: consentPersonalData,
        marketing_consent: marketingConsent,
        website: honeypot,
        form_loaded_at: formLoadedAt.current
      };

      // Call appropriate email service method based on source
      const response = source === 'project'
        ? await ContactEmailService.sendProjectInquiry(emailData)
        : await ContactEmailService.sendContactEmail(emailData);

      if (response.success) {
        setSubmitStatus('success');
        setSubmitMessage('Сообщение успешно отправлено!');

        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          company: '',
          message: ''
        });
        setConsentPersonalData(false);
        setMarketingConsent(false);
        setHoneypot('');
        formLoadedAt.current = Date.now();
        setTouchedFields({
          name: false,
          email: false,
          company: false,
          message: false,
          consent_personal_data: false
        });
        setFieldErrors({
          name: [],
          email: [],
          company: [],
          message: [],
          consent_personal_data: []
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(response.message || 'Произошла ошибка при отправке сообщения');
      }

      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);

    } catch (error) {
      setSubmitStatus('error');

      // Handle EmailServiceError with specific error messages
      if (error instanceof EmailServiceError) {
        setSubmitMessage(ContactEmailService.getErrorMessage(error));
      } else {
        setSubmitMessage('Произошла ошибка при отправке сообщения');
      }

      // Form data persists during errors for user retry (don't reset formData)
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitMessage('');
      }, 3000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex -mt-7 sm:mt-0 flex-col gap-4 sm:gap-6 lg:gap-8 3xl:gap-12 w-full ${className}`}
    >
      {/*
        Поле-приманка для ботов. Скрыто от людей и от скринридеров, исключено
        из обхода по Tab и из автозаполнения — заполнить его может только бот.
      */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contact-website">Не заполняйте это поле</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-8 3xl:gap-12 w-full">
        {/* Name Field */}
        <div className="flex flex-col gap-3 3xl:gap-5 flex-1">
          <label className="text-white/60 text-[20px] 3xl:text-[28px] leading-[100%] font-geometria font-normal">
            Имя *
          </label>
          <div className="bg-[#181A1B] border-2 border-white/20 px-3 sm:px-5 py-4 3xl:px-8 3xl:py-6">
            <input
              name="name"
              type="text"
              placeholder="Имя"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              className="bg-transparent w-full text-base lg:text-[18px] 3xl:text-[24px] leading-[180%] text-white placeholder:text-[#595959] outline-none font-inter"
            />
          </div>
          {touchedFields.name && fieldErrors.name.length > 0 && (
            <div className="space-y-1">
              {fieldErrors.name.map((error, index) => (
                <div key={index} className="text-sm text-red-400">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="flex flex-col gap-3 3xl:gap-5 flex-1">
          <label className="text-white/60 text-[20px] 3xl:text-[28px] leading-[100%] font-geometria font-normal">
            Email *
          </label>
          <div className="bg-[#181A1B] border-2 border-white/20 px-3 sm:px-5 py-4 3xl:px-8 3xl:py-6">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              className="bg-transparent w-full text-base lg:text-[18px] 3xl:text-[24px] leading-[180%] text-white placeholder:text-[#595959] outline-none font-inter"
            />
          </div>
          {touchedFields.email && fieldErrors.email.length > 0 && (
            <div className="space-y-1">
              {fieldErrors.email.map((error, index) => (
                <div key={index} className="text-sm text-red-400">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company Field */}
      <div className="w-full mt-4 sm:mt-0">
        <div className="bg-[#181A1B] border-2 border-white/20 px-3 sm:px-5 py-4 3xl:px-8 3xl:py-6">
          <input
            name="company"
            type="text"
            placeholder="Компания"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className="bg-transparent w-full text-base lg:text-[18px] 3xl:text-[24px] leading-[180%] text-white placeholder:text-[#595959] outline-none font-inter"
          />
        </div>
      </div>

      {/* Message Field */}
      <div className="w-full mt-4 sm:mt-0">
        <label className="text-white/60 text-[20px] 3xl:text-[28px] leading-[100%] font-geometria font-normal block mb-3 3xl:mb-5">
          Сообщение *
        </label>
        <div className="bg-[#181A1B] border-2 border-white/20 px-3 sm:px-5 py-4 3xl:px-8 3xl:py-6 h-34 sm:h-[140px] 3xl:h-[200px]">
          <textarea
            name="message"
            placeholder="Сообщение"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            onBlur={() => handleFieldBlur('message')}
            className="bg-transparent w-full h-full text-base lg:text-[18px] 3xl:text-[24px] leading-[180%] text-white placeholder:text-[#595959] outline-none resize-none font-inter"
          />
        </div>
        {touchedFields.message && fieldErrors.message.length > 0 && (
          <div className="space-y-1 mt-2">
            {fieldErrors.message.map((error, index) => (
              <div key={index} className="text-sm text-red-400">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Status Message */}
      {submitMessage && (
        <div className={`p-3 rounded-md text-sm ${submitStatus === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
          {submitMessage}
        </div>
      )}

      {/* Consent checkboxes */}
      <div className="flex flex-col gap-4 sm:gap-5 mt-2">
        {/* Privacy consent (required) */}
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentPersonalData}
              onChange={(e) => {
                setConsentPersonalData(e.target.checked);
                if (touchedFields.consent_personal_data) {
                  setFieldErrors(prev => ({
                    ...prev,
                    consent_personal_data: e.target.checked
                      ? []
                      : ['Необходимо согласие на обработку персональных данных']
                  }));
                }
              }}
              onBlur={() => setTouchedFields(prev => ({ ...prev, consent_personal_data: true }))}
              className="mt-1 h-5 w-5 shrink-0 accent-[#DE063A] cursor-pointer"
              aria-required="true"
            />
            <span className="text-white/80 font-inter text-sm sm:text-base leading-relaxed">
              Я даю согласие на обработку персональных данных в соответствии с{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPrivacyText(v => !v); }}
                className="underline underline-offset-2 text-white hover:text-[#DE063A] transition-colors"
              >
                Политикой обработки персональных данных
              </button>
              {' *'}
            </span>
          </label>
          {showPrivacyText && (
            <div className="ml-8 p-4 bg-[#181A1B] border border-white/10 rounded-md text-white/70 font-inter text-xs sm:text-sm leading-relaxed space-y-2 max-h-64 overflow-y-auto">
              <p>
                Отправляя форму, я даю согласие ИП Никитин В.А. (ИНН 501306829802) на обработку
                моих персональных данных (имя, email, название компании, текст сообщения) в целях
                рассмотрения обращения и обратной связи.
              </p>
              <p>
                Обработка персональных данных осуществляется в соответствии с Федеральным законом
                от 27.07.2006 № 152-ФЗ «О персональных данных». Согласие может быть отозвано в любой
                момент путём направления соответствующего обращения на info@nikstudio.pro.
              </p>
              <p>
                Полный текст{' '}
                <Link href="/privacy" className="underline hover:text-white">
                  Политики обработки персональных данных
                </Link>
                .
              </p>
            </div>
          )}
          {touchedFields.consent_personal_data && fieldErrors.consent_personal_data.length > 0 && (
            <div className="ml-8 text-sm text-red-400">
              {fieldErrors.consent_personal_data[0]}
            </div>
          )}
        </div>

        {/* Marketing consent (optional) */}
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#DE063A] cursor-pointer"
            />
            <span className="text-white/80 font-inter text-sm sm:text-base leading-relaxed">
              Я хочу получать полезные материалы и другие новостные и рекламные рассылки{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowMarketingText(v => !v); }}
                className="underline underline-offset-2 text-white/60 hover:text-[#DE063A] transition-colors"
              >
                подробнее
              </button>
            </span>
          </label>
          {showMarketingText && (
            <div className="ml-8 p-4 bg-[#181A1B] border border-white/10 rounded-md text-white/70 font-inter text-xs sm:text-sm leading-relaxed">
              Отметив этот пункт, вы соглашаетесь получать на указанный email информационные
              материалы NIK Studio: статьи, кейсы, анонсы услуг и специальные предложения.
              Отписаться можно в любой момент по ссылке внизу любого письма.
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitStatus === 'submitting'}
        className={`mt-4 sm:mt-0 flex flex-row justify-center items-center py-7 sm:py-4 px-5 sm:px-[26px] gap-2 w-full h-12 sm:h-[54px] 3xl:h-[70px] 3xl:text-[28px] text-[22px] font-semibold rounded-full mx-auto font-inter transition-colors duration-300 ${submitStatus === 'submitting'
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-white text-[#0E1011] hover:cursor-pointer hover:bg-[#DE063A] hover:text-white'
          }`}
      >
        {submitStatus === 'submitting' ? 'Отправка...' : 'Отправить запрос'}
      </button>
    </form>
  );
};

export default ContactForm;