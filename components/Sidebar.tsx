
import React from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { View } from './HomePage.tsx';

// --- SVG Icons ---
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const IconTransactions = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M12 7h.01M16 7h.01M9 17h6m-6 4h6m2-18H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>;
const IconDeliveries = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 014 4v2" /></svg>;
const IconProducts = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 10l8 4m0 0l8-4m-8 4v-4m-8 4V7" /></svg>;
const IconInventory = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const IconInvoicing = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


interface SidebarProps {
  activeView: View;
  onSelectView: (view: View) => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full text-left gap-4 p-4 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-teal-500 text-white shadow-lg'
          : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
      }`}
    >
      {icon}
      <span className="font-semibold text-base">{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onSelectView }) => {
    const { t } = useI18n();

    return (
        <aside className="hidden lg:block fixed top-0 right-0 h-screen w-64 bg-white border-l border-slate-200/80 overflow-y-auto z-20">
            <div className="flex justify-center items-center p-6 lg:p-6">
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
            </div>
            <nav className="flex flex-col gap-3 p-4">
                <NavLink
                    icon={<IconDashboard />}
                    label={t('sidebarDashboard')}
                    isActive={activeView === 'dashboard'}
                    onClick={() => onSelectView('dashboard')}
                />
                 <hr/>
                <NavLink
                    icon={<IconProducts />}
                    label={t('sidebarProducts')}
                    isActive={activeView === 'products'}
                    onClick={() => onSelectView('products')}
                />
                 <NavLink
                    icon={<IconInventory />}
                    label={t('sidebarInventory')}
                    isActive={activeView === 'inventory'}
                    onClick={() => onSelectView('inventory')}
                />
                 <NavLink
                    icon={<IconInvoicing />}
                    label={t('sidebarInvoicing')}
                    isActive={activeView === 'invoicing'}
                    onClick={() => onSelectView('invoicing')}
                />
                <hr/>
                <NavLink
                    icon={<IconTransactions />}
                    label={t('sidebarTransactions')}
                    isActive={activeView === 'transactions'}
                    onClick={() => onSelectView('transactions')}
                />
                <NavLink
                    icon={<IconDeliveries />}
                    label={t('sidebarDeliveries')}
                    isActive={activeView === 'deliveries'}
                    onClick={() => onSelectView('deliveries')}
                />
                <NavLink
                    icon={<IconWallet />}
                    label={t('sidebarJacksPayment')}
                    isActive={activeView === 'jack_payment'}
                    onClick={() => onSelectView('jack_payment')}
                />
                 <hr/>
                <NavLink
                    icon={<IconUsers />}
                    label={t('sidebarPersons')}
                    isActive={activeView === 'persons'}
                    onClick={() => onSelectView('persons')}
                />
            </nav>
        </aside>
    );
};
