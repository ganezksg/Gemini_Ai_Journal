import React from 'react';
import {
  Plus,
  BookOpen,
  Sparkles,
  Clock,
  ChevronRight,
  Smile,
  Tag,
  CheckCircle2,
  Trash2,
  Loader2,
  TreePine,
  ArrowRight,
  Feather
} from 'lucide-react';
import { JournalSession, ReflectionIntelligenceReport } from '../shared/types';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  journals: JournalSession[];
  loading: boolean;
  creating: boolean;
  reflectionReport: ReflectionIntelligenceReport | null;
  onSelectJournal: (journalId: string, prompt?: string) => void;
  onStartNewJournal: (initialTitle?: string, initialPrompt?: string) => void;
  onDeleteJournal: (e: React.MouseEvent, id: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'journal' | 'summarize' | 'topics-tree' | 'insights' | 'settings') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  journals,
  loading,
  creating,
  reflectionReport,
  onSelectJournal,
  onStartNewJournal,
  onDeleteJournal,
  onNavigateToTab,
}) => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const completedCount = journals.filter((j) => j.summary).length;
  const uniqueThemes = Array.from(
    new Set(journals.flatMap((j) => j.summary?.keyThemes || []))
  );

  const starterPrompts = [
    "What brought me a quiet moment of clarity today?",
    "Something that felt challenging, and how I handled it...",
    "A person, conversation, or memory I'm grateful for right now...",
  ];

  return (
    <div className="space-y-8">
      {/* 1. Hero Welcoming Banner */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative botanical background curve */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#F4EFE6] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5C826B]" />
              <span className="text-[11px] font-semibold text-[#4A6B56] uppercase tracking-wider">
                {getGreeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1E2922] tracking-tight">
              What would you like to reflect on today?
            </h2>
            <p className="text-xs sm:text-sm text-[#6C7B71] leading-relaxed font-normal">
              A private, botanical space to untangle your thoughts, gain thoughtful Gemini perspectives, and see your reflection landscape bloom over time.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => onNavigateToTab('topics-tree')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F6F3EE] hover:bg-[#EFEAE2] active:bg-[#E5DFD4] text-[#2A3930] font-medium transition-all text-xs border border-[#E5DFD5] shadow-2xs active:scale-[0.98]"
            >
              <TreePine className="w-4 h-4 text-[#4A6B56]" />
              <span>Explore Topics Tree</span>
            </button>

            <button
              onClick={() => onStartNewJournal()}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] active:bg-[#16251D] text-white font-medium transition-all text-xs shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C8DEC0]" />
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
        </div>
      </div>

      {/* 2. Compact Overview Statistics */}
      {!loading && journals.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-[#ECE6DC] p-4 shadow-2xs">
            <span className="text-[11px] font-medium text-[#7C8B81] uppercase tracking-wider block mb-1">
              Total Journals
            </span>
            <span className="text-xl sm:text-2xl font-serif font-semibold text-[#1E2922]">
              {journals.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#ECE6DC] p-4 shadow-2xs">
            <span className="text-[11px] font-medium text-[#7C8B81] uppercase tracking-wider block mb-1">
              Synthesized Summaries
            </span>
            <span className="text-xl sm:text-2xl font-serif font-semibold text-[#1E2922]">
              {completedCount}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#ECE6DC] p-4 shadow-2xs">
            <span className="text-[11px] font-medium text-[#7C8B81] uppercase tracking-wider block mb-1">
              Recurring Themes
            </span>
            <span className="text-xl sm:text-2xl font-serif font-semibold text-[#4A6B56]">
              {uniqueThemes.length || (reflectionReport?.dominantThemes.length || 0)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Reflection Intelligence Callout */}
      {reflectionReport && reflectionReport.dominantThemes.length > 0 && (
        <div className="bg-[#FAF6F0] rounded-3xl border border-[#E9E1D4] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B4833]">
                <Sparkles className="w-3.5 h-3.5 text-[#A67E48]" />
                <span>Reflection Intelligence insight</span>
              </div>
              <p className="text-xs text-[#524434] leading-relaxed italic font-serif text-sm">
                "{reflectionReport.dominantThemes[0].theme}" appears frequently in your reflections.
              </p>
              <p className="text-xs text-[#70614E] leading-relaxed">
                {reflectionReport.dominantThemes[0].insight}
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('insights')}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-[#443627] bg-white border border-[#E2D8C7] px-3.5 py-2 rounded-2xl hover:bg-[#F4ECE0] transition-colors shadow-2xs"
            >
              <span>View Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Starter Prompts to Spark Thought */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-[#708075] uppercase tracking-wider block px-1">
          Inspirations for your pen
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onStartNewJournal(undefined, prompt)}
              className="text-left p-4 rounded-2xl bg-white hover:bg-[#F9F7F3] border border-[#ECE6DC] hover:border-[#D5CDC1] transition-all shadow-2xs flex flex-col justify-between group active:scale-[0.98]"
            >
              <p className="text-xs text-[#303E35] font-medium leading-relaxed mb-3">
                "{prompt}"
              </p>
              <span className="text-[11px] font-semibold text-[#4A6B56] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                <span>Write about this</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Recent Reflections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-serif font-medium text-[#1E2922]">
              Recent Reflections
            </h3>
            <p className="text-xs text-[#7A8A7F]">Your recent journal sessions</p>
          </div>
          <button
            onClick={() => onNavigateToTab('journal')}
            className="text-xs font-medium text-[#4A6B56] hover:text-[#233B2C] transition-colors inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#ECE6DC]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#4A6B56]" />
            <p className="text-xs text-[#7A8A7F]">Opening your reflections...</p>
          </div>
        ) : journals.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-[#DCD6CB] p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] text-[#4A6B56] flex items-center justify-center mx-auto mb-3">
              <Feather className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-medium text-[#1E2922] text-base mb-1">
              Your reflection space is waiting.
            </h4>
            <p className="text-xs text-[#6C7B71] max-w-sm mx-auto mb-4">
              Write whatever comes to mind. There are no expectations or judgments here.
            </p>
            <button
              onClick={() => onStartNewJournal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] text-white text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Begin a journal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journals.slice(0, 4).map((j) => (
              <div
                key={j.id}
                onClick={() => onSelectJournal(j.id)}
                className="group bg-white rounded-3xl border border-[#ECE6DC] p-5 hover:border-[#CAD7CF] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-medium text-[#1E2922] group-hover:text-[#324C3D] transition-colors line-clamp-1 text-base">
                        {j.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {j.summary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2F523A] text-[10px] font-medium border border-[#D5E4D8]">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#4A6B56]" />
                            <span>Summarized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5F2ED] text-[#6D7D72] text-[10px] font-medium">
                            Reflecting
                          </span>
                        )}
                        {j.summary?.mood && (
                          <span className="text-[11px] text-[#7A8A7F]">
                            • {j.summary.mood}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => onDeleteJournal(e, j.id)}
                      className="text-[#B5BFB7] hover:text-rose-600 p-1 rounded-lg hover:bg-[#F9F7F3] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete reflection"
                      aria-label={`Delete ${j.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Theme tags */}
                  {j.summary?.keyThemes && j.summary.keyThemes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                      {j.summary.keyThemes.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F6F3EE] text-[#415147] text-[10px] font-medium"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#86968C]" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Snippet */}
                  <p className="text-xs text-[#5C6E63] line-clamp-2 leading-relaxed my-2 font-normal">
                    {j.summary?.summaryText || j.lastPreview || 'No thoughts recorded in this session yet.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[11px] text-[#86968C]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(j.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#4A6B56] font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                    <span>Open</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
