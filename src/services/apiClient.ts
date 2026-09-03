import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  SummarizeJournalRequest,
  SummarizeJournalResponse,
  AnalyzeReflectionsRequest,
  AnalyzeReflectionsResponse,
} from '../shared/types';

export async function sendChatMessage(
  idToken: string,
  payload: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to communicate with AI journaling assistant';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function summarizeJournal(
  idToken: string,
  payload: SummarizeJournalRequest
): Promise<SummarizeJournalResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate session summary';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function analyzeReflections(
  idToken: string,
  payload: AnalyzeReflectionsRequest
): Promise<AnalyzeReflectionsResponse> {
  const response = await fetch('/api/reflections/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to synthesize reflection intelligence';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
