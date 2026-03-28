/**
 * API Client Module
 *
 * Responsibilities:
 * - Centralized Axios instance configuration
 * - Default headers and base URL management
 * - Common error parsing logic
 */

import axios from 'axios';

/** Centralized API client using Axios. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

/** Extract error message from Axios response or generic error object. */
export const getApiErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (error.response?.status) return `Request failed with status ${error.response.status}`;
    return error.message || 'Network error occurred.';
  }
  return error?.message || 'Something went wrong.';
};
