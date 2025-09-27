import React from 'react';

export const CardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center animate-pulse">
        <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-lg mr-4 h-12 w-12"></div>
        <div className="w-full">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
    </div>
);

export const ChartSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-96 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-full w-full bg-slate-100 dark:bg-slate-700/50 rounded"></div>
    </div>
);

export const TableSkeleton: React.FC<{rows?: number, cols?: number}> = ({ rows = 5, cols = 3 }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="text-xs text-gray-700 uppercase bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        {Array.from({ length: cols }).map((_, j) => (
                           <th key={j} scope="col" className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4"></div></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i} className="bg-white dark:bg-transparent border-b dark:border-slate-700">
                            {Array.from({ length: cols }).map((_, j) => (
                                <td key={j} className="px-4 py-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);