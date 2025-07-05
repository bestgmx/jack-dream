import React, { useState, useMemo } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { Delivery, OrderNumberCategory } from '../types.ts';
import { Modal } from './Modal.tsx';

// --- Icons ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconGear = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734-2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const IconView = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;

const initialFormState: Omit<Delivery, 'id'> = {
    orderNumberCategoryId: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    cartonCount: 0,
    weight: 0,
    receiptNumber: '',
    deliveryType: 'sea',
    destination: 'dubai',
    receiptPhoto: null,
    cargoPhoto: null,
    description: '',
    isArrived: false,
};

interface DeliveriesManagerProps {
    deliveries: Delivery[];
    setDeliveries: React.Dispatch<React.SetStateAction<Delivery[]>>;
    orderNumberCategories: OrderNumberCategory[];
    setOrderNumberCategories: React.Dispatch<React.SetStateAction<OrderNumberCategory[]>>;
}

export const DeliveriesManager: React.FC<DeliveriesManagerProps> = ({ deliveries, setDeliveries, orderNumberCategories, setOrderNumberCategories }) => {
    const { t } = useI18n();
    const itemsPerPage = 10;

    // --- State ---
    const [formState, setFormState] = useState(initialFormState);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [cargoPreview, setCargoPreview] = useState<string | null>(null);
    const [isAddCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
    const [isManageCategoryModalOpen, setManageCategoryModalOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        orderNumberCategoryId: '',
        deliveryType: '',
        destination: '',
        dateFrom: '',
        dateTo: '',
    });
    
    // --- Memos ---
    const filteredDeliveries = useMemo(() => {
        return deliveries
            .filter(d => {
                if (filters.orderNumberCategoryId && d.orderNumberCategoryId !== filters.orderNumberCategoryId) return false;
                if (filters.deliveryType && d.deliveryType !== filters.deliveryType) return false;
                if (filters.destination && d.destination !== filters.destination) return false;
                if (filters.dateFrom && d.deliveryDate < filters.dateFrom) return false;
                if (filters.dateTo && d.deliveryDate > filters.dateTo) return false;
                return true;
            })
            .sort((a,b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    }, [deliveries, filters]);

    const paginatedDeliveries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDeliveries, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredDeliveries.length / itemsPerPage);
    }, [filteredDeliveries, itemsPerPage]);


    // --- Handlers ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            orderNumberCategoryId: '',
            deliveryType: '',
            destination: '',
            dateFrom: '',
            dateTo: '',
        });
        setCurrentPage(1);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const previewUrl = URL.createObjectURL(file);
            setFormState(prev => ({ ...prev, [name]: file }));
            if (name === 'receiptPhoto') {
                setReceiptPreview(previewUrl);
            } else if (name === 'cargoPhoto') {
                setCargoPreview(previewUrl);
            }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newDelivery: Delivery = {
            ...formState,
            id: Date.now().toString(),
            cartonCount: Number(formState.cartonCount),
            weight: Number(formState.weight),
            isArrived: formState.isArrived ?? false,
        };
        setDeliveries(prev => [newDelivery, ...prev]);
        setFormState(initialFormState);
        setReceiptPreview(null);
        setCargoPreview(null);
        // Optionally show a success message
    };

    const handleDeleteDelivery = (id: string) => {
        if (window.confirm(t('deleteDeliveryConfirmation'))) {
            setDeliveries(prev => prev.filter(d => d.id !== id));
        }
    };
    
    return (
        <div className="space-y-8">
            {/* Form Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                <h3 className="font-bold text-slate-800 text-xl mb-4">{t('addNewDelivery')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="orderNumberCategoryId" className="block text-sm font-medium text-slate-600 mb-1">{t('orderNumberCategory')}</label>
                            <div className="flex gap-1">
                                <select id="orderNumberCategoryId" name="orderNumberCategoryId" value={formState.orderNumberCategoryId} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="">{t('selectOrderNumberCategory')}</option>
                                    {orderNumberCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <button type="button" onClick={() => setAddCategoryModalOpen(true)} className="p-2 border rounded-lg hover:bg-slate-100" title={t('addCategoryButton')}><IconPlus/></button>
                                <button type="button" onClick={() => setManageCategoryModalOpen(true)} className="p-2 border rounded-lg hover:bg-slate-100" title={t('manageCategoriesButton')}><IconGear/></button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="deliveryDate" className="block text-sm font-medium text-slate-600 mb-1">{t('deliveryDate')}</label>
                            <input id="deliveryDate" type="date" name="deliveryDate" value={formState.deliveryDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                         <div>
                            <label htmlFor="cartonCount" className="block text-sm font-medium text-slate-600 mb-1">{t('cartonQuantity')}</label>
                            <input id="cartonCount" type="number" name="cartonCount" value={formState.cartonCount} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                         <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-slate-600 mb-1">{t('weight')}</label>
                            <input id="weight" type="number" name="weight" value={formState.weight} onChange={handleInputChange} step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                         <div>
                            <label htmlFor="receiptNumber" className="block text-sm font-medium text-slate-600 mb-1">{t('receiptNumber')}</label>
                            <input id="receiptNumber" type="text" name="receiptNumber" value={formState.receiptNumber} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div>
                            <label htmlFor="deliveryType" className="block text-sm font-medium text-slate-600 mb-1">{t('deliveryType')}</label>
                            <select id="deliveryType" name="deliveryType" value={formState.deliveryType} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="sea">{t('deliveryTypeSea')}</option>
                                <option value="air">{t('deliveryTypeAir')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="deliveryDestination" className="block text-sm font-medium text-slate-600 mb-1">{t('deliveryDestination')}</label>
                            <select id="deliveryDestination" name="destination" value={formState.destination} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="dubai">{t('destinationDubai')}</option>
                                <option value="iraq">{t('destinationIraq')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="receiptPhoto" className="block text-sm font-medium text-slate-600 mb-1">{t('receiptPhoto')}</label>
                            <input id="receiptPhoto" type="file" name="receiptPhoto" onChange={handleFileChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                            {receiptPreview && <img src={receiptPreview} alt="Receipt Preview" className="mt-2 h-20 w-20 object-cover rounded-md" />}
                        </div>
                         <div>
                            <label htmlFor="cargoPhoto" className="block text-sm font-medium text-slate-600 mb-1">{t('cargoPhoto')}</label>
                            <input id="cargoPhoto" type="file" name="cargoPhoto" onChange={handleFileChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                            {cargoPreview && <img src={cargoPreview} alt="Cargo Preview" className="mt-2 h-20 w-20 object-cover rounded-md" />}
                        </div>
                         <div className="md:col-span-2">
                             <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                             <textarea id="description" name="description" value={formState.description || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"></textarea>
                         </div>
                         <div>
                            <label htmlFor="isArrived" className="block text-sm font-medium text-slate-600 mb-1">{t('cargoStatus')}</label>
                            <div className="flex items-center gap-2">
                                <input id="isArrived" name="isArrived" type="checkbox" checked={formState.isArrived} onChange={e => setFormState(prev => ({ ...prev, isArrived: e.target.checked }))} />
                                <span>{formState.isArrived ? t('cargoArrived') : t('cargoInTransit')}</span>
                            </div>
                        </div>
                    </div>
                     <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                        {t('addDeliveryButton')}
                    </button>
                </form>
            </div>
            
            {/* History Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                <h3 className="font-bold text-slate-800 text-xl mb-4">{t('lastDeliveries')}</h3>
                
                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <select name="orderNumberCategoryId" value={filters.orderNumberCategoryId} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                             <option value="">{t('selectOrderNumberCategory')}</option>
                             {orderNumberCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select name="deliveryType" value={filters.deliveryType} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="">{t('deliveryType')}</option>
                            <option value="sea">{t('deliveryTypeSea')}</option>
                            <option value="air">{t('deliveryTypeAir')}</option>
                        </select>
                        <select name="destination" value={filters.destination} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="">{t('deliveryDestination')}</option>
                            <option value="dubai">{t('destinationDubai')}</option>
                            <option value="iraq">{t('destinationIraq')}</option>
                        </select>
                        <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder={t('dateFrom')} />
                        <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder={t('dateTo')} />
                    </div>
                    <button onClick={clearFilters} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">{t('clearFilters')}</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                         <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('orderNumberCategory')}</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('deliveryDate')}</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('cartonQuantity')}</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('weight')}</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('receiptNumber')}</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{t('cargoStatus')}</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                         </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedDeliveries.length > 0 ? paginatedDeliveries.map(d => {
                                const categoryName = orderNumberCategories.find(c => c.id === d.orderNumberCategoryId)?.name || 'N/A';
                                return (
                                <tr key={d.id}>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{categoryName}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{d.deliveryDate}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{d.cartonCount}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{d.weight}kg</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-600">{d.receiptNumber}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                                        <input type="checkbox" checked={d.isArrived} onChange={e => setDeliveries(prev => prev.map(del => del.id === d.id ? { ...del, isArrived: e.target.checked } : del))} />
                                        <span className="ml-2">{d.isArrived ? t('cargoArrived') : t('cargoInTransit')}</span>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm space-x-1 rtl:space-x-reverse">
                                        {d.receiptPhoto && <button onClick={() => setViewingImage(URL.createObjectURL(d.receiptPhoto!))} className="inline-flex items-center gap-1 text-teal-600 hover:underline"><IconView/> {t('receiptPhoto')}</button>}
                                        {d.cargoPhoto && <button onClick={() => setViewingImage(URL.createObjectURL(d.cargoPhoto!))} className="inline-flex items-center gap-1 text-teal-600 hover:underline"><IconView/> {t('cargoPhoto')}</button>}
                                        <button onClick={() => handleDeleteDelivery(d.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100"><IconTrash/></button>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500 py-8">{t('noDeliveriesFound')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                     <nav className="flex justify-between items-center pt-4 border-t mt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50">{t('previous')}</button>
                        <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium bg-white border rounded-md disabled:opacity-50">{t('next')}</button>
                     </nav>
                 )}
            </div>

            <OrderNumberCategoryModals
                isOpen={isAddCategoryModalOpen || isManageCategoryModalOpen}
                mode={isAddCategoryModalOpen ? 'add' : 'manage'}
                onClose={() => { setAddCategoryModalOpen(false); setManageCategoryModalOpen(false); }}
                categories={orderNumberCategories}
                setCategories={setOrderNumberCategories}
            />

            {viewingImage && (
                <Modal
                    isOpen={!!viewingImage}
                    onClose={() => setViewingImage(null)}
                    title={t('viewImageModalTitle')}
                    size="xl"
                >
                    <div className="flex justify-center items-center">
                         <img src={viewingImage} alt={t('viewImageModalTitle')} className="max-w-full max-h-[80vh] object-contain rounded-lg"/>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- Modal Sub-component for Categories ---
interface CategoryModalsProps {
    isOpen: boolean;
    mode: 'add' | 'manage';
    onClose: () => void;
    categories: OrderNumberCategory[];
    setCategories: React.Dispatch<React.SetStateAction<OrderNumberCategory[]>>;
}
const OrderNumberCategoryModals: React.FC<CategoryModalsProps> = ({ isOpen, mode, onClose, categories, setCategories}) => {
    const { t } = useI18n();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<OrderNumberCategory | null>(null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            setCategories(prev => [...prev, { id: Date.now().toString(), name: newCategoryName.trim() }]);
            setNewCategoryName('');
            onClose();
        }
    };
    
    const handleSaveEdit = () => {
        if(editingCategory && editingCategory.name.trim()) {
            setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: editingCategory.name.trim() } : c));
            setEditingCategory(null);
        }
    };
    
    const handleDeleteCategory = (id: string) => {
        if (window.confirm(t('deleteConfirmation'))) {
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    if (!isOpen) return null;
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'add' ? t('addOrderNumberCategoryModalTitle') : t('manageOrderNumberCategoriesModalTitle')}
            size={mode === 'add' ? 'sm' : 'lg'}
        >
            {mode === 'add' ? (
                <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                        <label htmlFor="categoryName" className="block text-sm font-medium text-slate-600 mb-1">{t('categoryName')}</label>
                        <input id="categoryName" type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm">{t('saveButton')}</button>
                </form>
            ) : (
                <div className="space-y-3">
                    {categories.length > 0 ? categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            {editingCategory?.id === cat.id ? (
                                <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} onBlur={handleSaveEdit} autoFocus className="flex-grow px-2 py-1 border rounded-md"/>
                            ) : (
                                <span className="font-medium text-slate-800">{cat.name}</span>
                            )}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingCategory(cat)} className="text-blue-600 p-1.5"><IconEdit/></button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 p-1.5"><IconTrash/></button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 py-4">{t('noOrderNumberCategories')}</p>
                    )}
                </div>
            )}
        </Modal>
    );
};