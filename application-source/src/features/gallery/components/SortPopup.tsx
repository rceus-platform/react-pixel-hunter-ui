import React, { useEffect, useRef } from 'react';
import { SortOption, SortOrder, SortState } from '../../../types';
import styles from './SortPopup.module.css';

interface Props {
  sortState: SortState;
  onSortOptionChange: (option: SortOption) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onClose: () => void;
}

export const SortPopup: React.FC<Props> = ({
  sortState,
  onSortOptionChange,
  onSortOrderChange,
  onClose
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [onClose]);

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sort Results</h3>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Sort By</p>
        <div className={styles.optionList}>
          {(['none', 'size', 'resolution'] as const).map((option) => (
            <label key={option} className={styles.optionLabel}>
              <input
                type="radio"
                name="sortOption"
                checked={sortState.option === option}
                onChange={() => onSortOptionChange(option)}
              />
              <span style={{ textTransform: 'capitalize' }}>
                {option === 'none' ? 'Original Order' : option}
              </span>
            </label>
          ))}
        </div>
      </div>

      {sortState.option !== 'none' && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Order</p>
          <div className={styles.orderToggle}>
            <button
              type="button"
              className={`${styles.orderButton} ${sortState.order === 'asc' ? styles.orderButtonActive : ''}`}
              onClick={() => onSortOrderChange('asc')}
            >
              Ascending
            </button>
            <button
              type="button"
              className={`${styles.orderButton} ${sortState.order === 'desc' ? styles.orderButtonActive : ''}`}
              onClick={() => onSortOrderChange('desc')}
            >
              Descending
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
