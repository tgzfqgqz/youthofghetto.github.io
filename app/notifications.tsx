'use client';
import { useLanguage, LanguageSelector } from './language';
import { useEffect, useState } from 'react';
const defaults = { new: true, discount: true, exclusive: true };
const labels = { new: 'New drops', discount: 'Price reductions', exclusive: 'Exclusive pieces' };
const storage = 'yog-push-preferences';
function read() { try {
    return JSON.parse(localStorage.getItem(storage) || 'null');
}
catch {
    return null;
} }
export default function Notifications({ productId, productTitle }: {
    productId?: string;
    productTitle?: string;
}) {
    const { t } = useLanguage();
    const [open, O] = useState(false), [prefs, P] = useState(defaults), [watched, W] = useState<string[]>([]), [enabled, E] = useState(false), [busy, B] = useState(false), [message, M] = useState(''), [supported, S] = useState(true);
    useEffect(() => { S('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window); const s = read(); if (s) {
        P(s.preferences || defaults);
        W(s.watched || []);
    } if ('serviceWorker' in navigator)
        navigator.serviceWorker.getRegistration('/').then(r => r?.pushManager.getSubscription()).then(s => E(!!s)).catch(() => { }); }, [open]);
    async function persist(disable = false) {
        B(true);
        M('');
        try {
            if (!supported)
                throw Error(t("Use a browser that supports push. On iPhone or iPad, add this store to your Home Screen, then open it there."));
            if (!disable) {
                if (Notification.permission !== 'granted' && await Notification.requestPermission() !== 'granted')
                    throw Error(t("Notifications are blocked. Allow them in your browser\u2019s site settings, then try again."));
            }
            const saved = read();
            let token = saved?.token;
            if (!token) {
                token = crypto.randomUUID() + crypto.randomUUID();
                localStorage.setItem(storage, JSON.stringify({ token, preferences: prefs, watched }));
            }
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (disable) {
                if (subscription) {
                    const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unsubscribe', token, subscription: subscription.toJSON() }) });
                    if (!r.ok)
                        throw Error(t("Could not turn off alerts. Please try again."));
                    await subscription.unsubscribe();
                }
                E(false);
                M(t("Notifications turned off for this browser."));
                return;
            }
            if (!subscription) {
                const r = await fetch('/api/push/subscribe'), data: any = await r.json();
                if (!r.ok || !data.publicKey)
                    throw Error(t("Notifications are not ready yet. Please try later."));
                const key = Uint8Array.from(atob(data.publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
                subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
            }
            const next = productId ? Array.from(new Set([...watched, productId])) : watched;
            const response = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, subscription: subscription.toJSON(), preferences: prefs, watched: next }) }), result: any = await response.json();
            if (!response.ok)
                throw Error(result.error || t("Could not save preferences."));
            localStorage.setItem(storage, JSON.stringify({ token, preferences: prefs, watched: next }));
            W(next);
            E(true);
            M(productId ? t("Stock alert saved. We\u2019ll notify you when this piece returns.") : t("You\u2019re subscribed. Your preferences are saved."));
        }
        catch (e: any) {
            M(e.message);
        }
        finally {
            B(false);
        }
    }
    return <div className="push-signup"><button type="button" className="push-trigger" onClick={() => O(!open)} aria-expanded={open}>{productId ? t("Notify me when it\u2019s back \u2197") : enabled ? t("Manage drop notifications \u2197") : t("Get drop notifications \u2197")}</button>{open && <section className="push-card"><span className="kicker">{t("NEVER MISS YOUR NEXT FIT")}</span><h3>{productId ? t("Watch ") + productTitle : t("Your drops. Your choice.")}</h3><p>{t("Browser alerts for the things you care about, even when this tab is closed. No email needed.")}</p>{!supported && <p>{t("On iPhone or iPad, add this store to your Home Screen and open it there to enable notifications.")}</p>}<fieldset disabled={busy}>{Object.entries(labels).map(([key, label]) => <label className="check" key={key}><input type="checkbox" checked={prefs[key as keyof typeof prefs]} onChange={e => P({ ...prefs, [key]: e.target.checked })}/>{t(label)}</label>)}{watched.length > 0 && <label className="check"><input type="checkbox" checked={true} onChange={() => W([])}/>{t("Watching ")}{watched.length}{t(" piece(s) for restocks \u2014 uncheck to clear")}</label>}<p>{t("Restock alerts apply when any size or color becomes available. Notifications depend on your browser and device settings.")}</p><div className="actions"><button className="button" type="button" disabled={!supported} onClick={() => persist()}>{busy ? t("Saving\u2026") : enabled ? t("Save preferences") : t("Enable notifications")}</button>{enabled && <button type="button" onClick={() => persist(true)}>{t("Turn off")}</button>}</div></fieldset><p role="status">{t(message)}</p></section>}</div>;
}
