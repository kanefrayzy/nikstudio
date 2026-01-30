"use client"

import { useState, useEffect } from 'react';

interface ServiceVideo {
  id: number;
  service_name: string;
  video_url?: string;
  video_original_name?: string;
  video_size?: number;
  formatted_video_size?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: ServiceVideo;
  message?: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const useServiceVideo = (serviceName: string) => {
  const [video, setVideo] = useState<ServiceVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/services/${serviceName}/video`, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (response.ok) {
          const data: ApiResponse = await response.json();
          setVideo(data.data || null);
        } else if (response.status === 404) {
          // No video found - this is normal
          setVideo(null);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error(`Error fetching service video for ${serviceName}:`, err);
        setError('Ошибка при загрузке видео');
        setVideo(null);
      } finally {
        setLoading(false);
      }
    };

    if (serviceName) {
      fetchVideo();
    }
  }, [serviceName]);

  return { video, loading, error };
};