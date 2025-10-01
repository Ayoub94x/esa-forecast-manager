import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, getCountryName, COMMON_EUROPEAN_COUNTRIES } from '../../utils/countries';
import { FunnelIcon, XMarkIcon, ChevronDownIcon, MagnifyingGlassIcon } from '../icons';
import { useDropdownPositioning } from '../../utils/dropdownPositioning';

interface CountryFilterProps {
    selectedCountries: string[];
    onCountryChange: (countries: string[]) => void;
    disabled?: boolean;
}

interface DropdownPosition {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    maxHeight?: number;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountries,
    onCountryChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Usa il nuovo sistema di posizionamento automatico
    const dropdownPosition = useDropdownPositioning(isOpen, filterRef, {
        dropdownWidth: 256, // w-64 = 256px (ridotto da 320px)
        dropdownHeight: 400, // Altezza stimata del dropdown
        preferredPosition: 'below',
        preferredAlignment: 'left' // Cambiato da 'right' a 'left'
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortedCountries = React.useMemo(() => {
        const commonCountries = COUNTRIES.filter(country => 
            COMMON_EUROPEAN_COUNTRIES.includes(country.code)
        );
        const otherCountries = COUNTRIES.filter(country => 
            !COMMON_EUROPEAN_COUNTRIES.includes(country.code)
        );
        
        return [
            ...commonCountries.sort((a, b) => a.name.localeCompare(b.name)),
            ...otherCountries.sort((a, b) => a.name.localeCompare(b.name))
        ];
    }, []);

    const filteredCountries = React.useMemo(() => {
        if (!searchTerm.trim()) return sortedCountries;
        
        const term = searchTerm.toLowerCase();
        return sortedCountries.filter(country => 
            country.name.toLowerCase().includes(term) ||
            country.code.toLowerCase().includes(term)
        );
    }, [sortedCountries, searchTerm]);

    const handleCountryToggle = (countryCode: string) => {
        if (selectedCountries.includes(countryCode)) {
            onCountryChange(selectedCountries.filter(code => code !== countryCode));
        } else {
            onCountryChange([...selectedCountries, countryCode]);
        }
    };

    const handleSelectAll = () => {
        if (selectedCountries.length === COUNTRIES.length) {
            onCountryChange([]);
        } else {
            onCountryChange(COUNTRIES.map(country => country.code));
        }
    };

    const clearSelection = () => {
        onCountryChange([]);
    };

    const getDisplayText = () => {
        if (selectedCountries.length === 0) {
            return "Tutti i paesi";
        } else if (selectedCountries.length === 1) {
            return getCountryName(selectedCountries[0]);
        } else if (selectedCountries.length <= 2) {
            return selectedCountries.map(code => getCountryName(code)).join(', ');
        } else {
            return `${selectedCountries.length} paesi`;
        }
    };

    const getSelectedCountryChips = () => {
        if (selectedCountries.length === 0) return null;
        if (selectedCountries.length <= 3) {
            return selectedCountries.map(code => getCountryName(code));
        }
        return [`${selectedCountries.length} paesi selezionati`];
    };

    const chips = getSelectedCountryChips();

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                    ${disabled 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                        : selectedCountries.length > 0
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700'
                    }
                `}
            >
                <FunnelIcon className="w-4 h-4 flex-shrink-0" />
                
                {chips && chips.length > 0 ? (
                    <div className="flex items-center gap-1 min-w-0">
                        {chips.slice(0, 2).map((chip, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 truncate max-w-24"
                                title={chip}
                            >
                                {chip}
                            </span>
                        ))}
                        {chips.length > 2 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{chips.length - 2}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs font-medium truncate">Tutti i paesi</span>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedCountries.length > 0 && !disabled && (
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
                    className="fixed z-50 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        left: dropdownPosition.left,
                        right: dropdownPosition.right,
                        maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight}px` : undefined
                    }}
                >
                    <div className="overflow-y-auto max-h-full">
                        {/* Header compatto con ricerca */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cerca paese..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg 
                                             bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                    {selectedCountries.length === COUNTRIES.length ? 'Deseleziona' : 'Seleziona tutto'}
                                </button>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {selectedCountries.length}/{COUNTRIES.length}
                                </span>
                            </div>
                        </div>

                        {/* Lista paesi ottimizzata */}
                        <div className="overflow-y-auto filter-dropdown-scrollbar" style={{ maxHeight: dropdownPosition.maxHeight ? `${dropdownPosition.maxHeight - 120}px` : '256px' }}>
                            {filteredCountries.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                                    Nessun paese trovato
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredCountries.map((country) => {
                                        const isSelected = selectedCountries.includes(country.code);
                                        const isCommon = COMMON_EUROPEAN_COUNTRIES.includes(country.code);
                                        
                                        return (
                                            <button
                                                key={country.code}
                                                onClick={() => handleCountryToggle(country.code)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-lg
                                                    hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                                                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                                `}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`
                                                        w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0
                                                        ${isSelected 
                                                            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }
                                                    `}>
                                                        {isSelected && (
                                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`
                                                        truncate
                                                        ${isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'}
                                                        ${isCommon ? 'font-medium' : ''}
                                                    `}>
                                                        {country.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex-shrink-0 ml-2">
                                                    {country.code}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CountryFilter;