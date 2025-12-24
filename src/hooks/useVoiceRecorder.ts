import { useState, useRef, useCallback } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}

export const useVoiceRecorder = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start(100); // Capture every 100ms
      startTimeRef.current = Date.now();
      
      // Update duration every second
      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);
      
      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null
      });
      
      return true;
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e.message || 'Failed to start recording'
      }));
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ base64: string; duration: number } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }
      
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Create blob and convert to base64
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setState({
            isRecording: false,
            isPaused: false,
            duration: 0,
            error: null
          });
          resolve({ base64, duration: finalDuration });
        };
        reader.readAsDataURL(audioBlob);
      };
      
      mediaRecorderRef.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    audioChunksRef.current = [];
    
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      error: null
    });
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration
  };
};
