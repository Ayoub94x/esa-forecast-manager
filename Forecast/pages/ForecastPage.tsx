import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/supabaseApi';
import { Forecast, Client, BusinessUnit, ForecastStatus, UserRole } from '../types';
import { useToast } from '../hooks/useToast';
import { PencilIcon, CheckCircleIcon, XCircleIcon, TableCellsIcon, ChevronDownIcon, ChatBubbleLeftEllipsisIcon, PlusIcon, MinusIcon, ChevronLeftIcon, ChevronRightIcon, DocumentArrowDownIcon, FunnelIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, ExclamationTriangleIcon } from '../components/icons';
import CommentSection from '../components/CommentSection';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

declare var XLSX: any;

interface EditableCellProps {
    value: number;
    onSave: (newValue: number) => void;
    isEditable: boolean;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, isEditable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(String(value));

    useEffect(() => {
        setCurrentValue(String(value));
    }, [value]);

    const handleSave = () => {
        const numericValue = parseFloat(currentValue) || 0;
        if (numericValue !== value) {
            onSave(numericValue);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        else if (e.key === 'Escape') {
            setCurrentValue(String(value));
            setIsEditing(false);
        }
    };
    
    if (isEditing) {
        return (
            <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 border border-indigo-500 rounded-md bg-white dark:bg-slate-600 text-right hide-number-arrows"
                autoFocus
                onFocus={(e) => e.target.select()}
            />
        );
    }
    
    return (
        <div 
            onClick={() => isEditable && setIsEditing(true)} 
            className={`px-2 py-1 rounded-md h-full w-full text-right group relative border border-transparent ${isEditable ? 'cursor-pointer hover:bg-indigo-100 dark:hover:bg-slate-700' : 'text-slate-500 cursor-not-allowed'}`}
        >
            {formatCurrency(value)}
            {isEditable && <PencilIcon className="h-3.5 w-3.5 absolute top-1/2 -translate-y-1/2 left-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
    );
};

interface GroupedForecast {
    businessUnitId: number;
    businessUnitName: string;
    businessUnitColor: string;
    totalDeclaredBudget: number;
    totalBudget: number;
    totalForecast: number;
    clients: {
        clientId: number;
        clientName: string;
        forecast: Forecast;
    }[];
}

type SortConfig = { key: keyof Forecast | 'clientName'; direction: 'ascending' | 'descending' } | null;

const ForecastPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set());
    const [openComments, setOpenComments] = useState<Set<number>>(new Set());
    
    // Data management state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ForecastStatus | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'clientName', direction: 'ascending' });
    
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [forecastToDelete, setForecastToDelete] = useState<Forecast | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addFormState, setAddFormState] = useState({
        clientId: '',
        declaredBudget: 0,
        budget: 0,
        forecast: 0,
    });
    const [availableClients, setAvailableClients] = useState<Client[]>([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    
    const [date, setDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(date.year);
    const pickerRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === UserRole.Admin;
    
    const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('it-IT', { month: 'long' }) }));

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [forecastData, clientData, buData] = await Promise.all([
                api.getForecasts(user, date.month, date.year),
                api.getClients(),
                api.getBusinessUnits(),
            ]);
            setForecasts(forecastData);
            setClients(clientData);
            setBusinessUnits(buData);
            setExpandedBUs(new Set(buData.map(bu => bu.id)));
        } catch (error) {
            addToast("Failed to fetch data", "error");
        } finally {
            setLoading(false);
        }
    }, [user, date, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (isPickerOpen) setPickerYear(date.year);
    }, [isPickerOpen, date.year]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [pickerRef]);

    const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
    const businessUnitsMap = useMemo(() => new Map(businessUnits.map(b => [b.id, b])), [businessUnits]);

    const groupedData = useMemo<GroupedForecast[]>(() => {
        // 1. Filter
        let filteredForecasts = forecasts;
        if (statusFilter !== 'all') {
            filteredForecasts = filteredForecasts.filter(f => f.status === statusFilter);
        }
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredForecasts = filteredForecasts.filter(f => 
                clientsMap.get(f.clientId)?.name.toLowerCase().includes(lowercasedFilter)
            );
        }

        // 2. Group
        const dataMap = new Map<number, GroupedForecast>();
        filteredForecasts.forEach(forecast => {
            const buId = forecast.businessUnitId;
            let buGroup = dataMap.get(buId);
            if (!buGroup) {
                buGroup = {
                    businessUnitId: buId,
                    businessUnitName: businessUnitsMap.get(buId)?.name || 'Unknown',
                    businessUnitColor: businessUnitsMap.get(buId)?.color || '#A1A1AA',
                    totalDeclaredBudget: 0, totalBudget: 0, totalForecast: 0, clients: [],
                };
                dataMap.set(buId, buGroup);
            }
            buGroup.totalDeclaredBudget += forecast.declaredBudget;
            buGroup.totalBudget += forecast.budget;
            buGroup.totalForecast += forecast.forecast;
            buGroup.clients.push({
                clientId: forecast.clientId,
                clientName: clientsMap.get(forecast.clientId)?.name || 'Unknown',
                forecast: forecast,
            });
        });

        const groupedArray = Array.from(dataMap.values());
        
        // 3. Sort
        if (sortConfig) {
            groupedArray.forEach(group => {
                group.clients.sort((a, b) => {
                    const aValue = sortConfig.key === 'clientName' ? a.clientName : a.forecast[sortConfig.key];
                    const bValue = sortConfig.key === 'clientName' ? b.clientName : b.forecast[sortConfig.key];

                    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            });
        }
        
        return groupedArray.sort((a,b) => a.businessUnitName.localeCompare(b.businessUnitName));
    }, [forecasts, clientsMap, businessUnitsMap, searchTerm, statusFilter, sortConfig]);
    
    const allExpanded = useMemo(() => groupedData.length > 0 && expandedBUs.size === groupedData.length, [expandedBUs.size, groupedData.length]);

    const handleValueSave = async (forecastId: number, field: 'budget' | 'forecast' | 'declaredBudget', value: number) => {
        if (!user) return;
        setSaving(prev => ({...prev, [`val-${forecastId}`]: true}));
        try {
            const updatedForecast = await api.updateForecastValue(forecastId, field, value, user.id);
            setForecasts(prev => prev.map(f => f.id === forecastId ? {...f, ...updatedForecast} : f));
            addToast("Forecast updated successfully", "success");
        } catch (error) {
            addToast("Failed to save forecast", "error");
        } finally {
            setSaving(prev => ({...prev, [`val-${forecastId}`]: false}));
        }
    };

    const handleStatusChange = async (forecastId: number, status: ForecastStatus) => {
        if (!user) return;
        setSaving(prev => ({...prev, [`status-${forecastId}`]: true}));
        try {
            const updatedForecast = await api.updateForecastStatus(forecastId, status, user.id);
            setForecasts(prev => prev.map(f => f.id === forecastId ? {...f, ...updatedForecast} : f));
            addToast(`Forecast status changed to ${status}`, "success");
        } catch (error) {
            addToast("Failed to update status", "error");
        } finally {
            setSaving(prev => ({...prev, [`status-${forecastId}`]: false}));
        }
    }

    const handleOpenAddModal = async () => {
        setAddFormState({ clientId: '', declaredBudget: 0, budget: 0, forecast: 0 });
        setIsAddModalOpen(true);
        setClientsLoading(true);
        try {
            const allClients = await api.getClients();
            const clientsWithForecasts = new Set(forecasts.map(f => f.clientId));
            
            let potentialClients = allClients;
            if (user?.role === UserRole.DataEntry && user.assignedClientIds) {
                const assignedIds = new Set(user.assignedClientIds);
                potentialClients = allClients.filter(c => assignedIds.has(c.id));
            }
            
            const available = potentialClients.filter(c => !clientsWithForecasts.has(c.id));
            setAvailableClients(available);
        } catch (error) {
            addToast("Failed to load available clients.", "error");
            setIsAddModalOpen(false); // Close modal on error
        } finally {
            setClientsLoading(false);
        }
    };

    const handleSaveNewForecast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !addFormState.clientId) {
            addToast("Please select a client.", "warning");
            return;
        }
        setIsSubmitting(true);
        try {
            const client = clientsMap.get(parseInt(addFormState.clientId));
            if (!client || !client.businessUnitId) {
                throw new Error("Invalid client or client is not associated with a Business Unit.");
            }
            
            await api.addForecast({
                ...addFormState,
                clientId: parseInt(addFormState.clientId),
                businessUnitId: client.businessUnitId,
                month: date.month,
                year: date.year,
                userId: user.id,
            });
            addToast("Forecast entry created successfully", "success");
            setIsAddModalOpen(false);
            fetchData();
        } catch (error) {
            addToast("Failed to create forecast entry", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!forecastToDelete) return;
        setIsSubmitting(true);
        try {
            await api.deleteForecast(forecastToDelete.id);
            addToast("Forecast entry deleted", "success");
            setForecastToDelete(null);
            fetchData();
        } catch (error) {
            addToast("Failed to delete forecast", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportXLS = () => {
        if (typeof XLSX === 'undefined') {
            addToast("Export functionality is currently unavailable.", "error");
            return;
        }

        const dataForExport = groupedData.flatMap(group =>
            group.clients.map(clientItem => ({
                'Business Unit': group.businessUnitName,
                'Client': clientItem.clientName,
                [`BDG Dichiarato ${date.year}`]: clientItem.forecast.declaredBudget,
                'BDG Attivo': clientItem.forecast.budget,
                'Fcast Rolling': clientItem.forecast.forecast,
                'Status': clientItem.forecast.status,
            }))
        );

        const ws = XLSX.utils.json_to_sheet(dataForExport);

        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Business Unit
            { wch: 35 }, // Client
            { wch: 20 }, // BDG Dichiarato
            { wch: 20 }, // BDG Attivo
            { wch: 20 }, // Fcast Rolling
            { wch: 15 }, // Status
        ];

        // Format headers and currency cells
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                const cell = ws[cell_ref];

                if (!cell) continue;

                // Style Header Row
                if (R === 0) {
                    cell.s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "E9ECEF" } }, // Light gray background
                        alignment: { vertical: "center", horizontal: "center" }
                    };
                }

                // Format currency columns (C, D, E which are indices 2, 3, 4)
                if (R > 0 && C >= 2 && C <= 4) {
                    cell.t = 'n'; // Set type to number
                    cell.z = '€ #,##0.00'; // Set number format
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Forecast");

        XLSX.writeFile(wb, `forecast_${date.year}_${String(date.month).padStart(2, '0')}.xlsx`);
    };

    const requestSort = (key: SortConfig['key']) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: SortConfig['key']) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="h-4 w-4 text-indigo-600" />;
        return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
    };

    const toggleBUExpansion = (buId: number) => setExpandedBUs(p => { const n = new Set(p); n.has(buId) ? n.delete(buId) : n.add(buId); return n; });
    const toggleAll = () => allExpanded ? setExpandedBUs(new Set()) : setExpandedBUs(new Set(groupedData.map(g => g.businessUnitId)));
    const toggleComments = (forecastId: number) => setOpenComments(p => { const n = new Set(p); n.has(forecastId) ? n.delete(forecastId) : n.add(forecastId); return n; });
    const handleCommentChange = useCallback(() => { fetchData(); }, [fetchData]);
    const changeMonth = (offset: number) => setDate(d => { let m=d.month+offset, y=d.year; if(m>12){m=1;y++}else if(m<1){m=12;y--} return{month:m,year:y}; });
    const handleSelectDate = (month: number, year: number) => { setDate({ month, year }); setIsPickerOpen(false); };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg w-full flex flex-col transition-colors">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Forecast Data</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review, manage, and export forecast entries.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <div ref={pickerRef} className="relative">
                            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm bg-white dark:bg-slate-800">
                                <button onClick={() => changeMonth(-1)} className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-md" aria-label="Previous month"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <div className="w-px h-5 bg-slate-200 dark:bg-slate-600"></div>
                                <button onClick={() => setIsPickerOpen(!isPickerOpen)} className="px-4 py-2 text-center w-40 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm" aria-expanded={isPickerOpen}>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{months.find(m => m.value === date.month)?.name}</span> <span className="text-slate-500 dark:text-slate-400">{date.year}</span>
                                </button>
                                <div className="w-px h-5 bg-slate-200 dark:bg-slate-600"></div>
                                <button onClick={() => changeMonth(1)} className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-md" aria-label="Next month"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                            {isPickerOpen && (
                                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl z-20 w-64 p-3 animate-scale-up">
                                    <select value={pickerYear} onChange={e => setPickerYear(parseInt(e.target.value))} className="w-full mb-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold">
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <div className="grid grid-cols-4 gap-1">
                                        {months.map(m => <button key={m.value} onClick={() => handleSelectDate(m.value, pickerYear)} className={`p-2 text-sm rounded-md text-center ${ m.value === date.month && pickerYear === date.year ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-indigo-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>{m.name.substring(0, 3)}</button>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center gap-3 my-4">
                    <input type="text" placeholder="Search by client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                    <div className="flex items-center w-full md:w-auto">
                        <span className="p-2 bg-slate-100 dark:bg-slate-700 border-l border-y border-slate-300 dark:border-slate-600 rounded-l-md"><FunnelIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/></span>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full p-2 border-r border-y border-slate-300 dark:border-slate-600 rounded-r-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none">
                            <option value="all">All Statuses</option>
                            <option value={ForecastStatus.Draft}>Draft</option>
                            <option value={ForecastStatus.Approved}>Approved</option>
                        </select>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportXLS} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"><DocumentArrowDownIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" /> Export XLS</button>
                        {isAdmin && <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"><PlusIcon className="w-5 h-5" /> Add Forecast</button>}
                    </div>
                </div>

                <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 flex-grow" style={{maxHeight: 'calc(100vh - 360px)'}}>
                    {loading ? ( <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading forecast data...</div> ) : ( <>
                        {groupedData.length > 0 && (
                            <div className="flex justify-end px-6 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <button onClick={toggleAll} className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"><> {allExpanded ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span> </></button>
                            </div>
                        )}
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300 table-fixed">
                            <thead className="text-sm text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold w-[25%]">Business Unit</th>
                                    <th scope="col" className="px-6 py-4 font-semibold w-[25%]"><button onClick={()=>requestSort('clientName')} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400">Client {renderSortIcon('clientName')}</button></th>
                                    <th scope="col" className="px-6 py-4 text-right whitespace-nowrap font-semibold" style={{ width: '180px' }}>BDG DICHIARATO {date.year}</th>
                                    <th scope="col" className="px-6 py-4 text-right font-semibold" style={{ width: '160px' }}>BDG ATTIVO</th>
                                    <th scope="col" className="px-6 py-4 text-right font-semibold" style={{ width: '160px' }}>Fcast Rolling</th>
                                    <th scope="col" className="px-6 py-4 text-center font-semibold" style={{ width: '120px' }}>Status</th>
                                    <th scope="col" className="px-6 py-4 text-center font-semibold" style={{ width: isAdmin ? '150px' : '110px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedData.map(buGroup => {
                                    const isExpanded = expandedBUs.has(buGroup.businessUnitId);
                                    return ( <React.Fragment key={buGroup.businessUnitId}>
                                        <tr onClick={() => toggleBUExpansion(buGroup.businessUnitId)} className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-t border-slate-200 dark:border-slate-700 group">
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap" colSpan={2} style={{ borderLeft: `4px solid ${buGroup.businessUnitColor}`}}>
                                                <div className="flex items-center">
                                                    <div className="h-7 w-7 mr-4 grid place-items-center rounded-full bg-slate-200 dark:bg-slate-600 group-hover:bg-slate-300 dark:group-hover:bg-slate-500 shrink-0"><ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-300 transition-transform ${isExpanded ? '' : '-rotate-90'}`} /></div>
                                                    <span className="truncate">{buGroup.businessUnitName}<span className="ml-2 px-2 py-0.5 bg-slate-300 dark:bg-slate-500 text-slate-600 dark:text-slate-200 text-xs rounded-full font-medium">{buGroup.clients.length}</span></span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(buGroup.totalDeclaredBudget)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(buGroup.totalBudget)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(buGroup.totalForecast)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                        {isExpanded && buGroup.clients.map(({ forecast, clientName }) => {
                                            const isEditable = isAdmin || forecast.status !== ForecastStatus.Approved;
                                            const isRowSaving = saving[`val-${forecast.id}`] || saving[`status-${forecast.id}`];
                                            const isCommentsOpen = openComments.has(forecast.id);

                                            return ( <React.Fragment key={forecast.id}>
                                                <tr className={`border-b border-slate-100 dark:border-slate-700/50 ${isRowSaving ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-slate-800'} hover:bg-indigo-50 dark:hover:bg-slate-700/50 animate-fade-in`}>
                                                    <td className="px-6 py-4"></td>
                                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{clientName}</td>
                                                    <td className="px-6 py-4"><EditableCell value={forecast.declaredBudget} onSave={(val) => handleValueSave(forecast.id, 'declaredBudget', val)} isEditable={isEditable} /></td>
                                                    <td className="px-6 py-4"><EditableCell value={forecast.budget} onSave={(val) => handleValueSave(forecast.id, 'budget', val)} isEditable={isEditable} /></td>
                                                    <td className="px-6 py-4"><EditableCell value={forecast.forecast} onSave={(val) => handleValueSave(forecast.id, 'forecast', val)} isEditable={isEditable} /></td>
                                                    <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${forecast.status === ForecastStatus.Approved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'}`}>{forecast.status}</span></td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center space-x-1">
                                                            {isAdmin && ( forecast.status === ForecastStatus.Draft ? <button onClick={() => handleStatusChange(forecast.id, ForecastStatus.Approved)} disabled={saving[`status-${forecast.id}`]} className="p-1 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50" title="Approve"><CheckCircleIcon className="w-5 h-5"/></button> : <button onClick={() => handleStatusChange(forecast.id, ForecastStatus.Draft)} disabled={saving[`status-${forecast.id}`]} className="p-1 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50" title="Revoke Approval"><XCircleIcon className="w-5 h-5"/></button> )}
                                                            <button onClick={() => toggleComments(forecast.id)} className={`relative p-2 rounded-full ${isCommentsOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title="Show Comments">
                                                                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                                                {(forecast.commentCount ?? 0) > 0 && <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-semibold">{forecast.commentCount}</span>}
                                                            </button>
                                                            {isAdmin && <button onClick={() => setForecastToDelete(forecast)} className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete"><TrashIcon className="w-4 h-4"/></button>}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isCommentsOpen && <tr className="animate-fade-in"><td colSpan={7}><CommentSection forecastId={forecast.id} isVisible={isCommentsOpen} onCommentChange={handleCommentChange} /></td></tr>}
                                            </React.Fragment> );
                                        })}
                                    </React.Fragment> );
                                })}
                                {groupedData.length === 0 && !loading && (
                                    <tr><td colSpan={7} className="p-4"><div className="flex flex-col items-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center"><div className="p-4 bg-indigo-100 dark:bg-slate-700 rounded-full"><TableCellsIcon className="w-12 h-12 text-indigo-400"/></div><h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">No Data Available</h3><p className="mt-1 text-slate-500 dark:text-slate-400">No forecast data matches your criteria for the selected period.</p></div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </> )}
                </div>
            </div>

            {/* Add Forecast Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Forecast Entry">
                <form onSubmit={handleSaveNewForecast} className="space-y-4">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Client</label>
                        <select id="client" name="clientId" value={addFormState.clientId} onChange={e => setAddFormState({...addFormState, clientId: e.target.value})} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500" disabled={clientsLoading}>
                            {clientsLoading ? (
                                <option>Loading clients...</option>
                            ) : (
                                <>
                                    <option value="" disabled>Select a client</option>
                                    {availableClients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                </>
                            )}
                        </select>
                        {!clientsLoading && availableClients.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All assigned clients have forecasts for this period.</p>}
                    </div>
                    <div>
                        <label htmlFor="declaredBudget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">BDG Dichiarato {date.year}</label>
                        <input type="number" id="declaredBudget" name="declaredBudget" value={addFormState.declaredBudget} onChange={e => setAddFormState({...addFormState, declaredBudget: parseFloat(e.target.value) || 0})} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hide-number-arrows" />
                    </div>
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">BDG Attivo</label>
                        <input type="number" id="budget" name="budget" value={addFormState.budget} onChange={e => setAddFormState({...addFormState, budget: parseFloat(e.target.value) || 0})} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hide-number-arrows" />
                    </div>
                    <div>
                        <label htmlFor="forecast" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fcast Rolling</label>
                        <input type="number" id="forecast" name="forecast" value={addFormState.forecast} onChange={e => setAddFormState({...addFormState, forecast: parseFloat(e.target.value) || 0})} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 hide-number-arrows" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !addFormState.clientId} className="px-4 py-2 w-28 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex justify-center">{isSubmitting ? <Spinner/> : 'Save'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!forecastToDelete} onClose={() => setForecastToDelete(null)} title="Confirm Deletion" icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}>
                <p>Are you sure you want to delete the forecast for "<strong>{forecastToDelete && clientsMap.get(forecastToDelete.clientId)?.name}</strong>"? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={() => setForecastToDelete(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleConfirmDelete} disabled={isSubmitting} className="px-4 py-2 w-28 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 flex justify-center">{isSubmitting ? <Spinner/> : 'Delete'}</button>
                </div>
            </Modal>
        </>
    );
};

export default ForecastPage;