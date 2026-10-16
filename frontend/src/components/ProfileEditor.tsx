import React, { useState, useEffect } from 'react';
import { UserCheck, Sparkles, Plus, X, Save, FileText, CheckCircle2, Upload } from 'lucide-react';
import type { UserProfile } from '../types';
import { api } from '../services/api';

interface ProfileEditorProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onProfileUpdated }) => {
  const [name, setName] = useState(profile.name);
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

  useEffect(() => {
    setName(profile.name);
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
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white">Your Candidate Profile & Career Criteria</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
              The AI matching engine evaluates Bdjobs postings against your degree, technical skills, and years of experience to calculate your explainable match scores.
            </p>
          </div>
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Profile Fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-400">
            1. Basic Information & Background
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Academic Degree</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Sc. in Computer Science and Engineering"
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
                placeholder="e.g. Software QA Engineer"
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
                2. Technical Skills Inventory ({skills.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">These are directly compared against job requirements.</p>
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
                3. CV / Resume (Paste or Upload PDF)
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
