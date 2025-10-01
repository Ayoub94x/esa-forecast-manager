import React, { useState, useEffect } from 'react';
import { ChartBarIcon, CurrencyDollarIcon, DocumentChartBarIcon, ChevronDownIcon } from '../icons';
import { useDropdownPositioning } from '../../utils/dropdownPositioning';

export interface DataTypeSelection {
    budget: boolean;
    forecast: boolean;
    declaredBudget: boolean;
}

interface DataTypeSelectorProps {
    selection: DataTypeSelection;
    onChange: (selection: DataTypeSelection) => void;
    className?: string;
}

const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({
    selection,
    onChange,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const filterRef = React.useRef<HTMLDivElement>(null);
    
    // Gestisce la chiusura del menu quando si clicca fuori dall'area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);
    
    // Usa il nuovo sistema di posizionamento automatico
    const dropdownPosition = useDropdownPositioning(isExpanded, filterRef, {
        dropdownWidth: 288, // w-72 = 288px
        dropdownHeight: 350, // Altezza stimata del dropdown
        preferredPosition: 'below',
        preferredAlignment: 'left'
    });

    const dataTypes = [
        {
            key: 'budget' as keyof DataTypeSelection,
            label: 'Budget',
            shortLabel: 'BDG',
            icon: CurrencyDollarIcon,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            // Dark mode colors
            darkLightColor: 'dark:bg-blue-900/30',
            darkTextColor: 'dark:text-blue-300',
            darkBorderColor: 'dark:border-blue-700'
        },
        {
            key: 'forecast' as keyof DataTypeSelection,
            label: 'Forecast',
            shortLabel: 'FCT',
            icon: ChartBarIcon,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50',
            textColor: 'text-emerald-700',
            borderColor: 'border-emerald-200',
            // Dark mode colors
            darkLightColor: 'dark:bg-emerald-900/30',
            darkTextColor: 'dark:text-emerald-300',
            darkBorderColor: 'dark:border-emerald-700'
        },
        {
            key: 'declaredBudget' as keyof DataTypeSelection,
            label: 'Dichiarato',
            shortLabel: 'DCH',
            icon: DocumentChartBarIcon,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200',
            // Dark mode colors
            darkLightColor: 'dark:bg-purple-900/30',
            darkTextColor: 'dark:text-purple-300',
            darkBorderColor: 'dark:border-purple-700'
        }
    ];

    const selectedCount = Object.values(selection || {}).filter(Boolean).length;
    const selectedTypes = dataTypes.filter(type => selection?.[type.key]);

    const handleToggle = (type: keyof DataTypeSelection) => {
        onChange({
            ...selection,
            [type]: !selection[type]
        });
    };

    const getDisplayText = () => {
        if (selectedCount === 0) return 'Nessun dato';
        if (selectedCount === 1) return selectedTypes[0].shortLabel;
        if (selectedCount === dataTypes.length) return 'Tutti i dati';
        return `${selectedCount} tipi`;
    };

    return (
        <div className={`relative ${className}`} ref={filterRef}>
            {/* Compact Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${selectedCount > 0 
                        ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                    }
                `}
            >
                <div className="flex items-center gap-1">
                    {selectedTypes.slice(0, 3).map((type, index) => {
                        const Icon = type.icon;
                        return (
                            <div
                                key={type.key}
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${type.color}`}
                                style={{ marginLeft: index > 0 ? '-4px' : '0' }}
                            >
                                <Icon className="w-3 h-3 text-white" />
                            </div>
                        );
                    })}
                    {selectedCount === 0 && (
                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                            <ChartBarIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        </div>
                    )}
                </div>
                <span className="text-xs font-medium">{getDisplayText()}</span>
                <ChevronDownIcon 
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div 
                    className="fixed w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        left: dropdownPosition.left,
                        right: dropdownPosition.right,
                        maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : undefined
                    }}
                >
                    <div className="p-3 filter-dropdown-scrollbar" style={{ maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight - 120}px` : '200px', overflowY: 'auto' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Tipi di Dati
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {selectedCount}/{dataTypes.length}
                            </span>
                        </div>
                        
                        <div className="space-y-2">
                            {dataTypes.map((type) => {
                                const isSelected = selection?.[type.key] || false;
                                const Icon = type.icon;
                                
                                return (
                                    <button
                                        key={type.key}
                                        onClick={() => handleToggle(type.key)}
                                        className={`
                                            w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200
                                            ${isSelected
                                                ? `${type.lightColor} ${type.darkLightColor} ${type.borderColor} ${type.darkBorderColor} ${type.textColor} ${type.darkTextColor} shadow-sm`
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center
                                            ${isSelected ? type.color : 'bg-slate-200 dark:bg-slate-600'}
                                        `}>
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                        </div>
                                        
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">
                                                {type.label}
                                            </div>
                                        </div>
                                        
                                        <div className={`
                                            w-4 h-4 rounded border-2 flex items-center justify-center
                                            ${isSelected 
                                                ? `${type.color} border-transparent` 
                                                : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700'
                                            }
                                        `}>
                                            {isSelected && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {selectedCount === 0 && (
                            <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Seleziona almeno un tipo di dato
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex justify-between">
                            <button
                                onClick={() => onChange({ budget: true, forecast: true, declaredBudget: true })}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                                Tutto
                            </button>
                            <button
                                onClick={() => onChange({ budget: false, forecast: false, declaredBudget: false })}
                                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
                            >
                                Niente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTypeSelector;