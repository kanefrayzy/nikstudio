/**
 * Demo component showcasing cross-browser form validation compatibility
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ValidatedForm, 
  ValidatedInput, 
  EmailInput, 
  UrlInput, 
  NumberInput 
} from '@/components/ui/validated-input';

import { formValidationUtils } from '@/lib/form-validation-compatibility';

export const FormValidationDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    age: '',
    phone: '',
    message: ''
  });
  
  const [submitResult, setSubmitResult] = useState<string>('');


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitResult('Форма успешно отправлена! ✅');
    setTimeout(() => setSubmitResult(''), 3000);
  };

  const handleValidationChange = (isValid: boolean, errors: Record<string, string[]>) => {
    console.log('Form validation state:', { isValid, errors });
  };

  const testValidationUtils = () => {
    const emailTest = formValidationUtils.validateEmail('test@example.com');
    const urlTest = formValidationUtils.validateUrl('https://example.com');
    const numberTest = formValidationUtils.validateNumber('42', 0, 100);
    
    console.log('Validation utils test:', { emailTest, urlTest, numberTest });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Совместимость валидации форм</CardTitle>
          <CardDescription>
            Демонстрация кроссбраузерной валидации форм с поддержкой старых браузеров
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Browser Capabilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Возможности браузера</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Нативная валидация:</span>
                  <Badge variant="default">
                    Поддерживается
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Constraint Validation API:</span>
                  <Badge variant="default">
                    Поддерживается
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span>Поддерживаемые типы input:</span>
                  <div className="flex flex-wrap gap-1">
                    {['text', 'email', 'number', 'tel', 'url'].map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button onClick={testValidationUtils} variant="outline" size="sm">
                Тест утилит валидации
              </Button>
            </div>

            {/* Form Demo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Демо форма</h3>
              
              <ValidatedForm
                onSubmit={handleSubmit}
                onValidationChange={handleValidationChange}
                validationOptions={{
                  showNativeMessages: false,
                  validateOnInput: true,
                  validateOnBlur: true,
                  highlightInvalidFields: true
                }}
                className="space-y-4"
              >
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <ValidatedInput
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    validationRules={{ required: true, minLength: 2 }}
                    placeholder="Введите ваше имя"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <EmailInput
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="example@domain.com"
                  />
                </div>

                {/* Website Field */}
                <div className="space-y-2">
                  <Label htmlFor="website">Веб-сайт</Label>
                  <UrlInput
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                {/* Age Field */}
                <div className="space-y-2">
                  <Label htmlFor="age">Возраст</Label>
                  <NumberInput
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    min={18}
                    max={120}
                    placeholder="Введите ваш возраст"
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <ValidatedInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    validationRules={{ 
                      type: 'tel',
                      pattern: /^[\+]?[1-9][\d]{0,15}$/
                    }}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Введите ваше сообщение"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Отправить форму
                </Button>

                {submitResult && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                    {submitResult}
                  </div>
                )}
              </ValidatedForm>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Features */}
      <Card>
        <CardHeader>
          <CardTitle>Функции валидации</CardTitle>
          <CardDescription>
            Обзор реализованных функций кроссбраузерной валидации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">HTML5 Полифиллы</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Валидация email</li>
                <li>• Валидация URL</li>
                <li>• Валидация чисел</li>
                <li>• Валидация телефонов</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Фолбэки типов input</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• email → text + валидация</li>
                <li>• url → text + валидация</li>
                <li>• number → text + валидация</li>
                <li>• tel → text + валидация</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Кастомные сообщения</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Стилизация ошибок</li>
                <li>• Предупреждения</li>
                <li>• Кроссбраузерность</li>
                <li>• Локализация</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Технические детали</CardTitle>
          <CardDescription>
            Информация о реализации и совместимости
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Поддерживаемые браузеры:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>Chrome 80+</div>
                <div>Firefox 78+</div>
                <div>Safari 12+</div>
                <div>Edge 79+</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Стратегия совместимости:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Обнаружение возможностей браузера</li>
                <li>• Автоматические фолбэки для неподдерживаемых типов</li>
                <li>• Полифиллы для HTML5 валидации</li>
                <li>• Кастомные сообщения об ошибках</li>
                <li>• Прогрессивное улучшение</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};