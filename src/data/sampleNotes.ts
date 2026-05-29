import type { Connection, Note } from '../types';

export function createSampleNotes(): { notes: Note[]; connections: Connection[] } {
  const now = new Date().toISOString();
  const notes: Note[] = [
    {
      id: 'sample-ritual',
      title: 'Ritual de estudo',
      summary: 'Uma reflexão sobre tornar o estudo mais consistente por meio de rituais simples.',
      body: '## Ideia\n\nA consistência melhora quando o estudo começa sempre pelo mesmo pequeno gesto.',
      rawTranscript: 'eu estava pensando que estudar fica mais facil quando existe um ritual pequeno antes',
      tags: ['estudo', 'reflexao'],
      connections: [],
      createdAt: now,
      updatedAt: now,
      wordCount: 31
    },
    {
      id: 'sample-projetos',
      title: 'Projetos como trilhas',
      summary: 'Projetos pessoais funcionam melhor quando viram trilhas visíveis de decisões.',
      body: '## Observação\n\nCada decisão registrada reduz o custo de retomar um projeto depois.',
      rawTranscript: 'projetos pessoais precisam deixar rastros para eu conseguir voltar depois',
      tags: ['projetos', 'ideia'],
      connections: [],
      createdAt: now,
      updatedAt: now,
      wordCount: 25
    }
  ];
  const connections: Connection[] = [
    {
      id: 'sample-connection',
      sourceNoteId: 'sample-ritual',
      targetNoteId: 'sample-projetos',
      reason: 'Ambas falam sobre criar sistemas leves para manter continuidade.',
      strength: 'moderate',
      createdAt: now
    }
  ];

  return { notes, connections };
}
