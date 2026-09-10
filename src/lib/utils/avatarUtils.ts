export interface AvatarGradient {
  name: string;
  fromClass: string;
  toClass: string;
  bgClass: string;
  borderClass: string;
}

export const AVATAR_GRADIENT_PALETTES: AvatarGradient[] = [
  {
    name: 'amber',
    fromClass: 'from-amber-400',
    toClass: 'to-amber-600',
    bgClass: 'bg-gradient-to-br from-amber-400 to-amber-600 text-gray-950',
    borderClass: 'border-amber-300',
  },
  {
    name: 'emerald',
    fromClass: 'from-emerald-500',
    toClass: 'to-teal-700',
    bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
    borderClass: 'border-emerald-400',
  },
  {
    name: 'indigo',
    fromClass: 'from-indigo-500',
    toClass: 'to-blue-700',
    bgClass: 'bg-gradient-to-br from-indigo-500 to-blue-700 text-white',
    borderClass: 'border-indigo-400',
  },
  {
    name: 'rose',
    fromClass: 'from-rose-500',
    toClass: 'to-pink-700',
    bgClass: 'bg-gradient-to-br from-rose-500 to-pink-700 text-white',
    borderClass: 'border-rose-400',
  },
  {
    name: 'violet',
    fromClass: 'from-violet-500',
    toClass: 'to-purple-700',
    bgClass: 'bg-gradient-to-br from-violet-500 to-purple-700 text-white',
    borderClass: 'border-violet-400',
  },
  {
    name: 'cyan',
    fromClass: 'from-cyan-500',
    toClass: 'to-blue-600',
    bgClass: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white',
    borderClass: 'border-cyan-300',
  },
];

/**
 * Task 36: Extract 1-2 character initials from Bengali or English names
 * e.g., "Sabir Khan" -> "SK", "সাবির খান" -> "সা.খা", "Anirul" -> "AN"
 */
export function extractInitials(name?: string): string {
  if (!name || !name.trim()) return 'MM';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    const single = parts[0];
    // If ASCII English
    if (/^[A-Za-z]+$/.test(single)) {
      return single.slice(0, 2).toUpperCase();
    }
    // Bengali single word
    return single.slice(0, 2);
  }

  // 2 or more words
  const first = parts[0];
  const last = parts[parts.length - 1];

  // If ASCII English
  if (/^[A-Za-z]/.test(first) && /^[A-Za-z]/.test(last)) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  // Bengali name (e.g. "সাবির খান" -> "সা.খা")
  return `${first.slice(0, 1)}.${last.slice(0, 1)}`;
}

/**
 * Deterministically pick an avatar palette based on name hash
 */
export function getAvatarGradientForName(name?: string): AvatarGradient {
  if (!name) return AVATAR_GRADIENT_PALETTES[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_GRADIENT_PALETTES.length;
  return AVATAR_GRADIENT_PALETTES[index];
}
