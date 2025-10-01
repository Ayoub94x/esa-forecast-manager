import React, { useState, useRef, useEffect } from 'react';
import { CalendarDaysIcon, XMarkIcon, ChevronDownIcon } from '../icons';
import { useDropdownPositioning } from '../../utils/dropdownPositioning';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
}

interface DateFilterProps {
    selectedDateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
    disabled?: boolean;
}

// Preset di date comuni
const DATE_PRESETS = [
    {
        label: 'Ultimo mese',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            return { startDate: start, endDate: end };
        }
    },
    {
        label: 'Ultimi 3 mesi',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 3);
            return { startDate: start, endDate: end };
        }
    },
    {
        label: 'Ultimi 6 mesi',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            return { startDate: start, endDate: end };
        }
    },
    {
        label: 'Anno corrente',
        getValue: () => {
            const start = new Date(new Date().getFullYear(), 0, 1);
            const end = new Date(new Date().getFullYear(), 11, 31);
            return { startDate: start, endDate: end };
        }
    },
    {
        label: 'Anno precedente',
        getValue: () => {
            const year = new Date().getFullYear() - 1;
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            return { startDate: start, endDate: end };
        }
    }
];

const DateFilter: React.FC<DateFilterProps> = ({
    selectedDateRange,
    onDateRangeChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Usa il nuovo sistema di posizionamento automatico
    const dropdownPosition = useDropdownPositioning(isOpen, filterRef, {
        dropdownWidth: 320, // w-80 = 320px
        dropdownHeight: 400, // Altezza stimata del dropdown
        preferredPosition: 'below',
        preferredAlignment: 'right'
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sincronizza le date custom con il range selezionato
    useEffect(() => {
        if (selectedDateRange.startDate) {
            setCustomStartDate(selectedDateRange.startDate.toISOString().split('T')[0]);
        } else {
            setCustomStartDate('');
        }
        
        if (selectedDateRange.endDate) {
            setCustomEndDate(selectedDateRange.endDate.toISOString().split('T')[0]);
        } else {
            setCustomEndDate('');
        }
    }, [selectedDateRange]);

    const handlePresetSelect = (preset: typeof DATE_PRESETS[0]) => {
        const range = preset.getValue();
        onDateRangeChange(range);
        setIsOpen(false);
    };

    const handleCustomDateChange = () => {
        const startDate = customStartDate ? new Date(customStartDate) : null;
        const endDate = customEndDate ? new Date(customEndDate) : null;
        
        onDateRangeChange({ startDate, endDate });
    };

    const clearSelection = () => {
        onDateRangeChange({ startDate: null, endDate: null });
        setCustomStartDate('');
        setCustomEndDate('');
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const getDisplayText = () => {
        const { startDate, endDate } = selectedDateRange;
        
        if (!startDate && !endDate) {
            return 'Tutte le date';
        }
        
        if (startDate && endDate) {
            return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
        
        if (startDate) {
            return `Da ${formatDate(startDate)}`;
        }
        
        if (endDate) {
            return `Fino a ${formatDate(endDate)}`;
        }
        
        return 'Tutte le date';
    };

    const hasSelection = selectedDateRange.startDate || selectedDateRange.endDate;

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${disabled 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                        : hasSelection
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                    }
                `}
            >
                <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
                
                {hasSelection ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 truncate max-w-32">
                        {getDisplayText()}
                    </span>
                ) : (
                    <span className="text-xs font-medium truncate">Tutte le date</span>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                    {hasSelection && !disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearSelection();
                            }}
                            className="p-0.5 hover:bg-slate-200 rounded dark:hover:bg-slate-600 transition-colors"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div 
                    ref={dropdownRef}
                    className="fixed z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        left: dropdownPosition.left,
                        right: dropdownPosition.right,
                        maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : undefined
                    }}
                >
                    <div className="overflow-y-auto max-h-full filter-dropdown-scrollbar">
                        {/* Header */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Seleziona Periodo
                            </h3>
                        </div>

                        {/* Preset rapidi */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                                Periodi Rapidi
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {DATE_PRESETS.map((preset, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePresetSelect(preset)}
                                        className="px-3 py-2 text-xs text-left rounded-lg border border-slate-200 dark:border-slate-600 
                                                 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                                                 text-slate-700 dark:text-slate-300"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selezione custom */}
                        <div className="p-3">
                            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                                Periodo Personalizzato
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Data Inizio
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => {
                                            setCustomStartDate(e.target.value);
                                            handleCustomDateChange();
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg 
                                                 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Data Fine
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => {
                                            setCustomEndDate(e.target.value);
                                            handleCustomDateChange();
                                        }}
                                        min={customStartDate}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg 
                                                 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {hasSelection && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={clearSelection}
                                        className="w-full px-3 py-2 text-xs text-slate-600 dark:text-slate-400 
                                                 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Cancella Selezione
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateFilter;