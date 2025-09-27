import React from 'react';

// Generic props for SVG icons
type IconProps = React.SVGProps<SVGSVGElement>;

export const ChartBarIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <defs>
      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.4"/>
      </linearGradient>
    </defs>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" fill="url(#chartGradient)" fillOpacity="0.2"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625Z" fill="url(#chartGradient)" fillOpacity="0.3"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" fill="url(#chartGradient)" fillOpacity="0.4"/>
    <circle cx="5.25" cy="10" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="18.75" cy="2" r="1.5" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const TableCellsIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <defs>
      <linearGradient id="tableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" fill="url(#tableGradient)" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18M3 12h18M3 16h18M8 4v16M16 4v16"/>
    <circle cx="5.5" cy="6" r="0.5" fill="currentColor" opacity="0.8"/>
    <circle cx="12" cy="6" r="0.5" fill="currentColor" opacity="0.8"/>
    <circle cx="18.5" cy="6" r="0.5" fill="currentColor" opacity="0.8"/>
    <rect x="9" y="9.5" width="6" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="13.5" width="4" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
    <rect x="9" y="17.5" width="5" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const BuildingOfficeIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <defs>
            <linearGradient id="buildingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.2"/>
            </linearGradient>
        </defs>
        <rect x="4" y="3" width="16" height="18" rx="1" fill="url(#buildingGradient)" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="6" y="5" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="10" y="5" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="14" y="5" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="6" y="9" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="10" y="9" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="14" y="9" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="6" y="13" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="10" y="13" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="14" y="13" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6"/>
        <rect x="9" y="17" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
        <circle cx="12" cy="19" r="0.5" fill="currentColor" opacity="0.8"/>
        <path d="M2 21h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const UserGroupIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <defs>
            <linearGradient id="userGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.4"/>
            </linearGradient>
        </defs>
        <circle cx="9" cy="7" r="3" fill="url(#userGradient)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15" cy="7" r="2.5" fill="url(#userGradient)" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="9" cy="7" r="1" fill="currentColor" opacity="0.7"/>
        <circle cx="15" cy="7" r="0.8" fill="currentColor" opacity="0.7"/>
        <path d="M6 16.5c1-0.5 2-0.5 3-0.5s2 0 3 0.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
        <path d="M14 17.5c0.8-0.3 1.6-0.3 2.4-0.3s1.6 0 2.4 0.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
);

export const PowerIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <defs>
            <linearGradient id="powerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3"/>
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <circle cx="12" cy="12" r="9" fill="url(#powerGradient)" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6" stroke="currentColor" strokeWidth="2.5" filter="url(#glow)"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5a6 6 0 1 0 7 0" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.8"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
        <path d="M12 4v1M12 19v1M4 12h1M19 12h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
);

export const Bars3Icon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <defs>
            <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.4"/>
            </linearGradient>
        </defs>
        <rect x="3" y="5.5" width="18" height="1.5" rx="0.75" fill="url(#menuGradient)" stroke="currentColor" strokeWidth="0.5"/>
        <rect x="3" y="11.25" width="15" height="1.5" rx="0.75" fill="url(#menuGradient)" stroke="currentColor" strokeWidth="0.5"/>
        <rect x="3" y="17" width="12" height="1.5" rx="0.75" fill="url(#menuGradient)" stroke="currentColor" strokeWidth="0.5"/>
        <circle cx="2" cy="6.25" r="1" fill="currentColor" opacity="0.6"/>
        <circle cx="2" cy="12" r="1" fill="currentColor" opacity="0.6"/>
        <circle cx="2" cy="17.75" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
);

export const XMarkIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <defs>
            <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.5"/>
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#closeGradient)" fillOpacity="0.08" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
        <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
        <circle cx="8" cy="16" r="1.5" fill="currentColor" opacity="0.4"/>
        <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.4"/>
    </svg>
);

export const CurrencyDollarIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.79-.621 1.672-.928 2.574-.928 1.172 0 2.21.324 3.024.962" />
    </svg>
);

export const DocumentChartBarIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
    </svg>
);

export const PencilIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

export const CheckCircleIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const XCircleIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const TrashIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

export const InformationCircleIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const ExclamationTriangleIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

export const ArrowUpIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
);
  
export const ArrowDownIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ArrowsUpDownIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

export const ChatBubbleLeftEllipsisIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.761 9.761 0 0 1-2.543-.381L4.89 21.11a.75.75 0 0 1-.94-1.064l1.268-3.445a9.763 9.763 0 0 1-.381-2.543C4.875 7.444 8.904 3.75 13.875 3.75s9 3.694 9 8.25Z" />
    </svg>
);

export const PlusIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const DocumentArrowDownIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const FunnelIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 9.75h9.75M10.5 13.5h9.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
);

export const MinusIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

export const SunIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
        <defs>
            <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="1"/>
                <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.8"/>
            </radialGradient>
            <radialGradient id="sunCoreGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.7"/>
            </radialGradient>
        </defs>
        
        {/* Raggi del sole */}
        <g stroke="url(#sunGradient)" strokeWidth="2" strokeLinecap="round" className="animate-pulse">
            <line x1="12" y1="1" x2="12" y2="3" opacity="0.8"/>
            <line x1="21" y1="12" x2="23" y2="12" opacity="0.8"/>
            <line x1="12" y1="21" x2="12" y2="23" opacity="0.8"/>
            <line x1="1" y1="12" x2="3" y2="12" opacity="0.8"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" opacity="0.6"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" opacity="0.6"/>
            <line x1="5.64" y1="18.36" x2="4.22" y2="19.78" opacity="0.6"/>
            <line x1="5.64" y1="5.64" x2="4.22" y2="4.22" opacity="0.6"/>
        </g>
        
        {/* Corpo del sole */}
        <circle cx="12" cy="12" r="5" fill="url(#sunGradient)" stroke="url(#sunGradient)" strokeWidth="0.5"/>
        
        {/* Centro luminoso */}
        <circle cx="12" cy="12" r="3" fill="url(#sunCoreGradient)" opacity="0.8"/>
        
        {/* Dettagli interni */}
        <circle cx="10.5" cy="10.5" r="0.8" fill="#FEF3C7" opacity="0.6"/>
        <circle cx="13.5" cy="11" r="0.5" fill="#FEF3C7" opacity="0.4"/>
        <circle cx="11.8" cy="13.2" r="0.6" fill="#FEF3C7" opacity="0.5"/>
    </svg>
);

export const MoonIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
        <defs>
            <radialGradient id="moonGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.9"/>
                <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#475569" stopOpacity="0.7"/>
            </radialGradient>
            <radialGradient id="moonShadowGradient" cx="70%" cy="70%" r="50%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.6"/>
            </radialGradient>
        </defs>
        
        {/* Stelle decorative */}
        <g fill="#E2E8F0" opacity="0.6">
            <circle cx="6" cy="6" r="0.8" className="animate-pulse"/>
            <circle cx="18" cy="4" r="0.6" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <circle cx="20" cy="16" r="0.7" className="animate-pulse" style={{animationDelay: '1s'}}/>
            <circle cx="4" cy="18" r="0.5" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
        </g>
        
        {/* Corpo principale della luna */}
        <path 
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
            fill="url(#moonGradient)" 
            stroke="url(#moonGradient)" 
            strokeWidth="0.5"
        />
        
        {/* Ombra interna per dare profondità */}
        <path 
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
            fill="url(#moonShadowGradient)"
        />
        
        {/* Crateri lunari */}
        <g fill="#64748B" opacity="0.4">
            <circle cx="14" cy="10" r="1.2"/>
            <circle cx="16.5" cy="13.5" r="0.8"/>
            <circle cx="13" cy="15" r="0.6"/>
            <circle cx="15.5" cy="8" r="0.5"/>
        </g>
        
        {/* Crateri più chiari per contrasto */}
        <g fill="#CBD5E1" opacity="0.3">
            <circle cx="14" cy="10" r="0.6"/>
            <circle cx="16.5" cy="13.5" r="0.4"/>
            <circle cx="13" cy="15" r="0.3"/>
        </g>
    </svg>
);

export const ComputerDesktopIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
        <defs>
            <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.9"/>
                <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#475569" stopOpacity="0.7"/>
            </linearGradient>
            <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748B" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#475569" stopOpacity="0.9"/>
            </linearGradient>
        </defs>
        
        {/* Monitor base */}
        <rect x="8" y="18" width="8" height="2" rx="1" fill="url(#baseGradient)" stroke="url(#baseGradient)" strokeWidth="0.5"/>
        <rect x="10" y="20" width="4" height="1" rx="0.5" fill="url(#baseGradient)" opacity="0.6"/>
        
        {/* Monitor screen frame */}
        <rect x="3" y="4" width="18" height="12" rx="2" fill="url(#screenGradient)" stroke="url(#screenGradient)" strokeWidth="0.5"/>
        
        {/* Screen content */}
        <rect x="4.5" y="5.5" width="15" height="9" rx="1" fill="#1E293B" opacity="0.8"/>
        
        {/* Screen elements to simulate content */}
        <g fill="#64748B" opacity="0.6">
            <rect x="6" y="7" width="4" height="0.8" rx="0.4"/>
            <rect x="6" y="8.5" width="6" height="0.6" rx="0.3"/>
            <rect x="6" y="10" width="3" height="0.6" rx="0.3"/>
            <rect x="13" y="7" width="5" height="3" rx="0.5"/>
        </g>
        
        {/* Screen glow effect */}
        <rect x="4.5" y="5.5" width="15" height="9" rx="1" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.3"/>
        
        {/* Power indicator */}
        <circle cx="12" cy="17" r="0.8" fill="#10B981" opacity="0.8" className="animate-pulse"/>
    </svg>
);

export const ArrowTrendingUpIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 18 9-9 4.5 4.5L21.75 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m17.25 6-4.5 4.5" />
    </svg>
);

export const CalendarDaysIcon = (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008Zm-3 0h.008v.008H9v-.008Zm-3 0h.008v.008H6v-.008Zm3 3.75h.008v.008H9v-.008Zm-3 0h.008v.008H6v-.008Zm6 0h.008v.008H12v-.008Zm3 0h.008v.008H15v-.008Zm-6-3.75h.008v.008H9v-.008Zm6 0h.008v.008H15v-.008Zm3 0h.008v.008H18v-.008Z" />
    </svg>
);