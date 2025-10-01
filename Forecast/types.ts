export enum UserRole {
    Admin = 'Administrator',
    DataEntry = 'Data Entry',
}

export enum ForecastStatus {
    Draft = 'Bozza',
    Approved = 'Approvato',
}

export interface User {
    id: string; // UUID per Supabase
    name: string;
    email: string;
    role: UserRole;
    assignedClientIds?: number[];
    assignedBusinessUnitIds?: number[];
}

export interface Client {
    id: number;
    name: string;
    businessUnitId: number | null;
    paese: string; // Codice ISO del paese (es. "IT", "FR", "DE")
}

export interface BusinessUnit {
    id: number;
    name: string; // e.g., "D03", "D04"
    color?: string; // e.g., "#4F46E5"
}

export interface Forecast {
    id: number;
    month: number; // 1-12
    year: number;
    clientId: number;
    businessUnitId: number;
    declaredBudget: number;
    budget: number;
    forecast: number;
    userId: string; // UUID per Supabase
    lastModified: string; // ISO string
    status: ForecastStatus;
    commentCount?: number;
}

export interface Comment {
    id: number;
    forecastId: number;
    userId: string; // UUID per Supabase
    userName: string;
    text: string;
    timestamp: string; // ISO string
}