import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { JournalSession, ReflectionIntelligenceReport, SafeInterestMapData } from '../shared/types';
import {
  getUserJournals,
  createJournalSession,
  deleteJournalSession,
  getLatestReflectionReport,
  saveReflectionReport
} from '../services/journalService';
import { analyzeReflections } from '../services/apiClient';
import { AppShell, NavigationTab } from './AppShell';
import { DashboardView } from './DashboardView';
import { JournalsView } from './JournalsView';
import { JournalScreen } from './JournalScreen';
import { SummarizeView } from './SummarizeView';
import { TopicsTreePage } from './TopicsTreePage';
import { ReflectionInsightsView } from './ReflectionInsightsView';
import { SettingsView } from './SettingsView';
import { Loader2 } from 'lucide-react';

interface DashboardProps {
  onSelectJournal?: (journalId: string, prompt?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectJournal: externalOnSelectJournal }) => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  // Default landing screen is the JOURNAL screen
  const [activeTab, setActiveTab] = useState<NavigationTab>('journal');
  const [journalSubView, setJournalSubView] = useState<'editor' | 'shelf'>('editor');
  const [activeJournalId, setActiveJournalId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`emora_last_active_journal_${user?.uid}`) || null;
    } catch {
      return null;
    }
  });
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  // Reflection Intelligence state
  const [reflectionReport, setReflectionReport] = useState<ReflectionIntelligenceReport | null>(null);
  const [analyzingReflections, setAnalyzingReflections] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  // Cached Safe Interest Map Data
  const [cachedMapData, setCachedMapData] = useState<SafeInterestMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [list, report] = await Promise.all([
        getUserJournals(user.uid),
        getLatestReflectionReport(user.uid)
      ]);
      let updatedList = list;
      if (report) {
        setReflectionReport(report);
      }

      // Check if we have an active reflection session to preserve
      let targetId = activeJournalId;
      const validTarget = targetId ? updatedList.find((j) => j.id === targetId) : null;

      // If no valid active journal or if the currently selected one is already summarized/completed,
      // search for an existing in-progress (unsummarized) reflection to avoid creating duplicate blanks:
      if (!validTarget || validTarget.summary) {
        const unsummarized = updatedList.find((j) => !j.summary);
        if (unsummarized) {
          targetId = unsummarized.id;
          setActiveJournalId(unsummarized.id);
          try {
            localStorage.setItem(`emora_last_active_journal_${user.uid}`, unsummarized.id);
          } catch {}
        } else {
          // If no active session exists, prepare/open a new reflection session cleanly
          const dateStr = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const title = `Reflection — ${dateStr}`;
          const newSession = await createJournalSession(user.uid, title);
          updatedList = [newSession, ...updatedList];
          targetId = newSession.id;
          setActiveJournalId(newSession.id);
          try {
            localStorage.setItem(`emora_last_active_journal_${user.uid}`, newSession.id);
          } catch {}
        }
      }

      setJournals(updatedList);
    } catch {
      setError('Could not load your reflections. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStartNewJournal = async (initialTitle?: string, initialPromptText?: string) => {
    if (!user || creating) return;
    try {
      setCreating(true);
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const title = initialTitle || `Reflection — ${dateStr}`;
      const newSession = await createJournalSession(user.uid, title);
      setJournals((prev) => [newSession, ...prev]);
      setActiveJournalId(newSession.id);
      setInitialPrompt(initialPromptText);
      setJournalSubView('editor');
      setActiveTab('journal');
      try {
        localStorage.setItem(`emora_last_active_journal_${user.uid}`, newSession.id);
      } catch {}
      if (externalOnSelectJournal) {
        externalOnSelectJournal(newSession.id, initialPromptText);
      }
    } catch {
      setError('Failed to start a new journal entry.');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectJournal = (journalId: string, prompt?: string) => {
    setActiveJournalId(journalId);
    setInitialPrompt(prompt);
    setJournalSubView('editor');
    setActiveTab('journal');
    if (user) {
      try {
        localStorage.setItem(`emora_last_active_journal_${user.uid}`, journalId);
      } catch {}
    }
    if (externalOnSelectJournal) {
      externalOnSelectJournal(journalId, prompt);
    }
  };

  const handleTabChange = (tab: NavigationTab) => {
    if (tab === 'journal') {
      setJournalSubView('editor');
    }
    setActiveTab(tab);
  };

  const handleDeleteJournal = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;

    try {
      await deleteJournalSession(user.uid, id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
      if (activeJournalId === id) {
        setActiveJournalId(null);
        try {
          localStorage.removeItem(`emora_last_active_journal_${user.uid}`);
        } catch {}
      }
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

      const response = await analyzeReflections({
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

  const completedSummaryCount = journals.filter((j) => j.summary).length;
  const isFullBleedJournalEditor = activeTab === 'journal' && journalSubView === 'editor';

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      journalCount={journals.length}
      completedSummaryCount={completedSummaryCount}
      fullBleed={isFullBleedJournalEditor}
    >
      {/* View routing based on activeTab */}
      {activeTab === 'dashboard' && (
        <DashboardView
          journals={journals}
          loading={loading}
          creating={creating}
          reflectionReport={reflectionReport}
          onSelectJournal={handleSelectJournal}
          onStartNewJournal={handleStartNewJournal}
          onDeleteJournal={handleDeleteJournal}
          onNavigateToTab={setActiveTab}
        />
      )}

      {activeTab === 'journal' && (
        <>
          {loading && !activeJournalId ? (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#324C3D] animate-spin mx-auto" />
                <p className="text-xs text-[#637469] font-medium tracking-wide">
                  Preparing your reflection space...
                </p>
              </div>
            </div>
          ) : journalSubView === 'shelf' ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
              <JournalsView
                journals={journals}
                loading={loading}
                creating={creating}
                onSelectJournal={handleSelectJournal}
                onStartNewJournal={handleStartNewJournal}
                onDeleteJournal={handleDeleteJournal}
                onReturnToEditor={activeJournalId ? () => setJournalSubView('editor') : undefined}
              />
            </div>
          ) : activeJournalId ? (
            <JournalScreen
              journalId={activeJournalId}
              initialPrompt={initialPrompt}
              onBack={() => setActiveTab('dashboard')}
              onBrowseAll={() => setJournalSubView('shelf')}
            />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
              <JournalsView
                journals={journals}
                loading={loading}
                creating={creating}
                onSelectJournal={handleSelectJournal}
                onStartNewJournal={handleStartNewJournal}
                onDeleteJournal={handleDeleteJournal}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'summarize' && (
        <SummarizeView
          journals={journals}
          onSelectJournal={handleSelectJournal}
          onNavigateToTab={setActiveTab}
        />
      )}

      {activeTab === 'topics-tree' && (
        <TopicsTreePage
          journals={journals}
          loadingJournals={loading}
          cachedMapData={cachedMapData}
          onUpdateCachedMapData={setCachedMapData}
          onStartJournalWithPrompt={(prompt) => handleStartNewJournal(undefined, prompt)}
          onStartNewJournal={() => handleStartNewJournal()}
        />
      )}

      {activeTab === 'insights' && (
        <ReflectionInsightsView
          journals={journals}
          report={reflectionReport}
          analyzing={analyzingReflections}
          error={reflectionError}
          onRunAnalysis={handleRunReflectionIntelligence}
          onStartJournalWithPrompt={(prompt) => handleStartNewJournal(undefined, prompt)}
          onStartNewJournal={() => handleStartNewJournal()}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView journals={journals} />
      )}
    </AppShell>
  );
};
