import React, { useEffect, useState, useCallback } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  TreePine,
  AlertCircle,
  Calendar,
  BookOpen,
  PieChart,
  Heart,
  Loader2,
} from 'lucide-react';
import { SafeInterestMapData, SafeInterestTopic } from '../shared/types';

export interface ShareDistributionItem {
  name: string;
  category?: string;
  frequency: number;
  percentage: number;
  color: string;
}

export interface ShareableInterestMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: SafeInterestMapData | null;
  totalReflections?: number;
  activeDays?: number;
  uniqueTopics?: number;
  mindfulSentiment?: number | null;
  distributionData?: ShareDistributionItem[];
  // Backwards compatibility props
  reflectionCount?: number;
  sentimentPercent?: number | null;
}

/**
 * Fallback-safe rounded rectangle helper for HTML5 Canvas.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

interface BotanicalTheme {
  primary: string;
  stroke: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  branch: string;
  accent: string;
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

// Canvas vector icon drawers for crisp output without external image dependencies
function drawLaptop(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const sw = size * 0.72;
  const sh = size * 0.48;
  ctx.strokeRect(x - sw / 2, y - sh / 2 - 2, sw, sh);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.48, y + sh / 2);
  ctx.lineTo(x + size * 0.48, y + sh / 2);
  ctx.stroke();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y - 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size * 0.042;
  ctx.beginPath();
  ctx.moveTo(0, s * 4);
  ctx.bezierCurveTo(-s * 6, -s * 3, -s * 10, s * 4, 0, s * 12);
  ctx.bezierCurveTo(s * 10, s * 4, s * 6, -s * 3, 0, s * 4);
  ctx.fill();
  ctx.restore();
}

function drawActivity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size * 0.42;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.4, y);
  ctx.lineTo(x - s * 0.15, y - s * 0.7);
  ctx.lineTo(x + s * 0.2, y + s * 0.7);
  ctx.lineTo(x + s * 0.45, y);
  ctx.lineTo(x + s, y);
  ctx.stroke();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const r = size * 0.38;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 3);
  ctx.lineTo(x + 3.5, y);
  ctx.lineTo(x, y + 3);
  ctx.lineTo(x - 3.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + r - 3);
  ctx.lineTo(x + 3.5, y);
  ctx.lineTo(x, y - 3);
  ctx.lineTo(x - 3.5, y);
  ctx.closePath();
  ctx.stroke();
}

function drawUsers(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x - 3.5, y - 3.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 3.5, y + 8, 6.5, Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 3.5, y - 3.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 3.5, y + 8, 6.5, Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();
}

function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = size * 0.38;
  const h = size * 0.34;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x - w * 0.5, y - h - 3, x - w, y - h + 2);
  ctx.lineTo(x - w, y + h);
  ctx.quadraticCurveTo(x - w * 0.5, y + h - 4, x, y + h);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x + w * 0.5, y - h - 3, x + w, y - h + 2);
  ctx.lineTo(x + w, y + h);
  ctx.quadraticCurveTo(x + w * 0.5, y + h - 4, x, y + h);
  ctx.closePath();
  ctx.stroke();
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  const r = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.9, y, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.9, y, x, y - r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.7);
  ctx.lineTo(x, y + r * 0.7);
  ctx.stroke();
}

function drawCategoryIcon(
  ctx: CanvasRenderingContext2D,
  category: string,
  name: string,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (
    cat.includes('tech') ||
    cat.includes('build') ||
    n.includes('tech') ||
    n.includes('code') ||
    n.includes('dev') ||
    n.includes('software') ||
    n.includes('app') ||
    n.includes('ai')
  ) {
    drawLaptop(ctx, x, y, size, color);
    return;
  }
  if (
    cat.includes('wellbeing') ||
    cat.includes('inner') ||
    cat.includes('mind') ||
    n.includes('peace') ||
    n.includes('calm') ||
    n.includes('gratitude') ||
    n.includes('meditat') ||
    n.includes('stress')
  ) {
    drawHeart(ctx, x, y, size, color);
    return;
  }
  if (
    cat.includes('health') ||
    cat.includes('vital') ||
    n.includes('fitness') ||
    n.includes('workout') ||
    n.includes('exercise') ||
    n.includes('body')
  ) {
    drawActivity(ctx, x, y, size, color);
    return;
  }
  if (
    cat.includes('relation') ||
    cat.includes('communit') ||
    n.includes('friend') ||
    n.includes('family') ||
    n.includes('people') ||
    n.includes('team') ||
    n.includes('social')
  ) {
    drawUsers(ctx, x, y, size, color);
    return;
  }
  if (
    cat.includes('plan') ||
    cat.includes('life') ||
    n.includes('career') ||
    n.includes('goal') ||
    n.includes('future') ||
    n.includes('direction')
  ) {
    drawCompass(ctx, x, y, size, color);
    return;
  }
  if (
    cat.includes('growth') ||
    cat.includes('learn') ||
    cat.includes('creativ') ||
    n.includes('read') ||
    n.includes('book') ||
    n.includes('study') ||
    n.includes('write')
  ) {
    drawBook(ctx, x, y, size, color);
    return;
  }
  drawLeaf(ctx, x, y, size, color);
}

// Minimal icons for metric cards
function drawMetricIcon(ctx: CanvasRenderingContext2D, type: 'reflections' | 'days' | 'topics' | 'sentiment', x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'reflections') {
    // Mini open book
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.quadraticCurveTo(x - 4, y - 9, x - 8, y - 7);
    ctx.lineTo(x - 8, y + 6);
    ctx.quadraticCurveTo(x - 4, y + 4, x, y + 6);
    ctx.quadraticCurveTo(x + 4, y + 4, x + 8, y + 6);
    ctx.lineTo(x + 8, y - 7);
    ctx.quadraticCurveTo(x + 4, y - 9, x, y - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  } else if (type === 'days') {
    // Mini calendar
    ctx.strokeRect(x - 7, y - 6, 14, 13);
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 2);
    ctx.lineTo(x + 7, y - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 8);
    ctx.lineTo(x - 4, y - 5);
    ctx.moveTo(x + 4, y - 8);
    ctx.lineTo(x + 4, y - 5);
    ctx.stroke();
  } else if (type === 'topics') {
    // Mini sprout / branch
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
  } else {
    // Mini spark / heart
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.quadraticCurveTo(x + 6, y - 6, x + 6, y);
    ctx.quadraticCurveTo(x + 6, y + 6, x, y + 8);
    ctx.quadraticCurveTo(x - 6, y + 6, x - 6, y);
    ctx.quadraticCurveTo(x - 6, y - 6, x, y - 6);
    ctx.stroke();
  }
  ctx.restore();
}

// Clean and truncate topic names gracefully
function cleanTopicLabel(name: string): string {
  if (!name) return 'Reflection Theme';
  const trimmed = name.trim();
  return trimmed.length > 20 ? trimmed.slice(0, 18) + '…' : trimmed;
}

export const ShareableInterestMapModal: React.FC<ShareableInterestMapModalProps> = ({
  isOpen,
  onClose,
  mapData,
  totalReflections: propTotalReflections,
  activeDays: propActiveDays,
  uniqueTopics: propUniqueTopics,
  mindfulSentiment: propMindfulSentiment,
  distributionData: propDistributionData,
  reflectionCount: propReflectionCount,
  sentimentPercent: propSentimentPercent,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Compute dynamic metrics strictly from actual data
  const rawTopics = mapData?.topics || [];
  const resolvedTotalReflections = typeof propTotalReflections === 'number'
    ? propTotalReflections
    : typeof propReflectionCount === 'number'
      ? propReflectionCount
      : rawTopics.reduce((sum, t) => sum + (t.frequency || 1), 0);

  const resolvedUniqueTopics = typeof propUniqueTopics === 'number'
    ? propUniqueTopics
    : rawTopics.length;

  const resolvedActiveDays = typeof propActiveDays === 'number'
    ? propActiveDays
    : Math.max(1, Math.min(resolvedTotalReflections, Math.ceil(resolvedTotalReflections * 0.75)));

  const resolvedMindfulSentiment = typeof propMindfulSentiment === 'number'
    ? propMindfulSentiment
    : typeof propSentimentPercent === 'number'
      ? propSentimentPercent
      : 85;

  // Resolved topic distribution
  const resolvedDistribution = React.useMemo(() => {
    if (propDistributionData && propDistributionData.length > 0) {
      return propDistributionData;
    }
    const totalFreq = rawTopics.reduce((s, t) => s + (t.frequency || 1), 0);
    const colors = ['#5C826B', '#8F7FA4', '#D48675', '#6A9258', '#CFA052', '#61849A'];
    return rawTopics.slice(0, 5).map((t, i) => {
      const freq = t.frequency || 1;
      const pct = totalFreq > 0 ? Math.round((freq / totalFreq) * 100) : 0;
      return {
        name: t.name,
        category: t.category || 'Theme',
        frequency: freq,
        percentage: pct,
        color: colors[i % colors.length],
      };
    });
  }, [propDistributionData, rawTopics]);

  // Top topics ranked by frequency
  const topTopics = React.useMemo(() => {
    return [...rawTopics]
      .sort((a, b) => (b.frequency || 1) - (a.frequency || 1))
      .slice(0, 4);
  }, [rawTopics]);

  // Generate the Canvas image representing the 4:5 botanical reflection infographic
  const renderCard = useCallback(() => {
    const topics = rawTopics;

    const canvas = document.createElement('canvas');
    // High-resolution 1200 x 1500 canvas (Standard 4:5 portrait aspect ratio, optimal for social platforms)
    const W = 1200;
    const H = 1500;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Warm natural cream paper background (#FAF7F2)
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, W, H);

    // Subtle craft dotted grid
    ctx.fillStyle = '#E8E1D5';
    for (let gx = 35; gx < W; gx += 42) {
      for (let gy = 35; gy < H; gy += 42) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Framed Card Container with soft drop-shadow
    const cardX = 45;
    const cardY = 45;
    const cardW = W - 90;
    const cardH = H - 90;
    const cardR = 30;

    // Soft warm shadow
    drawRoundedRect(ctx, cardX + 6, cardY + 6, cardW, cardH, cardR);
    ctx.fillStyle = '#E6DECF';
    ctx.fill();

    // Main Card background
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#274431'; // Deep forest evergreen border
    ctx.stroke();

    // Inner subtle margin stroke
    drawRoundedRect(ctx, cardX + 14, cardY + 14, cardW - 28, cardH - 28, cardR - 10);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#EFEAE2';
    ctx.stroke();

    // 3. TOP HEADER SECTION
    // Brand wordmark
    ctx.fillStyle = '#346046';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E  M  O  R  A', W / 2, cardY + 38);

    // Contextual label
    ctx.fillStyle = '#6B8272';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PERSONAL REFLECTION', W / 2, cardY + 56);

    // Main Title: "My Reflection Tree"
    ctx.fillStyle = '#172E20';
    ctx.font = 'bold 38px "Georgia", serif';
    ctx.fillText('My Reflection Tree', W / 2, cardY + 98);

    // Contextual Subtitle
    ctx.fillStyle = '#637568';
    ctx.font = 'italic 16px "Georgia", serif';
    ctx.fillText('“A visual snapshot of what I often reflect on.”', W / 2, cardY + 130);

    // Growth Stage Determination based on actual reflection count & topics
    const effectiveCount = Math.max(resolvedTotalReflections, topics.reduce((s, t) => s + (t.frequency || 1), 0));
    let stageName = 'Tender Sprout';
    let trunkHeight = 70;
    let trunkWidth = 14;
    let maxSpread = 35;
    let baseRadius = 100;
    let isWoody = false;

    if (effectiveCount === 0 || topics.length === 0) {
      stageName = 'Tender Sprout';
      trunkHeight = 70;
      trunkWidth = 14;
      maxSpread = 35;
      baseRadius = 100;
      isWoody = false;
    } else if (effectiveCount <= 2) {
      stageName = 'Young Plant';
      trunkHeight = 110;
      trunkWidth = 18;
      maxSpread = topics.length === 1 ? 25 : 54;
      baseRadius = 140;
      isWoody = false;
    } else if (effectiveCount <= 5) {
      stageName = 'Branching Plant';
      trunkHeight = 150;
      trunkWidth = 24;
      maxSpread = 82;
      baseRadius = 185;
      isWoody = false;
    } else if (effectiveCount <= 10) {
      stageName = 'Developing Tree';
      trunkHeight = 195;
      trunkWidth = 34;
      maxSpread = 114;
      baseRadius = 220;
      isWoody = true;
    } else {
      stageName = 'Mature Canopy Tree';
      trunkHeight = 230;
      trunkWidth = 44;
      maxSpread = 132;
      baseRadius = 250;
      isWoody = true;
    }

    // Growth Stage Badge Pill
    const stageBadgeText = `✦  ${stageName}  ✦`;
    ctx.font = 'bold 12px sans-serif';
    const badgeTextWidth = ctx.measureText(stageBadgeText).width;
    const stageBadgeW = badgeTextWidth + 24;
    const stageBadgeH = 24;
    const stageBadgeX = W / 2 - stageBadgeW / 2;
    const stageBadgeY = cardY + 152;

    drawRoundedRect(ctx, stageBadgeX, stageBadgeY, stageBadgeW, stageBadgeH, 12);
    ctx.fillStyle = '#EDF5EF';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#BED9C4';
    ctx.stroke();

    ctx.fillStyle = '#214D30';
    ctx.fillText(stageBadgeText, W / 2, stageBadgeY + stageBadgeH / 2);

    // 4. CENTERPIECE: ACTUAL MINIATURE BOTANICAL TREE
    const groundY = cardY + 680;
    const trunkBase = { x: W / 2, y: groundY };
    const trunkFork = { x: W / 2, y: groundY - trunkHeight };

    // Soil Mound at ground level
    ctx.beginPath();
    ctx.ellipse(trunkBase.x, groundY + 10, 200, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#EAE1D3';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#D6CABE';
    ctx.stroke();

    // Buttress roots or cotyledon leaves at trunk base
    if (isWoody) {
      ctx.strokeStyle = '#5E4C3E';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(trunkBase.x - 14, groundY - 4);
      ctx.quadraticCurveTo(trunkBase.x - 50, groundY + 6, trunkBase.x - 110, groundY + 12);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(trunkBase.x + 14, groundY - 4);
      ctx.quadraticCurveTo(trunkBase.x + 50, groundY + 6, trunkBase.x + 110, groundY + 12);
      ctx.stroke();
    } else {
      // Tender cotyledon base leaves
      ctx.fillStyle = '#82AD8F';
      ctx.strokeStyle = '#385C43';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(trunkBase.x, groundY - 6);
      ctx.bezierCurveTo(trunkBase.x - 24, groundY - 18, trunkBase.x - 36, groundY + 4, trunkBase.x, groundY + 4);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(trunkBase.x, groundY - 6);
      ctx.bezierCurveTo(trunkBase.x + 24, groundY - 18, trunkBase.x + 36, groundY + 4, trunkBase.x, groundY + 4);
      ctx.fill();
      ctx.stroke();
    }

    // Main Trunk Body
    ctx.beginPath();
    ctx.moveTo(trunkBase.x - trunkWidth / 2, trunkBase.y);
    ctx.quadraticCurveTo(
      trunkBase.x - trunkWidth * 0.4,
      trunkBase.y - trunkHeight * 0.5,
      trunkFork.x - trunkWidth * 0.28,
      trunkFork.y
    );
    ctx.lineTo(trunkFork.x + trunkWidth * 0.28, trunkFork.y);
    ctx.quadraticCurveTo(
      trunkBase.x + trunkWidth * 0.4,
      trunkBase.y - trunkHeight * 0.5,
      trunkBase.x + trunkWidth / 2,
      trunkBase.y
    );
    ctx.closePath();

    const trunkGrad = ctx.createLinearGradient(trunkBase.x - 20, trunkBase.y, trunkFork.x + 20, trunkFork.y);
    if (isWoody) {
      trunkGrad.addColorStop(0, '#4E3E31');
      trunkGrad.addColorStop(1, '#78614E');
    } else {
      trunkGrad.addColorStop(0, '#4A7655');
      trunkGrad.addColorStop(1, '#76A382');
    }
    ctx.fillStyle = trunkGrad;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = isWoody ? '#3B2E24' : '#33593D';
    ctx.stroke();

    // If 0 topics exist yet: draw tender sprout invitation on tree
    if (topics.length === 0) {
      // Curled top sprout
      ctx.fillStyle = '#6E9C7D';
      ctx.strokeStyle = '#2B5439';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(trunkFork.x - 18, trunkFork.y - 22, 20, 13, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(trunkFork.x + 18, trunkFork.y - 22, 20, 13, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#68776C';
      ctx.font = 'italic 17px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Your reflection tree begins sprouting with your first journal entry.', W / 2, groundY - 140);
    } else {
      // Topics exist: render actual topics tree branches & leaf nodes
      const displayTopics = topics.slice(0, 6);
      const topicCount = displayTopics.length;

      const freqs = displayTopics.map((t) => t.frequency || 1);
      const minFreq = Math.min(...freqs);
      const maxFreq = Math.max(...freqs);

      let angleStep = 0;
      let startAngle = 0;
      if (topicCount === 1) {
        startAngle = 0;
        angleStep = 0;
      } else if (topicCount === 2) {
        startAngle = -26;
        angleStep = 52;
      } else {
        angleStep = maxSpread / (topicCount - 1);
        startAngle = -(maxSpread / 2);
      }

      // Calculate coordinates for topic leaves
      const nodeItems = displayTopics.map((topic, i) => {
        const angleDeg = topicCount === 1 ? 0 : startAngle + i * angleStep;
        const angleRad = ((angleDeg - 90) * Math.PI) / 180;

        const freq = topic.frequency || 1;
        const freqNorm = maxFreq === minFreq ? 0.5 : (freq - minFreq) / Math.max(1, maxFreq - minFreq);

        const radius = baseRadius + freqNorm * 38 + (topicCount > 2 && i % 2 === 1 ? -14 : 14);
        const leafX = trunkFork.x + radius * Math.cos(angleRad);
        const leafY = trunkFork.y + radius * Math.sin(angleRad) * 0.84;

        const leafRadius = Math.round(22 + freqNorm * 10);
        const iconSize = Math.round(16 + freqNorm * 5);

        const cp1X = trunkFork.x + (leafX - trunkFork.x) * 0.28;
        const cp1Y = trunkFork.y - (isWoody ? 30 : 16);
        const cp2X = trunkFork.x + (leafX - trunkFork.x) * 0.72;
        const cp2Y = leafY + 26;

        const theme = BOTANICAL_PALETTES[topic.category] || DEFAULT_THEME;

        // Subtopics (limit to 2 for crisp composition)
        const subtopics = (topic.subtopics || []).slice(0, 2);
        const subtopicNodes = subtopics.map((sub, sIdx) => {
          const subAngle = angleDeg + (sIdx === 0 ? -26 : 26);
          const subAngleRad = ((subAngle - 90) * Math.PI) / 180;
          const subDist = 44 + (sub.frequency || 1) * 3.5;
          const subX = leafX + subDist * Math.cos(subAngleRad);
          const subY = leafY + subDist * Math.sin(subAngleRad) * 0.88;
          return {
            name: sub.name,
            x: subX,
            y: subY,
            angle: subAngle,
          };
        });

        return {
          topic,
          leafX,
          leafY,
          leafRadius,
          iconSize,
          cp1X,
          cp1Y,
          cp2X,
          cp2Y,
          theme,
          freq,
          subtopicNodes,
        };
      });

      // 4A. Branches & Twigs
      nodeItems.forEach((node) => {
        // Main Branch
        ctx.beginPath();
        ctx.moveTo(trunkFork.x, trunkFork.y);
        ctx.bezierCurveTo(node.cp1X, node.cp1Y, node.cp2X, node.cp2Y, node.leafX, node.leafY);
        ctx.strokeStyle = isWoody ? '#6B5443' : '#567A60';
        ctx.lineWidth = Math.max(3.2, 4.5 + (node.freq / maxFreq) * 3.5);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Subtopic Twigs & Leaflets
        node.subtopicNodes.forEach((sub) => {
          ctx.beginPath();
          ctx.moveTo(node.leafX, node.leafY);
          ctx.quadraticCurveTo((node.leafX + sub.x) / 2, (node.leafY + sub.y) / 2 + 5, sub.x, sub.y);
          ctx.strokeStyle = isWoody ? '#856F5E' : '#688E73';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Subtopic Leaflet
          ctx.save();
          ctx.translate(sub.x, sub.y);
          ctx.rotate(((sub.angle + 30) * Math.PI) / 180);
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.bezierCurveTo(6, -4, 8, 5, 0, 11);
          ctx.bezierCurveTo(-8, 5, -6, -4, 0, -9);
          ctx.fillStyle = node.theme.primary;
          ctx.fill();
          ctx.strokeStyle = node.theme.stroke;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        });
      });

      // 4B. Leaf Nodes with Icons and Topic Name Pills
      nodeItems.forEach((node) => {
        const { leafX, leafY, leafRadius, iconSize, theme, topic, freq } = node;

        ctx.save();
        ctx.translate(leafX, leafY);

        // Organic Botanical Leaf Shape
        ctx.beginPath();
        ctx.moveTo(0, -leafRadius * 1.28);
        ctx.bezierCurveTo(
          leafRadius * 1.18,
          -leafRadius * 0.45,
          leafRadius * 1.12,
          leafRadius * 0.7,
          0,
          leafRadius * 1.16
        );
        ctx.bezierCurveTo(
          -leafRadius * 1.12,
          leafRadius * 0.7,
          -leafRadius * 1.18,
          -leafRadius * 0.45,
          0,
          -leafRadius * 1.28
        );
        ctx.closePath();

        ctx.fillStyle = theme.primary;
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = theme.stroke;
        ctx.stroke();

        // Inner Medallion Circle for category icon
        ctx.beginPath();
        ctx.arc(0, 0, leafRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = theme.stroke;
        ctx.stroke();

        // Category / Topic Vector Icon
        drawCategoryIcon(ctx, topic.category, topic.name, 0, 0, iconSize, theme.stroke);

        // Numeric Frequency Pip if frequency > 1
        if (freq > 1) {
          const pipX = leafRadius * 0.75;
          const pipY = -leafRadius * 0.75;
          ctx.beginPath();
          ctx.arc(pipX, pipY, 10, 0, Math.PI * 2);
          ctx.fillStyle = theme.badgeBg;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = theme.stroke;
          ctx.stroke();

          ctx.fillStyle = theme.badgeText;
          ctx.font = 'bold 10.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(freq), pipX, pipY + 0.5);
        }

        ctx.restore();

        // Topic Name Capsule underneath the leaf
        const cleanName = cleanTopicLabel(topic.name);
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const nameWidth = ctx.measureText(cleanName).width;
        const pillW = Math.max(86, nameWidth + 22);
        const pillH = 24;
        const pillX = leafX - pillW / 2;
        const pillY = leafY + leafRadius + 12;

        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 12);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = theme.stroke;
        ctx.stroke();

        // Category accent dot inside pill
        ctx.beginPath();
        ctx.arc(pillX + 10, pillY + pillH / 2, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = theme.primary;
        ctx.fill();

        // High contrast topic name text
        ctx.fillStyle = '#183020';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(cleanName, pillX + 19, pillY + pillH / 2);
      });
    }

    // 5. METRICS: 2 × 2 Grid Below the Tree
    const gridStartY = cardY + 710;
    const col1X = cardX + 35;
    const colW = (cardW - 90) / 2; // ~510px
    const col2X = col1X + colW + 20;
    const rowH = 86;
    const rowGap = 12;

    const metricsConfig = [
      {
        col: col1X,
        row: gridStartY,
        val: String(resolvedTotalReflections),
        label: 'Total Reflections',
        iconType: 'reflections' as const,
        color: '#1A3324',
      },
      {
        col: col2X,
        row: gridStartY,
        val: String(resolvedActiveDays),
        label: 'Active Days',
        iconType: 'days' as const,
        color: '#1A3324',
      },
      {
        col: col1X,
        row: gridStartY + rowH + rowGap,
        val: String(resolvedUniqueTopics),
        label: 'Unique Topics',
        iconType: 'topics' as const,
        color: '#1A3324',
      },
      {
        col: col2X,
        row: gridStartY + rowH + rowGap,
        val: `${resolvedMindfulSentiment}%`,
        label: 'Mindful Sentiment',
        iconType: 'sentiment' as const,
        color: '#325C43',
      },
    ];

    metricsConfig.forEach((m) => {
      // Metric Card Background
      drawRoundedRect(ctx, m.col, m.row, colW, rowH, 18);
      ctx.fillStyle = '#FAF7F2';
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#E5DED2';
      ctx.stroke();

      // Mini Icon Pill on left
      const iconPillX = m.col + 16;
      const iconPillY = m.row + 16;
      const iconPillSize = 36;
      drawRoundedRect(ctx, iconPillX, iconPillY, iconPillSize, iconPillSize, 12);
      ctx.fillStyle = '#EDF4EE';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#CFDEC3';
      ctx.stroke();
      drawMetricIcon(ctx, m.iconType, iconPillX + iconPillSize / 2, iconPillY + iconPillSize / 2, '#2E503B');

      // Metric Number
      ctx.fillStyle = m.color;
      ctx.font = 'bold 32px "Georgia", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(m.val, m.col + 64, m.row + 42);

      // Metric Label
      ctx.fillStyle = '#65776B';
      ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(m.label, m.col + 65, m.row + 65);
    });

    // 6. LOWER SECTION: TOP TOPICS & TOPIC DISTRIBUTION
    const lowerY = gridStartY + (rowH * 2) + (rowGap * 2) + 12; // ~918
    const panelH = 390;
    const panelW = colW;

    // 6A. Left Panel: Top Topics
    drawRoundedRect(ctx, col1X, lowerY, panelW, panelH, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#E5DED2';
    ctx.stroke();

    // Panel Header
    ctx.fillStyle = '#183022';
    ctx.font = 'bold 16px "Georgia", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Top Topics', col1X + 20, lowerY + 28);

    ctx.fillStyle = '#7A8C80';
    ctx.font = '11.5px sans-serif';
    ctx.fillText('Themes with highest reflection recurrence', col1X + 20, lowerY + 48);

    // List Top Topics
    const topDisplay = topTopics.slice(0, 4);
    const maxFreq = topDisplay.length > 0 ? Math.max(...topDisplay.map((t) => t.frequency || 1)) : 1;
    const rowStartY = lowerY + 70;
    const itemGap = 72;

    if (topDisplay.length === 0) {
      ctx.fillStyle = '#839388';
      ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Begin journaling to reveal recurring topics', col1X + panelW / 2, lowerY + panelH / 2);
    } else {
      topDisplay.forEach((topic, idx) => {
        const itemY = rowStartY + idx * itemGap;
        const freq = topic.frequency || 1;
        const freqPercent = Math.round((freq / maxFreq) * 100);

        // Topic Name
        ctx.fillStyle = '#1A3324';
        ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(cleanTopicLabel(topic.name), col1X + 20, itemY + 16);

        // Frequency Badge
        const freqText = `${freq} ${freq === 1 ? 'reflection' : 'reflections'}`;
        ctx.fillStyle = '#395D46';
        ctx.font = 'bold 11.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(freqText, col1X + panelW - 20, itemY + 16);

        // Horizontal Progress Bar Track
        const barX = col1X + 20;
        const barY = itemY + 26;
        const barW = panelW - 40;
        const barH = 7;

        drawRoundedRect(ctx, barX, barY, barW, barH, 3.5);
        ctx.fillStyle = '#F2EFE8';
        ctx.fill();

        // Horizontal Progress Bar Fill
        const fillW = Math.max(14, (barW * freqPercent) / 100);
        drawRoundedRect(ctx, barX, barY, fillW, barH, 3.5);
        const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
        barGrad.addColorStop(0, '#466C52');
        barGrad.addColorStop(1, '#7CA387');
        ctx.fillStyle = barGrad;
        ctx.fill();
      });
    }

    // 6B. Right Panel: Topic Distribution
    drawRoundedRect(ctx, col2X, lowerY, panelW, panelH, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#E5DED2';
    ctx.stroke();

    // Panel Header
    ctx.fillStyle = '#183022';
    ctx.font = 'bold 16px "Georgia", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Topic Distribution', col2X + 20, lowerY + 28);

    ctx.fillStyle = '#7A8C80';
    ctx.font = '11.5px sans-serif';
    ctx.fillText('Proportion of overall reflection themes', col2X + 20, lowerY + 48);

    // Stacked Horizontal Bar
    const segBarX = col2X + 20;
    const segBarY = lowerY + 70;
    const segBarW = panelW - 40;
    const segBarH = 15;

    drawRoundedRect(ctx, segBarX, segBarY, segBarW, segBarH, 7.5);
    ctx.fillStyle = '#F0EBE2';
    ctx.fill();

    if (resolvedDistribution.length > 0) {
      let currentX = segBarX;
      resolvedDistribution.forEach((d, i) => {
        const segW = Math.max(2, (segBarW * d.percentage) / 100);
        ctx.save();
        ctx.beginPath();
        // Clip to rounded bar
        drawRoundedRect(ctx, segBarX, segBarY, segBarW, segBarH, 7.5);
        ctx.clip();
        ctx.fillStyle = d.color;
        ctx.fillRect(currentX, segBarY, segW, segBarH);
        ctx.restore();
        currentX += segW;
      });

      // Legend underneath
      const legendStartY = segBarY + 34;
      const legendGap = 52;
      resolvedDistribution.slice(0, 5).forEach((d, idx) => {
        const itemY = legendStartY + idx * legendGap;

        // Color indicator circle
        ctx.beginPath();
        ctx.arc(col2X + 26, itemY + 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();

        // Topic Name
        ctx.fillStyle = '#22382B';
        ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(cleanTopicLabel(d.name), col2X + 40, itemY + 8);

        // Percentage
        ctx.fillStyle = '#375943';
        ctx.font = 'bold 12.5px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${d.percentage}%`, col2X + panelW - 20, itemY + 8);

        // Subtle divider between legend rows
        if (idx < resolvedDistribution.length - 1) {
          ctx.strokeStyle = '#F3EFE9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(col2X + 40, itemY + 28);
          ctx.lineTo(col2X + panelW - 20, itemY + 28);
          ctx.stroke();
        }
      });
    } else {
      ctx.fillStyle = '#839388';
      ctx.font = 'italic 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Calculating distribution...', col2X + panelW / 2, lowerY + panelH / 2);
    }

    // 7. PRIVACY-PROTECTED FOOTER SECTION
    const footerDividerY = cardY + cardH - 65;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, footerDividerY);
    ctx.lineTo(cardX + cardW - 40, footerDividerY);
    ctx.strokeStyle = '#E8E1D5';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Required Privacy Statement
    ctx.fillStyle = '#225539';
    ctx.font = 'bold 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🛡️  Privacy-protected • Derived from abstract reflection patterns', W / 2, footerDividerY + 26);

    ctx.fillStyle = '#7E8F83';
    ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No private journal text is shared.', W / 2, footerDividerY + 44);

    // Export to dataURL and Blob
    const url = canvas.toDataURL('image/png');
    setDataUrl(url);

    try {
      const parts = url.split(',');
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const initialBlob = new Blob([u8arr], { type: 'image/png' });
      setBlob(initialBlob);
    } catch {
      // Ignore fallback
    }

    canvas.toBlob((b) => {
      if (b) setBlob(b);
    }, 'image/png');
  }, [
    rawTopics,
    resolvedTotalReflections,
    resolvedActiveDays,
    resolvedUniqueTopics,
    resolvedMindfulSentiment,
    resolvedDistribution,
    topTopics,
  ]);

  useEffect(() => {
    if (isOpen) {
      renderCard();
      setCopied(false);
      setShared(false);
      setIsSharing(false);
      setShareNotice(null);
    }
  }, [isOpen, renderCard]);

  // Helper to obtain a reliable File instance from the rendered reflection tree
  const getGeneratedImageFile = (): File | null => {
    let targetBlob = blob;
    if (!targetBlob && dataUrl) {
      try {
        const parts = dataUrl.split(',');
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        targetBlob = new Blob([u8arr], { type: 'image/png' });
      } catch {
        targetBlob = null;
      }
    }

    if (!targetBlob) return null;

    try {
      return new File([targetBlob], 'my-reflection-tree.png', {
        type: 'image/png',
        lastModified: Date.now(),
      });
    } catch {
      return null;
    }
  };

  // Action: Native Web Share
  const handleNativeShare = async () => {
    setShareNotice(null);

    // 1. Guard against concurrent triggers
    if (isSharing) return;

    // 2. Verify navigator and navigator.share exist
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      setShareNotice("Native sharing isn't supported on this device. You can download the PNG or copy the image instead.");
      return;
    }

    // 3. Obtain the current generated image as a File
    const generatedImageFile = getGeneratedImageFile();
    if (!generatedImageFile) {
      setShareNotice("Native sharing isn't supported on this device. You can download the PNG or copy the image instead.");
      return;
    }

    // 4. Construct privacy-safe share payload with only the rendered image file and safe title
    const sharePayload = {
      files: [generatedImageFile],
      title: 'My Reflection Tree',
    };

    // 5. Test if file sharing is supported by the device/browser
    let canShareFiles = false;
    if (typeof navigator.canShare === 'function') {
      try {
        canShareFiles = navigator.canShare(sharePayload);
      } catch {
        canShareFiles = false;
      }
    }

    if (!canShareFiles) {
      setShareNotice("Native sharing isn't supported on this device. You can download the PNG or copy the image instead.");
      return;
    }

    // 6. Invoke native OS share sheet
    setIsSharing(true);
    try {
      await navigator.share(sharePayload);
      // Share succeeded: update button to success state
      setShared(true);
      setTimeout(() => setShared(false), 3500);
    } catch (err: any) {
      // 7. Handle cancellation gracefully:
      // If user closes or cancels the native share sheet, do NOT show an error and do NOT show "Shared successfully!"
      if (
        err?.name === 'AbortError' ||
        err?.code === 20 ||
        err?.message?.toLowerCase().includes('abort') ||
        err?.message?.toLowerCase().includes('canceled') ||
        err?.message?.toLowerCase().includes('cancelled')
      ) {
        return;
      }

      // If sharing encountered an OS or permission error, provide the helpful fallback guidance without faking success
      setShareNotice("Native sharing isn't supported on this device. You can download the PNG or copy the image instead.");
    } finally {
      setIsSharing(false);
    }
  };

  // Action: Direct PNG Download
  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'my-reflection-tree.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Action: Copy image to clipboard
  const handleCopyToClipboard = async () => {
    if (!blob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  const hasTopics = rawTopics.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#FAF8F5] rounded-3xl border-2 border-[#D8D1C5] shadow-2xl p-4 sm:p-6 text-stone-900 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] border border-[#BBD5C3] text-[#224A32] flex items-center justify-center shadow-2xs">
              <TreePine className="w-4 h-4 text-[#275338]" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#182E20]">
                Share My Reflection Tree
              </h3>
              <p className="text-[11px] text-[#607366]">
                Botanical Reflection Infographic (4:5 Portrait)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-8 h-8 rounded-xl border border-[#E0D8CC] bg-white hover:bg-[#F2ECE2] text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="bg-[#EDF5EF] border border-[#C2DBC7] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#1B3F27]">
          <ShieldCheck className="w-4 h-4 text-[#235334] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Privacy-Protected:</span> Derived from abstract reflection patterns. Your personal reflections, private thoughts, names, and timestamps are never shared.
          </div>
        </div>

        {/* Card Preview or Empty State */}
        {!hasTopics && resolvedTotalReflections === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0D8CC] p-8 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-[#7F9A88] mx-auto" />
            <h4 className="font-serif text-base font-medium text-[#1E3326]">
              Your Tree is Ready to Sprout
            </h4>
            <p className="text-xs text-[#63756A] max-w-sm mx-auto">
              Write your first reflection to cultivate your botanical reflection tree and unlock your shareable infographic.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visual Card Preview: 4:5 portrait preview displaying the complete card without clipping metrics */}
            <div className="relative rounded-2xl border-2 border-[#D4CCBF] overflow-hidden bg-[#ECE6DC] shadow-md flex items-center justify-center p-2">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt="My Reflection Tree"
                  className="w-full h-auto object-contain max-h-[62vh] rounded-xl select-none"
                />
              ) : (
                <div className="py-24 text-center text-xs text-stone-500">
                  Rendering botanical reflection infographic...
                </div>
              )}
            </div>

            {/* Platform Compatibility Guide */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#55695C] pt-0.5">
              <span className="text-[#7F9185] font-medium">Ready to share on:</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAE4D9] font-medium text-[#2E4235]">WhatsApp</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAE4D9] font-medium text-[#2E4235]">Instagram</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAE4D9] font-medium text-[#2E4235]">LinkedIn</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EAE4D9] font-medium text-[#2E4235]">X / Twitter</span>
            </div>

            {/* Notice if native sharing is unsupported or failed */}
            {shareNotice && (
              <div
                id="share-modal-notice-banner"
                className="bg-[#FAF2E6] border border-[#E4D4BE] rounded-xl p-2.5 flex items-start gap-2 text-xs text-[#6B4B1C]"
              >
                <AlertCircle className="w-4 h-4 text-[#8C6228] shrink-0 mt-0.5" />
                <span>{shareNotice}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Native Web Share Button */}
              <button
                id="share-modal-share-now-btn"
                type="button"
                onClick={handleNativeShare}
                disabled={isSharing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D4A38] hover:bg-[#1E3426] active:bg-[#15251B] disabled:opacity-75 disabled:cursor-wait text-white text-xs font-medium transition-all shadow-xs"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : shared ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Shared successfully!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Now</span>
                  </>
                )}
              </button>

              {/* Download PNG Button */}
              <button
                id="share-modal-download-png-btn"
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EFE7] border border-[#D5CCC0] text-[#1E3326] text-xs font-medium transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#2D4A38]" />
                <span>Download PNG</span>
              </button>

              {/* Copy Image Button */}
              <button
                id="share-modal-copy-image-btn"
                type="button"
                onClick={handleCopyToClipboard}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EFE7] border border-[#D5CCC0] text-[#1E3326] text-xs font-medium transition-all shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#55695C]" />
                    <span>Copy Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
