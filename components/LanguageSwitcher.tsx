import React from 'react';
import { useI18n } from '../hooks/useI18n.ts';
import { Language } from '../types.ts';

const LanguageOption: React.FC<{ lang: Language; name: string; }> = ({ lang, name }) => {
    const { language, setLanguage } = useI18n();
    const isActive = language === lang;
    
    return (
        <button
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-teal-500 ${
                isActive 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'bg-white/50 text-slate-700 hover:bg-white/80'
            }`}
        >
            {name}
        </button>
    );
};


export const LanguageSwitcher: React.FC = () => {
    const { language, t } = useI18n();
    const positionClass = language === Language.FA ? 'left-4' : 'right-4';

    return (
        <div className={`absolute top-4 ${positionClass} z-20 flex items-center gap-2 p-1 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80`}>
            <LanguageOption lang={Language.EN} name={t('langEnglish')} />
            <LanguageOption lang={Language.FA} name={t('langFarsi')} />
            <LanguageOption lang={Language.ZH} name={t('langChinese')} />
        </div>
    );
};
