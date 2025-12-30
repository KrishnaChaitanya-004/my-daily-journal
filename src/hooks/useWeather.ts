import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { WeatherData } from './useFileStorage';

// Weather condition codes from Open-Meteo
const weatherConditions: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Rime Fog', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌧️' },
  53: { condition: 'Drizzle', icon: '🌧️' },
  55: { condition: 'Heavy Drizzle', icon: '🌧️' },
  61: { condition: 'Light Rain', icon: '🌧️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  71: { condition: 'Light Snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '🌨️' },
  75: { condition: 'Heavy Snow', icon: '❄️' },
  77: { condition: 'Snow Grains', icon: '🌨️' },
  80: { condition: 'Light Showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌦️' },
  82: { condition: 'Heavy Showers', icon: '🌧️' },
  85: { condition: 'Light Snow Showers', icon: '🌨️' },
  86: { condition: 'Snow Showers', icon: '🌨️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm + Hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm + Heavy Hail', icon: '⛈️' }
};

export const useWeather = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lng?: number): Promise<WeatherData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // If no coordinates provided, get current location
      let latitude = lat;
      let longitude = lng;

      if (!latitude || !longitude) {
        // Use Capacitor Geolocation for native, fallback to navigator for web
        if (Capacitor.isNativePlatform()) {
          try {
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 10000,
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          } catch (geoError: any) {
            console.error('Capacitor geolocation error:', geoError);
            throw new Error('Location permission denied or unavailable');
          }
        } else {
          // Web fallback
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 300000 // 5 minutes
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      }

      // Fetch weather from Open-Meteo (free, no API key needed)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather');
      }

      const data = await response.json();
      const weatherCode = data.current_weather?.weathercode || 0;
      const temp = Math.round(data.current_weather?.temperature || 0);
      
      const weatherInfo = weatherConditions[weatherCode] || { condition: 'Unknown', icon: '🌡️' };

      setIsLoading(false);
      return {
        temp,
        condition: weatherInfo.condition,
        icon: weatherInfo.icon
      };
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Manual weather selection options
  const manualWeatherOptions: WeatherData[] = [
    { temp: 0, condition: 'Sunny', icon: '☀️' },
    { temp: 0, condition: 'Partly Cloudy', icon: '⛅' },
    { temp: 0, condition: 'Cloudy', icon: '☁️' },
    { temp: 0, condition: 'Rainy', icon: '🌧️' },
    { temp: 0, condition: 'Stormy', icon: '⛈️' },
    { temp: 0, condition: 'Snowy', icon: '❄️' },
    { temp: 0, condition: 'Foggy', icon: '🌫️' },
    { temp: 0, condition: 'Windy', icon: '💨' }
  ];

  return {
    fetchWeather,
    manualWeatherOptions,
    isLoading,
    error
  };
};
