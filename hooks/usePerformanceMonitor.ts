import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  filterTime: number;
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  totalItems: number;
  filteredItems: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
}

interface PerformanceConfig {
  enableMonitoring: boolean;
  enableAlerts: boolean;
  thresholds: {
    renderTime: number; // ms
    filterTime: number; // ms
    queryTime: number; // ms
    cacheHitRate: number; // %
    memoryUsage: number; // MB
  };
  sampleSize: number;
}

const defaultConfig: PerformanceConfig = {
  enableMonitoring: process.env.NODE_ENV === 'development',
  enableAlerts: true,
  thresholds: {
    renderTime: 100, // 100ms
    filterTime: 500, // 500ms
    queryTime: 1000, // 1s
    cacheHitRate: 70, // 70%
    memoryUsage: 100 // 100MB
  },
  sampleSize: 10
};

export const usePerformanceMonitor = (config: Partial<PerformanceConfig> = {}) => {
  const fullConfig = { ...defaultConfig, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    filterTime: 0,
    queryTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    totalItems: 0,
    filteredItems: 0
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(fullConfig.enableMonitoring);
  
  const metricsHistory = useRef<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const filterStartTime = useRef<number>(0);
  const queryStartTime = useRef<number>(0);
  
  // Funzioni per misurare le prestazioni
  const startRenderMeasure = useCallback(() => {
    if (!isMonitoring) return;
    renderStartTime.current = performance.now();
  }, [isMonitoring]);

  const endRenderMeasure = useCallback(() => {
    if (!isMonitoring || renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
    renderStartTime.current = 0;
    
    // Controlla soglie
    if (fullConfig.enableAlerts && renderTime > fullConfig.thresholds.renderTime) {
      addAlert('warning', 'Tempo di rendering elevato', 'renderTime', renderTime, fullConfig.thresholds.renderTime);
    }
  }, [isMonitoring, fullConfig]);

  const startFilterMeasure = useCallback(() => {
    if (!isMonitoring) return;
    filterStartTime.current = performance.now();
  }, [isMonitoring]);

  const endFilterMeasure = useCallback((totalItems: number, filteredItems: number) => {
    if (!isMonitoring || filterStartTime.current === 0) return;
    
    const filterTime = performance.now() - filterStartTime.current;
    setMetrics(prev => ({ 
      ...prev, 
      filterTime, 
      totalItems, 
      filteredItems 
    }));
    filterStartTime.current = 0;
    
    // Controlla soglie
    if (fullConfig.enableAlerts && filterTime > fullConfig.thresholds.filterTime) {
      addAlert('warning', 'Tempo di filtraggio elevato', 'filterTime', filterTime, fullConfig.thresholds.filterTime);
    }
  }, [isMonitoring, fullConfig]);

  const startQueryMeasure = useCallback(() => {
    if (!isMonitoring) return;
    queryStartTime.current = performance.now();
  }, [isMonitoring]);

  const endQueryMeasure = useCallback(() => {
    if (!isMonitoring || queryStartTime.current === 0) return;
    
    const queryTime = performance.now() - queryStartTime.current;
    setMetrics(prev => ({ ...prev, queryTime }));
    queryStartTime.current = 0;
    
    // Controlla soglie
    if (fullConfig.enableAlerts && queryTime > fullConfig.thresholds.queryTime) {
      addAlert('warning', 'Tempo di query elevato', 'queryTime', queryTime, fullConfig.thresholds.queryTime);
    }
  }, [isMonitoring, fullConfig]);

  const updateCacheMetrics = useCallback((hits: number, total: number) => {
    if (!isMonitoring) return;
    
    const cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
    setMetrics(prev => ({ ...prev, cacheHitRate }));
    
    // Controlla soglie
    if (fullConfig.enableAlerts && cacheHitRate < fullConfig.thresholds.cacheHitRate) {
      addAlert('warning', 'Basso tasso di hit della cache', 'cacheHitRate', cacheHitRate, fullConfig.thresholds.cacheHitRate);
    }
  }, [isMonitoring, fullConfig]);

  // Funzione per aggiungere alert
  const addAlert = useCallback((
    type: 'warning' | 'error',
    message: string,
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number
  ) => {
    const alert: PerformanceAlert = {
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now()
    };
    
    setAlerts(prev => [...prev.slice(-9), alert]); // Mantieni solo gli ultimi 10 alert
  }, []);

  // Monitoraggio della memoria
  useEffect(() => {
    if (!isMonitoring) return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo.usedJSHeapSize / (1024 * 1024); // MB
        
        setMetrics(prev => ({ ...prev, memoryUsage }));
        
        if (fullConfig.enableAlerts && memoryUsage > fullConfig.thresholds.memoryUsage) {
          addAlert('warning', 'Uso elevato della memoria', 'memoryUsage', memoryUsage, fullConfig.thresholds.memoryUsage);
        }
      }
    };

    const interval = setInterval(checkMemory, 10000); // Ridotto a ogni 10 secondi per migliorare le performance
    return () => clearInterval(interval);
  }, [isMonitoring, fullConfig, addAlert]);

  // Salva metriche nella cronologia con throttling
  useEffect(() => {
    const throttleTimeout = setTimeout(() => {
      metricsHistory.current.push(metrics);
      if (metricsHistory.current.length > fullConfig.sampleSize) {
        metricsHistory.current.shift();
      }
    }, 100); // Throttle di 100ms per evitare aggiornamenti troppo frequenti

    return () => clearTimeout(throttleTimeout);
  }, [metrics, fullConfig.sampleSize]);

  // Calcola statistiche aggregate
  const getAggregateStats = useCallback(() => {
    const history = metricsHistory.current;
    if (history.length === 0) return null;

    const avg = (key: keyof PerformanceMetrics) => 
      history.reduce((sum, m) => sum + m[key], 0) / history.length;

    const max = (key: keyof PerformanceMetrics) => 
      Math.max(...history.map(m => m[key]));

    const min = (key: keyof PerformanceMetrics) => 
      Math.min(...history.map(m => m[key]));

    return {
      renderTime: { avg: avg('renderTime'), max: max('renderTime'), min: min('renderTime') },
      filterTime: { avg: avg('filterTime'), max: max('filterTime'), min: min('filterTime') },
      queryTime: { avg: avg('queryTime'), max: max('queryTime'), min: min('queryTime') },
      cacheHitRate: { avg: avg('cacheHitRate'), max: max('cacheHitRate'), min: min('cacheHitRate') },
      memoryUsage: { avg: avg('memoryUsage'), max: max('memoryUsage'), min: min('memoryUsage') }
    };
  }, []);

  // Funzioni di controllo
  const clearAlerts = useCallback(() => setAlerts([]), []);
  const clearHistory = useCallback(() => { metricsHistory.current = []; }, []);
  const toggleMonitoring = useCallback(() => setIsMonitoring(prev => !prev), []);

  return {
    // Stato
    metrics,
    alerts,
    isMonitoring,
    
    // Funzioni di misurazione
    startRenderMeasure,
    endRenderMeasure,
    startFilterMeasure,
    endFilterMeasure,
    startQueryMeasure,
    endQueryMeasure,
    updateCacheMetrics,
    
    // Utilità
    getAggregateStats,
    clearAlerts,
    clearHistory,
    toggleMonitoring,
    
    // Dati
    history: metricsHistory.current
  };
};