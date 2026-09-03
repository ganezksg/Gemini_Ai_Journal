import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { JournalSession, ReflectionIntelligenceReport } from '../shared/types';
import {
  getUserJournals,
  createJournalSession,
  deleteJournalSession,
  getLatestReflectionReport,
  saveReflectionReport
} from '../services/journalService';
import { analyzeReflections } from '../services/apiClient';
import {
  Plus,
  BookOpen,
  LogOut,
  Trash2,
  Sparkles,
  Clock,
  ChevronRight,
  Smile,
  Tag,
  CheckCircle2,
  BrainCircuit,
  TrendingUp,
  Compass,
  Lightbulb,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Feather,
  ArrowRight,
  Bookmark,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onSelectJournal: (journalId: string, prompt?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectJournal }) => {
  const { user, signOut, getIdToken } = useAuth();
  const [journals, setJournals] = useState<JournalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'journals' | 'intelligence'>('journals');
  
  // Reflection Intelligence state
  const [reflectionReport, setReflectionReport] = useState<ReflectionIntelligenceReport | null>(null);
  const [analyzingReflections, setAnalyzingReflections] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [list, report] = await Promise.all([
        getUserJournals(user.uid),
        getLatestReflectionReport(user.uid)
      ]);
      setJournals(list);
      if (report) {
        setReflectionReport(report);
      }
    } catch {
      setError('Could not load your reflections. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStartNewJournal = async (initialTitle?: string, initialPrompt?: string) => {
    if (!user || creating) return;
    try {
      setCreating(true);
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const title = initialTitle || `Reflection — ${dateStr}`;
      const newSession = await createJournalSession(user.uid, title);
      onSelectJournal(newSession.id, initialPrompt);
    } catch {
      setError('Failed to start a new journal entry.');
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;

    try {
      await deleteJournalSession(user.uid, id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch {
      setError('Failed to delete reflection.');
    }
  };

  const handleRunReflectionIntelligence = async () => {
    if (!user || analyzingReflections) return;

    // Filter to journals that have summaries or entries
    const summarizedJournals = journals
      .filter((j) => j.summary || j.lastPreview)
      .map((j) => ({
        title: j.title,
        createdAt: j.createdAt,
        summaryText: j.summary?.summaryText || j.lastPreview || '',
        mood: j.summary?.mood || 'Reflective',
        keyThemes: j.summary?.keyThemes || j.tags || ['Journaling'],
      }))
      .filter((j) => j.summaryText.length > 0);

    if (summarizedJournals.length === 0) {
      setReflectionError('You need at least one journal entry with thoughts recorded before synthesizing patterns.');
      return;
    }

    try {
      setAnalyzingReflections(true);
      setReflectionError(null);

      const idToken = await getIdToken();
      if (!idToken) throw new Error('Authentication required.');

      const response = await analyzeReflections(idToken, {
        journals: summarizedJournals,
      });

      if (response.report) {
        await saveReflectionReport(user.uid, response.report);
        setReflectionReport(response.report);
      }
    } catch (err: any) {
      setReflectionError(err?.message || 'Failed to synthesize reflection intelligence.');
    } finally {
      setAnalyzingReflections(false);
    }
  };

  const completedCount = journals.filter((j) => j.summary).length;
  const uniqueThemes = Array.from(
    new Set(
      journals.flatMap((j) => j.summary?.keyThemes || [])
    )
  );

  const maxThemeFreq = reflectionReport?.dominantThemes?.length
    ? Math.max(...reflectionReport.dominantThemes.map((t) => t.frequency || 1), 1)
    : 1;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Calm Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-900/10 border border-amber-900/20 flex items-center justify-center text-amber-900">
              <Feather className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-medium text-stone-900 text-base">
                Personal Gemini Journal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Privacy indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Private journal</span>
            </div>

            <button
              id="sign-out-button"
              onClick={() => signOut()}
              aria-label="Sign out of journal"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all duration-200 active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Home Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Calm Greeting & Primary Action */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block">
              {getGreeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 tracking-tight">
              What would you like to reflect on today?
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed font-normal">
              A private space to write your thoughts, gain thoughtful Gemini perspectives, and understand your personal growth.
            </p>
          </div>

          <button
            id="start-new-journal-button"
            onClick={() => handleStartNewJournal()}
            disabled={creating}
            aria-label="Start a new journal reflection"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-900 hover:bg-amber-950 active:bg-black text-amber-50 font-medium transition-all duration-200 ease-out disabled:opacity-50 text-sm shadow-2xs active:scale-[0.98]"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Opening canvas...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Start a new journal</span>
              </>
            )}
          </button>
        </div>

        {/* Subtle Reflection Journey Overview (Actual Firestore Data) */}
        {!loading && journals.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
                Total Journals
              </span>
              <span className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
                {journals.length}
              </span>
            </div>
            <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
                Saved Reflections
              </span>
              <span className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
                {completedCount}
              </span>
            </div>
            <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-2xs text-center sm:text-left">
              <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1">
                Recurring Themes
              </span>
              <span className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
                {uniqueThemes.length || (reflectionReport?.dominantThemes.length || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Minimalist) */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-1">
          <button
            id="tab-my-journals-button"
            onClick={() => setActiveTab('journals')}
            aria-label="View recent reflections"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              activeTab === 'journals'
                ? 'bg-stone-900 text-stone-50 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Recent Reflections</span>
            <span className="ml-1 px-1.5 py-0.2 bg-stone-700/40 rounded-full text-[10px]">
              {journals.length}
            </span>
          </button>

          <button
            id="tab-reflection-intelligence-button"
            onClick={() => setActiveTab('intelligence')}
            aria-label="View Reflection Intelligence patterns"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              activeTab === 'intelligence'
                ? 'bg-amber-900 text-amber-50 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Reflection Intelligence</span>
            {reflectionReport && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* TAB 1: RECENT REFLECTIONS & INTELLIGENCE ENTRY POINT */}
        {activeTab === 'journals' && (
          <div className="space-y-8">
            {/* Reflection Intelligence Teaser / Entry Point */}
            <div className="bg-amber-50/50 rounded-2xl border border-amber-200/70 p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    <span>Your reflection patterns</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    As you journal over time, Gemini can help surface recurring themes, subtle shifts in emotional tone, and growth questions across your reflections.
                  </p>
                  {reflectionReport && reflectionReport.dominantThemes.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2 text-xs text-stone-700">
                      <span className="italic text-stone-800 font-serif">
                        "{reflectionReport.dominantThemes[0].theme} appears frequently in your reflections."
                      </span>
                    </div>
                  )}
                </div>

                <button
                  id="explore-intelligence-cta"
                  onClick={() => setActiveTab('intelligence')}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 hover:text-amber-950 bg-white border border-amber-200/80 px-3.5 py-2 rounded-xl hover:bg-amber-50/80 transition-all duration-200 ease-out shadow-2xs"
                >
                  <span>Explore Reflection Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Reflections List */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-base font-serif font-medium text-stone-900">
                  Recent reflections
                </h3>
                <span className="text-xs text-stone-400">
                  {journals.length} {journals.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-900" />
                  <p className="text-xs text-stone-500">Opening your private journals...</p>
                </div>
              ) : journals.length === 0 ? (
                /* Welcoming Empty State */
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-6 sm:p-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                    <Feather className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-medium text-stone-900 text-lg mb-1">
                    Your reflection space is empty.
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
                    Start with whatever is on your mind. There is no right or wrong way to journal.
                  </p>

                  <button
                    id="empty-state-start-journal-button"
                    onClick={() => handleStartNewJournal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-medium hover:bg-amber-950 transition-all duration-200 shadow-2xs active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Begin your first journal
                  </button>

                  <div className="mt-8 pt-6 border-t border-stone-100 max-w-md mx-auto space-y-2">
                    <span className="text-[11px] text-stone-400 block mb-2 font-medium uppercase tracking-wider">
                      Ideas to begin with:
                    </span>
                    <button
                      onClick={() => handleStartNewJournal("Something I'm looking forward to...")}
                      className="w-full text-left p-2.5 rounded-lg bg-stone-50 hover:bg-amber-50/50 text-xs text-stone-600 transition-colors border border-stone-200/60"
                    >
                      "Something I'm looking forward to..."
                    </button>
                    <button
                      onClick={() => handleStartNewJournal("Something that challenged me today...")}
                      className="w-full text-left p-2.5 rounded-lg bg-stone-50 hover:bg-amber-50/50 text-xs text-stone-600 transition-colors border border-stone-200/60"
                    >
                      "Something that challenged me today..."
                    </button>
                    <button
                      onClick={() => handleStartNewJournal("A small moment from today I want to remember...")}
                      className="w-full text-left p-2.5 rounded-lg bg-stone-50 hover:bg-amber-50/50 text-xs text-stone-600 transition-colors border border-stone-200/60"
                    >
                      "A small moment from today I want to remember..."
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {journals.map((j) => (
                    <div
                      key={j.id}
                      id={`journal-card-${j.id}`}
                      onClick={() => onSelectJournal(j.id)}
                      className="group bg-white rounded-2xl border border-stone-200 p-5 hover:border-amber-900/40 hover:shadow-2xs transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Title & Status */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="space-y-1">
                            <h4 className="font-serif font-medium text-stone-900 group-hover:text-amber-950 transition-colors line-clamp-1 text-base">
                              {j.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {j.summary ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200/60">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Reflection saved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                                  Reflecting
                                </span>
                              )}
                              {j.summary?.mood && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                                  • {j.summary.mood}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            id={`delete-journal-${j.id}`}
                            onClick={(e) => handleDelete(e, j.id)}
                            aria-label={`Delete reflection ${j.title}`}
                            className="text-stone-300 hover:text-rose-600 p-1 rounded-lg hover:bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Theme Tags */}
                        {j.summary?.keyThemes && j.summary.keyThemes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 my-3">
                            {j.summary.keyThemes.slice(0, 3).map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium"
                              >
                                <Tag className="w-2.5 h-2.5 text-stone-400" />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Excerpt */}
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed my-3 font-normal">
                          {j.summary?.summaryText || j.lastPreview || 'No thoughts recorded in this session yet.'}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>
                            {new Date(j.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-900 font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                          <span>Open reflection</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL REFLECTION INTELLIGENCE */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            {/* Elegant Header */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-800" />
                    <span>Reflection Intelligence</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>🔒 Based only on your private reflections</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
                  Reflection Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                  What your reflections may be showing you over time. Exploratory observations derived purely from your private journal history.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="generate-reflection-intelligence-button"
                  onClick={handleRunReflectionIntelligence}
                  disabled={analyzingReflections || journals.length === 0}
                  aria-label="Synthesize reflection patterns"
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-900 text-amber-50 font-medium hover:bg-amber-950 active:bg-black transition-all duration-200 ease-out disabled:opacity-50 text-xs shadow-2xs active:scale-[0.98]"
                >
                  {analyzingReflections ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Looking across your reflections...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{reflectionReport ? 'Update Patterns' : 'Synthesize Patterns'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In-Flight Gemini Breathing State */}
            {analyzingReflections && (
              <div className="p-8 bg-white rounded-2xl border border-amber-200/70 text-center space-y-3 shadow-2xs animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-amber-800 animate-spin" />
                </div>
                <h4 className="font-serif text-base font-medium text-stone-900">
                  Looking across your reflections...
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Synthesizing recurring themes and subtle shifts in perspective safely across your private journal history.
                </p>
              </div>
            )}

            {/* Error Message */}
            {reflectionError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{reflectionError}</span>
              </div>
            )}

            {/* Insufficient Data State */}
            {!reflectionReport && !analyzingReflections && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-medium text-stone-800 text-lg mb-2">
                  Your reflection history is just beginning.
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto mb-6 leading-relaxed">
                  As you complete more journals, Reflection Intelligence can surface recurring themes and changes across your reflections.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="insufficient-data-start-journal-button"
                    onClick={() => handleStartNewJournal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-medium hover:bg-amber-950 transition-all duration-200 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start a journal</span>
                  </button>

                  {journals.length > 0 && (
                    <button
                      id="empty-state-synthesize-button"
                      onClick={handleRunReflectionIntelligence}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                      <span>Synthesize with current entries</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Full Report View */}
            {reflectionReport && !analyzingReflections && (
              <div className="space-y-6">
                {/* SECTION 1 — REFLECTION OVERVIEW */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-7 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-900" />
                      <h4 className="font-serif text-base font-medium text-stone-900">
                        Reflection Overview
                      </h4>
                    </div>
                    <span className="text-[11px] text-stone-400">
                      Analyzed {reflectionReport.totalJournalsAnalyzed} {reflectionReport.totalJournalsAnalyzed === 1 ? 'reflection' : 'reflections'} • Generated recently
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed font-normal">
                    {reflectionReport.executiveSummary}
                  </p>
                </div>

                {/* Grid for Themes and Emotional Trajectory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SECTION 2 — RECURRING THEMES */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-serif text-base font-medium text-stone-900 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-amber-800" />
                          Recurring Themes
                        </h4>
                        <span className="text-[11px] text-stone-400">Relative frequency</span>
                      </div>

                      {reflectionReport.dominantThemes && reflectionReport.dominantThemes.length > 0 ? (
                        <div className="space-y-4">
                          {reflectionReport.dominantThemes.map((item, idx) => {
                            const barPercent = Math.max(
                              12,
                              Math.round((item.frequency / maxThemeFreq) * 100)
                            );
                            return (
                              <div key={idx} className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/70">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-medium text-xs text-stone-900 uppercase tracking-wider">
                                    {item.theme}
                                  </span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100/80 text-amber-900 rounded-full">
                                    {item.frequency} {item.frequency === 1 ? 'reflection' : 'reflections'}
                                  </span>
                                </div>
                                
                                {/* Restrained Proportional Bar Indicator */}
                                <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden mb-2">
                                  <div
                                    className="bg-amber-900 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${barPercent}%` }}
                                  />
                                </div>

                                <p className="text-xs text-stone-600 leading-relaxed">
                                  "{item.insight}"
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 py-6 text-center italic">
                          Keep journaling. Patterns become more meaningful as your reflection history grows.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 3 — EMOTIONAL TRAJECTORY */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-serif text-base font-medium text-stone-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-800" />
                          Emotional Trajectory
                        </h4>
                        <span className="text-[11px] text-stone-400">Qualitative movement</span>
                      </div>

                      {reflectionReport.emotionalTrends && reflectionReport.emotionalTrends.length > 0 ? (
                        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200 pl-7">
                          {reflectionReport.emotionalTrends.map((trend, idx) => (
                            <div key={idx} className="relative p-3 bg-stone-50/80 rounded-xl border border-stone-200/70">
                              {/* Dot indicator on timeline */}
                              <div className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full bg-amber-800 border-2 border-white shadow-2xs" />
                              <span className="font-medium text-xs text-stone-900 block mb-1">
                                {trend.dimension}
                              </span>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                {trend.observation}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 py-6 text-center italic">
                          Your emotional trajectory will emerge naturally as you record more sessions.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span>• Exploratory trajectory based on journal mood markers</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 4 — A PATTERN TO CONSIDER */}
                {reflectionReport.dominantThemes && reflectionReport.dominantThemes.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50/50 to-stone-50 border border-amber-200/70 rounded-2xl p-6 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-900" />
                      <h4 className="font-serif text-base font-medium text-amber-950">
                        A Pattern to Consider
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-stone-900">
                        "{reflectionReport.dominantThemes[0].theme}" appears frequently in your reflections.
                      </p>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        {reflectionReport.dominantThemes[0].insight} One possibility worth exploring is whether this recurring thread highlights an area where establishing clearer intentions or boundaries could bring greater ease.
                      </p>
                    </div>
                  </div>
                )}

                {/* SECTION 5 — QUESTIONS FOR YOUR NEXT REFLECTION */}
                {reflectionReport.growthPrompts && reflectionReport.growthPrompts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Feather className="w-4 h-4 text-amber-900" />
                        <h4 className="font-serif text-base font-medium text-stone-900">
                          Questions for Your Next Reflection
                        </h4>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Click any prompt to start a journal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {reflectionReport.growthPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          id={`reflection-prompt-card-${idx}`}
                          onClick={() => handleStartNewJournal(undefined, prompt)}
                          aria-label={`Start new reflection with prompt: ${prompt}`}
                          className="group text-left p-4 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/70 hover:border-amber-900/40 transition-all duration-200 shadow-2xs flex flex-col justify-between"
                        >
                          <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed italic mb-3">
                            "{prompt}"
                          </p>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-900 group-hover:translate-x-0.5 transition-transform">
                            <span>Reflect on this</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

