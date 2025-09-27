import { supabase } from './supabaseClient';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { User, Client, BusinessUnit, Forecast, UserRole, ForecastStatus, Comment } from '../types';

// --- Auth API ---
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });
  if (error) console.error('Error signing up:', error.message);
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) console.error('Error signing in:', error.message);
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// --- User/Profile API ---
export const getUsers = async (): Promise<User[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return profiles.map(profile => ({
    id: profile.id,
    name: profile.full_name || 'Unknown User',
    email: '', // Email non disponibile in profiles per privacy
    role: profile.role === 'Administrator' ? UserRole.Admin : UserRole.DataEntry,
    assignedClientIds: profile.assigned_client_ids || [],
    assignedBusinessUnitIds: profile.assigned_business_unit_ids || []
  }));
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return undefined;
  }

  return {
    id: profile.id,
    name: profile.full_name || 'Unknown User',
    email: '',
    role: profile.role === 'Administrator' ? UserRole.Admin : UserRole.DataEntry,
    assignedClientIds: profile.assigned_client_ids || [],
    assignedBusinessUnitIds: profile.assigned_business_unit_ids || []
  };
};

export const getCurrentUserProfile = async (sessionUser?: Pick<SupabaseAuthUser, 'id' | 'email'>): Promise<User | null> => {
  try {
    let authUser = sessionUser;

    if (!authUser) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      authUser = { id: user.id, email: user.email };
    }

    if (!authUser) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      id: profile.id,
      name: profile.full_name || 'Unknown User',
      email: authUser.email || '',
      role: profile.role === 'Administrator' ? UserRole.Admin : UserRole.DataEntry,
      assignedClientIds: profile.assigned_client_ids || [],
      assignedBusinessUnitIds: profile.assigned_business_unit_ids || []
    };
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
};

// --- Client API ---
export const getClients = async (): Promise<Client[]> => {
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      business_unit_id,
      paese,
      business_units (
        id,
        name
      )
    `);
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return clients.map(client => ({
    id: client.id,
    name: client.name,
    businessUnitId: client.business_unit_id,
    paese: client.paese
  }));
};

export const addClient = async (name: string, businessUnitId: number | null, paese: string): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{ name, business_unit_id: businessUnitId, paese }])
    .select()
    .single();

  if (error) {
    console.error('Error adding client:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    businessUnitId: data.business_unit_id,
    paese: data.paese
  };
};

export const updateClient = async (id: number, name: string, businessUnitId: number | null, paese: string): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .update({ name, business_unit_id: businessUnitId, paese })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    businessUnitId: data.business_unit_id,
    paese: data.paese
  };
};

export const deleteClient = async (id: number): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    return { success: false };
  }

  return { success: true };
};

// --- Business Unit API ---
export const getBusinessUnits = async (): Promise<BusinessUnit[]> => {
  const { data: businessUnits, error } = await supabase
    .from('business_units')
    .select('*');
  
  if (error) {
    console.error('Error fetching business units:', error);
    return [];
  }

  return businessUnits.map(bu => ({
    id: bu.id,
    name: bu.name,
    color: bu.color || '#4F46E5' // Usa il colore dal database o un default
  }));
};

export const addBusinessUnit = async (name: string, color: string): Promise<BusinessUnit> => {
  const { data, error } = await supabase
    .from('business_units')
    .insert([{ name, color }])
    .select()
    .single();

  if (error) {
    console.error('Error adding business unit:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color || color
  };
};

export const updateBusinessUnit = async (id: number, name: string, color: string): Promise<BusinessUnit> => {
  const { data, error } = await supabase
    .from('business_units')
    .update({ name, color })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating business unit:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color || color
  };
};

export const deleteBusinessUnit = async (id: number): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('business_units')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting business unit:', error);
    return { success: false };
  }

  return { success: true };
};

// --- Forecast API ---
export const getForecasts = async (user: User, month: number, year: number): Promise<Forecast[]> => {
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
        name
      ),
      business_units (
        id,
        name
      )
    `)
    .eq('month', month)
    .eq('year', year);

  const { data: forecasts, error } = await query;
  
  if (error) {
    console.error('Error fetching forecasts:', error);
    return [];
  }

  return forecasts.map(forecast => ({
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
    status: forecast.status === 'Approvato' ? ForecastStatus.Approved : ForecastStatus.Draft
  }));
};

export const getAllForecasts = async (): Promise<Forecast[]> => {
  const { data: forecasts, error } = await supabase
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
      status
    `);
  
  if (error) {
    console.error('Error fetching all forecasts:', error);
    return [];
  }

  return forecasts.map(forecast => ({
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
    status: forecast.status === 'Approvato' ? ForecastStatus.Approved : ForecastStatus.Draft
  }));
};

export const updateForecastValue = async (
  forecastId: number, 
  field: 'budget' | 'forecast' | 'declaredBudget', 
  value: number, 
  userId: string
): Promise<Forecast> => {
  const fieldMap = {
    'budget': 'budget',
    'forecast': 'forecast',
    'declaredBudget': 'declared_budget'
  };

  const { data, error } = await supabase
    .from('forecasts')
    .update({ 
      [fieldMap[field]]: value,
      user_id: userId,
      last_modified: new Date().toISOString()
    })
    .eq('id', forecastId)
    .select()
    .single();

  if (error) {
    console.error('Error updating forecast:', error);
    throw error;
  }

  return {
    id: data.id,
    month: data.month,
    year: data.year,
    clientId: data.client_id,
    businessUnitId: data.business_unit_id,
    declaredBudget: parseFloat(data.declared_budget) || 0,
    budget: parseFloat(data.budget) || 0,
    forecast: parseFloat(data.forecast) || 0,
    userId: data.user_id,
    lastModified: data.last_modified,
    status: data.status === 'Approvato' ? ForecastStatus.Approved : ForecastStatus.Draft
  };
};

export const updateForecastStatus = async (
  forecastId: number, 
  status: ForecastStatus, 
  userId: string
): Promise<Forecast> => {
  const statusValue = status === ForecastStatus.Approved ? 'Approvato' : 'Bozza';

  const { data, error } = await supabase
    .from('forecasts')
    .update({ 
      status: statusValue,
      user_id: userId,
      last_modified: new Date().toISOString()
    })
    .eq('id', forecastId)
    .select()
    .single();

  if (error) {
    console.error('Error updating forecast status:', error);
    throw error;
  }

  return {
    id: data.id,
    month: data.month,
    year: data.year,
    clientId: data.client_id,
    businessUnitId: data.business_unit_id,
    declaredBudget: parseFloat(data.declared_budget) || 0,
    budget: parseFloat(data.budget) || 0,
    forecast: parseFloat(data.forecast) || 0,
    userId: data.user_id,
    lastModified: data.last_modified,
    status: data.status === 'Approvato' ? ForecastStatus.Approved : ForecastStatus.Draft
  };
};

export const addForecast = async (data: Omit<Forecast, 'id' | 'lastModified' | 'status'>): Promise<Forecast> => {
  const { data: newForecast, error } = await supabase
    .from('forecasts')
    .insert([{
      month: data.month,
      year: data.year,
      client_id: data.clientId,
      business_unit_id: data.businessUnitId,
      declared_budget: data.declaredBudget,
      budget: data.budget,
      forecast: data.forecast,
      user_id: data.userId,
      status: 'Bozza'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding forecast:', error);
    throw error;
  }

  return {
    id: newForecast.id,
    month: newForecast.month,
    year: newForecast.year,
    clientId: newForecast.client_id,
    businessUnitId: newForecast.business_unit_id,
    declaredBudget: parseFloat(newForecast.declared_budget) || 0,
    budget: parseFloat(newForecast.budget) || 0,
    forecast: parseFloat(newForecast.forecast) || 0,
    userId: newForecast.user_id,
    lastModified: newForecast.last_modified,
    status: ForecastStatus.Draft
  };
};

export const deleteForecast = async (forecastId: number): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('forecasts')
    .delete()
    .eq('id', forecastId);

  if (error) {
    console.error('Error deleting forecast:', error);
    return { success: false };
  }

  return { success: true };
};

// --- Comment API ---
export const getCommentsByForecastId = async (forecastId: number): Promise<Comment[]> => {
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      id,
      forecast_id,
      user_id,
      text,
      created_at,
      profiles (
        full_name
      )
    `)
    .eq('forecast_id', forecastId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return comments.map(comment => ({
    id: comment.id,
    forecastId: comment.forecast_id,
    userId: comment.user_id,
    userName: comment.profiles?.full_name || 'Unknown User',
    text: comment.text,
    timestamp: comment.created_at
  }));
};

export const addComment = async (
  forecastId: number, 
  text: string, 
  userId: string, 
  userName: string
): Promise<Comment> => {
  const { data, error } = await supabase
    .from('comments')
    .insert([{
      forecast_id: forecastId,
      user_id: userId,
      text: text
    }])
    .select(`
      id,
      forecast_id,
      user_id,
      text,
      created_at,
      profiles (
        full_name
      )
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return {
    id: data.id,
    forecastId: data.forecast_id,
    userId: data.user_id,
    userName: data.profiles?.full_name || userName,
    text: data.text,
    timestamp: data.created_at
  };
};

export const updateComment = async (commentId: number, text: string): Promise<Comment> => {
  const { data, error } = await supabase
    .from('comments')
    .update({ text })
    .eq('id', commentId)
    .select(`
      id,
      forecast_id,
      user_id,
      text,
      created_at,
      profiles (
        full_name
      )
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return {
    id: data.id,
    forecastId: data.forecast_id,
    userId: data.user_id,
    userName: data.profiles?.full_name || 'Unknown User',
    text: data.text,
    timestamp: data.created_at
  };
};

export const deleteComment = async (commentId: number): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return { success: false };
  }

  return { success: true };
};

