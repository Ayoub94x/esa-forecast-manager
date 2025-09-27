import React, { useState, useEffect, useMemo } from 'react';
import { Client, BusinessUnit } from '../types';
import * as api from '../services/supabaseApi';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowUpIcon, ArrowDownIcon, ArrowsUpDownIcon } from '../components/icons';

type Entity = Client | BusinessUnit;
type EntityType = 'client' | 'businessUnit';

interface AdminManagementPageProps {
    entityType: EntityType;
}

const AdminManagementPage: React.FC<AdminManagementPageProps> = ({ entityType }) => {
    const [items, setItems] = useState<Entity[]>([]);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Entity | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState('#A1A1AA');
    const [newBusinessUnitId, setNewBusinessUnitId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Entity | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Entity; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

    const { addToast } = useToast();

    const pageTitle = entityType === 'client' ? 'Client Management' : 'Business Unit Management';
    const entityName = entityType === 'client' ? 'Client' : 'Business Unit';

    const fetchData = async () => {
        setLoading(true);
        try {
            if (entityType === 'client') {
                const [clientData, buData] = await Promise.all([api.getClients(), api.getBusinessUnits()]);
                setItems(clientData);
                setBusinessUnits(buData);
            } else {
                const data = await api.getBusinessUnits();
                setItems(data);
            }
        } catch (error) {
            addToast(`Failed to fetch ${entityName}s`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityType]);

    const sortedAndFilteredItems = useMemo(() => {
        let searchableItems = [...items];

        if (searchTerm) {
            searchableItems = searchableItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            searchableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return searchableItems;
    }, [items, searchTerm, sortConfig]);

    const requestSort = (key: keyof Entity) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const renderSortIcon = (key: keyof Entity) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="h-4 w-4 text-indigo-600" />;
        }
        return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        if (entityType === 'client' && !newBusinessUnitId) {
            addToast('Please select a Business Unit', 'warning');
            return;
        }

        try {
            if (entityType === 'client') {
                await api.addClient(newItemName, parseInt(newBusinessUnitId, 10));
            } else {
                await api.addBusinessUnit(newItemName, newItemColor);
            }
            addToast(`${entityName} added successfully`, 'success');
            setNewItemName('');
            setNewBusinessUnitId('');
            setNewItemColor('#A1A1AA');
            fetchData();
        } catch (error) {
            addToast(`Failed to add ${entityName}`, 'error');
        }
    };

    const handleUpdateItem = async () => {
        if (!editingItem || !editingItem.name.trim()) return;
        try {
            if (entityType === 'client') {
                const client = editingItem as Client;
                if (client.businessUnitId === null) {
                    addToast('A Business Unit must be selected', 'warning');
                    return;
                }
                await api.updateClient(client.id, client.name, client.businessUnitId);
            } else {
                const bu = editingItem as BusinessUnit;
                await api.updateBusinessUnit(bu.id, bu.name, bu.color || '#A1A1AA');
            }
            addToast(`${entityName} updated successfully`, 'success');
            setEditingItem(null);
            fetchData();
        } catch (error) {
            addToast(`Failed to update ${entityName}`, 'error');
        }
    };

    const openDeleteModal = (item: Entity) => {
        setItemToDelete(item);
        setIsModalOpen(true);
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            if (entityType === 'client') {
                await api.deleteClient(itemToDelete.id);
            } else {
                await api.deleteBusinessUnit(itemToDelete.id);
            }
            addToast(`${entityName} deleted successfully`, 'success');
            fetchData();
        } catch (error) {
            addToast(`Failed to delete ${entityName}`, 'error');
        } finally {
            setIsModalOpen(false);
            setItemToDelete(null);
        }
    };

    const isClientManagement = entityType === 'client';
    const isBuManagement = entityType === 'businessUnit';

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg max-w-4xl mx-auto w-full transition-colors">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">{pageTitle}</h1>
                
                <form onSubmit={handleAddItem} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row gap-3">
                    {isBuManagement && (
                        <input
                            type="color"
                            value={newItemColor}
                            onChange={(e) => setNewItemColor(e.target.value)}
                            className="p-1 h-10 w-10 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer bg-white dark:bg-slate-700"
                            title="Select color"
                        />
                    )}
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder={`New ${entityName} Name`}
                        className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {isClientManagement && (
                        <select
                            value={newBusinessUnitId}
                            onChange={(e) => setNewBusinessUnitId(e.target.value)}
                            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="" disabled>Select Business Unit</option>
                            {businessUnits.map(bu => (
                                <option key={bu.id} value={bu.id}>{bu.name}</option>
                            ))}
                        </select>
                    )}
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        Add {entityName}
                    </button>
                </form>

                 <div className="mb-4">
                    <input
                        type="text"
                        placeholder={`Search ${entityName}s...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {loading ? <p className="text-center text-slate-500 dark:text-slate-400">Loading...</p> : (
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700/50">
                                <tr>
                                    {isBuManagement && <th scope="col" className="px-6 py-3 font-semibold">Color</th>}
                                    <th scope="col" className="px-6 py-3 w-1/4">
                                        <button onClick={() => requestSort('id')} className="flex items-center gap-1.5 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            ID {renderSortIcon('id')}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        <button onClick={() => requestSort('name')} className="flex items-center gap-1.5 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            Name {renderSortIcon('name')}
                                        </button>
                                    </th>
                                    {isClientManagement && <th scope="col" className="px-6 py-3 font-semibold">Business Unit</th>}
                                    <th scope="col" className="px-6 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredItems.map((item, index) => (
                                    <tr key={item.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50 dark:hover:bg-slate-700/50`}>
                                        {isBuManagement && (
                                            <td className="px-6 py-4">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="color"
                                                        value={(editingItem as BusinessUnit).color || '#A1A1AA'}
                                                        onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                                                        className="p-0 h-6 w-10 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer"
                                                    />
                                                ) : (
                                                    <div className="h-6 w-10 rounded-md border border-slate-300 dark:border-slate-600" style={{ backgroundColor: (item as BusinessUnit).color || '#A1A1AA' }}></div>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">{item.id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                            {editingItem?.id === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editingItem.name}
                                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateItem()
                                                        if (e.key === 'Escape') setEditingItem(null)
                                                    }}
                                                    className="p-1 border rounded-md w-full bg-white dark:bg-slate-700 dark:border-slate-600"
                                                    autoFocus
                                                />
                                            ) : (
                                                item.name
                                            )}
                                        </td>
                                        {isClientManagement && (
                                            <td className="px-6 py-4">
                                                {editingItem?.id === item.id ? (
                                                    <select
                                                        value={(editingItem as Client).businessUnitId ?? ''}
                                                        onChange={(e) => setEditingItem({ ...editingItem, businessUnitId: parseInt(e.target.value, 10) })}
                                                        className="p-1 border rounded-md w-full bg-white dark:bg-slate-700 dark:border-slate-600"
                                                    >
                                                        <option value="" disabled>Select...</option>
                                                        {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
                                                    </select>
                                                ) : (
                                                    businessUnits.find(bu => bu.id === (item as Client).businessUnitId)?.name || <span className="text-slate-400">N/A</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                {editingItem?.id === item.id ? (
                                                    <>
                                                        <button onClick={handleUpdateItem} className="p-2 text-green-600 dark:text-green-400 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" title="Save">
                                                            <CheckCircleIcon className='h-5 w-5'/>
                                                        </button>
                                                        <button onClick={() => setEditingItem(null)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="Cancel">
                                                            <XCircleIcon className='h-5 w-5'/>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setEditingItem(item)} className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Edit">
                                                            <PencilIcon className='h-4 w-4'/>
                                                        </button>
                                                        <button onClick={() => openDeleteModal(item)} className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete">
                                                            <TrashIcon className='h-4 w-4'/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sortedAndFilteredItems.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={isClientManagement ? 4 : (isBuManagement ? 4 : 3)} className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            No {entityName}s found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Confirm Deletion`} icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}>
                <p>Are you sure you want to delete the {entityName} "{itemToDelete?.name}"? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                        Cancel
                    </button>
                    <button onClick={confirmDeleteItem} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default AdminManagementPage;