import { Loader2, Mic, Square, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { processRecording } from '../services/notePipeline';
import { storageService } from '../services/storageService';
import type { Note } from '../types';

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

export function CapturePage() {
  const recorder = useRecorder();
  const [processing, setProcessing] = useState(false);
  const [createdNote, setCreatedNote] = useState<Note | null>(null);
  const [status, setStatus] = useState('');

  const handleRecordClick = async () => {
    setCreatedNote(null);
    setStatus('');

    try {
      if (!recorder.isRecording) {
        await recorder.start();
        return;
      }

      const recording = await recorder.stop();
      if (!recording) {
        return;
      }

      setProcessing(true);
      setStatus('Processando áudio e preparando a nota...');
      const settings = await storageService.getSettings();
      const result = await processRecording(recording.blob, recording.url, settings);
      setCreatedNote(result.note);
      setStatus(result.usedFallback ? result.message : 'Nota criada com transcrição e interpretação.');
    } catch (error) {
      recorder.setError(error instanceof Error ? error.message : 'Não foi possível capturar o áudio.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="capture-page">
      <header className="page-heading compact">
        <p>PensLE</p>
        <h1>Capturar</h1>
      </header>

      <div className={`record-stage ${recorder.isRecording ? 'recording' : ''}`}>
        <button
          className="record-button"
          onClick={handleRecordClick}
          disabled={processing}
          aria-label={recorder.isRecording ? 'Parar gravação' : 'Iniciar gravação'}
        >
          {processing ? (
            <Loader2 className="spin" size={42} />
          ) : recorder.isRecording ? (
            <Square size={42} fill="currentColor" />
          ) : (
            <Mic size={48} />
          )}
        </button>
        {recorder.isRecording && <div className="timer">{formatDuration(recorder.duration)}</div>}
        {!recorder.isRecording && !processing && <p className="hint">Toque para gravar um pensamento.</p>}
      </div>

      {processing && (
        <div className="processing-card">
          <Wand2 size={18} />
          <span>{status}</span>
        </div>
      )}

      {recorder.error && <div className="alert error">{recorder.error}</div>}

      {createdNote && (
        <Link className="created-toast" to={`/notas/${createdNote.id}`}>
          <strong>{createdNote.title}</strong>
          <span>{createdNote.tags.map((tag) => `#${tag}`).join(' ')}</span>
        </Link>
      )}
    </section>
  );
}
