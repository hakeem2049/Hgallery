import {MessageCircle} from 'lucide-react';
import {whatsappURL} from './ui-utils';
export default function WhatsApp({phone}:{phone?:string}){const url=whatsappURL(phone||'');return <span className="phone-actions"><span dir="ltr">{phone||'—'}</span>{url&&<a className="whatsapp" href={url} target="_blank" rel="noopener noreferrer" aria-label="فتح محادثة العميل على واتساب ويب" title="فتح واتساب ويب" onClick={e=>e.stopPropagation()}><MessageCircle size={17}/><span>واتساب</span></a>}</span>}
