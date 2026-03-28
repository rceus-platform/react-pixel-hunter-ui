/**
 * Query Parameters Test Module
 *
 * Responsibilities:
 * - Unit test the serialization and sanitization of search query parameters
 * - Verify bounds enforcement for pages and result limits
 *
 * Boundaries:
 * - No browser/DOM dependencies (pure logic tests)
 */

import { describe, it, expect } from 'vitest';
import { parseSearchParamsToForm, buildSearchParams, sanitizeBeforeSubmit, DEFAULT_FORM } from './queryParams';

describe('queryParams', () => {
  describe('parseSearchParamsToForm', () => {
    it('should parse basic query', () => {
      const form = parseSearchParamsToForm('?query=test');
      expect(form.query).toBe('test');
    });

    it('should parse engines', () => {
      const form = parseSearchParamsToForm('?engines=google,bing');
      expect(form.engines).toEqual(['google', 'bing']);
    });

    it('should handle "all" engine', () => {
      const form = parseSearchParamsToForm('?engines=all');
      expect(form.engines).toEqual(['all']);
    });

    it('should use defaults for empty search', () => {
      const form = parseSearchParamsToForm('');
      expect(form).toEqual(DEFAULT_FORM);
    });
  });

  describe('buildSearchParams', () => {
    it('should build string from form', () => {
      const form = { ...DEFAULT_FORM, query: 'hello' };
      const params = buildSearchParams(form);
      expect(params.get('query')).toBe('hello');
    });
  });

  describe('sanitizeBeforeSubmit', () => {
    it('should trim query', () => {
      const form = { ...DEFAULT_FORM, query: '  hello  ' };
      const sanitized = sanitizeBeforeSubmit(form);
      expect(sanitized.query).toBe('hello');
    });

    it('should enforce bounds for pages and limit', () => {
      const form = { ...DEFAULT_FORM, pages: 100, limit: 500 };
      const sanitized = sanitizeBeforeSubmit(form);
      expect(sanitized.pages).toBe(50);
      expect(sanitized.limit).toBe(200);
    });
  });
});
