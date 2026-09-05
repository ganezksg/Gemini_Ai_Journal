import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  LogOut,
  Download,
  Database,
  CheckCircle2,
  FileText,
  Key,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JournalSession } from '../shared/types';

interface SettingsViewProps {
  journals: JournalSession[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ journals }) => {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportData = () => {
    try {
      setExporting(true);
      const exportObject = {
        app: 'EMORA — Personal Gemini Journal',
        exportedAt: new Date().toISOString(),
        user: {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
        },
        totalJournals: journals.length,
        journals: journals.map((j) => ({
          id: j.id,
          title: j.title,
          createdAt: new Date(j.createdAt).toISOString(),
          updatedAt: new Date(j.updatedAt).toISOString(),
          summary: j.summary,
          lastPreview: j.lastPreview,
          tags: j.tags,
        })),
      };

      const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonStr);
      downloadAnchor.setAttribute('download', `emora-journal-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 sm:p-8 shadow-xs">
        <h2 className="text-2xl font-serif font-medium text-[#1E2922] tracking-tight">
          Settings & Privacy
        </h2>
        <p className="text-xs sm:text-sm text-[#6C7B71] mt-1">
          Manage your account profile, review security guarantees, and export your personal data
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] border border-[#D5E3D8] text-[#4A6B56] flex items-center justify-center font-serif text-lg font-semibold">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'E')}
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[#1E2922]">
                {user?.displayName || 'Reflective Journaler'}
              </h3>
              <p className="text-xs text-[#6C7B71]">
                {user?.email || 'Authenticated User'}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-[#E5DFD5] text-xs font-medium text-[#5E6D62] hover:text-[#1E2922] hover:bg-[#FAF8F5] transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD]">
            <span className="text-[11px] text-[#7E8D83] font-medium block mb-0.5">Firebase UID</span>
            <code className="text-[#3A4A40] text-[11px] break-all font-mono">
              {user?.uid || 'Not available'}
            </code>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD]">
            <span className="text-[11px] text-[#7E8D83] font-medium block mb-0.5">Stored Reflections</span>
            <span className="text-sm font-semibold text-[#1E2922]">
              {journals.length} personal entries
            </span>
          </div>
        </div>
      </div>

      {/* Security Architecture Guarantees */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2ECE3] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#4A6B56]" />
          <div>
            <h3 className="font-serif text-base font-semibold text-[#1E2922]">
              Security & Privacy Constitution
            </h3>
            <p className="text-xs text-[#708075]">Zero-knowledge architecture guarding every word you write</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#273B2F]">
              <CheckCircle2 className="w-4 h-4 text-[#4A6B56]" />
              <span>Per-User Firestore Tenant Isolation</span>
            </div>
            <p className="text-xs text-[#6C7B71] leading-relaxed">
              Every journal is locked into your private path (<code className="text-[10px]">/users/{'{uid}'}</code>). Cryptographic Firestore Security Rules prevent cross-user leakage.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#273B2F]">
              <Key className="w-4 h-4 text-[#4A6B56]" />
              <span>Server-Side Secret Manager</span>
            </div>
            <p className="text-xs text-[#6C7B71] leading-relaxed">
              Gemini API keys and sensitive credentials remain strictly server-side in Google Cloud Secret Manager. Never exposed in browser JavaScript.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#273B2F]">
              <Lock className="w-4 h-4 text-[#4A6B56]" />
              <span>Abstract Pattern Abstraction</span>
            </div>
            <p className="text-xs text-[#6C7B71] leading-relaxed">
              Topics Trees and Reflection Intelligence only utilize normalized, generalized concepts. Raw journal sentences and intimate specifics are never exposed publicly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#ECE6DD] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#273B2F]">
              <Database className="w-4 h-4 text-[#4A6B56]" />
              <span>Authoritative Token Verification</span>
            </div>
            <p className="text-xs text-[#6C7B71] leading-relaxed">
              Every single backend request is validated against Google Firebase Admin SDK before processing.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export Card */}
      <div className="bg-white rounded-3xl border border-[#ECE6DC] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-md">
          <h3 className="font-serif text-base font-semibold text-[#1E2922]">
            Export Your Journal Data
          </h3>
          <p className="text-xs text-[#6C7B71] leading-relaxed">
            Download a portable, machine-readable JSON backup of your reflection history and summaries.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting || journals.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFE9] border border-[#E5DFD5] text-[#2C3A32] text-xs font-medium transition-colors shadow-2xs active:scale-[0.98] disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#4A6B56]" />
          <span>{exporting ? 'Packaging data...' : 'Download JSON Export'}</span>
        </button>
      </div>
    </div>
  );
};
