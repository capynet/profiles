'use client';

import {useState} from 'react';
import {Language, Service, PaymentMethod, Nationality, Ethnicity} from '@prisma/client';
import DeleteEntityModal from './DeleteEntityModal';

type EntityType = 'language' | 'service' | 'paymentMethod' | 'nationality' | 'ethnicity';

interface EntitiesManagementProps {
    initialLanguages: Language[];
    initialServices: Service[];
    initialPaymentMethods: PaymentMethod[];
    initialNationalities: Nationality[];
    initialEthnicities: Ethnicity[];
}

type Entity = Language | Service | PaymentMethod | Nationality | Ethnicity;

export default function EntitiesManagement({
    initialLanguages,
    initialServices,
    initialPaymentMethods,
    initialNationalities,
    initialEthnicities,
}: EntitiesManagementProps) {
    const [activeTab, setActiveTab] = useState<EntityType>('language');
    const [languages, setLanguages] = useState(initialLanguages);
    const [services, setServices] = useState(initialServices);
    const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
    const [nationalities, setNationalities] = useState(initialNationalities);
    const [ethnicities, setEthnicities] = useState(initialEthnicities);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [newName, setNewName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [entityToDelete, setEntityToDelete] = useState<{id: number; name: string} | null>(null);
    const [deleteModalData, setDeleteModalData] = useState<{
        affectedProfiles: number;
        profiles: Array<{id: number; name: string}>;
    } | null>(null);

    const tabs: Array<{id: EntityType; label: string; pluralLabel: string}> = [
        {id: 'language', label: 'Language', pluralLabel: 'Languages'},
        {id: 'service', label: 'Service', pluralLabel: 'Services'},
        {id: 'paymentMethod', label: 'Payment Method', pluralLabel: 'Payment Methods'},
        {id: 'nationality', label: 'Nationality', pluralLabel: 'Nationalities'},
        {id: 'ethnicity', label: 'Ethnicity', pluralLabel: 'Ethnicities'},
    ];

    const getCurrentEntities = (): Entity[] => {
        switch (activeTab) {
            case 'language': return languages;
            case 'service': return services;
            case 'paymentMethod': return paymentMethods;
            case 'nationality': return nationalities;
            case 'ethnicity': return ethnicities;
        }
    };

    const setCurrentEntities = (entities: Entity[]) => {
        switch (activeTab) {
            case 'language': setLanguages(entities as Language[]); break;
            case 'service': setServices(entities as Service[]); break;
            case 'paymentMethod': setPaymentMethods(entities as PaymentMethod[]); break;
            case 'nationality': setNationalities(entities as Nationality[]); break;
            case 'ethnicity': setEthnicities(entities as Ethnicity[]); break;
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/entities/${activeTab}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: newName.trim()}),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to create entity');
                return;
            }

            const newEntity = await response.json();
            setCurrentEntities([...getCurrentEntities(), newEntity]);
            setNewName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Error creating entity:', error);
            alert('Failed to create entity');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/entities/${activeTab}/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: editingName.trim()}),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update entity');
                return;
            }

            const updatedEntity = await response.json();
            const updated = getCurrentEntities().map(e => e.id === id ? updatedEntity : e);
            setCurrentEntities(updated);
            setEditingId(null);
            setEditingName('');
        } catch (error) {
            console.error('Error updating entity:', error);
            alert('Failed to update entity');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        setLoading(true);
        try {
            // First, try to delete without replacement (to check if it's in use)
            const response = await fetch(`/api/admin/entities/${activeTab}/${id}`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const error = await response.json();

                // If entity is in use, show replacement modal
                if (error.inUse) {
                    setEntityToDelete({id, name});
                    setDeleteModalData({
                        affectedProfiles: error.affectedProfiles,
                        profiles: error.profiles || [],
                    });
                    setDeleteModalOpen(true);
                    return;
                }

                alert(error.error || 'Failed to delete entity');
                return;
            }

            // Successfully deleted (wasn't in use)
            const updated = getCurrentEntities().filter(e => e.id !== id);
            setCurrentEntities(updated);
        } catch (error) {
            console.error('Error deleting entity:', error);
            alert('Failed to delete entity');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async (replacementId: number | null) => {
        if (!entityToDelete) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/entities/${activeTab}/${entityToDelete.id}`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({replacementId}),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to delete entity');
                return;
            }

            const result = await response.json();

            // Successfully deleted
            const updated = getCurrentEntities().filter(e => e.id !== entityToDelete.id);
            setCurrentEntities(updated);

            // Close modal
            setDeleteModalOpen(false);
            setEntityToDelete(null);
            setDeleteModalData(null);

            // Show success message
            alert(`Successfully deleted. ${result.replacedInProfiles} profiles were ${replacementId ? 'updated with the replacement' : 'modified to remove this value'}.`);
        } catch (error) {
            console.error('Error deleting entity:', error);
            alert('Failed to delete entity');
        } finally {
            setLoading(false);
        }
    };

    const currentTab = tabs.find(t => t.id === activeTab)!;

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsAdding(false);
                                setEditingId(null);
                            }}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
                            `}
                        >
                            {tab.pluralLabel}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {currentTab.pluralLabel}
                        </h2>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            disabled={loading}
                        >
                            {isAdding ? 'Cancel' : `Add ${currentTab.label}`}
                        </button>
                    </div>

                    {/* Add new entity form */}
                    {isAdding && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter name"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={loading || !newName.trim()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Entities table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {getCurrentEntities().map((entity) => (
                                    <tr key={entity.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {entity.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {editingId === entity.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate(entity.id)}
                                                    disabled={loading}
                                                    autoFocus
                                                />
                                            ) : (
                                                entity.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingId === entity.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(entity.id)}
                                                        disabled={loading || !editingName.trim()}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditingName('');
                                                        }}
                                                        disabled={loading}
                                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(entity.id);
                                                            setEditingName(entity.name);
                                                        }}
                                                        disabled={loading}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entity.id, entity.name)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {getCurrentEntities().length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No {currentTab.pluralLabel.toLowerCase()} found. Add one to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {entityToDelete && deleteModalData && (
                <DeleteEntityModal
                    isOpen={deleteModalOpen}
                    entityName={entityToDelete.name}
                    entityTypeName={currentTab.label}
                    affectedProfiles={deleteModalData.affectedProfiles}
                    profiles={deleteModalData.profiles}
                    availableReplacements={getCurrentEntities().filter(e => e.id !== entityToDelete.id)}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => {
                        setDeleteModalOpen(false);
                        setEntityToDelete(null);
                        setDeleteModalData(null);
                    }}
                    loading={loading}
                />
            )}
        </div>
    );
}
