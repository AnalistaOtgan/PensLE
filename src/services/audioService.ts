export interface RecordingResult {
  blob: Blob;
  url: string;
}

export class AudioService {
  async start(onData: (chunk: Blob) => void): Promise<MediaRecorder> {
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
    return recorder;
  }

  stop(recorder: MediaRecorder): Promise<RecordingResult> {
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
