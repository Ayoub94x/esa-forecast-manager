import React, { ReactNode } from 'react';

interface SummaryCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    delta?: {
        value: number;
        isPositive: boolean;
    }
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, delta }) => {
    const deltaColor = delta?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-start transition-all hover:shadow-xl dark:hover:shadow-indigo-500/10 hover:-translate-y-1">
            <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400 rounded-lg mr-4">
                {React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6" })}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                    {delta && (
                        <span className={`text-sm font-semibold ${deltaColor}`}>
                           ({delta.value > 0 ? '+' : ''}{delta.value.toFixed(2)}%)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;