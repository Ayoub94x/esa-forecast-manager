import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '../components/icons';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-center w-full bg-white dark:bg-slate-800 p-12 rounded-xl shadow-lg">
            <ExclamationTriangleIcon className="w-24 h-24 text-indigo-200 dark:text-indigo-500/30 mb-4" />
            <h1 className="text-6xl font-bold text-slate-800 dark:text-slate-100">404</h1>
            <p className="text-2xl font-light text-slate-600 dark:text-slate-300 mb-6">Oops! Page Not Found.</p>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">The page you are looking for does not exist, has been moved, or is unavailable.</p>
            <Link
                to="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                Go Back Home
            </Link>
        </div>
    );
};

export default NotFoundPage;