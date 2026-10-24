import React, { useState, useEffect } from 'react';
import {
  X,
  Linkedin,
  Github,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Share2,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { ProfileAssetsResult } from '../types/analysis';
import { generateProfileAssetsClientSide } from '../utils/clientAnalysisEngine';

interface ProfileAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  targetTitle?: string;
  skills?: string[];
  projects?: { title: string; techStack: string[] }[];
}

export const ProfileAssetsModal: React.FC<ProfileAssetsModalProps> = ({
  isOpen,
  onClose,
  candidateName = 'Ritesh Dhakulkar',
  targetTitle = 'Junior Full-Stack Developer',
  skills = ['React', 'TypeScript', 'Node.js', 'Express', 'MySQL', 'MongoDB', 'Docker'],
  projects = [
    { title: 'Nex-Cartify', techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB'] },
    { title: 'RetailGenie AI', techStack: ['React', 'Gemini API', 'TypeScript', 'Docker'] },
  ],
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ProfileAssetsResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'linkedin' | 'github'>('linkedin');

  useEffect(() => {
    if (isOpen && !assets) {
      handleGenerate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: ProfileAssetsResult | null = null;
      try {
        const res = await fetch('/api/generate-profile-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            targetTitle,
            skills,
            projects,
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
        data = generateProfileAssetsClientSide({
          candidateName,
          targetTitle,
          skills,
          projects,
        });
      }

      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Error generating assets.');
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
              <Share2 className="h-4 w-4 text-[#e8dcc6]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#231815]">
                LinkedIn & GitHub Profile Optimizer
              </h2>
              <p className="text-xs text-[#574943]">
                Turn your verified resume achievements into high-converting headlines and bios
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

        {/* Tab Selector */}
        <div className="border-b border-[#b7a89a]/35 bg-[#FAF7F2] px-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('linkedin')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'linkedin'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            <span>LinkedIn Profile Copy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'github'
                ? 'border-[#722f37] text-[#722f37]'
                : 'border-transparent text-[#574943] hover:text-[#231815]'
            }`}
          >
            <Github className="h-4 w-4 text-[#231815]" />
            <span>GitHub Bio & Pinned Repos</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />
              <p className="text-xs font-semibold text-stone-600">
                Synthesizing recruiter-optimized LinkedIn headlines & GitHub assets...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && assets && activeTab === 'linkedin' && (
            <div className="space-y-6">
              {/* LinkedIn Headlines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                    High-CTR LinkedIn Headlines ({assets.headlines.length} Variations)
                  </span>
                  <span className="text-[10px] text-[#574943]">Targeted for recruiter search algorithms</span>
                </div>

                <div className="space-y-2.5">
                  {assets.headlines.map((hl, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:border-[#722f37]/50 transition-all"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#722f37]">
                          Option {idx + 1}
                        </span>
                        <p className="text-xs font-medium text-[#231815] leading-relaxed">{hl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(hl, `hl-${idx}`)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-2.5 py-1 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 transition-all shrink-0 cursor-pointer"
                      >
                        {copiedKey === `hl-${idx}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-[#722f37]" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LinkedIn About Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#231815]">
                    Recruiter-Ready LinkedIn "About" Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(assets.aboutSummary, 'about')}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'about' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Full About</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                        <span>Copy About</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 text-xs text-[#574943] leading-relaxed whitespace-pre-line font-sans shadow-2xs">
                  {assets.aboutSummary}
                </div>
              </div>
            </div>
          )}

          {!loading && assets && activeTab === 'github' && (
            <div className="space-y-6">
              {/* GitHub Bio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#231815] block">
                      GitHub Profile Bio
                    </span>
                    <span className="text-[10px] text-[#574943]">
                      Under 160 characters (GitHub limit: {assets.githubBio.length}/160)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(assets.githubBio, 'gh-bio')}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#b7a89a]/50 bg-[#e8dcc6]/40 px-3 py-1 text-xs font-bold text-[#722f37] hover:bg-[#e8dcc6]/80 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'gh-bio' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#722f37]" />
                        <span>Copy Bio</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-3.5 font-mono text-xs text-[#231815] shadow-2xs">
                  {assets.githubBio}
                </div>
              </div>

              {/* Pinned Projects */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#231815] block">
                  Pinned Repositories & README Summaries
                </span>

                <div className="space-y-3">
                  {assets.pinnedProjects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#b7a89a]/40 bg-[#FAF7F2] p-4 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-[#722f37]" />
                          <span className="text-xs font-bold text-[#231815]">{proj.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(proj.summary, `proj-${idx}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#722f37] hover:underline cursor-pointer"
                        >
                          {copiedKey === `proj-${idx}` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Copied Description</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-[#722f37]" />
                              <span>Copy Description</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-[#574943] leading-relaxed">{proj.summary}</p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.tags.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-lg bg-[#e8dcc6]/60 border border-[#b7a89a]/40 px-2 py-0.5 text-[10px] font-bold text-[#231815]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#b7a89a]/35 bg-[#e8dcc6]/30 px-6 py-3.5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs font-bold text-[#722f37] hover:underline cursor-pointer disabled:opacity-50"
          >
            Regenerate Assets
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#722f37] hover:bg-[#551b22] px-5 py-2 text-xs font-bold text-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

