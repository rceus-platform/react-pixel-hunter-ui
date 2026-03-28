import React, { useEffect, useState } from 'react';
import { ImageResult } from '../../../types';
import { ImageCard } from './ImageCard';
import styles from './ImageGrid.module.css';

const getColumnCap = (viewportWidth: number) => {
  if (viewportWidth < 480) return 1;
  if (viewportWidth < 768) return 2;
  if (viewportWidth < 1024) return 3;
  if (viewportWidth < 1366) return 4;
  return 5;
};

interface Props {
  results: ImageResult[];
  isLoading: boolean;
  error?: string;
  hasSearched: boolean;
  hoverExpandEnabled: boolean;
  viewMode: string;
  coverScale: number;
  visibleFields: Record<string, boolean>;
}

export const ImageGrid: React.FC<Props> = ({
  results,
  isLoading,
  error,
  hasSearched,
  hoverExpandEnabled,
  viewMode,
  coverScale,
  visibleFields
}) => {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        setViewportWidth(window.innerWidth);
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const preferredColumns = 5 - coverScale;
  const columns = Math.max(1, Math.min(preferredColumns, getColumnCap(viewportWidth)));

  const containerClassName =
    viewMode === 'list'
      ? `${styles.grid} ${styles.listGrid}`
      : viewMode === 'moodboard'
        ? `${styles.grid} ${styles.moodboardGrid}`
        : `${styles.grid} ${styles.cardsGrid}`;

  const containerStyle =
    viewMode === 'list'
      ? undefined
      : viewMode === 'moodboard'
        ? {
            '--columns': columns,
            columnCount: columns,
            width: '100%',
            marginInline: '0'
          } as React.CSSProperties
        : {
            '--columns': columns
          } as React.CSSProperties;

  const hasPartialResults = results.length > 0;
  const showStreamingNotice = isLoading && hasPartialResults;

  if (isLoading && !hasPartialResults) {
    return (
      <section>
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          <div className={styles.spinner} />
          <span>Streaming high-resolution images...</span>
        </div>
      </section>
    );
  }

  if (error && !hasPartialResults) {
    return (
      <section className={styles.stateCard} role="alert">
        <h2>Search failed</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (hasSearched && !isLoading && results.length === 0) {
    return (
      <section className={styles.stateCard}>
        <h2>No images found</h2>
        <p>Try a broader query or lower minimum resolution filters.</p>
      </section>
    );
  }

  if (!hasSearched) {
    return (
      <section className={styles.stateCard}>
        <h2>Ready to hunt pixels</h2>
        <p>Run a search to discover HD and 4K images.</p>
      </section>
    );
  }

  return (
    <>
      {showStreamingNotice ? (
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          <div className={styles.spinner} />
          <span>Streaming results... {results.length} loaded</span>
        </div>
      ) : null}

      {error && hasPartialResults ? (
        <div className={`${styles.stateCard} ${styles.warningCard}`} role="alert">
          <h2>Stream interrupted</h2>
          <p>{error}</p>
        </div>
      ) : null}

      <section className={containerClassName} style={containerStyle}>
        {results.map((item, index) => (
          <ImageCard
            key={`${item.url}-${item.width}-${item.height}-${index}`}
            result={item}
            hoverExpandEnabled={hoverExpandEnabled}
            viewMode={viewMode}
            coverScale={coverScale}
            visibleFields={visibleFields}
          />
        ))}
      </section>
    </>
  );
};
