export const collections=['customers','employees','products','entries','orders','closes','audit'] as const;
export function readBackup(value:any){
 const state=value?.format==='hakim-ledger-backup'?(value.version===1?value.state:null):value;
 if(!state||typeof state!=='object'||!['customers','employees','products','entries','closes','audit'].every(k=>Array.isArray(state[k])))throw Error('ملف النسخة غير صحيح أو إصداره غير مدعوم');
 const result:any={};
 for(const k of collections){const rows=state[k]??(k==='orders'?[]:null);if(!Array.isArray(rows))throw Error('بيانات النسخة ناقصة');const ids=new Set();for(const row of rows){if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id||ids.has(row.id))throw Error('سجلات غير صحيحة أو مكررة في '+k);ids.add(row.id);for(const field of ['amount','cash','insta','vodafone','opening','retail','wholesale'])if(row[field]!==undefined&&(typeof row[field]!=='number'||!Number.isFinite(row[field])||row[field]<0))throw Error('مبالغ غير صحيحة في النسخة');if(row.items!==undefined&&(!Array.isArray(row.items)||row.items.some((x:any)=>!x||typeof x.name!=='string'||typeof x.qty!=='number'||!Number.isFinite(x.qty)||x.qty<=0||typeof x.price!=='number'||!Number.isFinite(x.price)||x.price<0)))throw Error('بنود غير صحيحة في النسخة');}result[k]=structuredClone(rows);}
 for(const key of ['orderSeq','invoiceSeq']){const v=state[key]??0;if(!Number.isSafeInteger(v)||v<0)throw Error('تسلسل الفواتير غير صحيح');result[key]=(key==='orderSeq'?result.orders:result.entries).reduce((n:number,r:any)=>Math.max(n,Number(r[key==='orderSeq'?'orderNo':'invoiceNo'])||0),v);}
 return result;
}
