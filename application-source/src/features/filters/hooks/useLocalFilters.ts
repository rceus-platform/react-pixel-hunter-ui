/**
 * Local Filters Hook Module
 *
 * Responsibilities:
 * - Calculate available filters from active results
 * - Filter image results based on user preferences in real-time
 * - Manage active filter state and categorization
 *
 * Boundaries:
 * - No UI logic or API interactions
 */

import { useMemo, useState, useCallback } from 'react';
import { ImageResult, ActiveFilterState, AvailableFilters } from '../../../types';

/** Utility to detect the source engine from a URL. */
const detectSourceEngine = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('bing.')) return 'Bing';
    if (hostname.includes('google.')) return 'Google';
    if (hostname.includes('yandex.')) return 'Yandex';
    if (hostname.includes('duckduckgo.')) return 'DuckDuckGo';
    if (hostname.includes('baidu.')) return 'Baidu';
    return hostname.replace(/^www\./, '');
  } catch { return 'Unknown'; }
};

const asText = (value: any): string => (typeof value === 'string' && value.trim() ? value.trim() : '');
const toTitleCase = (value: string): string =>
  value.toLowerCase().split(/\s+/).filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

/** Parses file size string (e.g. "1.2 MB") to Megabytes. */
const parseToMB = (sizeStr: string): number => {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  if (unit === 'KB') return value / 1024;
  if (unit === 'MB') return value;
  if (unit === 'GB') return value * 1024;
  return value / (1024 * 1024);
};

const INITIAL_FILTERS: ActiveFilterState = {
  sources: [], tags: [], orientations: [], minWidth: '', maxWidth: '', minHeight: '', maxHeight: '', minSize: '', maxSize: ''
};

/** Custom hook to manage local filtering of search results. */
export function useLocalFilters(results: ImageResult[]) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilterState>({ ...INITIAL_FILTERS });

  const availableFilters = useMemo<AvailableFilters>(() => {
    const filters = { sources: new Set<string>(), tags: new Set<string>(), orientations: new Set<string>() };
    results.forEach((item) => {
      const rawSourceText = asText(item.search_engine) || detectSourceEngine(item.url);
      const source = toTitleCase(rawSourceText.replace(/[_-]+/g, ' '));
      if (source) filters.sources.add(source);
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => { if (typeof tag === 'string' && tag.trim()) filters.tags.add(tag.trim()); });
      }
      filters.orientations.add(item.width >= item.height ? 'Landscape' : 'Portrait');
    });
    return {
      sources: Array.from(filters.sources).sort(),
      tags: Array.from(filters.tags).sort(),
      orientations: ['Landscape', 'Portrait'].filter(o => filters.orientations.has(o))
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      if (activeFilters.sources.length > 0) {
        const rawSourceText = asText(item.search_engine) || detectSourceEngine(item.url);
        const source = toTitleCase(rawSourceText.replace(/[_-]+/g, ' '));
        if (!activeFilters.sources.includes(source)) return false;
      }
      if (activeFilters.tags.length > 0) {
        const itemTags = Array.isArray(item.tags) ? item.tags.map(t => typeof t === 'string' ? t.trim() : '') : [];
        if (!activeFilters.tags.some(tag => itemTags.includes(tag))) return false;
      }
      if (activeFilters.orientations.length > 0) {
        const orientation = item.width >= item.height ? 'Landscape' : 'Portrait';
        if (!activeFilters.orientations.includes(orientation)) return false;
      }
      if (activeFilters.minWidth && item.width < parseInt(activeFilters.minWidth, 10)) return false;
      if (activeFilters.maxWidth && item.width > parseInt(activeFilters.maxWidth, 10)) return false;
      if (activeFilters.minHeight && item.height < parseInt(activeFilters.minHeight, 10)) return false;
      if (activeFilters.maxHeight && item.height > parseInt(activeFilters.maxHeight, 10)) return false;
      if (activeFilters.minSize || activeFilters.maxSize) {
        const itemMB = parseToMB(item.size);
        if (activeFilters.minSize && itemMB < parseFloat(activeFilters.minSize)) return false;
        if (activeFilters.maxSize && itemMB > parseFloat(activeFilters.maxSize)) return false;
      }
      return true;
    });
  }, [results, activeFilters]);

  const toggleFilter = useCallback((category: keyof Pick<ActiveFilterState, 'sources' | 'tags' | 'orientations'>, value: string) => {
    setActiveFilters(prev => {
      const categoryList = prev[category] as string[] || [];
      const isSelected = categoryList.includes(value);
      return { ...prev, [category]: isSelected ? categoryList.filter(item => item !== value) : [...categoryList, value] };
    });
  }, []);

  const setRangeFilter = useCallback((key: keyof ActiveFilterState, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => { setActiveFilters({ ...INITIAL_FILTERS }); }, []);

  const activeCount = useMemo(() => {
    let count = activeFilters.sources.length + activeFilters.tags.length + activeFilters.orientations.length;
    if (activeFilters.minWidth || activeFilters.maxWidth) count++;
    if (activeFilters.minHeight || activeFilters.maxHeight) count++;
    if (activeFilters.minSize || activeFilters.maxSize) count++;
    return count;
  }, [activeFilters]);

  return { filteredResults, availableFilters, activeFilters, toggleFilter, setRangeFilter, resetFilters, activeCount };
}
