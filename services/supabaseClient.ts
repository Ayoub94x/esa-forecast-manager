import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configurazioni avanzate per Supabase
const supabaseOptions = {
  auth: {
    // Configurazione per il refresh automatico dei token
    autoRefreshToken: true,
    // Persiste la sessione nel localStorage
    persistSession: true,
    // Rileva automaticamente i cambiamenti di sessione
    detectSessionInUrl: true,
    // Configurazione per il flow di autenticazione
    flowType: 'pkce' as const,
    // Timeout per le richieste di autenticazione (in millisecondi)
    storageKey: 'forecast-auth-token',
  },
  // Configurazione globale per le richieste
  global: {
    headers: {
      'X-Client-Info': 'forecast-app@1.0.0',
    },
  },
  // Configurazione per il realtime (se necessario)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Creazione del client Supabase con configurazioni avanzate
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Utility per la gestione degli errori Supabase
export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// Funzione per normalizzare gli errori Supabase
export const normalizeSupabaseError = (error: any): SupabaseError => {
  if (!error) {
    return { message: 'Unknown error occurred' }
  }

  // Se è già un errore normalizzato
  if (error.message && typeof error.message === 'string') {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    }
  }

  // Se è un errore di rete
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      message: 'Errore di connessione. Verifica la tua connessione internet.',
      code: 'NETWORK_ERROR',
    }
  }

  // Se è un errore di timeout
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return {
      message: 'Richiesta scaduta. Riprova più tardi.',
      code: 'TIMEOUT_ERROR',
    }
  }

  // Errori di autenticazione comuni
  if (error.message?.includes('Invalid login credentials')) {
    return {
      message: 'Credenziali di accesso non valide.',
      code: 'INVALID_CREDENTIALS',
    }
  }

  if (error.message?.includes('Email not confirmed')) {
    return {
      message: 'Email non confermata. Controlla la tua casella di posta.',
      code: 'EMAIL_NOT_CONFIRMED',
    }
  }

  if (error.message?.includes('User not found')) {
    return {
      message: 'Utente non trovato.',
      code: 'USER_NOT_FOUND',
    }
  }

  // Fallback per errori generici
  return {
    message: error.message || error.toString() || 'Errore sconosciuto',
    code: error.code || 'UNKNOWN_ERROR',
  }
}

// Utility per verificare lo stato della connessione
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    return !error
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}

// Utility per il retry delle operazioni Supabase
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw normalizeSupabaseError(error)
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw normalizeSupabaseError(lastError)
}

// Utility per gestire le operazioni con timeout
export const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
  })
  
  return Promise.race([operation(), timeoutPromise])
}

// Configurazione per il logging degli errori (opzionale)
export const logSupabaseError = (error: SupabaseError, context?: string) => {
  console.error('Supabase Error:', {
    context,
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString(),
  })
}

// Export del client configurato
export default supabase