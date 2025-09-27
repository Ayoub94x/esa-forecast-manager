import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext, ToastType } from '../contexts/ToastContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from './icons';

const icons: Record<ToastType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    success: (props) => <CheckCircleIcon {...props} />,
    error: (props) => <XCircleIcon {...props} />,
    info: (props) => <InformationCircleIcon {...props} />,
    warning: (props) => <ExclamationTriangleIcon {...props} />,
}

const colors: Record<ToastType, { bg: string, text: string, icon: string }> = {
    success: { bg: 'bg-green-50 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', icon: 'text-green-500 dark:text-green-400' },
    error: { bg: 'bg-red-50 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', icon: 'text-red-500 dark:text-red-400' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', icon: 'text-blue-500 dark:text-blue-400' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300', icon: 'text-yellow-500 dark:text-yellow-400' },
}

export const ToastContainer: React.FC = () => {
    const context = useContext(ToastContext);

    if (!context) {
        return null;
    }

    const { toasts, removeToast } = context;

    return createPortal(
        <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-sm">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                const color = colors[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={`${color.bg} p-4 rounded-md shadow-lg flex items-start animate-fade-in-right ring-1 ring-black ring-opacity-5 dark:ring-1 dark:ring-white/10`}
                    >
                        <div className={`flex-shrink-0 ${color.icon}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className={`text-sm font-medium ${color.text}`}>{toast.message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="inline-flex rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <span className="sr-only">Close</span>
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>,
        document.body
    );
};