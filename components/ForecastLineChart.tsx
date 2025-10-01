import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { DataTypeSelection } from './filters/DataTypeSelector';

interface ChartData {
    name: string;
    budget: number;
    forecast: number;
    declaredBudget: number;
}

interface ForecastLineChartProps {
    data: ChartData[];
    dataTypeSelection: DataTypeSelection;
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

const ForecastLineChart: React.FC<ForecastLineChartProps> = ({ data, dataTypeSelection }) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const axisAndTextColor = isDarkMode ? '#94A3B8' : '#64748B'; // slate-400 vs slate-500
    const gridColor = isDarkMode ? '#334155' : '#E2E8F0'; // slate-700 vs slate-200
    const tooltipCursorFill = isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(238, 242, 255, 0.6)';

    // Determina quali linee mostrare
    const selectedTypes = [];
    if (dataTypeSelection?.budget) selectedTypes.push('Budget Attivo');
    if (dataTypeSelection?.forecast) selectedTypes.push('Forecast Rolling');
    if (dataTypeSelection?.declaredBudget) selectedTypes.push('Budget Dichiarato');

    const chartTitle = selectedTypes.length > 0 
        ? `Trend Mensile (${selectedTypes.join(', ')})`
        : 'Trend Mensile';

    // Se nessun tipo è selezionato, mostra un messaggio
    if (selectedTypes.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{chartTitle}</h3>
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-slate-500 dark:text-slate-400 text-center">
                        Seleziona almeno un tipo di dato per visualizzare il grafico
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-[28rem] flex flex-col transition-colors">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{chartTitle}</h3>
             <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisAndTextColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={formatCurrencyCompact} stroke={axisAndTextColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: tooltipCursorFill }} />
                        <Legend wrapperStyle={{ color: axisAndTextColor, paddingBottom: '20px' }} />
                        {dataTypeSelection?.budget && (
                            <Line type="monotone" dataKey="budget" name="BDG Attivo" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                        )}
                        {dataTypeSelection?.forecast && (
                            <Line type="monotone" dataKey="forecast" name="Fcast Rolling" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                        )}
                        {dataTypeSelection?.declaredBudget && (
                            <Line type="monotone" dataKey="declaredBudget" name="BDG Dichiarato" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ForecastLineChart;