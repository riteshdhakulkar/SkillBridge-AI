import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Building2,
  Briefcase,
  User,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { OutreachMessagesResult } from '../types/analysis';
import { generateOutreachClientSide } from '../utils/clientAnalysisEngine';

interface RecruiterOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCandidateName?: string;
  defaultRole?: string;
  defaultCompany?: string;
}

export const RecruiterOutreachModal: React.FC<RecruiterOutreachModalProps> = ({
  isOpen,
  onClose,
  defaultCandidateName = 'Ritesh Dhakulkar',
  defaultRole = 'Junior Full-Stack Developer',
  defaultCompany = 'Tech Innovators Inc.',
}) => {
  const [candidateName, setCandidateName] = useState(defaultCandidateName);
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [jobTitle, setJobTitle] = useState(defaultRole);
  const [projectMention, setProjectMention] = useState('Nex-Cartify');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<OutreachMessagesResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'recruiter' | 'cold_email' | 'thank_you'>('connection');

  useEffect(() => {
    if (isOpen && !outreach) {
      handleGenerate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: OutreachMessagesResult | null = null;
      try {
        const res = await fetch('/api/generate-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            companyName,
            jobTitle,
            projectMention,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.data) {
            data = json.data;
          }
        }
      } catch {
        // Backend offline / Vercel static mode
      }

      if (!data) {
        data = generateOutreachClientSide({
          candidateName,
          companyName,
          jobTitle,
          projectMention,
        });
      }

      setOutreach(data);
    } catch (err: any) {
      setError(err.message || 'Error generating messages.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#FAF7F2] shadow-2xl border border-[#b7a89a]/50 z-10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b7a89a]/35 px-6 py-4 bg-[#e8dcc6]/35">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#722f37] text-[#FAF7F2] shadow-xs">
              <Mail className="h-4 w-4 text-[#e8dcc6]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#231815]">
                Recruiter Cold Outreach & LinkedIn DM Generator
              </h2>
              <p className="text-xs text-[#574943]">
                Generate high-response connection notes, cold emails, and post-interview thank yous
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#574943] hover:bg-[#e8dcc6]/50 hover:text-[#231815] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customization Inputs Drawer */}
        <div className="border-b border-[#b7a89a]/35 bg-[#FAF7F2] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#574943] uppercase">Your Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#b7a89a]/50 bg-white p-2 text-xs text-[#231815] focus:border-[#722f37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#574943] uppercase">Target Company</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Google / Stripe / Startup"
                className="mt-1 w-full rounded-lg border border-[#b7a89a]/50 bg-white p-2 text-xs text-[#231815] focus:border-[#722f37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 uppercase">Target Role</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-600 uppercase">Featured Project</label>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  value={projectMention}
                  onChange={(e) => setProjectMention(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-stone-800 shrink-0 cursor-pointer disabled:opacity-50"
                  title="Update templates"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#b7a89a]/35 bg-[#e8dcc6]/25 px-6 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'connection'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            LinkedIn Connection Note (&lt;300 Chars)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recruiter')}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'recruiter'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            Recruiter InMail / DM
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cold_email')}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'cold_email'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            Engineering Manager Cold Email
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thank_you')}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'thank_you'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            Post-Interview Thank You
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#722f37]" />
              <p className="text-xs font-bold text-[#574943]">
                Personalizing outreach messages with your project achievements...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && outreach && (
            <div>
              {/* Tab 1: Connection Note */}
              {activeTab === 'connection' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#231815] block">
                        Personalized LinkedIn Invitation
                      </span>
                      <span className="text-[11px] text-[#574943]">
                        Character count: {outreach.connectionNote.length}/300 (LinkedIn limit)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(outreach.connectionNote, 'conn')}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'conn' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                          <span>Copy Note</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 text-xs text-[#231815] leading-relaxed font-sans shadow-2xs">
                    {outreach.connectionNote}
                  </div>
                </div>
              )}

              {/* Tab 2: Recruiter InMail */}
              {activeTab === 'recruiter' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                      Direct Message to Technical Recruiter / Talent Sourcer
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(outreach.recruiterInMail, 'recruiter')}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'recruiter' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                          <span>Copy InMail</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 text-xs text-[#231815] leading-relaxed whitespace-pre-line font-sans shadow-2xs">
                    {outreach.recruiterInMail}
                  </div>
                </div>
              )}

              {/* Tab 3: Cold Email */}
              {activeTab === 'cold_email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                      Hiring Manager Cold Email
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Subject: ${outreach.coldEmail.subject}\n\n${outreach.coldEmail.body}`,
                          'cold'
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'cold' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                          <span>Copy Full Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 space-y-3 shadow-2xs">
                    <div className="border-b border-[#b7a89a]/30 pb-2">
                      <span className="text-[10px] font-bold text-[#722f37] uppercase block">Subject Line</span>
                      <p className="text-xs font-bold text-[#231815] mt-0.5">{outreach.coldEmail.subject}</p>
                    </div>
                    <div className="text-xs text-[#574943] leading-relaxed whitespace-pre-line font-sans">
                      {outreach.coldEmail.body}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Thank You Note */}
              {activeTab === 'thank_you' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                      Post-Interview Follow-Up & Impact Note
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(outreach.thankYouFollowUp, 'thankyou')}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1.5 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'thankyou' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                          <span>Copy Note</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 text-xs text-[#574943] leading-relaxed whitespace-pre-line font-sans shadow-2xs">
                    {outreach.thankYouFollowUp}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#b7a89a]/35 bg-[#e8dcc6]/30 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2 text-xs font-bold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
          >
            Close Outreach Generator
          </button>
        </div>
      </div>
    </div>
  );
};

