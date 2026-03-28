const ENGINE_OPTIONS = ['bing', 'google', 'duckduckgo', 'baidu', 'yandex'];
const ORIENTATION_OPTIONS = ['any', 'portrait', 'landscape'];

export const DEFAULT_FORM = {
  query: '',
  engines: ['all'],
  min_width: 1000,
  min_height: 1000,
  four_k_only: false,
  orientation: 'any',
  remove_duplicates: true,
  allow_unverified: true,
  pages: 0,
  limit: 20
};

const toPositiveInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isInteger(num) && num > 0 ? num : fallback;
};

const toNonNegativeInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isInteger(num) && num >= 0 ? num : fallback;
};

const toBool = (value, fallback) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

const parseEngines = (raw) => {
  if (!raw) return DEFAULT_FORM.engines;
  if (raw === 'all') return ['all'];
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ENGINE_OPTIONS.includes(item));
  return parsed.length ? Array.from(new Set(parsed)) : DEFAULT_FORM.engines;
};

export const parseSearchParamsToForm = (search) => {
  const params = new URLSearchParams(search);
  const orientation = params.get('orientation');

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
      if (parsed === 0) return 0;
      return Math.min(50, Math.max(0, parsed));
    })(),
    limit: (() => {
      const parsed = toNonNegativeInt(params.get('limit'), DEFAULT_FORM.limit);
      if (parsed === 0) return 0;
      return Math.min(200, Math.max(1, parsed));
    })()
  };
};

export const buildSearchParams = (form) => {
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

export const getActiveFilterChips = (form) => {
  const chips = [];

  if (form.query.trim()) chips.push(`Query: ${form.query.trim()}`);

  if (form.engines.includes('all')) {
    chips.push('Engines: all');
  } else {
    chips.push(`Engines: ${form.engines.join(', ')}`);
  }

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

export const sanitizeBeforeSubmit = (form) => ({
  ...form,
  query: form.query.trim(),
  engines: form.engines.length ? form.engines : DEFAULT_FORM.engines,
  min_width: Math.max(1, Number.parseInt(form.min_width, 10) || DEFAULT_FORM.min_width),
  min_height: Math.max(1, Number.parseInt(form.min_height, 10) || DEFAULT_FORM.min_height),
  pages: (() => {
    const parsed = Number.parseInt(form.pages, 10);
    if (Number.isInteger(parsed) && parsed === 0) return 0;
    return Math.min(50, Math.max(0, parsed || DEFAULT_FORM.pages));
  })(),
  limit: (() => {
    const parsed = Number.parseInt(form.limit, 10);
    if (Number.isInteger(parsed) && parsed === 0) return 0;
    return Math.min(200, Math.max(1, parsed || DEFAULT_FORM.limit));
  })()
});
