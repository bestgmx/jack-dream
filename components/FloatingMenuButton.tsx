
import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { View } from './HomePage.tsx';

// --- Icons ---
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const IconTransactions = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M12 7h.01M16 7h.01M9 17h6m-6 4h6m2-18H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>;
const IconDeliveries = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 014 4v2" /></svg>;
const IconProducts = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m0 10l8 4m0 0l8-4m-8 4v-4m-8 4V7" /></svg>;
const IconInventory = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const IconInvoicing = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

interface FloatingMenuButtonProps {
    activeView: View;
    onSelectView: (view: View) => void;
}

const MenuOption: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  delay: number;
  isOpen: boolean;
}> = ({ label, icon, onClick, isActive, delay, isOpen }) => {
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${isOpen ? delay : 0}ms` }}>
      <button onClick={onClick} className="w-full flex items-center text-right rtl:text-left gap-4 p-3 rounded-lg bg-white/80 backdrop-blur-sm shadow-md hover:bg-white active:scale-95 transition-all">
          <span className={`p-2 rounded-lg ${isActive ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {icon}
          </span>
          <span className={`font-semibold ${isActive ? 'text-teal-600' : 'text-slate-700'}`}>{label}</span>
      </button>
    </div>
  );
};


export const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({ activeView, onSelectView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useI18n();

    const menuItems = [
        { view: 'dashboard', icon: <IconDashboard />, label: t('sidebarDashboard') },
        { view: 'products', icon: <IconProducts />, label: t('sidebarProducts') },
        { view: 'inventory', icon: <IconInventory />, label: t('sidebarInventory') },
        { view: 'invoicing', icon: <IconInvoicing />, label: t('sidebarInvoicing') },
        { view: 'transactions', icon: <IconTransactions />, label: t('sidebarTransactions') },
        { view: 'deliveries', icon: <IconDeliveries />, label: t('sidebarDeliveries') },
        { view: 'jack_payment', icon: <IconWallet />, label: t('sidebarJacksPayment') },
        { view: 'persons', icon: <IconUsers />, label: t('sidebarPersons') },
    ];

    const handleSelect = (view: View) => {
        onSelectView(view);
        setIsOpen(false);
    };

    return (
        <div className="lg:hidden fixed bottom-6 right-6 rtl:left-6 rtl:right-auto z-30 flex flex-col items-end gap-3">
            {isOpen && (
                 <div className="flex flex-col gap-3">
                    {menuItems.map((item, index) => (
                        <MenuOption
                            key={item.view}
                            label={item.label}
                            icon={item.icon}
                            onClick={() => handleSelect(item.view as View)}
                            isActive={activeView === item.view}
                            delay={index * 30}
                            isOpen={isOpen}
                        />
                    ))}
                 </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-2xl flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110 active:scale-100"
                aria-label="Toggle menu"
            >
                <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <IconPlus />
                </div>
            </button>
        </div>
    );
};
