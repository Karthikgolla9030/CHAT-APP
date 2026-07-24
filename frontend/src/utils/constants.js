const isProd = import.meta.env.PROD;
const getProtocol = (ws = false) => {
  if (ws) return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return window.location.protocol;
};

export const API_BASE_URL = isProd
  ? `${window.location.origin}/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

export const WS_BASE_URL = isProd
  ? `${getProtocol(true)}//${window.location.host}/ws`
  : 'ws://127.0.0.1:8000/ws';

export const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const LOOKING_FOR_CHOICES = [
  { value: 'anyone', label: 'Anyone' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'friends', label: 'Friends' },
];

export const PRESET_INTERESTS = [
  'Coding', 'AI', 'Gaming', 'Music', 'Anime',
  'Movies', 'Travel', 'Fitness', 'Cooking',
  'Photography', 'Startups', 'Reading', 'Python', 'Machine Learning'
];
