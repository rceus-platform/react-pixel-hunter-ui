import React, { useEffect, useRef, useState } from 'react';
import { ImageResult } from '../../../types';
import { getDownloadUrl } from '../../search';
import styles from './ImageCard.module.css';

const getThumbnailUrl = (imageUrl: string, viewMode: string) => {
  const normalized = imageUrl.replace(/^https?:\/\//, '');
  const params = new URLSearchParams({ url: normalized, q: '70', output: 'webp' });

  if (viewMode === 'moodboard') {
    params.set('w', '900');
    params.set('fit', 'inside');
  } else if (viewMode === 'list') {
    params.set('w', '520');
    params.set('h', '320');
    params.set('fit', 'inside');
  } else {
    params.set('w', '640');
    params.set('h', '360');
    params.set('fit', 'cover');
  }

  return `https://images.weserv.nl/?${params.toString()}`;
};

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 4h6v6m0-6-8 8M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const detectSourceEngine = (url: string) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('bing.')) return 'bing';
    if (hostname.includes('google.')) return 'google';
    if (hostname.includes('yandex.')) return 'yandex';
    if (hostname.includes('duckduckgo.')) return 'duckduckgo';
    if (hostname.includes('baidu.')) return 'baidu';

    return hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
};

const getTitleFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const raw = decodeURIComponent(pathname.split('/').pop() || '');
    const sanitized = raw.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[-_]+/g, ' ').trim();
    return sanitized || 'Untitled image';
  } catch {
    return 'Untitled image';
  }
};

const asText = (value: any) => (typeof value === 'string' && value.trim() ? value.trim() : '');
const asStringArray = (value: any) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);
const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const SEARCH_ENGINE_LABELS: Record<string, string> = {
  bing: 'Bing',
  google: 'Google',
  duckduckgo: 'DuckDuckGo',
  baidu: 'Baidu',
  yandex: 'Yandex',
};

interface Props {
  result: ImageResult;
  hoverExpandEnabled: boolean;
  viewMode: string;
  coverScale: number;
  visibleFields: Record<string, boolean>;
}

export const ImageCard: React.FC<Props> = ({ result, hoverExpandEnabled, viewMode, visibleFields }) => {
  const item = result;
  
  const isCardsView = viewMode === 'cards';
  const resolution = `${item.width}x${item.height}`;
  const size = asText(item.size);
  const coverUrl = asText(item.thumbnail) || asText((item as any).cover) || item.url;
  const source = asText(item.source) || detectSourceEngine(item.url);
  const searchEngineRaw = asText(item.search_engine) || detectSourceEngine(item.url);
  const normalizedSearchEngine = searchEngineRaw.trim().toLowerCase().replace(/^www\./, '').replace(/\..*$/, '');
  const searchEngine = SEARCH_ENGINE_LABELS[normalizedSearchEngine] || toTitleCase(searchEngineRaw.replace(/[_-]+/g, ' '));
  const rawTitle = asText(item.title) || getTitleFromUrl(item.url);
  const title = toTitleCase(rawTitle.replace(/[_-]+/g, ' '));
  const note = asText((item as any).note);
  const description = asText(item.description);
  const highlights = asStringArray((item as any).highlights);
  const tags = asStringArray(item.tags);

  const orientation = item.width >= item.height ? 'landscape' : 'portrait';
  const fallbackHighlights = [`${orientation}`, `${((item.width * item.height) / 1_000_000).toFixed(1)}MP`];
  const fallbackTags = [item.width >= 3840 ? '4k+' : 'hd', orientation];

  const [useOriginalImage, setUseOriginalImage] = useState(false);
  const [fullImageReady, setFullImageReady] = useState(false);
  const [isTimedExpanded, setIsTimedExpanded] = useState(false);
  const [expandShiftStyle, setExpandShiftStyle] = useState<React.CSSProperties>({});
  
  const collapseOnMoveRef = useRef<((event: PointerEvent) => void) | null>(null);
  const expandTargetRef = useRef<HTMLElement | null>(null);
  const preloadRef = useRef<HTMLImageElement | null>(null);
  const expandDelayTimerRef = useRef<number | null>(null);
  
  const imageSource = useOriginalImage ? coverUrl : getThumbnailUrl(coverUrl, viewMode);
  const activeImageSource = fullImageReady ? item.url : imageSource;
  const modeClassName =
    viewMode === 'list' ? styles.listCard : viewMode === 'moodboard' ? styles.moodboardCard : styles.cardsCard;
  const shouldExpand = hoverExpandEnabled;
  const SHIFT_DAMPING = 0.68;
  const MAX_SHIFT_X = 420;
  const MAX_SHIFT_Y = 260;
  const BASE_EXPAND_SCALE = 2.2;
  const MIN_EXPAND_SCALE = 1.65;
  const EDGE_SCALE_ZONE = 220;
  const VIEWPORT_GUTTER = 12;
  const MAX_EXPAND_SCALE = 7;

  const clearMoveListener = () => {
    if (collapseOnMoveRef.current) {
      window.removeEventListener('pointermove', collapseOnMoveRef.current);
      collapseOnMoveRef.current = null;
    }
  };

  const clearExpandDelayTimer = () => {
    if (expandDelayTimerRef.current) {
      window.clearTimeout(expandDelayTimerRef.current);
      expandDelayTimerRef.current = null;
    }
  };

  const preloadFullImage = () => {
    if (fullImageReady || preloadRef.current) return;

    const nextImage = new window.Image();
    preloadRef.current = nextImage;

    const finalize = () => {
      setFullImageReady(true);
      preloadRef.current = null;
    };

    const fail = () => {
      preloadRef.current = null;
    };

    nextImage.onload = finalize;
    nextImage.onerror = fail;
    nextImage.src = item.url;

    if (typeof nextImage.decode === 'function') {
      nextImage.decode().then(finalize).catch(() => {});
    }
  };

  const collapseExpandedPreview = () => {
    clearExpandDelayTimer();
    setIsTimedExpanded(false);
    setExpandShiftStyle({});
    expandTargetRef.current = null;
    clearMoveListener();
  };

  const handleThumbnailEnter = (element: HTMLElement) => {
    if (!hoverExpandEnabled) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    preloadFullImage();
    clearExpandDelayTimer();

    expandDelayTimerRef.current = window.setTimeout(() => {
      clearMoveListener();
      expandTargetRef.current = element;
      setIsTimedExpanded(true);

      const handlePointerMove = (event: PointerEvent) => {
        const target = expandTargetRef.current;
        if (!target) {
          collapseExpandedPreview();
          return;
        }

        const rect = target.getBoundingClientRect();
        const insideExpandedArea =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (!insideExpandedArea) {
          collapseExpandedPreview();
        }
      };

      collapseOnMoveRef.current = handlePointerMove;
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      expandDelayTimerRef.current = null;
    }, 1000);
  };

  const handleThumbnailLeave = () => {
    clearExpandDelayTimer();
  };

  const handleThumbnailAnchorEnter = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalEdgeDistance = Math.min(rect.left, viewportWidth - rect.right);
    const verticalEdgeDistance = Math.min(rect.top, viewportHeight - rect.bottom);
    const nearestEdgeDistance = Math.min(horizontalEdgeDistance, verticalEdgeDistance);
    const edgeScaleFactor = Math.max(0, Math.min(1, nearestEdgeDistance / EDGE_SCALE_ZONE));
    const edgePreferredScale = MIN_EXPAND_SCALE + (BASE_EXPAND_SCALE - MIN_EXPAND_SCALE) * edgeScaleFactor;
    const fitScaleX = rect.width > 0 ? (viewportWidth - VIEWPORT_GUTTER * 2) / rect.width : edgePreferredScale;
    const fitScaleY = rect.height > 0 ? (viewportHeight - VIEWPORT_GUTTER * 2) / rect.height : edgePreferredScale;
    const viewportFitScale = Math.min(fitScaleX, fitScaleY);
    const expandScale = Math.max(edgePreferredScale, Math.min(MAX_EXPAND_SCALE, viewportFitScale));
    const rawShiftX = viewportWidth / 2 - (rect.left + rect.width / 2);
    const rawShiftY = viewportHeight / 2 - (rect.top + rect.height / 2);

    const preferredShiftX = Math.max(-MAX_SHIFT_X, Math.min(MAX_SHIFT_X, rawShiftX * SHIFT_DAMPING));
    const preferredShiftY = Math.max(-MAX_SHIFT_Y, Math.min(MAX_SHIFT_Y, rawShiftY * SHIFT_DAMPING));

    const expandDeltaX = (rect.width * expandScale - rect.width) / 2;
    const expandDeltaY = (rect.height * expandScale - rect.height) / 2;

    const minShiftX = VIEWPORT_GUTTER - rect.left + expandDeltaX;
    const maxShiftX = viewportWidth - VIEWPORT_GUTTER - rect.right - expandDeltaX;
    const minShiftY = VIEWPORT_GUTTER - rect.top + expandDeltaY;
    const maxShiftY = viewportHeight - VIEWPORT_GUTTER - rect.bottom - expandDeltaY;

    const boundedShiftX = minShiftX <= maxShiftX ? Math.min(Math.max(preferredShiftX, minShiftX), maxShiftX) : 0;
    const boundedShiftY = minShiftY <= maxShiftY ? Math.min(Math.max(preferredShiftY, minShiftY), maxShiftY) : 0;
    const shiftX = Number.isFinite(boundedShiftX) ? boundedShiftX : 0;
    const shiftY = Number.isFinite(boundedShiftY) ? boundedShiftY : 0;

    setExpandShiftStyle({
      '--expand-shift-x': `${shiftX}px`,
      '--expand-shift-y': `${shiftY}px`,
      '--expand-scale': expandScale.toFixed(3)
    } as React.CSSProperties);

    window.requestAnimationFrame(() => {
      handleThumbnailEnter(element);
    });
  };

  useEffect(() => {
    return () => {
      clearExpandDelayTimer();
      clearMoveListener();
    };
  }, []);

  useEffect(() => {
    setFullImageReady(false);
    preloadRef.current = null;
  }, [item.url]);

  useEffect(() => {
    if (hoverExpandEnabled) return;
    collapseExpandedPreview();
  }, [hoverExpandEnabled]);

  const highlightsToShow = highlights.length ? highlights : fallbackHighlights;
  const tagsToShow = tags.length ? tags : fallbackTags;

  const showDetails =
    visibleFields.title ||
    visibleFields.source ||
    visibleFields.searchEngine ||
    visibleFields.note ||
    visibleFields.description ||
    visibleFields.highlights ||
    visibleFields.tags;

  const detailsNode = showDetails ? (
    <div className={styles.infoBlock}>
      {visibleFields.title ? (
        <>
          <p className={styles.infoTitle} title={title}>
            {title}
          </p>
          <div className={styles.titleDivider} />
        </>
      ) : null}

      {visibleFields.source ? (
        <p className={styles.infoLine}>
          <span className={styles.infoKey}>Source:</span>
          <span className={styles.infoValue} title={source}>
            {source}
          </span>
        </p>
      ) : null}

      {visibleFields.searchEngine ? (
        <p className={styles.infoLine}>
          <span className={styles.infoKey}>Search Engine:</span>
          <span className={styles.infoValue} title={searchEngine}>
            {searchEngine}
          </span>
        </p>
      ) : null}

      {visibleFields.note && note ? (
        <p className={styles.infoLine}>
          <span className={styles.infoKey}>Note:</span>
          <span className={styles.infoValue} title={note}>
            {note}
          </span>
        </p>
      ) : null}

      {visibleFields.description && description ? (
        <p className={styles.infoLine}>
          <span className={styles.infoKey}>Description:</span>
          <span className={styles.infoValue} title={description}>
            {description}
          </span>
        </p>
      ) : null}

      {visibleFields.highlights ? (
        <p className={styles.infoLine}>
          <span className={styles.infoKey}>Highlights:</span>
          <span className={styles.infoValue} title={highlightsToShow.join(' • ')}>
            {highlightsToShow.join(' • ')}
          </span>
        </p>
      ) : null}

      {visibleFields.tags ? (
        <div className={styles.tagsRow}>
          <span className={styles.infoKey}>Tags:</span>
          <div className={styles.tagsWrap} title={tagsToShow.join(', ')}>
            {tagsToShow.map((tag) => (
              <span key={tag} className={styles.tagChip}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  ) : null;

  const actionsNode = (
    <div className={styles.iconActions}>
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className={styles.iconButton}
        aria-label="Open full image in new tab"
        title="Open image"
      >
        <OpenIcon />
      </a>
      <a
        href={getDownloadUrl(item.url)}
        target="_blank"
        rel="noreferrer"
        className={styles.iconButton}
        aria-label="Download image using backend endpoint"
        title="Download image"
      >
        <DownloadIcon />
      </a>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <article className={`${styles.card} ${styles.listCard} ${!visibleFields.cover ? styles.noCover : ''}`}>
        {isTimedExpanded && shouldExpand ? <div className={styles.expandBackdrop} aria-hidden="true" /> : null}
        {visibleFields.cover ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className={`${styles.listCover} ${styles.expandTarget} ${isTimedExpanded ? styles.expandActive : ''}`}
            style={expandShiftStyle}
            onMouseEnter={(event) => handleThumbnailAnchorEnter(event.currentTarget)}
            onMouseLeave={handleThumbnailLeave}
          >
            <img
              className={styles.listImage}
              src={activeImageSource}
              alt={`Result image ${resolution}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => {
                if (!useOriginalImage) setUseOriginalImage(true);
              }}
            />
          </a>
        ) : null}

        <div className={styles.listContent}>{detailsNode}</div>

        <aside className={styles.listMeta}>
          <div className={styles.listMetaTop}>
            <span className={styles.badge}>{resolution}</span>
            {size ? <span className={styles.sizeBadge}>{size}</span> : null}
            {(item as any).unverified ? <span className={styles.warningBadge}>Unverified</span> : null}
          </div>
          {actionsNode}
        </aside>
      </article>
    );
  }

  return (
    <article
      className={`${styles.card} ${modeClassName} ${isCardsView ? styles.compactCard : ''} ${
        isTimedExpanded ? styles.expandedCard : ''
      } ${
        !visibleFields.cover ? styles.noCover : ''
      } ${
        shouldExpand ? styles.expandOnHover : ''
      }`}
    >
      {isTimedExpanded && shouldExpand ? <div className={styles.expandBackdrop} aria-hidden="true" /> : null}
      {visibleFields.cover ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className={`${styles.link} ${styles.expandTarget} ${isTimedExpanded ? styles.expandActive : ''}`}
          style={expandShiftStyle}
          onMouseEnter={(event) => handleThumbnailAnchorEnter(event.currentTarget)}
          onMouseLeave={handleThumbnailLeave}
        >
          <img
            className={styles.image}
            src={activeImageSource}
            alt={`Result image ${resolution}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              if (!useOriginalImage) setUseOriginalImage(true);
            }}
          />
        </a>
      ) : null}

      <div className={styles.metaRow}>
        <div className={styles.metaCluster}>
          <span className={styles.badge}>{resolution}</span>
          {size ? <span className={styles.sizeBadge}>{size}</span> : null}
          {(item as any).unverified ? <span className={styles.warningBadge}>Unverified</span> : null}
        </div>
        {actionsNode}
      </div>

      {detailsNode}
    </article>
  );
};
