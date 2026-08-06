import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRESET_INTERESTS, GENDER_CHOICES, LOOKING_FOR_CHOICES } from '../utils/constants';
import { User, Tag, Save, Check, Plus, X } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

export default function ProfilePage() {
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Edit Profile</h1>
          <p className="text-xs text-[#9EA4AF] mt-1">Customize your profile & normalized interest tags for matching</p>
        </div>
        {saved && (
          <Badge tone="success">
            <Check className="w-3.5 h-3.5" />
            <span>Profile Saved!</span>
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6 bg-[#14181F] border-white/[0.05] space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold text-sm uppercase tracking-wider">
            <User className="w-4 h-4 text-[#A66BFF]" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Developer"
                className="input"
              />
            </div>

            <div>
              <label className="label">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="input"
              />
            </div>

            <div>
              <label className="label">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input"
              >
                {GENDER_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value} className="bg-[#14181F] text-white">
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Looking For</label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="input"
              >
                {LOOKING_FOR_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value} className="bg-[#14181F] text-white">
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell strangers a little bit about yourself..."
              className="input"
            />
          </div>
        </Card>

        {/* Interest Tags */}
        <Card className="p-6 bg-[#14181F] border-white/[0.05] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-sm uppercase tracking-wider">
              <Tag className="w-4 h-4 text-[#D97FA6]" />
              <span>Interest Tags</span>
            </div>
            <span className="text-xs text-[#9EA4AF]">{selectedInterests.length} selected</span>
          </div>

          {/* Active Selected Tags Display */}
          {selectedInterests.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#101319] border border-white/[0.05]">
              {selectedInterests.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-[#A66BFF]/15 border border-[#A66BFF]/40 text-[#A66BFF] text-xs font-medium flex items-center gap-1.5"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className="hover:text-white p-0.5 rounded-md hover:bg-[#A66BFF]/30 transition-colors"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Popular Presets */}
          <div className="space-y-2">
            <label className="label">Popular Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_INTERESTS.filter((tag) => !selectedInterests.includes(tag)).map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="chip text-[#9EA4AF] hover:text-white"
                >
                  +#{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Interest Input */}
          <div className="space-y-2 pt-2">
            <label className="label">Add Custom Interest</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="e.g. Quantum Computing, Cyberpunk"
                className="input flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="btn btn-secondary btn-md gap-1 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>
        </Card>

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          size="lg"
          className="w-full font-semibold gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : 'Save Profile Preferences'}</span>
        </Button>
      </form>
    </div>
  );
}
