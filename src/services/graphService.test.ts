import { describe, expect, it } from 'vitest';
import { buildGraphData } from './graphService';
import type { Connection, Note } from '../types';

describe('buildGraphData', () => {
  it('maps notes and valid connections into graph nodes and links', () => {
    const notes: Note[] = [
      {
        id: 'one',
        title: 'Primeira',
        summary: 'Resumo',
        body: '',
        rawTranscript: '',
        tags: ['ideia'],
        connections: [],
        createdAt: '2026-05-29T10:00:00.000Z',
        updatedAt: '2026-05-29T10:00:00.000Z',
        wordCount: 10
      },
      {
        id: 'two',
        title: 'Segunda',
        summary: 'Resumo',
        body: '',
        rawTranscript: '',
        tags: ['projeto'],
        connections: [],
        createdAt: '2026-05-29T11:00:00.000Z',
        updatedAt: '2026-05-29T11:00:00.000Z',
        wordCount: 12
      }
    ];
    const connections: Connection[] = [
      {
        id: 'c1',
        sourceNoteId: 'one',
        targetNoteId: 'two',
        reason: 'same theme',
        strength: 'strong',
        createdAt: '2026-05-29T12:00:00.000Z'
      },
      {
        id: 'c2',
        sourceNoteId: 'one',
        targetNoteId: 'missing',
        reason: 'invalid',
        strength: 'weak',
        createdAt: '2026-05-29T12:00:00.000Z'
      }
    ];

    const graph = buildGraphData(notes, connections);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.links).toEqual([
      expect.objectContaining({ source: 'one', target: 'two', strength: 'strong' })
    ]);
    expect(graph.nodes.find((node) => node.id === 'one')?.connectionCount).toBe(1);
  });
});
