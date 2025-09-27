import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { Forecast, BusinessUnit, Client, User, ForecastStatus } from '../types';
import { FilterQuery } from '../types/filters';
import { getAdvancedForecasts, getFilteredStatistics, AdvancedQueryParams, QueryResult } from '../services/supabaseFilterApi';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useLazyLoading } from './useLazyLoading';

interface UseFilteredDataOptions {
  debounceMs?: number;
  enableCaching?: boolean;
  cacheExpiryMs?: number;
  enableCache?: boolean;
  cacheExpiry?: number;
  maxCacheSize?: number;
  enableServerSideFiltering?: boolean;
  pageSize?: number;
  enableLazyLoading?: boolean;
  enablePerformanceMonitoring?: boolean;
}

interface FilteredDataResult {
  filteredForecasts: Forecast[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  appliedFiltersCount: number;
}

// Cache globale per i dati filtrati
interface CacheEntry {
  data: Forecast[];
  timestamp: number;
  queryHash: string;
  statistics?: any;
}

const dataCache = new Map<string, CacheEntry>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minuti

// Configurazione per le prestazioni
interface FilterPerformanceConfig {
  enableCache: boolean;
  cacheExpiry: number;
  debounceMs: number;
  maxCacheSize: number;
  enableServerSideFiltering: boolean;
}

const defaultConfig: FilterPerformanceConfig = {
  enableCache: true,
  cacheExpiry: CACHE_EXPIRY,
  debounceMs: 300,
  maxCacheSize: 100,
  enableServerSideFiltering: true,
  enableLazyLoading: false,
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development'
};

// Funzione per generare hash della query
const generateQueryHash = (filters: FilterQuery): string => {
  return JSON.stringify(filters, Object.keys(filters).sort());
};

// Funzione per pulire la cache
const cleanCache = (maxSize: number) => {
  if (dataCache.size <= maxSize) return;
  
  const entries = Array.from(dataCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toDelete = entries.slice(0, entries.length - maxSize);
  toDelete.forEach(([key]) => dataCache.delete(key));
};

// Hook principale per i dati filtrati
export const useFilteredData = (
  forecasts: Forecast[] = [],
  options: UseFilteredDataOptions = {}
) => {
  const { filters, buildQuery } = useFilters();
  const config = useMemo(() => ({ ...defaultConfig, ...options }), [options]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Performance monitoring
  const performanceConfig = useMemo(() => ({
    enableMonitoring: config.enablePerformanceMonitoring
  }), [config.enablePerformanceMonitoring]);

  const performanceMonitor = usePerformanceMonitor(performanceConfig);

  const {
    startRenderMeasure,
    endRenderMeasure,
    startFilterMeasure,
    endFilterMeasure,
    startQueryMeasure,
    endQueryMeasure,
    updateCacheMetrics,
    metrics: performanceMetrics,
    alerts: performanceAlerts,
    clearAlerts
  } = performanceMonitor;
  
  // Lazy loading
  const {
    items: lazyLoadedForecasts,
    loading: isLoadingMore,
    loadMore,
    hasMore,
    reset: resetLazyLoading
  } = useLazyLoading(
    forecasts,
    {
      pageSize: config.pageSize || 50,
      threshold: 0.8,
      enabled: config.enableLazyLoading || false
    }
  );
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastQueryRef = useRef<string>('');

  // Costruisci la query dai filtri
  const query = useMemo(() => buildQuery(), [buildQuery]);
  const queryHash = useMemo(() => generateQueryHash(query), [query]);

  // Funzione per eseguire il filtraggio
  const executeFiltering = useCallback(async () => {
    if (queryHash === lastQueryRef.current) return;
    
    setLoading(true);
    setError(null);
    lastQueryRef.current = queryHash;

    try {
      // Controlla la cache
      if (config.enableCache) {
        const cached = dataCache.get(queryHash);
        if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
          updateCacheMetrics(1, 1); // Cache hit
          setStatistics(cached.statistics);
          setLoading(false);
          return cached.data;
        }
      }

      updateCacheMetrics(0, 1); // Cache miss
      startFilterMeasure();

      let result: QueryResult;

      if (config.enableServerSideFiltering) {
        startQueryMeasure();
        
        // Usa le query Supabase dinamiche
        const params: AdvancedQueryParams = {
          dateRange: query.dateRange,
          businessUnitIds: query.businessUnitIds,
          clientIds: query.clientIds,
          userIds: query.userIds,
          statuses: query.statuses as ForecastStatus[],
          budgetRange: query.budgetRange,
          forecastRange: query.forecastRange,
          declaredBudgetRange: query.declaredBudgetRange,
          countries: query.countries,
          textSearch: query.textSearch,
          limit: options.pageSize || 1000,
          offset: 0
        };

        result = await getAdvancedForecasts(params);
        
        // Ottieni statistiche
        const stats = await getFilteredStatistics(params);
        
        endQueryMeasure();
        setStatistics(stats);
      } else {
        // Fallback al filtraggio client-side
        const filtered = filterForecastsClientSide(forecasts, query);
        result = {
          data: filtered,
          count: filtered.length,
          totalCount: forecasts.length
        };
      }

      // Salva in cache
      if (config.enableCache) {
        cleanCache(config.maxCacheSize);
        dataCache.set(queryHash, {
          data: result.data,
          timestamp: Date.now(),
          queryHash,
          statistics
        });
      }

      endFilterMeasure(result.totalCount, result.count);
      
      // Reset lazy loading se abilitato
      if (config.enableLazyLoading) {
        resetLazyLoading();
      }

      setLoading(false);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il filtraggio';
      setError(errorMessage);
      console.error('Errore nel filtraggio:', err);
      
      // Fallback al filtraggio client-side in caso di errore
      const filtered = filterForecastsClientSide(forecasts, query);
      endFilterMeasure(forecasts.length, filtered.length);
      setLoading(false);
      return filtered;
    }
  }, [queryHash, config.enableCache, config.cacheExpiry, config.enableServerSideFiltering, config.maxCacheSize, config.enableLazyLoading, query, options.pageSize, updateCacheMetrics, startFilterMeasure, endFilterMeasure, startQueryMeasure, endQueryMeasure, resetLazyLoading, forecasts]);

  // Debounce dell'esecuzione
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      executeFiltering();
    }, config.debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [executeFiltering, config.debounceMs]);

  // Funzione per ottenere dati dalla cache o filtrati
  const getCachedOrFilteredData = useCallback(() => {
    const cached = dataCache.get(queryHash);
    if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
      return cached.data;
    }
    return filterForecastsClientSide(forecasts, query);
  }, [queryHash, config.cacheExpiry, forecasts, query]);

  // Dati filtrati (dalla cache o dal risultato)
  const filteredData = useMemo(() => {
    startRenderMeasure();
    
    const cachedResult = getCachedOrFilteredData();
    
    // Se lazy loading è abilitato, usa i dati lazy
    const finalData = config.enableLazyLoading ? lazyLoadedForecasts : cachedResult;
    
    return finalData;
  }, [getCachedOrFilteredData, config.enableLazyLoading, lazyLoadedForecasts, startRenderMeasure]);

  useEffect(() => {
    endRenderMeasure();
  }, [filteredData, endRenderMeasure]);

  return {
    data: filteredData,
    loading,
    error,
    statistics,
    totalCount: statistics?.totalCount || forecasts.length,
    filteredCount: filteredData.length,
    query,
    refetch: executeFiltering,
    
    // Lazy loading
    loadMore: config.enableLazyLoading ? loadMore : undefined,
    hasMore: config.enableLazyLoading ? hasMore : false,
    isLoadingMore: config.enableLazyLoading ? isLoadingMore : false,
    
    // Performance monitoring
    performanceMetrics,
    performanceAlerts,
    clearPerformanceAlerts: clearAlerts,
    
    // Cache management
    clearCache: () => dataCache.clear(),
    cacheSize: dataCache.size
  };
};

// Funzione di filtraggio client-side (fallback)
const filterForecastsClientSide = (forecasts: Forecast[], query: FilterQuery): Forecast[] => {
  return forecasts.filter(forecast => {
    // Filtro per intervallo di date
    if (query.dateRange?.start && query.dateRange?.end) {
      const forecastDate = new Date(forecast.created_at);
      const startDate = new Date(query.dateRange.start);
      const endDate = new Date(query.dateRange.end);
      
      if (forecastDate < startDate || forecastDate > endDate) {
        return false;
      }
    }

    // Filtro per Business Units
    if (query.businessUnitIds && query.businessUnitIds.length > 0) {
      if (!query.businessUnitIds.includes(forecast.business_unit_id)) {
        return false;
      }
    }

    // Filtro per Clients
    if (query.clientIds && query.clientIds.length > 0) {
      if (!query.clientIds.includes(forecast.client_id)) {
        return false;
      }
    }

    // Filtro per Users
    if (query.userIds && query.userIds.length > 0) {
      if (!query.userIds.includes(forecast.user_id)) {
        return false;
      }
    }

    // Filtro per Status
    if (query.statuses && query.statuses.length > 0) {
      if (!query.statuses.includes(forecast.status as ForecastStatus)) {
        return false;
      }
    }

    // Filtro per Countries
    if (query.countries && query.countries.length > 0) {
      if (!query.countries.includes(forecast.country)) {
        return false;
      }
    }

    // Filtro per Budget Range
    if (query.budgetRange) {
      const budget = forecast.budget || 0;
      if (query.budgetRange.min !== undefined && budget < query.budgetRange.min) {
        return false;
      }
      if (query.budgetRange.max !== undefined && budget > query.budgetRange.max) {
        return false;
      }
    }

    // Filtro per Forecast Range
    if (query.forecastRange) {
      const forecastValue = forecast.forecast || 0;
      if (query.forecastRange.min !== undefined && forecastValue < query.forecastRange.min) {
        return false;
      }
      if (query.forecastRange.max !== undefined && forecastValue > query.forecastRange.max) {
        return false;
      }
    }

    // Filtro per Declared Budget Range
    if (query.declaredBudgetRange) {
      const declaredBudget = forecast.declared_budget || 0;
      if (query.declaredBudgetRange.min !== undefined && declaredBudget < query.declaredBudgetRange.min) {
        return false;
      }
      if (query.declaredBudgetRange.max !== undefined && declaredBudget > query.declaredBudgetRange.max) {
        return false;
      }
    }

    // Filtro per Text Search
    if (query.textSearch && query.textSearch.trim()) {
      const searchTerm = query.textSearch.toLowerCase();
      const searchableFields = [
        forecast.description,
        (forecast as any).client_name,
        (forecast as any).business_unit_name,
        (forecast as any).user_name
      ].filter(Boolean);
      
      const hasMatch = searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(searchTerm)
      );
      
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });
};

// Hook per le statistiche dei filtri
export const useFilterStats = (
  totalCount: number,
  filteredCount: number,
  query: FilterQuery
) => {
  return useMemo(() => {
    // Controllo per evitare TypeError se query è null o undefined
    if (!query || typeof query !== 'object') {
      return {
        activeFiltersCount: 0,
        efficiency: 0,
        filteringRatio: 0
      };
    }

    const activeFiltersCount = Object.values(query).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return value !== undefined && value !== null && value !== '';
    }).length;

    const efficiency = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;
    const reductionPercentage = totalCount > 0 ? ((totalCount - filteredCount) / totalCount) * 100 : 0;

    return {
      totalCount,
      filteredCount,
      activeFiltersCount,
      efficiency: Math.round(efficiency * 100) / 100,
      reductionPercentage: Math.round(reductionPercentage * 100) / 100,
      isFiltered: activeFiltersCount > 0
    };
  }, [totalCount, filteredCount, query]);
};

// Hook per debounce generico
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook per la gestione della cache
export const useFilterCache = () => {
  const clearCache = useCallback(() => {
    dataCache.clear();
  }, []);

  const getCacheSize = useCallback(() => {
    return dataCache.size;
  }, []);

  const getCacheStats = useCallback(() => {
    const entries = Array.from(dataCache.values());
    const totalSize = entries.reduce((acc, entry) => acc + entry.data.length, 0);
    const oldestEntry = entries.reduce((oldest, entry) => 
      entry.timestamp < oldest.timestamp ? entry : oldest, 
      entries[0]
    );

    return {
      entriesCount: dataCache.size,
      totalDataPoints: totalSize,
      oldestEntryAge: oldestEntry ? Date.now() - oldestEntry.timestamp : 0
    };
  }, []);

  return {
    clearCache,
    getCacheSize,
    getCacheStats
  };
};
