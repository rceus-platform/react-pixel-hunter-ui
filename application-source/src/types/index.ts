/**
 * Global Type Definitions Module
 *
 * Responsibilities:
 * - Define shared interfaces and types for the entire application
 * - Ensure type consistency across features (Search, Filters, Gallery)
 *
 * Boundaries:
 * - Contains no executable logic
 * - External to feature-specific types
 */

export interface ImageResult {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  search_engine: string;
  width: number;
  height: number;
  size: string;
  description?: string;
  tags?: string[];
}

export interface SearchFormState {
  query: string;
  engines: string[];
  min_width: number;
  min_height: number;
  four_k_only: boolean;
  orientation: 'any' | 'portrait' | 'landscape';
  remove_duplicates: boolean;
  allow_unverified: boolean;
  pages: number;
  limit: number;
}

export type FilterChip = string;

export type SortOption = 'none' | 'size' | 'resolution';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
  option: SortOption;
  order: SortOrder;
}

export interface AvailableFilters {
  sources: string[];
  tags: string[];
  orientations: string[];
}

export interface ActiveFilterState {
  sources: string[];
  tags: string[];
  orientations: string[];
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  minSize: string;
  maxSize: string;
}
