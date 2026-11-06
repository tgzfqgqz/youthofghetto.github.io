'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import translations from './translations.json';
type Language='default'|'en'|'fr'|'ar';
const dictionary=new Map<string,string[]>(translations as [string,string[]][]);
const languages=['default','en','fr','ar'];
const LanguageContext=createContext({language:'default' as Language,setLanguage:(_value:Language)=>{},t:(text:string)=>text});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguage]=useState<Language>('default');
 useEffect(()=>{try{const saved=localStorage.getItem('yog-language');if(saved&&languages.includes(saved))setLanguage(saved as Language)}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=language==='default'?'en':language;document.documentElement.dir=language==='ar'?'rtl':'ltr';return()=>{document.documentElement.lang='en';document.documentElement.dir='ltr'}},[language]);
 function choose(value:Language){setLanguage(value);try{localStorage.setItem('yog-language',value)}catch{}}
 function t(text:string){if(language==='default')return text;const key=text.trim(),row=dictionary.get(key);if(!row)return text;const translated=row[language==='fr'?0:language==='ar'?1:2]||key;return text.replace(key,translated)}
 return <LanguageContext.Provider value={{language,setLanguage:choose,t}}>{children}</LanguageContext.Provider>
}
export function useLanguage(){return useContext(LanguageContext)}
export function LanguageSelector(){const {language,setLanguage,t}=useLanguage();return <div className="language-bar"><label htmlFor="store-language">{t('Language')}<select id="store-language" value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="default">Default</option><option value="en" lang="en">English</option><option value="fr" lang="fr">Français</option><option value="ar" lang="ar">العربية</option></select></label></div>}
