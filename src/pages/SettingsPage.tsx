import { Download, Moon, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { defaultSettings, storageService } from '../services/storageService';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void storageService.getSettings().then(setSettings);
  }, []);

  const update = async (next: AppSettings) => {
    setSettings(next);
    await storageService.saveSettings(next);
    window.dispatchEvent(new Event('pensle:settings-changed'));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const exportVault = async () => {
    const notes = await storageService.getAllNotes();
    const content = JSON.stringify(notes, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pensle-notas.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearVault = async () => {
    if (!window.confirm('Limpar todas as notas, conexões e ajustes locais?')) {
      return;
    }
    await storageService.clear();
    await update(defaultSettings);
  };

  return (
    <section className="settings-page">
      <header className="page-heading">
        <p>Preferências locais</p>
        <h1>Ajustes</h1>
      </header>

      <div className="settings-list">
        <label className="field">
          <span>API key da Groq</span>
          <input
            type="password"
            value={settings.groqApiKey}
            onChange={(event) => update({ ...settings, groqApiKey: event.target.value })}
            placeholder="gsk_..."
          />
        </label>

        <label className="field">
          <span>Idioma da transcrição</span>
          <select value={settings.language} onChange={(event) => update({ ...settings, language: event.target.value as AppSettings['language'] })}>
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="auto">Auto-detectar</option>
          </select>
        </label>

        <label className="field">
          <span>Modelo de interpretação</span>
          <select value={settings.model} onChange={(event) => update({ ...settings, model: event.target.value as AppSettings['model'] })}>
            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
          </select>
        </label>

        <div className="segmented">
          <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => update({ ...settings, theme: 'dark' })}>
            <Moon size={17} />
            Escuro
          </button>
          <button className={settings.theme === 'light' ? 'active' : ''} onClick={() => update({ ...settings, theme: 'light' })}>
            <Sun size={17} />
            Claro
          </button>
        </div>

        <label className="toggle-row">
          <span>Manter áudios originais</span>
          <input
            type="checkbox"
            checked={settings.keepAudio}
            onChange={(event) => update({ ...settings, keepAudio: event.target.checked })}
          />
        </label>

        <button className="secondary-button wide" onClick={exportVault}>
          <Download size={18} />
          Exportar notas
        </button>
        <button className="danger-button wide" onClick={clearVault}>
          <Trash2 size={18} />
          Limpar dados locais
        </button>
        {saved && <p className="saved-note">Ajustes salvos.</p>}
      </div>
    </section>
  );
}
