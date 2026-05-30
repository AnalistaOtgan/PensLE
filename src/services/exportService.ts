import { Capacitor } from '@capacitor/core';
import type { Note } from '../types';

const EXPORT_FILE_NAME = 'pensle-notas.json';

export type ExportResult =
  | {
      mode: 'download';
      content: string;
      message: string;
    }
  | {
      mode: 'copied';
      content: string;
      message: string;
    }
  | {
      mode: 'copy-fallback';
      content: string;
      message: string;
      error: string;
    };

export async function exportNotes(notes: Note[]): Promise<ExportResult> {
  const content = JSON.stringify(notes, null, 2);

  if (Capacitor.isNativePlatform()) {
    try {
      await navigator.clipboard.writeText(content);
      return {
        mode: 'copied',
        content,
        message: 'JSON copiado para a area de transferencia.'
      };
    } catch {
      return {
        mode: 'copy-fallback',
        content,
        message: 'JSON pronto para copiar.',
        error: 'Nao foi possivel copiar automaticamente.'
      };
    }
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = EXPORT_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
  return {
    mode: 'download',
    content,
    message: 'Notas exportadas para download.'
  };
}
