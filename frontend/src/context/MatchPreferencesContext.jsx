import React, { createContext, useContext, useState } from 'react';

/**
 * MatchPreferencesContext
 *
 * Single source of truth for the user's active matchmaking preferences.
 * Lives above ActiveChatContext so that startMatchmaking() can read from it.
 *
 * prefsInitialized: false until the user explicitly starts their first search.
 * Once true, MatchmakingPage initialises from these values instead of profile defaults.
 */
const MatchPreferencesContext = createContext(null);

export const useMatchPreferences = () => useContext(MatchPreferencesContext);

export const MatchPreferencesProvider = ({ children }) => {
  const [activePrefs, setActivePrefs] = useState({
    gender: 'prefer_not_to_say',
    lookingFor: 'anyone',
    interests: [],
  });

  // False until user explicitly sets prefs for the first time via the full page
  const [prefsInitialized, setPrefsInitialized] = useState(false);

  /**
   * Merge-update preferences (partial update allowed).
   * Does NOT affect the current active chat in any way.
   */
  const updatePrefs = (partial) => {
    setActivePrefs((prev) => ({ ...prev, ...partial }));
  };

  /**
   * Replace the full preference set (used on first save from MatchmakingPage).
   */
  const applyPrefs = (prefs) => {
    setActivePrefs({
      gender: prefs.gender || 'prefer_not_to_say',
      lookingFor: prefs.lookingFor || 'anyone',
      interests: Array.isArray(prefs.interests) ? prefs.interests : [],
    });
    setPrefsInitialized(true);
  };

  return (
    <MatchPreferencesContext.Provider
      value={{
        activePrefs,
        prefsInitialized,
        setPrefsInitialized,
        updatePrefs,
        applyPrefs,
      }}
    >
      {children}
    </MatchPreferencesContext.Provider>
  );
};
