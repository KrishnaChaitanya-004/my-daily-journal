import { useState, useCallback, useRef } from 'react';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  error: string | null;
}

export const useVoiceRecorder = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    error: null,
  });

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await VoiceRecorder.requestAudioRecordingPermission();
      if (!perm.value) {
        setState(prev => ({ ...prev, error: 'Microphone permission denied' }));
        return false;
      }

      await VoiceRecorder.startRecording();

      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState({
        isRecording: true,
        duration: 0,
        error: null,
      });

      return true;
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        error: e?.message || 'Failed to start recording',
      }));
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ base64: string; duration: number } | null> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const result = await VoiceRecorder.stopRecording();

      const finalDuration =
        Math.floor(result.value.msDuration / 1000) ??
        Math.floor((Date.now() - startTimeRef.current) / 1000);

      setState({
        isRecording: false,
        duration: 0,
        error: null,
      });

      return {
        base64: result.value.recordDataBase64,
        duration: finalDuration,
      };
    } catch {
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      await VoiceRecorder.stopRecording();
    } catch {}

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState({
      isRecording: false,
      duration: 0,
      error: null,
    });
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
  };
};
