import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useI18n } from '../hooks/useI18n.ts';
import { Invoice, InvoiceItem, Product, Person, Inventory, Transaction } from '../types.ts';
import { Modal } from '../components/Modal';

const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;


interface InvoicingManagerProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    inventory: Inventory;
    setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
    currentStock: Inventory;
products: Product[];
    persons: Person[];
    addTransaction: (transaction: Transaction) => void;
}

const initialInvoiceState = {
    personId: 0,
    date: new Date().toISOString().split('T')[0],
    currency: 'USD' as 'USD' | 'IRT',
    items: Array(5).fill(0).map(() => ({ productId: '', quantity: 1, unitPrice: undefined, productName: '' })),
};

const logoUrl = '/logo-screenkala.png'; // Place the image in public folder as logo-screenkala.png

// SearchableSelect Component
interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { id: string; label: string }[];
    placeholder: string;
    className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    className = "" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options.slice(0, 10);
        const search = searchTerm.toLowerCase();
        return options.filter(opt => 
            opt.label.toLowerCase().includes(search)
        ).slice(0, 10);
    }, [options, searchTerm]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredOptions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                inputRef.current?.focus();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => 
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    onChange(filteredOptions[highlightedIndex].id);
                    setIsOpen(false);
                    setSearchTerm('');
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    const handleOptionClick = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputClick = () => {
        if (!isOpen) {
            setIsOpen(true);
            inputRef.current?.focus();
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? searchTerm : (selectedOption?.label || '')}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onClick={handleInputClick}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    readOnly={!isOpen}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.id}
                                onClick={() => handleOptionClick(option.id)}
                                className={`px-3 py-2 cursor-pointer text-sm hover:bg-slate-100 transition-colors ${
                                    index === highlightedIndex ? 'bg-slate-100' : ''
                                } ${option.id === value ? 'bg-teal-50 text-teal-700 font-medium' : ''}`}
                            >
                                <span dangerouslySetInnerHTML={{
                                    __html: searchTerm ? 
                                        option.label.replace(
                                            new RegExp(`(${searchTerm})`, 'gi'),
                                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                        ) : 
                                        option.label
                                }} />
                                {option.id === value && (
                                    <span className="ml-2 text-teal-600">✓</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-sm text-slate-500 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                هیچ محصولی یافت نشد
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const InvoicingManager: React.FC<InvoicingManagerProps> = ({ invoices, setInvoices, inventory, setInventory, currentStock, products, persons, addTransaction }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');
    const [formState, setFormState] = useState<{
        personId: number;
        date: string;
        currency: 'USD' | 'IRT';
        items: Partial<InvoiceItem>[];
    }>(initialInvoiceState);
    
    const totalAmount = useMemo(() => {
        return formState.items.reduce((acc, item) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return acc + itemTotal;
        }, 0);
    }, [formState.items]);


    const [discount, setDiscount] = useState(0);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formState.items];
        const item = { ...newItems[index] };
        (item as any)[field] = value;

        if (field === 'productId') {
            const product = products.find(p => p.id === (value || ''));
            if(product) {
                item.unitPrice = formState.currency === 'USD' ? product.usd_selling_price : product.cny_purchase_price;
                item.productName = product.specifications;
            } else {
                item.unitPrice = undefined;
                item.productName = undefined;
            }
        }
        
        if (field === 'quantity') {
             (item as any)[field] = parseInt(value, 10) || 0;
        }

        newItems[index] = item;
        setFormState(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormState(prev => ({ ...prev, items: [...prev.items, { productId: '', quantity: 1 }] }));
    };
    
    const removeItem = (index: number) => {
        setFormState(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };
    
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value as 'USD' | 'IRT';
        const newItems = formState.items.map(item => {
            if (!item.productId) return item;
            const product = products.find(p => p.id === item.productId);
            if(product) {
                 return {...item, unitPrice: newCurrency === 'USD' ? product.usd_selling_price : product.cny_purchase_price };
            }
            return item;
        });
        setFormState(prev => ({ ...prev, currency: newCurrency, items: newItems as Partial<InvoiceItem>[] }));
    };

    const handleSaveInvoice = () => {
        if (!formState.personId || formState.items.length === 0) {
            alert("Please select a customer and add at least one item.");
            return;
        }

        const completeItems = formState.items
            .filter(item => item.productId && item.quantity && item.unitPrice !== undefined && item.productName)
            .map(item => item as InvoiceItem);
        
        if (completeItems.length !== formState.items.length) {
            alert("Please ensure all invoice items are complete before saving.");
            return;
        }

        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNumber: `INV-${String(invoices.length + 1).padStart(4, '0')}`,
            personId: formState.personId,
            personName: persons.find(p => p.id === formState.personId)?.name || '',
            date: formState.date,
            currency: formState.currency,
            items: completeItems,
            totalAmount: totalAmount - discount,
            discount: discount,
        };

        // Check stock availability using calculated current stock
        let canFulfill = true;
        newInvoice.items.forEach(item => {
            const availableStock = currentStock[item.productId] || 0;
            if(availableStock < item.quantity) {
                canFulfill = false;
                alert(`Not enough stock for ${item.productName}. Required: ${item.quantity}, Available: ${availableStock}`);
            }
        });

        if (!canFulfill) return;

        // Note: Inventory is now calculated automatically based on invoices
        // No need to manually update inventory here
        setInvoices(prev => [newInvoice, ...prev]);

        // Create and add the PaymentOut transaction
        const newTransaction: Transaction = {
            id: Date.now().toString() + '-invoice', // Unique ID, maybe append '-invoice'
            date: newInvoice.date,
            type: 'PaymentOut', // This is a payment out from the person
            amount: newInvoice.totalAmount,
            currency: newInvoice.currency,
            description: `Invoice #${newInvoice.invoiceNumber}`, // Link to the invoice
            entityId: newInvoice.personId, // The person the invoice is for
        };
        addTransaction(newTransaction);

        setFormState(initialInvoiceState);
        setActiveTab('history');
        alert(t('invoiceSavedSuccess'));
    };
    
    const downloadInvoicePDF = (invoice: Invoice) => {
        const doc = new jsPDF();
        
        // Helper function to format numbers with commas
        const formatNumber = (num: number) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };
        
        // Helper function to get currency symbol
        const getCurrencySymbol = (currency: string) => {
            return currency === 'USD' ? '$' : 'تومان';
        };
        
        const currencySymbol = getCurrencySymbol(invoice.currency);
        
        // Add logo
        doc.addImage(logoUrl, 'PNG', 150, 10, 40, 30);
        
        // Beautiful colored header box
        doc.setFillColor(20, 184, 166); // Teal color
        doc.rect(10, 10, 190, 25, 'F');
        
        // Centered title
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('فاکتور فروش', 105, 22, { align: 'center' });
        
        // Date and invoice number below the title
        doc.setFontSize(12);
        doc.text(`تاریخ: ${invoice.date}`, 16, 35);
        doc.text(`شماره فاکتور: ${invoice.invoiceNumber}`, 16, 42);
        
        doc.setTextColor(0, 0, 0);
        
        // Customer and contact info
        doc.setFontSize(11);
        doc.text(`مشتری: ${invoice.personName}`, 16, 50);
        doc.text(`ارز: ${invoice.currency}`, 16, 56);
        if (invoice.discount && invoice.discount > 0) {
            doc.text(`تخفیف: ${formatNumber(invoice.discount)} ${currencySymbol}`, 16, 62);
        }
        
        // Contact info under logo
        doc.setFontSize(10);
        doc.setTextColor(54, 54, 255);
        doc.text('09189756923', 170, 50, { align: 'right' });
        doc.text('@screenkala', 170, 56, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        // Table with very light styling
        autoTable(doc, {
            startY: 70,
            head: [[
                'کالا', 'تعداد', 'قیمت واحد', 'جمع'
            ]],
            body: invoice.items.map(item => [
                item.productName,
                formatNumber(item.quantity),
                `${formatNumber(item.unitPrice)} ${currencySymbol}`,
                `${formatNumber(item.quantity * item.unitPrice)} ${currencySymbol}`
            ]),
            theme: 'plain',
            headStyles: { 
                fillColor: [240, 240, 240], // Very light gray
                textColor: [0, 0, 0], 
                fontStyle: 'bold',
                lineWidth: 0.5
            },
            bodyStyles: { 
                fillColor: [255, 255, 255],
                lineWidth: 0.2
            },
            alternateRowStyles: { 
                fillColor: [248, 248, 248] // Very light gray
            },
            styles: { 
                font: 'iran-sans', 
                fontSize: 10, 
                cellPadding: 4,
                lineWidth: 0.1
            },
            margin: { top: 5, right: 10, bottom: 5, left: 10 }
        });
        
        // Total box with currency symbol
        let finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFillColor(20, 184, 166); // Teal color
        doc.rect(120, finalY + 8, 70, 16, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(`جمع کل: ${formatNumber(invoice.totalAmount)} ${currencySymbol}`, 125, finalY + 20);
        
        // Total items count
        finalY += 25;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const totalItems = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
        doc.text(`تعداد کل اقلام: ${formatNumber(totalItems)}`, 16, finalY);
        
        // Terms and conditions
        finalY += 20;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('شرایط و قوانین:', 16, finalY);
        
        finalY += 10;
        doc.setFontSize(10);
        const terms = [
            'دستگاه به صورت روشن تحویل مشتری گردید.',
            'مشکلات نرم افزاری به عهده مشتری می باشد.',
            'ظاهر و گرید دستگاه به رویت و تایید مشتری رسید.',
            'مهلت تست سخت افزاری برای هر دستگاه از تاریخ صدور فاکتور ۱۰ روز میباشد.'
        ];
        
        terms.forEach(term => {
            finalY += 8;
            doc.text(term, 16, finalY);
        });
        
        doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    };

    const filteredProducts = useMemo(() => {
        return products;
    }, [products]);

    // Add state for modal
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editInvoiceState, setEditInvoiceState] = useState<any>(null);

    // Function to open preview
    const openPreview = (invoice: Invoice) => {
        setPreviewInvoice(invoice);
        setIsEditMode(false);
        setEditInvoiceState(null);
    };

    // Function to handle edit
    const startEditInvoice = () => {
        setIsEditMode(true);
        setEditInvoiceState({ ...previewInvoice });
    };

    // Function to save edit
    const saveEditInvoice = () => {
        if (!editInvoiceState) return;
        setInvoices(prev => prev.map(inv => inv.id === editInvoiceState.id ? editInvoiceState : inv));
        setPreviewInvoice(editInvoiceState);
        setIsEditMode(false);
    };

    // Function to delete invoice
    const deleteInvoice = (id: string) => {
        if (window.confirm('آیا از حذف فاکتور مطمئن هستید؟')) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
            setPreviewInvoice(null);
        }
    };

    // Function to print
    const printInvoice = () => {
        if (!previewInvoice) return;
        // Helper function to format numbers with commas
        const formatNumber = (num: number) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };
        // Helper function to get currency symbol
        const getCurrencySymbol = (currency: string) => {
            return currency === 'USD' ? '$' : 'تومان';
        };
        const currencySymbol = getCurrencySymbol(previewInvoice.currency);
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
          <html dir="rtl" lang="fa"><head><title>فاکتور فروش</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; background: #f8fafc; direction: rtl; text-align: right; }
            .invoice-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; max-width: 700px; margin: 32px auto; padding: 32px; border: 2px solid #e0e7ef; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .logo { width: 90px; margin-left: 16px; }
            .contact { color: #3654ff; font-size: 15px; margin-top: 8px; text-align: left; }
            .title-section { background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .invoice-info { display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; }
            .info { color: #555; font-size: 16px; margin-bottom: 4px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 24px; border: 1px solid #e5e7eb; }
            .table th { background: #f3f4f6; color: #374151; font-size: 14px; padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
            .table td { background: #fff; color: #374151; font-size: 14px; padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: center; }
            .table tr:nth-child(even) td { background: #fafafa; }
            .total { background: linear-gradient(135deg, #14b8a6, #0d9488); color: #fff; font-size: 18px; font-weight: bold; padding: 16px 20px; border-radius: 8px; margin-top: 24px; text-align: center; }
            .total-items { background: #f8fafc; color: #374151; font-size: 16px; font-weight: 600; padding: 12px 20px; border-radius: 8px; margin-top: 12px; text-align: center; border: 1px solid #e5e7eb; }
            .terms-section { margin-top: 24px; }
            .terms-section h4 { color: #374151; font-size: 16px; font-weight: 600; margin-bottom: 12px; }
            .terms-text { width: 100%; min-height: 120px; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 14px; line-height: 1.6; resize: vertical; background: #f9fafb; }
            .terms-text:focus { outline: none; border-color: #14b8a6; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1); }
            @media print { 
              body { background: white; } 
              .invoice-card { box-shadow: none; border: 1px solid #ddd; margin: 0; padding: 20px; }
              .terms-text { border: 1px solid #000; background: white; }
            }
          </style>
          </head><body>
            <div class="invoice-card">
              <div class="header">
                <img src="${logoUrl}" class="logo" />
                <div class="contact">09189756923<br/>@screenkala</div>
              </div>
                        <div class="title-section">
            <div class="title">فاکتور فروش</div>
            <div class="invoice-info">
              <span>تاریخ: ${previewInvoice.date}</span>
              <span>شماره فاکتور: ${previewInvoice.invoiceNumber}</span>
            </div>
          </div>
          <div class="info">مشتری: <b>${previewInvoice.personName}</b></div>
          <div class="info">ارز: <b>${previewInvoice.currency}</b></div>
          ${previewInvoice.discount && previewInvoice.discount > 0 ? `<div class="info">تخفیف: <b>${formatNumber(previewInvoice.discount)} ${currencySymbol}</b></div>` : ''}
          <table class="table">
            <thead><tr><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
            <tbody>
              ${previewInvoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${formatNumber(item.quantity)}</td>
                  <td>${formatNumber(item.unitPrice)} ${currencySymbol}</td>
                  <td>${formatNumber(item.quantity * item.unitPrice)} ${currencySymbol}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">جمع کل: ${formatNumber(previewInvoice.totalAmount)} ${currencySymbol}</div>
          <div class="total-items">تعداد کل اقلام: ${previewInvoice.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
          <div class="terms-section">
            <h4>شرایط و قوانین:</h4>
            <textarea class="terms-text" placeholder="شرایط فاکتور را اینجا وارد کنید...">دستگاه به صورت روشن تحویل مشتری گردید.
مشکلات نرم افزاری به عهده مشتری می باشد.
ظاهر و گرید دستگاه به رویت و تایید مشتری رسید.
مهلت تست سخت افزاری برای هر دستگاه از تاریخ صدور فاکتور ۱۰ روز میباشد.</textarea>
          </div>
            </div>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Function to open in new tab
    const openInNewTab = () => {
        if (!previewInvoice) return;
        const newTab = window.open('', '_blank');
        if (!newTab) return;
        newTab.document.write('<html><head><title>Invoice</title></head><body>' + document.getElementById('invoice-preview-content')?.innerHTML + '</body></html>');
        newTab.document.close();
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 w-full">
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        {t('invoiceHistory')}
                    </button>
                    <button onClick={() => setActiveTab('create')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'create' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                        {t('createNewInvoice')}
                    </button>
                </nav>
            </div>
            
            {activeTab === 'history' && (
                <div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoiceNumber')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('customer')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('invoiceDate')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('totalAmount')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {invoices.length > 0 ? invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono cursor-pointer underline" onClick={() => openPreview(invoice)}>{invoice.invoiceNumber}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium">{invoice.personName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{invoice.date}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{invoice.totalAmount.toFixed(2)} {invoice.currency}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm flex gap-2 justify-end">
                                            <button onClick={() => downloadInvoicePDF(invoice)} className="text-teal-600 hover:text-teal-800 p-1.5 rounded-full hover:bg-teal-100 flex items-center gap-1">Download PDF</button>
                                            <button onClick={() => { openPreview(invoice); setIsEditMode(true); setEditInvoiceState({ ...invoice }); }} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 flex items-center gap-1">Edit</button>
                                            <button onClick={() => { if(window.confirm('آیا از حذف فاکتور مطمئن هستید؟')) setInvoices(prev => prev.filter(inv => inv.id !== invoice.id)); }} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 flex items-center gap-1">Delete</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center text-slate-500 py-8">{t('noInvoices')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeTab === 'create' && (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="customer" className="block text-sm font-medium text-slate-600 mb-1">{t('customer')}</label>
                            <select id="customer" value={formState.personId} onChange={e => setFormState(p => ({...p, personId: Number(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectCustomer')}</option>
                                {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="invoiceDate" className="block text-sm font-medium text-slate-600 mb-1">{t('invoiceDate')}</label>
                            <input id="invoiceDate" type="date" value={formState.date} onChange={e => setFormState(p => ({...p, date: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                        </div>
                        <div>
                            <label htmlFor="invoiceCurrency" className="block text-sm font-medium text-slate-600 mb-1">{t('selectCurrencyForInvoice')}</label>
                            <select id="invoiceCurrency" value={formState.currency} onChange={handleCurrencyChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="USD">USD</option>
                                <option value="IRT">Toman (IRT)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                        <h4 className="font-bold text-slate-800 text-lg mb-4">{t('invoiceItems')}</h4>
                        <div className="space-y-3">
                            {/* Product search input */}

                            {formState.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-2 rounded-lg">
                                    <div className="col-span-12 md:col-span-5">
                                        <SearchableSelect
                                            value={item.productId || ''}
                                            onChange={value => handleItemChange(index, 'productId', value)}
                                            options={filteredProducts.map(p => ({ id: p.id, label: `${p.specifications} (${p.item_code})` }))}
                                            placeholder="انتخاب کالا"
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <input id={`itemQuantity_${index}`} type="number" placeholder={t('quantity')} value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"/>
                                    </div>
                                     <div className="col-span-8 md:col-span-2">
                                        <input id={`itemUnitPrice_${index}`} type="number" placeholder={t('unitPrice')} value={item.unitPrice !== undefined ? item.unitPrice : ''} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="w-full px-3 py-2 border-slate-300 rounded-lg text-sm bg-white text-right" />
                                    </div>
                                     <div className="col-span-8 md:col-span-2">
                                        <div className="w-full px-3 py-2 border-slate-300 rounded-lg text-sm bg-slate-200 text-right font-mono">
                                            {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                     <div className="col-span-4 md:col-span-1 text-right">
                                        <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200 transition">
                            <IconPlus/> {t('addItem')}
                        </button>
                    </div>

                    <div className="border-t border-slate-200 pt-4 flex flex-col items-end">
                        <div className="flex items-center gap-2 text-right">
                            <span className="text-slate-600 font-medium">تخفیف:</span>
                            <input
                                type="number"
                                value={discount}
                                onChange={e => setDiscount(Number(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="text-right mt-2">
                            <span className="text-slate-600 font-medium">{t('invoiceTotal')}:</span>
                            <span className="text-2xl font-bold text-slate-800 ml-4">{(totalAmount - discount).toFixed(2)} {formState.currency}</span>
                        </div>
                        <button onClick={handleSaveInvoice} className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                            {t('saveInvoice')}
                        </button>
                    </div>
                 </div>
            )}

            {previewInvoice && (
                <Modal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} title={isEditMode ? 'ویرایش فاکتور' : 'پیش‌نمایش فاکتور'} size="lg">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            <button onClick={() => setPreviewInvoice(null)} className="px-2 py-1 bg-slate-200 rounded">بستن</button>
                            <button onClick={printInvoice} className="px-2 py-1 bg-slate-200 rounded">چاپ</button>
                            <button onClick={openInNewTab} className="px-2 py-1 bg-slate-200 rounded">باز کردن در تب جدید</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => downloadInvoicePDF(previewInvoice)} className="px-2 py-1 bg-teal-600 text-white rounded">Download PDF</button>
                            {!isEditMode && <button onClick={startEditInvoice} className="px-2 py-1 bg-blue-600 text-white rounded">ویرایش</button>}
                            <button onClick={() => deleteInvoice(previewInvoice.id)} className="px-2 py-1 bg-red-600 text-white rounded">حذف</button>
                        </div>
                    </div>
                    <div id="invoice-preview-content">
                        {!isEditMode ? (
                            <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto border border-slate-200">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                                    <div>
                                        <div className="text-lg font-bold text-slate-800 mb-1">فاکتور #{previewInvoice.invoiceNumber}</div>
                                        <div className="text-slate-500 text-sm">تاریخ: <span className="font-medium text-slate-700">{previewInvoice.date}</span></div>
                                        <div className="text-slate-500 text-sm">مشتری: <span className="font-medium text-slate-700">{previewInvoice.personName}</span></div>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex flex-col gap-1 text-right">
                                        <div className="text-slate-500 text-sm">ارز: <span className="font-medium text-slate-700">{previewInvoice.currency}</span></div>
                                        <div className="text-slate-500 text-sm">تخفیف: <span className="font-medium text-slate-700">{previewInvoice.discount || 0}</span></div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-slate-50 rounded-lg border border-slate-200">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-slate-600 text-xs font-bold text-center border-b">کالا</th>
                                                <th className="px-4 py-2 text-slate-600 text-xs font-bold text-center border-b">تعداد</th>
                                                <th className="px-4 py-2 text-slate-600 text-xs font-bold text-center border-b">قیمت واحد</th>
                                                <th className="px-4 py-2 text-slate-600 text-xs font-bold text-center border-b">جمع</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewInvoice.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-100">
                                                    <td className="px-4 py-2 text-center text-slate-800">{item.productName}</td>
                                                    <td className="px-4 py-2 text-center text-slate-700">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-center text-slate-700">{item.unitPrice}</td>
                                                    <td className="px-4 py-2 text-center text-slate-900 font-bold">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end mt-6">
                                    <div className="bg-slate-100 rounded-lg px-6 py-3 text-lg font-bold text-slate-800 shadow border border-slate-200">
                                        جمع کل: {previewInvoice.totalAmount}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-2">
                                    <label>شخص:</label>
                                    <select value={editInvoiceState.personId} onChange={e => setEditInvoiceState((prev: any) => ({...prev, personId: Number(e.target.value)}))}>
                                        {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label>تاریخ:</label>
                                    <input type="date" value={editInvoiceState.date} onChange={e => setEditInvoiceState((prev: any) => ({...prev, date: e.target.value}))} />
                                </div>
                                <div className="mb-2">
                                    <label>تخفیف:</label>
                                    <input type="number" value={editInvoiceState.discount || 0} onChange={e => setEditInvoiceState((prev: any) => ({...prev, discount: Number(e.target.value) || 0}))} />
                                </div>
                                <div className="mb-2">
                                    <label>آیتم‌ها:</label>
                                    {editInvoiceState.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-2 mb-1">
                                            <SearchableSelect
                                                value={item.productId || ''}
                                                onChange={value => {
                                                const items = [...editInvoiceState.items];
                                                    const product = products.find(p => p.id === value);
                                                    items[idx].productId = value;
                                                    items[idx].productName = product?.specifications || '';
                                                setEditInvoiceState((prev: any) => ({...prev, items}));
                                                }}
                                                options={products.map(p => ({ id: p.id, label: `${p.specifications} (${p.item_code})` }))}
                                                placeholder="انتخاب کالا"
                                                className="flex-1"
                                            />
                                            <input type="number" placeholder="تعداد" value={item.quantity} onChange={e => {
                                                const items = [...editInvoiceState.items];
                                                items[idx].quantity = Number(e.target.value) || 0;
                                                setEditInvoiceState((prev: any) => ({...prev, items}));
                                            }} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
                                            <input type="number" placeholder="قیمت واحد" value={item.unitPrice} onChange={e => {
                                                const items = [...editInvoiceState.items];
                                                items[idx].unitPrice = Number(e.target.value) || 0;
                                                setEditInvoiceState((prev: any) => ({...prev, items}));
                                            }} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={saveEditInvoice} className="px-2 py-1 bg-green-600 text-white rounded">ذخیره تغییرات</button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
