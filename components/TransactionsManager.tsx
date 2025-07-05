import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { Transaction, TransactionType, Currency, Person } from '../types.ts';
import { Modal } from './Modal.tsx';

// --- Icons ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;

interface TransactionsManagerProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    persons: Person[];
    currencies: Currency[];
}

// Utility to format numbers with commas
function formatNumberWithCommas(value: string | number) {
    if (value === null || value === undefined) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}

export const TransactionsManager: React.FC<TransactionsManagerProps> = ({ transactions, setTransactions, persons, currencies }) => {
    const { t } = useI18n();
    
    // --- State ---
    const initialFormState: Partial<Transaction> = {
        date: new Date().toISOString().split('T')[0],
        type: undefined,
        amount: 0,
        currency: 'USD',
        rate: 1,
    };
    // Form State
    const [formState, setFormState] = useState<Partial<Transaction>>(initialFormState);
    
    // Filter State
    const [filters, setFilters] = useState({
        type: '',
        currency: '',
        person: '',
        dateFrom: '',
        dateTo: '',
    });
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editFormState, setEditFormState] = useState<Transaction | null>(null);

    // Add a display state for formatted amount
    const [amountDisplay, setAmountDisplay] = useState('');

    useEffect(() => {
        if (editingTransaction) {
            setEditFormState(editingTransaction);
        } else {
            setEditFormState(null);
        }
    }, [editingTransaction]);

    // Update amountDisplay when formState.amount changes (for reset)
    useEffect(() => {
        if (!formState.amount) setAmountDisplay('');
    }, [formState.amount]);

    // --- Memos ---
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(tx => {
                if (filters.type && tx.type !== filters.type) return false;
                if (filters.currency && tx.currency !== filters.currency) return false;
                if (filters.dateFrom && tx.date < filters.dateFrom) return false;
                if (filters.dateTo && tx.date > filters.dateTo) return false;
                if (filters.person) {
                    const personId = parseInt(filters.person, 10);
                    if (tx.entityId !== personId && tx.fromEntityId !== personId && tx.toEntityId !== personId) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filters]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredTransactions.length / itemsPerPage);
    }, [filteredTransactions, itemsPerPage]);

    // --- Handlers ---
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!editFormState) return;
        const { name, value } = e.target;
        setEditFormState(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
        setCurrentPage(1); // Reset to first page on filter change
    };
    
    const clearFilters = () => {
        setFilters({ type: '', currency: '', person: '', dateFrom: '', dateTo: '' });
        setCurrentPage(1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            date: formState.date || new Date().toISOString().split('T')[0],
            type: formState.type as TransactionType,
            amount: Number(formState.amount),
            currency: formState.currency as Currency['code'],
            description: formState.description || '',
            entityId: formState.entityId ? Number(formState.entityId) : undefined,
            fromEntityId: formState.fromEntityId ? Number(formState.fromEntityId) : undefined,
            toEntityId: formState.toEntityId ? Number(formState.toEntityId) : undefined,
            rate: formState.rate ? Number(formState.rate) : undefined,
            toCurrency: formState.toCurrency as Currency['code'],
        };
        setTransactions(prev => [newTransaction, ...prev]);
        setFormState(initialFormState);
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm(t('deleteConfirmation'))) {
            setTransactions(prev => prev.filter(tx => tx.id !== id));
        }
    };
    
    const handleSaveEdit = () => {
        if(editFormState) {
            const updatedTransaction: Transaction = {
                ...editFormState,
                amount: Number(editFormState.amount),
                rate: editFormState.rate ? Number(editFormState.rate) : undefined,
                entityId: editFormState.entityId ? Number(editFormState.entityId) : undefined,
                fromEntityId: editFormState.fromEntityId ? Number(editFormState.fromEntityId) : undefined,
                toEntityId: editFormState.toEntityId ? Number(editFormState.toEntityId) : undefined,
            };
            setTransactions(prev => prev.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx));
        }
        setEditingTransaction(null);
    }

    // Custom handler for amount input
    const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove commas and non-numeric except dot
        const raw = e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, '');
        setAmountDisplay(formatNumberWithCommas(raw));
        setFormState(prev => ({ ...prev, amount: raw === '' ? undefined : Number(raw) }));
    };

    const renderFormFields = (state: Partial<Transaction>, handleChange: any) => {
        const type = state.type;
        return (
            <>
                {(type === 'PaymentIn' || type === 'PaymentOut' || type === 'Conversion') && (
                     <div>
                        <label htmlFor="entityId" className="block text-sm font-medium text-slate-600 mb-1">{t('personAccountLabel')}</label>
                        <select id="entityId" name="entityId" value={state.entityId || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="">{t('selectPersonAccount')}</option>
                            {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                 {type === 'InternalTransfer' && (
                    <>
                         <div>
                            <label htmlFor="fromEntityId" className="block text-sm font-medium text-slate-600 mb-1">{t('fromEntityLabel')}</label>
                            <select id="fromEntityId" name="fromEntityId" value={state.fromEntityId || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectFromEntity')}</option>
                                {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="toEntityId" className="block text-sm font-medium text-slate-600 mb-1">{t('toEntityLabel')}</label>
                            <select id="toEntityId" name="toEntityId" value={state.toEntityId || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectToEntity')}</option>
                                {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </>
                )}
                {type === 'Conversion' && (
                    <>
                        <div>
                            <label htmlFor="rate" className="block text-sm font-medium text-slate-600 mb-1">{t('rateLabel')}</label>
                            <input id="rate" type="number" name="rate" value={state.rate || 1} onChange={handleChange} step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div>
                            <label htmlFor="toCurrency" className="block text-sm font-medium text-slate-600 mb-1">{t('toCurrencyLabel')}</label>
                            <select id="toCurrency" name="toCurrency" value={state.toCurrency || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectCurrency')}</option>
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>
                    </>
                )}
            </>
        )
    }

    return (
        <div className="space-y-8">
            {/* Form Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                <h3 className="font-bold text-slate-800 text-xl mb-4">{t('transactionFormHeading')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-600 mb-1">{t('transactionTypeLabel')}</label>
                            <select id="type" name="type" value={formState.type || ''} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectTransactionType')}</option>
                                <option value="PaymentIn">{t('typePaymentIn')}</option>
                                <option value="PaymentOut">{t('typePaymentOut')}</option>
                                <option value="Conversion">{t('typeConversion')}</option>
                                <option value="InternalTransfer">{t('typeInternalTransfer')}</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('amountLabel')}</label>
                            <input id="amount" type="text" name="amount" value={amountDisplay} onChange={handleAmountInput} required inputMode="decimal" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                         <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-slate-600 mb-1">{t('currencyLabel')}</label>
                            <select id="currency" name="currency" value={formState.currency || ''} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <option value="">{t('selectCurrency')}</option>
                                {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>
                        {renderFormFields(formState, handleFormChange)}
                        {formState.type === 'PaymentIn' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('rateLabel')}</label>
                                    <input type="number" name="rate" value={formState.rate || 1} onChange={handleFormChange} step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                </div>
                                {(formState.rate && Number(formState.rate) !== 1) &&
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('convertedAmountLabel')}</label>
                                        <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono">
                                            {new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format((formState.amount || 0) * (formState.rate || 1))} {formState.currency}
                                        </div>
                                    </div>
                                }
                            </>
                        )}
                        {formState.type === 'Conversion' && (
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">{t('convertedAmountLabel')}</label>
                                <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono">
                                    {new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format((formState.amount || 0) * (formState.rate || 1))} {formState.toCurrency}
                                </div>
                            </div>
                        )}
                         <div>
                            <label htmlFor="transactionDate" className="block text-sm font-medium text-slate-600 mb-1">{t('transactionDateLabel')}</label>
                            <input id="transactionDate" type="date" name="date" value={formState.date || ''} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">{t('descriptionLabel')}</label>
                            <textarea id="description" name="description" value={formState.description || ''} onChange={handleFormChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"></textarea>
                        </div>
                    </div>
                    <button type="submit" className="flex items-center justify-center gap-2 px-5 py-2.5 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                        <IconPlus/> {t('recordTransactionButton')}
                    </button>
                </form>
            </div>

            {/* Filter and History Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                 <h3 className="font-bold text-slate-800 text-xl mb-4">{t('filterTransactions')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"><option value="">{t('allTypes')}</option><option value="PaymentIn">{t('typePaymentIn')}</option><option value="PaymentOut">{t('typePaymentOut')}</option><option value="Conversion">{t('typeConversion')}</option><option value="InternalTransfer">{t('typeInternalTransfer')}</option></select>
                    <select name="currency" value={filters.currency} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"><option value="">{t('allCurrencies')}</option>{currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                    <select name="person" value={filters.person} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"><option value="">{t('allPersons')}</option>{persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder={t('dateFrom')} />
                    <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder={t('dateTo')} />
                </div>
                 <button onClick={clearFilters} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">{t('clearFilters')}</button>
                
                 <h3 className="font-bold text-slate-800 text-xl mt-8 mb-4">{t('transactionHistoryHeading')}</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('transactionDate')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('transactionType')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('person')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('amountColumn')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('rateLabel')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('descriptionColumn')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actionsHeader')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map(tx => {
                                    const personLookup = (id?: number) => persons.find(p => p.id === id)?.name || 'N/A';
                                    let personDisplay = '';
                                    if (tx.type === 'InternalTransfer') {
                                        personDisplay = `${personLookup(tx.fromEntityId)} → ${personLookup(tx.toEntityId)}`;
                                    } else {
                                        personDisplay = personLookup(tx.entityId);
                                    }
                                    
                                    return (
                                    <tr key={tx.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{tx.date}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium">{t(`type${tx.type}` as any)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{personDisplay}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {new Intl.NumberFormat('en-US').format(tx.amount)} {tx.currency}
                                            {tx.type === 'Conversion' && ` → ${tx.toCurrency}`}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{tx.rate !== undefined ? tx.rate : '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate">{tx.description}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1 rtl:space-x-reverse">
                                            <button onClick={() => setEditingTransaction(tx)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition-colors" aria-label={t('editButton')}><IconEdit /></button>
                                            <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100" aria-label={t('deleteButton')}><IconTrash /></button>
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center text-slate-500 py-6">{t('noTransactions')}</td>
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

            {/* Edit Modal */}
            {editingTransaction && editFormState && (
                <Modal
                    isOpen={!!editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                    title={t('editTransactionModalTitle')}
                    size="lg"
                >
                    <div className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="edit_type" className="block text-sm font-medium text-slate-600 mb-1">{t('transactionTypeLabel')}</label>
                                <select id="edit_type" name="type" value={editFormState.type || ''} onChange={handleEditFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-100" disabled>
                                    <option value="PaymentIn">{t('typePaymentIn')}</option>
                                    <option value="PaymentOut">{t('typePaymentOut')}</option>
                                    <option value="Conversion">{t('typeConversion')}</option>
                                    <option value="InternalTransfer">{t('typeInternalTransfer')}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="edit_amount" className="block text-sm font-medium text-slate-600 mb-1">{t('amountLabel')}</label>
                                <input id="edit_amount" type="number" name="amount" value={editFormState.amount || ''} onChange={handleEditFormChange} required step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label htmlFor="edit_currency" className="block text-sm font-medium text-slate-600 mb-1">{t('currencyLabel')}</label>
                                <select id="edit_currency" name="currency" value={editFormState.currency || ''} onChange={handleEditFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                                </select>
                            </div>
                            {renderFormFields(editFormState, handleEditFormChange)}
                            {editFormState.type === 'PaymentIn' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">{t('rateLabel')}</label>
                                        <input type="number" name="rate" value={editFormState.rate || 1} onChange={handleEditFormChange} step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                    </div>
                                    {(editFormState.rate && Number(editFormState.rate) !== 1) &&
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-1">{t('convertedAmountLabel')}</label>
                                            <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono">
                                                {new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format((editFormState.amount || 0) * (editFormState.rate || 1))} {editFormState.currency}
                                            </div>
                                        </div>
                                    }
                                </>
                            )}
                            {editFormState.type === 'Conversion' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">{t('convertedAmountLabel')}</label>
                                    <div className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono">
                                        {new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format((editFormState.amount || 0) * (editFormState.rate || 1))} {editFormState.toCurrency}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label htmlFor="edit_transactionDate" className="block text-sm font-medium text-slate-600 mb-1">{t('transactionDateLabel')}</label>
                                <input id="edit_transactionDate" type="date" name="date" value={editFormState.date || ''} onChange={handleEditFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label htmlFor="edit_description" className="block text-sm font-medium text-slate-600 mb-1">{t('descriptionLabel')}</label>
                                <textarea id="edit_description" name="description" value={editFormState.description || ''} onChange={handleEditFormChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                             <button type="button" onClick={() => setEditingTransaction(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
                                 {t('cancelButton')}
                             </button>
                             <button type="button" onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition">
                                 {t('saveButton')}
                             </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
