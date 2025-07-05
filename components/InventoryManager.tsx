import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useI18n } from '../hooks/useI18n.ts';
import { Product, Inventory } from '../types.ts';
import { Modal } from './Modal.tsx';

const IconUpload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;

interface InventoryManagerProps {
    inventory: Inventory;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
    currentStock: Inventory;
    products: Product[];
}

interface UploadAnalysis {
    newItems: Array<{
        item_code: string;
        brand_named: string;
        specifications: string;
        category_name: string;
        source: string;
        order_number: string;
        quantity: number;
        current_stock: number;
        cny_purchase_price: number;
        usd_selling_price: number;
        description: string;
        warehouse_name: string;
    }>;
    updatedItems: Array<{
        item_code: string;
        oldQuantity: number;
        newQuantity: number;
        change: number;
    }>;
    skippedItems: Array<{
        item_code: string;
        reason: string;
    }>;
    totalNewItems: number;
    totalUpdatedItems: number;
    totalSkippedItems: number;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, setInventory, currentStock, products }) => {
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newQuantity, setNewQuantity] = useState(0);
    const [formState, setFormState] = useState({
        item_code: '',
        brand_named: '',
        specifications: '',
        category_name: '',
        source: '',
        order_number: '',
        quantity: '',
        cny_purchase_price: '',
        usd_selling_price: '',
        description: '',
        warehouse_name: ''
    });
    const [uploadAnalysis, setUploadAnalysis] = useState<UploadAnalysis | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const getKey = (keys: Record<string, string>, ...variants: string[]) => {
        for (const variant of variants) {
            if (keys[variant.toLowerCase()]) {
                return keys[variant.toLowerCase()];
            }
        }
        return null;
    };

    const showUploadResults = (analysis: UploadAnalysis) => {
        setUploadAnalysis(analysis);
        setShowAnalysis(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            alert('لطفاً یک فایل اکسل معتبر (.xlsx یا .xls) انتخاب کنید');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('حجم فایل نباید بیشتر از 10 مگابایت باشد');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
                
                const newInventory = { ...inventory };
                const analysis: UploadAnalysis = {
                    newItems: [],
                    updatedItems: [],
                    skippedItems: [],
                    totalNewItems: 0,
                    totalUpdatedItems: 0,
                    totalSkippedItems: 0
                };

                const productMap = new Map(products.map(p => [p.item_code, p.id]));
                const existingItemCodes = new Set(products.map(p => p.item_code));
                const processedItemCodes = new Set<string>(); // Track duplicates within the file
                const newProductsToAdd: Product[] = [];

                worksheet.forEach((row: any, index: number) => {
                    // Case-insensitive keys
                    const keys = Object.keys(row).reduce((acc, key) => {
                        acc[key.toLowerCase()] = key;
                        return acc;
                    }, {} as Record<string, string>);
                    
                    const itemCodeKey = getKey(keys, 'item_code', 'sku_code', 'sku', 'itemCode', 'SKU_code', 'SKU');
                    const quantityKey = getKey(keys, 'quantity', 'Quantity');
                    const currentStockKey = getKey(keys, 'current_stock', 'currentStock', 'Current Stock', 'current stock');
                    
                    if (!itemCodeKey) {
                        analysis.skippedItems.push({
                            item_code: `Row ${index + 1}`,
                            reason: 'Item code column not found'
                        });
                        analysis.totalSkippedItems++;
                        return;
                    }
                    
                    const item_code = row[itemCodeKey];
                    if (!item_code || item_code.toString().trim() === '') {
                        analysis.skippedItems.push({
                            item_code: `Row ${index + 1}`,
                            reason: 'Empty item code'
                        });
                        analysis.totalSkippedItems++;
                        return;
                    }

                    const itemCodeStr = item_code.toString().trim();
                    
                    // Check for duplicates within the uploaded file
                    if (processedItemCodes.has(itemCodeStr)) {
                        analysis.skippedItems.push({
                            item_code: itemCodeStr,
                            reason: 'Duplicate item code in uploaded file'
                        });
                        analysis.totalSkippedItems++;
                        return;
                    }
                    processedItemCodes.add(itemCodeStr);
                    
                    let quantity = 0;
                    let currentStock = 0;
                    
                    // Try to get quantity from current_stock first, then quantity
                    if (currentStockKey) {
                        let stockValue = row[currentStockKey];
                        if (typeof stockValue === 'string') stockValue = stockValue.replace(/,/g, '').trim();
                        currentStock = Number(stockValue) || 0;
                        quantity = currentStock;
                    } else if (quantityKey) {
                        let quantityValue = row[quantityKey];
                        if (typeof quantityValue === 'string') quantityValue = quantityValue.replace(/,/g, '').trim();
                        quantity = Number(quantityValue) || 0;
                        currentStock = quantity;
                    }
                    
                    if (typeof quantity !== 'number' || isNaN(quantity) || quantity < 0) {
                        analysis.skippedItems.push({
                            item_code: item_code.toString(),
                            reason: 'Invalid quantity value'
                        });
                        analysis.totalSkippedItems++;
                        return;
                    }
                    
                    const productId = productMap.get(itemCodeStr);
                    if (productId) {
                        // Check if this item already has initial inventory
                        const existingInitialInventory = inventory[productId] || 0;
                        
                        if (existingInitialInventory > 0) {
                            // Item exists and has initial inventory - skip it
                            analysis.skippedItems.push({
                                item_code: itemCodeStr,
                                reason: 'کد کالا از قبل موجودی اولیه دارد'
                            });
                            analysis.totalSkippedItems++;
                            return;
                        } else {
                            // Existing item but no initial inventory - update it
                            const oldQuantity = newInventory[productId] || 0;
                            const change = quantity - oldQuantity;
                            
                            if (currentStockKey) {
                                // If current_stock is provided, use it directly
                                newInventory[productId] = currentStock;
                            } else {
                                // Add to existing quantity
                                newInventory[productId] = oldQuantity + quantity;
                            }
                            
                            analysis.updatedItems.push({
                                item_code: itemCodeStr,
                                oldQuantity,
                                newQuantity: newInventory[productId],
                                change: newInventory[productId] - oldQuantity
                            });
                            analysis.totalUpdatedItems++;
                        }
                    } else {
                        // New item - create product and add to inventory
                        const newProduct: Product = {
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            item_code: itemCodeStr,
                            brand_named: row[getKey(keys, 'brand_named', 'brand-named', 'brandNamed', 'Brand Name') || ''] || '',
                            specifications: row[getKey(keys, 'specifications', 'Specifications') || ''] || '',
                            category_name: row[getKey(keys, 'category_name', 'category name', 'categoryName', 'Category Name') || ''] || '',
                            source: row[getKey(keys, 'source', 'Source') || ''] || '',
                            order_number: row[getKey(keys, 'order_number', 'order number', 'orderNumber', 'Order Number') || ''] || '',
                            quantity: quantity,
                            cny_purchase_price: Number(row[getKey(keys, 'cny_purchase_price', 'cnyPurchasePrice', 'CNY_purchase_price', 'CNY Purchase Price') || '']) || 0,
                            usd_selling_price: Number(row[getKey(keys, 'usd_selling_price', 'usdSellingPrice', 'USD_selling_price', 'USD Selling Price') || '']) || 0,
                            description: row[getKey(keys, 'description', 'Description') || ''] || '',
                            warehouse_name: row[getKey(keys, 'warehouse_name', 'warehouse name', 'warehouseName', 'Warehouse Name') || ''] || '',
                        };
                        
                        newProductsToAdd.push(newProduct);
                        newInventory[newProduct.id] = currentStock;
                        
                        analysis.newItems.push({
                            item_code: itemCodeStr,
                            brand_named: newProduct.brand_named || '',
                            specifications: newProduct.specifications || '',
                            category_name: newProduct.category_name || '',
                            source: newProduct.source || '',
                            order_number: newProduct.order_number || '',
                            quantity: newProduct.quantity || 0,
                            current_stock: currentStock,
                            cny_purchase_price: newProduct.cny_purchase_price || 0,
                            usd_selling_price: newProduct.usd_selling_price || 0,
                            description: newProduct.description || '',
                            warehouse_name: newProduct.warehouse_name || ''
                        });
                        analysis.totalNewItems++;
                    }
                });
                
                // Add all new products to the products array at once
                products.push(...newProductsToAdd);
                
                setInventory(newInventory);
                showUploadResults(analysis);
                
            } catch (error) {
                console.error("Error processing Excel file", error);
                alert(t('excelUploadError'));
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const templateData = products.length > 0 ? products.map(p => ({
            item_code: p.item_code,
            brand_named: p.brand_named || '',
            specifications: p.specifications || '',
            category_name: p.category_name || '',
            source: p.source || '',
            order_number: p.order_number || '',
            quantity: inventory[p.id] || 0,
            current_stock: currentStock[p.id] || 0,
            cny_purchase_price: p.cny_purchase_price || '',
            usd_selling_price: p.usd_selling_price || '',
            description: p.description || '',
            warehouse_name: p.warehouse_name || ''
        })) : [
            {
                item_code: 'HW-001',
                brand_named: 'Sample Brand',
                specifications: 'Sample Specs',
                category_name: 'Sample Category',
                source: 'Sample Source',
                order_number: 'ORD-001',
                quantity: 100,
                current_stock: 100,
                cny_purchase_price: 10,
                usd_selling_price: 15,
                description: 'Sample Description',
                warehouse_name: 'Sample Warehouse'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        XLSX.writeFile(workbook, 'inventory_template.xlsx');
    };

    const downloadCurrentInventory = () => {
        const currentData = products.map(p => ({
            item_code: p.item_code,
            brand_named: p.brand_named || '',
            specifications: p.specifications || '',
            category_name: p.category_name || '',
            source: p.source || '',
            order_number: p.order_number || '',
            quantity: inventory[p.id] || 0,
            current_stock: currentStock[p.id] || 0,
            cny_purchase_price: p.cny_purchase_price || '',
            usd_selling_price: p.usd_selling_price || '',
            description: p.description || '',
            warehouse_name: p.warehouse_name || ''
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(currentData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Inventory');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
        const filename = `inventory_${dateStr}_${timeStr}.xlsx`;
        
        XLSX.writeFile(workbook, filename);
    };
    
    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setNewQuantity(inventory[product.id] || 0);
        setIsModalOpen(true);
    };

    const handleUpdateQuantity = () => {
        if (editingProduct) {
            setInventory(prev => ({...prev, [editingProduct.id]: newQuantity}));
            setIsModalOpen(false);
            setEditingProduct(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-bold text-slate-800 text-xl">{t('updateFromExcel')}</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition">
                            <IconDownload/>
                            <span>{t('downloadTemplate')}</span>
                        </button>
                        <button onClick={downloadCurrentInventory} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition">
                            <IconDownload/>
                            <span>دانلود موجودی فعلی</span>
                        </button>
                        <div>
                             <label htmlFor="excel-upload" className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                                <IconUpload/>
                                <span>{t('uploadExcelFile')}</span>
                            </label>
                            <input id="excel-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-sm text-slate-500">{t('excelUploadInstructions')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-teal-100 rounded-full"></div>
                            <span>دانلود قالب: برای آپلود موجودی جدید</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                            <span>دانلود موجودی فعلی: شامل تمام اطلاعات و موجودی فعلی</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 w-full">
                <h3 className="font-bold text-slate-800 text-xl mb-6">{t('currentStock')}</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('productSKU')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('brandName')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('specifications')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('categoryName')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('source')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('orderNumber')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('quantity')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">موجودی فعلی</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('cnyPurchasePrice')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('usdSellingPrice')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('description')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('warehouseName')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-slate-200">
                           {products.length > 0 ? products.map(product => (
                               <tr key={product.id}>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{product.item_code}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.brand_named || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.specifications || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.category_name || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.source || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.order_number || ''}</td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{inventory[product.id] || 0}</td>
                                   <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 text-right font-mono font-bold">{currentStock[product.id] || 0}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{product.cny_purchase_price || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{product.usd_selling_price || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.description || ''}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{product.warehouse_name || ''}</td>
                                   <td className="px-4 py-3 whitespace-nowrap text-right">
                                       <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100" title={t('manualStockUpdate')}>
                                            <IconEdit />
                                       </button>
                                   </td>
                               </tr>
                           )) : (
                               <tr>
                                    <td colSpan={13} className="text-center text-slate-500 py-8">{t('noInventory')}</td>
                               </tr>
                           )}
                         </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('manualStockUpdate')}
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="item_code" className="block text-sm font-medium text-slate-600 mb-1">کد کالا (item_code)</label>
                        <input id="item_code" name="item_code" type="text" value={formState.item_code || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="کد کالا" />
                    </div>
                    <div>
                        <label htmlFor="brand_named" className="block text-sm font-medium text-slate-600 mb-1">نام برند (brand_named)</label>
                        <input id="brand_named" name="brand_named" type="text" value={formState.brand_named || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="نام برند" />
                    </div>
                    <div>
                        <label htmlFor="specifications" className="block text-sm font-medium text-slate-600 mb-1">مشخصات (specifications)</label>
                        <input id="specifications" name="specifications" type="text" value={formState.specifications || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="مشخصات" />
                    </div>
                    <div>
                        <label htmlFor="category_name" className="block text-sm font-medium text-slate-600 mb-1">نام دسته‌بندی (category_name)</label>
                        <input id="category_name" name="category_name" type="text" value={formState.category_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="نام دسته‌بندی" />
                    </div>
                    <div>
                        <label htmlFor="source" className="block text-sm font-medium text-slate-600 mb-1">منبع (source)</label>
                        <input id="source" name="source" type="text" value={formState.source || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="منبع" />
                    </div>
                    <div>
                        <label htmlFor="order_number" className="block text-sm font-medium text-slate-600 mb-1">شماره سفارش (order_number)</label>
                        <input id="order_number" name="order_number" type="text" value={formState.order_number || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="شماره سفارش" />
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 mb-1">تعداد (quantity)</label>
                        <input id="quantity" name="quantity" type="number" value={formState.quantity || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="تعداد" />
                    </div>
                    <div>
                        <label htmlFor="cny_purchase_price" className="block text-sm font-medium text-slate-600 mb-1">قیمت خرید یوان (cny_purchase_price)</label>
                        <input id="cny_purchase_price" name="cny_purchase_price" type="number" value={formState.cny_purchase_price || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="قیمت خرید یوان" />
                    </div>
                    <div>
                        <label htmlFor="usd_selling_price" className="block text-sm font-medium text-slate-600 mb-1">قیمت فروش دلار (usd_selling_price)</label>
                        <input id="usd_selling_price" name="usd_selling_price" type="number" value={formState.usd_selling_price || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="قیمت فروش دلار" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">توضیحات (description)</label>
                        <input id="description" name="description" type="text" value={formState.description || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="توضیحات" />
                    </div>
                    <div>
                        <label htmlFor="warehouse_name" className="block text-sm font-medium text-slate-600 mb-1">نام انبار (warehouse_name)</label>
                        <input id="warehouse_name" name="warehouse_name" type="text" value={formState.warehouse_name || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm" placeholder="نام انبار" />
                    </div>
                     <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">{t('cancelButton')}</button>
                        <button type="button" onClick={handleUpdateQuantity} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">{t('saveButton')}</button>
                    </div>
                </div>
            </Modal>

            {/* Upload Analysis Modal */}
            <Modal
                isOpen={showAnalysis}
                onClose={() => setShowAnalysis(false)}
                title="نتایج آپلود فایل اکسل"
                size="lg"
            >
                {uploadAnalysis && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">موارد جدید</p>
                                        <p className="text-2xl font-bold text-green-600">{uploadAnalysis.totalNewItems}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold">+</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">موارد بروزرسانی شده</p>
                                        <p className="text-2xl font-bold text-blue-600">{uploadAnalysis.totalUpdatedItems}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold">↻</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-800">موارد رد شده</p>
                                        <p className="text-2xl font-bold text-orange-600">{uploadAnalysis.totalSkippedItems}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <span className="text-orange-600 font-bold">!</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* New Items */}
                        {uploadAnalysis.newItems.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    موارد جدید اضافه شده
                                </h4>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {uploadAnalysis.newItems.map((item, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-800">{item.item_code}</p>
                                                        <p className="text-sm text-slate-600">{item.brand_named} - {item.specifications}</p>
                                                        <p className="text-xs text-slate-500">{item.category_name} • {item.source}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-green-600">{item.current_stock} عدد</p>
                                                        <p className="text-xs text-slate-500">موجودی فعلی</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Updated Items */}
                        {uploadAnalysis.updatedItems.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    موارد بروزرسانی شده
                                </h4>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {uploadAnalysis.updatedItems.map((item, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{item.item_code}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-slate-500">{item.oldQuantity} →</span>
                                                            <span className="font-bold text-blue-600">{item.newQuantity}</span>
                                                            <span className={`text-sm font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                ({item.change >= 0 ? '+' : ''}{item.change})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Skipped Items */}
                        {uploadAnalysis.skippedItems.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    موارد رد شده
                                </h4>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="space-y-2">
                                        {uploadAnalysis.skippedItems.map((item, index) => (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-orange-100">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{item.item_code}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm text-orange-600 font-medium">{item.reason}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                            <div className="text-sm text-slate-500">
                                <p>تعداد کل ردیف‌های پردازش شده: {uploadAnalysis.totalNewItems + uploadAnalysis.totalUpdatedItems + uploadAnalysis.totalSkippedItems}</p>
                                <p>تعداد ردیف‌های موفق: {uploadAnalysis.totalNewItems + uploadAnalysis.totalUpdatedItems}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        // Export analysis to Excel
                                        const analysisData = {
                                            summary: [
                                                { metric: 'موارد جدید', count: uploadAnalysis.totalNewItems },
                                                { metric: 'موارد بروزرسانی شده', count: uploadAnalysis.totalUpdatedItems },
                                                { metric: 'موارد رد شده', count: uploadAnalysis.totalSkippedItems }
                                            ],
                                            newItems: uploadAnalysis.newItems,
                                            updatedItems: uploadAnalysis.updatedItems,
                                            skippedItems: uploadAnalysis.skippedItems
                                        };
                                        
                                        const workbook = XLSX.utils.book_new();
                                        
                                        // Summary sheet
                                        const summarySheet = XLSX.utils.json_to_sheet(analysisData.summary);
                                        XLSX.utils.book_append_sheet(workbook, summarySheet, 'خلاصه');
                                        
                                        // New items sheet
                                        if (uploadAnalysis.newItems.length > 0) {
                                            const newItemsSheet = XLSX.utils.json_to_sheet(uploadAnalysis.newItems);
                                            XLSX.utils.book_append_sheet(workbook, newItemsSheet, 'موارد جدید');
                                        }
                                        
                                        // Updated items sheet
                                        if (uploadAnalysis.updatedItems.length > 0) {
                                            const updatedItemsSheet = XLSX.utils.json_to_sheet(uploadAnalysis.updatedItems);
                                            XLSX.utils.book_append_sheet(workbook, updatedItemsSheet, 'موارد بروزرسانی شده');
                                        }
                                        
                                        // Skipped items sheet
                                        if (uploadAnalysis.skippedItems.length > 0) {
                                            const skippedItemsSheet = XLSX.utils.json_to_sheet(uploadAnalysis.skippedItems);
                                            XLSX.utils.book_append_sheet(workbook, skippedItemsSheet, 'موارد رد شده');
                                        }
                                        
                                        const now = new Date();
                                        const dateStr = now.toISOString().split('T')[0];
                                        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
                                        XLSX.writeFile(workbook, `upload_analysis_${dateStr}_${timeStr}.xlsx`);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
                                >
                                    <IconDownload/>
                                    <span>دانلود گزارش</span>
                                </button>
                                <button
                                    onClick={() => setShowAnalysis(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

