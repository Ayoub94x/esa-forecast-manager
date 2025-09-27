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

// Componente per la schermata di caricamento migliorata
const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Caricamento...</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Verifica dell'autenticazione in corso</p>
            </div>
        </div>
    );
};

// Componente per gestire gli errori di autenticazione
interface AuthErrorFallbackProps {
    error: string;
    onRetry: () => void;
    canRetry: boolean;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({ error, onRetry, canRetry }) => {
    return (
        <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 bg-gray-50">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Errore di Autenticazione
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {error}
                    </p>
                    <div className="space-y-3">
                        {canRetry && (
                            <button
                                onClick={onRetry}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Riprova
                            </button>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            Ricarica Pagina
                        </button>
                    </div>
                </div>
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

    // Gestione degli errori di autenticazione
    if (error) {
        return (
            <AuthErrorFallback 
                error={error} 
                onRetry={() => {
                    clearError();
                    retryAuth();
                }} 
                canRetry={true}
            />
        );
    }

    // Schermata di caricamento migliorata
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
                            <Route path="/login" element={<Navigate to="/" />} />
                            <Route path="/forecast" element={<ForecastPage />} />
                            
                            <Route element={<AdminRoute />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/admin/clients" element={<AdminManagementPage entityType="client" />} />
                                <Route path="/admin/bus" element={<AdminManagementPage entityType="businessUnit" />} />
                            </Route>

                            <Route path="/" element={user.role === UserRole.Admin ? <Navigate to="/dashboard" /> : <Navigate to="/forecast" />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            )}
            <ToastContainer />
        </>
    );
};

const AdminRoute = () => {
    const { user } = useAuth();
    if (user?.role !== UserRole.Admin) {
        return <Navigate to="/forecast" />;
    }
    return <Outlet />;
};

export default App;