import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    icon?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-scale-up" role="document">
                <div className="flex items-center p-4 border-b dark:border-slate-700">
                    {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 flex-grow">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 text-slate-600 dark:text-slate-300">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};