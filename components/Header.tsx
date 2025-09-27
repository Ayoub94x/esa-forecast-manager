import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { UserRole } from '../types';
import { ChartBarIcon, TableCellsIcon, BuildingOfficeIcon, UserGroupIcon, PowerIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from './icons';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            setIsUserMenuOpen(false);
        } catch (error) {
            console.error('Errore durante il logout:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setIsThemeMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Gestione navigazione da tastiera
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                setIsThemeMenuOpen(false);
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const navLinkClasses = "group relative flex items-center px-4 py-2.5 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 hover:shadow-sm";
    const activeNavLinkClasses = "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/20 font-semibold";

    const commonLinks = (
        <>
            {user?.role === UserRole.Admin && (
                <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                    onClick={closeMobileMenu}
                    aria-label="Dashboard"
                >
                    <ChartBarIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" /> 
                    <span>Dashboard</span>
                    {/* Indicatore attivo */}
                    <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
            )}
            <NavLink 
                to="/forecast" 
                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                onClick={closeMobileMenu}
                aria-label="Forecast"
            >
                <TableCellsIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" /> 
                <span>Forecast</span>
                <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            {user?.role === UserRole.Admin && (
                <>
                    <NavLink 
                        to="/admin/clients" 
                        className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                        onClick={closeMobileMenu}
                        aria-label="Gestione Clienti"
                    >
                        <UserGroupIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" /> 
                        <span>Clients</span>
                        <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                    <NavLink 
                        to="/admin/bus" 
                        className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                        onClick={closeMobileMenu}
                        aria-label="Gestione Business Units"
                    >
                        <BuildingOfficeIcon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" /> 
                        <span>Business Units</span>
                        <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                </>
            )}
        </>
    );

    const themeOptions = [
        { name: 'Light', value: 'light', icon: SunIcon },
        { name: 'Dark', value: 'dark', icon: MoonIcon },
        { name: 'System', value: 'system', icon: ComputerDesktopIcon },
    ];
    const CurrentThemeIcon = themeOptions.find(opt => opt.value === theme)?.icon || ComputerDesktopIcon;

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo e Brand */}
                    <div className="flex items-center">
                        <Link 
                            to="/" 
                            className="group flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                            aria-label="Torna alla homepage"
                        >
                            <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-200 group-hover:scale-105">
                                <ChartBarIcon className="h-6 w-6 text-white" />
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                            <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-blue-600 transition-all duration-200">
                                Forecasting
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <nav className="hidden md:block" role="navigation" aria-label="Navigazione principale">
                        <div className="flex items-center space-x-2">
                            {commonLinks}
                        </div>
                    </nav>

                    {/* User Actions - Desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                        {/* User Info e Menu */}
                        <div ref={userMenuRef} className="relative">
                            <button 
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                aria-expanded={isUserMenuOpen}
                                aria-haspopup="true"
                                aria-label="Menu utente"
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium">{user?.name}</span>
                                </div>
                            </button>
                            
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 animate-scale-up">
                                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        aria-label="Esci dall'applicazione"
                                    >
                                        <PowerIcon className="h-4 w-4 mr-3" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Theme Selector */}
                        <div ref={themeMenuRef} className="relative">
                            <button 
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} 
                                className="group p-2.5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 hover:scale-105 active:scale-95" 
                                aria-expanded={isThemeMenuOpen}
                                aria-haspopup="true"
                                aria-label="Cambia tema"
                            >
                                <CurrentThemeIcon className="h-5 w-5 transition-all duration-300 group-hover:rotate-12 group-active:rotate-45" />
                            </button>
                            {isThemeMenuOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 py-2 animate-scale-up">
                                    {themeOptions.map(opt => {
                                        const Icon = opt.icon;
                                        return (
                                            <button 
                                                key={opt.value} 
                                                onClick={() => { setTheme(opt.value as any); setIsThemeMenuOpen(false); }} 
                                                className={`group w-full flex items-center px-4 py-2.5 text-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
                                                    theme === opt.value 
                                                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30 shadow-sm' 
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
                                                }`}
                                                aria-label={`Imposta tema ${opt.name}`}
                                            >
                                                <Icon className="h-4 w-4 mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                                <span className="transition-all duration-200 group-hover:translate-x-0.5">{opt.name}</span>
                                                {theme === opt.value && (
                                                    <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button 
                            onClick={toggleMobileMenu}
                            className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200"
                            aria-expanded={isMenuOpen}
                            aria-label="Apri menu di navigazione"
                        >
                            <span className="sr-only">Apri menu principale</span>
                            {isMenuOpen ? (
                                <XMarkIcon className="block h-6 w-6 transition-transform duration-200 rotate-90" />
                            ) : (
                                <Bars3Icon className="block h-6 w-6 transition-transform duration-200" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 animate-fade-in">
                    {/* Navigation Links */}
                    <nav className="px-4 pt-4 pb-3 space-y-2" role="navigation" aria-label="Navigazione mobile">
                        {React.Children.map(commonLinks.props.children, (child, index) => (
                            <div key={index} className="block">
                                {child}
                            </div>
                        ))}
                    </nav>
                    
                    {/* User Section */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 pb-4">
                        <div className="px-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-base font-medium text-slate-900 dark:text-slate-100">{user?.name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Theme Options */}
                        <div className="px-4 mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tema</p>
                            <div className="grid grid-cols-3 gap-2">
                                {themeOptions.map(opt => {
                                    const Icon = opt.icon;
                                    return (
                                        <button 
                                            key={opt.value}
                                            onClick={() => setTheme(opt.value as any)}
                                            className={`group flex flex-col items-center p-3 rounded-xl text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                                                theme === opt.value 
                                                    ? 'bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500 shadow-lg' 
                                                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:shadow-md'
                                            }`}
                                            aria-label={`Imposta tema ${opt.name}`}
                                        >
                                            <Icon className="h-5 w-5 mb-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                            <span className="transition-all duration-200 group-hover:translate-y-0.5">{opt.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        
                        {/* Logout Button */}
                        <div className="px-4">
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                aria-label="Esci dall'applicazione"
                            >
                                <PowerIcon className="h-5 w-5 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;