import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus,
  Compass,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  X,
  Sprout,
  TreePine,
  Layers,
  Leaf,
  Laptop,
  Code,
  Heart,
  Activity,
  Users
} from 'lucide-react';
import { SafeInterestMapData, SafeInterestTopic, SafeInterestSubtopic } from '../shared/types';

interface OrganicTopicsTreeProps {
  mapData?: SafeInterestMapData | null;
  reflectionCount?: number;
  onSelectTopic?: (topic: SafeInterestTopic) => void;
  onStartJournalWithPrompt?: (prompt: string) => void;
  onPlantFirstReflection?: () => void;
}

// Category botanical color themes with guaranteed high contrast
interface BotanicalTheme {
  primary: string;       // Leaf fill
  stroke: string;        // Leaf outline / veins
  text: string;          // Deep contrast text
  badgeBg: string;       // Frequency badge bg
  badgeText: string;     // Frequency badge text
  branch: string;        // Branch stroke color
  accent: string;        // Glow / highlight
}

const BOTANICAL_PALETTES: Record<string, BotanicalTheme> = {
  'Technology & Building': {
    primary: '#6D9480',
    stroke: '#2D543F',
    text: '#142E20',
    badgeBg: '#E7F2EB',
    badgeText: '#1E432E',
    branch: '#517460',
    accent: '#A4C8B2',
  },
  'Inner Wellbeing': {
    primary: '#9582A9',
    stroke: '#584370',
    text: '#27173B',
    badgeBg: '#F2ECF7',
    badgeText: '#3F285C',
    branch: '#745F8B',
    accent: '#CABADE',
  },
  'Relationships & Community': {
    primary: '#D98978',
    stroke: '#9E4737',
    text: '#45160E',
    badgeBg: '#FCECE6',
    badgeText: '#732A1C',
    branch: '#B05E4C',
    accent: '#F3BDB2',
  },
  'Health & Vitality': {
    primary: '#7FA86D',
    stroke: '#436E33',
    text: '#18330D',
    badgeBg: '#EDF5E7',
    badgeText: '#2B4F1A',
    branch: '#5C844A',
    accent: '#B0D5A0',
  },
  'Life Planning': {
    primary: '#D49F4E',
    stroke: '#966318',
    text: '#382204',
    badgeBg: '#FAF0DC',
    badgeText: '#66410A',
    branch: '#A67023',
    accent: '#F2CD8B',
  },
  'Personal Growth & Creativity': {
    primary: '#688FA3',
    stroke: '#2F576A',
    text: '#0D232F',
    badgeBg: '#E7F1F6',
    badgeText: '#1B4154',
    branch: '#4A7185',
    accent: '#9EC2D4',
  },
};

const DEFAULT_THEME: BotanicalTheme = {
  primary: '#6C8C77',
  stroke: '#2B4E38',
  text: '#14291D',
  badgeBg: '#EBF2ED',
  badgeText: '#1E3E2B',
  branch: '#547560',
  accent: '#A9C7B4',
};

// Safe, short topic label cleaner to prevent text overflow
const cleanTopicName = (name: string): string => {
  if (!name) return 'Reflection Theme';
  let cleaned = name.trim();
  // Strip overly verbose prefixes
  cleaned = cleaned.replace(/^(thoughts|concerns|reflections|issues|notes)\s+(about|on|regarding|with)\s+/i, '');
  if (cleaned.length > 24) {
    cleaned = cleaned.slice(0, 22).trim() + '…';
  }
  return cleaned;
};

// Map topics and categories to representative icons
const getTopicIcon = (topic: SafeInterestTopic) => {
  const cat = (topic.category || '').toLowerCase();
  const name = (topic.name || '').toLowerCase();

  // Technology & Building
  if (
    cat.includes('tech') ||
    cat.includes('build') ||
    name.includes('tech') ||
    name.includes('code') ||
    name.includes('software') ||
    name.includes('dev') ||
    name.includes('app') ||
    name.includes('ai') ||
    name.includes('program') ||
    name.includes('system') ||
    name.includes('web') ||
    name.includes('data') ||
    name.includes('product')
  ) {
    return Laptop;
  }

  // Inner Wellbeing & Mindfulness
  if (
    cat.includes('wellbeing') ||
    cat.includes('inner') ||
    cat.includes('mind') ||
    name.includes('mindful') ||
    name.includes('peace') ||
    name.includes('calm') ||
    name.includes('meditat') ||
    name.includes('gratitude') ||
    name.includes('emotion') ||
    name.includes('soul') ||
    name.includes('spirit') ||
    name.includes('stress') ||
    name.includes('anxiety') ||
    name.includes('sleep')
  ) {
    return Heart;
  }

  // Health & Vitality
  if (
    cat.includes('health') ||
    cat.includes('vital') ||
    name.includes('health') ||
    name.includes('workout') ||
    name.includes('fitness') ||
    name.includes('exercise') ||
    name.includes('energy') ||
    name.includes('nutrition') ||
    name.includes('diet') ||
    name.includes('body') ||
    name.includes('movement')
  ) {
    return Activity;
  }

  // Relationships & Community
  if (
    cat.includes('relation') ||
    cat.includes('communit') ||
    name.includes('friend') ||
    name.includes('family') ||
    name.includes('partner') ||
    name.includes('people') ||
    name.includes('team') ||
    name.includes('love') ||
    name.includes('social') ||
    name.includes('connect') ||
    name.includes('parent')
  ) {
    return Users;
  }

  // Life Planning & Direction
  if (
    cat.includes('plan') ||
    cat.includes('life') ||
    name.includes('career') ||
    name.includes('goal') ||
    name.includes('future') ||
    name.includes('vision') ||
    name.includes('direction') ||
    name.includes('path') ||
    name.includes('decision') ||
    name.includes('purpose') ||
    name.includes('strategy')
  ) {
    return Compass;
  }

  // Learning, Personal Growth & Creativity
  if (
    cat.includes('growth') ||
    cat.includes('learn') ||
    cat.includes('creativ') ||
    name.includes('learn') ||
    name.includes('book') ||
    name.includes('read') ||
    name.includes('study') ||
    name.includes('skill') ||
    name.includes('write') ||
    name.includes('writing') ||
    name.includes('art') ||
    name.includes('curiosity')
  ) {
    return BookOpen;
  }

  return Leaf;
};

export const OrganicTopicsTree: React.FC<OrganicTopicsTreeProps> = ({
  mapData,
  reflectionCount,
  onSelectTopic,
  onStartJournalWithPrompt,
  onPlantFirstReflection,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const [hoveredSubtopicId, setHoveredSubtopicId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const topics = useMemo(() => mapData?.topics || [], [mapData]);

  // Determine effective reflection count from props or topic frequencies
  const effectiveCount = useMemo(() => {
    if (typeof reflectionCount === 'number') return reflectionCount;
    if (topics.length === 0) return 0;
    return Math.max(
      topics.reduce((acc, t) => acc + (t.frequency || 1), 0),
      topics.length
    );
  }, [reflectionCount, topics]);

  // Determine botanical growth stage organically:
  // 0 reflections → small seedling sprout
  // 1–2 reflections → small sprout/young plant
  // 3–5 reflections → small plant with several branches
  // 6–10 reflections → developing tree
  // 11+ reflections → full mature tree/canopy
  const growthStage = useMemo(() => {
    const topicCount = topics.length;
    if (effectiveCount === 0 || topicCount === 0) {
      return {
        stage: 'seedling' as const,
        stageName: 'Tender Sprout',
        subtitle: '0 reflections planted yet',
        badgeBg: '#EEF5EF',
        badgeText: '#2D4B38',
        trunkHeight: 75,
        trunkWidth: 14,
        maxSpread: 35,
        baseRadius: 90,
        isWoody: false,
      };
    }
    if (effectiveCount <= 2) {
      return {
        stage: 'sprout' as const,
        stageName: 'Young Plant',
        subtitle: `${effectiveCount} reflection${effectiveCount === 1 ? '' : 's'} • ${topicCount} ${topicCount === 1 ? 'theme' : 'themes'}`,
        badgeBg: '#E8F3EB',
        badgeText: '#23442E',
        trunkHeight: 125,
        trunkWidth: 16,
        maxSpread: topicCount === 1 ? 25 : 54,
        baseRadius: 145,
        isWoody: false,
      };
    }
    if (effectiveCount <= 5) {
      return {
        stage: 'small-plant' as const,
        stageName: 'Branching Plant',
        subtitle: `${effectiveCount} reflections • ${topicCount} themes`,
        badgeBg: '#E2EFE6',
        badgeText: '#1E3E28',
        trunkHeight: 185,
        trunkWidth: 26,
        maxSpread: 85,
        baseRadius: 195,
        isWoody: false,
      };
    }
    if (effectiveCount <= 10) {
      return {
        stage: 'developing' as const,
        stageName: 'Developing Tree',
        subtitle: `${effectiveCount} reflections • ${topicCount} themes`,
        badgeBg: '#D8EADF',
        badgeText: '#173621',
        trunkHeight: 245,
        trunkWidth: 42,
        maxSpread: 118,
        baseRadius: 240,
        isWoody: true,
      };
    }
    // 11+ reflections: full mature tree/canopy
    return {
      stage: 'mature' as const,
      stageName: 'Mature Canopy Tree',
      subtitle: `${effectiveCount} reflections • ${topicCount} themes`,
      badgeBg: '#CDE5D6',
      badgeText: '#13301B',
      trunkHeight: 295,
      trunkWidth: 56,
      maxSpread: 136,
      baseRadius: 275,
      isWoody: true,
    };
  }, [effectiveCount, topics.length]);

  // Dynamic Frequency Calculations
  const { maxFrequency, minFrequency } = useMemo(() => {
    if (topics.length === 0) return { maxFrequency: 1, minFrequency: 1 };
    const freqs = topics.map((t) => t.frequency || 1);
    return {
      maxFrequency: Math.max(...freqs),
      minFrequency: Math.min(...freqs),
    };
  }, [topics]);

  // Selected topic object
  const selectedTopic = useMemo(() => {
    if (!selectedTopicId) return null;
    return topics.find((t) => t.id === selectedTopicId) || null;
  }, [selectedTopicId, topics]);

  // Canvas Geometry Layout Engine
  // Standard SVG view coordinate system: 1000w x 720h
  const layout = useMemo(() => {
    const W = 1000;
    const H = 720;
    const trunkBase = { x: W / 2, y: H - 55 };
    const trunkFork = { x: W / 2, y: H - 55 - growthStage.trunkHeight };

    const topicCount = topics.length;

    // Angular span adapts to topic count and growth stage
    const maxSpread = growthStage.maxSpread;
    let angleStep = 0;
    let startAngle = 0;

    if (topicCount === 1) {
      startAngle = 0;
      angleStep = 0;
    } else if (topicCount === 2) {
      startAngle = -26;
      angleStep = 52;
    } else if (topicCount > 2) {
      angleStep = maxSpread / (topicCount - 1);
      startAngle = -(maxSpread / 2);
    }

    const topicNodes = topics.map((topic, i) => {
      const angleDeg = topicCount === 1 ? 0 : startAngle + i * angleStep;
      const angleRad = ((angleDeg - 90) * Math.PI) / 180;

      const freq = topic.frequency || 1;
      const freqNorm = maxFrequency === minFrequency ? 0.5 : (freq - minFrequency) / Math.max(1, maxFrequency - minFrequency);

      // Radius from trunk fork: scales with stage and frequency
      const baseRadius = growthStage.baseRadius;
      const radius = baseRadius + freqNorm * 45 + (topicCount > 2 && i % 2 === 1 ? -15 : 15);

      const leafX = trunkFork.x + radius * Math.cos(angleRad);
      const leafY = trunkFork.y + radius * Math.sin(angleRad) * 0.85;

      const displayName = cleanTopicName(topic.name);

      // Leaf size & icon prominence strictly proportional to frequency
      const leafRadius = Math.round(22 + freqNorm * 13); // 22px to 35px radius
      const iconSize = Math.round(18 + freqNorm * 7);    // 18px to 25px icon size

      // Dynamic branch thickness based on stage and topic prominence
      const stageBranchBase = growthStage.stage === 'sprout' ? 3.5 : growthStage.stage === 'small-plant' ? 5.5 : growthStage.stage === 'developing' ? 7.5 : 9.5;
      const branchThickness = stageBranchBase + freqNorm * 4.5;

      // Subtopics (limit to 3 for clean botanical feel)
      const subtopics = (topic.subtopics || []).slice(0, 3);
      const subtopicNodes = subtopics.map((sub, sIdx) => {
        const subCount = subtopics.length;
        const subSpread = 50;
        const subStartAngle = angleDeg - subSpread / 2;
        const subAngle = subCount > 1 ? subStartAngle + (sIdx / (subCount - 1)) * subSpread : angleDeg;
        const subAngleRad = ((subAngle - 90) * Math.PI) / 180;

        const subDist = 58 + (sub.frequency || 1) * 5;
        const subX = leafX + subDist * Math.cos(subAngleRad);
        const subY = leafY + subDist * Math.sin(subAngleRad) * 0.88;

        const subDisplayName = sub.name.length > 22 ? sub.name.slice(0, 20) + '…' : sub.name;

        return {
          ...sub,
          displayName: subDisplayName,
          x: subX,
          y: subY,
          angle: subAngle,
        };
      });

      // Curving Bezier control points for sweeping branches
      const cp1X = trunkFork.x + (leafX - trunkFork.x) * 0.28;
      const cp1Y = trunkFork.y - (growthStage.stage === 'sprout' ? 15 : 35);
      const cp2X = trunkFork.x + (leafX - trunkFork.x) * 0.72;
      const cp2Y = leafY + 30;

      const theme = BOTANICAL_PALETTES[topic.category] || DEFAULT_THEME;
      const IconComponent = getTopicIcon(topic);

      // Tooltip position (above leaf, or below if near top)
      const isNearTop = leafY < 230;
      const tooltipX = Math.max(140, Math.min(860, leafX));
      const tooltipY = isNearTop ? leafY + leafRadius + 18 : leafY - leafRadius - 18;

      return {
        ...topic,
        displayName,
        leafRadius,
        iconSize,
        IconComponent,
        x: leafX,
        y: leafY,
        angleDeg,
        branchThickness,
        cp1X,
        cp1Y,
        cp2X,
        cp2Y,
        theme,
        isNearTop,
        tooltipX,
        tooltipY,
        subtopicNodes,
      };
    });

    return { W, H, trunkBase, trunkFork, topicNodes };
  }, [topics, maxFrequency, minFrequency, growthStage]);

  const hoveredNode = useMemo(() => {
    if (!hoveredTopicId) return null;
    return layout.topicNodes.find((n) => n.id === hoveredTopicId) || null;
  }, [hoveredTopicId, layout.topicNodes]);

  const hoveredSubtopic = useMemo(() => {
    if (!hoveredSubtopicId) return null;
    for (const node of layout.topicNodes) {
      const sub = node.subtopicNodes.find((s) => s.id === hoveredSubtopicId);
      if (sub) return { ...sub, parentCategory: node.category, theme: node.theme };
    }
    return null;
  }, [hoveredSubtopicId, layout.topicNodes]);

  // Pan and drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .interactive-leaf')) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedTopicId(null);
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[700px] bg-gradient-to-b from-[#FAF8F5] via-[#F6F3EE] to-[#EFEAE2] rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-xs flex flex-col select-none">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Dynamic Growth Stage Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5DFD5] shadow-2xs text-xs text-[#2A3B30] font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4A7258] animate-pulse" />
          <span className="font-semibold text-[#1F3628]">{growthStage.stageName}</span>
          <span className="text-[#7A8A7F] text-[11px] hidden sm:inline">• {growthStage.subtitle}</span>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-[#E5DFD5] shadow-2xs">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 rounded-xl text-[#4A574F] hover:bg-[#F2EFE9] hover:text-[#1E2922] transition-colors"
            title="Zoom In"
            aria-label="Zoom in on tree"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded-xl text-[#4A574F] hover:bg-[#F2EFE9] hover:text-[#1E2922] transition-colors"
            title="Zoom Out"
            aria-label="Zoom out on tree"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-xl text-[#4A574F] hover:bg-[#F2EFE9] hover:text-[#1E2922] transition-colors"
            title="Reset View"
            aria-label="Reset tree view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main SVG Interactive Tree Canvas */}
      <div
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${layout.W} ${layout.H}`}
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '50% 68%',
          }}
        >
          <defs>
            {/* Trunk bark gradient */}
            <linearGradient id="trunkBark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#574436" />
              <stop offset="35%" stopColor="#7B6350" />
              <stop offset="70%" stopColor="#8E7562" />
              <stop offset="100%" stopColor="#4E3B2E" />
            </linearGradient>

            {/* Young sapling stem gradient */}
            <linearGradient id="saplingStem" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4D6B56" />
              <stop offset="50%" stopColor="#6E8E76" />
              <stop offset="100%" stopColor="#3E5C46" />
            </linearGradient>

            {/* Soil mound gradient */}
            <linearGradient id="soilMound" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87715E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#635141" stopOpacity="0.8" />
            </linearGradient>

            {/* Soft leaf drop shadow */}
            <filter id="leafShadow" x="-15%" y="-15%" width="130%" height="135%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#261E17" floodOpacity="0.12" />
            </filter>

            {/* Soft glow for selection */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND: Atmospheric sky warmth & gentle botanical sun */}
          <g opacity="0.75">
            <circle cx="500" cy="180" r="180" fill="#FFFCEE" opacity="0.65" />
            <circle cx="220" cy="200" r="120" fill="#FFFDF8" opacity="0.4" />
            <circle cx="780" cy="220" r="140" fill="#FFFDF8" opacity="0.4" />
          </g>

          {/* BASE: Organic soil mound with moss bumps */}
          <g id="ground-soil">
            <path
              d={`M ${layout.W / 2 - 340} ${layout.H - 15} Q ${layout.W / 2} ${layout.H - 80} ${layout.W / 2 + 340} ${layout.H - 15} Z`}
              fill="url(#soilMound)"
            />
            {/* Moss tufts */}
            <path
              d={`M ${layout.W / 2 - 240} ${layout.H - 22} Q ${layout.W / 2 - 180} ${layout.H - 46} ${layout.W / 2 - 120} ${layout.H - 28}`}
              fill="#6B8566"
              opacity="0.6"
            />
            <path
              d={`M ${layout.W / 2 + 100} ${layout.H - 28} Q ${layout.W / 2 + 180} ${layout.H - 50} ${layout.W / 2 + 250} ${layout.H - 20}`}
              fill="#6B8566"
              opacity="0.6"
            />
          </g>

          {/* ================================================================= */}
          {/* STAGE 0: TENDER SEEDLING (0 REFLECTIONS) */}
          {/* ================================================================= */}
          {growthStage.stage === 'seedling' && (
            <g id="stage-seedling" className="animate-in fade-in duration-300">
              {/* Little seed shell at root */}
              <ellipse cx="500" cy="625" rx="14" ry="9" fill="#544133" />

              {/* Curving tender green shoot */}
              <path
                d="M 500 625 Q 492 560 500 500 Q 508 450 500 420"
                stroke="#527B60"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />

              {/* Left tender cotyledon leaf */}
              <g transform="translate(500, 420)">
                <path
                  d="M 0 0 C -35 -25, -60 10, 0 35 Z"
                  fill="#7BA887"
                  stroke="#385C43"
                  strokeWidth="2.5"
                  filter="url(#leafShadow)"
                />
                <path d="M 0 0 C -20 5, -35 15, -45 10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none" />
              </g>

              {/* Right tender cotyledon leaf */}
              <g transform="translate(500, 420)">
                <path
                  d="M 0 0 C 35 -25, 60 10, 0 35 Z"
                  fill="#88B895"
                  stroke="#385C43"
                  strokeWidth="2.5"
                  filter="url(#leafShadow)"
                />
                <path d="M 0 0 C 20 5, 35 15, 45 10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" fill="none" />
              </g>

              {/* Little central sprout bud */}
              <circle cx="500" cy="415" r="7" fill="#A5D4B2" stroke="#385C43" strokeWidth="2" />

              {/* Welcoming invitation card centered above seedling */}
              <foreignObject x="300" y="190" width="400" height="200" className="pointer-events-auto">
                <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-[#E5DFD5] shadow-md flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F3EB] text-[#2C523B] flex items-center justify-center border border-[#CFE4D6]">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1E2922]">
                      Your reflection tree begins here
                    </h3>
                    <p className="text-xs text-[#6C7B71] max-w-xs mt-1 leading-relaxed">
                      Plant your thoughts into your journal. As you reflect, Gemini translates them into branches and leaves of recurring personal themes.
                    </p>
                  </div>
                  {onPlantFirstReflection && (
                    <button
                      onClick={onPlantFirstReflection}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] text-white text-xs font-medium shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Plant your first reflection</span>
                    </button>
                  )}
                </div>
              </foreignObject>
            </g>
          )}

          {/* ================================================================= */}
          {/* STAGES 1 TO 4: TRUNK & BRANCHES */}
          {/* ================================================================= */}
          {growthStage.stage !== 'seedling' && (
            <>
              {/* TRUNK */}
              <g id="tree-trunk">
                {/* Buttress roots radiating from trunk base on developing / mature tree */}
                {growthStage.isWoody ? (
                  <>
                    <path
                      d={`M ${layout.trunkBase.x - 25} ${layout.trunkBase.y} Q ${layout.trunkBase.x - 70} ${layout.trunkBase.y + 12} ${layout.trunkBase.x - 140} ${layout.trunkBase.y + 20}`}
                      stroke="#5C4737"
                      strokeWidth={growthStage.trunkWidth * 0.28}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={`M ${layout.trunkBase.x + 25} ${layout.trunkBase.y} Q ${layout.trunkBase.x + 70} ${layout.trunkBase.y + 12} ${layout.trunkBase.x + 145} ${layout.trunkBase.y + 20}`}
                      stroke="#5C4737"
                      strokeWidth={growthStage.trunkWidth * 0.28}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </>
                ) : (
                  /* Tender cotyledon leaves at base of young sprout / plant */
                  <g>
                    <path
                      d={`M ${layout.trunkBase.x} ${layout.trunkBase.y - 12} C ${layout.trunkBase.x - 32} ${layout.trunkBase.y - 25}, ${layout.trunkBase.x - 45} ${layout.trunkBase.y + 5}, ${layout.trunkBase.x} ${layout.trunkBase.y + 6}`}
                      fill="#82AD8F"
                      stroke="#385C43"
                      strokeWidth="1.8"
                      filter="url(#leafShadow)"
                    />
                    <path
                      d={`M ${layout.trunkBase.x} ${layout.trunkBase.y - 12} C ${layout.trunkBase.x + 32} ${layout.trunkBase.y - 25}, ${layout.trunkBase.x + 45} ${layout.trunkBase.y + 5}, ${layout.trunkBase.x} ${layout.trunkBase.y + 6}`}
                      fill="#8EB99C"
                      stroke="#385C43"
                      strokeWidth="1.8"
                      filter="url(#leafShadow)"
                    />
                  </g>
                )}

                {/* Main trunk body */}
                <path
                  d={`
                    M ${layout.trunkBase.x - growthStage.trunkWidth / 2} ${layout.trunkBase.y}
                    C ${layout.trunkBase.x - growthStage.trunkWidth * 0.45} ${layout.trunkBase.y - growthStage.trunkHeight * 0.4},
                      ${layout.trunkFork.x - growthStage.trunkWidth * 0.35} ${layout.trunkFork.y + 30},
                      ${layout.trunkFork.x - growthStage.trunkWidth * 0.24} ${layout.trunkFork.y}
                    L ${layout.trunkFork.x + growthStage.trunkWidth * 0.24} ${layout.trunkFork.y}
                    C ${layout.trunkFork.x + growthStage.trunkWidth * 0.35} ${layout.trunkFork.y + 30},
                      ${layout.trunkBase.x + growthStage.trunkWidth * 0.45} ${layout.trunkBase.y - growthStage.trunkHeight * 0.4},
                      ${layout.trunkBase.x + growthStage.trunkWidth / 2} ${layout.trunkBase.y}
                    Z
                  `}
                  fill={growthStage.isWoody ? 'url(#trunkBark)' : 'url(#saplingStem)'}
                  filter="url(#leafShadow)"
                />

                {/* Bark grain highlight for mature wood */}
                {growthStage.isWoody && (
                  <path
                    d={`M ${layout.trunkBase.x - 8} ${layout.trunkBase.y - 15} Q ${layout.trunkBase.x - 4} ${layout.trunkBase.y - growthStage.trunkHeight * 0.5} ${layout.trunkFork.x - 3} ${layout.trunkFork.y + 10}`}
                    stroke="#B89B86"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.35"
                  />
                )}

                {/* Core Landscape Pill */}
                <g
                  transform={`translate(${layout.trunkFork.x}, ${layout.trunkBase.y - 28})`}
                  className="cursor-default pointer-events-none"
                >
                  <rect
                    x="-95"
                    y="-16"
                    width="190"
                    height="32"
                    rx="16"
                    fill="#26382C"
                    stroke="#8FB89D"
                    strokeWidth="1.8"
                    filter="url(#leafShadow)"
                  />
                  <text
                    x="0"
                    y="4.5"
                    textAnchor="middle"
                    fill="#F2F8F4"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="0.03em"
                    className="font-sans"
                  >
                    🌿 Reflection Garden
                  </text>
                </g>
              </g>

              {/* BRANCHES */}
              <g id="organic-branches">
                {layout.topicNodes.map((node) => {
                  const isSelected = selectedTopicId === node.id;
                  const isHovered = hoveredTopicId === node.id;

                  return (
                    <g key={`branch-group-${node.id}`}>
                      {/* Branch glow on active hover/select */}
                      {(isSelected || isHovered) && (
                        <path
                          d={`M ${layout.trunkFork.x} ${layout.trunkFork.y} C ${node.cp1X} ${node.cp1Y}, ${node.cp2X} ${node.cp2Y}, ${node.x} ${node.y}`}
                          stroke={node.theme.accent}
                          strokeWidth={node.branchThickness + 7}
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.7"
                          filter="url(#softGlow)"
                        />
                      )}

                      {/* Primary curving branch */}
                      <path
                        d={`M ${layout.trunkFork.x} ${layout.trunkFork.y} C ${node.cp1X} ${node.cp1Y}, ${node.cp2X} ${node.cp2Y}, ${node.x} ${node.y}`}
                        stroke={isSelected || isHovered ? node.theme.stroke : !growthStage.isWoody ? '#5A7D65' : '#6E5746'}
                        strokeWidth={node.branchThickness}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-300"
                      />

                      {/* Secondary twigs for subtopics */}
                      {node.subtopicNodes.map((sub) => (
                        <path
                          key={`twig-${node.id}-${sub.id}`}
                          d={`M ${node.x} ${node.y} Q ${(node.x + sub.x) / 2} ${(node.y + sub.y) / 2 + 8} ${sub.x} ${sub.y}`}
                          stroke={hoveredSubtopicId === sub.id ? node.theme.stroke : !growthStage.isWoody ? '#6D9078' : '#857160'}
                          strokeWidth={Math.max(2.2, node.branchThickness * 0.32)}
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.8"
                        />
                      ))}
                    </g>
                  );
                })}
              </g>

              {/* SUBTOPIC LEAFLETS */}
              <g id="subtopic-leaves">
                {layout.topicNodes.flatMap((node) =>
                  node.subtopicNodes.map((sub) => {
                    const isHovered = hoveredSubtopicId === sub.id;

                    return (
                      <g
                        key={`sub-leaf-${sub.id}`}
                        transform={`translate(${sub.x}, ${sub.y}) rotate(${sub.angle + 30})`}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredSubtopicId(sub.id)}
                        onMouseLeave={() => setHoveredSubtopicId(null)}
                        onClick={() => {
                          setSelectedTopicId(node.id);
                          if (onSelectTopic) onSelectTopic(node);
                        }}
                      >
                        {/* Leaflet botanical shape */}
                        <path
                          d="M 0 -13 C 8 -7, 10 7, 0 15 C -10 7, -8 -7, 0 -13 Z"
                          fill={isHovered ? node.theme.accent : node.theme.primary}
                          stroke={node.theme.stroke}
                          strokeWidth="1.5"
                          opacity={isHovered ? 1 : 0.88}
                          filter="url(#leafShadow)"
                        />
                        {/* Leaflet central vein */}
                        <path
                          d="M 0 -9 L 0 11"
                          stroke={node.theme.stroke}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.6"
                        />
                      </g>
                    );
                  })
                )}
              </g>

              {/* MAJOR TOPIC LEAVES */}
              {/* Clean botanical leaf-shaped nodes containing only an appropriate icon */}
              <g id="major-topic-leaves">
                {layout.topicNodes.map((node) => {
                  const isSelected = selectedTopicId === node.id;
                  const isHovered = hoveredTopicId === node.id;
                  const freqCount = node.frequency || 1;

                  return (
                    <g
                      key={`topic-leaf-${node.id}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer interactive-leaf"
                      onMouseEnter={() => setHoveredTopicId(node.id)}
                      onMouseLeave={() => setHoveredTopicId(null)}
                      onClick={() => {
                        setSelectedTopicId(node.id);
                        if (onSelectTopic) onSelectTopic(node);
                      }}
                    >
                      {/* Selection Aura */}
                      {isSelected && (
                        <circle
                          cx="0"
                          cy="0"
                          r={node.leafRadius + 14}
                          fill="none"
                          stroke={node.theme.stroke}
                          strokeWidth="2.5"
                          strokeDasharray="5 3"
                          className="animate-spin"
                          style={{ animationDuration: '24s' }}
                        />
                      )}

                      {/* Botanical Leaf Body */}
                      <g className="transition-transform duration-200" transform={isHovered ? 'scale(1.12)' : 'scale(1)'}>
                        {/* Outer organic leaf contour */}
                        <path
                          d={`
                            M 0 ${-node.leafRadius * 1.3}
                            C ${node.leafRadius * 1.2} ${-node.leafRadius * 0.45},
                              ${node.leafRadius * 1.15} ${node.leafRadius * 0.7},
                              0 ${node.leafRadius * 1.18}
                            C ${-node.leafRadius * 1.15} ${node.leafRadius * 0.7},
                              ${-node.leafRadius * 1.2} ${-node.leafRadius * 0.45},
                              0 ${-node.leafRadius * 1.3}
                            Z
                          `}
                          fill={node.theme.primary}
                          stroke={isSelected ? '#13281B' : node.theme.stroke}
                          strokeWidth={isSelected ? '2.8' : '2'}
                          filter="url(#leafShadow)"
                        />

                        {/* Subtle Leaf Veins */}
                        <path
                          d={`M 0 ${-node.leafRadius * 0.95} L 0 ${node.leafRadius * 0.95}`}
                          stroke={node.theme.stroke}
                          strokeWidth="1.5"
                          opacity="0.45"
                        />
                        <path
                          d={`M 0 ${-node.leafRadius * 0.3} Q ${node.leafRadius * 0.45} ${-node.leafRadius * 0.45} ${node.leafRadius * 0.65} ${-node.leafRadius * 0.35}`}
                          stroke={node.theme.stroke}
                          strokeWidth="1"
                          fill="none"
                          opacity="0.3"
                        />
                        <path
                          d={`M 0 ${-node.leafRadius * 0.3} Q ${-node.leafRadius * 0.45} ${-node.leafRadius * 0.45} ${-node.leafRadius * 0.65} ${-node.leafRadius * 0.35}`}
                          stroke={node.theme.stroke}
                          strokeWidth="1"
                          fill="none"
                          opacity="0.3"
                        />

                        {/* Inner Medallion holding the icon */}
                        <circle
                          cx="0"
                          cy="0"
                          r={node.leafRadius * 0.72}
                          fill="#FFFFFF"
                          stroke={node.theme.stroke}
                          strokeWidth="1.5"
                          filter="url(#leafShadow)"
                        />

                        {/* Representative Category/Topic Icon */}
                        <foreignObject
                          x={-node.iconSize / 2}
                          y={-node.iconSize / 2}
                          width={node.iconSize}
                          height={node.iconSize}
                          className="pointer-events-none"
                        >
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ color: node.theme.stroke }}
                          >
                            <node.IconComponent size={node.iconSize} strokeWidth={2.2} />
                          </div>
                        </foreignObject>

                        {/* Frequency Count Pip on Leaf (shown when count > 1) */}
                        {freqCount > 1 && (
                          <g transform={`translate(${node.leafRadius * 0.75}, ${-node.leafRadius * 0.75})`}>
                            <circle
                              cx="0"
                              cy="0"
                              r="9.5"
                              fill={node.theme.badgeBg}
                              stroke={node.theme.stroke}
                              strokeWidth="1.2"
                              filter="url(#leafShadow)"
                            />
                            <text
                              x="0"
                              y="3.2"
                              textAnchor="middle"
                              fill={node.theme.badgeText}
                              fontSize="9"
                              fontWeight="700"
                              className="font-sans"
                            >
                              {freqCount}
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* HOVER TOOLTIP / POPOVER (Positioned outside leaf so text never clips) */}
              {hoveredNode && (
                <g className="pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <foreignObject
                    x={hoveredNode.tooltipX - 130}
                    y={hoveredNode.isNearTop ? hoveredNode.tooltipY : hoveredNode.tooltipY - 110}
                    width="260"
                    height="125"
                    className="overflow-visible"
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-[#E5DFD5] shadow-xl text-left">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: hoveredNode.theme.badgeBg,
                            color: hoveredNode.theme.badgeText,
                          }}
                        >
                          {hoveredNode.category || 'Theme'}
                        </span>
                        <span className="text-[11px] font-bold text-[#1B3524] bg-[#E7EFE9] px-2 py-0.5 rounded-full">
                          {hoveredNode.frequency || 1} {(hoveredNode.frequency || 1) === 1 ? 'reflection' : 'reflections'}
                        </span>
                      </div>
                      <div className="text-xs font-serif font-bold text-[#1E2922]">
                        {hoveredNode.name}
                      </div>
                      {hoveredNode.description && (
                        <div className="text-[11px] text-[#607065] mt-1 line-clamp-2 leading-relaxed italic">
                          "{hoveredNode.description}"
                        </div>
                      )}
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* SUBTOPIC HOVER TOOLTIP */}
              {hoveredSubtopic && !hoveredNode && (
                <g className="pointer-events-none animate-in fade-in duration-100">
                  <foreignObject
                    x={hoveredSubtopic.x - 90}
                    y={hoveredSubtopic.y - 45}
                    width="180"
                    height="45"
                    className="overflow-visible"
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-[#E2DAD0] shadow-md text-center text-xs font-medium text-[#1E2922] whitespace-nowrap">
                      <span className="font-semibold">{hoveredSubtopic.displayName}</span>
                      <span className="text-[10px] text-[#55695C] ml-1.5">
                        ({hoveredSubtopic.frequency || 1})
                      </span>
                    </div>
                  </foreignObject>
                </g>
              )}
            </>
          )}
        </svg>
      </div>

      {/* TOPIC INSPECTION SLIDE-OVER DRAWER */}
      {selectedTopic && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-[#E5DFD5] shadow-xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold tracking-wider text-[#4A6B56] uppercase bg-[#EBF2EE] px-2.5 py-0.5 rounded-full inline-block">
                {selectedTopic.category || 'Theme'}
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#1C2721] pt-1">
                {selectedTopic.name}
              </h3>
              <p className="text-xs font-medium text-[#627267]">
                {selectedTopic.frequency || 1} {selectedTopic.frequency === 1 ? 'reflection' : 'reflections'} recorded
              </p>
            </div>

            <button
              onClick={() => setSelectedTopicId(null)}
              className="p-1 rounded-full text-[#8C9890] hover:text-[#202E26] hover:bg-[#F2EFEA] transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Privacy-Safe Abstract Narrative */}
          <div className="bg-[#FAF8F4] rounded-2xl p-3.5 border border-[#ECE6DC] my-3">
            <p className="text-xs text-[#3E4E44] leading-relaxed italic">
              "{selectedTopic.description || 'Your reflections frequently explore building, problem-solving, and thoughtful growth in this area.'}"
            </p>
          </div>

          {/* Subtopics List */}
          {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-semibold text-[#7A8A7F] uppercase tracking-wider block mb-1.5">
                Related Subtopics
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTopic.subtopics.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[#E5DFD5] text-[11px] text-[#2D3F33] font-medium"
                  >
                    <span>{sub.name}</span>
                    <span className="text-[9px] text-[#7A8A7F]">({sub.frequency || 1})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Action: Begin Reflection on this Topic */}
          {onStartJournalWithPrompt && (
            <button
              onClick={() => {
                const prompt = `I'd like to reflect today on ${selectedTopic.name} and explore how it has been shaping my thoughts and experiences recently.`;
                onStartJournalWithPrompt(prompt);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] active:bg-[#16251D] text-white text-xs font-medium shadow-xs transition-all active:scale-[0.98]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reflect on this topic</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
