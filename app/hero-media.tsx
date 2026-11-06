'use client';
import {useEffect,useRef,useState} from 'react';
import {HERO_DEFAULTS,HeroConfig} from '../lib/hero-config';
import {useLanguage} from './language';
export default function HeroMedia({config,href='/#collection',preview=false}:{config?:HeroConfig,href?:string,preview?:boolean}){
 const hero=config||HERO_DEFAULTS,{t}=useLanguage(),video=useRef<HTMLVideoElement>(null),[muted,M]=useState(true),[paused,P]=useState(true),[failed,F]=useState(false),[message,S]=useState('');
 useEffect(()=>{F(false);M(true);P(true);S('');const player=video.current;if(!player)return;player.muted=true;if(!preview&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)void player.play().catch(()=>{});return()=>player.pause()},[hero.src,hero.type,preview]);
 useEffect(()=>{if(!hero.allowSound&&video.current){video.current.muted=true;M(true)}},[hero.allowSound]);
 async function togglePlay(){const player=video.current;if(!player)return;S('');if(!player.paused)player.pause();else try{await player.play()}catch{S(t('Tap play to start the video. If it does not play, try another browser.'))}}
 return <div className="hero-photo hero-media">{hero.type==='video'&&!failed?<video key={hero.src} ref={video} src={hero.src} poster={hero.poster||undefined} loop={hero.loop} muted={muted} playsInline preload="metadata" aria-label={hero.alt} onPlay={()=>P(false)} onPause={()=>P(true)} onEnded={()=>P(true)} onVolumeChange={()=>M(video.current?.muted??true)} onError={()=>F(true)} style={{objectFit:hero.fit as 'cover'|'contain',objectPosition:hero.position}}/>:<img src={hero.type==='video'?(hero.poster||HERO_DEFAULTS.src):hero.src||HERO_DEFAULTS.src} alt={t(hero.alt)} style={{objectFit:hero.fit as 'cover'|'contain',objectPosition:hero.position}} onError={e=>{if(e.currentTarget.getAttribute('src')!==HERO_DEFAULTS.src)e.currentTarget.src=HERO_DEFAULTS.src}}/>}
 {hero.showSticker&&<span className="sticker">YOUTH<br/>OF GHETTO<br/>↗</span>}
 {hero.type==='video'&&!failed&&<div className="hero-video-controls"><button type="button" onClick={togglePlay} aria-label={t(paused?'Play video':'Pause video')}>{t(paused?'Play video':'Pause video')}</button>{hero.allowSound&&<button type="button" onClick={()=>{if(video.current){video.current.muted=!video.current.muted;M(video.current.muted)}}} aria-pressed={!muted} aria-label={t(muted?'Turn sound on':'Turn sound off')}>{t(muted?'Sound off':'Sound on')}</button>}</div>}
 <div className="hero-overlay">{failed&&<p role="status">{t('Video unavailable. Showing the cover photo.')}</p>}{message&&<p role="status">{message}</p>}{hero.caption&&<strong>{t(hero.caption)}</strong>}{hero.showLink&&<a className="button hero-feature-link" href={href} onClick={preview?e=>e.preventDefault():undefined}>{t(hero.buttonText)} ↗</a>}</div>
 </div>
}
