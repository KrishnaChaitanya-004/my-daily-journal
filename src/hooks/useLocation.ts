import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocationData } from './useFileStorage';

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 🔐 Triggers Android / iOS permission dialog
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;

      // ✅ FIX: createdAt declared ONCE in parent scope
      const createdAt = Date.now();

      try {
        // 🌍 Reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
          {
            headers: {
              'User-Agent': 'KC-Diary-App',
            },
          }
        );

        if (!response.ok) throw new Error('Reverse geocoding failed');

        const data = await response.json();

        const name =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.suburb ||
          data.address?.county ||
          'Unknown location';

        return {
          name,
          lat: latitude,
          lng: longitude,
          createdAt,
        };
      } catch {
        // 🧯 Fallback if API fails
        return {
          name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          lat: latitude,
          lng: longitude,
          createdAt,
        };
      }
    } catch (err: any) {
      console.error('Location error:', err);
      setError(err?.message || 'Location permission denied');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getCurrentLocation,
    isLoading,
    error,
  };
};
