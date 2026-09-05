import React from 'react';
import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Tag,
  Lightbulb,
  Feather,
  ArrowRight,
  Compass,
  AlertCircle,
  Plus
} from 'lucide-react';
import { JournalSession, ReflectionIntelligenceReport } from '../shared/types';

interface ReflectionInsightsViewProps {
  journals: JournalSession[];
  report: ReflectionIntelligenceReport | null;
  analyzing: boolean;
  error: string | null;
  onRunAnalysis: () => void;
  onStartJournalWithPrompt: (prompt: string) => void;
  onStartNewJournal: () => void;
}

export const ReflectionInsightsView: React.FC<ReflectionInsightsViewProps> = ({
  journals,
  report,
  analyzing,
  error,
  onRunAnalysis,
  onStartJournalWithPrompt,
  onStartNewJournal,
}) => {
  const maxThemeFreq = report?.dominantThemes?.length
    ? Math.max(...report.dominantThemes.map((t) => t.frequency || 1), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E79A5] bg-[#F4EEF8] px-2.5 py-0.5 rounded-full border border-[#E3D6EB]">
                <BrainCircuit className="w-3.5 h-3.5 text-[#8E79A5]" />
                <span>Reflection Intelligence</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#30533C] bg-[#EBF2EE] px-2.5 py-0.5 rounded-full border border-[#D5E3D8]">
                <ShieldCheck className="w-3 h-3 text-[#4A6B56]" />
                <span>Derived purely from your private entries</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[#1E2922] tracking-tight">
              Personal Reflection Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-[#6C7B71] leading-relaxed">
              What your reflections reveal over time. Exploratory observations, subtle shifts in emotional tone, and growth questions synthesized across your private journal history.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={onRunAnalysis}
              disabled={analyzing || journals.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] active:bg-[#16251D] text-white text-xs font-medium transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8DEC0]" />
                  <span>Looking across reflections...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#D4E8CE]" />
                  <span>{report ? 'Update Intelligence' : 'Synthesize Intelligence'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Analyzing Pulse State */}
      {analyzing && (
        <div className="p-10 bg-white rounded-3xl border border-[#E9E3D8] text-center space-y-3 shadow-xs animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-[#F4EEF8] text-[#8E79A5] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="font-serif text-lg font-medium text-[#1E2922]">
            Connecting the threads of your reflections...
          </h4>
          <p className="text-xs text-[#6C7B71] max-w-md mx-auto leading-relaxed">
            Gemini is gently synthesizing recurring themes, emotional nuances, and growth observations across your entries.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!report && !analyzing && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#DCD6CB] p-8 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-[#F4EEF8] text-[#8E79A5] flex items-center justify-center mx-auto mb-4 border border-[#E5D8EE]">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <h4 className="font-serif font-medium text-[#1E2922] text-xl mb-2">
            Your reflection intelligence will appear here.
          </h4>
          <p className="text-xs sm:text-sm text-[#6C7B71] max-w-md mx-auto mb-6 leading-relaxed">
            As you write and complete reflections, Gemini synthesizes longitudinal patterns, recurring themes, and customized growth questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStartNewJournal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#324C3D] text-white text-xs font-medium hover:bg-[#23372B] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start a reflection</span>
            </button>

            {journals.length > 0 && (
              <button
                onClick={onRunAnalysis}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F6F3EE] hover:bg-[#ECE7DE] text-[#2C3B32] text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8E79A5]" />
                <span>Synthesize with current {journals.length} entries</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full Intelligence Report */}
      {report && !analyzing && (
        <div className="space-y-6">
          {/* SECTION 1: Narrative Executive Overview */}
          <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2EDE5] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#4A6B56]" />
                <h3 className="font-serif text-lg font-medium text-[#1E2922]">
                  Reflection Overview
                </h3>
              </div>
              <span className="text-[11px] text-[#7E8D83]">
                Analyzed {report.totalJournalsAnalyzed} {report.totalJournalsAnalyzed === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#38483F] leading-relaxed font-normal">
              {report.executiveSummary}
            </p>
          </div>

          {/* Grid: Recurring Themes & Emotional Trajectory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recurring Themes */}
            <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2EDE5] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#4A6B56]" />
                  <h3 className="font-serif text-base font-medium text-[#1E2922]">
                    Recurring Themes
                  </h3>
                </div>
                <span className="text-[11px] text-[#7E8D83]">Relative frequency</span>
              </div>

              <div className="space-y-3.5">
                {report.dominantThemes.map((item, idx) => {
                  const barPercent = Math.max(15, Math.round((item.frequency / maxThemeFreq) * 100));
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#EAE3D6] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-[#1E2922] uppercase tracking-wider">
                          {item.theme}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#EBF2EE] text-[#355541] rounded-full">
                          {item.frequency} {item.frequency === 1 ? 'reflection' : 'reflections'}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-[#E8E1D5] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4A6B56] h-full rounded-full transition-all duration-300"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>

                      <p className="text-xs text-[#5D6F64] leading-relaxed">
                        "{item.insight}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Emotional Trajectory */}
            <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2EDE5] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8E79A5]" />
                  <h3 className="font-serif text-base font-medium text-[#1E2922]">
                    Emotional Trajectory
                  </h3>
                </div>
                <span className="text-[11px] text-[#7E8D83]">Qualitative movement</span>
              </div>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#EAE3D6] pl-7">
                {report.emotionalTrends.map((trend, idx) => (
                  <div key={idx} className="relative p-3.5 bg-[#FAF8F4] rounded-2xl border border-[#EAE3D6]">
                    <div className="absolute -left-[22px] top-4 w-2.5 h-2.5 rounded-full bg-[#8E79A5] border-2 border-white shadow-2xs" />
                    <span className="font-medium text-xs text-[#1E2922] block mb-1">
                      {trend.dimension}
                    </span>
                    <p className="text-xs text-[#5D6F64] leading-relaxed">
                      {trend.observation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spotlight: A Pattern to Consider */}
          {report.dominantThemes.length > 0 && (
            <div className="bg-[#FAF5EC] border border-[#EADBBD] rounded-3xl p-6 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#8B672B]" />
                <h4 className="font-serif text-base font-medium text-[#372A17]">
                  A Pattern to Consider
                </h4>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#292015]">
                "{report.dominantThemes[0].theme}" is a central pillar in your thoughts.
              </p>
              <p className="text-xs sm:text-sm text-[#665742] leading-relaxed">
                {report.dominantThemes[0].insight} Consider whether this recurring thread reveals where dedicating clearer attention or gentle boundaries could bring greater balance.
              </p>
            </div>
          )}

          {/* Growth Prompts */}
          {report.growthPrompts && report.growthPrompts.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2EDE5] pb-3">
                <div className="flex items-center gap-2">
                  <Feather className="w-4 h-4 text-[#4A6B56]" />
                  <h3 className="font-serif text-base font-medium text-[#1E2922]">
                    Questions for Your Next Reflection
                  </h3>
                </div>
                <span className="text-[11px] text-[#7E8D83]">Click any prompt to write</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {report.growthPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onStartJournalWithPrompt(prompt)}
                    className="group text-left p-4 rounded-2xl bg-[#FAF8F4] hover:bg-[#F3EFE8] border border-[#EAE3D6] hover:border-[#D0C7B9] transition-all shadow-2xs flex flex-col justify-between active:scale-[0.98]"
                  >
                    <p className="text-xs sm:text-sm text-[#27362E] font-medium leading-relaxed italic mb-3">
                      "{prompt}"
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4A6B56] group-hover:translate-x-0.5 transition-transform">
                      <span>Reflect on this prompt</span>
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
  );
};
