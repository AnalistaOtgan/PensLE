import { Download, Moon, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { exportNotes, type ExportResult } from '../services/exportService';
import { defaultSettings, storageService } from '../services/storageService';
import type { AppSettings } from '../types';
import { useDialog } from '../components/ui/DialogContext';
import { Dropdown } from '../components/ui/Dropdown';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const dialog = useDialog();

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
    setExportResult(await exportNotes(notes));
  };

  const copyExportJson = async () => {
    if (!exportResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(exportResult.content);
      setExportResult({
        mode: 'copied',
        content: exportResult.content,
        message: 'JSON copiado para a area de transferencia.'
      });
    } catch {
      setExportResult({
        mode: 'copy-fallback',
        content: exportResult.content,
        message: 'JSON pronto para copiar.',
        error: 'Nao foi possivel copiar automaticamente.'
      });
    }
  };

  const clearVault = async () => {
    const confirmed = await dialog.confirm('Limpar todas as notas, conexões e ajustes locais?');
    if (!confirmed) {
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

        <label className="field dropdown-field">
          <span>Idioma da transcrição</span>
          <Dropdown
            value={settings.language}
            options={[
              { label: 'Português', value: 'pt' },
              { label: 'Inglês', value: 'en' },
              { label: 'Auto-detectar', value: 'auto' }
            ]}
            onChange={(value) => update({ ...settings, language: value as AppSettings['language'] })}
          />
        </label>

        <label className="field dropdown-field">
          <span>Modelo de interpretação</span>
          <Dropdown
            value={settings.model}
            options={[
              { label: 'llama-3.1-8b-instant', value: 'llama-3.1-8b-instant' },
              { label: 'llama-3.3-70b-versatile', value: 'llama-3.3-70b-versatile' }
            ]}
            onChange={(value) => update({ ...settings, model: value as AppSettings['model'] })}
          />
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
        {exportResult && (
          <div className="export-result">
            <p className="inline-status">{exportResult.message}</p>
            {exportResult.mode === 'copy-fallback' && (
              <>
                <p className="inline-status danger">{exportResult.error}</p>
                <textarea className="export-json" value={exportResult.content} readOnly />
                <button className="secondary-button wide" onClick={copyExportJson}>
                  Copiar JSON
                </button>
              </>
            )}
          </div>
        )}
        <button className="danger-button wide" onClick={clearVault}>
          <Trash2 size={18} />
          Limpar dados locais
        </button>
        {saved && <p className="saved-note">Ajustes salvos.</p>}
      </div>
    </section>
  );
}
