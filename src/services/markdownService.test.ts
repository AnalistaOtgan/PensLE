import { describe, expect, it } from 'vitest';
import { createMarkdownDocument, markdownForDisplay } from './markdownService';

describe('createMarkdownDocument', () => {
  it('keeps treated markdown and raw transcription in separate sections', () => {
    const markdown = createMarkdownDocument({
      title: 'Ideia sobre estudo',
      summary: 'Uma nota sobre aprender melhor.',
      tags: ['estudo', 'ideia'],
      createdAt: '2026-05-29T12:00:00.000Z',
      treatedBody: '## Pensamento\n\nAprender exige **ritual**.',
      rawTranscript: 'eu tava pensando que aprender precisa de ritual'
    });

    expect(markdown).toContain('title: "Ideia sobre estudo"');
    expect(markdown).toContain('tags: [estudo, ideia]');
    expect(markdown).toContain('## Pensamento tratado');
    expect(markdown).toContain('Aprender exige **ritual**.');
    expect(markdown).toContain('## Transcrição original');
    expect(markdown).toContain('eu tava pensando que aprender precisa de ritual');
  });
});

describe('markdownForDisplay', () => {
  it('hides YAML frontmatter while preserving note sections', () => {
    const markdown = [
      '---',
      'title: "Teste"',
      '---',
      '',
      '## Pensamento tratado',
      '',
      'Corpo'
    ].join('\n');

    expect(markdownForDisplay(markdown)).toBe('## Pensamento tratado\n\nCorpo');
  });
});
