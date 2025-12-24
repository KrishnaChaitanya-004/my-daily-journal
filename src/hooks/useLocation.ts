import { useState, useCallback } from 'react';
import { LocationData } from './useFileStorage';

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        setIsLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding using free OpenStreetMap Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
            );
            const data = await response.json();
            
            // Extract a readable location name
            const name = data.address?.city || 
                        data.address?.town || 
                        data.address?.village || 
                        data.address?.suburb ||
                        data.address?.county ||
                        'Unknown location';
            
            setIsLoading(false);
            resolve({
              name,
              lat: latitude,
              lng: longitude
            });
          } catch (e) {
            // If reverse geocoding fails, still return coordinates
            setIsLoading(false);
            resolve({
              name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              lat: latitude,
              lng: longitude
            });
          }
        },
        (err) => {
          setError(err.message);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return {
    getCurrentLocation,
    isLoading,
    error
  };
};
