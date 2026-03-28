import { useMemo, useState, useCallback } from 'react';

const detectSourceEngine = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('bing.')) return 'Bing';
    if (hostname.includes('google.')) return 'Google';
    if (hostname.includes('yandex.')) return 'Yandex';
    if (hostname.includes('duckduckgo.')) return 'DuckDuckGo';
    if (hostname.includes('baidu.')) return 'Baidu';
    return hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
};

const asText = (value) => (typeof value === 'string' && value.trim() ? value.trim() : '');
const toTitleCase = (value) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const parseToMB = (sizeStr) => {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  if (unit === 'KB') return value / 1024;
  if (unit === 'MB') return value;
  if (unit === 'GB') return value * 1024;
  return value / (1024 * 1024); // B
};

const INITIAL_FILTERS = {
  sources: [],
  tags: [],
  orientations: [],
  minWidth: '',
  maxWidth: '',
  minHeight: '',
  maxHeight: '',
  minSize: '',
  maxSize: ''
};

export function useLocalFilters(results) {
  const [activeFilters, setActiveFilters] = useState({ ...INITIAL_FILTERS });

  const availableFilters = useMemo(() => {
    const filters = {
      sources: new Set(),
      tags: new Set(),
      orientations: new Set()
    };

    results.forEach((item) => {
      let rawSourceText = asText(item.search_engine) || detectSourceEngine(item.url);
      const source = toTitleCase(rawSourceText.replace(/[_-]+/g, ' '));
      if (source) filters.sources.add(source);

      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) filters.tags.add(tag.trim());
        });
      }

      const isLandscape = item.width >= item.height;
      filters.orientations.add(isLandscape ? 'Landscape' : 'Portrait');
    });

    return {
      sources: Array.from(filters.sources).sort(),
      tags: Array.from(filters.tags).sort(),
      orientations: ['Landscape', 'Portrait'].filter(o => filters.orientations.has(o))
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      // Source filter
      if (activeFilters.sources.length > 0) {
        let rawSourceText = asText(item.search_engine) || detectSourceEngine(item.url);
        const source = toTitleCase(rawSourceText.replace(/[_-]+/g, ' '));
        if (!activeFilters.sources.includes(source)) return false;
      }

      // Tags filter
      if (activeFilters.tags.length > 0) {
        const itemTags = Array.isArray(item.tags) ? item.tags.map(t => typeof t === 'string' ? t.trim() : '') : [];
        const matchesTag = activeFilters.tags.some(tag => itemTags.includes(tag));
        if (!matchesTag) return false;
      }

      // Orientation filter
      if (activeFilters.orientations.length > 0) {
        const orientation = item.width >= item.height ? 'Landscape' : 'Portrait';
        if (!activeFilters.orientations.includes(orientation)) return false;
      }

      // Width filter
      if (activeFilters.minWidth && item.width < parseInt(activeFilters.minWidth, 10)) return false;
      if (activeFilters.maxWidth && item.width > parseInt(activeFilters.maxWidth, 10)) return false;

      // Height filter
      if (activeFilters.minHeight && item.height < parseInt(activeFilters.minHeight, 10)) return false;
      if (activeFilters.maxHeight && item.height > parseInt(activeFilters.maxHeight, 10)) return false;

      // Size filter
      if (activeFilters.minSize || activeFilters.maxSize) {
        const itemMB = parseToMB(item.size);
        if (activeFilters.minSize && itemMB < parseFloat(activeFilters.minSize)) return false;
        if (activeFilters.maxSize && itemMB > parseFloat(activeFilters.maxSize)) return false;
      }

      return true;
    });
  }, [results, activeFilters]);

  const toggleFilter = useCallback((category, value) => {
    setActiveFilters(prev => {
      const categoryList = prev[category] || [];
      const isSelected = categoryList.includes(value);
      return {
        ...prev,
        [category]: isSelected ? categoryList.filter(item => item !== value) : [...categoryList, value]
      };
    });
  }, []);

  const setRangeFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setActiveFilters({ ...INITIAL_FILTERS });
  }, []);

  const activeCount = useMemo(() => {
    let count = 0;
    count += activeFilters.sources.length;
    count += activeFilters.tags.length;
    count += activeFilters.orientations.length;
    if (activeFilters.minWidth || activeFilters.maxWidth) count++;
    if (activeFilters.minHeight || activeFilters.maxHeight) count++;
    if (activeFilters.minSize || activeFilters.maxSize) count++;
    return count;
  }, [activeFilters]);

  return { 
    filteredResults, 
    availableFilters, 
    activeFilters, 
    toggleFilter, 
    setRangeFilter, 
    resetFilters,
    activeCount 
  };
}
