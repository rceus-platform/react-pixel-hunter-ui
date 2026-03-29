/**
 * Root Application Module
 *
 * Responsibilities:
 * - Orchestrate search, gallery, and filter features
 * - Manage global view settings (hover expand, view mode, cover scale, visible fields)
 * - Persist user preferences to local storage
 *
 * Boundaries:
 * - No direct API calls (uses feature hooks)
 * - No feature-specific business logic
 */

import React, { useEffect, useState } from 'react';
import { SearchForm, useSearchState } from '../features/search';
import { ImageGrid, ResultsSummary } from '../features/gallery';
import { useLocalFilters } from '../features/filters';
import { getActiveFilterChips } from '../utils/queryParams';
import { PasscodeOverlay } from '../features/auth/PasscodeOverlay';
import styles from './App.module.css';

/** Root Application component. */
export const App: React.FC = () => {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(() => {
    const defaults = {
      cover: true, title: true, source: true, searchEngine: true, note: true, description: false, highlights: true, tags: true
    };
    const stored = window.localStorage.getItem('pixel_hunter_visible_fields');
    if (!stored) return defaults;
    try { return { ...defaults, ...JSON.parse(stored) }; } catch { return defaults; }
  });

  const [hoverExpandEnabled, setHoverExpandEnabled] = useState(false);

  const [viewMode, setViewMode] = useState<string>(() => {
    const stored = window.localStorage.getItem('pixel_hunter_view_mode');
    return stored || 'moodboard';
  });

  const [coverScale, setCoverScale] = useState(() => {
    const stored = parseInt(window.localStorage.getItem('pixel_hunter_cover_scale') || '0', 10);
    return Number.isInteger(stored) ? Math.min(4, Math.max(0, stored)) : 0;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return window.localStorage.getItem('pixel_hunter_auth') === 'true';
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const handleVerify = (pin: string) => {
    const expectedPin = import.meta.env.SITE_PASSCODE;
    if (pin === expectedPin) {
      setIsAuthenticated(true);
      window.localStorage.setItem('pixel_hunter_auth', 'true');
      setAuthError(null);
    } else {
      setAuthError('Invalid passcode. Please try again.');
    }
  };

  const {
    form, setForm, appliedForm, results, isLoading, error, hasSearched, wasLastResultFromCache, runSearch, stopSearch, resetAll
  } = useSearchState();

  const { 
    filteredResults, availableFilters, activeFilters, toggleFilter, setRangeFilter, resetFilters: resetLocalFilters, activeCount: activeFilterCount 
  } = useLocalFilters(results);

  const chips = getActiveFilterChips(appliedForm);

  useEffect(() => { window.localStorage.setItem('pixel_hunter_hover_expand', String(hoverExpandEnabled)); }, [hoverExpandEnabled]);
  useEffect(() => { window.localStorage.setItem('pixel_hunter_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { window.localStorage.setItem('pixel_hunter_cover_scale', String(coverScale)); }, [coverScale]);
  useEffect(() => { window.localStorage.setItem('pixel_hunter_visible_fields', JSON.stringify(visibleFields)); }, [visibleFields]);

  return (
    <div className={styles.page}>
      {!isAuthenticated && (
        <PasscodeOverlay onVerify={handleVerify} error={authError} />
      )}
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Pixel Hunter Pro</p>
        <h1>Find crisp HD wallpapers in seconds</h1>
        <p className={styles.subtitle}>Search across multiple engines with precise filters for resolution, orientation, and quality.</p>
      </header>

      <main className={styles.main}>
        <SearchForm form={form} setForm={setForm} onSubmit={runSearch} onStop={stopSearch} onReset={resetAll} disabled={isLoading} />

        {hasSearched && (!isLoading || results.length > 0) && (
          <ResultsSummary
            count={results.length}
            filteredCount={filteredResults.length}
            chips={chips}
            wasLastResultFromCache={wasLastResultFromCache}
            hoverExpandEnabled={hoverExpandEnabled}
            setHoverExpandEnabled={setHoverExpandEnabled}
            viewMode={viewMode}
            setViewMode={setViewMode}
            coverScale={coverScale}
            setCoverScale={setCoverScale}
            visibleFields={visibleFields}
            setVisibleFields={setVisibleFields}
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            setRangeFilter={setRangeFilter}
            resetLocalFilters={resetLocalFilters}
            activeFilterCount={activeFilterCount}
          />
        )}

        <ImageGrid
          results={filteredResults}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          hoverExpandEnabled={hoverExpandEnabled}
          viewMode={viewMode}
          coverScale={coverScale}
          visibleFields={visibleFields}
        />
      </main>
    </div>
  );
};
