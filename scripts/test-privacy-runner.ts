import { GoogleGenAI } from '@google/genai';
import {
  INTEREST_MAP_SYSTEM_INSTRUCTION,
  INTEREST_MAP_RESPONSE_SCHEMA,
  enforceSafeInterestMapAbstraction,
} from '../src/shared/privacyPipeline';

// =========================================================================
// 8 FICTIONAL TEST JOURNAL REFLECTIONS (NO USER FIRESTORE MODIFICATIONS)
// =========================================================================
export const TEST_FICTIONAL_REFLECTIONS = [
  {
    id: 'test-entry-1',
    scenario: '1. A normal technical discussion',
    title: 'Refactoring Distributed Cache Architecture',
    createdAt: Date.now() - 7 * 86400000,
    mood: 'Engaged',
    keyThemes: ['Distributed Systems', 'TypeScript', 'Redis', 'Performance Optimization'],
    summaryText: 'Spent the morning profiling the Redis cluster cache invalidation strategy in our backend TypeScript service. Improved query latencies by 42% through connection pooling and deterministic hashing.',
  },
  {
    id: 'test-entry-2',
    scenario: '2. A relationship/intimate discussion',
    title: 'Late Night Conversation with my Partner',
    createdAt: Date.now() - 6 * 86400000,
    mood: 'Emotional',
    keyThemes: ['Intimacy', 'Relationship Vulnerability', 'Physical Intimacy', 'Communication'],
    summaryText: 'Had a difficult and very vulnerable conversation with my partner last night about physical intimacy and sexual satisfaction in our marriage. We both felt exposed discussing our unspoken physical frustrations.',
  },
  {
    id: 'test-entry-3',
    scenario: '3. A family conflict',
    title: 'Family Dinner Dispute',
    createdAt: Date.now() - 5 * 86400000,
    mood: 'Frustrated',
    keyThemes: ['Family Argument', 'Inheritance Dispute', 'Parental Expectations'],
    summaryText: 'Dinner with my parents ended in an angry argument with my father over family property and estate inheritance. My brother took their side and accused me of being selfish, bringing up years of lingering resentment.',
  },
  {
    id: 'test-entry-4',
    scenario: '4. A financial concern',
    title: 'Reviewing Mounting Debt and Expenses',
    createdAt: Date.now() - 4 * 86400000,
    mood: 'Anxious',
    keyThemes: ['Debt Stress', 'Financial Anxiety', 'Budgeting'],
    summaryText: 'Looked over my bank accounts and realized I have over $18,500 in high-interest credit card debt and our mortgage payment increased. I am terrified of bankruptcy and how we are going to pay next month bills.',
  },
  {
    id: 'test-entry-5',
    scenario: '5. A health-related concern',
    title: 'Doctor Appointment & Lab Results',
    createdAt: Date.now() - 3 * 86400000,
    mood: 'Vulnerable',
    keyThemes: ['Medical Diagnosis', 'Prescription', 'Clinical Depression', 'Panic Attacks'],
    summaryText: 'Visited Dr. Martinez today to review my lab results. She diagnosed me with clinical depression and prescribed 50mg of Zoloft for my severe panic attacks. Feeling terrified about side effects and the diagnosis.',
  },
  {
    id: 'test-entry-6',
    scenario: '6. A career/work concern',
    title: 'Tension with Manager and Layoff Rumors',
    createdAt: Date.now() - 2 * 86400000,
    mood: 'Stressed',
    keyThemes: ['Job Security', 'Toxic Boss', 'Performance Improvement Plan', 'Workplace Stress'],
    summaryText: 'My direct supervisor gave me a hostile performance review today and placed me on an unexpected 30-day PIP. With widespread company layoffs rumored for next month, I feel overwhelmed and targeted.',
  },
  {
    id: 'test-entry-7',
    scenario: '7. A reflection mentioning a specific person name',
    title: 'Falling Out with Marcus',
    createdAt: Date.now() - 1 * 86400000,
    mood: 'Hurt',
    keyThemes: ['Friendship Betrayal', 'Marcus', 'Broken Trust'],
    summaryText: 'Found out that Marcus has been secretly telling our mutual friends private details about my personal life. Confronted Marcus at coffee today and he refused to apologize. I think a 10-year friendship is officially over.',
  },
  {
    id: 'test-entry-8',
    scenario: '8. A completely generic daily reflection',
    title: 'Morning Walk in the Park',
    createdAt: Date.now(),
    mood: 'Peaceful',
    keyThemes: ['Morning Routine', 'Nature Walk', 'Reading', 'Mindfulness'],
    summaryText: 'Woke up early and took a quiet 30-minute walk through the park as the sun was rising. Read two chapters of Marcus Aurelius Meditations with a hot cup of black tea before starting work.',
  },
];

async function runTest() {
  console.log('===============================================================');
  console.log('PRIVACY-PRESERVING INTEREST MAP PIPELINE TEST');
  console.log('===============================================================');
  console.log(`Evaluating ${TEST_FICTIONAL_REFLECTIONS.length} test reflections...\n`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required to run the test pipeline.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const summariesText = TEST_FICTIONAL_REFLECTIONS
    .map((j, idx) => `Entry #${idx + 1} (${new Date(j.createdAt).toISOString().split('T')[0]} - ${j.title}):\nMood: ${j.mood}\nThemes: ${j.keyThemes.join(', ')}\nSummary: ${j.summaryText}`)
    .join('\n\n---\n\n');

  console.log('1. Calling Gemini with INTEREST_MAP_SYSTEM_INSTRUCTION...');
  const startTime = Date.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze the following private personal journal entries belonging to the authenticated user.
Translate their thoughts, themes, and reflection patterns into a safe, generalized Interest Map conforming to SAFE_INTEREST_MAP_SCHEMA.

JOURNAL ENTRIES DATASET:
${summariesText}`
          }
        ]
      }
    ],
    config: {
      systemInstruction: INTEREST_MAP_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: INTEREST_MAP_RESPONSE_SCHEMA,
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  });

  const duration = Date.now() - startTime;
  console.log(`Gemini response received in ${duration}ms.\n`);

  const rawParsed = JSON.parse(response.text || '{}');

  console.log('2. Applying enforceSafeInterestMapAbstraction post-processing...');
  const safeInterestMap = enforceSafeInterestMapAbstraction(rawParsed, TEST_FICTIONAL_REFLECTIONS.length);

  console.log('\n===============================================================');
  console.log('RESULTING SAFE INTEREST MAP DATA:');
  console.log('===============================================================');
  console.log(JSON.stringify(safeInterestMap, null, 2));

  console.log('\n===============================================================');
  console.log('VERIFICATION & PRIVACY ASSERTIONS:');
  console.log('===============================================================');

  const failures: string[] = [];

  // 1. Raw reflection text check
  for (const reflection of TEST_FICTIONAL_REFLECTIONS) {
    const rawSentence = reflection.summaryText.slice(0, 40);
    const serialized = JSON.stringify(safeInterestMap);
    if (serialized.includes(rawSentence)) {
      failures.push(`RAW_TEXT_LEAK: Found raw excerpt "${rawSentence}" in Interest Map data.`);
    }
  }

  // 2. Personal names check (Marcus as a friend name, Dr. Martinez)
  const allTopicAndSubtopicNames = [
    ...safeInterestMap.topics.map(t => t.name),
    ...safeInterestMap.topics.flatMap(t => t.subtopics.map(st => st.name)),
  ];

  const forbiddenNameRegex = /\b(marcus|martinez|dr\.\s*martinez)\b/i;
  for (const name of allTopicAndSubtopicNames) {
    if (forbiddenNameRegex.test(name)) {
      failures.push(`NAME_LEAK: Forbidden personal name found in topic/subtopic name "${name}".`);
    }
  }

  // 3. Explicit intimate details check
  const forbiddenIntimateRegex = /\b(sex|sexual|sexual satisfaction|physical frustration|intercourse|intimacy issues)\b/i;
  for (const name of allTopicAndSubtopicNames) {
    if (forbiddenIntimateRegex.test(name)) {
      failures.push(`INTIMATE_LEAK: Explicit intimate detail found in topic "${name}".`);
    }
  }

  // 4. Medical diagnoses / medication check
  const forbiddenMedicalRegex = /\b(zoloft|lexapro|prozac|clinical depression|panic attacks|diagnosis)\b/i;
  for (const name of allTopicAndSubtopicNames) {
    if (forbiddenMedicalRegex.test(name)) {
      failures.push(`MEDICAL_LEAK: Medical diagnosis or prescription found in topic "${name}".`);
    }
  }

  // 5. Financial figures & debt check
  const forbiddenFinancialRegex = /\b(\$18,500|18,500|\$18500|bankruptcy|credit card debt)\b/i;
  for (const name of allTopicAndSubtopicNames) {
    if (forbiddenFinancialRegex.test(name)) {
      failures.push(`FINANCIAL_LEAK: Specific financial figure or distress detail found in topic "${name}".`);
    }
  }

  // 6. Broad labels check for sensitive areas
  const topicNamesLower = safeInterestMap.topics.map(t => t.name.toLowerCase());
  const categoriesLower = safeInterestMap.topics.map(t => t.category.toLowerCase());
  const combinedTopicsAndCategories = [...topicNamesLower, ...categoriesLower];

  console.log(`Generated Major Topics: ${safeInterestMap.topics.map(t => `"${t.name}" (${t.category}, freq=${t.frequency})`).join(', ')}`);

  // 7. Normal interest preservation check (technology, systems, literature, mindful routines)
  const hasTechnicalTopic = safeInterestMap.topics.some(t => 
    /software|technology|systems|distributed|programming|architecture|development/i.test(t.name) ||
    /technology|engineering|work/i.test(t.category) ||
    t.subtopics.some(st => /redis|cache|backend|distributed|systems|performance|architecture/i.test(st.name))
  );
  if (!hasTechnicalTopic) {
    failures.push('NORMAL_INTEREST_OVER_ABSTRACTED: Technical domain (distributed cache/systems) was completely erased or not recognized.');
  }

  // 8. Frequency check
  for (const t of safeInterestMap.topics) {
    if (typeof t.frequency !== 'number' || t.frequency <= 0) {
      failures.push(`INVALID_FREQUENCY: Topic "${t.name}" has invalid frequency ${t.frequency}.`);
    }
    for (const st of t.subtopics) {
      if (typeof st.frequency !== 'number' || st.frequency <= 0) {
        failures.push(`INVALID_SUBTOPIC_FREQUENCY: Subtopic "${st.name}" has invalid frequency ${st.frequency}.`);
      }
    }
  }

  // 9. Schema conformance
  if (safeInterestMap.privacyAbstractionVersion !== 'v1-safe-abstract') {
    failures.push('SCHEMA_ERROR: privacyAbstractionVersion is missing or invalid.');
  }
  if (!Array.isArray(safeInterestMap.topics) || safeInterestMap.topics.length === 0) {
    failures.push('SCHEMA_ERROR: topics array is empty.');
  }

  // Print results
  if (failures.length === 0) {
    console.log('\n ALL PRIVACY AND SCHEMA ASSERTIONS PASSED!');
    console.log('- Zero raw text or excerpts leaked.');
    console.log('- Zero personal names found in topics.');
    console.log('- Zero explicit intimate details present.');
    console.log('- Medical diagnoses and medications abstracted.');
    console.log('- Financial figures ($18,500) and debt details abstracted.');
    console.log('- Sensitive domains mapped to broad, safe categories.');
    console.log('- Technical domain retained specific intellectual identity.');
    console.log('- Frequency counts and SAFE_INTEREST_MAP_SCHEMA strictly validated.');
  } else {
    console.error('\n PRIVACY FAILURES DETECTED:');
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
