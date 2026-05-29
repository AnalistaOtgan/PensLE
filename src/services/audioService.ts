import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export interface RecordingResult {
  blob: Blob;
  url: string;
}

export interface RecordingSession {
  stop(): Promise<RecordingResult>;
}

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

export function describeVoiceRecorderError(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);

  if (code.includes('MISSING_PERMISSION')) {
    return 'Permissão de microfone negada. Abra as configurações do app e permita o microfone durante o uso.';
  }
  if (code.includes('MICROPHONE_BEING_USED')) {
    return 'O microfone está sendo usado por outro app. Feche chamadas, gravações ou assistentes de voz e tente novamente.';
  }
  if (code.includes('DEVICE_CANNOT_VOICE_RECORD')) {
    return 'Este dispositivo não consegue gravar áudio pelo app.';
  }
  if (code.includes('ALREADY_RECORDING')) {
    return 'Já existe uma gravação em andamento.';
  }
  if (code.includes('EMPTY_RECORDING')) {
    return 'A gravação ficou vazia. Grave por alguns segundos antes de parar.';
  }

  return `Não foi possível acessar o microfone. Detalhe: ${code}`;
}

export class AudioService {
  async start(onData: (chunk: Blob) => void): Promise<RecordingSession> {
    if (Capacitor.isNativePlatform()) {
      return this.startNative();
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Gravação de áudio não está disponível neste navegador.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        onData(event.data);
      }
    });
    recorder.start();

    return {
      stop: () => this.stopWeb(recorder)
    };
  }

  private async startNative(): Promise<RecordingSession> {
    try {
      const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
      if (!canRecord.value) {
        throw new Error('DEVICE_CANNOT_VOICE_RECORD');
      }

      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        throw new Error('MISSING_PERMISSION');
      }

      await VoiceRecorder.startRecording();

      return {
        stop: async () => {
          try {
            const recording = await VoiceRecorder.stopRecording();
            const mimeType = recording.value.mimeType || 'audio/aac';
            const blob = base64ToBlob(recording.value.recordDataBase64, mimeType);

            return {
              blob,
              url: URL.createObjectURL(blob)
            };
          } catch (error) {
            throw new Error(describeVoiceRecorderError(error));
          }
        }
      };
    } catch (error) {
      throw new Error(describeVoiceRecorderError(error));
    }
  }

  private stopWeb(recorder: MediaRecorder): Promise<RecordingResult> {
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      const handleData = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      const handleStop = () => {
        recorder.removeEventListener('dataavailable', handleData);
        recorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        resolve({ blob, url: URL.createObjectURL(blob) });
      };

      recorder.addEventListener('dataavailable', handleData);
      recorder.addEventListener('stop', handleStop, { once: true });
      recorder.stop();
    });
  }
}

export const audioService = new AudioService();
