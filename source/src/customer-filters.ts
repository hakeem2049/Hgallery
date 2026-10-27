export const customerFilters=[['wholesale','جملة'],['debt','باقي عليه حساب'],['pending','لسه مستلمش'],['newOrder','أوردر جديد']] as const;
export function customerSummaries(state:any){
 const summary=new Map<string,any>((state.customers||[]).map((c:any)=>[c.id,{...c,balance:Number(c.opening)||0,pending:0,ready:0,newOrders:0,transactions:0,orderCount:0,pendingDue:0}]));
 const sales=new Map<string,any>((state.entries||[]).filter((e:any)=>e.kind==='sale').map((e:any)=>[e.id,e]));
 const receipts=new Map<string,number>();
 for(const e of state.entries||[]){const c=summary.get(e.person);if(!c)continue;c.transactions++;if(e.kind==='sale')c.balance+=(Number(e.amount)||0)-(Number(e.cash)||0)-(Number(e.insta)||0)-(Number(e.vodafone)||0);if(e.kind==='receipt'){c.balance-=Number(e.amount)||0;if(e.orderId)receipts.set(e.orderId,(receipts.get(e.orderId)||0)+(Number(e.amount)||0));}}
 for(const o of state.orders||[]){const c=summary.get(o.person);if(!c)continue;c.orderCount++;if(o.status==='booked')c.newOrders++;if(o.status==='ready')c.ready++;if(o.status!=='delivered'){c.pending++;const e=sales.get(o.invoiceId);if(e)c.pendingDue+=Math.max(0,(Number(e.amount)||0)-(Number(e.cash)||0)-(Number(e.insta)||0)-(Number(e.vodafone)||0)-(receipts.get(o.id)||0));}}
 // General receipts settle delivered work first; any excess reduces pending balances.
 return [...summary.values()].map(c=>{const balance=Math.round(c.balance*100)/100,pendingDue=Math.round(Math.min(Math.max(0,balance),c.pendingDue)*100)/100;return {...c,balance,pendingDue,deliveredDue:Math.round(Math.max(0,balance-pendingDue)*100)/100};});
}
export function matchesCustomer(c:any,filters:string[]){return filters.every(key=>key==='wholesale'?c.isWholesale===true:key==='debt'?c.balance>0:key==='pending'?c.pending>0:key==='newOrder'?c.newOrders>0:true);}
export function sortCustomers(rows:any[],key:string,direction:'asc'|'desc'){
 const value=(c:any)=>key==='name'?String(c.name||''):key==='phone'?String(c.phone||'').replace(/\D/g,''):Number(c[key])||0;
 return [...rows].sort((a,b)=>{const x=value(a),y=value(b);const result=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'ar',{numeric:true,sensitivity:'base'});return (direction==='asc'?1:-1)*result||String(a.id).localeCompare(String(b.id));});
}
export function latestCustomerInvoice(entries:any[],person:string){return entries.filter(e=>e.person===person&&e.kind==='sale').reduce((last:any,e:any)=>!last||String(e.at||e.date||'')>String(last.at||last.date||'')||String(e.at||e.date||'')===String(last.at||last.date||'')&&(Number(e.invoiceNo)||0)>(Number(last.invoiceNo)||0)?e:last,null);}
