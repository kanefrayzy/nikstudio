НОВЫЙ ЗАПРОС НА СОТРУДНИЧЕСТВО
=====================================

Получен через форму "ХОТИТЕ СОТРУДНИЧАТЬ?" на сайте NIK Studio

ДАННЫЕ КЛИЕНТА:
---------------

Имя: {{ $contactData['name'] }}

Email: {{ $contactData['email'] }}

@if(!empty($contactData['company']))
Компания: {{ $contactData['company'] }}

@endif
Сообщение:
{{ $contactData['message'] }}

ИНФОРМАЦИЯ О ЗАПРОСЕ:
--------------------
Источник: Форма сотрудничества ({{ $source }})
Время отправки: {{ $timestamp }}
Сайт: NIK Studio