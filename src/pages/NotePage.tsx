import { ArrowLeft, Loader2, Share2, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { TagChip } from '../components/TagChip';
import { markdownForDisplay } from '../services/markdownService';
import { canProcessNoteLater, hasUsableRawTranscript, processSavedNote } from '../services/notePipeline';
import { storageService } from '../services/storageService';
import type { Connection, Note } from '../types';

export function NotePage() {
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const load = async () => {
      if (!id) {
        return;
      }
      const [found, savedConnections, notes] = await Promise.all([
        storageService.getNote(id),
        storageService.getConnections(),
        storageService.getAllNotes()
      ]);
      setNote(found ?? null);
      setConnections(savedConnections);
      setAllNotes(notes);
    };

  useEffect(() => {
    void load();
  }, [id]);

  if (!note) {
    return (
      <section className="note-page">
        <Link className="back-link" to="/notas">
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <div className="empty-state">
          <h1>Nota não encontrada</h1>
        </div>
      </section>
    );
  }

  const linkedConnections = connections
    .filter((connection) => connection.sourceNoteId === note.id || connection.targetNoteId === note.id)
    .map((connection) => ({
      connection,
      target: allNotes.find((candidate) =>
        candidate.id === (connection.sourceNoteId === note.id ? connection.targetNoteId : connection.sourceNoteId)
      )
    }))
    .filter((item) => item.target);

  const share = async () => {
    await navigator.clipboard?.writeText(note.markdown ?? note.body);
  };
  const audioHref = note.audioDataUrl;
  const hasLegacyTemporaryAudio = Boolean(!note.audioDataUrl && note.audioUrl);

  const processLater = async () => {
    setProcessing(true);
    setStatus('Processando com IA...');

    try {
      const settings = await storageService.getSettings();
      const result = await processSavedNote(note.id, settings);
      setNote(result.note);
      setStatus(result.usedFallback ? result.message : 'Nota transcrita e tratada com IA.');
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível processar esta nota.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <article className="note-page note-reader">
      <header className="reader-toolbar">
        <Link className="back-link" to="/notas">
          <ArrowLeft size={18} />
          Notas
        </Link>
        <div className="note-actions">
          {audioHref && (
            <a className="icon-action" href={audioHref} target="_blank" rel="noreferrer" aria-label="Ouvir áudio">
              <Volume2 size={18} />
            </a>
          )}
          {canProcessNoteLater(note) && (
            <button className="reader-process-button" onClick={processLater} disabled={processing}>
              {processing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {hasUsableRawTranscript(note.rawTranscript) ? 'Tratar agora' : 'Transcrever e tratar'}
            </button>
          )}
          <button className="icon-action" onClick={share} aria-label="Copiar Markdown">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <section className="reader-meta">
        <h1>{note.title}</h1>
        <p>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.createdAt))}</p>
        <div className="card-tags">
          {note.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        {status && <p className="inline-status">{status}</p>}
        {hasLegacyTemporaryAudio && !canProcessNoteLater(note) && (
          <p className="inline-status">
            Esta captura é anterior ao salvamento persistente de áudio. Grave novamente para transcrever depois.
          </p>
        )}
      </section>

      <div className="markdown-body reader-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownForDisplay(note.markdown ?? note.body)}</ReactMarkdown>
      </div>

      <section className="connections-list reader-connections">
        <h2>Conectado com</h2>
        {linkedConnections.length === 0 ? (
          <p>Nenhuma conexão validada ainda.</p>
        ) : (
          linkedConnections.map(({ connection, target }) => (
            <Link key={connection.id} to={`/notas/${target!.id}`} className="connection-item">
              <strong>{target!.title}</strong>
              <span>{connection.reason}</span>
            </Link>
          ))
        )}
      </section>
    </article>
  );
}
