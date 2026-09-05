import { Type } from '@google/genai';
import { SafeInterestMapData, SafeInterestTopic, SafeInterestSubtopic, SafeInterestRelationship } from './types';

/**
 * SAFE_INTEREST_MAP_SCHEMA Specification
 *
 * Privacy-Preserving Abstraction Layer ensuring all Interest Map nodes,
 * edges, categories, and descriptions are completely abstracted and safe
 * for public visualization and export.
 */

export const PII_REGEXES = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email addresses
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // Phone numbers
  /(?:\$|USD|EUR|GBP|£|€)\s*\d+(?:,\d{3})*(?:\.\d+)?|\b\d+\s*(?:dollars|bucks|k)\b/gi, // Currency & financial figures
  /\b\d{3}-\d{2}-\d{4}\b/g, // Social Security Numbers
  /https?:\/\/[^\s]+/gi, // URLs
];

export const SENSITIVE_TRANSFORMATION_MAP: Array<{
  pattern: RegExp;
  safeName: string;
  safeCategory: string;
  safeDesc: string;
}> = [
  {
    // Intimate / sexual / physical relationship concerns
    pattern: /\b(sex|sexual|intercourse|intimacy|physical intimacy|bedroom|fetish|erotic|orgasm|genital|penis|vagina|affair|infidelity|cheating|cheated|dating apps|hookup)\b/i,
    safeName: 'Personal Connections',
    safeCategory: 'Relationships',
    safeDesc: 'Reflections around personal connections, communication, and interpersonal relationships.',
  },
  {
    // Family conflict, inheritance disputes, parental arguments
    pattern: /\b(family argument|family fight|family dispute|divorce|custody|child support|estranged|in-laws|parents fighting|argument with father|argument with mother|estate inheritance|family property|sibling rivalry)\b/i,
    safeName: 'Family & Connections',
    safeCategory: 'Relationships',
    safeDesc: 'Reflections exploring family relationships, shared bonds, and connections.',
  },
  {
    // Financial distress, debt, mortgage, bankruptcy
    pattern: /\b(debt|broke|bankruptcy|bankrupt|foreclosure|eviction|mortgage|credit card debt|loan|loans|salary|income|bills|financial anxiety|financial stress|unpaid)\b/i,
    safeName: 'Life Planning',
    safeCategory: 'Life',
    safeDesc: 'Thoughts and reflections regarding personal planning, priorities, and life organization.',
  },
  {
    // Career, workplace conflict, layoffs, toxic boss, PIP
    pattern: /\b(fired|layoff|layoffs|laid off|boss|supervisor|manager|toxic boss|toxic workplace|hr complaint|pip|performance improvement plan|resignation|quitting|job loss|workplace stress)\b/i,
    safeName: 'Professional Life',
    safeCategory: 'Career',
    safeDesc: 'Reflections on professional development, work life, and career growth.',
  },
  {
    // Severe anxiety, panic, depression, emotional distress
    pattern: /\b(anxiety|panic attack|panic attacks|depression|depressed|clinical depression|grief|mourning|trauma|ptsd|mental breakdown|crying|overwhelmed|distress)\b/i,
    safeName: 'Inner Wellbeing',
    safeCategory: 'Wellbeing',
    safeDesc: 'Practices and reflections supporting emotional balance, mindfulness, and mental clarity.',
  },
  {
    // Medical diagnoses, medication, illnesses, hospital visits
    pattern: /\b(cancer|tumor|chemo|bi-?polar|adhd|ocd|schizo|therapy|therapist|psychiatrist|prescription|prozac|lexapro|zoloft|adderall|surgery|illness|disease|diagnosis|covid|doctor|hospital|symptom|symptoms|lab results)\b/i,
    safeName: 'Personal Wellbeing',
    safeCategory: 'Health',
    safeDesc: 'Mindful observations regarding physical wellness, vitality, and personal care.',
  },
  {
    // Identifiable persons or specific personal names mentioned in conflict or friendship
    pattern: /\b(marcus|falling out with|friend named|person named|friendship with|confronted|betrayal by|argument with [a-z]+)\b/i,
    safeName: 'Important Connections',
    safeCategory: 'Relationships',
    safeDesc: 'Reflections exploring meaningful relationships and interpersonal dynamics.',
  },
];

export function scrubPII(text: string): string {
  let cleaned = text;
  for (const regex of PII_REGEXES) {
    cleaned = cleaned.replace(regex, '[redacted]');
  }
  return cleaned;
}

export const CANONICAL_TOPIC_REGISTRY: Array<{
  canonicalName: string;
  category: string;
  defaultDesc: string;
  aliases: RegExp;
}> = [
  {
    canonicalName: 'Technology & Building',
    category: 'Technology',
    defaultDesc: 'Exploration of software systems, coding, algorithms, and technical tools.',
    aliases: /\b(coding|software|programming|developer|development|engineer|engineering|debugging|debug|codebase|algorithm|algorithms|frontend|backend|fullstack|full-stack|ai project|machine learning|app development|web development|tech stack|code review|devops|cloud|computer science)\b/i,
  },
  {
    canonicalName: 'Artificial Intelligence',
    category: 'Technology',
    defaultDesc: 'Reflections on artificial intelligence, machine learning, and computational agents.',
    aliases: /\b(artificial intelligence|generative ai|llm|llms|gemini|gpt|deep learning|neural network|agentic ai)\b/i,
  },
  {
    canonicalName: 'Mindfulness & Presence',
    category: 'Wellbeing',
    defaultDesc: 'Practices and reflections dedicated to mindful awareness, presence, and daily calm.',
    aliases: /\b(mindful|mindfulness|meditation|meditating|breathwork|breathing|presence|zen|stillness|calmness|slowing down|peaceful reflection|centeredness)\b/i,
  },
  {
    canonicalName: 'Inner Wellbeing',
    category: 'Wellbeing',
    defaultDesc: 'Reflections exploring emotional clarity, self-awareness, and mental equilibrium.',
    aliases: /\b(inner wellbeing|wellbeing|mental clarity|emotional balance|inner peace|self-reflection|introspection|grounding|resilience|clarity|emotions|burnout|overwhelm)\b/i,
  },
  {
    canonicalName: 'Health & Vitality',
    category: 'Health',
    defaultDesc: 'Observations and habits supporting physical wellness, movement, and vitality.',
    aliases: /\b(health|fitness|exercise|workout|running|jogging|gym|nutrition|diet|sleep|rest|vitality|physical wellbeing|walk|walking|hiking)\b/i,
  },
  {
    canonicalName: 'Professional Growth',
    category: 'Career',
    defaultDesc: 'Reflections on professional pursuits, career development, and project milestones.',
    aliases: /\b(career|job|profession|professional|workplace|work life|projects|leadership|productivity|workflow|goals|career trajectory|promotion|business)\b/i,
  },
  {
    canonicalName: 'Relationships & Connection',
    category: 'Relationships',
    defaultDesc: 'Reflections exploring meaningful personal connections, communication, and community.',
    aliases: /\b(relationship|relationships|connection|connections|friend|friends|friendship|family|social|community|partnership|interpersonal|conversations|companionship)\b/i,
  },
  {
    canonicalName: 'Learning & Philosophy',
    category: 'Intellectual',
    defaultDesc: 'Curiosity-driven study, philosophical inquiries, and expanding personal perspectives.',
    aliases: /\b(reading|books|book|literature|philosophy|philosophical|learning|study|education|knowledge|curiosity|intellectual|thinking|ideas|curiosity)\b/i,
  },
  {
    canonicalName: 'Creative Expression',
    category: 'Creativity',
    defaultDesc: 'Creative exploration through writing, art, music, design, and self-expression.',
    aliases: /\b(creativity|creative|art|writing|journaling|music|design|craft|expression|hobbies|artistic)\b/i,
  },
  {
    canonicalName: 'Life Planning',
    category: 'Life',
    defaultDesc: 'Reflections focused on personal organization, future plans, and intentional living.',
    aliases: /\b(life planning|planning|organization|habits|routines|future goals|time management|priorities|finances|budgeting|intentionality)\b/i,
  },
];

export function ensureSafeTopic(
  name: string,
  category: string,
  description: string,
  existingTopicNames?: string[]
): {
  name: string;
  category: string;
  description: string;
} {
  const combined = `${name} ${description}`.toLowerCase();

  // 1. Check sensitive transformations first (absolute privacy priority)
  for (const mapping of SENSITIVE_TRANSFORMATION_MAP) {
    if (mapping.pattern.test(combined)) {
      return {
        name: mapping.safeName,
        category: mapping.safeCategory,
        description: mapping.safeDesc,
      };
    }
  }

  // 2. Check existing user canonical topic names for stable naming across refreshes
  if (Array.isArray(existingTopicNames) && existingTopicNames.length > 0) {
    const rawClean = name.trim().toLowerCase();
    for (const existingName of existingTopicNames) {
      if (existingName.toLowerCase() === rawClean) {
        return {
          name: existingName,
          category: category || 'General',
          description: description || 'Reflections exploring personal growth and daily life experiences.',
        };
      }
    }
  }

  // 3a. Exact canonical name match first
  for (const registry of CANONICAL_TOPIC_REGISTRY) {
    if (registry.canonicalName.toLowerCase() === name.trim().toLowerCase()) {
      return {
        name: registry.canonicalName,
        category: registry.category,
        description: description && description.length > 15 ? scrubPII(description).slice(0, 250) : registry.defaultDesc,
      };
    }
  }

  // 3b. Topic name alias match
  for (const registry of CANONICAL_TOPIC_REGISTRY) {
    if (registry.aliases.test(name)) {
      return {
        name: registry.canonicalName,
        category: registry.category,
        description: description && description.length > 15 ? scrubPII(description).slice(0, 250) : registry.defaultDesc,
      };
    }
  }

  // 3c. Combined alias fallback
  for (const registry of CANONICAL_TOPIC_REGISTRY) {
    if (registry.aliases.test(combined)) {
      return {
        name: registry.canonicalName,
        category: registry.category,
        description: description && description.length > 15 ? scrubPII(description).slice(0, 250) : registry.defaultDesc,
      };
    }
  }

  // 4. Scrub any lingering PII or private strings
  let scrubbedName = scrubPII(name).trim();
  let scrubbedCat = scrubPII(category).trim();
  let scrubbedDesc = scrubPII(description).trim();

  // Normalize tone away from personal accusations or raw confessions
  if (/\b(you argued|you fought|you struggled with|your partner|your doctor|your boss|your debt|dr\.\s*[a-z]+)\b/i.test(scrubbedDesc)) {
    scrubbedDesc = 'Reflections exploring personal growth and daily life experiences.';
  }

  return {
    name: scrubbedName.slice(0, 60),
    category: scrubbedCat.slice(0, 30) || 'Personal Reflections',
    description: scrubbedDesc.slice(0, 250) || 'Reflections exploring personal growth and daily life experiences.',
  };
}

export function isRedundantSubtopic(subName: string, parentName: string): boolean {
  const sub = subName.trim().toLowerCase();
  const parent = parentName.trim().toLowerCase();

  if (!sub || sub === parent) return true;

  // Split into tokens ignoring punctuation and stop words
  const tokenize = (str: string) =>
    str
      .split(/[\s,&/_-]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 1 && t !== 'and' && t !== 'the' && t !== 'of' && t !== 'in');

  const parentTokens = tokenize(parent);
  const subTokens = tokenize(sub);

  if (subTokens.length === 0) return true;

  // If subtopic consists only of words found in parent (e.g. "Technology", "Building", "Wellbeing", "Health")
  if (subTokens.every((t) => parentTokens.includes(t))) {
    return true;
  }

  // If parent consists only of words found in subtopic
  if (parentTokens.every((t) => subTokens.includes(t))) {
    return true;
  }

  // Check stem/truncation (e.g. "Tech" or "Technology..." matching "Technology & Building")
  if (parent.startsWith(sub) && sub.length >= 4) {
    return true;
  }
  if (sub.startsWith(parent) && parent.length >= 4) {
    return true;
  }

  // Canonical category redundant single-word checks
  const redundantMap: Record<string, string[]> = {
    'technology & building': ['tech', 'technology', 'building', 'technologies', 'tools', 'code'],
    'mindfulness & presence': ['mindfulness', 'presence', 'mindful', 'present', 'stillness'],
    'inner wellbeing': ['wellbeing', 'inner', 'well-being', 'wellness'],
    'health & vitality': ['health', 'vitality', 'healthy'],
    'professional growth': ['professional', 'growth', 'career', 'work'],
    'relationships & connection': ['relationships', 'relationship', 'connection', 'connections'],
    'learning & philosophy': ['learning', 'philosophy', 'study'],
    'creative expression': ['creative', 'expression', 'creativity'],
    'life planning': ['planning', 'life', 'plans', 'plan'],
  };

  const genericTokens = redundantMap[parent];
  if (genericTokens && genericTokens.includes(sub)) {
    return true;
  }

  return false;
}

export const DEFAULT_SPECIFIC_SUBTOPICS: Record<string, Array<{ name: string; desc: string; prompt: string }>> = {
  'Technology & Building': [
    { name: 'Software Projects', desc: 'Application development, architecture, and coding craft.', prompt: 'What new technical capabilities or architectures are you excited to explore?' },
    { name: 'AI Development', desc: 'Working with intelligent models, agent flows, and technical APIs.', prompt: 'How are you approaching resilience and clarity in your technical systems?' },
    { name: 'Firebase & Cloud', desc: 'Cloud data persistence, security rules, and infrastructure.', prompt: 'What backend capabilities are accelerating your building progress?' },
  ],
  'Artificial Intelligence': [
    { name: 'Model Interaction', desc: 'Prompt engineering, model capabilities, and structured responses.', prompt: 'How is working with AI changing how you think through complex problems?' },
    { name: 'System Resilience', desc: 'Designing resilient error recovery and fallback strategies.', prompt: 'Where do you see the greatest leverage in your current AI experiments?' },
  ],
  'Mindfulness & Presence': [
    { name: 'Quiet Stillness', desc: 'Pausing to cultivate calm and mental clarity.', prompt: 'How does taking regular mindful pauses change the rhythm of your day?' },
    { name: 'Mindful Breathing', desc: 'Centering attention through deliberate breath awareness.', prompt: 'What shifts do you notice in your physical awareness during moments of stillness?' },
  ],
  'Inner Wellbeing': [
    { name: 'Emotional Balance', desc: 'Observing and processing emotional states with kindness.', prompt: 'What practices best help you return to a state of calm when feelings arise?' },
    { name: 'Self-Reflection', desc: 'Honest inquiry into personal patterns and daily experiences.', prompt: 'What insights have emerged from your recent journal reflections?' },
  ],
  'Health & Vitality': [
    { name: 'Physical Movement', desc: 'Walking, exercise, and maintaining bodily energy.', prompt: 'How does daily movement influence your mental sharpness and mood?' },
    { name: 'Rest & Recovery', desc: 'Prioritizing sleep, recovery, and restorative pauses.', prompt: 'How are you honoring your body\'s need for recuperation?' },
  ],
  'Professional Growth': [
    { name: 'Project Milestones', desc: 'Navigating deliverables, goals, and team initiatives.', prompt: 'What professional milestone will have the highest long-term significance for you?' },
    { name: 'Skill Mastery', desc: 'Deepening craft and expanding technical expertise.', prompt: 'Which skills are you most motivated to sharpen in your upcoming work?' },
  ],
  'Relationships & Connection': [
    { name: 'Meaningful Dialogue', desc: 'Engaging in honest, supportive conversations.', prompt: 'What conversations have brought the deepest mutual understanding lately?' },
    { name: 'Community Bonds', desc: 'Shared moments with family, friends, and collaborators.', prompt: 'How can you continue fostering warmth in your important connections?' },
  ],
  'Learning & Philosophy': [
    { name: 'Curiosity & Reading', desc: 'Exploring literature, deep essays, and new ideas.', prompt: 'What perspective-shifting ideas have you encountered in recent reading?' },
    { name: 'Conceptual Inquiry', desc: 'Pondering questions of meaning, purpose, and logic.', prompt: 'What fundamental questions are currently holding your attention?' },
  ],
  'Creative Expression': [
    { name: 'Creative Projects', desc: 'Artistic exploration, writing, and hands-on making.', prompt: 'What creative projects bring you the most genuine flow state?' },
    { name: 'Self-Expression', desc: 'Articulating personal thoughts and aesthetic perspectives.', prompt: 'How can you make space for uninhibited creative practice?' },
  ],
  'Life Planning': [
    { name: 'Intentional Habits', desc: 'Structuring daily routines that align with core values.', prompt: 'Which daily habit provides the strongest foundation for your overall goals?' },
    { name: 'Priority Alignment', desc: 'Allocating focus and energy toward what matters most.', prompt: 'How can you simplify your weekly commitments to protect your core priorities?' },
  ],
};

/**
 * Ensure subtopics are privacy-safe, specific, and NOT redundant with parent.
 * Note: Subtopics do NOT get passed through CANONICAL_TOPIC_REGISTRY to preserve specificity!
 */
export function ensureSafeSubtopic(
  subRawName: string,
  parentName: string,
  category: string,
  description: string
): {
  name: string;
  description: string;
  isRedundant: boolean;
} {
  const combined = `${subRawName} ${description}`.toLowerCase();

  // 1. Check sensitive transformations first (absolute privacy priority)
  for (const mapping of SENSITIVE_TRANSFORMATION_MAP) {
    if (mapping.pattern.test(combined)) {
      const safeName = mapping.safeName;
      return {
        name: safeName,
        description: mapping.safeDesc,
        isRedundant: isRedundantSubtopic(safeName, parentName),
      };
    }
  }

  // 2. Scrub PII and normalize
  let scrubbedName = scrubPII(subRawName).trim();
  let scrubbedDesc = scrubPII(description).trim();

  // Strip wrapping quotes or brackets
  scrubbedName = scrubbedName.replace(/^["'`]|["'`]$/g, '').trim();

  // 3. Check redundancy against parent topic
  const isRedundant = isRedundantSubtopic(scrubbedName, parentName);

  return {
    name: scrubbedName.slice(0, 45) || 'Specific Focus',
    description: scrubbedDesc.slice(0, 200) || 'Exploration of this specific facet.',
    isRedundant,
  };
}

export function ensureSafePrompt(prompt: string, topicName: string): string {
  const cleaned = scrubPII(prompt).trim();
  if (
    cleaned.length < 10 ||
    /\b(fight|sex|debt|illness|diagnosis|fired|divorce|doctor|prescription|zoloft|marcus|partner)\b/i.test(cleaned)
  ) {
    return `How can you bring greater balance and presence to your ${topicName.toLowerCase()}?`;
  }
  return cleaned.slice(0, 200);
}

/**
 * Enforce SAFE_INTEREST_MAP_SCHEMA & defense-in-depth topic consolidation.
 * - Merges convergent/duplicate topics into consistent canonical topics.
 * - Accumulates semantic recurrence frequencies across reflections (1..totalReflectionsAnalyzed).
 * - Deduplicates and refines subtopics with safe prompts.
 * - Sorts topics by frequency descending for visual hierarchy in React Flow.
 */
export function enforceSafeInterestMapAbstraction(
  parsed: any,
  totalReflectionsAnalyzed: number,
  existingTopicNames?: string[]
): SafeInterestMapData {
  const rawTopics = Array.isArray(parsed?.topics) ? parsed.topics : [];
  const maxAllowedFrequency = Math.max(1, totalReflectionsAnalyzed);

  // Map old raw IDs to new consolidated IDs
  const rawIdToConsolidatedIdMap = new Map<string, string>();

  // Consolidated topics stored by normalized canonical key
  const consolidatedMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      description: string;
      frequency: number;
      subtopicsMap: Map<string, SafeInterestSubtopic>;
    }
  >();

  rawTopics.forEach((t: any, idx: number) => {
    const rawName = String(t.name || 'Personal Reflections').trim();
    const rawCategory = String(t.category || 'Reflections').trim();
    const rawDesc = String(t.description || '').trim();
    const rawId = String(t.id || `topic-${idx + 1}`);

    const safe = ensureSafeTopic(rawName, rawCategory, rawDesc, existingTopicNames);
    const canonicalKey = safe.name.toLowerCase().trim();
    const safeId = safe.name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    rawIdToConsolidatedIdMap.set(rawId, safeId);

    // Raw topic frequency parsed from model
    const topicFrequency = typeof t.frequency === 'number' && t.frequency > 0
      ? Math.round(t.frequency)
      : 1;

    // Process raw subtopics with specificity and anti-redundancy checks
    const rawSubtopics = Array.isArray(t.subtopics) ? t.subtopics : [];
    const safeSubtopics: SafeInterestSubtopic[] = [];

    rawSubtopics.forEach((st: any, sIdx: number) => {
      const subRawName = String(st.name || 'Aspect').trim();
      const subSafe = ensureSafeSubtopic(subRawName, safe.name, safe.category, String(st.description || ''));

      // Anti-redundancy check: Do not create a child topic when it is semantically equivalent to its parent
      if (subSafe.isRedundant) {
        return;
      }

      const safePrompt = ensureSafePrompt(String(st.prompt || ''), subSafe.name);
      const subId = String(st.id || `sub-${safeId}-${sIdx + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .slice(0, 40);

      const subFreq = typeof st.frequency === 'number' && st.frequency > 0
        ? Math.round(st.frequency)
        : 1;

      safeSubtopics.push({
        id: subId,
        name: subSafe.name,
        frequency: Math.max(1, Math.min(maxAllowedFrequency, subFreq)),
        description: subSafe.description.slice(0, 200),
        prompt: safePrompt,
      });
    });

    // If all raw subtopics were redundant or omitted, populate specific non-redundant facets
    if (safeSubtopics.length === 0) {
      const fallbacks = DEFAULT_SPECIFIC_SUBTOPICS[safe.name] || [
        { name: 'Focused Practice', desc: `Exploration of specific aspects of ${safe.name}.`, prompt: `How can you bring greater intentionality to your ${safe.name.toLowerCase()}?` }
      ];
      fallbacks.slice(0, 2).forEach((fb, fbIdx) => {
        safeSubtopics.push({
          id: `sub-${safeId}-fb-${fbIdx + 1}`,
          name: fb.name,
          frequency: Math.max(1, Math.min(maxAllowedFrequency, Math.min(topicFrequency, 2))),
          description: fb.desc,
          prompt: fb.prompt,
        });
      });
    }

    if (consolidatedMap.has(canonicalKey)) {
      // CONSOLIDATE: Topic already exists under this canonical key
      const existing = consolidatedMap.get(canonicalKey)!;

      // Increment/combine recurrence frequency, bounded by dataset size
      existing.frequency = Math.min(maxAllowedFrequency, existing.frequency + topicFrequency);

      // Merge and deduplicate subtopics
      safeSubtopics.forEach((sub) => {
        const subKey = sub.name.toLowerCase().trim();
        if (existing.subtopicsMap.has(subKey)) {
          const existingSub = existing.subtopicsMap.get(subKey)!;
          existingSub.frequency = Math.min(existing.frequency, Math.max(existingSub.frequency, sub.frequency));
          if (sub.prompt && sub.prompt.length > existingSub.prompt.length) {
            existingSub.prompt = sub.prompt;
          }
        } else {
          existing.subtopicsMap.set(subKey, sub);
        }
      });
    } else {
      // Create new consolidated entry
      const subtopicsMap = new Map<string, SafeInterestSubtopic>();
      safeSubtopics.forEach((sub) => {
        subtopicsMap.set(sub.name.toLowerCase().trim(), sub);
      });

      consolidatedMap.set(canonicalKey, {
        id: safeId,
        name: safe.name,
        category: safe.category,
        description: safe.description,
        frequency: Math.max(1, Math.min(maxAllowedFrequency, topicFrequency)),
        subtopicsMap,
      });
    }
  });

  // Convert consolidated map into final sorted topics array
  const safeTopics: SafeInterestTopic[] = Array.from(consolidatedMap.values()).map((c) => {
    // Bound subtopic frequencies to never exceed parent topic frequency and filter any redundancy
    let subtopics = Array.from(c.subtopicsMap.values())
      .filter((st) => !isRedundantSubtopic(st.name, c.name))
      .map((st) => ({
        ...st,
        frequency: Math.min(c.frequency, st.frequency),
      }));

    // If all were redundant, ensure at least one specific fallback exists
    if (subtopics.length === 0) {
      const fallbacks = DEFAULT_SPECIFIC_SUBTOPICS[c.name] || [
        { name: 'Focused Practice', desc: `Exploration of specific aspects of ${c.name}.`, prompt: `How can you bring greater intentionality to your ${c.name.toLowerCase()}?` }
      ];
      fallbacks.slice(0, 2).forEach((fb, fbIdx) => {
        subtopics.push({
          id: `sub-${c.id}-fb-${fbIdx + 1}`,
          name: fb.name,
          frequency: Math.max(1, Math.min(c.frequency, 1)),
          description: fb.desc,
          prompt: fb.prompt,
        });
      });
    }

    return {
      id: c.id,
      name: c.name,
      category: c.category,
      frequency: c.frequency,
      description: c.description,
      subtopics,
    };
  });

  // Sort topics by frequency descending so highest recurrence has top visual prominence
  safeTopics.sort((a, b) => b.frequency - a.frequency);

  // Map inter-topic connections to consolidated IDs
  const rawConnections = Array.isArray(parsed?.relatedConnections) ? parsed.relatedConnections : [];
  const safeConnections: SafeInterestRelationship[] = [];
  const seenConnections = new Set<string>();

  rawConnections.forEach((conn: any) => {
    const rawFrom = String(conn.fromTopicId || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const rawTo = String(conn.toTopicId || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const fromTopicId = rawIdToConsolidatedIdMap.get(rawFrom) || rawFrom;
    const toTopicId = rawIdToConsolidatedIdMap.get(rawTo) || rawTo;

    if (fromTopicId && toTopicId && fromTopicId !== toTopicId) {
      const connKey = `${fromTopicId}->${toTopicId}`;
      if (!seenConnections.has(connKey)) {
        seenConnections.add(connKey);
        safeConnections.push({
          fromTopicId,
          toTopicId,
          relationship: typeof conn.relationship === 'string' ? scrubPII(conn.relationship).slice(0, 60) : undefined,
        });
      }
    }
  });

  return {
    topics: safeTopics,
    relatedConnections: safeConnections,
    totalReflectionsAnalyzed,
    generatedAt: Date.now(),
    privacyAbstractionVersion: 'v2-safe-consolidated',
  };
}

export const INTEREST_MAP_SYSTEM_INSTRUCTION = `You are the Privacy-Preserving Interest Map Abstraction Engine for a personal journal.
Your highest imperatives are: USER PRIVACY, TOPIC CONSOLIDATION, FREQUENCY AWARENESS, and STABLE NAMING.

1. TOPIC CONSOLIDATION & NORMALIZATION MANDATE:
- Similar concepts across different reflections MUST be normalized into the same broader topic instead of creating fragmented or duplicate nodes.
- Converge technical themes (e.g. "coding", "software development", "debugging", "building an AI project", "programming", "algorithms") into a unified canonical topic: "Technology & Building" or "Artificial Intelligence".
- Converge presence themes (e.g. "meditation", "mindfulness", "breathwork", "presence", "stillness") into "Mindfulness & Presence".
- Converge wellbeing themes (e.g. "anxiety", "burnout", "emotional processing", "self-reflection", "inner peace") into "Inner Wellbeing".
- Converge health themes (e.g. "workout", "gym", "running", "walking", "nutrition", "sleep") into "Health & Vitality".
- Converge work themes (e.g. "career goals", "workplace projects", "productivity", "leadership") into "Professional Growth".
- Converge social themes (e.g. "friends", "family bonds", "conversations", "community") into "Relationships & Connection".
- Converge study themes (e.g. "reading", "books", "philosophy", "intellectual exploration") into "Learning & Philosophy".

2. FREQUENCY AWARENESS & ACCURATE RECURRENCE:
- The "frequency" field of each topic MUST represent the exact number of journal entries/reflections in the dataset that discuss or touch upon that topic.
- Frequency must be an integer between 1 and the total number of entries analyzed.
- If a topic appears in 5 reflections, its frequency must be 5.
- If a topic appears in both Entry #1 and Entry #2, its frequency MUST be 2.
- If a topic appears in only 1 entry, its frequency is 1.
- Subtopic frequencies must represent how frequently that specific sub-theme appeared, and MUST NOT exceed the parent topic frequency.

3. PRIVACY PROTECTION & NEUTRAL ABSTRACTION:
- NEVER expose intimate or private journal details directly in the Interest Map.
- Convert sensitive content into an abstract, neutral topic label:
  - Personal relationship crisis, conflict, or intimate issue -> "Relationships & Connection" (or "Personal Connections"), NEVER exposing partners, marital discord, or events.
  - Medical diagnoses, symptoms, treatments, medications -> "Health & Vitality" or "Personal Wellbeing", NEVER specific conditions or drugs.
  - Financial stress, debt, mortgage, salary -> "Life Planning".
  - Workplace conflict, PIP, toxic boss -> "Professional Growth".
  - Anxiety, depression, grief, panic -> "Inner Wellbeing".
- Descriptions and reflection prompts must remain constructive, safe, and privacy-preserving.

4. STABLE NAMING:
- When "EXISTING CANONICAL TOPICS IN USER'S MAP" are provided in the prompt, PREFER those exact canonical names rather than inventing synonyms or slightly different variations on every refresh.

5. SMALL DATASETS (1–2 REFLECTIONS):
- When the dataset contains only 1 or 2 entries, generate 2 to 4 clean, cohesive topics with 1 to 3 subtopics each.
- Accurately assign frequency = 2 (if present across both entries) or frequency = 1 (if present in one entry).
- Do not wait for a large history to generate useful, well-structured topics.

6. SUBTOPIC SPECIFICITY & ANTI-REDUNDANCY MANDATE:
- Do NOT create a child topic when it is semantically equivalent to its parent.
- Child topics MUST represent a more specific concept, practical facet, or distinct specialization.
- For example:
  Technology & Building
    ├── AI Development
    ├── Firebase
    └── Software Projects
  rather than:
  Technology & Building
    └── Technology
- Apply the same rule to all categories:
  - Inner Wellbeing -> "Emotional Balance", "Self-Reflection", "Stress Management" (NEVER "Wellbeing" or "Inner Wellbeing")
  - Health & Vitality -> "Physical Movement", "Sleep Habits", "Rest & Recovery" (NEVER "Health" or "Vitality")
  - Life Planning -> "Daily Routines", "Goal Priorities", "Intentional Habits" (NEVER "Planning" or "Life")
  - Mindfulness & Presence -> "Quiet Stillness", "Mindful Breathing" (NEVER "Mindfulness" or "Presence")
  - Relationships & Connection -> "Meaningful Dialogue", "Community Bonds" (NEVER "Relationships" or "Connection")
- Child topics must ALWAYS be more granular and distinct from their parent topic.

SCHEMA FORMAT:
Return 2 to 5 consolidated topics conforming to the response schema, each with 1 to 3 subtopics and constructive reflection prompts.`;

export const INTEREST_MAP_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          frequency: { type: Type.NUMBER },
          description: { type: Type.STRING },
          subtopics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                frequency: { type: Type.NUMBER },
                description: { type: Type.STRING },
                prompt: { type: Type.STRING },
              },
              required: ['id', 'name', 'frequency', 'description', 'prompt'],
            },
          },
        },
        required: ['id', 'name', 'category', 'frequency', 'description', 'subtopics'],
      },
      description: 'Safe abstract derived interest topics with subtopics.',
    },
    relatedConnections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fromTopicId: { type: Type.STRING },
          toTopicId: { type: Type.STRING },
          relationship: { type: Type.STRING },
        },
        required: ['fromTopicId', 'toTopicId'],
      },
      description: 'Inter-topic relationships between safe abstract topics.',
    },
  },
  required: ['topics'],
};
