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
  Bookmark,
  BookOpen
} from 'lucide-react';

interface JournalScreenProps {
  journalId: string;
  initialPrompt?: string;
  onBack: () => void;
  onBrowseAll?: () => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({
  journalId,
  initialPrompt,
  onBack,
  onBrowseAll,
}) => {
  const { user } = useAuth();
  const [journal, setJournal] = useState<JournalSession | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState(() => {
    if (initialPrompt) return initialPrompt;
    try {
      return localStorage.getItem(`emora_draft_${journalId}`) || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore draft when journalId changes (if not overridden by an explicit starter prompt)
  useEffect(() => {
    if (!journalId) return;
    if (initialPrompt) {
      setInputText(initialPrompt);
      return;
    }
    try {
      const savedDraft = localStorage.getItem(`emora_draft_${journalId}`);
      if (savedDraft) {
        setInputText(savedDraft);
      }
    } catch {}
  }, [journalId, initialPrompt]);

  // Persist draft while user writes to prevent accidental loss
  useEffect(() => {
    if (!journalId) return;
    try {
      if (inputText.trim()) {
        localStorage.setItem(`emora_draft_${journalId}`, inputText);
      } else {
        localStorage.removeItem(`emora_draft_${journalId}`);
      }
    } catch {}
  }, [inputText, journalId]);

  // Auto-focus input area as soon as the reflection space is ready
  useEffect(() => {
    if (!loading && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, journalId]);

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
    try {
      localStorage.removeItem(`emora_draft_${journalId}`);
    } catch {}
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

      // 2. Prepare message history for multi-turn Gemini conversation context
      const boundedHistory = messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'model',
        content: m.content.slice(0, 4000),
      }));

      // 3. Call server-side Gemini API proxy (uses unified authenticated client)
      const aiResponse = await sendChatMessage({
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

      const formattedMsgs = messages.map((m) => ({
        role: m.role as 'user' | 'model',
        content: m.content,
      }));

      const res = await summarizeJournal({
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
    <div className="w-full h-full flex-1 bg-[#FAF8F5] text-[#1E2922] flex flex-col overflow-hidden">
      {/* Calm Journal Header - Mobile-Optimized */}
      <header className="bg-white border-b border-[#ECE6DC] shrink-0 z-20 w-full">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              id="back-to-dashboard-button"
              onClick={onBack}
              aria-label="Back to Dashboard"
              className="w-10 h-10 sm:w-9 sm:h-9 min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1 sm:-ml-2 rounded-2xl hover:bg-[#F2ECE4] text-[#637469] hover:text-[#1E2922] transition-all duration-200 ease-out shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-serif font-semibold text-[#1E2922] text-sm sm:text-base truncate leading-tight">
                  {journal?.title || 'Reflection Session'}
                </h2>
                {journal?.summary && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF2EE] text-[#2F523A] text-[10px] font-medium border border-[#D5E4D8] shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-[#4A6B56]" />
                    Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#4A6B56] font-medium truncate mt-0.5">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  <span className="inline sm:hidden">Private & Tenant-Isolated</span>
                  <span className="hidden sm:inline">Private & Tenant-Isolated Reflection</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onBrowseAll && (
              <button
                id="browse-past-reflections-button"
                onClick={onBrowseAll}
                aria-label="View past reflections"
                className="min-h-[44px] min-w-[44px] sm:min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-white border border-[#E5DFD5] text-[#324C3D] text-xs font-medium hover:bg-[#F2ECE4] transition-all duration-200 shadow-2xs active:scale-[0.98]"
                title="View Past Entries"
              >
                <BookOpen className="w-4 h-4 text-[#4A6B56] shrink-0" />
                <span className="hidden sm:inline">Past Entries</span>
              </button>
            )}
            {journal?.summary ? (
              <button
                id="view-summary-button"
                onClick={() => setShowSummaryDrawer(!showSummaryDrawer)}
                aria-label="Toggle reflection summary panel"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-2xl bg-[#FAF6EE] border border-[#EADBBD] text-[#7A5B23] text-xs font-medium hover:bg-[#F3ECCE] transition-all duration-200 ease-out shadow-2xs active:scale-[0.98]"
              >
                <Bookmark className="w-4 h-4 text-[#8B672B] shrink-0" />
                <span className="hidden sm:inline">{showSummaryDrawer ? 'Hide Reflection' : 'View Reflection'}</span>
                <span className="inline sm:hidden">{showSummaryDrawer ? 'Hide' : 'Reflection'}</span>
              </button>
            ) : (
              <button
                id="summarize-journal-button"
                onClick={handleGenerateSummary}
                aria-label="Summarize & Reflect"
                disabled={summarizing || messages.length === 0}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-[#324C3D] text-white text-xs font-medium hover:bg-[#23372B] active:bg-[#16251D] transition-all duration-200 ease-out disabled:opacity-40 shadow-xs active:scale-[0.98]"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C8DEC0] shrink-0" />
                    <span className="hidden xs:inline sm:inline">Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4E8CE] shrink-0" />
                    <span className="hidden sm:inline">Summarize & Reflect</span>
                    <span className="inline sm:hidden">Reflect</span>
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
      <div className="flex-1 overflow-y-auto w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8 max-w-3xl">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#324C3D]" />
            <p className="text-xs sm:text-sm text-[#6C7B71]">Opening your private journal...</p>
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
              className="px-4 py-2 bg-[#324C3D] text-white rounded-xl text-xs font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 sm:py-12 md:py-16 px-4 sm:px-6 max-w-lg mx-auto w-full">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F4EFE6] border border-[#DDD6C9] text-[#324C3D] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-2xs">
              <Feather className="w-5 h-5 sm:w-6 sm:h-6 text-[#324C3D]" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E2922] mb-2 leading-tight px-1 text-balance">
              What has been on your mind?
            </h3>
            <p className="text-xs sm:text-sm text-[#6C7B71] max-w-md mx-auto leading-relaxed mb-6 sm:mb-8">
              Write freely. There is no right or wrong way to journal. Gemini will listen and offer gentle reflections as you write.
            </p>

            {/* Subtle Starter Prompts */}
            <div className="space-y-2.5 text-left w-full">
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#8A9A8F] uppercase tracking-wider block text-center mb-1.5">
                Reflections to explore
              </span>
              {PROMPT_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(starter);
                    textareaRef.current?.focus();
                  }}
                  aria-label={`Use prompt: ${starter}`}
                  className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5DFD5] hover:border-[#324C3D]/50 hover:bg-[#F9F7F3] text-stone-700 transition-all duration-200 ease-out shadow-2xs flex items-center justify-between gap-3 group active:scale-[0.99] min-h-[50px]"
                >
                  <span className="flex-1 min-w-0 line-clamp-2 italic text-[#2F3A33] text-xs sm:text-[13px] leading-snug">
                    "{starter}"
                  </span>
                  <span className="shrink-0 flex items-center gap-0.5 text-[11px] sm:text-xs text-[#324C3D] font-medium group-hover:translate-x-0.5 transition-transform whitespace-nowrap pl-1">
                    <span className="hidden sm:inline">Use prompt</span>
                    <span className="inline sm:hidden">Use</span>
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 pb-4 max-w-full">
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
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#6C7B71] font-medium px-1">
                        <span className="uppercase tracking-wider font-semibold text-[#4A5E50]">
                          My Reflection
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8A9A8F]" />
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 sm:p-5 shadow-2xs">
                        <p className="text-sm sm:text-base text-[#1E2922] font-serif leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Gemini Companion Reflection: Thoughtful annotation style */
                    <div className="pl-2.5 sm:pl-5 border-l-2 border-[#324C3D]/30 space-y-1.5 my-4 sm:my-6">
                      <div className="flex items-center gap-1.5 text-xs text-[#324C3D] font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-[#4A6B56] shrink-0" />
                        <span>Gemini reflected</span>
                      </div>
                      <div className="bg-[#F3EFE8] rounded-2xl border border-[#E3DDD1] p-3.5 sm:p-5 shadow-2xs">
                        <p className="text-xs sm:text-sm text-[#1E2922] leading-relaxed whitespace-pre-wrap break-words">
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
              <div className="pl-2.5 sm:pl-5 border-l-2 border-[#324C3D]/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs text-[#324C3D] font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#4A6B56] shrink-0 animate-pulse" />
                  <span>✦ Gemini is reflecting...</span>
                </div>
                <div className="bg-[#EBF2EE]/70 rounded-2xl border border-[#D5E4D8] p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs text-[#4D5E53]">
                    <span className="w-2 h-2 rounded-full bg-[#324C3D] animate-ping" />
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
      <div className="bg-white border-t border-[#ECE6DC] p-3 sm:p-4 shrink-0 z-10 w-full">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 sm:gap-2.5">
            <textarea
              id="journal-message-input"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write what's on your mind... (Press Enter to reflect)"
              disabled={sending || loading}
              aria-label="Journal reflection entry input"
              className="flex-1 min-w-0 resize-none rounded-xl bg-[#FAF8F5] border border-[#DDD6C9] p-3 sm:p-3.5 text-xs sm:text-sm text-[#1E2922] placeholder-[#8A9A8F] focus:outline-none focus:ring-2 focus:ring-[#324C3D]/20 focus:border-[#324C3D] disabled:opacity-50 transition-colors"
            />
            <button
              id="send-message-button"
              type="submit"
              disabled={!inputText.trim() || sending || loading}
              aria-label="Send reflection"
              className="min-h-[44px] h-[48px] sm:h-12 px-3.5 sm:px-5 rounded-xl bg-[#324C3D] hover:bg-[#23372B] active:bg-[#16251D] text-white font-medium active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-40 flex items-center justify-center gap-1.5 text-xs shadow-xs shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C8DEC0]" />
              ) : (
                <>
                  <span className="inline">Reflect</span>
                  <Send className="w-3.5 h-3.5 text-[#D4E8CE]" />
                </>
              )}
            </button>
          </form>
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-[#7A8A7F] px-1">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for line break</span>
            <span className="inline sm:hidden">Shift+Enter for line break</span>
            <span>{inputText.length} / 4,000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

