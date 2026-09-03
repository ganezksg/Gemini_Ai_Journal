import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { JournalSession, JournalMessage, JournalSummary } from '../shared/types';
import {
  getJournalSession,
  getJournalMessages,
  addJournalMessage,
  saveJournalSummary
} from '../services/journalService';
import { sendChatMessage, summarizeJournal } from '../services/apiClient';
import {
  ArrowLeft,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  Loader2,
  CheckCircle2,
  Tag,
  Smile,
  Lightbulb,
  X,
  FileText,
  Feather,
  ChevronDown,
  ChevronUp,
  Bookmark
} from 'lucide-react';

interface JournalScreenProps {
  journalId: string;
  initialPrompt?: string;
  onBack: () => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ journalId, initialPrompt, onBack }) => {
  const { user, getIdToken } = useAuth();
  const [journal, setJournal] = useState<JournalSession | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Keyboard accessibility: Close modal/drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSummaryModal(false);
        setShowSummaryDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [journalDoc, msgDocs] = await Promise.all([
        getJournalSession(user.uid, journalId),
        getJournalMessages(user.uid, journalId),
      ]);

      if (!journalDoc) {
        setError('Journal not found or you do not have permission to view it.');
      } else {
        setJournal(journalDoc);
        setMessages(msgDocs);
      }
    } catch {
      setError('Could not load journal messages. Ensure your connection is stable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, journalId]);

  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const contentToSend = (customContent || inputText).trim();
    if (!user || !contentToSend || sending) return;

    if (contentToSend.length > 4000) {
      setError('Message exceeds the 4,000 character limit. Please shorten your reflection.');
      return;
    }

    setInputText('');
    setSending(true);
    setError(null);

    try {
      // 1. Write user message to Firestore with UID isolation
      const savedUserMsg = await addJournalMessage(
        user.uid,
        journalId,
        'user',
        contentToSend
      );
      setMessages((prev) => [...prev, savedUserMsg]);

      // 2. Fetch fresh Firebase ID Token to prove identity to the backend
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Authentication token could not be obtained. Please sign in again.');
      }

      // 3. Prepare message history for multi-turn Gemini conversation context
      const boundedHistory = messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'model',
        content: m.content.slice(0, 4000),
      }));

      // 4. Call server-side Gemini API proxy
      const aiResponse = await sendChatMessage(idToken, {
        journalId,
        message: contentToSend.slice(0, 4000),
        history: boundedHistory,
      });

      // 5. Write Gemini response to isolated user Firestore collection
      const savedModelMsg = await addJournalMessage(
        user.uid,
        journalId,
        'model',
        aiResponse.message
      );
      setMessages((prev) => [...prev, savedModelMsg]);
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with the Gemini companion. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleGenerateSummary = async () => {
    if (!user || messages.length === 0 || summarizing) return;

    try {
      setSummarizing(true);
      setError(null);

      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error('Authentication required.');
      }

      const formattedMsgs = messages.map((m) => ({
        role: m.role as 'user' | 'model',
        content: m.content,
      }));

      const res = await summarizeJournal(idToken, {
        journalId,
        messages: formattedMsgs,
      });

      if (res.summary) {
        await saveJournalSummary(user.uid, journalId, res.summary);
        setJournal((prev) => (prev ? { ...prev, summary: res.summary, status: 'completed' } : null));
        setShowSummaryDrawer(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate reflection summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const PROMPT_STARTERS = [
    "Something that challenged me today and what I learned...",
    "A feeling or tension I want to understand better...",
    "A small win or moment of gratitude I want to remember..."
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col h-screen overflow-hidden">
      {/* Calm Journal Header */}
      <header className="bg-white border-b border-stone-200 shrink-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="back-to-dashboard-button"
              onClick={onBack}
              aria-label="Back to Journal shelf"
              className="p-2 -ml-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-all duration-200 ease-out"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-medium text-stone-900 text-base line-clamp-1">
                  {journal?.title || 'Reflection Session'}
                </h2>
                {journal?.summary && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3" />
                    Reflection saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Private & Tenant-Isolated Reflection</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {journal?.summary ? (
              <button
                id="view-summary-button"
                onClick={() => setShowSummaryDrawer(!showSummaryDrawer)}
                aria-label="Toggle reflection summary panel"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-all duration-200 ease-out shadow-2xs active:scale-[0.98]"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-800" />
                <span>{showSummaryDrawer ? 'Hide Reflection' : 'View Reflection'}</span>
              </button>
            ) : (
              <button
                id="summarize-journal-button"
                onClick={handleGenerateSummary}
                aria-label="Summarize & Reflect"
                disabled={summarizing || messages.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-medium hover:bg-amber-950 active:bg-black transition-all duration-200 ease-out disabled:opacity-40 shadow-2xs active:scale-[0.98]"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Summarize & Reflect</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Integrated Reflection Panel (Top Drawer when summarized) */}
      {journal?.summary && showSummaryDrawer && (
        <div className="bg-amber-50/50 border-b border-amber-200/70 shrink-0 p-4 sm:p-6 transition-all duration-200 ease-out">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                  Reflection saved
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                  <Smile className="w-3 h-3 text-stone-500" />
                  Emotional tone: {journal.summary.mood}
                </span>
              </div>
              <button
                onClick={() => setShowSummaryDrawer(false)}
                aria-label="Collapse reflection summary"
                className="text-stone-500 hover:text-stone-900 text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {journal.summary.keyThemes.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-stone-700 text-xs font-medium border border-stone-200"
                >
                  <Tag className="w-2.5 h-2.5 text-stone-400" />
                  {t}
                </span>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-amber-200/60 p-4 sm:p-5 shadow-2xs">
              <h4 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                Core Reflection
              </h4>
              <p className="text-sm text-stone-800 leading-relaxed font-normal">
                {journal.summary.summaryText}
              </p>
            </div>

            <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-4 sm:p-5">
              <h4 className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-800" />
                A Thought for Tomorrow
              </h4>
              <p className="text-sm text-amber-950 font-medium italic leading-relaxed">
                "{journal.summary.actionPrompt}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Journal Canvas & Reflection Flow */}
      <div className="flex-1 overflow-y-auto w-full mx-auto px-4 sm:px-6 py-8 space-y-8 max-w-3xl">
        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-900" />
            <p className="text-sm text-stone-500">Opening your private journal...</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="font-serif font-medium text-rose-900 text-base mb-1">
              Could Not Open Journal
            </h3>
            <p className="text-xs text-rose-700 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Feather className="w-6 h-6 text-amber-900" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-stone-900 mb-2">
              What has been on your mind?
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed mb-8">
              Write freely. There is no right or wrong way to journal. Gemini will listen and offer gentle reflections as you write.
            </p>

            {/* Subtle Starter Prompts */}
            <div className="space-y-2.5 text-left">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block text-center mb-1">
                Reflections to explore
              </span>
              {PROMPT_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(starter);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-white border border-stone-200 hover:border-amber-900/40 hover:bg-stone-50 text-xs text-stone-700 transition-all duration-200 ease-out shadow-2xs flex items-center justify-between gap-3 group"
                >
                  <span className="line-clamp-1 italic text-stone-800">"{starter}"</span>
                  <span className="text-[10px] text-amber-900 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
                    Use prompt →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {/* Conversation Unfolding Rhythm */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  id={`reflection-item-${msg.id}`}
                  className="transition-opacity duration-200 ease-out animate-in fade-in"
                >
                  {isUser ? (
                    /* User Journal Entry: Editorial parchment style */
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium px-1">
                        <span className="uppercase tracking-wider font-semibold text-stone-600">
                          My Reflection
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-2xs">
                        <p className="text-base text-stone-900 font-serif leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Gemini Companion Reflection: Thoughtful annotation style */
                    <div className="pl-3 sm:pl-6 border-l-2 border-amber-900/30 space-y-2 my-6">
                      <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                        <span>Gemini reflected</span>
                      </div>
                      <div className="bg-amber-50/40 rounded-2xl border border-amber-200/50 p-4 sm:p-5 shadow-2xs">
                        <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active Gemini Reflection State */}
            {sending && (
              <div className="pl-3 sm:pl-6 border-l-2 border-amber-900/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0 animate-pulse" />
                  <span>✦ Gemini is reflecting...</span>
                </div>
                <div className="bg-amber-50/40 rounded-2xl border border-amber-200/50 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="w-2 h-2 rounded-full bg-amber-800 animate-ping" />
                    <span>Listening and preparing thoughtful perspectives...</span>
                  </div>
                </div>
              </div>
            )}

            {error && messages.length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Journal-Style Composer */}
      <div className="bg-white border-t border-stone-200 p-4 shrink-0 z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2.5">
            <textarea
              id="journal-message-input"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write what's on your mind... (Press Enter to reflect, Shift+Enter for new line)"
              disabled={sending || loading}
              aria-label="Journal reflection entry input"
              className="flex-1 resize-none rounded-xl bg-stone-50 border border-stone-200 p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 disabled:opacity-50 transition-colors"
            />
            <button
              id="send-message-button"
              type="submit"
              disabled={!inputText.trim() || sending || loading}
              aria-label="Send reflection"
              className="h-12 px-5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 font-medium active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-40 flex items-center justify-center gap-1.5 text-xs shadow-xs shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              ) : (
                <>
                  <span>Reflect</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Press Enter to send, Shift+Enter for line break</span>
            <span>{inputText.length} / 4,000 characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

