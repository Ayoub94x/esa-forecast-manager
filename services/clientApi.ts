import { Client, BusinessUnit } from '../types';
import { supabase } from './supabaseClient';
import * as supabaseApi from './supabaseApi';
import * as mockApi from './mockApi';

const useMock = (import.meta as any).env?.VITE_USE_MOCK === 'true';

export type ClientQueryParams = {
  businessUnitIds?: number[];
  countries?: string[];
  search?: string;
  orderBy?: 'name' | 'paese' | 'business_unit_id';
  orderDirection?: 'asc' | 'desc';
};

export const getClients = async (params: ClientQueryParams = {}): Promise<Client[]> => {
  const { businessUnitIds, countries, search, orderBy = 'name', orderDirection = 'asc' } = params;

  if (useMock && typeof (mockApi as any).getClients === 'function') {
    return (mockApi as any).getClients(params);
  }

  // Query Supabase con filtri lato DB
  let query = supabase
    .from('clients')
    .select('id, name, business_unit_id, paese');

  if (businessUnitIds && businessUnitIds.length > 0) {
    query = query.in('business_unit_id', businessUnitIds);
  }
  if (countries && countries.length > 0) {
    query = query.in('paese', countries);
  }
  if (search && search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }
  if (orderBy) {
    query = query.order(orderBy, { ascending: orderDirection !== 'desc' });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return (data || []).map((client: any) => ({
    id: client.id,
    name: client.name,
    businessUnitId: client.business_unit_id ?? null,
    paese: client.paese || 'IT',
  }));
};

export const addClient = async (
  name: string,
  businessUnitId: number | null,
  paese: string
): Promise<Client> => {
  if (useMock && typeof mockApi.addClient === 'function') {
    return mockApi.addClient(name, businessUnitId);
  }
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
    businessUnitId: data.business_unit_id ?? businessUnitId,
    paese: data.paese || paese,
  };
};

export const updateClient = async (
  id: number,
  updates: Partial<Pick<Client, 'name' | 'businessUnitId' | 'paese'>>
): Promise<Client> => {
  if (useMock && typeof mockApi.updateClient === 'function') {
    // mockApi.updateClient accetta (id, name, businessUnitId)
    const updated = await mockApi.updateClient(
      id,
      updates.name ?? '',
      updates.businessUnitId ?? null
    );
    // Aggiorna paese se presente
    return {
      ...updated,
      paese: updates.paese ?? updated.paese ?? 'IT',
    };
  }
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.businessUnitId !== undefined) payload.business_unit_id = updates.businessUnitId;
  if (updates.paese !== undefined) payload.paese = updates.paese;

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
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
    businessUnitId: data.business_unit_id ?? null,
    paese: data.paese || 'IT',
  };
};

export const deleteClient = async (id: number): Promise<{ success: boolean }> => {
  if (useMock && typeof mockApi.deleteClient === 'function') {
    return mockApi.deleteClient(id);
  }
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
  return { success: true };
};

export const getBusinessUnits = async (): Promise<BusinessUnit[]> => {
  if (useMock && typeof mockApi.getBusinessUnits === 'function') {
    return mockApi.getBusinessUnits();
  }
  return supabaseApi.getBusinessUnits();
};