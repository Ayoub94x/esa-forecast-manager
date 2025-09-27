import React, { useState } from 'react';
import { 
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Cog6ToothIcon,
  XMarkIcon
} from './icons';

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

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  aggregateStats?: {
    renderTime: { avg: number; max: number; min: number };
    filterTime: { avg: number; max: number; min: number };
    queryTime: { avg: number; max: number; min: number };
    cacheHitRate: { avg: number; max: number; min: number };
    memoryUsage: { avg: number; max: number; min: number };
  } | null;
  cacheSize: number;
  onClearAlerts: () => void;
  onClearCache: () => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics,
  alerts,
  aggregateStats,
  cacheSize,
  onClearAlerts,
  onClearCache,
  isVisible = false,
  onToggleVisibility
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'cache'>('metrics');

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        <ChartBarIcon className="h-4 w-4 mr-2 inline" />
        Performance
      </button>
    );
  }

  const formatTime = (ms: number) => `${ms.toFixed(1)}ms`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      renderTime: { good: 50, warning: 100 },
      filterTime: { good: 200, warning: 500 },
      queryTime: { good: 500, warning: 1000 },
      cacheHitRate: { good: 80, warning: 60 },
      memoryUsage: { good: 50, warning: 100 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (metric === 'cacheHitRate') {
      return value >= threshold.good ? 'good' : value >= threshold.warning ? 'warning' : 'critical';
    } else {
      return value <= threshold.good ? 'good' : value <= threshold.warning ? 'warning' : 'critical';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const filterEfficiency = metrics.totalItems > 0 
    ? ((metrics.totalItems - metrics.filteredItems) / metrics.totalItems) * 100 
    : 0;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Performance Monitor</span>
        </div>
        <button 
          onClick={onToggleVisibility}
          className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {['metrics', 'alerts', 'cache'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium capitalize relative ${
              activeTab === tab
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab}
            {tab === 'alerts' && alerts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 max-h-80 overflow-y-auto">
        {activeTab === 'metrics' && (
          <div className="space-y-3">
            {/* Tempi di esecuzione */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Tempi di Esecuzione</h4>
              
              {[
                { key: 'renderTime' as const, label: 'Rendering', icon: <ClockIcon className="h-4 w-4" /> },
                { key: 'filterTime' as const, label: 'Filtraggio', icon: <ChartBarIcon className="h-4 w-4" /> },
                { key: 'queryTime' as const, label: 'Query DB', icon: <CpuChipIcon className="h-4 w-4" /> }
              ].map(({ key, label, icon }) => {
                const status = getPerformanceStatus(key, metrics[key]);
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {icon}
                      <span className="text-slate-600 dark:text-slate-400">{label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getStatusColor(status)}`}>
                        {formatTime(metrics[key])}
                      </span>
                      {status === 'good' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                      {status === 'warning' && <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />}
                      {status === 'critical' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Metriche cache e memoria */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-600">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Cache & Memoria</h4>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span className="text-slate-600 dark:text-slate-400">Cache Hit Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.cacheHitRate}%` }}
                    />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatPercentage(metrics.cacheHitRate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <CpuChipIcon className="h-4 w-4" />
                  <span className="text-slate-600 dark:text-slate-400">Memoria</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metrics.memoryUsage > 80 ? 'bg-red-500' : 
                        metrics.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(metrics.memoryUsage, 100)}%` }}
                    />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatPercentage(metrics.memoryUsage)}
                  </span>
                </div>
              </div>
            </div>

            {/* Efficienza filtraggio */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Elementi filtrati</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {metrics.filteredItems} / {metrics.totalItems}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-600 dark:text-slate-400">Efficienza</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatPercentage(filterEfficiency)}
                </span>
              </div>
            </div>

            {/* Statistiche aggregate */}
            {aggregateStats && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Statistiche Aggregate</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-slate-500 dark:text-slate-400">Avg</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{formatTime(aggregateStats.renderTime.avg)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 dark:text-slate-400">Min</div>
                    <div className="font-medium text-green-600">{formatTime(aggregateStats.renderTime.min)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500 dark:text-slate-400">Max</div>
                    <div className="font-medium text-red-600">{formatTime(aggregateStats.renderTime.max)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Alert Performance</h4>
              {alerts.length > 0 && (
                <button 
                  onClick={onClearAlerts}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Pulisci tutti
                </button>
              )}
            </div>
            
            {alerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Nessun alert attivo</p>
              </div>
            ) : (
              <>
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className={`h-4 w-4 mt-0.5 ${
                        alert.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{alert.message}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-1">
                          {alert.metric}: {(alert.value || 0).toFixed(1)} (soglia: {alert.threshold})
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-xs">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Gestione Cache</h4>
              <button 
                onClick={onClearCache}
                className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Svuota Cache
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Elementi in cache:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{cacheSize}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Hit rate:</span>
                <span className={`font-medium ${getStatusColor(getPerformanceStatus('cacheHitRate', metrics.cacheHitRate))}`}>
                  {formatPercentage(metrics.cacheHitRate)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Memoria cache:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formatPercentage(metrics.memoryUsage)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;