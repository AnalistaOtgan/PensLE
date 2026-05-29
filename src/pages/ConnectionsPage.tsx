import ForceGraph2D from 'react-force-graph-2d';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildGraphData } from '../services/graphService';
import { storageService } from '../services/storageService';
import type { Connection, GraphNode, Note } from '../types';

export function ConnectionsPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [savedNotes, savedConnections] = await Promise.all([
        storageService.getAllNotes(),
        storageService.getConnections()
      ]);
      setNotes(savedNotes);
      setConnections(savedConnections);
    };
    void load();
  }, []);

  const graph = useMemo(() => buildGraphData(notes, connections), [notes, connections]);

  return (
    <section className="connections-page">
      <header className="page-heading">
        <p>Mapa semântico</p>
        <h1>Conexões</h1>
      </header>

      <div className="graph-surface">
        {graph.nodes.length === 0 ? (
          <div className="empty-state">
            <h2>Sem notas conectadas</h2>
            <p>Crie notas ou carregue exemplos em Notas para visualizar o mapa.</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graph}
            backgroundColor="rgba(0,0,0,0)"
            nodeLabel={(node) => `${(node as GraphNode).title}\n${(node as GraphNode).summary}`}
            nodeColor={(node) => (node as GraphNode).color}
            nodeRelSize={5}
            linkWidth={(link) => Number((link as { width?: number }).width ?? 1)}
            linkColor={() => 'rgba(120, 130, 150, 0.45)'}
            onNodeClick={(node) => navigate(`/notas/${(node as GraphNode).id}`)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const graphNode = node as GraphNode & { x?: number; y?: number };
              const label = graphNode.title.length > 16 ? `${graphNode.title.slice(0, 16)}...` : graphNode.title;
              const fontSize = Math.max(9, 12 / globalScale);
              const x = graphNode.x ?? 0;
              const y = graphNode.y ?? 0;
              ctx.fillStyle = graphNode.color;
              ctx.beginPath();
              ctx.arc(x, y, 6 + graphNode.connectionCount, 0, 2 * Math.PI);
              ctx.fill();
              ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
              ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
              ctx.textAlign = 'right';
              ctx.fillText(label, x - 12, y + 4);
            }}
          />
        )}
      </div>
    </section>
  );
}
