import { ArrowLeft, Loader2, Mic, Search, Square, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TagChip } from '../components/TagChip';
import { useDialog } from '../components/ui/DialogContext';
import { storageService } from '../services/storageService';
import { processRecording } from '../services/notePipeline';
import { useRecorder } from '../hooks/useRecorder';
import type { Note } from '../types';

const relativeDate = (iso: string) =>
  new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000),
    'day'
  );

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

export function ProjectPage() {
  const { id: projectTag } = useParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const dialog = useDialog();
  
  const recorder = useRecorder();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const load = async () => {
    if (!projectTag) return;
    const all = await storageService.getAllNotes();
    setNotes(all.filter(n => n.tags.includes(projectTag)));
  };

  useEffect(() => {
    void load();
  }, [projectTag]);

  const filtered = notes.filter((note) => {
    const haystack = `${note.title} ${note.summary} ${note.tags.join(' ')} ${note.body}`.toLowerCase();
    return !query || haystack.includes(query.toLowerCase());
  });

  const removeNote = async (id: string) => {
    const confirmed = await dialog.confirm('Excluir esta nota e suas conexões?');
    if (!confirmed) return;
    await storageService.deleteNote(id);
    await load();
  };

  const handleRecordClick = async () => {
    if (!projectTag) return;
    setToastMessage('');
    setStatus('');

    try {
      if (!recorder.isRecording) {
        await recorder.start();
        return;
      }

      const recording = await recorder.stop();
      if (!recording) return;

      setProcessing(true);
      setStatus('Processando áudio para o projeto...');
      const settings = await storageService.getSettings();
      const result = await processRecording(recording.blob, recording.url, settings, [projectTag]);
      
      setToastMessage(result.usedFallback ? result.message : 'Nota salva no projeto com sucesso!');
      await load();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (error) {
      recorder.setError(error instanceof Error ? error.message : 'Não foi possível capturar o áudio.');
    } finally {
      setProcessing(false);
    }
  };

  const title = projectTag?.replace('projeto-', '').replace(/-/g, ' ').toUpperCase() || 'PROJETO';

  return (
    <section className="notes-page relative" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <header className="reader-toolbar" style={{ position: 'relative', margin: '0 0 16px', background: 'transparent' }}>
        <Link className="back-link" to="/notas">
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </header>
      
      <header className="page-heading">
        <p>Projeto</p>
        <h1>{title}</h1>
      </header>

      <label className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar neste projeto" />
      </label>

      {processing && (
        <div className="processing-card" style={{ marginTop: 16 }}>
          <Wand2 size={18} />
          <span>{status}</span>
        </div>
      )}
      
      {toastMessage && (
        <div className="created-toast" style={{ marginTop: 16 }}>
          <strong>{toastMessage}</strong>
        </div>
      )}
      
      {recorder.error && <div className="alert error" style={{ marginTop: 16 }}>{recorder.error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>Nenhuma nota no projeto</h2>
          <p>Use o botão flutuante para gravar a primeira nota atrelada a este projeto.</p>
        </div>
      ) : (
        <div className="note-list" style={{ marginTop: 16, paddingBottom: 80 }}>
          {filtered.map((note) => (
            <article className="note-card" key={note.id}>
              <Link to={`/notas/${note.id}`} className="note-card-main">
                <div>
                  <h2>{note.title}</h2>
                  <time>{relativeDate(note.createdAt)}</time>
                </div>
                <p>{note.summary}</p>
                <div className="card-tags">
                  {note.tags.filter(t => t !== projectTag && !t.startsWith('projeto-')).map((noteTag) => (
                    <TagChip key={noteTag} tag={noteTag} />
                  ))}
                </div>
              </Link>
              <button className="icon-button danger" onClick={() => removeNote(note.id)} aria-label="Excluir nota">
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="fab-container">
        {recorder.isRecording && <div className="timer fab-timer">{formatDuration(recorder.duration)}</div>}
        <button
          className={`fab-button ${recorder.isRecording ? 'recording' : ''}`}
          onClick={handleRecordClick}
          disabled={processing}
          aria-label={recorder.isRecording ? 'Parar gravação' : 'Gravar para o projeto'}
        >
          {processing ? (
            <Loader2 className="spin" size={24} />
          ) : recorder.isRecording ? (
            <Square size={24} fill="currentColor" />
          ) : (
            <Mic size={24} />
          )}
        </button>
      </div>
    </section>
  );
}
