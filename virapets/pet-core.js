/* Original procedural artwork. No third-party assets or runtime dependencies. */
(function(root){
'use strict';
const MOODS=['happy','barking','waiting','sleeping'];
const TIMINGS={happy:[240,96,96,80,80,96,96,176],barking:[360,64,64,160,128,64,64,240],waiting:[1440,120,80,80,80,80,120,400],sleeping:[1000,180,240,650,220,400,250,800]};
const SLEEP_SIGNS=[['z',-2,1],['zZ',-1,1],['ZzZ',0,0],['ZzZ',1,0],null,null,['z',-2,1],['Zz',-1,1]];
const DEFAULT={version:1,id:'meu-companheiro',name:'Pingo',author:'Comunidade ViraPets',body:'#bd8155',muzzle:'#f6dfb2',accessory:'#7062d9',ears:'floppy'};
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('A receita deve ser um objeto JSON.');
 const c={};for(const key of Object.keys(DEFAULT)){if(!Object.hasOwn(value,key))throw Error('Campo ausente: '+key);c[key]=value[key];}
 if(c.version!==1)throw Error('Versão de receita não suportada.');
 if(typeof c.id!=='string'||! /^[a-z][a-z0-9-]{0,47}$/.test(c.id))throw Error('ID: use de 1 a 48 letras minúsculas, números e hífens, começando por letra.');
 for(const key of ['name','author'])if(typeof c[key]!=='string'||!c[key].trim()||c[key].length>80)throw Error('Nome e autor precisam de 1 a 80 caracteres.');
 for(const key of ['body','muzzle','accessory'])if(typeof c[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(c[key]))throw Error('Cor inválida: '+key);
 if(!['floppy','pointy'].includes(c.ears))throw Error('Tipo de orelha inválido.');
 c.name=c.name.trim();c.author=c.author.trim();return c;
}
function manifest(config){const c=validate(config);return {id:c.id,name:c.name,author:c.author,description:'Cão pixel art original criado no editor procedural ViraPets.',status:'draft',timings:JSON.parse(JSON.stringify(TIMINGS)),sleepSigns:JSON.parse(JSON.stringify(SLEEP_SIGNS))};}
function frameAt(mood,elapsed){const times=TIMINGS[mood];if(!times)throw Error('Humor inválido');let t=((elapsed%times.reduce((a,b)=>a+b,0))+times.reduce((a,b)=>a+b,0))%times.reduce((a,b)=>a+b,0);for(let i=0;i<8;i++){if(t<times[i])return i;t-=times[i];}return 0;}
function draw(ctx,config,mood,frame){
 const c=validate(config);if(!MOODS.includes(mood)||!Number.isInteger(frame)||frame<0||frame>7)throw Error('Quadro inválido');
 ctx.clearRect(0,0,256,256);ctx.save();ctx.scale(8,8);ctx.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const ink='#302b38',pink='#ef8e9f',bounce=mood==='happy'?[0,-1,-2,-1,0,-1,0,0][frame]:mood==='barking'&&frame>1&&frame<5?-1:0;
 ctx.translate(0,bounce);
 // A compact terrier silhouette with a wagging squared tail and four paws.
 r(8,18,17,9,ink);r(9,18,15,8,c.body);r(9,26,4,3,ink);r(11,26,2,2,c.muzzle);r(20,26,4,3,ink);r(20,26,2,2,c.muzzle);
 const tailY=18+[0,-1,-2,-1,0,1,2,1][frame],tailX=[0,0,0,1,1,1,1,0][frame];r(24,tailY,4,3,ink);r(26+tailX,tailY-3,3,4,ink);r(25,tailY,2,1,c.body);r(27+tailX,tailY-2,1,3,c.body);
 let tilt=mood==='sleeping'&&frame<4?1:0;ctx.translate(0,tilt);
 if(c.ears==='pointy'){r(7,5,6,10,ink);r(8,4,3,9,ink);r(9,6,2,6,c.body);r(20,4,4,11,ink);r(21,6,2,7,c.body);}else{const e=mood==='happy'&&frame%3===1?-1:0;r(5,10+e,6,13,ink);r(6,11+e,4,10,c.body);r(22,10-e,5,13,ink);r(23,11-e,3,10,c.body);}
 r(9,8,14,15,ink);r(8,11,16,10,ink);r(10,9,12,13,c.body);r(9,12,14,8,c.body);
 r(11,16,11,7,c.muzzle);r(10,18,13,3,c.muzzle);
 const closed=mood==='sleeping'&&frame!==5||mood==='waiting'&&[2,3,4].includes(frame)||mood==='happy'&&frame===4;
 if(closed){r(11,14,3,1,ink);r(19,14,3,1,ink);}else{r(12,12,2,3,ink);r(19,12,2,3,ink);r(12,12,1,1,'#ffffff');r(19,12,1,1,'#ffffff');}
 r(15,16,4,2,ink);r(16,18,2,1,ink);
 if(mood==='barking'&&frame>=2&&frame<=5){r(14,19,6,4,ink);r(15,21,4,2,pink);}else if(mood==='happy'){r(14,20,6,1,ink);r(16,21,3,frame%3===0?2:3,pink);}else r(15,20,4,1,ink);
 ctx.translate(0,-tilt);r(10,23,13,2,c.accessory);r(15,25,4,3,c.accessory);r(16,25,2,1,c.muzzle);
 ctx.restore();
}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function zipStore(files){
 const chunks=[],central=[];let offset=0;const enc=new TextEncoder();
 const header=(size)=>{const a=new Uint8Array(size);return [a,new DataView(a.buffer)];};
 for(const [path,data] of files){if(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..')||path.startsWith('/'))throw Error('Caminho ZIP inválido');const name=enc.encode(path),bytes=typeof data==='string'?enc.encode(data):data,crc=crc32(bytes);let [h,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);chunks.push(h,name,bytes);
 let [ch,cv]=header(46);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.push(ch,name);offset+=30+name.length+bytes.length;}
 const centralSize=central.reduce((n,a)=>n+a.length,0);let [end,ev]=header(22);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);const all=[...chunks,...central,end],out=new Uint8Array(all.reduce((n,a)=>n+a.length,0));let p=0;for(const a of all){out.set(a,p);p+=a.length;}return out;
}
const api={MOODS,TIMINGS,SLEEP_SIGNS,DEFAULT,validate,manifest,frameAt,draw,crc32,zipStore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PetCore=api;
})(globalThis);
