import { ArrowLeft, Copy, Loader2, Pause, Share2, Sparkles, Volume2, Plus } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { TagChip } from '../components/TagChip';
import { markdownForDisplay, createMarkdownDocument } from '../services/markdownService';
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
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');

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

  const audioHref = note?.audioDataUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (audioHref) {
      const audio = new Audio(audioHref);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onpause = () => setIsPlayingAudio(false);
      audio.onplay = () => setIsPlayingAudio(true);
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioHref]);

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

  const availableTags = Array.from(new Set(allNotes.flatMap(n => n.tags))).sort();

  const handleAddTag = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!note || !newTagValue.trim()) {
      setIsAddingTag(false);
      return;
    }
    
    const tagsToAdd = newTagValue.split(',').map(t => 
      t.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    ).filter(Boolean);

    const newTags = Array.from(new Set([...note.tags, ...tagsToAdd]));
    
    if (newTags.length > note.tags.length) {
      const updatedNote: Note = {
        ...note,
        tags: newTags,
      };
      
      updatedNote.markdown = createMarkdownDocument({
        title: updatedNote.title,
        summary: updatedNote.summary,
        tags: updatedNote.tags,
        createdAt: updatedNote.createdAt,
        treatedBody: updatedNote.body,
        rawTranscript: updatedNote.rawTranscript
      });
      
      setNote(updatedNote);
      await storageService.saveNote(updatedNote, []);
      await load();
    }
    
    setNewTagValue('');
    setIsAddingTag(false);
  };

  const share = async () => {
    await navigator.clipboard?.writeText(note.markdown ?? note.body);
  };
  const hasLegacyTemporaryAudio = Boolean(!note.audioDataUrl && note.audioUrl);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        void audioRef.current.play();
      }
    }
  };

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
            <button className="icon-action" onClick={toggleAudio} aria-label={isPlayingAudio ? "Pausar áudio" : "Ouvir áudio"}>
              {isPlayingAudio ? <Pause size={18} /> : <Volume2 size={18} />}
            </button>
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
        <p>{new Date(note.createdAt).toLocaleString('pt-BR')}</p>
        <div className="card-tags">
          {note.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {isAddingTag ? (
            <form onSubmit={handleAddTag} className="add-tag-form">
              <input
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                placeholder="tag1, tag2"
                autoFocus
                onBlur={() => handleAddTag()}
                list="available-tags"
                className="add-tag-input"
              />
              <datalist id="available-tags">
                {availableTags.map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </form>
          ) : (
            <button 
              className="tag-chip add-tag-button"
              onClick={() => setIsAddingTag(true)}
              aria-label="Adicionar tag"
              title="Adicionar tag"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        {status && <p className="inline-status">{status}</p>}
        {hasLegacyTemporaryAudio && !canProcessNoteLater(note) && (
          <p className="inline-status">
            Esta captura é anterior ao salvamento persistente de áudio. Grave novamente para transcrever depois.
          </p>
        )}
      </section>

      <div className="markdown-body reader-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ node, children, ...props }) => {
              const text = Array.isArray(children)
                ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
                : String(children);
              
              if (text.includes('Pensamento tratado')) {
                return (
                  <h2 {...props} className="section-title-with-copy">
                    {children}
                    <button
                      className="copy-section-button"
                      onClick={() => navigator.clipboard?.writeText(note.body)}
                      aria-label="Copiar Pensamento"
                      title="Copiar Pensamento"
                    >
                      <Copy size={16} />
                    </button>
                  </h2>
                );
              }
              return <h2 {...props}>{children}</h2>;
            }
          }}
        >
          {markdownForDisplay(note.markdown ?? note.body)}
        </ReactMarkdown>
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
