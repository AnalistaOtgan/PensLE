interface MarkdownInput {
  title: string;
  summary: string;
  tags: string[];
  createdAt: string;
  treatedBody: string;
  rawTranscript: string;
}

const escapeYaml = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export function createMarkdownDocument(input: MarkdownInput): string {
  const treatedBody = input.treatedBody.trim() || '_Sem tratamento disponivel._';
  const rawTranscript = input.rawTranscript.trim() || '_Transcricao original indisponivel._';

  return [
    '---',
    `title: "${escapeYaml(input.title)}"`,
    `date: "${input.createdAt}"`,
    `tags: [${input.tags.join(', ')}]`,
    `summary: "${escapeYaml(input.summary)}"`,
    '---',
    '',
    '## Pensamento tratado',
    '',
    treatedBody,
    '',
    '---',
    '',
    '## Transcrição original',
    '',
    '```text',
    rawTranscript,
    '```',
    ''
  ].join('\n');
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function markdownForDisplay(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'nota';
}
