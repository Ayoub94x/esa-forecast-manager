import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, getCountryName, COMMON_EUROPEAN_COUNTRIES } from '../../utils/countries';
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from '../icons';

// Semplice icona di check
const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

interface CountryFilterProps {
    selectedCountries: string[];
    onCountryChange: (countries: string[]) => void;
    disabled?: boolean;
}

const CountryFilter: React.FC<CountryFilterProps> = ({
    selectedCountries,
    onCountryChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);

    // Chiudi il dropdown quando si clicca fuori
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

    // Ordina i paesi: prima quelli europei comuni, poi tutti gli altri alfabeticamente
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

    // Filtra i paesi in base al termine di ricerca
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
        } else if (selectedCountries.length <= 3) {
            return selectedCountries.map(code => getCountryName(code)).join(', ');
        } else {
            return `${selectedCountries.length} paesi selezionati`;
        }
    };

    return (
        <div className="relative" ref={filterRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg border
                    transition-all duration-200 min-w-[200px] max-w-[300px]
                    ${disabled 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                        : selectedCountries.length > 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                    }
                `}
            >
                <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-4 h-4" />
                    <span className="truncate">{getDisplayText()}</span>
                </div>
                <div className="flex items-center space-x-1">
                    {selectedCountries.length > 0 && !disabled && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                clearSelection();
                            }}
                            className="p-1 hover:bg-blue-200 rounded dark:hover:bg-blue-800 cursor-pointer"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </div>
                    )}
                    <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    {/* Header con ricerca */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <input
                            type="text"
                            placeholder="Cerca paese..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md 
                                     bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Controlli rapidi */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                                {selectedCountries.length === COUNTRIES.length ? 'Deseleziona tutto' : 'Seleziona tutto'}
                            </button>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {selectedCountries.length} di {COUNTRIES.length} selezionati
                            </span>
                        </div>
                    </div>

                    {/* Lista paesi */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                                Nessun paese trovato
                            </div>
                        ) : (
                            filteredCountries.map((country) => {
                                const isSelected = selectedCountries.includes(country.code);
                                const isCommon = COMMON_EUROPEAN_COUNTRIES.includes(country.code);
                                
                                return (
                                    <button
                                        key={country.code}
                                        onClick={() => handleCountryToggle(country.code)}
                                        className={`
                                            w-full flex items-center justify-between px-4 py-2 text-sm text-left
                                            hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                                            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`
                                                w-4 h-4 border-2 rounded flex items-center justify-center
                                                ${isSelected 
                                                    ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                                                    : 'border-slate-300 dark:border-slate-600'
                                                }
                                            `}>
                                                {isSelected && (
                                                    <CheckIcon className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className={`
                                                ${isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'}
                                                ${isCommon ? 'font-medium' : ''}
                                            `}>
                                                {country.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                            {country.code}
                                        </span>
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

export default CountryFilter;