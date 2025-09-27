import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';

interface ChartData {
    name: string;
    budget: number;
    forecast: number;
}

interface ForecastBarChartProps {
    data: ChartData[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
const formatCurrencyCompact = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; }>; label?: string; }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center text-sm">
                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-slate-600 dark:text-slate-300 capitalize mr-2">{entry.name}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(entry.value ?? 0)}</span>
            </div>
          ))}
        </div>
      );
    }
  
    return null;
  };

const ForecastBarChart: React.FC<ForecastBarChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const axisAndTextColor = isDarkMode ? '#94A3B8' : '#64748B'; // slate-400 vs slate-500
    const gridColor = isDarkMode ? '#334155' : '#E2E8F0'; // slate-700 vs slate-200
    const tooltipCursorFill = isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(238, 242, 255, 0.6)';

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
            <div className="flex flex-wrap items-start justify-between mb-4 gap-2">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">BDG Attivo vs. Fcast Rolling</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Comparison by Business Unit</p>
                </div>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%" aria-label="Bar chart showing budget versus forecast data by business unit.">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.4}/>
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.4}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisAndTextColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={formatCurrencyCompact} stroke={axisAndTextColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: tooltipCursorFill }} />
                        <Legend wrapperStyle={{ color: axisAndTextColor, paddingBottom: '20px' }} />
                        <Bar dataKey="budget" fill="url(#colorBudget)" name="BDG Attivo" radius={[4, 4, 0, 0]} animationDuration={300} />
                        <Bar dataKey="forecast" fill="url(#colorForecast)" name="Fcast Rolling" radius={[4, 4, 0, 0]} animationDuration={300} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ForecastBarChart;