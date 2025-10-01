import React, { useEffect, useMemo, useState } from 'react';
import { Client, BusinessUnit } from '../types';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import BusinessUnitFilter from '../components/filters/BusinessUnitFilter';
import CountryFilter from '../components/filters/CountryFilter';
import { COUNTRIES, getCountryName } from '../utils/countries';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '../components/icons';
import * as clientApi from '../services/clientApi';

type SortConfig = { key: keyof Client; direction: 'ascending' | 'descending' } | null;

const ClientManagementPage: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'ascending' });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailId, setDetailId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Paginazione
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cs, bus] = await Promise.all([
          clientApi.getClients({ businessUnitIds: selectedBusinessUnits }),
          clientApi.getBusinessUnits()
        ]);
        setClients(cs);
        setBusinessUnits(bus);
      } catch (e) {
        console.error(e);
        addToast('Errore nel caricamento dei clienti', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  // Ricarica lato DB quando cambia il filtro BU
  useEffect(() => {
    const loadByBU = async () => {
      try {
        const cs = await clientApi.getClients({ businessUnitIds: selectedBusinessUnits });
        setClients(cs);
        setPage(1);
      } catch (e) {
        console.error(e);
        addToast('Errore durante il filtro per BU', 'error');
      }
    };
    loadByBU();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessUnits]);

  const stats = useMemo(() => {
    const total = clients.length;
    const countrySet = new Set(clients.map(c => c.paese).filter(Boolean));
    const buSet = new Set(clients.map(c => c.businessUnitId || 0).filter(Boolean));
    return { total, countries: countrySet.size, bus: buSet.size };
  }, [clients]);

  const toggleSort = (key: keyof Client) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Client) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />;
    if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="h-4 w-4 text-indigo-600" />;
    return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
  };

  const filtered = useMemo(() => {
    let data = [...clients];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(term));
    }
    if (selectedCountries.length > 0) {
      data = data.filter(c => selectedCountries.includes(c.paese));
    }
    // Il filtro per BU è ora applicato lato database
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
  }, [clients, searchTerm, selectedCountries, selectedBusinessUnits, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const businessUnitMap = useMemo(() => new Map(businessUnits.map(bu => [bu.id, bu])), [businessUnits]);

  const refresh = async () => {
    try {
      const cs = await clientApi.getClients({ businessUnitIds: selectedBusinessUnits });
      setClients(cs);
    } catch (e) {
      addToast('Aggiornamento fallito', 'error');
    }
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const businessUnitIdStr = (form.elements.namedItem('businessUnitId') as HTMLSelectElement).value;
    const paese = (form.elements.namedItem('paese') as HTMLSelectElement).value;
    if (!name || !paese) {
      addToast('Inserisci nome e paese', 'warning');
      return;
    }
    try {
      await clientApi.addClient(name, businessUnitIdStr ? Number(businessUnitIdStr) : null, paese);
      addToast('Cliente creato', 'success');
      setIsAddModalOpen(false);
      await refresh();
    } catch (e) {
      addToast('Creazione cliente fallita', 'error');
    }
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const businessUnitIdStr = (form.elements.namedItem('businessUnitId') as HTMLSelectElement).value;
    const paese = (form.elements.namedItem('paese') as HTMLSelectElement).value;
    try {
      await clientApi.updateClient(editingClient.id, {
        name,
        businessUnitId: businessUnitIdStr ? Number(businessUnitIdStr) : null,
        paese,
      });
      addToast('Cliente aggiornato', 'success');
      setIsEditModalOpen(false);
      setEditingClient(null);
      await refresh();
    } catch (e) {
      addToast('Aggiornamento cliente fallito', 'error');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      await clientApi.deleteClient(client.id);
      addToast('Cliente eliminato', 'success');
      await refresh();
    } catch (e) {
      addToast('Eliminazione cliente fallita', 'error');
    }
  };

  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkAssignBU = async (buId: number | null) => {
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => clientApi.updateClient(id, { businessUnitId: buId })));
      addToast('Business Unit assegnata ai selezionati', 'success');
      clearSelection();
      await refresh();
    } catch (e) {
      addToast('Assegnazione di gruppo fallita', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Gestione Clienti</h1>
          <p className="text-slate-500 dark:text-slate-400">Interfaccia moderna per gestione, filtri e azioni rapide</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
        >
          <PlusIcon className="h-4 w-4" /> Nuovo Cliente
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow">
          <div className="text-slate-500 text-sm">Clienti totali</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow">
          <div className="text-slate-500 text-sm">Paesi</div>
          <div className="text-2xl font-semibold">{stats.countries}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow">
          <div className="text-slate-500 text-sm">Business Units</div>
          <div className="text-2xl font-semibold">{stats.bus}</div>
        </div>
      </div>

      {/* Toolbar filtri */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Cerca cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </div>
        <BusinessUnitFilter
          selectedBusinessUnits={selectedBusinessUnits}
          onBusinessUnitChange={(bus) => setSelectedBusinessUnits(bus)}
        />
        <CountryFilter
          selectedCountries={selectedCountries}
          onCountryChange={(countries) => setSelectedCountries(countries)}
        />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <select
              onChange={(e) => bulkAssignBU(e.target.value ? Number(e.target.value) : null)}
              defaultValue=""
              className="px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="" disabled>Assegna BU ai selezionati</option>
              <option value="">Nessuna</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.name}</option>
              ))}
            </select>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
            >
              <XMarkIcon className="h-4 w-4" /> Pulisci selezione
            </button>
          </div>
        )}
      </div>

      {/* Tabella clienti */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pageData.every(c => selectedIds.has(c.id)) && pageData.length > 0}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedIds(prev => {
                          const n = new Set(prev);
                          pageData.forEach(c => checked ? n.add(c.id) : n.delete(c.id));
                          return n;
                        });
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('name')}>Nome {renderSortIcon('name')}</th>
                  <th className="px-4 py-3 text-left">Business Unit</th>
                  <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('paese')}>Paese {renderSortIcon('paese')}</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((client, idx) => (
                  <tr key={client.id} className={`border-t border-slate-200 dark:border-slate-700 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-slate-700`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(client.id)} onChange={() => toggleId(client.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <button onClick={() => setDetailId(client.id)} className="hover:underline">{client.name}</button>
                    </td>
                    <td className="px-4 py-3">
                      {client.businessUnitId ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600"
                            style={{ backgroundColor: businessUnitMap.get(client.businessUnitId)?.color || '#A1A1AA' }}
                          />
                          {businessUnitMap.get(client.businessUnitId)?.name || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Nessuna</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-sm">{getCountryName(client.paese)}</span>
                        <span className="text-xs text-slate-400">{client.paese}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEditClient(client)} className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Modifica">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteClient(client)} className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Elimina">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Nessun cliente trovato</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">Pagina {page} di {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                disabled={page <= 1}
              >
                Prec.
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                disabled={page >= totalPages}
              >
                Succ.
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side panel dettagli */}
      {detailId !== null && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailId(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-slate-800 shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Dettagli Cliente</h2>
              <button onClick={() => setDetailId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            {(() => {
              const client = clients.find(c => c.id === detailId);
              if (!client) return <div className="text-slate-500">Cliente non trovato</div>;
              const bu = client.businessUnitId ? businessUnitMap.get(client.businessUnitId) : undefined;
              return (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500">Nome</div>
                    <div className="text-lg font-medium">{client.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500">Business Unit</div>
                    <div className="flex items-center gap-2">
                      {bu ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bu.color }} />
                          {bu.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Nessuna</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500">Paese</div>
                    <div>{getCountryName(client.paese)} <span className="text-xs text-slate-400">({client.paese})</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modale Aggiungi */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nuovo Cliente">
        <form className="space-y-4" onSubmit={handleAddClient}>
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input name="name" type="text" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Unit</label>
            <select name="businessUnitId" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700">
              <option value="">Nessuna</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paese</label>
            <select name="paese" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" required defaultValue="IT">
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700">Annulla</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Crea</button>
          </div>
        </form>
      </Modal>

      {/* Modale Modifica */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifica Cliente">
        {editingClient && (
          <form className="space-y-4" onSubmit={handleEditClient}>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input name="name" type="text" defaultValue={editingClient.name} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business Unit</label>
              <select name="businessUnitId" defaultValue={editingClient.businessUnitId ?? ''} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700">
                <option value="">Nessuna</option>
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Paese</label>
              <select name="paese" defaultValue={editingClient.paese} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700" required>
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700">Annulla</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Salva</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClientManagementPage;
