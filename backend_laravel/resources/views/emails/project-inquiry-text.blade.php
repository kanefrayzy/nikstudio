НОВЫЙ ЗАПРОС ПО ПРОЕКТУ
=======================

Получен через страницу проекта на сайте NIK Studio

@if($projectTitle)
ПРОЕКТ: {{ $projectTitle }}
{{ str_repeat('=', strlen($projectTitle) + 8) }}

@endif
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
Источник: Страница проекта ({{ $source }})
@if($projectTitle)
Проект: {{ $projectTitle }}
@endif
Время отправки: {{ $timestamp }}
Сайт: NIK Studio