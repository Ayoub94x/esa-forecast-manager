import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { Spinner } from '../components/Spinner';
import { ChartBarIcon } from '../components/icons';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [fullName, setFullName] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const { login, register, user } = useAuth();
    const navigate = useNavigate();

    // Reindirizza se l'utente è già autenticato
    React.useEffect(() => {
        if (user) {
            if (user.role === UserRole.Admin) {
                navigate('/dashboard');
            } else {
                navigate('/forecast');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || (isRegistering && !fullName)) {
            setError('Tutti i campi sono obbligatori.');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            if (isRegistering) {
                await register(email, password, fullName);
                setError('Registrazione completata! Controlla la tua email per confermare l\'account.');
                setIsRegistering(false);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Operazione fallita. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-indigo-800 to-indigo-500 items-center justify-center text-white relative p-12">
                <div className="text-center space-y-4">
                    <ChartBarIcon className="mx-auto h-24 w-auto" />
                    <h1 className="text-5xl font-bold">Forecasting MVP</h1>
                    <p className="text-indigo-200">Centralized data, simplified forecasts.</p>
                </div>
                <div className="absolute bottom-6 text-xs text-indigo-300">
                    A modern solution for financial planning.
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-slate-100">
                            {isRegistering ? 'Crea un account' : 'Accedi al tuo account'}
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6 bg-white dark:bg-slate-800 p-8 shadow-xl rounded-2xl" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {isRegistering && (
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nome completo
                                    </label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-slate-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Il tuo nome completo"
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-slate-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="La tua email"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-slate-200 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="La tua password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className={`text-sm text-center ${error.includes('completata') ? 'text-green-600' : 'text-red-500'}`}>
                                {error}
                            </p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? <Spinner /> : (isRegistering ? 'Registrati' : 'Accedi')}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setError('');
                                }}
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                            >
                                {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;