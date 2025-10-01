import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FilterQuery, DateRange } from '../types/filters';
import { ForecastStatus } from '../types';
import { DataTypeSelection } from '../components/filters/DataTypeSelector';

interface FilterContextType {
    filters: FilterQuery;
    updateFilters: (newFilters: Partial<FilterQuery>) => void;
    resetFilters: () => void;
    buildQuery: () => FilterQuery;
    
    // Filtri specifici
    setDateRange: (dateRange: DateRange | null) => void;
    setBusinessUnitIds: (ids: number[]) => void;
    setClientIds: (ids: number[]) => void;
    setUserIds: (ids: string[]) => void;
    setStatuses: (statuses: ForecastStatus[]) => void;
    setCountries: (countries: string[]) => void;
    setTextSearch: (search: string) => void;
    
    // Selezione tipi di dati
    dataTypeSelection: DataTypeSelection;
    setDataTypeSelection: (selection: DataTypeSelection) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultFilters: FilterQuery = {
    dateRange: null,
    businessUnitIds: [],
    clientIds: [],
    userIds: [],
    statuses: [],
    countries: [],
    budgetRange: null,
    forecastRange: null,
    declaredBudgetRange: null,
    textSearch: '',
    limit: 100,
    offset: 0,
    orderBy: 'last_modified',
    orderDirection: 'desc'
};

interface FilterProviderProps {
    children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
    const [filters, setFilters] = useState<FilterQuery>(defaultFilters);
    const [dataTypeSelection, setDataTypeSelectionState] = useState<DataTypeSelection>({
        budget: true,
        forecast: true,
        declaredBudget: true
    });

    const updateFilters = useCallback((newFilters: Partial<FilterQuery>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            // Reset offset quando cambiano i filtri (eccetto per paginazione)
            offset: newFilters.offset !== undefined ? newFilters.offset : 0
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    const buildQuery = useCallback((): FilterQuery => {
        return {
            dateRange: filters.dateRange,
            businessUnitIds: filters.businessUnitIds,
            clientIds: filters.clientIds,
            userIds: filters.userIds,
            statuses: filters.statuses,
            countries: filters.countries,
            budgetRange: filters.budgetRange,
            forecastRange: filters.forecastRange,
            declaredBudgetRange: filters.declaredBudgetRange,
            textSearch: filters.textSearch,
            limit: filters.limit,
            offset: filters.offset,
            orderBy: filters.orderBy,
            orderDirection: filters.orderDirection
        };
    }, [filters.dateRange, filters.businessUnitIds, filters.clientIds, filters.userIds, filters.statuses, filters.countries, filters.budgetRange, filters.forecastRange, filters.declaredBudgetRange, filters.textSearch, filters.limit, filters.offset, filters.orderBy, filters.orderDirection]);

    // Metodi specifici per ogni tipo di filtro
    const setDateRange = useCallback((dateRange: DateRange | null) => {
        updateFilters({ dateRange });
    }, [updateFilters]);

    const setBusinessUnitIds = useCallback((businessUnitIds: number[]) => {
        updateFilters({ businessUnitIds });
    }, [updateFilters]);

    const setClientIds = useCallback((clientIds: number[]) => {
        updateFilters({ clientIds });
    }, [updateFilters]);

    const setUserIds = useCallback((userIds: string[]) => {
        updateFilters({ userIds });
    }, [updateFilters]);

    const setStatuses = useCallback((statuses: ForecastStatus[]) => {
        updateFilters({ statuses });
    }, [updateFilters]);

    const setCountries = useCallback((countries: string[]) => {
        updateFilters({ countries });
    }, [updateFilters]);

    const setTextSearch = useCallback((textSearch: string) => {
        updateFilters({ textSearch });
    }, [updateFilters]);

    const setDataTypeSelection = useCallback((selection: DataTypeSelection) => {
        setDataTypeSelectionState(selection);
    }, []);

    const value: FilterContextType = {
        filters,
        updateFilters,
        resetFilters,
        buildQuery,
        setDateRange,
        setBusinessUnitIds,
        setClientIds,
        setUserIds,
        setStatuses,
        setCountries,
        setTextSearch,
        dataTypeSelection,
        setDataTypeSelection
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = (): FilterContextType => {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};

export default FilterContext;