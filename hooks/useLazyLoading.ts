import { useState, useEffect, useCallback, useRef } from 'react';

interface LazyLoadingOptions {
  pageSize: number;
  threshold: number;
  enabled: boolean;
}

interface LazyLoadingResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalLoaded: number;
}

export const useLazyLoading = <T>(
  allItems: T[],
  options: LazyLoadingOptions = {
    pageSize: 50,
    threshold: 0.8,
    enabled: true
  }
): LazyLoadingResult<T> => {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  // Reset quando cambiano gli items
  useEffect(() => {
    setCurrentPage(0);
  }, [allItems]);

  // Calcola gli items da mostrare
  const itemsToShow = options.enabled 
    ? (Array.isArray(allItems) ? allItems.slice(0, (currentPage + 1) * options.pageSize) : [])
    : (Array.isArray(allItems) ? allItems : []);

  const hasMore = options.enabled 
    ? itemsToShow.length < (Array.isArray(allItems) ? allItems.length : 0)
    : false;

  // Funzione per caricare più items
  const loadMore = useCallback(() => {
    if (loading || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    // Simula un piccolo delay per il caricamento
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setLoading(false);
      loadingRef.current = false;
    }, 100);
  }, [loading, hasMore]);

  // Reset del lazy loading
  const reset = useCallback(() => {
    setCurrentPage(0);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  return {
    items: itemsToShow,
    loading,
    hasMore,
    loadMore,
    reset,
    totalLoaded: itemsToShow.length
  };
};

// Hook per l'intersection observer (scroll infinito)
export const useInfiniteScroll = (
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    enabled = true
  } = options;

  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    const currentTarget = targetRef.current;
    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [callback, threshold, rootMargin, enabled]);

  return targetRef;
};

// Hook per la virtualizzazione (per liste molto grandi)
export const useVirtualization = <T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    enabled?: boolean;
  }
) => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    enabled = true
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = enabled 
    ? Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    : 0;
  const endIndex = enabled 
    ? Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)
    : items.length - 1;

  const visibleItems = enabled 
    ? items.slice(startIndex, endIndex + 1)
    : items;

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto'
      },
      onScroll: handleScroll
    }
  };
};