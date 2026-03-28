/**
 * Search State Hook Module
 *
 * Responsibilities:
 * - Manage search form state, results streaming, and query caching.
 * - Provide unified interface for search lifecycle actions.
 *
 * Boundaries:
 * - No UI logic or gallery settings persistence (handled in App).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchImagesStream, stopSearchStream } from '../services/searchService';
import {
  DEFAULT_FORM,
  buildSearchParams,
  parseSearchParamsToForm,
  sanitizeBeforeSubmit
} from '../../../utils/queryParams';
import { ImageResult, SearchFormState } from '../../../types';

const QUERY_REQUIRED_MESSAGE = 'Please enter a search query.';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const MAX_CACHEABLE_RESULTS = 500;
const CACHE_STORAGE_KEY = 'pixel_hunter_search_cache_v1';
const SHOULD_PERSIST_CACHE =
  import.meta.env.DEV && (import.meta.env.VITE_PERSIST_SEARCH_CACHE ?? 'true') === 'true';

interface CacheEntry {
  timestamp: number;
  results: ImageResult[];
}

/** Hydrates search cache from local storage. */
const hydrateCacheFromStorage = (): Map<string, CacheEntry> => {
  if (!SHOULD_PERSIST_CACHE) return new Map();
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as [string, CacheEntry][];
    if (!Array.isArray(parsed)) return new Map();
    const now = Date.now();
    const hydrated = parsed.filter(([key, value]) => {
      const validKey = typeof key === 'string' && key.length > 0;
      const validValue =
        value &&
        typeof value.timestamp === 'number' &&
        now - value.timestamp <= CACHE_TTL_MS &&
        Array.isArray(value.results);
      return validKey && validValue;
    });
    return new Map(hydrated.slice(-MAX_CACHE_ENTRIES));
  } catch {
    return new Map();
  }
};

/** Custom hook to manage search state, streaming, and results caching. */
export const useSearchState = () => {
  const [form, setForm] = useState<SearchFormState>(() => parseSearchParamsToForm(window.location.search));
  const [appliedForm, setAppliedForm] = useState<SearchFormState>(() => parseSearchParamsToForm(window.location.search));
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [wasLastResultFromCache, setWasLastResultFromCache] = useState(false);

  const activeControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(hydrateCacheFromStorage());
  const flushFrameRef = useRef<number | null>(null);

  const clearPendingFlush = useCallback(() => {
    if (flushFrameRef.current !== null) {
      window.cancelAnimationFrame(flushFrameRef.current);
      flushFrameRef.current = null;
    }
  }, []);

  const persistCache = useCallback(() => {
    if (!SHOULD_PERSIST_CACHE) return;
    try {
      const entries = Array.from(cacheRef.current.entries());
      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
    } catch { /* suppress */ }
  }, []);

  const getCachedResults = useCallback((cacheKey: string): ImageResult[] | null => {
    const entry = cacheRef.current.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      cacheRef.current.delete(cacheKey);
      persistCache();
      return null;
    }
    return entry.results;
  }, [persistCache]);

  const setCachedResults = useCallback((cacheKey: string, cachedResults: ImageResult[]) => {
    if (cacheRef.current.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cacheRef.current.keys().next().value;
      if (oldestKey) cacheRef.current.delete(oldestKey);
    }
    cacheRef.current.set(cacheKey, { timestamp: Date.now(), results: cachedResults });
    persistCache();
  }, [persistCache]);

  const runSearch = useCallback(async (rawForm: SearchFormState) => {
    const preparedForm = sanitizeBeforeSubmit(rawForm);
    if (!preparedForm.query) {
      setError(QUERY_REQUIRED_MESSAGE);
      setResults([]);
      setHasSearched(false);
      setWasLastResultFromCache(false);
      return;
    }

    setForm(preparedForm);
    setAppliedForm(preparedForm);
    const params = buildSearchParams(preparedForm);
    const cacheKey = params.toString();
    window.history.replaceState({}, '', `?${params.toString()}`);

    const cachedResults = getCachedResults(cacheKey);
    if (cachedResults) {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
      setError('');
      setResults(cachedResults);
      setHasSearched(true);
      setIsLoading(false);
      setWasLastResultFromCache(true);
      return;
    }

    if (activeControllerRef.current) activeControllerRef.current.abort();
    clearPendingFlush();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setWasLastResultFromCache(false);
    setResults([]);

    const streamedResults: ImageResult[] = [];
    let pendingResults: ImageResult[] = [];

    const flushPendingResults = () => {
      if (!pendingResults.length) return;
      streamedResults.push(...pendingResults);
      pendingResults = [];
      setResults(streamedResults.slice());
    };

    const scheduleFlush = () => {
      if (flushFrameRef.current !== null) return;
      flushFrameRef.current = window.requestAnimationFrame(() => {
        flushFrameRef.current = null;
        flushPendingResults();
      });
    };

    try {
      await searchImagesStream(params, {
        signal: controller.signal,
        onItem: (item: ImageResult) => {
          pendingResults.push(item);
          if (pendingResults.length >= 20) {
            clearPendingFlush();
            flushPendingResults();
            return;
          }
          scheduleFlush();
        }
      });
      clearPendingFlush();
      flushPendingResults();

      const shouldCacheQuery = preparedForm.pages > 0 && preparedForm.limit > 0;
      if (shouldCacheQuery && streamedResults.length <= MAX_CACHEABLE_RESULTS) {
        setCachedResults(cacheKey, streamedResults);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      clearPendingFlush();
      flushPendingResults();
      if (streamedResults.length) {
        setError(err.message || 'Streaming interrupted before all results were loaded.');
      } else {
        setResults([]);
        setError(err.message || 'Something went wrong while searching.');
      }
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        clearPendingFlush();
        setIsLoading(false);
      }
    }
  }, [clearPendingFlush, getCachedResults, setCachedResults]);

  const stopSearch = useCallback(async () => {
    if (activeControllerRef.current) activeControllerRef.current.abort();
    setIsLoading(false);
    await stopSearchStream();
  }, []);

  const resetAll = useCallback(() => {
    if (activeControllerRef.current) activeControllerRef.current.abort();
    clearPendingFlush();
    setForm(DEFAULT_FORM);
    setAppliedForm(DEFAULT_FORM);
    setResults([]);
    setError('');
    setHasSearched(false);
    setWasLastResultFromCache(false);
    window.history.replaceState({}, '', window.location.pathname);
  }, [clearPendingFlush]);

  useEffect(() => {
    const initial = parseSearchParamsToForm(window.location.search);
    setForm(initial);
    setAppliedForm(initial);
    if (initial.query.trim()) runSearch(initial);
  }, [runSearch]);

  useEffect(() => {
    return () => {
      if (activeControllerRef.current) activeControllerRef.current.abort();
      clearPendingFlush();
    };
  }, [clearPendingFlush]);

  return { form, setForm, appliedForm, results, isLoading, error, hasSearched, wasLastResultFromCache, runSearch, stopSearch, resetAll };
};
