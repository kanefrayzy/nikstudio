# Централизованный API Client - Руководство по использованию

## Обзор

Файл `src/lib/api.ts` предоставляет централизованный API клиент для работы с backend Laravel. Он автоматически обрабатывает:

- ✅ Добавление токена авторизации в заголовки
- ✅ Автоматическое обновление токенов (X-New-Token header)
- ✅ Обработку 401 ошибок с редиректом на /admin/login
- ✅ Обработку 403 ошибок с уведомлением пользователя
- ✅ Передачу credentials для CORS запросов

## Базовое использование

### Импорт

```typescript
import { get, post, put, del, patch } from '@/lib/api';
// или
import apiClient from '@/lib/api'; // для прямого использования axios instance
```

### GET запросы

```typescript
// Простой GET запрос
const data = await get('/api/admin/projects');

// GET с параметрами
const data = await get('/api/admin/projects', {
  params: { page: 1, limit: 10 }
});

// С типизацией
interface Project {
  id: number;
  title: string;
  slug: string;
}

const projects = await get<Project[]>('/api/admin/projects');
```

### POST запросы

```typescript
// Простой POST
const result = await post('/api/admin/projects', {
  title: 'Новый проект',
  slug: 'novyj-proekt'
});

// POST с FormData (для загрузки файлов)
const formData = new FormData();
formData.append('title', 'Проект');
formData.append('image', fileObject);

const result = await post('/api/admin/projects', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### PUT запросы

```typescript
// Обновление данных
const result = await put('/api/admin/projects/1', {
  title: 'Обновлённый заголовок'
});
```

### DELETE запросы

```typescript
// Удаление
const result = await del('/api/admin/projects/1');
```

### PATCH запросы

```typescript
// Частичное обновление
const result = await patch('/api/admin/projects/1', {
  status: 'published'
});
```

## Обработка ошибок

```typescript
try {
  const data = await post('/api/admin/projects', projectData);
  console.log('Успех:', data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      // Ошибки валидации
      const errors = error.response.data.errors;
      console.error('Ошибки валидации:', errors);
    } else if (error.response?.status === 413) {
      // Файл слишком большой
      console.error('Файл превышает допустимый размер');
    } else {
      // Другие ошибки
      console.error('Ошибка:', error.response?.data?.message);
    }
  }
}
```

## Автоматическая обработка токенов

API клиент автоматически:

1. **Добавляет токен в заголовки**: Извлекает токен из cookie `admin-token` и добавляет в `Authorization: Bearer {token}`

2. **Обновляет токен**: Если backend возвращает новый токен в заголовке `X-New-Token`, он автоматически сохраняется в cookie

3. **Обрабатывает 401**: При получении 401 ошибки:
   - Удаляет токен из cookie
   - Перенаправляет на `/admin/login`

4. **Обрабатывает 403**: При получении 403 ошибки показывает уведомление пользователю

## Утилиты для работы с токенами

```typescript
import { getTokenFromCookie, saveTokenToCookie, removeTokenFromCookie } from '@/lib/api';

// Получить токен
const token = getTokenFromCookie();

// Сохранить токен (с указанием времени жизни в секундах)
saveTokenToCookie('new-token', 28800); // 8 часов

// Удалить токен
removeTokenFromCookie();
```

## Примеры использования в компонентах

### Пример 1: Загрузка списка проектов

```typescript
'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/api';

interface Project {
  id: number;
  title: string;
  slug: string;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await get<{ data: Project[] }>('/api/admin/projects');
        setProjects(data.data);
      } catch (err) {
        setError('Ошибка загрузки проектов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.title}</div>
      ))}
    </div>
  );
}
```

### Пример 2: Создание проекта с загрузкой файла

```typescript
'use client';

import { useState } from 'react';
import { post } from '@/lib/api';

export default function CreateProject() {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      setError('Выберите изображение');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('image', image);

      const result = await post('/api/admin/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Проект создан:', result);
      
      // Очистка формы
      setTitle('');
      setImage(null);
      
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError(err.response.data.errors?.title?.[0] || 'Ошибка валидации');
      } else if (err.response?.status === 413) {
        setError('Файл слишком большой (макс. 2MB для изображений)');
      } else {
        setError('Ошибка создания проекта');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название проекта"
        disabled={loading}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        disabled={loading}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать проект'}
      </button>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}
```

### Пример 3: Смена пароля

```typescript
'use client';

import { useState } from 'react';
import { post } from '@/lib/api';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await post('/api/admin/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });

      setSuccess(true);
      
      // Очистка формы
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Автоматическое скрытие через 3 секунды
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setError(
          errors?.current_password?.[0] || 
          errors?.new_password?.[0] || 
          'Ошибка валидации'
        );
      } else {
        setError('Ошибка смены пароля');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Текущий пароль"
        disabled={loading}
      />
      
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Новый пароль"
        disabled={loading}
      />
      
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Подтвердите новый пароль"
        disabled={loading}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Сохранение...' : 'Сменить пароль'}
      </button>
      
      {success && <div style={{ color: 'green' }}>Пароль успешно изменён!</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}
```

## Конфигурация

API клиент использует следующие настройки:

- **baseURL**: `process.env.NEXT_PUBLIC_API_URL` (по умолчанию: `http://localhost:8000`)
- **withCredentials**: `true` (для CORS запросов с cookies)
- **timeout**: 30000ms (30 секунд)
- **headers**: 
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer {token}` (добавляется автоматически)

## Миграция существующего кода

### Было (прямое использование fetch):

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/projects`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Стало (с API клиентом):

```typescript
import { get } from '@/lib/api';

const data = await get('/api/admin/projects');
```

## Преимущества использования

1. **Меньше кода**: Не нужно каждый раз добавлять токен и обрабатывать ошибки
2. **Автоматическое обновление токенов**: Silent refresh без прерывания работы
3. **Централизованная обработка ошибок**: 401/403 обрабатываются автоматически
4. **Типизация**: Полная поддержка TypeScript
5. **Консистентность**: Все API запросы используют одну конфигурацию

## Troubleshooting

### Проблема: Токен не добавляется в заголовки

**Решение**: Убедитесь, что токен сохранён в cookie с именем `admin-token`

### Проблема: CORS ошибки

**Решение**: Проверьте, что в Laravel настроен CORS с `supports_credentials: true` и `exposed_headers` включает `X-New-Token`

### Проблема: Редирект на login не работает

**Решение**: Убедитесь, что код выполняется на клиенте (не в SSR), используйте `'use client'` директиву

## Дополнительная информация

- Требования: 6.1, 6.3, 6.5, 6.6 из спецификации
- Связанные файлы: `src/hooks/useTokenRefresh.ts` (следующая задача)
- Backend endpoint для обновления токенов: Laravel middleware `RefreshTokenMiddleware`
