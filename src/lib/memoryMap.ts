import { Chat, Message } from '@/types';

export interface MemoryNode {
  id: string;
  label: string;
  count: number;
  chatIds: string[];
  messageIds: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface MemoryEdge {
  source: string;
  target: string;
  weight: number;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','out','is','are','was','were','be','been',
  'have','has','had','do','does','did','will','would','could','should','may',
  'might','can','shall','that','this','these','those','it','its','i','you',
  'he','she','we','they','me','him','her','us','them','my','your','his','our',
  'their','what','which','who','whom','when','where','why','how','all','any',
  'both','each','few','more','most','other','some','such','no','not','only',
  'own','same','so','than','too','very','just','also','even','like','back',
  'after','before','while','if','as','get','got','go','going','come','coming',
  'make','making','made','know','want','help','need','use','using','used','see',
  'tell','think','feel','take','put','let','yes','no','ok','hey','hi','hello',
  'please','thanks','thank','sure','great','good','right','well','really',
  'actually','always','never','still','again','just','already','now','here',
  'there','then','much','many','way','thing','things','something','anything',
  'everything','nothing','someone','anyone','everyone','one','two','three','can\'t',
  'don\'t','doesn\'t','isn\'t','aren\'t','wasn\'t','weren\'t','haven\'t','hasn\'t',
  'won\'t','wouldn\'t','couldn\'t','shouldn\'t','didn\'t','ll','ve','re','m','d','s',
]);

// Tech / domain keywords to boost
const DOMAIN_BOOST = new Set([
  'react','javascript','typescript','css','html','api','database','app','mobile',
  'web','code','function','component','server','client','backend','frontend',
  'ai','model','chat','gpt','llm','python','node','sql','firebase','supabase',
  'android','ios','flutter','expo','native','design','ui','ux','layout','style',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^[-']+|[-']+$/g, ''))
    .filter(t => t.length >= 3 && !STOP_WORDS.has(t));
}

function extractBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (!STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1])) {
      bigrams.push(bigram);
    }
  }
  return bigrams;
}

/** Extract memory graph from all chats */
export function buildMemoryGraph(chats: Chat[]): MemoryGraph {
  const topicMap: Map<string, { count: number; chatIds: Set<string>; messageIds: Set<string> }> = new Map();

  for (const chat of chats) {
    for (const msg of chat.messages) {
      if (!msg.content || msg.content.length < 4) continue;
      const tokens = tokenize(msg.content);
      const bigrams = extractBigrams(tokens);
      const terms = [...tokens, ...bigrams];

      for (const term of terms) {
        if (!topicMap.has(term)) {
          topicMap.set(term, { count: 0, chatIds: new Set(), messageIds: new Set() });
        }
        const entry = topicMap.get(term)!;
        // Domain keywords get a count boost
        const boost = DOMAIN_BOOST.has(term) ? 2 : 1;
        entry.count += boost;
        entry.chatIds.add(chat.id);
        entry.messageIds.add(msg.id);
      }
    }
  }

  // Keep top N most significant topics
  const sorted = [...topicMap.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 40);

  const nodes: MemoryNode[] = sorted.map(([label, data]) => ({
    id: label,
    label,
    count: data.count,
    chatIds: [...data.chatIds],
    messageIds: [...data.messageIds],
  }));

  // Build edges between nodes that share chats
  const edges: MemoryEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].chatIds.filter(id => nodes[j].chatIds.includes(id));
      if (shared.length > 0) {
        edges.push({ source: nodes[i].id, target: nodes[j].id, weight: shared.length });
      }
    }
  }

  return { nodes, edges };
}

/** Extract memory graph for a single chat */
export function buildChatMemoryGraph(chat: Chat): MemoryGraph {
  return buildMemoryGraph([chat]);
}

/** Run a simple force-directed layout simulation */
export function simulateLayout(
  nodes: MemoryNode[],
  edges: MemoryEdge[],
  width: number,
  height: number,
  iterations = 120
): MemoryNode[] {
  if (nodes.length === 0) return nodes;

  // Initialize positions in a circle
  const result = nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    const r = Math.min(width, height) * 0.32;
    return {
      ...n,
      x: width / 2 + r * Math.cos(angle),
      y: height / 2 + r * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map(result.map(n => [n.id, n]));
  const k = Math.sqrt((width * height) / Math.max(nodes.length, 1)) * 0.6;

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    // Repulsion between all nodes
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const dx = a.x! - b.x!;
        const dy = a.y! - b.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx! += fx;
        a.vy! += fy;
        b.vx! -= fx;
        b.vy! -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x! - a.x!;
      const dy = b.y! - a.y!;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force * 0.5;
      const fy = (dy / dist) * force * 0.5;
      a.vx! += fx;
      a.vy! += fy;
      b.vx! -= fx;
      b.vy! -= fy;
    }

    // Center gravity
    for (const node of result) {
      node.vx! += (width / 2 - node.x!) * 0.01;
      node.vy! += (height / 2 - node.y!) * 0.01;
    }

    // Apply velocities with cooling + damping
    const maxDisp = 20 * cooling;
    for (const node of result) {
      const speed = Math.sqrt(node.vx! ** 2 + node.vy! ** 2) || 1;
      node.x = Math.max(40, Math.min(width - 40, node.x! + (node.vx! / speed) * Math.min(speed, maxDisp)));
      node.y = Math.max(40, Math.min(height - 40, node.y! + (node.vy! / speed) * Math.min(speed, maxDisp)));
      node.vx! *= 0.5;
      node.vy! *= 0.5;
    }
  }

  return result;
}
