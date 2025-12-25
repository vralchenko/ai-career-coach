import { useState, useEffect } from 'react';
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import ru from '@/locales/ru.json';
import uk from '@/locales/uk.json';

const translations: Record<string, any> = { en, de, es, ru, uk };

export function useTranslation() {
    const [lang, setLang] = useState('en');

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('lang_change', { detail: lang }));
    }, [lang]);

    const t = translations[lang] || translations['en'];

    return { t, lang, setLang };
}