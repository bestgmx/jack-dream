import React, { useState, useMemo } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { OrderCategory, Expense, Person, Transaction, JacksExpenseCategory } from '../types.ts';
import { Modal } from './Modal.tsx';

// --- Icons --- //
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CNY', currencyDisplay: 'symbol' }).format(amount);
};

interface JackPaymentManagerProps {
    jackPerson: Person | undefined;
    jackCnyBalance: number;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    expenseCategories: JacksExpenseCategory[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<JacksExpenseCategory[]>>;
}

export const JackPaymentManager: React.FC<JackPaymentManagerProps> = ({ jackPerson, jackCnyBalance, transactions, setTransactions, expenseCategories, setExpenseCategories }) => {
    const { t } = useI18n();
    
    // --- State Management --- //
    const [newCategoryName, setNewCategoryName] = useState('');

    // Modal states
    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [isEditCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<OrderCategory | null>(null);
    const [editingCategory, setEditingCategory] = useState<OrderCategory | null>(null);

    // --- Data Derivation --- //
    const jackTransactions = useMemo(() => {
        if (!jackPerson) return [];
        return transactions.filter(
            tx => tx.entityId === jackPerson.id && tx.type === 'PaymentOut' && tx.currency === 'CNY'
        );
    }, [transactions, jackPerson]);

    const categoriesWithExpenses: OrderCategory[] = useMemo(() => {
        return expenseCategories.map(cat => {
            const relevantExpenses: Expense[] = [];
            for (const tx of jackTransactions) {
                if (tx.description?.startsWith(`${cat.name}: `)) {
                    relevantExpenses.push({
                        id: tx.id, // Use transaction ID as expense ID
                        date: tx.date,
                        description: tx.description.substring(cat.name.length + 2), // Extract original description
                        amount: tx.amount,
                    });
                }
            }
            const totalSpent = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            return {
                id: cat.id,
                name: cat.name,
                expenses: relevantExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                totalSpent,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [expenseCategories, jackTransactions]);
    
    // --- Handlers --- //
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            const newCategory = {
                id: Date.now().toString(),
                name: newCategoryName.trim(),
            };
            setExpenseCategories(prev => [newCategory, ...prev]);
            setNewCategoryName('');
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (!window.confirm(t('deleteConfirmation'))) return;
        if (!jackPerson) return;

        const categoryToDelete = expenseCategories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        const txIdsToDelete = transactions
            .filter(tx => 
                tx.entityId === jackPerson.id &&
                tx.type === 'PaymentOut' &&
                tx.currency === 'CNY' &&
                tx.description?.startsWith(`${categoryToDelete.name}: `)
            )
            .map(tx => tx.id);
        
        if (txIdsToDelete.length > 0 && !window.confirm(`This will also delete ${txIdsToDelete.length} associated expense entries. Are you sure?`)) return;

        setTransactions(prevTxs => prevTxs.filter(tx => !txIdsToDelete.includes(tx.id)));
        setExpenseCategories(prevCats => prevCats.filter(c => c.id !== categoryId));
    };
    
    const handleSaveCategoryEdit = (newName: string) => {
        if (!editingCategory || !jackPerson) return;
        const oldName = editingCategory.name;
        if(oldName === newName.trim()) {
            setEditCategoryModalOpen(false);
            setEditingCategory(null);
            return;
        }

        setTransactions(prevTxs => prevTxs.map(tx => {
            if (tx.entityId === jackPerson.id && tx.type === 'PaymentOut' && tx.currency === 'CNY' && tx.description?.startsWith(`${oldName}: `)) {
                const originalDescription = tx.description.substring(oldName.length + 2);
                return { ...tx, description: `${newName}: ${originalDescription}` };
            }
            return tx;
        }));
        
        setExpenseCategories(prev => prev.map(c => 
            c.id === editingCategory.id ? { ...c, name: newName } : c
        ));
        
        setEditCategoryModalOpen(false);
        setEditingCategory(null);
    };
    
    const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
        if (!selectedCategory || !jackPerson) return;
        
        const newTransaction: Transaction = {
            id: Date.now().toString(),
            date: expense.date,
            type: 'PaymentOut',
            amount: expense.amount,
            currency: 'CNY',
            description: `${selectedCategory.name}: ${expense.description}`,
            entityId: jackPerson.id,
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        // After adding, we need to refresh the selected category view in the modal
        const updatedCategory = categoriesWithExpenses.find(c => c.id === selectedCategory.id);
        if(updatedCategory) {
            const newExpense: Expense = { ...expense, id: newTransaction.id };
            const updatedExpenses = [newExpense, ...updatedCategory.expenses];
            const newTotal = updatedExpenses.reduce((sum, ex) => sum + ex.amount, 0);
            setSelectedCategory({ ...updatedCategory, expenses: updatedExpenses, totalSpent: newTotal });
        }
    };
    
    const handleDeleteExpense = (expenseId: string) => { // expenseId is a transactionId
        if (!selectedCategory || !window.confirm(t('deleteConfirmation'))) return;
        setTransactions(prev => prev.filter(tx => tx.id !== expenseId));

        // After deleting, we need to refresh the selected category view in the modal
        const updatedExpenses = selectedCategory.expenses.filter(ex => ex.id !== expenseId);
        const newTotal = updatedExpenses.reduce((sum, ex) => sum + ex.amount, 0);
        setSelectedCategory({...selectedCategory, expenses: updatedExpenses, totalSpent: newTotal});
    };

    if (!jackPerson) {
        return (
             <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200/80 flex justify-center items-center">
                <p className="text-slate-600 font-medium">"Jack" user not found. Cannot manage payments.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Balance Header */}
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-200/80 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-700">{t('jacksBalance')}</h2>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">{formatCurrency(jackCnyBalance)}</span>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Category Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                    <h3 className="font-bold text-slate-800 text-xl mb-4">{t('addCategoryCardTitle')}</h3>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium text-slate-600 mb-1">{t('categoryNameLabel')}</label>
                            <input
                                id="category-name"
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('categoryNamePlaceholder')}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <button type="submit" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm hover:scale-105 transition-transform">
                            <IconPlus />
                            <span>{t('createCategoryButton')}</span>
                        </button>
                    </form>
                </div>

                {/* Existing Categories Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
                     <h3 className="font-bold text-slate-800 text-xl mb-4">{t('existingCategoriesCardTitle')}</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {categoriesWithExpenses.length > 0 ? categoriesWithExpenses.map(cat => (
                            <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800">{cat.name}</p>
                                        <p className="text-sm text-slate-500">{t('totalSpent')}: <span className="font-medium text-red-600">{formatCurrency(cat.totalSpent)}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                setEditingCategory(cat);
                                                setEditCategoryModalOpen(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition-colors"
                                        ><IconEdit /></button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition-colors"><IconTrash /></button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const fullCategoryData = categoriesWithExpenses.find(c => c.id === cat.id);
                                        setSelectedCategory(fullCategoryData || cat);
                                        setExpenseModalOpen(true);
                                    }}
                                    className="mt-2 w-full text-center text-sm font-semibold text-teal-600 hover:text-teal-700 py-1.5 rounded-md bg-teal-50 hover:bg-teal-100 transition"
                                >{t('viewExpensesButton')}</button>
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 py-4">{t('noCategories')}</p>
                        )}
                     </div>
                </div>
            </div>

            {/* Expenses Modal */}
            {selectedCategory && (
                <Modal
                    isOpen={isExpenseModalOpen}
                    onClose={() => setExpenseModalOpen(false)}
                    title={`${t('expensesFor')} ${selectedCategory.name}`}
                    size="xl"
                >
                   <ExpenseManager 
                        category={selectedCategory}
                        onAddExpense={handleAddExpense}
                        onDeleteExpense={handleDeleteExpense}
                   />
                </Modal>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <Modal
                    isOpen={isEditCategoryModalOpen}
                    onClose={() => setEditCategoryModalOpen(false)}
                    title={t('editCategoryModalTitle')}
                    size="sm"
                >
                    <EditCategoryForm category={editingCategory} onSave={handleSaveCategoryEdit} />
                </Modal>
            )}
        </div>
    );
};

// --- Sub-components for Modals --- //

const ExpenseManager: React.FC<{ category: OrderCategory; onAddExpense: (expense: Omit<Expense, 'id'>) => void; onDeleteExpense: (expenseId: string) => void; }> = ({ category, onAddExpense, onDeleteExpense }) => {
    const { t } = useI18n();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim() && amount) {
            onAddExpense({
                date,
                description: description.trim(),
                amount: parseFloat(amount)
            });
            // Reset form
            setDescription('');
            setAmount('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Expense Form */}
            <div>
                 <h4 className="font-bold text-slate-800 text-lg mb-4">{t('addExpenseCardTitle')}</h4>
                 <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="expenseDate" className="block text-sm font-medium text-slate-600 mb-1">{t('expenseDateLabel')}</label>
                        <input id="expenseDate" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="expenseDescription" className="block text-sm font-medium text-slate-600 mb-1">{t('expenseDescriptionLabel')}</label>
                        <input id="expenseDescription" type="text" placeholder={t('expenseDescriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                    </div>
                    <div>
                        <label htmlFor="expenseAmount" className="block text-sm font-medium text-slate-600 mb-1">{t('expenseAmountLabel')}</label>
                        <input id="expenseAmount" type="number" placeholder="0.00" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"/>
                    </div>
                     <div className="md:col-span-2">
                        <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm">
                            <IconPlus /> {t('addExpenseButton')}
                        </button>
                    </div>
                 </form>
            </div>
            
            {/* Expense History */}
            <div>
                 <h4 className="font-bold text-slate-800 text-lg mb-4">{t('expenseHistoryTitle')}</h4>
                 <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dateColumn')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('descriptionColumn')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('amountColumn')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('actionsColumn')}</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-slate-200">
                             {category.expenses.length > 0 ? category.expenses.map(exp => (
                                 <tr key={exp.id}>
                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{exp.date}</td>
                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium">{exp.description}</td>
                                     <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatCurrency(exp.amount)}</td>
                                     <td className="px-4 py-3 whitespace-nowrap text-right">
                                         <button onClick={() => onDeleteExpense(exp.id)} className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100"><IconTrash /></button>
                                     </td>
                                 </tr>
                             )) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-slate-500 py-6">{t('noExpenses')}</td>
                                </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};

const EditCategoryForm: React.FC<{category: OrderCategory, onSave: (newName: string) => void}> = ({ category, onSave }) => {
    const { t } = useI18n();
    const [name, setName] = useState(category.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="editCategoryName" className="block text-sm font-medium text-slate-600 mb-1">{t('categoryNameLabel')}</label>
                <input
                    id="editCategoryName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    autoFocus
                />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-sm">
                {t('saveButton')}
            </button>
        </form>
    );
};