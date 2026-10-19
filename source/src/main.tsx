import {useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {WifiOff,RefreshCw,ShieldCheck} from 'lucide-react';
import App from './page';
import ThemePicker from './theme';
import {checkConnection,installTransport} from './transport';
installTransport();
function OnlineApp(){const [online,O]=useState(false),[busy,B]=useState(true),[started,S]=useState(false);const sequence=useRef(0);async function check(){const n=++sequence.current;B(true);try{await checkConnection();if(n===sequence.current){O(true);S(true)}}catch{if(n===sequence.current)O(false)}finally{if(n===sequence.current)B(false)}}useEffect(()=>{check();const off=()=>{sequence.current++;O(false);B(false)};const id=setInterval(check,15000);addEventListener('offline',off);addEventListener('online',check);addEventListener('hakim-disconnected',off);return()=>{clearInterval(id);removeEventListener('offline',off);removeEventListener('online',check);removeEventListener('hakim-disconnected',off)}},[]);return <><ThemePicker/>{started&&<div style={{display:online?'block':'none'}}><App/></div>}{!online&&<div className="connectionpage"><section className="connectionbox"><div className="brandmark">ح</div>{busy?<RefreshCw className="spin" size={33}/>:<WifiOff size={33}/>}<h1>{busy?'جاري الاتصال بسوبابيز…':'البرنامج يحتاج اتصالًا بالإنترنت'}</h1><p>الحسابات محفوظة على سوبابيز. لازم نتأكد من الاتصال قبل عرض البيانات أو تسجيل أي عملية.</p><button className="primary" disabled={busy} onClick={check}>{busy?'جاري التحقق…':'إعادة الاتصال'}</button><small><ShieldCheck size={14}/> لا يتم تخزين حسابات أو فواتير على هذا الجهاز.</small></section></div>}</>}
createRoot(document.getElementById('root')!).render(<OnlineApp/>);
