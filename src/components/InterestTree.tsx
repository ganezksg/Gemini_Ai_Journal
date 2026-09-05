import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Compass,
  Sparkles,
  BookOpen,
  Plus,
  Info,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractInterests } from '../services/apiClient';
import { JournalSession, InterestMapData, InterestTopic } from '../shared/types';
import { ShareableInterestMapModal } from './ShareableInterestMapModal';
import {
  TopicFrequencyScale,
  SubtopicFrequencyScale,
  computeTopicFrequencyScale,
  computeSubtopicFrequencyScale,
} from '../utils/interestTreeScaling';

export type { TopicFrequencyScale, SubtopicFrequencyScale };
export { computeTopicFrequencyScale, computeSubtopicFrequencyScale };

// Custom Root Node: Central "Personal Core" anchor of the graph
const RootNodeComponent = ({ data }: { data: { label: string; subtitle?: string; totalTopics?: number } }) => {
  return (
    <div className="px-6 py-4.5 rounded-2xl bg-stone-950 text-stone-50 border-2 border-amber-500 shadow-lg min-w-[220px] max-w-[280px] text-center transition-all duration-200 hover:border-amber-400">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-400 border-2 border-stone-950" />
      <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[11px] font-semibold text-amber-300 uppercase tracking-widest">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Personal Core</span>
      </div>
      <div className="font-serif text-base font-medium tracking-tight text-white">
        {data.label}
      </div>
      {data.subtitle && (
        <div className="text-[11px] text-stone-300 font-sans mt-1">
          {data.subtitle}
        </div>
      )}
    </div>
  );
};

// Custom Category Node (Major Topics with frequency-scaled size and accessible textual indicator)
const CategoryNodeComponent = ({
  data,
}: {
  data: {
    label: string;
    count?: number;
    category?: string;
    description?: string;
    scale?: TopicFrequencyScale;
    isSelected?: boolean;
  };
}) => {
  const [hovered, setHovered] = useState(false);
  const count = data.count || 1;
  const frequencyLabel = count === 1 ? '1 reflection' : `${count} reflections`;
  const scale = data.scale;
  const nodeWidth = scale ? scale.nodeWidth : 200;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: `${nodeWidth}px` }}
      className={`relative px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-left ${
        scale?.nodeClass || 'bg-white border border-stone-300 shadow-2xs'
      } ${
        data.isSelected ? 'ring-2 ring-amber-600 border-amber-800 shadow-md' : ''
      } ${
        hovered ? 'scale-[1.02] shadow-sm z-30' : ''
      }`}
      aria-label={`${data.label}, Category: ${data.category || 'Theme'}, ${frequencyLabel}. ${data.description || ''}`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-stone-400" />

      {/* Category Tag & Accessible Frequency Pill */}
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full truncate max-w-[120px]">
          {data.category || 'Theme'}
        </span>
        <span
          className={`text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full transition-colors ${
            scale?.badgeClass || 'bg-stone-100 text-stone-600 font-medium'
          }`}
          title={`${frequencyLabel} in journal history`}
        >
          {frequencyLabel}
        </span>
      </div>

      {/* Topic Title */}
      <div className={`font-serif text-stone-900 mt-1 leading-snug line-clamp-2 ${scale?.titleClass || 'text-sm font-medium'}`}>
        {data.label}
      </div>

      {/* Safe Generic Description Preview (Always safe and abstracted) */}
      {data.description && (
        <p
          className={`text-xs text-stone-600 font-normal leading-relaxed mt-1.5 transition-all ${
            hovered || scale?.tier === 'prominent' ? 'line-clamp-3 text-stone-700' : 'line-clamp-1 text-stone-500'
          }`}
        >
          {data.description}
        </p>
      )}

      {/* Interactive Tooltip Card on Hover */}
      {hovered && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-64 p-3 bg-stone-900 text-stone-100 rounded-xl shadow-xl z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[9px] uppercase tracking-wider text-amber-300 font-semibold mb-0.5">
            {data.category || 'Theme'}
          </div>
          <div className="font-serif text-xs font-semibold text-white mb-1">
            {data.label}
          </div>
          <div className="text-[10px] text-amber-200 font-medium mb-1.5">
            {frequencyLabel}
          </div>
          {data.description && (
            <p className="text-[11px] text-stone-300 leading-relaxed">
              {data.description}
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-stone-400" />
    </div>
  );
};

// Custom Leaf Node (Subtopics with frequency-scaled size and accessible textual indicator)
const LeafNodeComponent = ({
  data,
}: {
  data: {
    label: string;
    prompt?: string;
    count?: number;
    description?: string;
    category?: string;
    scale?: SubtopicFrequencyScale;
    isSelected?: boolean;
  };
}) => {
  const [hovered, setHovered] = useState(false);
  const count = data.count || 1;
  const frequencyLabel = count === 1 ? '1 reflection' : `${count} reflections`;
  const scale = data.scale;
  const nodeWidth = scale ? scale.nodeWidth : 160;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: `${nodeWidth}px` }}
      className={`relative px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-left ${
        scale?.nodeClass || 'bg-stone-50 border border-stone-200 text-stone-800 shadow-2xs'
      } ${
        data.isSelected ? 'ring-2 ring-amber-600 border-amber-800 shadow-md' : ''
      } ${
        hovered ? 'scale-[1.02] shadow-sm z-30' : ''
      }`}
      aria-label={`${data.label}, Subtopic, ${frequencyLabel}. Prompt: ${data.prompt || ''}`}
    >
      <Handle type="target" position={Position.Top} className="w-1.5 h-1.5 bg-stone-400" />

      {/* Subtopic Title & Frequency */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="text-xs font-medium text-stone-800 line-clamp-1 flex-1">
          {data.label}
        </div>
        <span
          className={`text-[9px] shrink-0 font-medium ${
            scale?.badgeClass || 'text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full'
          }`}
          title={`${frequencyLabel} in journal history`}
        >
          {frequencyLabel}
        </span>
      </div>

      {data.prompt && (
        <div className="text-[10px] text-stone-500 italic line-clamp-1 leading-snug">
          "{data.prompt}"
        </div>
      )}

      {/* Hover Card for Subtopic */}
      {hovered && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2.5 bg-stone-900 text-stone-100 rounded-lg shadow-xl z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[9px] uppercase tracking-wider text-amber-300 font-semibold mb-0.5">
            {data.category || 'Subtopic'}
          </div>
          <div className="font-serif text-xs font-semibold text-white mb-0.5">
            {data.label}
          </div>
          <div className="text-[10px] text-amber-200 font-medium mb-1">
            {frequencyLabel}
          </div>
          {data.description && (
            <p className="text-[10px] text-stone-300 mb-1 leading-relaxed">
              {data.description}
            </p>
          )}
          {data.prompt && (
            <p className="text-[10px] italic text-stone-300 border-t border-stone-800 pt-1">
              "{data.prompt}"
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  rootNode: RootNodeComponent,
  categoryNode: CategoryNodeComponent,
  leafNode: LeafNodeComponent,
};

// Layout generator: Converts structured Gemini topics into frequency-scaled React Flow nodes and edges
function buildGraphFromInterestMap(data: InterestMapData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const topics = data.topics || [];

  if (topics.length === 0) {
    return { nodes, edges };
  }

  // Calculate frequency bounds across topics and subtopics for smooth normalization
  const topicFrequencies = topics.map((t) => t.frequency || 1);
  const minTopicFreq = Math.min(...topicFrequencies);
  const maxTopicFreq = Math.max(...topicFrequencies);

  const subtopicFrequencies: number[] = [];
  topics.forEach((t) => {
    (t.subtopics || []).forEach((st) => subtopicFrequencies.push(st.frequency || 1));
  });
  const maxSubFreq = subtopicFrequencies.length > 0 ? Math.max(...subtopicFrequencies) : 1;

  // Precompute each topic's frequency scale and subtree allocation width to prevent overlap
  const topicScales = topics.map((t) =>
    computeTopicFrequencyScale(t.frequency, minTopicFreq, maxTopicFreq)
  );

  let currentX = 0;
  const topicPositions: { x: number; allocWidth: number }[] = [];

  topics.forEach((topic, idx) => {
    const scale = topicScales[idx];
    const subCount = topic.subtopics?.length || 0;
    const subWidth = subCount > 0 ? subCount * 175 : 0;
    // Allocate space based on the maximum of the topic node width or its collective subtopics width
    const allocWidth = Math.max(scale.nodeWidth + 60, subWidth + 30);
    const center = currentX + allocWidth / 2;
    topicPositions.push({ x: center, allocWidth });
    currentX += allocWidth + 40; // 40px buffer between adjacent subtrees
  });

  // Position Root Node centrally above the landscape
  const rootX =
    topics.length === 1
      ? topicPositions[0].x
      : (topicPositions[0].x + topicPositions[topicPositions.length - 1].x) / 2;
  const rootY = 30;

  // 1. Root Anchor Node ("Personal Core")
  nodes.push({
    id: 'root',
    type: 'rootNode',
    position: { x: rootX - 120, y: rootY },
    data: {
      label: 'My Interest Landscape',
      subtitle: `${data.totalReflectionsAnalyzed} reflection${data.totalReflectionsAnalyzed === 1 ? '' : 's'} analyzed`,
      totalTopics: topics.length,
    },
  });

  topics.forEach((topic, idx) => {
    const scale = topicScales[idx];
    const topicPos = topicPositions[idx];
    const topicX = topicPos.x - scale.nodeWidth / 2;
    const topicY = 175;

    // 2. Category / Major Topic Node with Frequency Scaling
    nodes.push({
      id: topic.id,
      type: 'categoryNode',
      position: { x: topicX, y: topicY },
      data: {
        label: topic.name,
        category: topic.category,
        count: topic.frequency,
        description: topic.description,
        scale,
        subtopics: topic.subtopics,
      },
    });

    // Root -> Topic Edge (thickness and tone scale smoothly with frequency)
    edges.push({
      id: `e-root-${topic.id}`,
      source: 'root',
      target: topic.id,
      type: 'smoothstep',
      animated: scale.tier === 'prominent' || scale.tier === 'notable',
      style: {
        stroke: scale.edgeColor,
        strokeWidth: scale.strokeWidth,
      },
    });

    // 3. Subtopics (Leaf Nodes) with Subtopic Frequency Scaling
    const subtopics = topic.subtopics || [];
    const subCount = subtopics.length;
    const subSpacing = 175;
    const startSubX = topicPos.x - ((subCount - 1) * subSpacing) / 2;
    const subY = 325;

    subtopics.forEach((st, sIdx) => {
      const subScale = computeSubtopicFrequencyScale(st.frequency, maxSubFreq);
      const subX = startSubX + sIdx * subSpacing - subScale.nodeWidth / 2;

      nodes.push({
        id: st.id,
        type: 'leafNode',
        position: { x: subX, y: subY },
        data: {
          label: st.name,
          prompt: st.prompt,
          description: st.description,
          count: st.frequency,
          category: topic.name,
          scale: subScale,
        },
      });

      // Topic -> Subtopic Edge
      edges.push({
        id: `e-${topic.id}-${st.id}`,
        source: topic.id,
        target: st.id,
        type: 'smoothstep',
        style: {
          stroke: subScale.ratio > 0.5 ? '#d97706' : '#d6d3d1',
          strokeWidth: subScale.ratio > 0.5 ? 1.5 : 1.2,
        },
      });
    });
  });

  // 4. Inter-topic relationship connections
  if (data.relatedConnections && data.relatedConnections.length > 0) {
    const validNodeIds = new Set(nodes.map((n) => n.id));
    data.relatedConnections.forEach((conn, cIdx) => {
      if (validNodeIds.has(conn.fromTopicId) && validNodeIds.has(conn.toTopicId)) {
        edges.push({
          id: `rel-${conn.fromTopicId}-${conn.toTopicId}-${cIdx}`,
          source: conn.fromTopicId,
          target: conn.toTopicId,
          type: 'straight',
          animated: true,
          style: { stroke: '#f59e0b', strokeDasharray: '4 4', strokeWidth: 1.3 },
          label: conn.relationship || undefined,
          labelStyle: { fill: '#78716c', fontSize: 10, fontFamily: 'sans-serif' },
        });
      }
    });
  }

  return { nodes, edges };
}

interface InterestTreeProps {
  journals: JournalSession[];
  loadingJournals: boolean;
  cachedMapData?: InterestMapData | null;
  onUpdateCachedMapData?: (data: InterestMapData) => void;
  onStartJournalWithPrompt?: (prompt: string) => void;
  onStartNewJournal?: () => void;
}

export const InterestTree: React.FC<InterestTreeProps> = ({
  journals,
  loadingJournals,
  cachedMapData,
  onUpdateCachedMapData,
  onStartJournalWithPrompt,
  onStartNewJournal,
}) => {
  const { user } = useAuth();

  const [mapData, setMapData] = useState<InterestMapData | null>(cachedMapData || null);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Extract meaningful reflection entries from the authenticated user's journals
  const validReflections = useMemo(() => {
    return journals.filter(
      (j) =>
        (j.summary && j.summary.summaryText && j.summary.summaryText.trim().length > 0) ||
        (j.lastPreview && j.lastPreview.trim().length > 0)
    );
  }, [journals]);

  // Handle topic extraction via Gemini API
  const handleExtractTopics = useCallback(async () => {
    if (validReflections.length === 0) return;
    if (!user) {
      setExtractError('Authentication required. Please sign in to explore your Interest Map.');
      return;
    }

    try {
      setExtracting(true);
      setExtractError(null);

      // Format sanitized reflection entries
      const payloadJournals = validReflections.map((j) => ({
        title: j.title || 'Journal Reflection',
        createdAt: j.createdAt,
        summaryText: j.summary?.summaryText || j.lastPreview || '',
        keyThemes: j.summary?.keyThemes || j.tags || [],
        mood: j.summary?.mood,
      }));

      const existingTopicNames = mapData?.topics ? mapData.topics.map((t) => t.name) : [];

      const res = await extractInterests({
        journals: payloadJournals,
        existingTopicNames,
      });

      if (res && res.interestMap && res.interestMap.topics) {
        setMapData(res.interestMap);
        if (onUpdateCachedMapData) {
          onUpdateCachedMapData(res.interestMap);
        }
      } else {
        throw new Error('Invalid response structure received from topic extraction.');
      }
    } catch (err: any) {
      console.error('Interest extraction error:', err);
      setExtractError(err?.message || 'Failed to extract topics from your reflections.');
    } finally {
      setExtracting(false);
    }
  }, [validReflections, user, mapData, onUpdateCachedMapData]);

  // Synchronize graph nodes and edges whenever mapData changes
  useEffect(() => {
    if (mapData && mapData.topics && mapData.topics.length > 0) {
      const { nodes: newNodes, edges: newEdges } = buildGraphFromInterestMap(mapData);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [mapData, setNodes, setEdges]);

  // Auto-extract on initial load if reflections exist but no cached mapData is present
  useEffect(() => {
    if (user && !cachedMapData && !mapData && validReflections.length > 0 && !extracting && !extractError) {
      handleExtractTopics();
    }
  }, [user, cachedMapData, mapData, validReflections.length, extracting, extractError, handleExtractTopics]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // 1. Loading Journals from Firestore
  if (loadingJournals) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
        <Loader2 className="w-8 h-8 animate-spin text-amber-900 mx-auto mb-3" />
        <p className="text-sm font-medium text-stone-800">Loading your reflection journal...</p>
        <p className="text-xs text-stone-500 mt-1">Retrieving personal entries securely</p>
      </div>
    );
  }

  // 2. Insufficient Reflections state (Friendly empty message as required)
  if (validReflections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center shadow-2xs max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
          <Compass className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-900">
            Keep reflecting — your interest landscape will take shape over time.
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Every personal journal reflection you write reveals underlying curiosities, recurring themes, and mental patterns. As you record your thoughts, Gemini dynamically synthesizes them into an interactive interest map.
          </p>
        </div>
        {onStartNewJournal && (
          <div className="pt-2">
            <button
              onClick={onStartNewJournal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs sm:text-sm font-medium transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Start your first journal reflection</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Editorial Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
              <Compass className="w-3.5 h-3.5 text-amber-800" />
              <span>Interest Map</span>
            </div>
            {mapData && (
              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                Derived from {mapData.totalReflectionsAnalyzed} reflection{mapData.totalReflectionsAnalyzed === 1 ? '' : 's'}
              </span>
            )}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full" title="Protected by server-side Privacy Abstraction (SAFE_INTEREST_MAP_SCHEMA)">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Privacy-Protected Abstract Topics</span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
            Your Curiosity & Reflection Landscape
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            A spatial visualization of the themes and interests shaping your thoughts. Drag canvas to navigate, scroll to zoom, and tap any node to inspect details or launch a reflection.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2">
          {/* Share My Interest Map Button */}
          <button
            id="btn-share-interest-map"
            onClick={() => setShowShareModal(true)}
            disabled={!mapData || !mapData.topics || mapData.topics.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-950 text-xs font-medium transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={
              !mapData || !mapData.topics || mapData.topics.length === 0
                ? 'Generate topics to create a shareable landscape card'
                : 'Share your privacy-safe reflection landscape'
            }
          >
            <Share2 className="w-3.5 h-3.5 text-amber-800" />
            <span>Share My Interest Map</span>
          </button>

          <button
            onClick={handleExtractTopics}
            disabled={extracting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 text-xs font-medium transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Re-analyze reflections to update your interest landscape"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-800 ${extracting ? 'animate-spin' : ''}`} />
            <span>{extracting ? 'Analyzing...' : 'Refresh Interest Map'}</span>
          </button>
        </div>
      </div>

      {/* Extraction Error Alert */}
      {extractError && (
        <div className="bg-red-50/90 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-3 text-red-900 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not extract topics</p>
              <p className="text-red-700 mt-0.5">{extractError}</p>
            </div>
          </div>
          <button
            onClick={handleExtractTopics}
            className="text-xs font-semibold underline text-red-800 hover:text-red-950 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Canvas or Loading Container */}
      <div className="relative bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden h-[540px] sm:h-[600px] w-full">
        {extracting && (!mapData || nodes.length === 0) ? (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800">
              <Loader2 className="w-6 h-6 animate-spin text-amber-900" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-lg font-medium text-stone-900">
                Discovering your interest landscape...
              </h4>
              <p className="text-xs text-stone-500 max-w-sm">
                Gemini is synthesizing recurring curiosities and topics across your reflections.
              </p>
            </div>
          </div>
        ) : nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.3}
            maxZoom={1.6}
            attributionPosition="bottom-right"
          >
            <Background color="#e7e5e4" gap={18} size={1} variant={BackgroundVariant.Dots} />
            <Controls className="bg-white! border-stone-200! shadow-2xs! rounded-xl!" />
            <MiniMap
              className="bg-stone-50! border-stone-200! rounded-xl! overflow-hidden shadow-2xs!"
              nodeColor={(n) => {
                if (n.id === 'root') return '#1c1917';
                if (n.type === 'categoryNode') return '#b45309';
                return '#d6d3d1';
              }}
            />
          </ReactFlow>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-sm text-stone-600">No topics generated yet.</p>
            <button
              onClick={handleExtractTopics}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Extract Topics</span>
            </button>
          </div>
        )}

        {/* Selected Node Inspector Drawer / Card */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-84 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-xs rounded-xl border border-stone-200 p-5 shadow-lg transition-all animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-stone-100">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-900 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                {selectedNode.data.category || (selectedNode.id === 'root' ? 'Core Hub' : 'Topic')}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-stone-400 hover:text-stone-700 text-xs px-2 py-0.5 rounded-md hover:bg-stone-100 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Structured Presentation: Category -> Name -> Frequency -> Safe Description */}
            <div className="space-y-1.5 mb-3">
              <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                {selectedNode.data.category || (selectedNode.id === 'root' ? 'Personal Anchor' : 'Topic')}
              </div>
              <h4 className="font-serif font-semibold text-stone-900 text-lg leading-snug">
                {selectedNode.data.label}
              </h4>
              {typeof selectedNode.data.count === 'number' && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-full">
                  <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                  <span>
                    {selectedNode.data.count} {selectedNode.data.count === 1 ? 'reflection' : 'reflections'}
                  </span>
                </div>
              )}
            </div>

            {selectedNode.data.description && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 text-xs text-stone-700 leading-relaxed mb-3">
                {selectedNode.data.description}
              </div>
            )}

            {/* Related subtopics if a major topic is selected */}
            {Array.isArray(selectedNode.data.subtopics) && selectedNode.data.subtopics.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                  Subtopics & Frequency
                </div>
                <div className="space-y-1">
                  {selectedNode.data.subtopics.map((st: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-stone-50 rounded-lg border border-stone-200/60"
                    >
                      <span className="font-medium text-stone-800">{st.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {st.frequency} {st.frequency === 1 ? 'reflection' : 'reflections'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.data.prompt && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/60 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-900 block mb-1">
                  Reflection Prompt
                </span>
                <p className="text-xs italic text-stone-800 font-medium leading-relaxed">
                  "{selectedNode.data.prompt}"
                </p>
              </div>
            )}

            {onStartJournalWithPrompt && selectedNode.data.prompt && (
              <button
                onClick={() => onStartJournalWithPrompt(selectedNode.data.prompt)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs font-medium transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Reflect on this topic</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Legend with Visual Prominence Guide */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs rounded-xl border border-stone-200 px-3.5 py-2 text-[11px] text-stone-600 shadow-2xs hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-950 border border-amber-400 inline-block shadow-2xs" />
            <span className="font-medium text-stone-800">Personal Core Anchor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-700/80 inline-block shadow-2xs" />
            <span>High Frequency (Prominent)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-stone-50 border border-stone-300 inline-block" />
            <span>Lower Frequency (Quiet)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-stone-200 inline-block" />
            <span>Subtopics (Smaller)</span>
          </div>
        </div>
      </div>

      {/* Shareable Interest Map Modal */}
      <ShareableInterestMapModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        mapData={mapData}
      />
    </div>
  );
};
