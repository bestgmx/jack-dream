import React, { useState, useMemo } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { User, Person, Transaction, Currency, Delivery, OrderNumberCategory, Product, Inventory, Invoice, JacksExpenseCategory } from '../types.ts';
import { PersonsManager } from './PersonsManager.tsx';
import { Sidebar } from './Sidebar.tsx';
import { JackPaymentManager } from './JackPaymentManager.tsx';
import { TransactionsManager } from './TransactionsManager.tsx';
import { DeliveriesManager } from './DeliveriesManager.tsx';
import { ProductsManager } from './ProductsManager.tsx';
import { InventoryManager } from './InventoryManager.tsx';
import { InvoicingManager } from './InvoicingManager.tsx';
import { FloatingMenuButton } from './FloatingMenuButton.tsx';
import { Modal } from './Modal';

// --- Initial Data ---
const initialPersons: Person[] = [
    { id: 1, name: 'Amir' },
    { id: 2, name: 'Jack' },
    { id: 3, name: 'System Account' },
    { id: 4, name: 'Customer A' },
    { id: 5, name: 'Customer B' },
];

const initialCurrencies: Currency[] = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'IRT', name: 'Iranian Toman' },
];

const initialOrderNumberCategories: OrderNumberCategory[] = [
    { id: 'cat1', name: 'Standard Orders'},
    { id: 'cat2', name: 'Express Orders'},
];

const initialProducts: Product[] = [
    { id: 'p1', item_code: 'HW-001', specifications: 'Keyboard', cny_purchase_price: 500, usd_selling_price: 75 },
    { id: 'p2', item_code: 'HW-002', specifications: 'Mouse', cny_purchase_price: 200, usd_selling_price: 25 },
    { id: 'p3', item_code: 'SW-001', specifications: 'Office Suite License', cny_purchase_price: 3000, usd_selling_price: 299 },
];

const initialInventory: Inventory = {
    'p1': 150,
    'p2': 300,
    'p3': 1000,
};

// --- SVG Icons ---
const IconLogout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const IconCard = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 transition-shadow hover:shadow-xl">
        {children}
    </div>
);

// --- SVG Icons for buttons ---
const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{display:'inline'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const IconEyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{display:'inline'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.042-3.292m3.31-2.529A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.293 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6.364 6.364L6 18m12-12l-1.414 1.414M3 3l18 18" />
    </svg>
);
const IconExternal = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{display:'inline'}}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14m-4 0h.01" />
    </svg>
);

export type View = 'dashboard' | 'persons' | 'jack_payment' | 'transactions' | 'deliveries' | 'products' | 'inventory' | 'invoicing';

const BalancesTable: React.FC<{ balances: { personName: string, balances: Record<Currency['code'], number> }[], limit?: number }> = ({ balances, limit }) => {
    const { t } = useI18n();
    const formatBalance = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };
    // Sort: non-zero balances first, then zero balances
    const sorted = [...balances].sort((a, b) => {
        const aZero = Object.values(a.balances).every(v => v === 0);
        const bZero = Object.values(b.balances).every(v => v === 0);
        if (aZero && !bZero) return 1;
        if (!aZero && bZero) return -1;
        return 0;
    });
    const shown = limit ? sorted.slice(0, limit) : sorted;
    return (
        <IconCard>
            <h3 className="font-bold text-slate-800 text-xl mb-4 flex items-center justify-between">
                {t('balancesTitle')}
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('personNameColumn')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('usdBalanceColumn')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('cnyBalanceColumn')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tomanBalanceColumn')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {shown.length > 0 ? shown.map(({ personName, balances: personBalances }) => (
                            <tr key={personName}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium">{personName}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono ${personBalances.USD < 0 ? 'text-red-600' : 'text-slate-600'}`}>{formatBalance(personBalances.USD)}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono ${personBalances.CNY < 0 ? 'text-red-600' : 'text-slate-600'}`}>{formatBalance(personBalances.CNY)}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-mono ${personBalances.IRT < 0 ? 'text-red-600' : 'text-slate-600'}`}>{formatBalance(personBalances.IRT)}</td>
                            </tr>
                        )) : (
                           <tr>
                                <td colSpan={4} className="text-center text-slate-500 py-6">{t('noPersonsForBalance')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </IconCard>
    );
};

const AccountBalancesSummary: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const { t } = useI18n();
    const [showBalances, setShowBalances] = useState({ USD: true, CNY: true, IRT: true });
    // Calculate total balance (PaymentIn - PaymentOut) for each currency
    const totals = useMemo(() => {
        const result: Record<Currency['code'], number> = { USD: 0, CNY: 0, IRT: 0 };
        transactions.forEach(tx => {
            if (tx.type === 'PaymentIn') {
                result[tx.currency] += tx.amount;
            } else if (tx.type === 'PaymentOut') {
                result[tx.currency] -= tx.amount;
            }
        });
        return result;
    }, [transactions]);
    const format = (amount: number) => {
        const formatted = new Intl.NumberFormat('en-US', { 
            style: 'decimal', 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(Math.abs(amount));
        return amount < 0 ? `-${formatted}` : formatted;
    };
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            {showBalances.USD && (
                <div className={`flex-1 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative ${
                    totals.USD >= 0 
                        ? 'bg-gradient-to-br from-green-400 to-teal-500' 
                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                }`}>
                    <button onClick={() => setShowBalances(s => ({ ...s, USD: false }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="مخفی کردن">
                        <IconEyeOff />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('usdBalance')}</span>
                    <span className="text-2xl md:text-3xl font-bold">{format(totals.USD)} <span className="text-base font-normal">USD</span></span>
                </div>
            )}
            {!showBalances.USD && (
                <div className="flex-1 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative opacity-60">
                    <button onClick={() => setShowBalances(s => ({ ...s, USD: true }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="نمایش">
                        <IconEye />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('usdBalance')}</span>
                </div>
            )}
            {showBalances.CNY && (
                <div className={`flex-1 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative ${
                    totals.CNY >= 0 
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                }`}>
                    <button onClick={() => setShowBalances(s => ({ ...s, CNY: false }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="مخفی کردن">
                        <IconEyeOff />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('cnyBalance')}</span>
                    <span className="text-2xl md:text-3xl font-bold">{format(totals.CNY)} <span className="text-base font-normal">CNY</span></span>
                </div>
            )}
            {!showBalances.CNY && (
                <div className="flex-1 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative opacity-60">
                    <button onClick={() => setShowBalances(s => ({ ...s, CNY: true }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="نمایش">
                        <IconEye />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('cnyBalance')}</span>
                </div>
            )}
            {showBalances.IRT && (
                <div className={`flex-1 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative ${
                    totals.IRT >= 0 
                        ? 'bg-gradient-to-br from-orange-400 to-pink-500' 
                        : 'bg-gradient-to-br from-red-400 to-pink-500'
                }`}>
                    <button onClick={() => setShowBalances(s => ({ ...s, IRT: false }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="مخفی کردن">
                        <IconEyeOff />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('irtBalance')}</span>
                    <span className="text-2xl md:text-3xl font-bold">{format(totals.IRT)} <span className="text-base font-normal">IRT</span></span>
                </div>
            )}
            {!showBalances.IRT && (
                <div className="flex-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center justify-center relative opacity-60">
                    <button onClick={() => setShowBalances(s => ({ ...s, IRT: true }))} className="absolute top-2 left-2 bg-white/20 hover:bg-white/40 rounded-full p-1 transition" title="نمایش">
                        <IconEye />
                    </button>
                    <span className="text-lg font-semibold mb-1">{t('irtBalance')}</span>
                </div>
            )}
        </div>
    );
};

const DashboardView: React.FC<{ user: User, balances: { personName: string, balances: Record<Currency['code'], number> }[], transactions: Transaction[] }> = ({ user, balances, transactions }) => {
    const { t } = useI18n();
    const [showAllModal, setShowAllModal] = useState(false);
    // Open all in new window
    const openAllInNewWindow = () => {
        const win = window.open('', '_blank', 'width=900,height=700');
        if (win) {
            win.document.write('<html><head><title>All Account Balances</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"></head><body>' +
                '<div id="balances-root"></div>' +
                '</body></html>');
            setTimeout(() => {
                const src = document.getElementById('balances-table-all');
                const dest = win.document.getElementById('balances-root');
                if (src && dest) dest.innerHTML = src.innerHTML;
            }, 200);
        }
    };
    // Sort and limit logic is in BalancesTable
    return (
        <div className="space-y-6">
            <div className="p-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl shadow-2xl text-white">
                <h2 className="text-3xl md:text-4xl font-bold">
                    {t('welcomeMessage')} {user.username}!
                </h2>
                <p className="mt-2 text-teal-100 max-w-2xl">
                    {t('dashboardHint')}
                </p>
            </div>
            <AccountBalancesSummary transactions={transactions} />
            <div className="flex flex-row-reverse items-center justify-between mb-2 gap-2">
                <div className="flex flex-row-reverse gap-2">
                    <button onClick={() => setShowAllModal(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium shadow-sm transition">
                        <IconEye />
                        <span>{t('showAllPopup')}</span>
                    </button>
                    <button onClick={openAllInNewWindow} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium shadow-sm transition">
                        <IconExternal />
                        <span>{t('showAllNewWindow')}</span>
                    </button>
                </div>
                <div></div>
            </div>
            <BalancesTable balances={balances} limit={10} />
            {/* Hidden full table for new window copy */}
            <div id="balances-table-all" style={{display:'none'}}><BalancesTable balances={balances} /></div>
            <Modal isOpen={showAllModal} onClose={() => setShowAllModal(false)} title={t('allPersons')}>
            <BalancesTable balances={balances} />
            </Modal>
        </div>
    );
};


export const HomePage: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<View>('dashboard');

  // --- Lifted State ---
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies] = useState<Currency[]>(initialCurrencies);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orderNumberCategories, setOrderNumberCategories] = useState<OrderNumberCategory[]>(initialOrderNumberCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [inventory, setInventory] = useState<Inventory>(initialInventory);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jacksExpenseCategories, setJacksExpenseCategories] = useState<JacksExpenseCategory[]>([]);
  
  // Calculate current stock based on initial inventory and sold items from invoices
  const calculateCurrentStock = useMemo(() => {
    const currentStock: Inventory = {};
    
    products.forEach(product => {
      // Start with initial inventory
      const initialStock = inventory[product.id] || 0;
      
      // Calculate total sold through invoices
      const totalSold = invoices.reduce((total, invoice) => {
        const invoiceItem = invoice.items.find(item => item.productId === product.id);
        return total + (invoiceItem?.quantity || 0);
      }, 0);
      
      // Current stock = Initial stock - Total sold
      currentStock[product.id] = Math.max(0, initialStock - totalSold);
    });
    
    return currentStock;
  }, [inventory, invoices, products]);
  
  const handleSelectView = (view: View) => {
    setActiveView(view);
  };

  const PageTitle = {
      dashboard: t('dashboardTitle'),
      persons: t('personsCardTitle'),
      jack_payment: t('jacksPaymentTitle'),
      transactions: t('transactionsTitle'),
      deliveries: t('deliveriesManagementTitle'),
      products: t('productsTitle'),
      inventory: t('inventoryTitle'),
      invoicing: t('invoicingTitle'),
  }

  const personBalances = useMemo(() => {
    const balanceMap: Record<number, Record<Currency['code'], number>> = {};

    persons.forEach(p => {
        balanceMap[p.id] = { USD: 0, CNY: 0, IRT: 0 };
    });

    transactions.forEach(tx => {
        const amount = tx.amount;
        switch (tx.type) {
            case 'PaymentIn':
                if (tx.entityId && balanceMap[tx.entityId]) {
                    balanceMap[tx.entityId][tx.currency] += amount;
                }
                break;
            case 'PaymentOut':
                if (tx.entityId && balanceMap[tx.entityId]) {
                    balanceMap[tx.entityId][tx.currency] -= amount;
                }
                break;
            case 'InternalTransfer':
                if (tx.fromEntityId && balanceMap[tx.fromEntityId]) {
                    balanceMap[tx.fromEntityId][tx.currency] -= amount;
                }
                if (tx.toEntityId && balanceMap[tx.toEntityId]) {
                    balanceMap[tx.toEntityId][tx.currency] += amount;
                }
                break;
            case 'Conversion':
                if (tx.entityId && balanceMap[tx.entityId] && tx.toCurrency) {
                    const rate = tx.rate || 1;
                    balanceMap[tx.entityId][tx.currency] -= amount;
                    balanceMap[tx.entityId][tx.toCurrency] += amount * rate;
                }
                break;
        }
    });

    return persons.map(p => ({
        personName: p.name,
        balances: balanceMap[p.id],
    }));
  }, [persons, transactions]);

  const jackPerson = useMemo(() => persons.find(p => p.name === 'Jack'), [persons]);

  const jackCnyBalance = useMemo(() => {
      if (!jackPerson) return 0;
      const jackBalanceData = personBalances.find(b => b.personName === 'Jack');
      return jackBalanceData ? jackBalanceData.balances.CNY : 0;
  }, [personBalances, jackPerson]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="lg:pr-64 pb-24 lg:pb-0"> {/* Space for the desktop sidebar & FAB on mobile */}
            <header className="bg-white/80 backdrop-blur-lg shadow-md sticky top-0 z-10">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
                        {PageTitle[activeView]}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 hidden sm:block">
                            {t('welcomeMessage')} <strong className="font-medium text-slate-800">{user.username}</strong>
                        </span>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-100/80 rounded-lg hover:bg-red-200/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                            aria-label={t('logoutButton')}
                        >
                            <IconLogout />
                            <span className="hidden md:inline">{t('logoutButton')}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {activeView === 'dashboard' && <DashboardView user={user} balances={personBalances} transactions={transactions} />}
                {activeView === 'persons' && <PersonsManager persons={persons} setPersons={setPersons} />}
                {activeView === 'jack_payment' && 
                    <JackPaymentManager 
                        jackPerson={jackPerson}
                        jackCnyBalance={jackCnyBalance}
                        transactions={transactions}
                        setTransactions={setTransactions}
                        expenseCategories={jacksExpenseCategories}
                        setExpenseCategories={setJacksExpenseCategories}
                    />
                }
                {activeView === 'transactions' && <TransactionsManager transactions={transactions} setTransactions={setTransactions} persons={persons} currencies={currencies} />}
                {activeView === 'deliveries' && <DeliveriesManager deliveries={deliveries} setDeliveries={setDeliveries} orderNumberCategories={orderNumberCategories} setOrderNumberCategories={setOrderNumberCategories} />}
                {activeView === 'products' && <ProductsManager products={products} setProducts={setProducts} inventory={calculateCurrentStock} />}
                {activeView === 'inventory' && <InventoryManager inventory={inventory} setInventory={setInventory} currentStock={calculateCurrentStock} products={products} />}
                {activeView === 'invoicing' && <InvoicingManager invoices={invoices} setInvoices={setInvoices} inventory={inventory} setInventory={setInventory} currentStock={calculateCurrentStock} products={products} persons={persons} addTransaction={(tx) => setTransactions(prev => [tx, ...prev])} />}
            </main>
        </div>
        
        <Sidebar
            activeView={activeView}
            onSelectView={handleSelectView}
        />
        <FloatingMenuButton 
            activeView={activeView}
            onSelectView={handleSelectView}
        />
    </div>
  );
};
