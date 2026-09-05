import { auth } from '../lib/firebase';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SummarizeJournalRequest,
  SummarizeJournalResponse,
  AnalyzeReflectionsRequest,
  AnalyzeReflectionsResponse,
  ExtractInterestsRequest,
  ExtractInterestsResponse,
} from '../shared/types';

/**
 * Authoritative helper to obtain a fresh Firebase ID token for the currently authenticated user.
 * 
 * Rules enforced:
 * - Awaits auth.authStateReady() so calls never fire before Firebase Auth initializes.
 * - Validates auth.currentUser is not null.
 * - Retrieves a fresh token using await auth.currentUser.getIdToken() without manual caching.
 * - Never stores tokens in localStorage, sessionStorage, React state, or cookies.
 * - Does not log token strings or sensitive contents.
 */
export async function getFreshIdToken(): Promise<string> {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required. Please sign in to continue.');
  }

  const token = await currentUser.getIdToken();
  if (!token) {
    throw new Error('Unable to retrieve authentication credentials. Please sign in again.');
  }

  return token;
}

/**
 * Universal authenticated API request helper.
 * All authenticated /api/* calls must pass through this single pipeline.
 */
export async function authenticatedApiRequest<TResponse>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    fallbackErrorMessage?: string;
  } = {}
): Promise<TResponse> {
  const freshToken = await getFreshIdToken();

  const response = await fetch(endpoint, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freshToken}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMsg = options.fallbackErrorMessage || 'Request failed';
    try {
      const errJson = await response.json();
      if (errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Send a chat message for multi-turn Gemini journaling.
 * Supports calling as sendChatMessage(payload) or legacy sendChatMessage(token, payload).
 */
export async function sendChatMessage(
  payloadOrToken: string | ChatCompletionRequest,
  maybePayload?: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const payload = (typeof payloadOrToken === 'string' ? maybePayload : payloadOrToken) as ChatCompletionRequest;
  return authenticatedApiRequest<ChatCompletionResponse>('/api/chat', {
    method: 'POST',
    body: payload,
    fallbackErrorMessage: 'Failed to communicate with AI journaling assistant',
  });
}

/**
 * Generate a structured journal session summary.
 * Supports calling as summarizeJournal(payload) or legacy summarizeJournal(token, payload).
 */
export async function summarizeJournal(
  payloadOrToken: string | SummarizeJournalRequest,
  maybePayload?: SummarizeJournalRequest
): Promise<SummarizeJournalResponse> {
  const payload = (typeof payloadOrToken === 'string' ? maybePayload : payloadOrToken) as SummarizeJournalRequest;
  return authenticatedApiRequest<SummarizeJournalResponse>('/api/summarize', {
    method: 'POST',
    body: payload,
    fallbackErrorMessage: 'Failed to generate session summary',
  });
}

/**
 * Synthesize Personal Reflection Intelligence from longitudinal journal summaries.
 * Supports calling as analyzeReflections(payload) or legacy analyzeReflections(token, payload).
 */
export async function analyzeReflections(
  payloadOrToken: string | AnalyzeReflectionsRequest,
  maybePayload?: AnalyzeReflectionsRequest
): Promise<AnalyzeReflectionsResponse> {
  const payload = (typeof payloadOrToken === 'string' ? maybePayload : payloadOrToken) as AnalyzeReflectionsRequest;
  return authenticatedApiRequest<AnalyzeReflectionsResponse>('/api/reflections/analyze', {
    method: 'POST',
    body: payload,
    fallbackErrorMessage: 'Failed to synthesize reflection intelligence',
  });
}

/**
 * Extract Privacy-Safe Interest Map Topics from reflections.
 * Supports calling as extractInterests(payload) or legacy extractInterests(token, payload).
 */
export async function extractInterests(
  payloadOrToken: string | ExtractInterestsRequest,
  maybePayload?: ExtractInterestsRequest
): Promise<ExtractInterestsResponse> {
  const payload = (typeof payloadOrToken === 'string' ? maybePayload : payloadOrToken) as ExtractInterestsRequest;
  return authenticatedApiRequest<ExtractInterestsResponse>('/api/interests/extract', {
    method: 'POST',
    body: payload,
    fallbackErrorMessage: 'Failed to extract interests from reflections',
  });
}

