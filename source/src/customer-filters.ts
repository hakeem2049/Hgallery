export const customerViews=[['active','المتابعة'],['all','كل العملاء'],['wholesale','الجملة المستمر'],['wholesaleDebt','جملة وعليهم باقي'],['debt','عليهم باقي'],['pending','لسه مستلموش'],['settled','استلموا وخلصوا'],['credit','ليهم رصيد'],['new','بدون تعاملات']] as const;
export function customerSummaries(state:any){
 const summary=new Map<string,any>((state.customers||[]).map((c:any)=>[c.id,{...c,balance:Number(c.opening)||0,pending:0,ready:0,transactions:0,orderCount:0}]));
 for(const e of state.entries||[]){const c=summary.get(e.person);if(!c)continue;c.transactions++;if(e.kind==='sale')c.balance+=(Number(e.amount)||0)-(Number(e.cash)||0)-(Number(e.insta)||0)-(Number(e.vodafone)||0);if(e.kind==='receipt')c.balance-=Number(e.amount)||0;}
 for(const o of state.orders||[]){const c=summary.get(o.person);if(!c)continue;c.orderCount++;if(o.status!=='delivered')c.pending++;if(o.status==='ready')c.ready++;}
 return [...summary.values()].map(c=>({...c,balance:Math.round(c.balance*100)/100}));
}
export function matchesCustomer(c:any,view:string){const debt=c.balance>0,credit=c.balance<0,hasHistory=c.transactions>0||c.orderCount>0;switch(view){case 'active':return c.isWholesale===true||debt||credit||c.pending>0;case 'wholesale':return c.isWholesale===true;case 'wholesaleDebt':return c.isWholesale===true&&debt;case 'debt':return debt;case 'pending':return c.pending>0;case 'settled':return hasHistory&&c.pending===0&&c.balance===0;case 'credit':return credit;case 'new':return !hasHistory&&c.balance===0;default:return true;}}
