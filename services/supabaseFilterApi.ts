import { supabase } from './supabaseClient';
import { Forecast, BusinessUnit, Client, User, ForecastStatus } from '../types';
import { FilterQuery, DateRange, NumericRange } from '../types/filters';

/**
 * Interfaccia per i parametri di query avanzata
 */
export interface AdvancedQueryParams {
  dateRange?: DateRange;
  businessUnitIds?: number[];
  clientIds?: number[];
  userIds?: string[];
  statuses?: ForecastStatus[];
  countries?: string[];
  budgetRange?: NumericRange;
  forecastRange?: NumericRange;
  declaredBudgetRange?: NumericRange;
  textSearch?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Risultato della query con metadati
 */
export interface QueryResult<T> {
  data: T[];
  count: number;
  totalCount: number;
  hasMore: boolean;
  executionTime: number;
}

/**
 * Costruisce una query Supabase dinamica basata sui filtri
 */
export const buildDynamicQuery = (params: AdvancedQueryParams) => {
  let query = supabase
    .from('forecasts')
    .select(`
      id,
      month,
      year,
      client_id,
      business_unit_id,
      declared_budget,
      budget,
      forecast,
      user_id,
      last_modified,
      status,
      clients (
        id,
        name,
        paese
      ),
      business_units (
        id,
        name,
        color
      ),
      profiles (
        id,
        full_name
      )
    `, { count: 'exact' });

  // Filtro per intervallo temporale
  if (params.dateRange) {
    const startDate = new Date(params.dateRange.startDate);
    const endDate = new Date(params.dateRange.endDate);
    
    // Converti le date in mese/anno per il confronto
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;

    if (startYear === endYear) {
      query = query
        .eq('year', startYear)
        .gte('month', startMonth)
        .lte('month', endMonth);
    } else {
      query = query
        .or(`and(year.eq.${startYear},month.gte.${startMonth}),and(year.eq.${endYear},month.lte.${endMonth}),and(year.gt.${startYear},year.lt.${endYear})`);
    }
  }

  // Filtro per Business Units
  if (params.businessUnitIds && params.businessUnitIds.length > 0) {
    query = query.in('business_unit_id', params.businessUnitIds);
  }

  // Filtro per Clienti
  if (params.clientIds && params.clientIds.length > 0) {
    query = query.in('client_id', params.clientIds);
  }

  // Filtro per Utenti
  if (params.userIds && params.userIds.length > 0) {
    query = query.in('user_id', params.userIds);
  }

  // Filtro per Stati
  if (params.statuses && params.statuses.length > 0) {
    const statusValues = params.statuses.map(status => 
      status === ForecastStatus.Approved ? 'Approvato' : 'Bozza'
    );
    query = query.in('status', statusValues);
  }

  // Filtro per range Budget
  if (params.budgetRange) {
    query = query
      .gte('budget', params.budgetRange.min)
      .lte('budget', params.budgetRange.max);
  }

  // Filtro per range Forecast
  if (params.forecastRange) {
    query = query
      .gte('forecast', params.forecastRange.min)
      .lte('forecast', params.forecastRange.max);
  }

  // Filtro per range Budget Dichiarato
  if (params.declaredBudgetRange) {
    query = query
      .gte('declared_budget', params.declaredBudgetRange.min)
      .lte('declared_budget', params.declaredBudgetRange.max);
  }

  // Ordinamento
  if (params.orderBy) {
    query = query.order(params.orderBy, { 
      ascending: params.orderDirection === 'asc' 
    });
  } else {
    // Ordinamento di default
    query = query.order('last_modified', { ascending: false });
  }

  // Paginazione
  if (params.limit) {
    const start = params.offset || 0;
    const end = start + params.limit - 1;
    query = query.range(start, end);
  }

  return query;
};

/**
 * Esegue una query avanzata per i forecast
 */
export const getAdvancedForecasts = async (
  params: AdvancedQueryParams
): Promise<QueryResult<Forecast>> => {
  const startTime = performance.now();

  try {
    const query = buildDynamicQuery(params);
    const { data: forecasts, error, count } = await query;

    if (error) {
      console.error('Error in advanced forecast query:', error);
      throw error;
    }

    const executionTime = performance.now() - startTime;

    // Trasforma i dati nel formato dell'applicazione
    const transformedForecasts: Forecast[] = (forecasts || []).map(forecast => ({
      id: forecast.id,
      month: forecast.month,
      year: forecast.year,
      clientId: forecast.client_id,
      businessUnitId: forecast.business_unit_id,
      declaredBudget: parseFloat(forecast.declared_budget) || 0,
      budget: parseFloat(forecast.budget) || 0,
      forecast: parseFloat(forecast.forecast) || 0,
      userId: forecast.user_id,
      lastModified: forecast.last_modified,
      status: forecast.status === 'Approvato' ? ForecastStatus.Approved : ForecastStatus.Draft,
      commentCount: 0 // Sarà calcolato separatamente se necessario
    }));

    // Applica filtri lato client per ricerca testuale e paesi
    let filteredForecasts = transformedForecasts;

    // Filtro per paesi (basato sui clienti)
    if (params.countries && params.countries.length > 0) {
      filteredForecasts = filteredForecasts.filter(forecast => {
        const forecastData = forecasts?.find(f => f.id === forecast.id);
        return forecastData?.clients?.paese && 
               params.countries!.includes(forecastData.clients.paese);
      });
    }

    // Filtro per ricerca testuale
    if (params.textSearch && params.textSearch.trim()) {
      const searchTerm = params.textSearch.toLowerCase().trim();
      filteredForecasts = filteredForecasts.filter(forecast => {
        const forecastData = forecasts?.find(f => f.id === forecast.id);
        if (!forecastData) return false;

        const searchableText = [
          forecastData.clients?.name,
          forecastData.business_units?.name,
          forecastData.profiles?.full_name,
          forecast.status
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }

    const totalCount = count || 0;
    const hasMore = params.limit ? 
      (params.offset || 0) + params.limit < totalCount : 
      false;

    return {
      data: filteredForecasts,
      count: filteredForecasts.length,
      totalCount,
      hasMore,
      executionTime
    };

  } catch (error) {
    console.error('Error executing advanced query:', error);
    throw error;
  }
};

/**
 * Ottiene statistiche aggregate basate sui filtri
 */
export const getFilteredStatistics = async (
  params: AdvancedQueryParams
): Promise<{
  totalBudget: number;
  totalForecast: number;
  totalDeclaredBudget: number;
  averageBudget: number;
  averageForecast: number;
  forecastCount: number;
  businessUnitDistribution: { [key: string]: number };
  statusDistribution: { [key: string]: number };
  monthlyTrends: { month: string; budget: number; forecast: number }[];
}> => {
  try {
    const result = await getAdvancedForecasts(params);
    const forecasts = result.data;

    if (forecasts.length === 0) {
      return {
        totalBudget: 0,
        totalForecast: 0,
        totalDeclaredBudget: 0,
        averageBudget: 0,
        averageForecast: 0,
        forecastCount: 0,
        businessUnitDistribution: {},
        statusDistribution: {},
        monthlyTrends: []
      };
    }

    // Calcoli aggregati
    const totalBudget = forecasts.reduce((sum, f) => sum + f.budget, 0);
    const totalForecast = forecasts.reduce((sum, f) => sum + f.forecast, 0);
    const totalDeclaredBudget = forecasts.reduce((sum, f) => sum + f.declaredBudget, 0);

    // Distribuzioni
    const businessUnitDistribution: { [key: string]: number } = {};
    const statusDistribution: { [key: string]: number } = {};
    const monthlyData: { [key: string]: { budget: number; forecast: number; count: number } } = {};

    forecasts.forEach(forecast => {
      // Distribuzione per Business Unit
      const buKey = forecast.businessUnitId.toString();
      businessUnitDistribution[buKey] = (businessUnitDistribution[buKey] || 0) + 1;

      // Distribuzione per Status
      statusDistribution[forecast.status] = (statusDistribution[forecast.status] || 0) + 1;

      // Trend mensili
      const monthKey = `${forecast.year}-${forecast.month.toString().padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { budget: 0, forecast: 0, count: 0 };
      }
      monthlyData[monthKey].budget += forecast.budget;
      monthlyData[monthKey].forecast += forecast.forecast;
      monthlyData[monthKey].count += 1;
    });

    // Converti i trend mensili in array ordinato
    const monthlyTrends = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        budget: data.budget,
        forecast: data.forecast
      }));

    return {
      totalBudget,
      totalForecast,
      totalDeclaredBudget,
      averageBudget: totalBudget / forecasts.length,
      averageForecast: totalForecast / forecasts.length,
      forecastCount: forecasts.length,
      businessUnitDistribution,
      statusDistribution,
      monthlyTrends
    };

  } catch (error) {
    console.error('Error calculating filtered statistics:', error);
    throw error;
  }
};

/**
 * Ottiene suggerimenti per l'autocompletamento basati sui filtri attuali
 */
export const getSearchSuggestions = async (
  searchTerm: string,
  params: Partial<AdvancedQueryParams> = {}
): Promise<{
  clients: string[];
  businessUnits: string[];
  users: string[];
}> => {
  try {
    const term = searchTerm.toLowerCase().trim();
    if (!term || term.length < 2) {
      return { clients: [], businessUnits: [], users: [] };
    }

    // Query per clienti
    let clientQuery = supabase
      .from('clients')
      .select('name')
      .ilike('name', `%${term}%`)
      .limit(10);

    // Query per business units
    let buQuery = supabase
      .from('business_units')
      .select('name')
      .ilike('name', `%${term}%`)
      .limit(10);

    // Query per utenti
    let userQuery = supabase
      .from('profiles')
      .select('full_name')
      .ilike('full_name', `%${term}%`)
      .limit(10);

    const [clientsResult, businessUnitsResult, usersResult] = await Promise.all([
      clientQuery,
      buQuery,
      userQuery
    ]);

    return {
      clients: clientsResult.data?.map(c => c.name) || [],
      businessUnits: businessUnitsResult.data?.map(bu => bu.name) || [],
      users: usersResult.data?.map(u => u.full_name) || []
    };

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return { clients: [], businessUnits: [], users: [] };
  }
};

/**
 * Salva un preset di filtri nel database
 */
export const saveFilterPreset = async (
  userId: string,
  name: string,
  filters: AdvancedQueryParams,
  isDefault: boolean = false
): Promise<{ id: number; name: string }> => {
  try {
    const { data, error } = await supabase
      .from('filter_presets')
      .insert([{
        user_id: userId,
        name,
        filters: JSON.stringify(filters),
        is_default: isDefault,
        created_at: new Date().toISOString()
      }])
      .select('id, name')
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error saving filter preset:', error);
    throw error;
  }
};

/**
 * Carica i preset di filtri dell'utente
 */
export const loadFilterPresets = async (
  userId: string
): Promise<Array<{ id: number; name: string; filters: AdvancedQueryParams; isDefault: boolean }>> => {
  try {
    const { data, error } = await supabase
      .from('filter_presets')
      .select('id, name, filters, is_default')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(preset => ({
      id: preset.id,
      name: preset.name,
      filters: JSON.parse(preset.filters),
      isDefault: preset.is_default
    }));
  } catch (error) {
    console.error('Error loading filter presets:', error);
    return [];
  }
};

/**
 * Elimina un preset di filtri
 */
export const deleteFilterPreset = async (presetId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('filter_presets')
      .delete()
      .eq('id', presetId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting filter preset:', error);
    throw error;
  }
};