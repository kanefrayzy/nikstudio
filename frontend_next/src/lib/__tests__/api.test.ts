import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { get, post, put, del, patch, getTokenFromCookie, saveTokenToCookie, removeTokenFromCookie } from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API Client', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  describe('Token utilities', () => {
    it('should get token from cookie', () => {
      document.cookie = 'admin-token=test-token-123; path=/';
      
      const token = getTokenFromCookie();
      expect(token).toBe('test-token-123');
    });

    it('should return null if token not found', () => {
      document.cookie = 'other-cookie=value; path=/';
      
      const token = getTokenFromCookie();
      expect(token).toBeNull();
    });

    it('should save token to cookie', () => {
      saveTokenToCookie('new-token', 3600);
      
      expect(document.cookie).toContain('admin-token=new-token');
    });

    it('should remove token from cookie', () => {
      document.cookie = 'admin-token=test-token; path=/';
      
      removeTokenFromCookie();
      
      expect(document.cookie).toContain('expires=Thu, 01 Jan 1970');
    });
  });

  describe('HTTP methods', () => {
    const mockResponse = { data: { success: true, message: 'OK' } };

    beforeEach(() => {
      // Mock axios.create to return a mock instance
      const mockInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn().mockResolvedValue(mockResponse),
        put: vi.fn().mockResolvedValue(mockResponse),
        delete: vi.fn().mockResolvedValue(mockResponse),
        patch: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };
      
      mockedAxios.create = vi.fn().mockReturnValue(mockInstance);
    });

    it('should make GET request', async () => {
      const result = await get('/test-endpoint');
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      const result = await post('/test-endpoint', data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT request', async () => {
      const data = { name: 'updated' };
      const result = await put('/test-endpoint/1', data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request', async () => {
      const result = await del('/test-endpoint/1');
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PATCH request', async () => {
      const data = { name: 'patched' };
      const result = await patch('/test-endpoint/1', data);
      expect(result).toEqual(mockResponse.data);
    });
  });
});
