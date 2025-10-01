
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
                const errorMessage = profileError instanceof Error 
                    ? profileError.message 
                    : 'Failed to load user profile after multiple attempts';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        }
    }, []);

    // Funzione per validare la sessione corrente
    const validateCurrentSession = useCallback(async (): Promise<boolean> => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session validation error:', error);
                setError(`Session validation failed: ${error.message}`);
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
                    setError(`Session refresh failed: ${refreshError?.message || 'Unknown error'}`);
                    return false;
                }
                
                return true;
            }
            
            return true;
        } catch (error) {
            console.error('Session validation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Session validation failed';
            setError(errorMessage);
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
            const errorMessage = error instanceof Error ? error.message : 'Authentication initialization failed';
            setError(errorMessage);
            
            // Fallback: logout e redirect
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.error('Error during fallback signout:', signOutError);
            }
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
                        const errorMessage = error instanceof Error ? error.message : 'Authentication error';
                        setError(errorMessage);
                        
                        // In caso di errore critico, forza il logout
                        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                            setUser(null);
                        }
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




