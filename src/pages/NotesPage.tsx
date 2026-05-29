import { Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TagChip } from '../components/TagChip';
import { createSampleNotes } from '../data/sampleNotes';
import { createMarkdownDocument } from '../services/markdownService';
import { storageService } from '../services/storageService';
import type { Note } from '../types';

const relativeDate = (iso: string) =>
  new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000),
    'day'
  );

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const navigate = useNavigate();

  const load = async () => setNotes(await storageService.getAllNotes());

  useEffect(() => {
    void load();
  }, []);

  const tags = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(), [notes]);
  const filtered = notes.filter((note) => {
    const haystack = `${note.title} ${note.summary} ${note.tags.join(' ')} ${note.body}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!tag || note.tags.includes(tag));
  });

  const addSamples = async () => {
    const sample = createSampleNotes();
    for (const note of sample.notes) {
      const markdown = createMarkdownDocument({
        title: note.title,
        summary: note.summary,
        tags: note.tags,
        createdAt: note.createdAt,
        treatedBody: note.body,
        rawTranscript: note.rawTranscript
      });
      await storageService.saveNote({ ...note, markdown, connections: sample.connections }, sample.connections);
    }
    await load();
  };

  const removeNote = async (id: string) => {
    const confirmed = window.confirm('Excluir esta nota e suas conexões?');
    if (!confirmed) {
      return;
    }
    await storageService.deleteNote(id);
    await load();
  };

  return (
    <section className="notes-page">
      <header className="page-heading">
        <p>Biblioteca local</p>
        <h1>Notas</h1>
      </header>

      <label className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, tag ou conteúdo" />
      </label>

      {tags.length > 0 && (
        <div className="tag-row">
          <TagChip tag="todas" active={!tag} onClick={() => setTag('')} />
          {tags.map((item) => (
            <TagChip key={item} tag={item} active={tag === item} onClick={() => setTag(item)} />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>Nenhuma nota por aqui ainda</h2>
          <p>Capture um áudio ou carregue exemplos para ver as conexões funcionando.</p>
          <div className="empty-actions">
            <button className="secondary-button" onClick={addSamples}>
              Carregar exemplos
            </button>
            <button className="primary-button" onClick={() => navigate('/capturar')}>
              <Plus size={18} />
              Capturar
            </button>
          </div>
        </div>
      ) : (
        <div className="note-list">
          {filtered.map((note) => (
            <article className="note-card" key={note.id}>
              <Link to={`/notas/${note.id}`} className="note-card-main">
                <div>
                  <h2>{note.title}</h2>
                  <time>{relativeDate(note.createdAt)}</time>
                </div>
                <p>{note.summary}</p>
                <div className="card-tags">
                  {note.tags.map((noteTag) => (
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
    </section>
  );
}
