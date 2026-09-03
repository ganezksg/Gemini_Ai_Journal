import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { JournalScreen } from './components/JournalScreen';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-900 animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium tracking-wide">
            Initializing Secure Journal Environment...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  // Viewing a specific journal -> Show Journal Screen
  if (activeJournalId) {
    return (
      <JournalScreen
        journalId={activeJournalId}
        initialPrompt={initialPrompt}
        onBack={() => {
          setActiveJournalId(null);
          setInitialPrompt(undefined);
        }}
      />
    );
  }

  // Default authenticated view -> Dashboard
  return (
    <Dashboard
      onSelectJournal={(journalId: string, prompt?: string) => {
        setActiveJournalId(journalId);
        setInitialPrompt(prompt);
      }}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
