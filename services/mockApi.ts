import { User, Client, BusinessUnit, Forecast, UserRole, ForecastStatus, Comment } from '../types';

let users: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: UserRole.Admin },
    { id: '2', name: 'Data Entry User A', email: 'userA@example.com', role: UserRole.DataEntry, assignedClientIds: [101, 102], assignedBusinessUnitIds: [1, 2] },
    { id: '3', name: 'Data Entry User B', email: 'userB@example.com', role: UserRole.DataEntry, assignedClientIds: [103, 104], assignedBusinessUnitIds: [3, 4] },
];

let clients: Client[] = [
    { id: 101, name: 'Cliente Alpha', businessUnitId: 1, paese: 'IT' },
    { id: 102, name: 'Cliente Beta', businessUnitId: 2, paese: 'FR' },
    { id: 103, name: 'Cliente Gamma', businessUnitId: 3, paese: 'DE' },
    { id: 104, name: 'Cliente Delta', businessUnitId: 4, paese: 'ES' },
    { id: 105, name: 'Cliente Epsilon', businessUnitId: 1, paese: 'IT' },
];

let businessUnits: BusinessUnit[] = [
    { id: 1, name: 'D03', color: '#4F46E5' },
    { id: 2, name: 'D04', color: '#10B981' },
    { id: 3, name: 'D05', color: '#F97316' },
    { id: 4, name: 'D06', color: '#3B82F6' },
];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

let forecasts: Forecast[] = [
    { id: 1, month: currentMonth, year: currentYear, clientId: 101, businessUnitId: 1, declaredBudget: 52500, budget: 50000, forecast: 52000, userId: '2', lastModified: new Date().toISOString(), status: ForecastStatus.Draft },
    { id: 2, month: currentMonth, year: currentYear, clientId: 102, businessUnitId: 2, declaredBudget: 78750, budget: 75000, forecast: 73000, userId: '2', lastModified: new Date().toISOString(), status: ForecastStatus.Draft },
    { id: 3, month: currentMonth, year: currentYear, clientId: 103, businessUnitId: 3, declaredBudget: 126000, budget: 120000, forecast: 115000, userId: '3', lastModified: new Date().toISOString(), status: ForecastStatus.Draft },
    { id: 4, month: currentMonth, year: currentYear, clientId: 104, businessUnitId: 4, declaredBudget: 92400, budget: 88000, forecast: 90000, userId: '3', lastModified: new Date().toISOString(), status: ForecastStatus.Approved },
    { id: 6, month: currentMonth - 1, year: currentYear, clientId: 101, businessUnitId: 1, declaredBudget: 50400, budget: 48000, forecast: 49000, userId: '2', lastModified: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), status: ForecastStatus.Approved },
];

let comments: Comment[] = [
    { id: 1, forecastId: 1, userId: '1', userName: 'Admin User', text: 'Looks good, but keep an eye on this.', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 2, forecastId: 1, userId: '2', userName: 'Data Entry User A', text: 'Will do. I expect a slight increase next week.', timestamp: new Date().toISOString() },
    { id: 3, forecastId: 4, userId: '3', userName: 'Data Entry User B', text: 'This one is locked in.', timestamp: new Date(Date.now() - 172800000).toISOString() },
];

const simulateDelay = <T,>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));

// --- User API ---
export const getUsers = () => simulateDelay(users);
export const getUserById = (id: string) => simulateDelay(users.find(u => u.id === id));

// --- Client API ---
export const getClients = (params: { businessUnitIds?: number[]; countries?: string[]; search?: string } = {}) => {
    let result = [...clients];
    const { businessUnitIds, countries, search } = params;
    if (businessUnitIds && businessUnitIds.length > 0) {
        result = result.filter(c => c.businessUnitId && businessUnitIds.includes(c.businessUnitId));
    }
    if (countries && countries.length > 0) {
        result = result.filter(c => c.paese && countries.includes(c.paese));
    }
    if (search && search.trim()) {
        const term = search.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(term));
    }
    return simulateDelay(result);
}
export const addClient = (name: string, businessUnitId: number | null) => {
    const newClient: Client = { id: Date.now(), name, businessUnitId, paese: 'IT' };
    clients.push(newClient);
    return simulateDelay(newClient);
}
export const updateClient = (id: number, name: string, businessUnitId: number | null) => {
    const client = clients.find(c => c.id === id);
    if (client) {
        client.name = name;
        client.businessUnitId = businessUnitId;
        return simulateDelay(client);
    }
    return Promise.reject('Client not found');
}
export const deleteClient = (id: number) => {
    clients = clients.filter(c => c.id !== id);
    return simulateDelay({ success: true });
}

// --- Business Unit API ---
export const getBusinessUnits = () => simulateDelay(businessUnits);
export const addBusinessUnit = (name: string, color: string) => {
    const newBU: BusinessUnit = { id: Date.now(), name, color };
    businessUnits.push(newBU);
    return simulateDelay(newBU);
}
export const updateBusinessUnit = (id: number, name: string, color: string) => {
    const bu = businessUnits.find(b => b.id === id);
    if (bu) {
        bu.name = name;
        bu.color = color;
        return simulateDelay(bu);
    }
    return Promise.reject('Business Unit not found');
}
export const deleteBusinessUnit = (id: number) => {
    businessUnits = businessUnits.filter(b => b.id !== id);
    return simulateDelay({ success: true });
}

// --- Forecast API ---
export const getForecasts = (user: User, month: number, year: number) => {
    let userForecasts = forecasts.filter(f => f.month === month && f.year === year);
    if (user.role === UserRole.DataEntry) {
        userForecasts = userForecasts.filter(f =>
            user.assignedClientIds?.includes(f.clientId) &&
            user.assignedBusinessUnitIds?.includes(f.businessUnitId)
        );
    }

    const forecastsWithCounts = userForecasts.map(f => ({
        ...f,
        commentCount: comments.filter(c => c.forecastId === f.id).length
    }));

    return simulateDelay(forecastsWithCounts);
};

export const getAllForecasts = () => simulateDelay(forecasts);


export const updateForecastValue = (forecastId: number, field: 'budget' | 'forecast' | 'declaredBudget', value: number, userId: string) => {
    const forecast = forecasts.find(f => f.id === forecastId);
    if (forecast) {
        forecast[field] = value;
        forecast.userId = userId;
        forecast.lastModified = new Date().toISOString();
        forecast.status = ForecastStatus.Draft;
        return simulateDelay(forecast);
    }
    return Promise.reject('Forecast not found');
};

export const updateForecastStatus = (forecastId: number, status: ForecastStatus, userId: string) => {
    const forecast = forecasts.find(f => f.id === forecastId);
    if (forecast) {
        forecast.status = status;
        forecast.userId = userId;
        forecast.lastModified = new Date().toISOString();
        return simulateDelay(forecast);
    }
    return Promise.reject('Forecast not found');
};

export const addForecast = (data: Omit<Forecast, 'id' | 'lastModified' | 'status' | 'commentCount'>): Promise<Forecast> => {
    const newForecast: Forecast = {
        ...data,
        id: Date.now(),
        lastModified: new Date().toISOString(),
        status: ForecastStatus.Draft,
    };
    forecasts.push(newForecast);
    return simulateDelay(newForecast);
};

export const deleteForecast = (forecastId: number): Promise<{ success: true }> => {
    const initialLength = forecasts.length;
    forecasts = forecasts.filter(f => f.id !== forecastId);
    if (forecasts.length < initialLength) {
        comments = comments.filter(c => c.forecastId !== forecastId);
        return simulateDelay({ success: true });
    }
    return Promise.reject('Forecast not found');
};


// --- Comment API ---
export const getCommentsByForecastId = (forecastId: number) => {
    const forecastComments = comments.filter(c => c.forecastId === forecastId);
    return simulateDelay(forecastComments);
};

export const addComment = (forecastId: number, text: string, userId: string, userName: string) => {
    const newComment: Comment = {
        id: Date.now(),
        forecastId,
        text,
        userId,
        userName,
        timestamp: new Date().toISOString()
    };
    comments.push(newComment);
    return simulateDelay(newComment);
};

export const updateComment = (commentId: number, text: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.text = text;
        comment.timestamp = new Date().toISOString(); // Update timestamp on edit
        return simulateDelay(comment);
    }
    return Promise.reject('Comment not found');
};

export const deleteComment = (commentId: number) => {
    comments = comments.filter(c => c.id !== commentId);
    return simulateDelay({ success: true });
};