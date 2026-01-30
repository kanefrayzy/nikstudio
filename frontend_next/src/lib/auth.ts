/**
 * Authentication API Client
 */

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Login and get API token
 */
export async function login(email: string, password: string): Promise<string> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      throw new Error('Ошибка конфигурации: API URL не определен');
    }

    const response = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error('Неверные учетные данные');
      }
      throw new Error('Ошибка авторизации');
    }

    const data: LoginResponse = await response.json();
    
    if (!data.success || !data.token) {
      throw new Error('Ошибка получения токена');
    }

    // Save token to cookie
    document.cookie = `admin-token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

    return data.token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout and clear token
 */
export async function logout(): Promise<void> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = getAuthToken();
    
    if (apiUrl && token) {
      await fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear token from cookie
    document.cookie = 'admin-token=; path=/; max-age=0';
  }
}

/**
 * Get authentication token from cookies
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'admin-token') {
      return value;
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
