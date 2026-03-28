/**
 * Query Parameters Utility Module
 *
 * Responsibilities:
 * - Serialize/Deserialize search form state to/from URL
 * - Sanitize and validate search metrics and engine selections
 * - Generate descriptive filter labels (chips)
 *
 * Boundaries:
 * - No side effects (pure logic only)
 */

import { SearchFormState, FilterChip } from '../types';

const ENGINE_OPTIONS = ['bing', 'google', 'duckduckgo', 'baidu', 'yandex'];
const ORIENTATION_OPTIONS: ('any' | 'portrait' | 'landscape')[] = ['any', 'portrait', 'landscape'];

export const DEFAULT_FORM: SearchFormState = {
  query: '', engines: ['all'], min_width: 1000, min_height: 1000, four_k_only: false, orientation: 'any', remove_duplicates: true, allow_unverified: true, pages: 0, limit: 20
};

/** Ensures a value is a positive integer. */
const toPositiveInt = (value: string | number | null, fallback: number): number => {
  if (value === null) return fallback;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0 ? num : fallback;
};

/** Ensures a value is a non-negative integer. */
const toNonNegativeInt = (value: string | number | null, fallback: number): number => {
  if (value === null) return fallback;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num >= 0 ? num : fallback;
};

/** Converts a string to boolean. */
const toBool = (value: string | null, fallback: boolean): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

/** Parses search engine selection from string. */
const parseEngines = (raw: string | null): string[] => {
  if (!raw) return DEFAULT_FORM.engines;
  if (raw === 'all') return ['all'];
  const parsed = raw.split(',').map((item) => item.trim()).filter((item) => ENGINE_OPTIONS.includes(item));
  return parsed.length ? Array.from(new Set(parsed)) : DEFAULT_FORM.engines;
};

/** Parses URL search parameters into a SearchFormState object. */
export const parseSearchParamsToForm = (search: string): SearchFormState => {
  const params = new URLSearchParams(search);
  const orientation = params.get('orientation') as any;
  return {
    query: params.get('query')?.trim() ?? DEFAULT_FORM.query,
    engines: parseEngines(params.get('engines')),
    min_width: toPositiveInt(params.get('min_width'), DEFAULT_FORM.min_width),
    min_height: toPositiveInt(params.get('min_height'), DEFAULT_FORM.min_height),
    four_k_only: toBool(params.get('four_k_only'), DEFAULT_FORM.four_k_only),
    orientation: ORIENTATION_OPTIONS.includes(orientation) ? orientation : DEFAULT_FORM.orientation,
    remove_duplicates: toBool(params.get('remove_duplicates'), DEFAULT_FORM.remove_duplicates),
    allow_unverified: toBool(params.get('allow_unverified'), DEFAULT_FORM.allow_unverified),
    pages: (() => {
      const parsed = toNonNegativeInt(params.get('pages'), DEFAULT_FORM.pages);
      return parsed === 0 ? 0 : Math.min(50, Math.max(0, parsed));
    })(),
    limit: (() => {
      const parsed = toNonNegativeInt(params.get('limit'), DEFAULT_FORM.limit);
      return parsed === 0 ? 0 : Math.min(200, Math.max(1, parsed));
    })()
  };
};

/** Converts SearchFormState to URLSearchParams. */
export const buildSearchParams = (form: SearchFormState): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('query', form.query.trim());
  params.set('engines', form.engines.includes('all') ? 'all' : form.engines.join(','));
  params.set('min_width', String(form.min_width));
  params.set('min_height', String(form.min_height));
  params.set('four_k_only', String(form.four_k_only));
  params.set('orientation', form.orientation);
  params.set('remove_duplicates', String(form.remove_duplicates));
  params.set('allow_unverified', String(form.allow_unverified));
  params.set('pages', String(form.pages));
  params.set('limit', String(form.limit));
  return params;
};

/** Generates descriptive filter chips from form state. */
export const getActiveFilterChips = (form: SearchFormState): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (form.query.trim()) chips.push(`Query: ${form.query.trim()}`);
  if (form.engines.includes('all')) chips.push('Engines: all');
  else chips.push(`Engines: ${form.engines.join(', ')}`);
  if (form.min_width !== DEFAULT_FORM.min_width) chips.push(`Min width: ${form.min_width}`);
  if (form.min_height !== DEFAULT_FORM.min_height) chips.push(`Min height: ${form.min_height}`);
  if (form.four_k_only) chips.push('4K only');
  if (form.orientation !== DEFAULT_FORM.orientation) chips.push(`Orientation: ${form.orientation}`);
  if (!form.remove_duplicates) chips.push('Duplicates allowed');
  if (form.allow_unverified) chips.push('Include unverified');
  if (form.pages !== DEFAULT_FORM.pages) chips.push(form.pages === 0 ? 'Pages: all' : `Pages: ${form.pages}`);
  if (form.limit !== DEFAULT_FORM.limit) chips.push(form.limit === 0 ? 'Limit: all' : `Limit: ${form.limit}`);
  return chips;
};

/** Sanitizes form state before submission to ensure valid types and bounds. */
export const sanitizeBeforeSubmit = (form: SearchFormState): SearchFormState => ({
  ...form,
  query: form.query.trim(),
  engines: form.engines.length ? form.engines : DEFAULT_FORM.engines,
  min_width: Math.max(1, typeof form.min_width === 'string' ? parseInt(form.min_width, 10) : form.min_width || DEFAULT_FORM.min_width),
  min_height: Math.max(1, typeof form.min_height === 'string' ? parseInt(form.min_height, 10) : form.min_height || DEFAULT_FORM.min_height),
  pages: (() => {
    const parsed = typeof form.pages === 'string' ? parseInt(form.pages, 10) : form.pages;
    if (Number.isInteger(parsed) && parsed === 0) return 0;
    return Math.min(50, Math.max(0, parsed || DEFAULT_FORM.pages));
  })(),
  limit: (() => {
    const parsed = typeof form.limit === 'string' ? parseInt(form.limit, 10) : form.limit;
    if (Number.isInteger(parsed) && parsed === 0) return 0;
    return Math.min(200, Math.max(1, parsed || DEFAULT_FORM.limit));
  })()
});
