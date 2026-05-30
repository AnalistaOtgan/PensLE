import { Plus, Search, Trash2, ListFilter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TagChip } from '../components/TagChip';
import { useDialog } from '../components/ui/DialogContext';
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
  const [activeTab, setActiveTab] = useState<'notas' | 'projetos'>('notas');
  const [showAllTags, setShowAllTags] = useState(false);
  const navigate = useNavigate();
  const dialog = useDialog();

  const load = async () => setNotes(await storageService.getAllNotes());

  useEffect(() => {
    void load();
  }, []);

  const { topTags, allTags } = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      note.tags.forEach((t) => {
        if (!t.startsWith('projeto-')) {
          counts[t] = (counts[t] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    return { topTags: sorted.slice(0, 5), allTags: sorted.sort() };
  }, [notes]);

  const displayTags = useMemo(() => {
    const list = [...topTags];
    if (tag && !list.includes(tag)) {
      list.push(tag);
    }
    return list;
  }, [topTags, tag]);

  const projects = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))).filter(t => t.startsWith('projeto-')).sort(), [notes]);
  const filtered = notes.filter((note) => {
    const haystack = `${note.title} ${note.summary} ${note.tags.join(' ')} ${note.body}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!tag || note.tags.includes(tag));
  });

  const createProject = async () => {
    const name = await dialog.prompt({
      title: 'Novo Projeto',
      message: 'Digite o nome do novo projeto:',
      promptPlaceholder: 'Ex: Reforma'
    });
    if (name) {
      const pTag = 'projeto-' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      navigate(`/projeto/${pTag}`);
    }
  };

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
    const confirmed = await dialog.confirm('Excluir esta nota e suas conexões?');
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

      <div className="tabs-row">
        <button className={`tab-button ${activeTab === 'notas' ? 'active' : ''}`} onClick={() => setActiveTab('notas')}>Notas</button>
        <button className={`tab-button ${activeTab === 'projetos' ? 'active' : ''}`} onClick={() => setActiveTab('projetos')}>Projetos</button>
      </div>

      {activeTab === 'notas' ? (
        <>
          {allTags.length > 0 && (
            <div className="tag-row" style={{ flexWrap: 'wrap' }}>
              <TagChip tag="todas" active={!tag} onClick={() => setTag('')} />
              {displayTags.map((item) => (
                <TagChip key={item} tag={item} active={tag === item} onClick={() => setTag(item)} />
              ))}
              {allTags.length > 5 && (
                <button 
                  className="tag-chip" 
                  onClick={() => setShowAllTags(true)}
                  style={{ opacity: 0.8 }}
                >
                  <ListFilter size={14} style={{ marginRight: 4 }} />
                  Ver todas
                </button>
              )}
            </div>
          )}

          {showAllTags && (
            <div className="modal-overlay" onClick={() => setShowAllTags(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Todas as Tags</h3>
                <div className="tag-row" style={{ flexWrap: 'wrap', maxHeight: '50vh', overflowY: 'auto' }}>
                  <TagChip tag="todas" active={!tag} onClick={() => { setTag(''); setShowAllTags(false); }} />
                  {allTags.map((item) => (
                    <TagChip key={item} tag={item} active={tag === item} onClick={() => { setTag(item); setShowAllTags(false); }} />
                  ))}
                </div>
                <div className="dialog-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="primary-button" onClick={() => setShowAllTags(false)}>Fechar</button>
                </div>
              </div>
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
                      {note.tags.filter(t => !t.startsWith('projeto-')).map((noteTag) => (
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
        </>
      ) : (
        <>
          <div className="empty-actions" style={{ marginBottom: 16 }}>
            <button className="primary-button" onClick={createProject}>
              <Plus size={18} />
              Criar Projeto
            </button>
          </div>
          <div className="note-list">
            {projects.length === 0 ? (
               <div className="empty-state"><p>Nenhum projeto ainda. Clique no botão acima para criar o primeiro.</p></div>
            ) : (
              projects.map((projectTag) => {
                const projectNotes = notes.filter(n => n.tags.includes(projectTag));
                if (query && !projectTag.includes(query.toLowerCase())) return null;
                return (
                  <article className="note-card" key={projectTag}>
                    <Link to={`/projeto/${projectTag}`} className="note-card-main">
                      <div>
                        <h2>{projectTag.replace('projeto-', '').replace(/-/g, ' ').toUpperCase()}</h2>
                        <time>{projectNotes.length} nota{projectNotes.length !== 1 ? 's' : ''}</time>
                      </div>
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}
