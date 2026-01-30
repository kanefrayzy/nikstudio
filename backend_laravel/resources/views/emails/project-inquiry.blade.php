<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Новый запрос по проекту</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .field {
            margin-bottom: 15px;
        }
        .field-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .field-value {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            border-left: 4px solid #28a745;
        }
        .project-title {
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; color: #28a745;">Новый запрос по проекту</h1>
        <p style="margin: 10px 0 0 0; color: #6c757d;">Получен через страницу проекта на сайте NIK Studio</p>
    </div>

    @if($projectTitle)
    <div class="project-title">
        <h2 style="margin: 0; color: #155724;">Проект: {{ $projectTitle }}</h2>
    </div>
    @endif

    <div class="content">
        <div class="field">
            <div class="field-label">Имя:</div>
            <div class="field-value">{{ $contactData['name'] }}</div>
        </div>

        <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value">{{ $contactData['email'] }}</div>
        </div>

        @if(!empty($contactData['company']))
        <div class="field">
            <div class="field-label">Компания:</div>
            <div class="field-value">{{ $contactData['company'] }}</div>
        </div>
        @endif

        <div class="field">
            <div class="field-label">Сообщение:</div>
            <div class="field-value message-content">{{ $contactData['message'] }}</div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Информация о запросе:</strong></p>
        <p>Источник: Страница проекта ({{ $source }})</p>
        @if($projectTitle)
        <p>Проект: {{ $projectTitle }}</p>
        @endif
        <p>Время отправки: {{ $timestamp }}</p>
        <p>Сайт: NIK Studio</p>
    </div>
</body>
</html>