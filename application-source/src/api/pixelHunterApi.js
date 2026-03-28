const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const searchImages = async (params, signal) => {
  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    method: 'GET',
    signal
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();
  if (!Array.isArray(data?.results)) {
    throw new Error('Invalid response shape from backend.');
  }

  return data;
};

const parseNdjsonChunk = (chunk, onItem) => {
  let parsedCount = 0;

  for (const rawLine of chunk.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    onItem(JSON.parse(line));
    parsedCount += 1;
  }

  return parsedCount;
};

export const searchImagesStream = async (params, { signal, onItem }) => {
  const response = await fetch(`${API_BASE_URL}/search/stream?${params.toString()}`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/x-ndjson, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/x-ndjson')) {
    const data = await response.json();
    if (!Array.isArray(data?.results)) {
      throw new Error('Invalid response shape from backend.');
    }
    data.results.forEach((item) => onItem(item));
    return { count: data.results.length };
  }

  if (!response.body) {
    throw new Error('Streaming is not supported by this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let count = 0;

  while (true) {
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

export const getDownloadUrl = (imageUrl) => {
  const params = new URLSearchParams({ url: imageUrl });
  return `${API_BASE_URL}/download?${params.toString()}`;
};

export const stopSearchStream = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/search/stream/stop`, {
      method: 'POST'
    });
    if (!response.ok) {
      console.error('Failed to stop stream');
    }
  } catch (error) {
    console.error('Network error when attempting to stop stream', error);
  }
};

