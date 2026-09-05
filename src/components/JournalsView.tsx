import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Tag,
  Clock,
  ChevronRight,
  Trash2,
  Filter,
  Loader2,
  Feather
} from 'lucide-react';
import { JournalSession } from '../shared/types';

interface JournalsViewProps {
  journals: JournalSession[];
  loading: boolean;
  creating: boolean;
  onSelectJournal: (journalId: string, prompt?: string) => void;
  onStartNewJournal: (initialTitle?: string, initialPrompt?: string) => void;
  onDeleteJournal: (e: React.MouseEvent, id: string) => void;
  onReturnToEditor?: () => void;
}

export const JournalsView: React.FC<JournalsViewProps> = ({
  journals,
  loading,
  creating,
  onSelectJournal,
  onStartNewJournal,
  onDeleteJournal,
  onReturnToEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active'>('all');

  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      // Status filter
      if (statusFilter === 'completed' && !j.summary) return false;
      if (statusFilter === 'active' && j.summary) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = j.title?.toLowerCase().includes(q);
      const textMatch = (j.summary?.summaryText || j.lastPreview || '').toLowerCase().includes(q);
      const moodMatch = (j.summary?.mood || '').toLowerCase().includes(q);
      const themeMatch = (j.summary?.keyThemes || []).some((t) => t.toLowerCase().includes(q));

      return titleMatch || textMatch || moodMatch || themeMatch;
    });
  }, [journals, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header with Search and Create Actions */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-medium text-[#1E2922] tracking-tight">
              My Journal Entries
            </h2>
            <p className="text-xs sm:text-sm text-[#6C7B71]">
              A continuous, private record of your personal reflections
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onReturnToEditor && (
              <button
                id="return-to-editor-button"
                onClick={onReturnToEditor}
                aria-label="Return to active reflection editor"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F4EFE6] hover:bg-[#EAE4D9] text-[#2F4436] text-xs font-medium border border-[#DDD6C9] transition-all active:scale-[0.98]"
              >
                <Feather className="w-3.5 h-3.5 text-[#4A6B56]" />
                <span>Current Reflection</span>
              </button>
            )}

            <button
              onClick={() => onStartNewJournal()}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] active:bg-[#16251D] text-white text-xs font-medium transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8DEC0]" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Reflection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C9C90] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, thought, or theme..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#F6F3EE] border border-[#E5DFD5] text-xs text-[#1E2B23] placeholder-[#8A988D] focus:outline-none focus:border-[#4A6B56] transition-colors"
            />
          </div>

          {/* Status Segmented Buttons */}
          <div className="inline-flex items-center bg-[#F6F3EE] p-1 rounded-2xl border border-[#E5DFD5] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1C2721] shadow-2xs'
                  : 'text-[#6C7B70] hover:text-[#23332A]'
              }`}
            >
              All ({journals.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white text-[#1C2721] shadow-2xs'
                  : 'text-[#6C7B70] hover:text-[#23332A]'
              }`}
            >
              Summarized ({journals.filter((j) => j.summary).length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-[#1C2721] shadow-2xs'
                  : 'text-[#6C7B70] hover:text-[#23332A]'
              }`}
            >
              In Progress ({journals.filter((j) => !j.summary).length})
            </button>
          </div>
        </div>
      </div>

      {/* Entries Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#ECE6DC]">
          <Loader2 className="w-7 h-7 animate-spin text-[#4A6B56] mx-auto mb-2" />
          <p className="text-xs text-[#7A8A7F]">Retrieving your journal entries...</p>
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#DCD6CB] p-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] text-[#4A6B56] flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="font-serif font-medium text-[#1E2922] text-base mb-1">
            {searchQuery ? 'No matching reflections found.' : 'No reflections in this category.'}
          </h4>
          <p className="text-xs text-[#6C7B71] max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'Try searching for a different keyword or resetting filters.'
              : 'Begin a new session whenever you are ready to write.'}
          </p>
          <button
            onClick={() => onStartNewJournal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#324C3D] hover:bg-[#23372B] text-white text-xs font-medium transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write a reflection</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJournals.map((j) => (
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
                    {j.summary.keyThemes.map((t, idx) => (
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
                <p className="text-xs text-[#5C6E63] line-clamp-3 leading-relaxed my-2 font-normal">
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
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#4A6B56] font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                  <span>Open reflection</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
