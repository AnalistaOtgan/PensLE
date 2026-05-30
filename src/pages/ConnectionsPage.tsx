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
              const label = graphNode.title.length > 18 ? `${graphNode.title.slice(0, 18)}...` : graphNode.title;
              const fontSize = Math.max(9, 12 / globalScale);
              const x = graphNode.x ?? 0;
              const y = graphNode.y ?? 0;
              const radius = 5 + (graphNode.connectionCount * 0.8);

              // Extract hue to create variations
              const hueMatch = graphNode.color.match(/\d+/);
              const hue = hueMatch ? hueMatch[0] : 250;

              // Node Glow & Glass Fill
              ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.5)`;
              ctx.shadowBlur = 10;
              ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.15)`;
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, 2 * Math.PI);
              ctx.fill();

              // Node Border
              ctx.shadowBlur = 0;
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = `hsla(${hue}, 70%, 65%, 0.8)`;
              ctx.stroke();

              // Label Pill
              ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
              const textWidth = ctx.measureText(label).width;
              const pillWidth = textWidth + 12;
              const pillHeight = fontSize + 8;
              const pillX = x + radius + 4; // place on the right of the node
              const pillY = y - pillHeight / 2;
              const r = pillHeight / 2;

              // Draw pill shape (safe for older WebViews)
              ctx.fillStyle = 'rgba(15, 12, 24, 0.85)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pillX + r, pillY);
              ctx.lineTo(pillX + pillWidth - r, pillY);
              ctx.arc(pillX + pillWidth - r, pillY + r, r, -Math.PI / 2, Math.PI / 2);
              ctx.lineTo(pillX + r, pillY + pillHeight);
              ctx.arc(pillX + r, pillY + r, r, Math.PI / 2, -Math.PI / 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Draw Text
              ctx.fillStyle = 'rgba(240, 240, 245, 0.95)';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, pillX + pillWidth / 2, y + 0.5);
            }}
          />
        )}
      </div>
    </section>
  );
}
