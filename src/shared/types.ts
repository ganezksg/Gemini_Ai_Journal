export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
}

export interface JournalSummary {
  summaryText: string;
  keyThemes: string[];
  mood: string;
  actionPrompt: string;
  completedAt: number;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastPreview?: string;
  tags?: string[];
  summary?: JournalSummary;
  status?: 'active' | 'completed';
}

export type MessageRole = 'user' | 'model' | 'system';

export interface JournalMessage {
  id: string;
  journalId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface ChatCompletionRequest {
  journalId: string;
  message: string;
  history?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface ChatCompletionResponse {
  message: string;
  usage?: {
    totalTokens?: number;
  };
}

export interface SummarizeJournalRequest {
  journalId: string;
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}

export interface SummarizeJournalResponse {
  summary: JournalSummary;
}

export interface ReflectionTheme {
  theme: string;
  frequency: number;
  insight: string;
}

export interface ReflectionTrend {
  dimension: string;
  observation: string;
}

export interface ReflectionIntelligenceReport {
  id?: string;
  userId?: string;
  generatedAt: number;
  totalJournalsAnalyzed: number;
  dominantThemes: ReflectionTheme[];
  emotionalTrends: ReflectionTrend[];
  growthPrompts: string[];
  executiveSummary: string;
}

export interface AnalyzeReflectionsRequest {
  journals: Array<{
    title: string;
    createdAt: number;
    summaryText: string;
    mood: string;
    keyThemes: string[];
  }>;
}

export interface AnalyzeReflectionsResponse {
  report: ReflectionIntelligenceReport;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

/**
 * SAFE_INTEREST_MAP_SCHEMA
 * 
 * Privacy-Preserving Abstraction Schema for the Interest Map.
 * 
 * CORE PRIVACY DIRECTIVES:
 * 1. Contains ONLY derived safe topic IDs, safe names, frequencies, broad categories,
 *    generic descriptions, and inter-topic relationships.
 * 2. STRICTLY EXCLUDES: raw journal text, excerpts, quotes, sensitive keywords,
 *    specific medical diagnoses, financial details, intimate/sexual subjects,
 *    and identifiable personal names or PII.
 * 3. Safe topics represent broad thematic patterns suitable for public visualization.
 */
export interface SafeInterestSubtopic {
  id: string;
  name: string;
  frequency: number;
  description: string;
  prompt: string;
}

export interface SafeInterestTopic {
  id: string;
  name: string;
  frequency: number;
  category: string;
  description: string;
  subtopics: SafeInterestSubtopic[];
}

export interface SafeInterestRelationship {
  fromTopicId: string;
  toTopicId: string;
  relationship?: string;
}

export interface SafeInterestMapData {
  topics: SafeInterestTopic[];
  relatedConnections?: SafeInterestRelationship[];
  totalReflectionsAnalyzed: number;
  generatedAt: number;
  privacyAbstractionVersion: string;
}

// Backward-compatible type aliases for existing components
export type InterestSubtopic = SafeInterestSubtopic;
export type InterestTopic = SafeInterestTopic;
export type InterestRelationship = SafeInterestRelationship;
export type InterestMapData = SafeInterestMapData;

export interface ExtractInterestsRequest {
  journals: Array<{
    title: string;
    createdAt: number;
    summaryText: string;
    keyThemes: string[];
    mood?: string;
  }>;
  existingTopicNames?: string[];
}

export interface ExtractInterestsResponse {
  interestMap: SafeInterestMapData;
}
