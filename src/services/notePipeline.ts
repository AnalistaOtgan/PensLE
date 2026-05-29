import {
  buildInterpretationUserPrompt,
  buildVaultContext,
  createFallbackAiResponse,
  INTERPRETATION_SYSTEM_PROMPT,
  parseAiNoteResponse,
  validateConnections
} from './aiService';
import { blobToDataUrl, dataUrlToBlob } from './audioPersistence';
import { createMarkdownDocument, countWords } from './markdownService';
import { storageService } from './storageService';
import { transcribeAudio } from './transcriptionService';
import type { AppSettings, Connection, Note } from '../types';

export interface ProcessResult {
  note: Note;
  usedFallback: boolean;
  message: string;
}

const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

function toGroqConnectionMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return `Não foi possível conectar à Groq. Verifique a internet do celular, Tailscale/VPN e tente novamente. Detalhe: ${error.message}`;
  }

  return error instanceof Error ? error.message : fallback;
}

export function hasUsableRawTranscript(rawTranscript: string): boolean {
  const normalized = rawTranscript
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) {
    return false;
  }

  return !(
    normalized.startsWith('transcricao indisponivel') ||
    normalized.includes('o audio foi capturado no navegador, mas nao pode ser enviado para ia')
  );
}

export function canProcessNoteLater(note: Note): boolean {
  return Boolean(note.audioDataUrl || hasUsableRawTranscript(note.rawTranscript));
}

export async function processRecording(audioBlob: Blob, audioUrl: string, settings: AppSettings): Promise<ProcessResult> {
  let rawTranscript = '';
  let usedFallback = false;
  let message = 'Nota criada com IA.';
  const audioDataUrl = settings.keepAudio ? await blobToDataUrl(audioBlob) : undefined;

  try {
    rawTranscript = await transcribeAudio(audioBlob, settings);
  } catch (error) {
    usedFallback = true;
    message = error instanceof Error ? error.message : 'Não foi possível transcrever o áudio.';
    rawTranscript = '';
  }

  const summaries = await storageService.getAllNotesSummaries();
  const vaultContext = buildVaultContext(summaries);
  let aiResult = createFallbackAiResponse(rawTranscript, message);

  if (!usedFallback && settings.groqApiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: INTERPRETATION_SYSTEM_PROMPT },
            { role: 'user', content: buildInterpretationUserPrompt(rawTranscript, vaultContext) }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Falha na interpretação (${response.status}).`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      aiResult = parseAiNoteResponse(data.choices?.[0]?.message?.content ?? '');
    } catch (error) {
      usedFallback = true;
      message = toGroqConnectionMessage(error, 'A IA retornou uma resposta inválida.');
      aiResult = createFallbackAiResponse(rawTranscript, message);
    }
  }

  const createdAt = new Date().toISOString();
  const noteId = id();
  const validCandidates = validateConnections(aiResult.connections, summaries);
  const connections: Connection[] = validCandidates.map((candidate) => ({
    id: id(),
    sourceNoteId: noteId,
    targetNoteId: candidate.noteId,
    reason: candidate.reason,
    strength: candidate.strength,
    createdAt
  }));
  const markdown = createMarkdownDocument({
    title: aiResult.title,
    summary: aiResult.summary,
    tags: aiResult.tags,
    createdAt,
    treatedBody: aiResult.body,
    rawTranscript
  });

  const note: Note = {
    id: noteId,
    title: aiResult.title,
    summary: aiResult.summary,
    body: aiResult.body,
    rawTranscript,
    markdown,
    tags: aiResult.tags,
    connections,
    audioUrl: settings.keepAudio ? audioUrl : undefined,
    audioDataUrl,
    createdAt,
    updatedAt: createdAt,
    wordCount: countWords(`${aiResult.body} ${rawTranscript}`)
  };

  await storageService.saveNote(note, connections);
  return { note, usedFallback, message };
}

export async function processSavedNote(noteId: string, settings: AppSettings): Promise<ProcessResult> {
  const existing = await storageService.getNote(noteId);
  if (!existing) {
    throw new Error('Nota não encontrada.');
  }

  if (!canProcessNoteLater(existing)) {
    throw new Error('Esta nota não tem áudio persistente nem transcrição bruta para processar.');
  }

  if (!settings.groqApiKey) {
    throw new Error('Configure sua API key da Groq em Ajustes para transcrever e tratar esta nota.');
  }

  let rawTranscript = hasUsableRawTranscript(existing.rawTranscript) ? existing.rawTranscript : '';
  let usedFallback = false;
  let message = 'Nota processada com IA.';

  if (!rawTranscript.trim()) {
    try {
      let audioBlob: Blob | undefined;
      if (existing.audioDataUrl) {
        audioBlob = dataUrlToBlob(existing.audioDataUrl);
      }

      if (!audioBlob) {
        throw new Error('Esta nota foi gravada antes do áudio persistente. Grave novamente para transcrever depois.');
      }
      rawTranscript = await transcribeAudio(audioBlob, settings);
    } catch (error) {
      usedFallback = true;
      message = error instanceof Error ? error.message : 'Não foi possível transcrever o áudio salvo.';
    }
  }

  const summaries = (await storageService.getAllNotesSummaries()).filter((summary) => summary.id !== existing.id);
  const vaultContext = buildVaultContext(summaries);
  let aiResult = createFallbackAiResponse(rawTranscript, message);

  if (rawTranscript.trim() && settings.groqApiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: INTERPRETATION_SYSTEM_PROMPT },
            { role: 'user', content: buildInterpretationUserPrompt(rawTranscript, vaultContext) }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`Falha na interpretação (${response.status}).`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      aiResult = parseAiNoteResponse(data.choices?.[0]?.message?.content ?? '');
    } catch (error) {
      usedFallback = true;
      message = toGroqConnectionMessage(error, 'A IA retornou uma resposta inválida.');
      aiResult = createFallbackAiResponse(rawTranscript, message);
    }
  }

  const updatedAt = new Date().toISOString();
  const validCandidates = validateConnections(aiResult.connections, summaries);
  const connections: Connection[] = validCandidates.map((candidate) => ({
    id: id(),
    sourceNoteId: existing.id,
    targetNoteId: candidate.noteId,
    reason: candidate.reason,
    strength: candidate.strength,
    createdAt: updatedAt
  }));
  const markdown = createMarkdownDocument({
    title: aiResult.title,
    summary: aiResult.summary,
    tags: aiResult.tags,
    createdAt: existing.createdAt,
    treatedBody: aiResult.body,
    rawTranscript
  });
  const note: Note = {
    ...existing,
    title: aiResult.title,
    summary: aiResult.summary,
    body: aiResult.body,
    rawTranscript,
    markdown,
    tags: aiResult.tags,
    connections,
    updatedAt,
    wordCount: countWords(`${aiResult.body} ${rawTranscript}`)
  };

  await storageService.saveNote(note, connections);
  return { note, usedFallback, message };
}
