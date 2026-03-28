import { useEffect, useRef } from 'react';
import styles from './LocalFilterPopup.module.css';

export default function LocalFilterPopup({ 
  availableFilters, 
  activeFilters, 
  toggleFilter, 
  setRangeFilter, 
  resetFilters,
  onClose,
  activeCount
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickAway = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [onClose]);

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <h3 className={styles.title}>Filter Results</h3>
          {activeCount > 0 && (
            <span style={{ 
              background: '#0ea5e9', 
              color: 'white', 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              borderRadius: '99px',
              fontWeight: '700'
            }}>
              {activeCount}
            </span>
          )}
        </div>
        <button type="button" className={styles.resetButton} onClick={resetFilters}>Reset</button>
      </div>

      <div className={styles.scrollArea}>
        {/* Orientation */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Orientation</p>
          <div className={styles.checkboxGrid}>
            {availableFilters.orientations.map(opt => (
              <label key={opt} className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={activeFilters.orientations.includes(opt)}
                  onChange={() => toggleFilter('orientations', opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Sources</p>
          <div className={styles.scrollBox} style={{ maxHeight: '100px', overflowY: 'auto' }}>
            <div className={styles.checkboxGrid}>
              {availableFilters.sources.map(opt => (
                <label key={opt} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={activeFilters.sources.includes(opt)}
                    onChange={() => toggleFilter('sources', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Resolution Range */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Resolution (px)</p>
          <div className={styles.rangeRow}>
            <div className={styles.rangeGroup}>
              <span>Width</span>
              <div className={styles.inputs}>
                <input 
                  type="number" placeholder="Min" 
                  value={activeFilters.minWidth} 
                  onChange={(e) => setRangeFilter('minWidth', e.target.value)}
                />
                <input 
                  type="number" placeholder="Max" 
                  value={activeFilters.maxWidth} 
                  onChange={(e) => setRangeFilter('maxWidth', e.target.value)}
                />
              </div>
            </div>
            <div className={styles.rangeGroup}>
              <span>Height</span>
              <div className={styles.inputs}>
                <input 
                  type="number" placeholder="Min" 
                  value={activeFilters.minHeight} 
                  onChange={(e) => setRangeFilter('minHeight', e.target.value)}
                />
                <input 
                  type="number" placeholder="Max" 
                  value={activeFilters.maxHeight} 
                  onChange={(e) => setRangeFilter('maxHeight', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* File Size Range */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>File Size (MB)</p>
          <div className={styles.inputs}>
            <input 
              type="number" step="0.1" placeholder="Min MB" 
              value={activeFilters.minSize} 
              onChange={(e) => setRangeFilter('minSize', e.target.value)}
            />
            <input 
              type="number" step="0.1" placeholder="Max MB" 
              value={activeFilters.maxSize} 
              onChange={(e) => setRangeFilter('maxSize', e.target.value)}
            />
          </div>
        </div>

        {/* Tags */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Tags</p>
          <div className={styles.tagList}>
            {availableFilters.tags.length > 0 ? (
              availableFilters.tags.map(tag => (
                <label key={tag} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={activeFilters.tags.includes(tag)}
                    onChange={() => toggleFilter('tags', tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No tags found in results</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
