import { ForecastStatus } from '../types';

export interface DateRange {
    start: Date;
    end: Date;
    startDate?: string; // Per compatibilità con API
    endDate?: string;   // Per compatibilità con API
}

export interface NumericRange {
    min: number;
    max: number;
}

export interface FilterQuery {
    // Filtri temporali
    dateRange?: DateRange | null;
    
    // Filtri per entità
    businessUnitIds?: number[];
    clientIds?: number[];
    userIds?: string[];
    
    // Filtri per stato e paese
    statuses?: ForecastStatus[];
    countries?: string[];
    
    // Filtri numerici
    budgetRange?: NumericRange | null;
    forecastRange?: NumericRange | null;
    declaredBudgetRange?: NumericRange | null;
    
    // Ricerca testuale
    textSearch?: string;
    
    // Paginazione e ordinamento
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}

// Interfaccia per i risultati delle statistiche filtrate
export interface FilteredStatistics {
    totalBudget: number;
    totalForecast: number;
    totalDeclaredBudget: number;
    averageBudget: number;
    averageForecast: number;
    forecastCount: number;
    deltaPercentage: number;
    
    // Statistiche per Business Unit
    businessUnitStats: Array<{
        businessUnitId: number;
        businessUnitName: string;
        totalBudget: number;
        totalForecast: number;
        forecastCount: number;
    }>;
    
    // Statistiche per paese
    countryStats: Array<{
        countryCode: string;
        countryName: string;
        totalBudget: number;
        totalForecast: number;
        forecastCount: number;
    }>;
    
    // Statistiche temporali
    monthlyStats: Array<{
        month: number;
        year: number;
        totalBudget: number;
        totalForecast: number;
        forecastCount: number;
    }>;
}

// Tipi per i preset di filtri
export interface FilterPreset {
    id: string;
    name: string;
    description?: string;
    filters: FilterQuery;
    isDefault?: boolean;
    userId?: string; // Per preset personali
    createdAt: Date;
    updatedAt: Date;
}

// Enum per i tipi di preset comuni
export enum CommonFilterPresets {
    CURRENT_MONTH = 'current_month',
    CURRENT_QUARTER = 'current_quarter',
    CURRENT_YEAR = 'current_year',
    LAST_30_DAYS = 'last_30_days',
    LAST_90_DAYS = 'last_90_days',
    APPROVED_ONLY = 'approved_only',
    DRAFT_ONLY = 'draft_only'
}

export default FilterQuery;