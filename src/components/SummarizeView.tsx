import React from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Smile,
  Compass,
  BookOpen,
  Tag
} from 'lucide-react';
import { JournalSession } from '../shared/types';

interface SummarizeViewProps {
  journals: JournalSession[];
  onSelectJournal: (journalId: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'journal' | 'summarize' | 'topics-tree' | 'insights' | 'settings') => void;
}

export const SummarizeView: React.FC<SummarizeViewProps> = ({
  journals,
  onSelectJournal,
  onNavigateToTab,
}) => {
  const summarizedJournals = journals.filter((j) => j.summary);
  const pendingJournals = journals.filter((j) => !j.summary && ((j.lastPreview && j.lastPreview.length > 0) || j.messageCount > 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D49F4E]" />
              <span className="text-[11px] font-semibold text-[#8B672B] uppercase tracking-wider">
                Syntheses & Digest
              </span>
            </div>
            <h2 className="text-2xl font-serif font-medium text-[#1E2922] tracking-tight">
              Reflection Summaries
            </h2>
            <p className="text-xs sm:text-sm text-[#6C7B71]">
              Review synthesized takeaways, moods, and gentle action prompts from your sessions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-2xl bg-[#FAF6EE] text-[#7A5B23] text-xs font-medium border border-[#EADBBD]">
              {summarizedJournals.length} completed {summarizedJournals.length === 1 ? 'summary' : 'summaries'}
            </span>
          </div>
        </div>
      </div>

      {/* Unsummarized Sessions that could be summarized */}
      {pendingJournals.length > 0 && (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#EFE5D3] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6E5528]">
              <Sparkles className="w-4 h-4 text-[#A8823E]" />
              <span>Sessions ready for reflection synthesis</span>
            </div>
            <span className="text-[11px] text-[#8C7A58]">{pendingJournals.length} pending</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingJournals.slice(0, 4).map((j) => (
              <div
                key={j.id}
                onClick={() => onSelectJournal(j.id)}
                className="p-3.5 rounded-2xl bg-white border border-[#EADBBD] hover:border-[#BF9B54] transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-serif text-xs font-semibold text-[#292015] truncate">
                    {j.title}
                  </h4>
                  <p className="text-[11px] text-[#786A55] truncate mt-0.5">
                    {j.lastPreview || 'Thoughts recorded...'}
                  </p>
                </div>
                <button className="shrink-0 text-xs text-[#8B672B] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  <span>Synthesize</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Summaries List */}
      <div className="space-y-4">
        {summarizedJournals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#DCD6CB] p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] text-[#A8823E] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-medium text-[#1E2922] text-base mb-1">
              No summaries synthesized yet.
            </h4>
            <p className="text-xs text-[#6C7B71] max-w-sm mx-auto mb-4">
              When you finish writing in a journal, tap "Summarize Reflection" to distill your session into key themes and a mindful takeaway.
            </p>
            <button
              onClick={() => onNavigateToTab('journal')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] text-white text-xs font-medium transition-all shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Go to journals</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {summarizedJournals.map((j) => (
              <div
                key={j.id}
                onClick={() => onSelectJournal(j.id)}
                className="bg-white rounded-3xl border border-[#ECE6DC] p-6 hover:border-[#CAD7CF] hover:shadow-xs transition-all cursor-pointer space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2ECE3] pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-serif text-base font-semibold text-[#1E2922]">
                      {j.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#708075]">
                      <span>
                        {new Date(j.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {j.summary?.mood && (
                        <span>• Mood: <strong className="text-[#3E4F44] font-medium">{j.summary.mood}</strong></span>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs text-[#4A6B56] font-medium">
                    <span>Open full reflection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Summary narrative */}
                <p className="text-xs sm:text-sm text-[#35463C] leading-relaxed">
                  {j.summary?.summaryText}
                </p>

                {/* Key themes & Action Prompt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {j.summary?.keyThemes.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F6F3EE] text-[#415147] text-[10px] font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-[#86968C]" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>

                  {j.summary?.actionPrompt && (
                    <div className="bg-[#F8F5EE] px-3 py-1.5 rounded-xl text-xs text-[#54432C] italic">
                      💡 "{j.summary.actionPrompt}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
