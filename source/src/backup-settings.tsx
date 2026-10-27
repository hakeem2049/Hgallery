import {useState} from 'react';
import {readBackup,collections} from '../server/backup-state';
import {buildBackupReport,downloadBackup} from './backup';
export function backupFile(state:any,revision:number){return JSON.stringify({format:'hakim-ledger-backup',version:1,createdAt:new Date().toISOString(),revision,state},null,2)}
export default function BackupSettings({busy,save,onError}:any){
 const [file,F]=useState<any>(null),[confirmation,C]=useState(''),[working,W]=useState(false);
 const labels:any={customers:'عملاء',employees:'موظفون',products:'منتجات',entries:'حركات وفواتير',orders:'أوردرات',closes:'تقفيل أيام',audit:'سجل مراجعة'};
 async function restore(){if(!file||working||busy)return;W(true);onError('');try{
 const r=await fetch('/api/ledger',{cache:'no-store'}),fresh=await r.json();if(!r.ok)throw Error(fresh.error);if(fresh.role!=='admin')throw Error('للمسؤول فقط');
 downloadBackup(backupFile(fresh.state,fresh.revision),'application/json',`Hakim-before-restore-${Date.now()}.json`);
 if(!confirm('تأكد من حفظ نسخة ما قبل الاسترجاع في التنزيلات. سيتم استبدال كل الحسابات الحالية بمحتوى الملف، وأي حركات أحدث من النسخة ستختفي. متابعة؟'))return;
 if(await save('restoreLedger',{state:file.state,confirmation})){F(null);C('');}
 }catch(e:any){onError(e.message)}finally{W(false)}}
 return <section className="panel"><h3>رفع نسخة احتياطية واسترجاع الحسابات</h3><p className="muted">الاسترجاع يستبدل الحسابات بالكامل ولا يدمجها، لمنع تكرار الفواتير. حسابات الدخول وكلمات السر وإعدادات الدفع الخاصة بالمتصفح ليست ضمن النسخة. يمكنك معاينة الملف وفتحه للمراجعة دون تغيير بياناتك.</p><input type="file" accept=".json,application/json" disabled={busy||working} onChange={async e=>{const f=e.target.files?.[0];e.target.value='';F(null);C('');if(!f)return;try{if(f.size>8*1024*1024)throw Error('الملف أكبر من ٨ ميجابايت');const raw=JSON.parse(await f.text());F({state:readBackup(raw),createdAt:raw.createdAt,name:f.name});onError('')}catch(e:any){onError(e.message||'ملف النسخة غير صحيح')}}}/>{file&&<><h4>{file.name}</h4>{file.createdAt&&<p>تاريخ النسخة: {String(file.createdAt)}</p>}<p>{collections.map(k=>`${labels[k]}: ${file.state[k].length}`).join(' · ')}</p><button className="secondary" onClick={()=>downloadBackup(buildBackupReport(file.state,new Date().toISOString().slice(0,10),file.createdAt||'نسخة سابقة'),'text/html;charset=utf-8','Hakim-backup-preview.html')}>تنزيل كشف النسخة للمراجعة بدون نت</button><label>اكتب «استرجاع» لتأكيد استبدال الحسابات<input value={confirmation} onChange={e=>C(e.target.value)}/></label><button className="primary" disabled={busy||working||confirmation!=='استرجاع'} onClick={restore}>{working?'جاري الاسترجاع…':'حفظ نسخة من الحالي واسترجاع الملف'}</button></>}</section>
}
