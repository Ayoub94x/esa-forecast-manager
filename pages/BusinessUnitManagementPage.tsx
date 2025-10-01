import React, { useEffect, useMemo, useState } from 'react';
import { BusinessUnit } from '../types';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, BuildingOfficeIcon, EyeIcon, ChartBarIcon } from '../components/icons';
import * as api from '../services/supabaseApi';

type SortConfig = { key: keyof BusinessUnit; direction: 'ascending' | 'descending' } | null;
type ViewMode = 'grid' | 'table';

const BusinessUnitManagementPage: React.FC = () => {
  const { addToast } = useToast();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);

  // Add/Edit form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#4F46E5');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = viewMode === 'grid' ? 12 : 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const units = await api.getBusinessUnits();
        setBusinessUnits(units);
      } catch (e) {
        console.error(e);
        addToast('Errore nel caricamento delle Business Unit', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  const stats = useMemo(() => {
    const total = businessUnits.length;
    const activeUnits = businessUnits.filter(bu => bu.name).length;
    const colorVariations = new Set(businessUnits.map(bu => bu.color)).size;
    return { total, active: activeUnits, colors: colorVariations };
  }, [businessUnits]);

  const toggleSort = (key: keyof BusinessUnit) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof BusinessUnit) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />;
    if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="h-4 w-4 text-indigo-600" />;
    return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
  };

  const filtered = useMemo(() => {
    let data = [...businessUnits];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(bu => bu.name.toLowerCase().includes(term));
    }
    if (sortConfig) {
      data.sort((a, b) => {
        const k = sortConfig.key;
        const av = (a[k] ?? '') as any;
        const bv = (b[k] ?? '') as any;
        if (typeof av === 'string' && typeof bv === 'string') {
          const cmp = av.localeCompare(bv);
          return sortConfig.direction === 'ascending' ? cmp : -cmp;
        }
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return sortConfig.direction === 'ascending' ? cmp : -cmp;
      });
    }
    return data;
  }, [businessUnits, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const refresh = async () => {
    try {
      const units = await api.getBusinessUnits();
      setBusinessUnits(units);
    } catch (e) {
      addToast('Aggiornamento fallito', 'error');
    }
  };

  const clearSelection = () => setSelectedIds(new Set());
  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Add
  const openAddModal = () => {
    setFormName('');
    setFormColor('#4F46E5');
    setIsAddModalOpen(true);
  };
  const handleAddBU = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const bu = await api.addBusinessUnit(formName.trim(), formColor);
      addToast('Business Unit creata con successo', 'success');
      setIsAddModalOpen(false);
      setBusinessUnits(prev => [bu, ...prev]);
    } catch (err) {
      addToast('Errore nella creazione della Business Unit', 'error');
    }
  };

  // Edit
  const openEditModal = (bu: BusinessUnit) => {
    setEditingBU(bu);
    setFormName(bu.name);
    setFormColor(bu.color || '#4F46E5');
    setIsEditModalOpen(true);
  };
  const handleEditBU = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBU) return;
    try {
      const updated = await api.updateBusinessUnit(editingBU.id, formName.trim(), formColor);
      addToast('Business Unit aggiornata con successo', 'success');
      setIsEditModalOpen(false);
      setEditingBU(null);
      setBusinessUnits(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    } catch (err) {
      addToast('Errore nell\'aggiornamento della Business Unit', 'error');
    }
  };

  // Delete
  const handleDeleteBU = async (bu: BusinessUnit) => {
    if (!confirm(`Sei sicuro di voler eliminare la Business Unit "${bu.name}"?`)) return;
    try {
      const { success } = await api.deleteBusinessUnit(bu.id);
      if (success) {
        addToast('Business Unit eliminata con successo', 'success');
        setBusinessUnits(prev => prev.filter(b => b.id !== bu.id));
      } else {
        addToast('Errore nell\'eliminazione della Business Unit', 'error');
      }
    } catch (err) {
      addToast('Errore nell\'eliminazione della Business Unit', 'error');
    }
  };

  const BusinessUnitCard: React.FC<{ bu: BusinessUnit; index: number }> = ({ bu, index }) => (
    <div 
      className={`group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transform hover:-translate-y-1 animate-fade-in`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${bu.color}20`, border: `2px solid ${bu.color}` }}
            >
              <BuildingOfficeIcon className="h-6 w-6" style={{ color: bu.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {bu.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">ID: {bu.id}</p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={selectedIds.has(bu.id)} 
            onChange={() => toggleId(bu.id)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Colore:</span>
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600" style={{ backgroundColor: bu.color || '#A1A1AA' }} />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{bu.color || '#A1A1AA'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setDetailId(bu.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            Dettagli
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => openEditModal(bu)} 
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" 
              title="Modifica"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDeleteBU(bu)} 
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
              title="Elimina"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Gestione Business Units
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestisci le unità aziendali con un'interfaccia moderna e intuitiva
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5" />
          Nuova Business Unit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Business Units Totali</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Unità Attive</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Variazioni Colore</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.colors}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca Business Unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedIds.size} selezionate
                </span>
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Pulisci
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      ) : pageData.length === 0 ? (
        <div className="text-center py-20">
          <BuildingOfficeIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Nessuna Business Unit trovata
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {searchTerm ? 'Prova a modificare i criteri di ricerca.' : 'Inizia creando la tua prima Business Unit.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Crea Business Unit
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pageData.map((bu, index) => (
            <BusinessUnitCard key={bu.id} bu={bu} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === pageData.length && pageData.length > 0} 
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const ids = new Set(selectedIds);
                        pageData.forEach(b => checked ? ids.add(b.id) : ids.delete(b.id));
                        setSelectedIds(ids);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100">
                    <button className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => toggleSort('name')}>
                      Nome {renderSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100">Colore</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {pageData.map((bu, idx) => (
                  <tr key={bu.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer`}
                      onClick={() => setDetailId(bu.id)}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(bu.id)} 
                        onChange={() => toggleId(bu.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${bu.color}20`, border: `2px solid ${bu.color}` }}
                        >
                          <BuildingOfficeIcon className="h-5 w-5" style={{ color: bu.color }} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{bu.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">ID: {bu.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <span className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600" style={{ backgroundColor: bu.color || '#A1A1AA' }} />
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{bu.color || '#A1A1AA'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(bu); }} 
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" 
                          title="Modifica"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteBU(bu); }} 
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                          title="Elimina"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Pagina {page} di {totalPages} • {filtered.length} risultati totali
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Precedente
            </button>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Successiva
            </button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {detailId !== null && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-in-out">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dettagli Business Unit</h2>
              <button 
                onClick={() => setDetailId(null)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto">
            {(() => {
              const bu = businessUnits.find(b => b.id === detailId);
              if (!bu) return <div className="text-slate-500 dark:text-slate-400">Business Unit non trovata</div>;
              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: `${bu.color}20`, border: `3px solid ${bu.color}` }}
                    >
                      <BuildingOfficeIcon className="h-10 w-10" style={{ color: bu.color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{bu.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400">ID: {bu.id}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Colore Identificativo
                      </label>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                          style={{ backgroundColor: bu.color || '#A1A1AA' }}
                        />
                        <div>
                          <div className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {bu.color || '#A1A1AA'}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Codice esadecimale</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(bu)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDeleteBU(bu)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Elimina
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuova Business Unit">
        <form onSubmit={handleAddBU} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nome Business Unit
            </label>
            <input 
              value={formName} 
              onChange={e => setFormName(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              placeholder="Inserisci il nome della Business Unit"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Colore Identificativo
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={formColor} 
                onChange={e => setFormColor(e.target.value)} 
                className="w-16 h-12 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input 
                  type="text" 
                  value={formColor} 
                  onChange={e => setFormColor(e.target.value)} 
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="#4F46E5"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)} 
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Crea Business Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifica Business Unit">
        <form onSubmit={handleEditBU} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nome Business Unit
            </label>
            <input 
              value={formName} 
              onChange={e => setFormName(e.target.value)} 
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              placeholder="Inserisci il nome della Business Unit"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Colore Identificativo
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={formColor} 
                onChange={e => setFormColor(e.target.value)} 
                className="w-16 h-12 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input 
                  type="text" 
                  value={formColor} 
                  onChange={e => setFormColor(e.target.value)} 
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="#4F46E5"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Salva Modifiche
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BusinessUnitManagementPage;