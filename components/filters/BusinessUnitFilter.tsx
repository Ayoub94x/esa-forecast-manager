import React, { useState, useRef, useEffect } from 'react';
import { BuildingOfficeIcon, XMarkIcon, ChevronDownIcon } from '../icons';
import { useDropdownPositioning } from '../../utils/dropdownPositioning';
import { getBusinessUnits } from '../../services/supabaseApi';
import { BusinessUnit } from '../../types';

interface BusinessUnitFilterProps {
    selectedBusinessUnits: number[];
    onBusinessUnitChange: (businessUnits: number[]) => void;
    disabled?: boolean;
}

const BusinessUnitFilter: React.FC<BusinessUnitFilterProps> = ({
    selectedBusinessUnits,
    onBusinessUnitChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [keepMenuOpen, setKeepMenuOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const shouldKeepOpenRef = useRef(false);
    const lastSelectionTimeRef = useRef(0);
    
    // Usa il nuovo sistema di posizionamento automatico
    const dropdownPosition = useDropdownPositioning(isOpen, filterRef, {
        dropdownWidth: 288, // w-72 = 288px
        dropdownHeight: 320, // Altezza stimata del dropdown
        preferredPosition: 'below',
        preferredAlignment: 'left'
    });

    // Carica le business unit dal database
    useEffect(() => {
        const loadBusinessUnits = async () => {
            try {
                setLoading(true);
                const units = await getBusinessUnits();
                setBusinessUnits(units);
            } catch (error) {
                console.error('Error loading business units:', error);
                setBusinessUnits([]);
            } finally {
                setLoading(false);
            }
        };

        loadBusinessUnits();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                // Solo chiudi il menu se non è stata fatta una selezione recente
                const timeSinceLastSelection = Date.now() - lastSelectionTimeRef.current;
                if (timeSinceLastSelection > 200) {
                    setIsOpen(false);
                    setKeepMenuOpen(false);
                    shouldKeepOpenRef.current = false;
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBusinessUnitToggle = (businessUnitId: number) => {
        // Aggiorna il timestamp dell'ultima selezione
        lastSelectionTimeRef.current = Date.now();
        shouldKeepOpenRef.current = true;
        setKeepMenuOpen(true);
        
        if (selectedBusinessUnits.includes(businessUnitId)) {
            onBusinessUnitChange(selectedBusinessUnits.filter(id => id !== businessUnitId));
        } else {
            onBusinessUnitChange([...selectedBusinessUnits, businessUnitId]);
        }
        
        // Mantieni il menu aperto
        setIsOpen(true);
    };

    const handleSelectAll = () => {
        // Aggiorna il timestamp dell'ultima selezione
        lastSelectionTimeRef.current = Date.now();
        shouldKeepOpenRef.current = true;
        setKeepMenuOpen(true);
        
        if (selectedBusinessUnits.length === businessUnits.length) {
            onBusinessUnitChange([]);
        } else {
            onBusinessUnitChange(businessUnits.map(bu => bu.id));
        }
        
        // Mantieni il menu aperto
        setIsOpen(true);
    };

    const clearSelection = () => {
        // Aggiorna il timestamp dell'ultima selezione
        lastSelectionTimeRef.current = Date.now();
        shouldKeepOpenRef.current = true;
        setKeepMenuOpen(true);
        
        onBusinessUnitChange([]);
        setIsOpen(true);
    };

    const getSelectedBusinessUnitChips = () => {
        if (selectedBusinessUnits.length === 0) return null;
        if (selectedBusinessUnits.length <= 2) {
            return selectedBusinessUnits.map(id => {
                const bu = businessUnits.find(unit => unit.id === id);
                return bu ? bu.name : id.toString();
            });
        }
        return [`${selectedBusinessUnits.length} BU`];
    };

    // Effetto per mantenere il menu aperto durante i re-render
    useEffect(() => {
        if (keepMenuOpen || shouldKeepOpenRef.current) {
            setIsOpen(true);
            // Reset del flag dopo un breve delay per permettere il re-render
            const timer = setTimeout(() => {
                setKeepMenuOpen(false);
                // Non resettare shouldKeepOpenRef qui per permettere selezioni multiple consecutive
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [selectedBusinessUnits, keepMenuOpen]);

    // Effetto separato per resettare shouldKeepOpenRef dopo un periodo più lungo
    useEffect(() => {
        if (shouldKeepOpenRef.current) {
            const timer = setTimeout(() => {
                shouldKeepOpenRef.current = false;
            }, 1000); // Mantieni il flag per 1 secondo per permettere selezioni multiple
            return () => clearTimeout(timer);
        }
    }, [selectedBusinessUnits]);

    const chips = getSelectedBusinessUnitChips();

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${disabled || loading
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                        : selectedBusinessUnits.length > 0
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                    }
                `}
            >
                <BuildingOfficeIcon className="w-4 h-4 flex-shrink-0" />
                
                {loading ? (
                    <span className="text-xs font-medium truncate">Caricamento...</span>
                ) : chips && chips.length > 0 ? (
                    <div className="flex items-center gap-1 min-w-0">
                        {chips.slice(0, 3).map((chip, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 truncate max-w-20"
                                title={chip}
                            >
                                {chip}
                            </span>
                        ))}
                        {chips.length > 3 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{chips.length - 3}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs font-medium truncate">Tutte le BU</span>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedBusinessUnits.length > 0 && !disabled && !loading && (
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

            {isOpen && !disabled && !loading && (
                <div 
                    className="fixed z-50 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        left: dropdownPosition.left,
                        right: dropdownPosition.right,
                        maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : undefined
                    }}
                >
                    {/* Header compatto */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Business Unit
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                    {selectedBusinessUnits.length === businessUnits.length ? 'Nessuna' : 'Tutte'}
                                </button>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {selectedBusinessUnits.length}/{businessUnits.length}
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                    title="Chiudi menu"
                                >
                                    <XMarkIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista business unit ottimizzata */}
                    <div className="overflow-y-auto p-2 filter-dropdown-scrollbar" style={{ maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight - 80}px` : '256px' }}>
                        {businessUnits.length === 0 ? (
                            <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                                Nessuna business unit trovata
                            </div>
                        ) : (
                            businessUnits.map((businessUnit) => {
                                const isSelected = selectedBusinessUnits.includes(businessUnit.id);
                                
                                return (
                                    <button
                                        key={businessUnit.id}
                                        onClick={() => handleBusinessUnitToggle(businessUnit.id)}
                                        className={`
                                            w-full flex items-center justify-between px-3 py-2.5 text-sm text-left rounded-lg
                                            hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                                            ${isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`
                                                w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0
                                                ${isSelected 
                                                    ? 'bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500' 
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }
                                            `}>
                                                {isSelected && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`
                                                    font-medium truncate
                                                    ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-slate-300'}
                                                `}>
                                                    {businessUnit.name}
                                                </div>
                                            </div>
                                            {/* Indicatore colore BU */}
                                            <div 
                                                className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-200 dark:border-slate-600"
                                                style={{ backgroundColor: businessUnit.color }}
                                                title={`Colore: ${businessUnit.color}`}
                                            />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessUnitFilter;