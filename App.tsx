import React, { useState, useCallback } from 'react';
import { LoginPage } from './components/LoginPage.tsx';
import { HomePage } from './components/HomePage.tsx';
import { LanguageSwitcher } from './components/LanguageSwitcher.tsx';
import { I18nProvider, useI18n } from './hooks/useI18n.ts';
import { User } from './types.ts';

// Hardcoded user credentials as requested
const USERS: { [key: string]: string } = {
  Amir: 'password',
  Jack: 'password',
};

const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    const handleLogin = useCallback((username: string, password: string) => {
        if (USERS[username] && USERS[username] === password) {
            setCurrentUser({ username });
            setError(null);
        } else {
            setError(t('invalidCredentialsError'));
        }
    }, [t]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    return (
        <div className="relative min-h-screen bg-slate-50 text-slate-800">
            <LanguageSwitcher />
            {currentUser ? (
                <HomePage user={currentUser} onLogout={handleLogout} />
            ) : (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <LoginPage onLogin={handleLogin} error={error} />
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;