import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Sparkles,
  Plus,
  X,
  Save,
  FileText,
  CheckCircle2,
  Upload,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  Phone,
  Mail,
  Copy,
  Check,
  Link2
} from 'lucide-react';
import type { UserProfile } from '../types';
import { api } from '../services/api';

interface ProfileEditorProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onProfileUpdated }) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(profile.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || '');
  const [bdjobsProfileUrl, setBdjobsProfileUrl] = useState(profile.bdjobs_profile_url || '');
  const [degree, setDegree] = useState(profile.degree);
  const [targetRole, setTargetRole] = useState(profile.target_role);
  const [experience, setExperience] = useState(profile.years_of_experience);
  const [location, setLocation] = useState(profile.preferred_location);
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [rawCv, setRawCv] = useState(profile.raw_cv_text || '');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setGithubUrl(profile.github_url || '');
    setPortfolioUrl(profile.portfolio_url || '');
    setBdjobsProfileUrl(profile.bdjobs_profile_url || '');
    setDegree(profile.degree);
    setTargetRole(profile.target_role);
    setExperience(profile.years_of_experience);
    setLocation(profile.preferred_location);
    setSkills(profile.skills || []);
    setRawCv(profile.raw_cv_text || '');
  }, [profile]);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleCopyProfileLinks = () => {
    const text = `Candidate: ${name}
Degree: ${degree}
Target Role: ${targetRole}
GitHub: ${githubUrl}
LinkedIn: ${linkedinUrl}
Portfolio (PhishGuard): ${portfolioUrl}
${bdjobsProfileUrl ? `Bdjobs Profile: ${bdjobsProfileUrl}\n` : ''}Phone: ${phone}
Email: ${email}`;

    navigator.clipboard.writeText(text);
    setCopiedLinks(true);
    setTimeout(() => setCopiedLinks(false), 2500);
  };

  const handleParseCv = async () => {
    if (!rawCv.trim()) return;
    setParsing(true);
    try {
      const res = await api.parseCv(rawCv);
      if (res.extracted_skills && res.extracted_skills.length > 0) {
        const combined = Array.from(new Set([...skills, ...res.extracted_skills]));
        setSkills(combined);
      }
      if (res.extracted_experience > 0) {
        setExperience(res.extracted_experience);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name,
        email,
        phone,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        bdjobs_profile_url: bdjobsProfileUrl,
        degree,
        target_role: targetRole,
        years_of_experience: Number(experience),
        preferred_location: location,
        skills,
        raw_cv_text: rawCv,
      });
      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner & Candidate Identity Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{name || 'Your Candidate Profile'}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                    Verified Profile
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {degree} &bull; {targetRole}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed pt-1">
              Your profile powers the explainable match score engine across all Bdjobs postings. You can link your LinkedIn, GitHub, live portfolio (PhishGuard), and Bdjobs account below for instant recruiter access.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={handleCopyProfileLinks}
              title="Copy all professional profile links to clipboard"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
            >
              {copiedLinks ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Profile Summary</span>
                </>
              )}
            </button>

            {savedSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved!</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Clickable Profile Pill Badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-emerald-400" /> Linked Channels:
          </span>

          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>PhishGuard Live</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {bdjobsProfileUrl && (
            <a
              href={bdjobsProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition"
            >
              <span>Bdjobs Profile</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{email}</span>
            </a>
          )}

          {phone && (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{phone}</span>
            </a>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Professional Profiles & Social Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-400" />
              1. Professional Links & Online Profiles
            </h3>
            <span className="text-xs text-slate-500">Recruiter Visibility & Application Header</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-300" />
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourhandle"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                Live Portfolio / Project URL (e.g. PhishGuard)
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://phish-guard-uipa.vercel.app/"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Bdjobs Candidate Profile URL (Optional)
              </label>
              <input
                type="url"
                value={bdjobsProfileUrl}
                onChange={(e) => setBdjobsProfileUrl(e.target.value)}
                placeholder="https://mybdjobs.bdjobs.com/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bd.ahmed.anik@gmail.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1571-390503"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Core Profile Fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400">
            2. Basic Information & Academic Background
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Academic Degree & University</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Sc. in Computer Science and Engineering (East West University)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software QA Engineer / Software Engineer"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={experience}
                onChange={(e) => setExperience(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Khilgaon, Dhaka, Bangladesh"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Technical Skills Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400">
                3. Technical Skills Inventory ({skills.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">These are directly compared against job requirements for explainable match scoring.</p>
            </div>
          </div>

          {/* Add skill input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill (e.g. Playwright, Selenium, Pytest, SQL, Java)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
          </div>

          {/* Skill pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* CV / Resume Text Paste & PDF Upload via PyMuPDF */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                4. CV / Resume (Paste or Upload PDF)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload your PDF resume or paste text to auto-extract skills using PyMuPDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* PDF Upload Button */}
              <label className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload PDF (PyMuPDF)</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setParsing(true);
                    try {
                      const res = await api.uploadCvPdf(file);
                      if (res.extracted_skills && res.extracted_skills.length > 0) {
                        const merged = Array.from(new Set([...skills, ...res.extracted_skills]));
                        setSkills(merged);
                      }
                      if (res.extracted_experience > 0) {
                        setExperience(res.extracted_experience);
                      }
                      const updatedProfile = await api.getProfile();
                      setRawCv(updatedProfile.raw_cv_text || '');
                      onProfileUpdated(updatedProfile);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 3000);
                    } catch (err: any) {
                      alert(err.message || 'Failed to parse PDF');
                    } finally {
                      setParsing(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              {/* Text Extract Button */}
              <button
                type="button"
                onClick={handleParseCv}
                disabled={parsing || !rawCv.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <Sparkles className={`w-3.5 h-3.5 ${parsing ? 'animate-spin' : ''}`} />
                <span>{parsing ? 'Extracting...' : 'Auto-Extract Text'}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={5}
            value={rawCv}
            onChange={(e) => setRawCv(e.target.value)}
            placeholder="Paste your CV content or upload a PDF above..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-700/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile & Recalculate Matches'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
