//
//  nameUtils.ts
//  Rentify
//

/**
 * Two-letter initials used as avatar fallback when a person has no photo.
 * "Nguyễn Văn An" → "NA", "An" → "AN"
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};
