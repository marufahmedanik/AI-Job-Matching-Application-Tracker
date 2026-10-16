import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Award, Sparkles } from 'lucide-react';
import type { JobListing } from '../types';

interface MatchScoreCardProps {
  job: JobListing;
  onTrack: (status: string) => void;
  isCompact?: boolean;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ job, onTrack, isCompact = false }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const score = Math.round(job.match_score || 0);
  const breakdown = job.score_breakdown;

  // Score coloring
  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getProgressBarColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
      {/* Background subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title & Score */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {job.source || 'Bdjobs'}
            </span>
            <span className="text-xs text-slate-400">{job.location}</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight leading-snug">{job.title}</h3>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{job.company}</p>
        </div>

        {/* The Illustrative Match Score Display */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-400 font-medium mb-1">Illustrative match score</div>
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-3xl font-extrabold tracking-tight ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {score}
            </span>
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(score)}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {/* Matched vs Missing Explanation Pills */}
      <div className="mt-4 space-y-2.5 text-xs">
        {/* Matched list */}
        <div className="flex items-start gap-2">
          <span className="font-semibold text-emerald-400 flex items-center gap-1 min-w-[70px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {job.matched_skills && job.matched_skills.length > 0 ? (
              job.matched_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None detected</span>
            )}
          </div>
        </div>

        {/* Missing list */}
        <div className="flex items-start gap-2">
          <span className="font-semibold text-rose-400 flex items-center gap-1 min-w-[70px]">
            <AlertCircle className="w-3.5 h-3.5" /> Missing:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {job.missing_skills && job.missing_skills.length > 0 ? (
              job.missing_skills.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/40 font-medium"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-emerald-400 font-medium">None! Ready to apply.</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Explanation */}
      {job.summary_explanation && (
        <p className="mt-3 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{job.summary_explanation}</span>
        </p>
      )}

      {/* Expandable Criteria Breakdown */}
      {breakdown && (
        <div className="mt-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
          >
            <span>{showBreakdown ? 'Hide score breakdown' : 'Why this score? View weighted breakdown'}</span>
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showBreakdown && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Technical Skills (50% max)</span>
                <span className="font-semibold text-white">{breakdown.skills_score} / 50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Experience Requirement (25% max)</span>
                <span className="font-semibold text-white">{breakdown.experience_score} / 25</span>
              </div>
              <div className="text-[11px] text-slate-500 italic pl-1">
                ↳ {breakdown.experience_status}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Role & Title Alignment (15% max)</span>
                <span className="font-semibold text-white">{breakdown.role_score} / 15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Education & Degree (10% max)</span>
                <span className="font-semibold text-white">{breakdown.education_score} / 10</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Direct Original Listing Link (Strict adherence: Review & apply on official source) */}
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            <span>Review & Apply on {job.source || 'Bdjobs'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-xs text-slate-500">Pasted Job Circular</span>
        )}

        {/* Tracking Buttons */}
        <div className="flex items-center gap-2">
          {job.application_status ? (
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Tracked: {job.application_status}
            </span>
          ) : (
            <>
              <button
                onClick={() => onTrack('SAVED')}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              >
                Save to Wishlist
              </button>
              <button
                onClick={() => onTrack('APPLIED')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition"
              >
                Mark Applied
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
