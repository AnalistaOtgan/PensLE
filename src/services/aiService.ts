import type { AiConnectionCandidate, AiNoteResponse, NoteSummary } from '../types';

export const INTERPRETATION_SYSTEM_PROMPT = `Voce e um sistema especializado em organizacao de conhecimento pessoal.
Sua funcao e transformar uma transcricao de audio em uma nota Markdown util sem apagar o rastro original.

Tarefas:
1. Estruturar o pensamento tratado em Markdown claro.
2. Extrair tags semanticas reais.
3. Identificar conexoes genuinas com notas existentes.

Regras criticas:
- Preserve o idioma, intencao e nivel de certeza da pessoa.
- Use as notas fornecidas no contexto para identificar se o usuario esta se referindo a uma situacao ou problema continuo.
- Nao invente fatos, projetos ou pessoas.
- Separe mentalmente a transcricao bruta da versao tratada: o campo "body" deve ser a versao organizada, nao uma copia literal.
- Conecte apenas quando houver relacao semantica clara: mesmo tema, pessoa, projeto, conceito, decisao, causa ou continuidade direta.
- Prefira retornar connections: [] a criar conexoes fracas.
- Cada conexao precisa de um motivo especifico e verificavel.
- Retorne apenas JSON valido, sem Markdown fora do JSON.

Formato:
{
  "title": "Titulo conciso com ate 60 caracteres",
  "summary": "Resumo de 1-2 frases",
  "body": "Markdown tratado e bem estruturado",
  "tags": ["tag-principal", "tipo-de-conteudo"],
  "connections": [
    {
      "noteId": "id_da_nota_existente",
      "noteTitle": "Titulo da nota",
      "reason": "Motivo especifico da conexao",
      "strength": "strong|moderate|weak"
    }
  ],
  "wikilinks": ["[[Titulo relacionado]]"]
}

Tags:
- 2 a 6 tags.
- Minusculas, sem espacos, use hifen.
- Priorize FORTEMENTE a reutilizacao das tags que ja existem no contexto fornecido.
- Nao crie novas tags aleatorias se o assunto for o mesmo de notas anteriores.

Markdown:
- Use headers quando houver mais de uma ideia.
- Use listas para sequencias ou tarefas.
- Use negrito apenas para conceitos-chave.
- Nao inclua a transcricao original no body; o app adiciona essa secao depois.`;

export function buildInterpretationUserPrompt(transcription: string, vaultContext: string): string {
  return `TRANSCRICAO DO AUDIO:
"""
${transcription}
"""

NOTAS EXISTENTES NO APP (para identificar conexoes):
"""
${vaultContext || 'Nenhuma nota existente.'}
"""

Analise a transcricao e retorne o JSON conforme instruido.`;
}

export function parseAiNoteResponse(raw: string): AiNoteResponse {
  const jsonText = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const parsed = JSON.parse(jsonText) as Partial<AiNoteResponse>;

  if (!parsed.title || !parsed.summary || !parsed.body || !Array.isArray(parsed.tags)) {
    throw new Error('AI response is missing required note fields.');
  }

  return {
    title: parsed.title.slice(0, 80),
    summary: parsed.summary,
    body: parsed.body,
    tags: normalizeTags(parsed.tags),
    connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    wikilinks: Array.isArray(parsed.wikilinks) ? parsed.wikilinks : []
  };
}

export function normalizeTags(tags: string[]): string[] {
  const normalized = tags
    .map((tag) =>
      tag
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .filter(Boolean);

  return Array.from(new Set(normalized)).slice(0, 6);
}

export function validateConnections(
  candidates: AiConnectionCandidate[],
  existingNotes: NoteSummary[]
): AiConnectionCandidate[] {
  const existingIds = new Set(existingNotes.map((note) => note.id));
  const seen = new Set<string>();
  const valid = candidates.filter((candidate) => {
    if (!existingIds.has(candidate.noteId) || seen.has(candidate.noteId)) {
      return false;
    }
    if (!['strong', 'moderate', 'weak'].includes(candidate.strength)) {
      return false;
    }
    seen.add(candidate.noteId);
    return true;
  });

  const stronger = valid.filter((connection) => connection.strength !== 'weak');
  const weak = valid.filter((connection) => connection.strength === 'weak');
  const allowed = stronger.length >= 2 ? stronger : [...stronger, ...weak];

  return allowed.slice(0, 5);
}

export function buildVaultContext(notes: NoteSummary[]): string {
  return notes
    .slice(0, 20)
    .map(
      (note) =>
        `ID: ${note.id} | Titulo: ${note.title} | Tags: ${note.tags.join(', ')} | Resumo: ${note.summary}`
    )
    .join('\n');
}

export function createFallbackAiResponse(rawTranscript: string, reason?: string): AiNoteResponse {
  const compact = rawTranscript.trim();
  if (!compact) {
    const message = reason ?? 'A transcricao nao foi gerada.';
    return {
      title: 'Áudio salvo sem transcrição',
      summary: `O áudio foi salvo, mas a IA não transcreveu. Motivo: ${message}`,
      body: [
        '## Status',
        '',
        'O áudio foi capturado e salvo para comparação, mas ainda não há transcrição.',
        '',
        '## Motivo',
        '',
        message,
        '',
        '## Próximo passo',
        '',
        'Confira a API key em Ajustes e tente uma nova captura.'
      ].join('\n'),
      tags: ['captura', 'sem-transcricao'],
      connections: [],
      wikilinks: []
    };
  }

  return {
    title: compact.split(/[.!?\n]/)[0]?.slice(0, 60) || 'Pensamento capturado',
    summary: compact.slice(0, 180),
    body: `## Registro\n\n${compact}`,
    tags: ['captura', 'sem-ia'],
    connections: [],
    wikilinks: []
  };
}
