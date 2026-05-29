import type { Connection, GraphData, Note } from '../types';
import { tagColor } from './tagColor';

const widthByStrength = {
  strong: 3,
  moderate: 2,
  weak: 1
};

export function buildGraphData(notes: Note[], connections: Connection[]): GraphData {
  const noteIds = new Set(notes.map((note) => note.id));
  const validLinks = connections.filter(
    (connection) => noteIds.has(connection.sourceNoteId) && noteIds.has(connection.targetNoteId)
  );

  const counts = new Map<string, number>();
  validLinks.forEach((connection) => {
    counts.set(connection.sourceNoteId, (counts.get(connection.sourceNoteId) ?? 0) + 1);
    counts.set(connection.targetNoteId, (counts.get(connection.targetNoteId) ?? 0) + 1);
  });

  return {
    nodes: notes.map((note) => ({
      id: note.id,
      title: note.title,
      summary: note.summary,
      tags: note.tags,
      color: tagColor(note.tags[0] ?? 'nota'),
      connectionCount: counts.get(note.id) ?? 0
    })),
    links: validLinks.map((connection) => ({
      source: connection.sourceNoteId,
      target: connection.targetNoteId,
      reason: connection.reason,
      strength: connection.strength,
      width: widthByStrength[connection.strength]
    }))
  };
}
