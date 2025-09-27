# Forecasting MVP

Una web application per la gestione e visualizzazione di previsioni con autenticazione utente e dashboard interattiva.

## 🚀 Deploy su Vercel

### Prerequisiti

- Account Vercel (gratuito)
- Repository GitHub/GitLab/Bitbucket
- Progetto Supabase configurato
- API Key Gemini (opzionale)

### Configurazione Variabili d'Ambiente

Prima del deploy, configura le seguenti variabili d'ambiente su Vercel:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini API (opzionale)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Passi per il Deploy

1. **Prepara il repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connetti a Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Clicca "New Project"
   - Importa il tuo repository

3. **Configura le variabili d'ambiente**
   - Nella dashboard Vercel, vai su "Settings" > "Environment Variables"
   - Aggiungi tutte le variabili elencate sopra
   - Assicurati di selezionare "Production", "Preview", e "Development"

4. **Deploy automatico**
   - Vercel rileverà automaticamente la configurazione Vite
   - Il build inizierà automaticamente
   - L'app sarà disponibile all'URL fornito da Vercel

### Configurazione Automatica

Il progetto include:
- ✅ `vercel.json` - Configurazione Vercel ottimizzata
- ✅ `.env.example` - Template variabili d'ambiente
- ✅ Build script configurato
- ✅ SPA routing configurato

## 🛠 Sviluppo Locale

### Installazione

```bash
# Clona il repository
git clone <repository-url>
cd Forecast

# Installa le dipendenze
npm install
```

### Configurazione Ambiente Locale

1. Copia il file di esempio:
   ```bash
   cp .env.example .env.local
   ```

2. Compila le variabili d'ambiente nel file `.env.local`

### Comandi Disponibili

```bash
# Sviluppo locale
npm run dev

# Build di produzione
npm run build

# Preview build locale
npm run preview

# Start server (per Vercel)
npm start
```

## 📁 Struttura Progetto

```
Forecast/
├── components/          # Componenti React riutilizzabili
├── contexts/           # Context providers (Auth, Theme, Toast)
├── hooks/              # Custom hooks
├── pages/              # Pagine dell'applicazione
├── services/           # API services (Supabase, Mock)
├── types.ts            # Definizioni TypeScript
├── vercel.json         # Configurazione Vercel
└── .env.example        # Template variabili d'ambiente
```

## 🔧 Tecnologie Utilizzate

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: Gemini API (opzionale)
- **Deploy**: Vercel

## 🔐 Autenticazione

L'app utilizza Supabase Auth per:
- Login/Logout utenti
- Gestione sessioni
- Protezione route
- Ruoli utente (User, Administrator)

## 📊 Funzionalità

- Dashboard interattiva con grafici
- Gestione previsioni (CRUD)
- Sistema di commenti
- Tema scuro/chiaro
- Notifiche toast
- Gestione utenti (Admin)
- Export/Import dati

## 🚨 Troubleshooting

### Errori Comuni

1. **Variabili d'ambiente mancanti**
   - Verifica che tutte le variabili siano configurate su Vercel
   - Controlla che abbiano il prefisso `VITE_` per quelle client-side

2. **Errori di build**
   - Esegui `npm run build` localmente per testare
   - Controlla i log di build su Vercel

3. **Routing non funziona**
   - Il file `vercel.json` include la configurazione SPA
   - Verifica che sia presente nel repository

### Support

Per problemi o domande, controlla:
- I log di Vercel nella dashboard
- La console del browser per errori client-side
- I log di Supabase per errori backend

---

**Nota**: Questo progetto è configurato per il deploy automatico su Vercel. Ogni push al branch principale attiverà un nuovo deploy.
