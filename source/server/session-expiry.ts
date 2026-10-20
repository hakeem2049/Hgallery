// First instant of the next Cairo calendar day, including DST midnight changes.
export function cairoMidnight(now=new Date()){
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'});
 const day=fmt.format(now);let low=now.getTime(),high=low+36*3600*1000;
 while(high-low>1){const mid=Math.floor((low+high)/2);if(fmt.format(new Date(mid))===day)low=mid;else high=mid;}
 return new Date(high).toISOString();
}
