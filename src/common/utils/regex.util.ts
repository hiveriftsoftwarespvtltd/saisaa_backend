/**
 * ReDoS & Regex Injection Sanitizer
 * Safely escapes special regular expression characters from untrusted user inputs.
 */
export const escapeRegex = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
