import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRESET_INTERESTS, GENDER_CHOICES, LOOKING_FOR_CHOICES } from '../utils/constants';
import { User, Tag, Save, Check, Plus, AlertCircle, X } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.profile?.display_name || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [gender, setGender] = useState(user?.profile?.gender || 'prefer_not_to_say');
  const [lookingFor, setLookingFor] = useState(user?.profile?.looking_for || 'anyone');
  const [country, setCountry] = useState(user?.profile?.country || '');
  const [language, setLanguage] = useState(user?.profile?.language || 'English');
  const [selectedInterests, setSelectedInterests] = useState(user?.profile?.interests || []);
  const [customInterest, setCustomInterest] = useState('');

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.display_name || '');
      setBio(user.profile.bio || '');
      setGender(user.profile.gender || 'prefer_not_to_say');
      setLookingFor(user.profile.looking_for || 'anyone');
      setCountry(user.profile.country || '');
      setLanguage(user.profile.language || 'English');
      setSelectedInterests(user.profile.interests || []);
    }
  }, [user]);

  const toggleInterest = (tag) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    if (!customInterest.trim()) return;
    const clean = customInterest.trim();
    if (!selectedInterests.includes(clean)) {
      setSelectedInterests([...selectedInterests, clean]);
    }
    setCustomInterest('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio: bio,
        gender: gender,
        looking_for: lookingFor,
        country: country,
        language: language,
        interests: selectedInterests,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Edit Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Customize your profile & normalized interest tags for matching</p>
        </div>
        {saved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            Profile Saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <User className="w-5 h-5 text-indigo-400" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Developer"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
              >
                {GENDER_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value} className="bg-slate-900 text-white">
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Looking For
              </label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
              >
                {LOOKING_FOR_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value} className="bg-slate-900 text-white">
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell strangers a little bit about yourself..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Normalized Interest System */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Tag className="w-5 h-5 text-violet-400" />
              <span>Interest Tags</span>
            </div>
            <span className="text-xs text-slate-400">{selectedInterests.length} selected</span>
          </div>

          {/* Active Selected Tags Display */}
          {selectedInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              {selectedInterests.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white border border-indigo-400 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className="hover:text-red-200 transition-colors p-0.5 rounded-full hover:bg-indigo-500"
                    title="Remove tag"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Preset Interest Chips */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Popular Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_INTERESTS.filter((tag) => !selectedInterests.includes(tag)).map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="glass-panel text-slate-400 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                >
                  +#{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Interest Input */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Add Custom Interest
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="e.g. Quantum Computing, Cyberpunk"
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving Changes...' : 'Save Profile Preferences'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
