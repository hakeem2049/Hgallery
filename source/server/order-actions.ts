// All mutations happen on the in-memory ledger and are committed once with its revision.
// A delivery and its payment therefore either both save or neither saves.
export function applyOrder(s:any,action:string,p:any,stamp:any,admin:boolean){
 const money=(v:any)=>{const n=Number(v||0);if(!Number.isFinite(n)||n<0||n>1e10)throw Error('المبلغ غير صحيح');return Math.round(n*100)/100;};
 const ensureOpen=()=>{if(s.closes.some((x:any)=>x.date===stamp.date))throw Error('اليوم مقفول؛ أعد فتحه قبل تسجيل قبض أو حجز');};
 const checkItems=()=>{if(!Array.isArray(p.items)||!p.items.length||p.items.length>100)throw Error('أضف بندًا للأوردر');const items=p.items.map((x:any)=>{const name=String(x.name||'').trim(),qty=money(x.qty),price=money(x.price);if(!name||!qty)throw Error('راجع اسم وكمية كل بند');return {name,qty,price}});const amount=money(items.reduce((a:number,x:any)=>a+x.qty*x.price,0));if(!amount)throw Error('إجمالي الأوردر لازم يكون أكبر من صفر');return {items,amount};};
 const checkDate=()=>{const due=String(p.dueDate||'');if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw Error('راجع تاريخ التسليم');return due;};
 const split=()=>({cash:money(p.cash),insta:money(p.insta),vodafone:money(p.vodafone)});
 const nextInvoice=()=>{s.invoiceSeq=Math.max(s.invoiceSeq||0,...s.entries.filter((x:any)=>x.kind==='sale').map((x:any)=>Number(x.invoiceNo)||0))+1;return s.invoiceSeq;};
 s.orders ||= [];
 if(action==='orderCreate'){
  ensureOpen();const {items,amount}=checkItems();const payment=split(),paid=money(payment.cash+payment.insta+payment.vodafone);if(paid>amount)throw Error('العربون أكبر من إجمالي الأوردر');let person=String(p.person||'');
  if(!person){const name=String(p.customerName||'').trim(),phone=String(p.customerPhone||'').trim();if(!name||!phone)throw Error('اكتب اسم العميل ورقم تليفونه');const existing=s.customers.find((x:any)=>String(x.phone).replace(/\s/g,'')===phone.replace(/\s/g,''));if(existing)throw Error('رقم العميل موجود بالفعل؛ اختاره من قائمة العملاء');person=crypto.randomUUID();s.customers.push({name,phone,opening:0,...stamp,id:person});}
  const customer=s.customers.find((x:any)=>x.id===person);if(!customer||!customer.phone)throw Error('الأوردر يحتاج عميلًا مسجلًا برقم تليفون');
  s.orderSeq=(s.orderSeq||0)+1;const orderId=stamp.id,invoiceId=crypto.randomUUID();const note=String(p.note||'').trim(),dueDate=checkDate(),source=p.source==='online'?'online':'shop';
  const order={...stamp,number:s.orderSeq,person,invoiceId,note,dueDate,source,status:'booked',history:[{...stamp,status:'booked'}]};
  s.orders.push(order);s.entries.push({...stamp,id:invoiceId,kind:'sale',person,items,amount,...payment,note:`حجز أوردر #${s.orderSeq}${note?' — '+note:''}`,orderId,invoiceNo:nextInvoice()});
  return null;
 }
 const order=s.orders.find((x:any)=>x.id===p.orderId);if(!order)throw Error('الأوردر غير موجود');const before=JSON.parse(JSON.stringify(order));const sale=s.entries.find((x:any)=>x.id===order.invoiceId&&x.kind==='sale');if(!sale)throw Error('فاتورة الأوردر غير موجودة');const receipts=s.entries.filter((x:any)=>x.orderId===order.id&&x.kind==='receipt');const paid=money(sale.cash+sale.insta+sale.vodafone+receipts.reduce((a:number,e:any)=>a+e.amount,0)),due=money(sale.amount-paid);
 if(action==='orderRollback'){
  if(!admin)throw Error('الرجوع في المراحل للمسؤول فقط');const stages=['booked','preparing','ready','delivered'];const rank=stages.indexOf(order.status);if(rank<=0)throw Error('الأوردر في أول مرحلة بالفعل');const reason=String(p.reason||'').trim();if(!reason)throw Error('اكتب سبب الرجوع');const previous=order.status;order.status=stages[rank-1];delete order.deliveredAt;delete order.deliveredBy;order.history ||= [];order.history.push({...stamp,status:order.status,event:'rollback',fromStatus:previous,reason});return before;
 }
 if(action==='orderDelete'){
  if(!admin)throw Error('حذف الأوردر للمسؤول فقط');const reason=String(p.reason||'').trim();if(!reason)throw Error('اكتب سبب الحذف');const linked=s.entries.filter((x:any)=>x.orderId===order.id||x.id===order.invoiceId);if(linked.some((x:any)=>s.closes.some((c:any)=>c.date===x.date)))throw Error('أعد فتح أيام الحجز والدفعات المرتبطة من مراجعة الأيام قبل الحذف');if(p.confirmNumber!==String(order.number))throw Error('اكتب رقم الأوردر لتأكيد الحذف');s.entries=s.entries.filter((x:any)=>!linked.includes(x));s.orders=s.orders.filter((x:any)=>x.id!==order.id);return {order:before,entries:structuredClone(linked),reason};
 }
 if(action==='orderStatus'){
  const rank:any={booked:0,preparing:1,ready:2,delivered:3};if(order.status==='delivered')throw Error('الأوردر متسلم بالفعل');if(!['preparing','ready'].includes(p.status))throw Error('اختار حالة صحيحة');if(rank[p.status]<=rank[order.status])throw Error('الحالة تم تحديثها بالفعل؛ أعد تحميل البيانات');order.status=p.status;order.history.push({...stamp,status:p.status});return before;
 }
 if(action==='orderPayment'||action==='orderDeliver'){
  if(order.status==='delivered'&&action==='orderDeliver')throw Error('الأوردر متسلم بالفعل');const payment=split(),amount=money(payment.cash+payment.insta+payment.vodafone);if(amount>due)throw Error('المبلغ أكبر من الباقي على الأوردر');if(action==='orderPayment'&&!amount)throw Error('اكتب مبلغ الدفعة');if(action==='orderDeliver'&&amount<due&&p.allowCredit!==true)throw Error('حصّل الباقي أو اختار تسليم مع بقاء مبلغ على العميل');
  ensureOpen();if(amount)s.entries.push({...stamp,id:crypto.randomUUID(),kind:'receipt',person:order.person,orderId:order.id,amount,...payment,note:action==='orderDeliver'?`تحصيل عند تسليم أوردر #${order.number}`:`دفعة أوردر #${order.number}`});
  if(action==='orderDeliver'){order.status='delivered';order.deliveredAt=stamp.at;order.deliveredBy=stamp.byName;order.history.push({...stamp,status:'delivered',collected:amount,remaining:money(due-amount)});}else order.history.push({...stamp,status:order.status,event:'payment',collected:amount});return before;
 }
 if(action==='orderPaymentEdit'){
  if(!admin)throw Error('تصحيح الدفعات للمسؤول فقط');const entry=s.entries.find((x:any)=>x.id===p.entryId&&x.orderId===order.id&&['sale','receipt'].includes(x.kind));if(!entry)throw Error('الدفعة غير موجودة');if(s.closes.some((x:any)=>x.date===entry.date))throw Error('أعد فتح يوم الدفعة من مراجعة الأيام قبل تصحيحها');const old=JSON.parse(JSON.stringify(entry)),payment=split(),amount=money(payment.cash+payment.insta+payment.vodafone),oldAmount=money(entry.cash+entry.insta+entry.vodafone);if(entry.kind==='receipt'&&!amount)throw Error('مبلغ الدفعة لازم يكون أكبر من صفر');if(paid-oldAmount+amount>sale.amount)throw Error('إجمالي المقبوض أكبر من قيمة الأوردر');Object.assign(entry,payment,{editedAt:stamp.at,editedBy:stamp.by,editedByName:stamp.byName},entry.kind==='receipt'?{amount}:{});order.history.push({...stamp,status:order.status,event:'paymentEdit',collectedBefore:oldAmount,collectedAfter:amount});return {order:before,entry:old};
 }
 if(action==='orderEdit'){
  if(!admin)throw Error('تعديل الأوردر للمسؤول فقط');const beforeSale=JSON.parse(JSON.stringify(sale));const {items,amount}=checkItems();if(amount<paid)throw Error('الإجمالي الجديد أقل من المبلغ المقبوض');if(amount!==sale.amount||JSON.stringify(items)!==JSON.stringify(sale.items)){if(s.closes.some((x:any)=>x.date===sale.date))throw Error('أعد فتح يوم الحجز قبل تعديل قيمة أو بنود الأوردر');sale.items=items;sale.amount=amount;sale.editedAt=stamp.at;sale.editedBy=stamp.by;sale.editedByName=stamp.byName;}
  order.note=String(p.note||'').trim();order.dueDate=checkDate();order.source=p.source==='online'?'online':'shop';order.history.push({...stamp,status:order.status,event:'edit'});return {order:before,invoiceBeforeAmount:paid+due,invoice:beforeSale};
 }
 throw Error('طلب أوردر غير معروف');
}
