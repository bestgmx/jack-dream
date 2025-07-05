import React, { useState, useMemo } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { Product } from '../types.ts';
import { Modal } from './Modal.tsx';

const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;

const initialProductFormState: Omit<Product, 'id'> = {
    item_code: '',
    brand_named: '',
    specifications: '',
    category_name: '',
    source: '',
    order_number: '',
    quantity: 0,
    cny_purchase_price: 0,
    usd_selling_price: 0,
    description: '',
    warehouse_name: '',
};

interface ProductsManagerProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    inventory: Record<string, number>; // productId to quantity
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ products, setProducts, inventory }) => {
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formState, setFormState] = useState<Omit<Product, 'id'>>(initialProductFormState);
    
    // Filtering state
    const [filters, setFilters] = useState({
        item_code: '',
        brand_named: '',
        specifications: '',
        category_name: '',
        source: '',
        order_number: '',
        description: '',
        warehouse_name: '',
        min_quantity: '',
        max_quantity: '',
        min_cny_price: '',
        max_cny_price: '',
        min_usd_price: '',
        max_usd_price: '',
        min_stock: '',
        max_stock: ''
    });
    
    const [showFilters, setShowFilters] = useState(false);
    
    const openAddModal = () => {
        setEditingProduct(null);
        setFormState(initialProductFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormState(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormState(initialProductFormState);
    };

    // Filter products based on current filters
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const stock = inventory[product.id] ?? 0;
            
            // Text filters
            if (filters.item_code && !product.item_code?.toLowerCase().includes(filters.item_code.toLowerCase())) return false;
            if (filters.brand_named && !product.brand_named?.toLowerCase().includes(filters.brand_named.toLowerCase())) return false;
            if (filters.specifications && !product.specifications?.toLowerCase().includes(filters.specifications.toLowerCase())) return false;
            if (filters.category_name && !product.category_name?.toLowerCase().includes(filters.category_name.toLowerCase())) return false;
            if (filters.source && !product.source?.toLowerCase().includes(filters.source.toLowerCase())) return false;
            if (filters.order_number && !product.order_number?.toLowerCase().includes(filters.order_number.toLowerCase())) return false;
            if (filters.description && !product.description?.toLowerCase().includes(filters.description.toLowerCase())) return false;
            if (filters.warehouse_name && !product.warehouse_name?.toLowerCase().includes(filters.warehouse_name.toLowerCase())) return false;
            
            // Numeric filters
            if (filters.min_quantity && (product.quantity || 0) < Number(filters.min_quantity)) return false;
            if (filters.max_quantity && (product.quantity || 0) > Number(filters.max_quantity)) return false;
            if (filters.min_cny_price && (product.cny_purchase_price || 0) < Number(filters.min_cny_price)) return false;
            if (filters.max_cny_price && (product.cny_purchase_price || 0) > Number(filters.max_cny_price)) return false;
            if (filters.min_usd_price && (product.usd_selling_price || 0) < Number(filters.min_usd_price)) return false;
            if (filters.max_usd_price && (product.usd_selling_price || 0) > Number(filters.max_usd_price)) return false;
            if (filters.min_stock && stock < Number(filters.min_stock)) return false;
            if (filters.max_stock && stock > Number(filters.max_stock)) return false;
            
            return true;
        });
    }, [products, filters, inventory]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearAllFilters = () => {
        setFilters({
            item_code: '',
            brand_named: '',
            specifications: '',
            category_name: '',
            source: '',
            order_number: '',
            description: '',
            warehouse_name: '',
            min_quantity: '',
            max_quantity: '',
            min_cny_price: '',
            max_cny_price: '',
            min_usd_price: '',
            max_usd_price: '',
            min_stock: '',
            max_stock: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            // Update
            setProducts(products.map(p => p.id === editingProduct.id ? { ...editingProduct, ...formState } : p));
        } else {
            // Add
            const newProduct: Product = { id: Date.now().toString(), ...formState };
            setProducts(prev => [newProduct, ...prev]);
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        if(window.confirm(t('deleteConfirmation'))) {
            setProducts(products.filter(p => p.id !== id));
            // Note: This does not handle inventory cleanup. That would require more complex logic.
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-xl">{t('productsTitle')}</h3>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform"
                >
                    <IconPlus />
                    <span>{t('addNewProduct')}</span>
                </button>
            </div>

            {/* Filter Controls */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                showFilters 
                                    ? 'text-teal-700 bg-teal-100 hover:bg-teal-200' 
                                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                            </svg>
                            فیلترها
                            {hasActiveFilters && (
                                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {Object.values(filters).filter(v => v !== '').length}
                                </span>
                            )}
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                پاک کردن فیلترها
                            </button>
                        )}
                    </div>
                    <div className="text-sm text-slate-500">
                        {filteredProducts.length} از {products.length} محصول
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Text Filters */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">کد کالا</label>
                                <input
                                    type="text"
                                    value={filters.item_code}
                                    onChange={(e) => handleFilterChange('item_code', e.target.value)}
                                    placeholder="جستجو در کد کالا"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">برند</label>
                                <input
                                    type="text"
                                    value={filters.brand_named}
                                    onChange={(e) => handleFilterChange('brand_named', e.target.value)}
                                    placeholder="جستجو در برند"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">مشخصات</label>
                                <input
                                    type="text"
                                    value={filters.specifications}
                                    onChange={(e) => handleFilterChange('specifications', e.target.value)}
                                    placeholder="جستجو در مشخصات"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">دسته‌بندی</label>
                                <input
                                    type="text"
                                    value={filters.category_name}
                                    onChange={(e) => handleFilterChange('category_name', e.target.value)}
                                    placeholder="جستجو در دسته‌بندی"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">منبع</label>
                                <input
                                    type="text"
                                    value={filters.source}
                                    onChange={(e) => handleFilterChange('source', e.target.value)}
                                    placeholder="جستجو در منبع"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">شماره سفارش</label>
                                <input
                                    type="text"
                                    value={filters.order_number}
                                    onChange={(e) => handleFilterChange('order_number', e.target.value)}
                                    placeholder="جستجو در شماره سفارش"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">توضیحات</label>
                                <input
                                    type="text"
                                    value={filters.description}
                                    onChange={(e) => handleFilterChange('description', e.target.value)}
                                    placeholder="جستجو در توضیحات"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">انبار</label>
                                <input
                                    type="text"
                                    value={filters.warehouse_name}
                                    onChange={(e) => handleFilterChange('warehouse_name', e.target.value)}
                                    placeholder="جستجو در انبار"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>

                            {/* Numeric Filters */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">تعداد (حداقل)</label>
                                <input
                                    type="number"
                                    value={filters.min_quantity}
                                    onChange={(e) => handleFilterChange('min_quantity', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">تعداد (حداکثر)</label>
                                <input
                                    type="number"
                                    value={filters.max_quantity}
                                    onChange={(e) => handleFilterChange('max_quantity', e.target.value)}
                                    placeholder="999"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">قیمت خرید CNY (حداقل)</label>
                                <input
                                    type="number"
                                    value={filters.min_cny_price}
                                    onChange={(e) => handleFilterChange('min_cny_price', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">قیمت خرید CNY (حداکثر)</label>
                                <input
                                    type="number"
                                    value={filters.max_cny_price}
                                    onChange={(e) => handleFilterChange('max_cny_price', e.target.value)}
                                    placeholder="9999"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">قیمت فروش USD (حداقل)</label>
                                <input
                                    type="number"
                                    value={filters.min_usd_price}
                                    onChange={(e) => handleFilterChange('min_usd_price', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">قیمت فروش USD (حداکثر)</label>
                                <input
                                    type="number"
                                    value={filters.max_usd_price}
                                    onChange={(e) => handleFilterChange('max_usd_price', e.target.value)}
                                    placeholder="9999"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">موجودی (حداقل)</label>
                                <input
                                    type="number"
                                    value={filters.min_stock}
                                    onChange={(e) => handleFilterChange('min_stock', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">موجودی (حداکثر)</label>
                                <input
                                    type="number"
                                    value={filters.max_stock}
                                    onChange={(e) => handleFilterChange('max_stock', e.target.value)}
                                    placeholder="999"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('itemCode')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('brandNamed')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('specifications')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('categoryName')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('source')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('orderNumber')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('quantity')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('currentStock')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('cnyPurchasePrice')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('usdSellingPrice')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('description')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('warehouseName')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{product.item_code}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium">{product.brand_named}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.specifications}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.category_name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.source}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.order_number}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{product.quantity}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-right font-mono font-bold">{inventory[product.id] ?? 0}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{product.cny_purchase_price}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{product.usd_selling_price}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.description}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{product.warehouse_name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1 rtl:space-x-reverse">
                                    <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100"><IconEdit /></button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100"><IconTrash /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={13} className="text-center text-slate-500 py-8">
                                    {hasActiveFilters ? 'هیچ محصولی با فیلترهای انتخاب شده یافت نشد' : t('noProducts')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProduct ? t('editProduct') : t('addNewProduct')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="item_code" className="block text-sm font-medium text-slate-600 mb-1">{t('itemCode')}</label>
                        <input id="item_code" type="text" name="item_code" value={formState.item_code} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="brand_named" className="block text-sm font-medium text-slate-600 mb-1">{t('brandNamed')}</label>
                        <input id="brand_named" type="text" name="brand_named" value={formState.brand_named} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="specifications" className="block text-sm font-medium text-slate-600 mb-1">{t('specifications')}</label>
                        <input id="specifications" type="text" name="specifications" value={formState.specifications} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="category_name" className="block text-sm font-medium text-slate-600 mb-1">{t('categoryName')}</label>
                        <input id="category_name" type="text" name="category_name" value={formState.category_name} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="source" className="block text-sm font-medium text-slate-600 mb-1">{t('source')}</label>
                        <input id="source" type="text" name="source" value={formState.source} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="order_number" className="block text-sm font-medium text-slate-600 mb-1">{t('orderNumber')}</label>
                        <input id="order_number" type="text" name="order_number" value={formState.order_number} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 mb-1">{t('quantity')}</label>
                        <input id="quantity" type="number" name="quantity" value={formState.quantity} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="cny_purchase_price" className="block text-sm font-medium text-slate-600 mb-1">{t('cnyPurchasePrice')}</label>
                        <input id="cny_purchase_price" type="number" name="cny_purchase_price" value={formState.cny_purchase_price} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="usd_selling_price" className="block text-sm font-medium text-slate-600 mb-1">{t('usdSellingPrice')}</label>
                        <input id="usd_selling_price" type="number" name="usd_selling_price" value={formState.usd_selling_price} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('description')}</label>
                        <input id="description" type="text" name="description" value={formState.description} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="warehouse_name" className="block text-sm font-medium text-slate-600 mb-1">{t('warehouseName')}</label>
                        <input id="warehouse_name" type="text" name="warehouse_name" value={formState.warehouse_name} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">{t('cancelButton')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">{t('saveButton')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
