'use client';
import { useLanguage, LanguageSelector } from './language';
import { useEffect, useRef, useState } from 'react';
import VisitorConsent from './visitor-consent';
import Notifications from './notifications';
import ProductGallery from './product-gallery';
import HeroMedia from './hero-media';
import ProductInformation from './product-information';
import StoreFooter from './store-footer';
import { track, analyticsSession } from '../lib/visitor-client';
const mad = (n: number) => (n / 100).toFixed(2) + ' MAD';
export default function Shop({productId='',initialData=null}:{productId?:string,initialData?:any}={}) {
    const { t } = useLanguage();
    const [data, D] = useState<any>(initialData), [error, E] = useState(''), [search, Q] = useState(''), [category, C] = useState('All'), [active, A] = useState<any>(initialData?.products?.find((p:any)=>p.id===productId)||null), [variant, V] = useState(''), [cart, B] = useState<any[]>([]), [ready, R] = useState(false), [view, W] = useState(''), [busy, U] = useState(false), [quote, G] = useState<any>(null), [order, O] = useState<any>(null), [form, S] = useState<any>({ customer: '', phone: '', city: '', address: '', code: '', method: 'whatsapp' });
    const modal = useRef<HTMLDialogElement>(null), requestId = useRef('');
    async function load() { const r = await fetch('/api/store', { cache: 'no-store' }); const d: any = await r.json(); if (!r.ok)
        throw Error(d.error); D(d); }
    useEffect(() => { load().catch(e => E(e.message)); try {
        const saved = JSON.parse(localStorage.getItem('yog-live-bag') || '[]');
        if (Array.isArray(saved))
            B(saved.filter(x => x && typeof x.variantId === 'string' && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 20).slice(0, 40));
    }
    catch { } R(true); }, []);
    useEffect(() => { if (ready)
        try {
            localStorage.setItem('yog-live-bag', JSON.stringify(cart));
        }
        catch { } }, [cart, ready]);
    useEffect(() => { if (view) {
        modal.current?.showModal();
        if(modal.current)modal.current.scrollTop=0;
        document.body.style.overflow = 'hidden';
    }
    else {
        modal.current?.close();
        document.body.style.overflow = '';
    } return () => { document.body.style.overflow = ''; }; }, [view]);
    useEffect(() => { const id = new URLSearchParams(window.location.search).get('product'); if (id && data) {
        const p = data.products.find((p: any) => p.id === id);
        if (p)
            openProduct(p);
    } }, [!!data]);

    useEffect(()=>{if(productId&&data)A(data.products.find((p:any)=>p.id===productId)||null)},[productId,data]);
    useEffect(()=>{if(productId)track('product_view',productId);else if(new URLSearchParams(window.location.search).get('bag')==='1')W('bag')},[productId]);
    function openProduct(p: any) { track('product_view', p.id); A(p); V(''); E(''); W('product'); }
    function add() { if (!variant) {
        E(t("Choose a size and color."));
        return;
    } const v = active.variants.find((x: any) => x.id === variant), existing = cart.find(x => x.variantId === variant); if ((existing?.qty || 0) >= Math.min(v.stock, 20)) {
        E(t("You have reached the available quantity."));
        return;
    } B(existing ? cart.map(x => x.variantId === variant ? { ...x, qty: x.qty + 1 } : x) : [...cart, { variantId: variant, qty: 1 }]); track('add_to_bag', active.id); G(null); W('bag'); }
    const products = data?.products || [];
    const rows = cart.map(row => { const p = products.find((p: any) => p.variants.some((v: any) => v.id === row.variantId)), v = p?.variants.find((v: any) => v.id === row.variantId); return { ...row, p, v }; });
    const subtotal = rows.reduce((n, x) => n + (x.p ? (x.p.sale ?? x.p.price) * x.qty : 0), 0);
    function change(id: string, qty: number) { B(cart.map(x => x.variantId === id ? { ...x, qty } : x).filter(x => x.qty > 0)); G(null); }
    async function checkout() { if (!requestId.current)
        requestId.current = crypto.randomUUID(); U(true); E(''); try {
        const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, analyticsSession: analyticsSession(), id: requestId.current, items: cart, quote: !quote, expectedTotal: quote?.total }) }), d: any = await r.json();
        if (!r.ok) {
            G(null);
            throw Error(d.error);
        }
        if (!quote)
            G(d);
        else {
            O(d);
            B([]);
            W('success');
            requestId.current = '';
            load().catch(() => { });
        }
    }
    catch (e: any) {
        E(e.message);
    }
    finally {
        U(false);
    } }
    const renderProduct=()=><div className="detail"><ProductGallery key={active.id} photos={active.photos} title={active.title}/><section><span className="kicker">{active.category}</span>{productId?<h1>{active.title}</h1>:<h2>{active.title}</h2>}<div className="detail-badges">{!!active.is_new && <span className="badge new-badge">{t("New arrival")}</span>}{!!active.exclusive && <span className="badge exclusive-badge">{t("Exclusive piece")}</span>}</div><strong>{mad(active.sale ?? active.price)}</strong><p style={{ whiteSpace: 'pre-wrap' }}>{active.description}</p><label>{t("Size / color")}<select value={variant} onChange={e => { V(e.target.value); E(''); }}><option value="">{t("Choose your option")}</option>{active.variants.map((v: any) => <option key={v.id} value={v.id} disabled={!v.stock}>{v.size} / {v.color}{!v.stock ? t(" \u2014 sold out") : ''}</option>)}</select></label><button className="button" disabled={active.status !== 'active' || !active.variants.some((v: any) => v.stock > 0)} onClick={add}>{t("Add to bag \u2197")}</button>{(active.status === 'soldout' || !active.variants.some((v: any) => v.stock > 0)) && <Notifications key={active.id} productId={active.id} productTitle={active.title}/>}<p>{t("Delivery across supported Moroccan cities. Fees shown before you order.")}</p><ProductInformation product={active} settings={data.settings} info={data.info}/></section></div>;
    return <><a className="skip" href="/#collection">{t("Skip to collection")}</a>{data?.settings.announcementEnabled && <div className="announcement">{data.settings.announcement}</div>}<header className="store-nav"><a className="logo" href="/">YOG<span>®</span></a><nav><a href="/#collection">{t("Collection")}</a><a href="/about">{t("Our world")}</a></nav><button onClick={() => { W('bag'); E(''); }}>{t("Bag ")}<b>{cart.reduce((a, x) => a + x.qty, 0)}</b></button></header>{productId?<main className="product-page"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">YOG</a><span>/</span><a href="/#collection">{t('Collection')}</a><span>/</span><span>{active?.title||t('Unavailable product')}</span></nav>{active?renderProduct():<div className="empty"><h1>{t('Unavailable product')}</h1><a href="/#collection">{t('Explore the collection')}</a></div>}</main>:<main><section className="hero"><div><span className="kicker">{t("MOROCCO / INDEPENDENT SPIRIT")}</span><h1>{t("KON M9AWED")}<br />{t("O LBAS")}<br /><i>{t("L\u2019M9AWED.")}</i></h1><p>{t("From the block to wherever you take it.")}<br />{t("Streetwear with something to say.")}</p><a className="button" href="/#collection">{t("Explore the collection \u2197")}</a></div><HeroMedia key={data?.hero?.src||'original'} config={data?.hero} href={data?.hero?.productId&&products.some((p:any)=>p.id===data.hero.productId)?'/products/'+encodeURIComponent(data.hero.productId):'/#collection'}/></section><div className="strip">{t("ROOTED IN THE STREETS ")}<span>✳</span>{t(" WORN YOUR WAY ")}<span>✳</span> YOUTH OF GHETTO</div><section id="collection" className="collection"><span className="kicker">{t("01 / THE COLLECTION")}</span><div className="title-row"><h2>{t("Find your uniform.")}</h2><input aria-label={t("Search collection")} placeholder={t("Search pieces\u2026")} value={search} onChange={e => Q(e.target.value)}/></div><div className="filters">{['All', ...Array.from(new Set(products.map((p: any) => p.category)))].map((c: any) => <button key={c} aria-pressed={category === c} onClick={() => C(c)}>{t(c)}</button>)}</div>{!data && <p role="status">{error || t("Loading collection\u2026")}</p>}{data && !products.length && <div className="empty"><h3>{t("The next drop is taking shape.")}</h3><p>{t("New pieces will appear here as soon as they\u2019re published.")}</p></div>}<div className="product-grid">{products.filter((p: any) => (category === 'All' || p.category === category) && p.title.toLowerCase().includes(search.toLowerCase())).map((p: any) => <a className="product-card" key={p.id} href={'/products/'+encodeURIComponent(p.id)}><div><img src={p.photos[0]} alt={p.title} loading="lazy"/><div className="product-badges">{!!p.is_new && <span className="badge new-badge">{t("New")}</span>}{!!p.exclusive && <span className="badge exclusive-badge">{t("Exclusive")}</span>}{(p.status === 'soldout' || !p.variants.some((v: any) => v.stock > 0)) ? <span className="badge">{t("Sold out")}</span> : p.sale ? <span className="badge">{t("Sale")}</span> : null}</div><span className="arrow">↗</span></div><h3>{p.title}</h3><p>{p.sale && <del>{mad(p.price)} </del>}{mad(p.sale ?? p.price)}</p></a>)}</div>{products.length > 0 && !products.some((p: any) => (category === 'All' || p.category === category) && p.title.toLowerCase().includes(search.toLowerCase())) && <p>{t("No matching pieces. Try another search.")}</p>}</section><section className="world" id="world"><div><h2>{t("EVERY WALL")}<br />{t("HAS A STORY.")}</h2><span className="kicker">{t("OURS IS WRITTEN IN WHAT WE WEAR.")}</span></div><article><span className="kicker">{t("02 / OUR WORLD")}</span><h2>{t("Not just a fit.")}<br />{t("A point of view.")}</h2><p>{t("YOG is Youth of Ghetto. For the people who make their own way and carry their roots wherever they go.")}</p><p>{t("Scrappy. Loud. Unapologetically yours.")}</p><a href="https://wa.me/212770876528" target="_blank" rel="noreferrer">{t("Talk to us on WhatsApp \u2197")}</a></article></section></main>}<StoreFooter info={data?.info} settings={data?.settings}/><LanguageSelector /><VisitorConsent />{!view&&<nav className="mobile-shop-nav" aria-label={t("Store navigation")}><a href="/#collection">{t("Collection")}</a><button onClick={()=>{W('bag');E('')}}>{t("Bag")} <b>{cart.reduce((a,x)=>a+x.qty,0)}</b></button><a href="#store-language">{t("Language")}</a></nav>}
    <dialog aria-labelledby="shop-dialog-title" ref={modal} onCancel={e => { if (busy)
        e.preventDefault();
    else
        W(''); }} onClose={() => W('')}><div className="modal-head">{view==='checkout'&&<button disabled={busy} onClick={()=>{W('bag');E('')}}>{t("Back")}</button>}<b id="shop-dialog-title">{view === 'product' ? t("A closer look") : view === 'checkout' ? t("Delivery & order") : t("Your bag")}</b><button disabled={busy} aria-label={t("Close")} onClick={() => W('')}>×</button></div>{error && <p className="message" role="alert">{t(error)}</p>}
    {view === 'product' && active && renderProduct()}
    {view === 'bag' && <div className="modal-body">{!cart.length ? <div className="empty"><h2>{t("Your next fit starts here.")}</h2><p>{t("Your bag is empty.")}</p><button onClick={() => W('')}>{t("Explore the collection")}</button></div> : <>{rows.map(x => <div className="bag-row" key={x.variantId}>{x.p && <img src={x.p.photos[0]} alt=""/>}<div><h3>{x.p?<a href={'/products/'+encodeURIComponent(x.p.id)}>{x.p.title}</a>:t("Unavailable product")}</h3><p>{x.v?.size} / {x.v?.color}</p><div className="actions"><button aria-label={t("Decrease quantity")} onClick={() => change(x.variantId, x.qty - 1)}>−</button><span>{x.qty}</span><button aria-label={t("Increase quantity")} disabled={!x.v || x.qty >= Math.min(x.v.stock, 20)} onClick={() => change(x.variantId, x.qty + 1)}>+</button><button onClick={() => change(x.variantId, 0)}>{t("Remove")}</button></div>{(!x.p || x.p.status !== 'active' || x.v.stock < x.qty) && <p className="warning">{t("Unavailable quantity. Please update this item.")}</p>}</div><b>{x.p ? mad((x.p.sale ?? x.p.price) * x.qty) : ''}</b></div>)}<div className="total"><span>{t("Subtotal")}</span><b>{mad(subtotal)}</b></div><p>{t("Delivery and discounts calculated at the next step.")}</p><button className="button" disabled={!data || rows.some(x => !x.p || x.p.status !== 'active' || x.v.stock < x.qty)} onClick={() => { track('checkout'); W('checkout'); G(null); E(''); }}>{t("Continue to order \u2197")}</button></>}</div>}
    {view === 'checkout' && <form className="modal-body" onSubmit={e => { e.preventDefault(); checkout(); }}><fieldset disabled={busy}>{[['customer', t("Full name")], ['phone', t("Phone number")], ['address', t("Full delivery address")]].map(([key, label]) => <label key={key}>{label}<input required name={key} type={key==='phone'?'tel':'text'} inputMode={key==='phone'?'tel':'text'} autoComplete={key==='customer'?'name':key==='phone'?'tel':'street-address'} dir={key==='phone'?'ltr':'auto'} value={form[key]} maxLength={key === 'address' ? 500 : 100} onChange={e => { S({ ...form, [key]: e.target.value }); G(null); }}/></label>)}<label>{t("Delivery city")}<select required value={form.city} onChange={e => { S({ ...form, city: e.target.value }); G(null); }}><option value="">{t("Choose city")}</option>{data.settings.cities.split(',').map((c: string) => <option key={c} value={c.trim()}>{c.trim()}</option>)}</select></label><label>{t("Discount code (optional)")}<input value={form.code} onChange={e => { S({ ...form, code: e.target.value.toUpperCase() }); G(null); }}/></label><label>{t("Order method")}<select value={form.method} onChange={e => { S({ ...form, method: e.target.value }); G(null); }}><option value="whatsapp">{t("Confirm via WhatsApp")}</option>{data.settings.codEnabled && <option value="cod">{t("Cash on delivery")}</option>}</select></label><p>{t("Your name, phone and address are shared with YOG to process delivery. No card payment is taken.")}</p>{quote && <div className="panel"><p>{t("Items: ")}{mad(quote.subtotal)}</p><p>{t("Discount: \u2212")}{mad(quote.discount)}</p><p>{t("Delivery: ")}{mad(quote.delivery)}</p><h3>{t("Total: ")}{mad(quote.total)}</h3></div>}<p className="checkout-policy-links"><a href="/shipping-returns" target="_blank" rel="noreferrer">{t("Shipping & returns")}</a> · <a href="/terms" target="_blank" rel="noreferrer">{t("Terms of Service")}</a> · <a href="/privacy" target="_blank" rel="noreferrer">{t("Privacy Policy")}</a></p><button className="button checkout-submit" disabled={busy}>{busy ? t("Please wait\u2026") : quote ? t("Place order") : t("Review total \u2197")}</button></fieldset></form>}
    {view === 'success' && <div className="modal-body"><span className="kicker">{t("ORDER RECEIVED")}</span><h2>{t("You're on the list.")}</h2><p>{t("Reference: ")}{order.id}</p><p>{t("Your order is saved. YOG will confirm availability and delivery with you.")}</p>{order.whatsapp && <a className="button" href={order.whatsapp} target="_blank" rel="noreferrer">{t("Send order on WhatsApp \u2197")}</a>}<p>{t("Opening WhatsApp prepares your message; press Send there to contact the store.")}</p><button onClick={() => W('')}>{t("Keep exploring")}</button></div>}
    </dialog></>;
}
