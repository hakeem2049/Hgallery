import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const result=await build({entryPoints:['src/main.tsx'],bundle:true,write:false,format:'iife',target:['chrome110','edge110'],jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
const css=await readFile('src/globals.css','utf8');
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
await mkdir('dist',{recursive:true});
await writeFile('dist/Hakim-Accounts.html',`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://sndgaytdnxukakvgnomj.supabase.co; img-src data: blob:; font-src 'none'; base-uri 'none'; form-action 'none'"><title>حكيم | دفتر الحسابات</title><style>${css}</style></head><body><div id="root"></div><noscript>فعّل JavaScript لتشغيل البرنامج.</noscript><script>${js}</script></body></html>`);
console.log('Built self-contained local HTML; no external scripts, no cached ledger, no server secrets.');
