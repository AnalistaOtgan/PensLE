import { useEffect, useRef, useState } from 'react';
import { audioService, type RecordingResult } from '../services/audioService';

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (startedAtRef.current) {
        setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  const start = async () => {
    setError('');
    chunksRef.current = [];
    const recorder = await audioService.start((chunk) => chunksRef.current.push(chunk));
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setDuration(0);
    setIsRecording(true);
  };

  const stop = async (): Promise<RecordingResult | null> => {
    if (!recorderRef.current) {
      return null;
    }

    const recorder = recorderRef.current;
    setIsRecording(false);
    recorderRef.current = null;

    const result = await new Promise<RecordingResult>((resolve) => {
      recorder.addEventListener(
        'stop',
        () => {
          recorder.stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          resolve({ blob, url: URL.createObjectURL(blob) });
        },
        { once: true }
      );
      recorder.stop();
    });

    return result;
  };

  return {
    isRecording,
    duration,
    error,
    setError,
    start,
    stop
  };
}
