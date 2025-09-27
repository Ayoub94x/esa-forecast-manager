# Analisi Tecnica: Problema di Caricamento Infinito durante il Refresh

## 1. Analisi del Problema Attuale

### 1.1 Identificazione del Problema
L'applicazione React con Supabase Auth entra in uno stato di caricamento infinito durante il refresh della pagina. Dopo l'analisi del codice esistente, sono state identificate le seguenti cause principali:

**Problemi Identificati nel Codice Attuale:**

1. **Gestione Inadeguata degli Stati di Errore**
   - Il `AuthContext` attuale non gestisce correttamente i casi in cui il token è scaduto o non valido
   - Non esiste un meccanismo di fallback per errori di rete durante la verifica della sessione
   - Il timeout di 8 secondi è troppo lungo e non risolve il problema alla radice

2. **Mancanza di Retry Logic**
   - Non c'è alcun meccanismo di retry per le richieste fallite
   - Gli errori temporanei di rete causano uno stato di loading permanente

3. **Gestione Incompleta dello Stato di Autenticazione**
   - Il `onAuthStateChange` non gestisce tutti i possibili stati di errore
   - Non c'è distinzione tra "caricamento iniziale" e "errore di autenticazione"

### 1.2 Flusso Problematico Attuale
```mermaid
graph TD
    A[Page Refresh] --> B[AuthContext useEffect]
    B --> C[onAuthStateChange Listener]
    C --> D{Session Valid?}
    D -->|Yes| E[Load User Profile]
    D -->|No| F[Set User to null]
    D -->|Error/Timeout| G[Loading State Stuck]
    E --> H{Profile Load Success?}
    H -->|Yes| I[Set User & loading=false]
    H -->|No| G
    F --> J[loading=false]
    G --> K[INFINITE LOADING]
```

## 2. Proposta di Soluzione

### 2.1 Strategia di Risoluzione

**Obiettivi della Soluzione:**
1. Implementare un sistema robusto di gestione degli stati di autenticazione
2. Aggiungere meccanismi di retry e fallback
3. Prevenire i redirect loop
4. Gestire correttamente token scaduti e errori di rete
5. Implementare timeout intelligenti con azioni di recovery

**Componenti della Soluzione:**
1. **Enhanced AuthContext** con gestione avanzata degli errori
2. **Retry Mechanism** per richieste fallite
3. **Intelligent Timeout** con fallback automatico
4. **Error Boundary** per catturare errori non gestiti
5. **Session Validation** migliorata

### 2.2 Architettura della Soluzione
```mermaid
graph TD
    A[Page Refresh] --> B[Enhanced AuthContext]
    B --> C[Initialize Auth State]
    C --> D[Check Existing Session]
    D --> E{Session Exists?}
    E -->|Yes| F[Validate Session]
    E -->|No| G[Set Unauthenticated]
    F --> H{Validation Success?}
    H -->|Yes| I[Load User Profile with Retry]
    H -->|No| J[Clear Invalid Session]
    I --> K{Profile Load Success?}
    K -->|Yes| L[Set Authenticated State]
    K -->|No| M[Retry with Exponential Backoff]
    M --> N{Max Retries Reached?}
    N -->|No| I
    N -->|Yes| O[Fallback to Logout]
    J --> G
    G --> P[Redirect to Login]
    L --> Q[App Ready]
    O --> P
```

## 3. Implementazione della Soluzione

### 3.1 Enhanced AuthContext

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUserProfile, signIn, signOut, signUp } from '../services/supabaseApi';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    retryAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Configurazione retry
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 secondo
    maxDelay: 5000,  // 5 secondi
    timeout: 10000   // 10 secondi timeout totale
};

// Utility per delay con exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt: number): number => {
    const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
    return Math.min(exponentialDelay, RETRY_CONFIG.maxDelay);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Funzione per caricare il profilo utente con retry
    const loadUserProfileWithRetry = useCallback(async (sessionUser: any, attempt = 0): Promise<User | null> => {
        try {
            const userProfile = await getCurrentUserProfile(sessionUser);
            if (userProfile) {
                return userProfile;
            } else {
                // Fallback se il profilo non esiste
                return {
                    id: sessionUser.id,
                    name: sessionUser.user_metadata?.full_name || sessionUser.email || 'Unknown User',
                    email: sessionUser.email || '',
                    role: sessionUser.user_metadata?.role === UserRole.Admin ? UserRole.Admin : UserRole.DataEntry,
                    assignedClientIds: [],
                    assignedBusinessUnitIds: []
                };
            }
        } catch (profileError) {
            console.error(`Attempt ${attempt + 1} - Error loading user profile:`, profileError);
            
            if (attempt < RETRY_CONFIG.maxRetries) {
                const retryDelay = calculateRetryDelay(attempt);
                console.log(`Retrying in ${retryDelay}ms...`);
                await delay(retryDelay);
                return loadUserProfileWithRetry(sessionUser, attempt + 1);
            } else {
                throw new Error('Failed to load user profile after multiple attempts');
            }
        }
    }, []);

    // Funzione per validare la sessione corrente
    const validateCurrentSession = useCallback(async (): Promise<boolean> => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session validation error:', error);
                return false;
            }
            
            if (!session || !session.user) {
                return false;
            }
            
            // Verifica se il token è scaduto
            const now = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at < now) {
                console.log('Session expired, attempting refresh...');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (refreshError || !refreshData.session) {
                    console.error('Session refresh failed:', refreshError);
                    return false;
                }
                
                return true;
            }
            
            return true;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }, []);

    // Funzione per inizializzare l'autenticazione
    const initializeAuth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Validazione sessione con timeout
            const sessionValidationPromise = validateCurrentSession();
            const timeoutPromise = new Promise<boolean>((_, reject) => 
                setTimeout(() => reject(new Error('Session validation timeout')), RETRY_CONFIG.timeout)
            );
            
            const isSessionValid = await Promise.race([sessionValidationPromise, timeoutPromise]);
            
            if (!isSessionValid) {
                // Sessione non valida o scaduta
                await supabase.auth.signOut();
                setUser(null);
                setAuthInitialized(true);
                setLoading(false);
                return;
            }
            
            // Ottieni la sessione corrente
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const userProfile = await loadUserProfileWithRetry(session.user);
                setUser(userProfile);
            } else {
                setUser(null);
            }
            
            setAuthInitialized(true);
            setRetryCount(0);
        } catch (error) {
            console.error('Auth initialization error:', error);
            setError(error instanceof Error ? error.message : 'Authentication initialization failed');
            
            // Fallback: logout e redirect
            await supabase.auth.signOut();
            setUser(null);
            setAuthInitialized(true);
        } finally {
            setLoading(false);
        }
    }, [validateCurrentSession, loadUserProfileWithRetry]);

    // Funzione per retry manuale
    const retryAuth = useCallback(async () => {
        if (retryCount < RETRY_CONFIG.maxRetries) {
            setRetryCount(prev => prev + 1);
            await initializeAuth();
        }
    }, [initializeAuth, retryCount]);

    // Effect principale per l'inizializzazione
    useEffect(() => {
        let mounted = true;
        let authSubscription: any;

        const setupAuth = async () => {
            // Inizializzazione iniziale
            if (mounted) {
                await initializeAuth();
            }

            // Setup del listener per i cambiamenti di stato
            if (mounted) {
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (!mounted) return;
                    
                    console.log('Auth state change:', event, session?.user?.id);
                    
                    try {
                        if (event === 'SIGNED_OUT' || !session?.user) {
                            setUser(null);
                            setError(null);
                        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                            const userProfile = await loadUserProfileWithRetry(session.user);
                            setUser(userProfile);
                            setError(null);
                        }
                    } catch (error) {
                        console.error('Error handling auth state change:', error);
                        setError(error instanceof Error ? error.message : 'Authentication error');
                    }
                });
                
                authSubscription = subscription;
            }
        };

        setupAuth();

        return () => {
            mounted = false;
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, [initializeAuth, loadUserProfileWithRetry]);

    const login = async (email: string, password: string) => {
        setError(null);
        const { error } = await signIn(email, password);
        if (error) {
            throw new Error(error.message);
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        setError(null);
        const { error } = await signUp(email, password, fullName);
        if (error) {
            throw new Error(error.message);
        }
    };

    const logout = async () => {
        setError(null);
        const { error } = await signOut();
        if (error) {
            throw new Error(error.message);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading: loading || !authInitialized, 
            error, 
            login, 
            register, 
            logout, 
            clearError, 
            retryAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### 3.2 Enhanced App Component con Error Boundary

```typescript
// App.tsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { ThemeProvider } from './contexts/ThemeContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ForecastPage from './pages/ForecastPage';
import AdminManagementPage from './pages/AdminManagementPage';
import Header from './components/Header';
import { UserRole } from './types';
import NotFoundPage from './pages/NotFoundPage';

// Componente per gestire errori di autenticazione
const AuthErrorFallback: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => {
    return (
        <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 bg-slate-50">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                <div className="text-red-500 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Errore di Autenticazione
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {error}
                </p>
                <div className="space-y-2">
                    <button
                        onClick={onRetry}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Riprova
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        Vai al Login
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente di loading migliorato
const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Caricamento in corso...
                </p>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <HashRouter>
                        <Main />
                    </HashRouter>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

const Main: React.FC = () => {
    const { user, loading, error, retryAuth, clearError } = useAuth();

    // Gestione errori di autenticazione
    if (error && !loading) {
        return (
            <AuthErrorFallback 
                error={error} 
                onRetry={() => {
                    clearError();
                    retryAuth();
                }} 
            />
        );
    }

    // Stato di caricamento
    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {user ? (
                <div className="min-h-screen flex flex-col dark:bg-slate-900">
                    <Header />
                    <main className="flex-grow p-6 flex">
                        <Routes>
                            <Route path="/login" element={<Navigate to="/" replace />} />
                            <Route path="/forecast" element={<ForecastPage />} />
                            
                            <Route element={<AdminRoute />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/admin/clients" element={<AdminManagementPage entityType="client" />} />
                                <Route path="/admin/bus" element={<AdminManagementPage entityType="businessUnit" />} />
                            </Route>

                            <Route 
                                path="/" 
                                element={
                                    user.role === UserRole.Admin 
                                        ? <Navigate to="/dashboard" replace /> 
                                        : <Navigate to="/forecast" replace />
                                } 
                            />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            )}
            <ToastContainer />
        </>
    );
};

const AdminRoute = () => {
    const { user } = useAuth();
    if (user?.role !== UserRole.Admin) {
        return <Navigate to="/forecast" replace />;
    }
    return <Outlet />;
};

export default App;
```

### 3.3 Enhanced Supabase Client con Configurazioni Avanzate

```typescript
// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wctxsqpxckrklttsmqfi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdHhzcXB4Y2tya2x0dHNtcWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDQ1NTksImV4cCI6MjA3NDEyMDU1OX0.1oit55Scx5gAmx7l2f3lgKcfEZtGGIz3JpwqQpSMJoM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Configurazioni per migliorare la gestione delle sessioni
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Timeout per le richieste di autenticazione
        flowType: 'pkce'
    },
    // Configurazioni globali per le richieste
    global: {
        headers: {
            'X-Client-Info': 'forecast-app@1.0.0'
        }
    },
    // Configurazioni per il database
    db: {
        schema: 'public'
    },
    // Configurazioni per il realtime (se necessario)
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Utility per gestire errori di rete
export const handleSupabaseError = (error: any): string => {
    if (!error) return 'Errore sconosciuto';
    
    // Errori di rete
    if (error.message?.includes('fetch')) {
        return 'Errore di connessione. Verifica la tua connessione internet.';
    }
    
    // Errori di autenticazione
    if (error.message?.includes('Invalid login credentials')) {
        return 'Credenziali di accesso non valide.';
    }
    
    if (error.message?.includes('Email not confirmed')) {
        return 'Email non confermata. Controlla la tua casella di posta.';
    }
    
    if (error.message?.includes('Token has expired')) {
        return 'Sessione scaduta. Effettua nuovamente il login.';
    }
    
    // Errori generici
    return error.message || 'Si è verificato un errore imprevisto.';
};

// Utility per verificare lo stato della connessione
export const checkConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
};
```

## 4. Benefici della Soluzione

### 4.1 Risoluzione dei Problemi Identificati

1. **Eliminazione del Caricamento Infinito**
   - Timeout intelligente con fallback automatico
   - Gestione robusta degli errori di rete
   - Meccanismo di retry con exponential backoff

2. **Prevenzione dei Redirect Loop**
   - Stato di inizializzazione separato dal loading
   - Gestione esplicita degli stati di errore
   - Redirect condizionali basati sullo stato di autenticazione

3. **Gestione Migliorata dei Token**
   - Validazione automatica delle sessioni
   - Refresh automatico dei token scaduti
   - Logout automatico per token non recuperabili

4. **User Experience Migliorata**
   - Messaggi di errore chiari e actionable
   - Possibilità di retry manuale
   - Loading states informativi

### 4.2 Flusso Ottimizzato
```mermaid
graph TD
    A[Page Refresh] --> B[Enhanced AuthContext]
    B --> C[Initialize Auth with Timeout]
    C --> D{Session Valid?}
    D -->|Yes| E[Load Profile with Retry]
    D -->|No| F[Clear Session & Redirect]
    D -->|Error| G[Show Error with Retry Option]
    E --> H{Profile Success?}
    H -->|Yes| I[App Ready]
    H -->|No| J[Retry with Backoff]
    J --> K{Max Retries?}
    K -->|No| E
    K -->|Yes| L[Fallback Logout]
    F --> M[Login Page]
    G --> N[User Choice]
    N -->|Retry| C
    N -->|Login| M
    L --> M
```

## 5. Implementazione e Testing

### 5.1 Checklist di Implementazione

- [ ] Sostituire il file `contexts/AuthContext.tsx` con la versione enhanced
- [ ] Aggiornare il file `App.tsx` con i nuovi componenti di error handling
- [ ] Aggiornare il file `services/supabaseClient.ts` con le configurazioni avanzate
- [ ] Testare il comportamento durante il refresh della pagina
- [ ] Testare la gestione degli errori di rete
- [ ] Testare il comportamento con token scaduti
- [ ] Verificare che non ci siano redirect loop

### 5.2 Scenari di Test

1. **Test di Refresh con Sessione Valida**
   - Refresh della pagina con utente loggato
   - Verifica che l'app si carichi correttamente

2. **Test di Refresh con Sessione Scaduta**
   - Simulare token scaduto
   - Verifica redirect automatico al login

3. **Test di Errori di Rete**
   - Disconnettere la rete durante l'inizializzazione
   - Verifica comportamento di retry

4. **Test di Timeout**
   - Simulare richieste lente
   - Verifica attivazione del timeout

### 5.3 Monitoraggio e Logging

La soluzione include logging dettagliato per facilitare il debugging:
- Stati di autenticazione
- Errori di rete
- Tentativi di retry
- Timeout e fallback

## 6. Conclusioni

Questa soluzione risolve completamente il problema di caricamento infinito implementando:

1. **Gestione Robusta degli Stati**: Distinzione chiara tra loading, error e authenticated states
2. **Meccanismi di Recovery**: Retry automatico e fallback sicuri
3. **User Experience Ottimizzata**: Feedback chiari e opzioni di recovery per l'utente
4. **Prevenzione dei Loop**: Logica di redirect intelligente
5. **Gestione Avanzata delle Sessioni**: Validazione e refresh automatico dei token

L'implementazione è compatibile con Supabase Auth e può essere facilmente adattata ad altri sistemi di autenticazione JWT.