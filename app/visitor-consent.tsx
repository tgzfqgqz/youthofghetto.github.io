'use client';
import { useLanguage, LanguageSelector } from './language';
import { useEffect, useState } from 'react';
import { allowed, track, resetTracking } from '../lib/visitor-client';
export default function VisitorConsent() { const { t } = useLanguage(); const [choice, C] = useState<string | null>('loading'); useEffect(() => { try {
    C(localStorage.getItem('yog-statistics'));
}
catch {
    C('no');
} }, []); useEffect(() => { if (choice !== 'yes' || !allowed())
    return; track('page_view'); const tick = () => track('heartbeat'); const timer = setInterval(tick, 30000); document.addEventListener('visibilitychange', tick); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); }; }, [choice]); function choose(value: string) { try {
    localStorage.setItem('yog-statistics', value);
}
catch { } if (value === 'no')
    resetTracking(); C(value); } return <>{choice === null ? <div className="analytics-consent"><div><b>{t("Help us improve the next drop?")}</b><p>{t("Allow optional visit statistics: browser ID, product activity and approximate city/country. No GPS or IP address is stored. Records expire after 90 days.")}</p></div><button onClick={() => choose('no')}>{t("No thanks")}</button><button className="button" onClick={() => choose('yes')}>{t("Allow statistics")}</button></div> : <button className="privacy-link" onClick={() => C(null)}>{t("Visitor statistics preferences")}</button>}</>; }
