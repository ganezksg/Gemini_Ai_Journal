export interface TopicFrequencyScale {
  ratio: number;
  tier: 'quiet' | 'moderate' | 'notable' | 'prominent';
  nodeWidth: number;
  nodeClass: string;
  badgeClass: string;
  titleClass: string;
  strokeWidth: number;
  edgeColor: string;
}

export interface SubtopicFrequencyScale {
  ratio: number;
  nodeWidth: number;
  nodeClass: string;
  badgeClass: string;
}

/**
 * Normalizes major topic frequency using logarithmic dampening to handle extreme frequency disparities (e.g., 1 vs 50+).
 * Bounded between 180px (min) and 255px (max) to prevent graph disruption.
 */
export function computeTopicFrequencyScale(
  frequency: number,
  minFreq: number,
  maxFreq: number
): TopicFrequencyScale {
  const safeFreq = Math.max(1, Math.round(frequency || 1));

  let ratio = 0;
  if (maxFreq > minFreq) {
    const logMin = Math.log2(Math.max(1, minFreq));
    const logMax = Math.log2(Math.max(1, maxFreq));
    const logVal = Math.log2(safeFreq);
    ratio = Math.max(0, Math.min(1, (logVal - logMin) / (logMax - logMin)));
  } else {
    // If all topics have identical frequencies, calibrate proportionally
    ratio = safeFreq >= 8 ? 0.85 : safeFreq >= 4 ? 0.6 : safeFreq >= 2 ? 0.35 : 0.15;
  }

  let tier: 'quiet' | 'moderate' | 'notable' | 'prominent' = 'quiet';
  if (safeFreq >= 8 || ratio >= 0.75) {
    tier = 'prominent';
  } else if (safeFreq >= 4 || ratio >= 0.45) {
    tier = 'notable';
  } else if (safeFreq >= 2 || ratio >= 0.2) {
    tier = 'moderate';
  } else {
    tier = 'quiet';
  }

  // Smooth bounded width between 180px and 255px
  const nodeWidth = Math.round(180 + ratio * 75);
  // Edge thickness scaled gently between 1.4px and 2.4px
  const strokeWidth = Number((1.4 + ratio * 1.0).toFixed(1));

  let nodeClass = '';
  let badgeClass = '';
  let titleClass = '';
  let edgeColor = '#b45309';

  switch (tier) {
    case 'prominent':
      nodeClass = 'border-2 border-amber-700/80 bg-linear-to-b from-amber-50/60 via-white to-white shadow-xs';
      badgeClass = 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold';
      titleClass = 'text-base font-semibold text-stone-900 tracking-tight';
      edgeColor = '#92400e';
      break;
    case 'notable':
      nodeClass = 'border border-amber-600/60 bg-linear-to-b from-amber-50/30 to-white shadow-2xs hover:border-amber-700';
      badgeClass = 'bg-amber-100/70 text-amber-900 border border-amber-200 font-medium';
      titleClass = 'text-[15px] font-semibold text-stone-900';
      edgeColor = '#b45309';
      break;
    case 'moderate':
      nodeClass = 'border border-stone-300 bg-white hover:border-amber-600/50 shadow-2xs';
      badgeClass = 'bg-stone-100 text-stone-700 border border-stone-200';
      titleClass = 'text-sm font-medium text-stone-900';
      edgeColor = '#a8a29e';
      break;
    case 'quiet':
    default:
      nodeClass = 'border border-stone-200/90 bg-stone-50/70 text-stone-700 hover:border-stone-400 shadow-2xs';
      badgeClass = 'bg-stone-100/80 text-stone-500 border border-stone-200/60';
      titleClass = 'text-[13.5px] font-medium text-stone-800';
      edgeColor = '#d6d3d1';
      break;
  }

  return { ratio, tier, nodeWidth, nodeClass, badgeClass, titleClass, strokeWidth, edgeColor };
}

/**
 * Subtopics also scale subtly with frequency, but remain strictly smaller than any parent topic (135px - 165px vs parent 180px - 255px).
 */
export function computeSubtopicFrequencyScale(
  frequency: number,
  maxSubFreq: number
): SubtopicFrequencyScale {
  const safeFreq = Math.max(1, Math.round(frequency || 1));
  const ratio = maxSubFreq > 1 ? Math.min(1, safeFreq / maxSubFreq) : 0.2;
  // Subtopics width strictly bounded between 135px and 165px (always smaller than parent topics which start at 180px)
  const nodeWidth = Math.round(135 + ratio * 30);

  let nodeClass = 'border border-stone-200 bg-stone-50 text-stone-800 shadow-2xs hover:bg-amber-50/70 hover:border-amber-300';
  let badgeClass = 'text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full';

  if (safeFreq >= 4 || ratio > 0.6) {
    nodeClass = 'border border-amber-300/80 bg-amber-50/40 text-stone-900 shadow-2xs hover:border-amber-400';
    badgeClass = 'text-[9.5px] font-semibold text-amber-900 bg-amber-100/80 border border-amber-200/70 px-1.5 py-0.5 rounded-full';
  } else if (safeFreq >= 2 || ratio > 0.3) {
    nodeClass = 'border border-stone-300 bg-white text-stone-800 shadow-2xs hover:border-amber-300';
    badgeClass = 'text-[9px] font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full';
  }

  return { ratio, nodeWidth, nodeClass, badgeClass };
}
