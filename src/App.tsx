import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#324C3D] animate-spin mx-auto" />
          <p className="text-xs text-[#637469] font-medium tracking-wide">
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

  // Authenticated view -> AppShell with default Journal screen
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
