import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Chat } from '@/types';
import { buildMemoryGraph, buildChatMemoryGraph, simulateLayout, MemoryNode, MemoryEdge } from '@/lib/memoryMap';
import styles from './MemoryMap.module.css';

interface MemoryMapProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onClose: () => void;
}

type ViewMode = 'global' | 'chat';

const MemoryMap: React.FC<MemoryMapProps> = ({ chats, activeChatId, onSelectChat, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(activeChatId ? 'chat' : 'global');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(activeChatId);
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [edges, setEdges] = useState<MemoryEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 360, h: 480 });

  // Measure SVG container
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build and layout graph whenever inputs change
  useEffect(() => {
    let graph;
    if (viewMode === 'chat' && selectedChatId) {
      const chat = chats.find(c => c.id === selectedChatId);
      graph = chat ? buildChatMemoryGraph(chat) : { nodes: [], edges: [] };
    } else {
      graph = buildMemoryGraph(chats);
    }

    const layouted = simulateLayout(graph.nodes, graph.edges, dims.w, dims.h);
    setNodes(layouted);
    setEdges(graph.edges);
    setSelectedNode(null);
  }, [viewMode, selectedChatId, chats, dims]);

  const maxCount = nodes.reduce((m, n) => Math.max(m, n.count), 1);

  const getRadius = (count: number) => {
    const base = 14;
    const max = 36;
    return base + ((count / maxCount) * (max - base));
  };

  const getNodeColor = (node: MemoryNode, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) return '#4d9ef7';
    if (isHovered) return '#6aadff';
    const intensity = 0.3 + (node.count / maxCount) * 0.7;
    return `rgba(77, 158, 247, ${intensity})`;
  };

  const handleNodeClick = useCallback((node: MemoryNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handleJumpToChat = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  const activeChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerSpacer} />
          <span className={styles.title}>Memory Map</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${viewMode === 'global' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('global')}
          >
            All Chats
          </button>
          <button
            className={`${styles.tab} ${viewMode === 'chat' ? styles.tabActive : ''}`}
            onClick={() => setViewMode('chat')}
          >
            This Chat
          </button>
        </div>

        {/* Chat selector (only in chat mode) */}
        {viewMode === 'chat' && (
          <div className={styles.chatSelector}>
            <select
              className={styles.chatSelect}
              value={selectedChatId ?? ''}
              onChange={e => setSelectedChatId(e.target.value || null)}
            >
              <option value="">— Select a chat —</option>
              {chats.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title.length > 40 ? c.title.slice(0, 38) + '…' : c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Graph canvas */}
        <div className={styles.graphArea}>
          {nodes.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3"/>
              </svg>
              <p className={styles.emptyText}>
                {viewMode === 'chat' && !selectedChatId
                  ? 'Select a chat to view its memory'
                  : 'Not enough conversation data yet'}
              </p>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="100%" className={styles.svg}>
              <defs>
                <radialGradient id="nodeGrad" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                </radialGradient>
              </defs>

              {/* Edges */}
              <g className={styles.edgesGroup}>
                {edges.map((edge, i) => {
                  const src = nodes.find(n => n.id === edge.source);
                  const tgt = nodes.find(n => n.id === edge.target);
                  if (!src || !tgt || src.x == null || tgt.x == null) return null;
                  const isHighlighted =
                    selectedNode?.id === edge.source || selectedNode?.id === edge.target;
                  return (
                    <line
                      key={i}
                      x1={src.x} y1={src.y}
                      x2={tgt.x} y2={tgt.y}
                      stroke={isHighlighted ? 'rgba(77,158,247,0.55)' : 'rgba(128,128,128,0.18)'}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g className={styles.nodesGroup}>
                {nodes.map(node => {
                  if (node.x == null || node.y == null) return null;
                  const r = getRadius(node.count);
                  const isHovered = hoveredNode === node.id;
                  const isSelected = selectedNode?.id === node.id;
                  const fill = getNodeColor(node, isHovered, isSelected);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y})`}
                      className={styles.nodeGroup}
                      onClick={() => handleNodeClick(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle r={r + 4} fill="transparent" />
                      <circle
                        r={r}
                        fill={fill}
                        stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.15)'}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{ transition: 'r 0.2s, fill 0.2s' }}
                      />
                      <circle r={r} fill="url(#nodeGrad)" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={Math.max(9, Math.min(13, r * 0.55))}
                        fill="white"
                        fontWeight={isSelected ? '700' : '500'}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Selected node details */}
        {selectedNode && (
          <div className={styles.nodeDetails}>
            <div className={styles.nodeDetailsHeader}>
              <span className={styles.nodeLabel}>{selectedNode.label}</span>
              <span className={styles.nodeCount}>{selectedNode.count}× mentioned</span>
            </div>
            <p className={styles.nodeChatsLabel}>
              Appears in {selectedNode.chatIds.length} chat{selectedNode.chatIds.length !== 1 ? 's' : ''}:
            </p>
            <div className={styles.nodeChatList}>
              {selectedNode.chatIds.map(cid => {
                const c = chats.find(x => x.id === cid);
                if (!c) return null;
                return (
                  <button
                    key={cid}
                    className={styles.nodeChatItem}
                    onClick={() => handleJumpToChat(cid)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span>{c.title.length > 36 ? c.title.slice(0, 34) + '…' : c.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        {nodes.length > 0 && !selectedNode && (
          <div className={styles.legend}>
            <span className={styles.legendText}>Tap any node to see related chats</span>
            <div className={styles.legendDots}>
              <div className={styles.legendDot} style={{ width: 10, height: 10, opacity: 0.4 }} />
              <div className={styles.legendDot} style={{ width: 16, height: 16, opacity: 0.7 }} />
              <div className={styles.legendDot} style={{ width: 22, height: 22, opacity: 1 }} />
            </div>
            <span className={styles.legendText}>Frequency →</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryMap;
