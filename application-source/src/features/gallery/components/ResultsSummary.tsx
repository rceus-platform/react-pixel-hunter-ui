import React, { useEffect, useRef, useState } from 'react';
import { ActiveFilterState, AvailableFilters, FilterChip } from '../../../types';
import { LocalFilterPopup } from '../../filters';
import styles from './ResultsSummary.module.css';

const VIEW_OPTIONS = [
  { value: 'list', label: 'List' },
  { value: 'cards', label: 'Cards' },
  { value: 'moodboard', label: 'Moodboard' }
] as const;

const FIELD_OPTIONS = [
  { key: 'cover', label: 'Cover' },
  { key: 'title', label: 'Title' },
  { key: 'source', label: 'Source' },
  { key: 'searchEngine', label: 'Search Engine' },
  { key: 'note', label: 'Note' },
  { key: 'description', label: 'Description' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'tags', label: 'Tags' }
] as const;

function ViewIcon({ mode }: { mode: string }) {
  if (mode === 'list') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }

  if (mode === 'moodboard') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

interface Props {
  count: number;
  filteredCount: number;
  chips: string[];
  wasLastResultFromCache: boolean;
  hoverExpandEnabled: boolean;
  setHoverExpandEnabled: (enabled: boolean) => void;
  viewMode: string;
  setViewMode: (mode: 'cards' | 'compact' | string) => void;
  coverScale: number;
  setCoverScale: (scale: number) => void;
  visibleFields: Record<string, boolean>;
  setVisibleFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  availableFilters: AvailableFilters;
  activeFilters: ActiveFilterState;
  toggleFilter: (category: keyof Pick<ActiveFilterState, 'sources' | 'tags' | 'orientations'>, value: string) => void;
  setRangeFilter: (key: keyof ActiveFilterState, value: string) => void;
  resetLocalFilters: () => void;
  activeFilterCount: number;
}

export const ResultsSummary: React.FC<Props> = ({
  count,
  filteredCount,
  chips,
  wasLastResultFromCache,
  hoverExpandEnabled,
  setHoverExpandEnabled,
  viewMode,
  setViewMode,
  coverScale,
  setCoverScale,
  visibleFields,
  setVisibleFields,
  availableFilters,
  activeFilters,
  toggleFilter,
  setRangeFilter,
  resetLocalFilters,
  activeFilterCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeViewLabel = VIEW_OPTIONS.find((option) => option.value === viewMode)?.label ?? 'Moodboard';
  
  const toggleField = (key: string, checked: boolean) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: checked
    }));
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickAway = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isOpen]);

  return (
    <section className={styles.summary} aria-live="polite">
      <div className={styles.row}>
        <p className={styles.count}>
          Found {count} result{count === 1 ? '' : 's'}
          {filteredCount !== undefined && filteredCount !== count ? ` (${filteredCount} filtered)` : ''}
        </p>
        {wasLastResultFromCache ? <span className={styles.cacheBadge}>From cache</span> : null}
        <div className={styles.chips}>
          {chips.map((chip, index) => (
            <span className={styles.chip} key={typeof chip === 'string' ? chip : index}>
              {typeof chip === 'string' ? chip : String(chip)}
            </span>
          ))}
        </div>
        <label className={styles.inlineToggle}>
          <span className={styles.toggleText}>Hover Expand</span>
          <input
            className={styles.toggleInput}
            type="checkbox"
            checked={hoverExpandEnabled}
            onChange={(event) => setHoverExpandEnabled(event.target.checked)}
          />
          <span className={styles.toggleTrack} aria-hidden="true">
            <span className={styles.toggleThumb} />
          </span>
        </label>

        <div className={styles.viewControl} ref={panelRef}>
          <button
            type="button"
            className={styles.viewButton}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className={styles.viewButtonIcon}>
              <ViewIcon mode={viewMode} />
            </span>
            <span>{activeViewLabel}</span>
          </button>

          {isOpen ? (
            <div className={styles.panel} role="menu" aria-label="View settings">
              <p className={styles.panelTitle}>View</p>
              <div className={styles.optionList} role="radiogroup" aria-label="View mode">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.optionItem} ${viewMode === option.value ? styles.optionItemActive : ''}`}
                    role="radio"
                    aria-checked={viewMode === option.value}
                    onClick={() => setViewMode(option.value)}
                  >
                    <span className={styles.optionIcon}>
                      <ViewIcon mode={option.value} />
                    </span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.sliderWrap}>
                <label htmlFor="coverScale">Cover Size: {coverScale}</label>
                <input
                  id="coverScale"
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={coverScale}
                  onChange={(event) => setCoverScale(Number.parseInt(event.target.value, 10))}
                />
                <p className={styles.hint}>Columns: {5 - coverScale}</p>
              </div>

              <div className={styles.fieldsWrap}>
                <p className={styles.fieldsTitle}>Show in {activeViewLabel}</p>
                <div className={styles.fieldList}>
                  {FIELD_OPTIONS.map((field) => (
                    <label key={field.key} className={styles.fieldOption}>
                      <input
                        type="checkbox"
                        checked={Boolean(visibleFields[field.key])}
                        onChange={(event) => toggleField(field.key, event.target.checked)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.viewControl} ref={filterRef}>
          <button
            type="button"
            className={`${styles.viewButton} ${activeFilterCount > 0 ? styles.filterButtonActive : ''}`}
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            aria-expanded={isFiltersOpen}
            aria-haspopup="true"
          >
            <span className={styles.viewButtonIcon}>
              <FilterIcon />
            </span>
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          {isFiltersOpen ? (
            <LocalFilterPopup
              availableFilters={availableFilters}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              setRangeFilter={setRangeFilter}
              resetFilters={resetLocalFilters}
              onClose={() => setIsFiltersOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};
