/**
 * Search Service Module
 *
 * Responsibilities:
 * - Execute image search queries and handle NDJSON streaming
 * - Map API responses to standard image result types
 *
 * Boundaries:
 * - No UI logic or local state management
 */

import { apiClient, getApiErrorMessage } from '../../../services/apiClient';
import { ImageResult } from '../../../types';

/** Standard non-streaming image search. */
export const searchImages = async (params: URLSearchParams, signal?: AbortSignal): Promise<{ results: ImageResult[] }> => {
  try {
    const response = await apiClient.get(`/search?${params.toString()}`, { signal });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

/** NDJSON Streaming image search using fetch for better browser stream support. */
export const searchImagesStream = async (
  params: URLSearchParams, 
  { signal, onItem }: { signal?: AbortSignal; onItem: (item: ImageResult) => void }
): Promise<{ count: number }> => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/search/stream?${params.toString()}`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/x-ndjson, application/json'
    }
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) message = data.detail;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/x-ndjson')) {
    const data = await response.json();
    data.results?.forEach((item: ImageResult) => onItem(item));
    return { count: data.results?.length || 0 };
  }

  if (!response.body) {
    throw new Error('Streaming is not supported by this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let count = 0;

  const parseNdjsonChunk = (chunk: string, callback: (item: ImageResult) => void) => {
    let internalCount = 0;
    for (const rawLine of chunk.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        callback(JSON.parse(line));
        internalCount += 1;
      } catch (e) {
        console.error('Failed to parse NDJSON line', e);
      }
    }
    return internalCount;
  };

  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      break;
    }
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    count += parseNdjsonChunk(lines.join('\n'), onItem);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    count += parseNdjsonChunk(buffer, onItem);
  }

  return { count };
};

/** Signals the backend to stop an active search stream. */
export const stopSearchStream = async (): Promise<void> => {
  try {
    await apiClient.post('/search/stream/stop');
  } catch (error) {
    console.error('Failed to stop stream', getApiErrorMessage(error));
  }
};

/** Generates a direct download URL for a given image. */
export const getDownloadUrl = (imageUrl: string): string => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const params = new URLSearchParams({ url: imageUrl });
  return `${API_BASE_URL}/download?${params.toString()}`;
};
