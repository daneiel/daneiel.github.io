/* Original procedural artwork. No third-party assets or runtime dependencies. */
(function(root){
'use strict';
const MOODS=['happy','barking','waiting','sleeping'];
const TIMINGS={happy:[240,96,96,80,80,96,96,176],barking:[360,64,64,160,128,64,64,240],waiting:[1440,120,80,80,80,80,120,400],sleeping:[1000,180,240,650,220,400,250,800]};
const SLEEP_SIGNS=[['z',-2,1],['zZ',-1,1],['ZzZ',0,0],['ZzZ',1,0],null,null,['z',-2,1],['Zz',-1,1]];
const SPECIES=Object.freeze([
 ['dog','Cachorro',[['srd','SRD'],['shih-tzu','Shih-tzu'],['poodle','Poodle'],['labrador','Labrador'],['pinscher','Pinscher']]],
 ['cat','Gato',[['srd','SRD'],['siames','Siamês'],['persa','Persa']]],
 ['duck','Pato'],['chicken','Galinha'],['chick','Pintinho'],
 ['rabbit','Coelho',[['comum','Comum'],['mini-lop','Mini-lop'],['angora','Angorá']]],
 ['cow','Vaca',[['holandesa','Holandesa'],['gir','Gir'],['jersey','Jersey']]],
 ['ox','Boi'],['llama','Lhama'],['camel','Camelo'],
 ['bird','Passarinho',[['calopsita','Calopsita'],['papagaio','Papagaio'],['canario','Canário']]],
 ['lizard','Lagarto',[['iguana','Iguana'],['lagarto','Lagarto'],['camaleao','Camaleão']]]
].map(([id,label,breeds])=>Object.freeze({id,label,breeds:Object.freeze((breeds||[['comum','Comum']]).map(([id,label])=>Object.freeze({id,label})))})));
const DEFAULT={version:1,id:'meu-companheiro',name:'Pingo',author:'Comunidade ViraPets',body:'#bd8155',muzzle:'#f6dfb2',accessory:'#7062d9',ears:'floppy',species:'dog',breed:'srd'};
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('A receita deve ser um objeto JSON.');
 const c={};for(const key of Object.keys(DEFAULT)){if(!Object.hasOwn(value,key)){if(key==='species'||key==='breed')continue;throw Error('Campo ausente: '+key);}c[key]=value[key];}
 if(c.version!==1)throw Error('Versão de receita não suportada.');
 if(typeof c.id!=='string'||! /^[a-z][a-z0-9-]{0,47}$/.test(c.id))throw Error('ID: use de 1 a 48 letras minúsculas, números e hífens, começando por letra.');
 for(const key of ['name','author'])if(typeof c[key]!=='string'||!c[key].trim()||c[key].length>80)throw Error('Nome e autor precisam de 1 a 80 caracteres.');
 for(const key of ['body','muzzle','accessory'])if(typeof c[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(c[key]))throw Error('Cor inválida: '+key);
 if(!['floppy','pointy'].includes(c.ears))throw Error('Tipo de orelha inválido.');
 c.species=c.species===undefined?'dog':c.species;const species=SPECIES.find(s=>s.id===c.species);if(!species)throw Error('Espécie inválida.');
 c.breed=c.breed===undefined?species.breeds[0].id:c.breed;if(!species.breeds.some(b=>b.id===c.breed))throw Error('Variedade inválida para a espécie.');
 c.name=c.name.trim();c.author=c.author.trim();return c;
}
function manifest(config){const c=validate(config);return {id:c.id,name:c.name,author:c.author,description:SPECIES.find(s=>s.id===c.species).label+' pixel art original criado no editor procedural ViraPets.',species:c.species,breed:c.breed,status:'draft',timings:JSON.parse(JSON.stringify(TIMINGS)),sleepSigns:JSON.parse(JSON.stringify(SLEEP_SIGNS))};}
function frameAt(mood,elapsed){const times=TIMINGS[mood];if(!times)throw Error('Humor inválido');let t=((elapsed%times.reduce((a,b)=>a+b,0))+times.reduce((a,b)=>a+b,0))%times.reduce((a,b)=>a+b,0);for(let i=0;i<8;i++){if(t<times[i])return i;t-=times[i];}return 0;}
function draw(ctx,config,mood,frame){
 const c=validate(config);if(!MOODS.includes(mood)||!Number.isInteger(frame)||frame<0||frame>7)throw Error('Quadro inválido');
 if(c.species!=='dog'){drawSpecies(ctx,c,mood,frame);return;}
 ctx.clearRect(0,0,256,256);ctx.save();ctx.scale(8,8);ctx.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const ink='#302b38',pink='#ef8e9f',bounce=mood==='happy'?[0,-1,-2,-1,0,-1,0,0][frame]:mood==='barking'&&frame>1&&frame<5?-1:0;
 ctx.translate(0,bounce);
 // A compact terrier silhouette with a wagging squared tail and four paws.
 r(8,18,17,9,ink);r(9,18,15,8,c.body);r(9,26,4,3,ink);r(11,26,2,2,c.muzzle);r(20,26,4,3,ink);r(20,26,2,2,c.muzzle);
 const tailY=18+[0,-1,-2,-1,0,1,2,1][frame],tailX=[0,0,0,1,1,1,1,0][frame];r(24,tailY,4,3,ink);r(26+tailX,tailY-3,3,4,ink);r(25,tailY,2,1,c.body);r(27+tailX,tailY-2,1,3,c.body);
 let tilt=mood==='sleeping'&&frame<4?1:0;ctx.translate(0,tilt);
 if(c.ears==='pointy'||c.breed==='pinscher'){r(7,5,6,10,ink);r(8,4,3,9,ink);r(9,6,2,6,c.body);r(20,4,4,11,ink);r(21,6,2,7,c.body);}else{const e=mood==='happy'&&frame%3===1?-1:0;r(5,10+e,6,13,ink);r(6,11+e,4,10,c.body);r(22,10-e,5,13,ink);r(23,11-e,3,10,c.body);}
 r(9,8,14,15,ink);r(8,11,16,10,ink);r(10,9,12,13,c.body);r(9,12,14,8,c.body);
 r(11,16,11,7,c.muzzle);r(10,18,13,3,c.muzzle);
 const closed=mood==='sleeping'&&frame!==5||mood==='waiting'&&[2,3,4].includes(frame)||mood==='happy'&&frame===4;
 if(closed){r(11,14,3,1,ink);r(19,14,3,1,ink);}else{r(12,12,2,3,ink);r(19,12,2,3,ink);r(12,12,1,1,'#ffffff');r(19,12,1,1,'#ffffff');}
 r(15,16,4,2,ink);r(16,18,2,1,ink);
 if(mood==='barking'&&frame>=2&&frame<=5){r(14,19,6,4,ink);r(15,21,4,2,pink);}else if(mood==='happy'){r(14,20,6,1,ink);r(16,21,3,frame%3===0?2:3,pink);}else r(15,20,4,1,ink);
 if(c.breed==='shih-tzu'){r(10,9,3,4,c.muzzle);r(20,9,3,4,c.muzzle);r(12,20,2,3,c.body);r(20,20,2,3,c.body);}
 if(c.breed==='poodle'){r(8,7,16,3,ink);r(9,7,14,3,c.body);r(5,18,5,6,c.muzzle);r(23,18,5,6,c.muzzle);}
 if(c.breed==='labrador'){r(10,17,3,5,c.body);r(21,17,2,5,c.body);r(12,21,9,2,c.muzzle);}
 if(c.breed==='pinscher'){r(10,10,3,1,c.muzzle);r(20,10,2,1,c.muzzle);r(11,24,2,2,c.muzzle);}
 ctx.translate(0,-tilt);r(10,23,13,2,c.accessory);r(15,25,4,3,c.accessory);r(16,25,2,1,c.muzzle);
 ctx.restore();
}
// Species use a shared pixel vocabulary, with independently constructed silhouettes.
// The historic barking key means an expressive/vocal pose for every species.
function drawSpecies(ctx,c,mood,frame){
 ctx.clearRect(0,0,256,256);ctx.save();ctx.scale(8,8);ctx.imageSmoothingEnabled=false;
 const ink='#302b38',pink='#ef8e9f',r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const box=(x,y,w,h,color=c.body)=>{r(x,y,w,h,ink);if(w>2&&h>2)r(x+1,y+1,w-2,h-2,color);};
 const wag=[0,-1,-2,-1,0,1,2,1][frame];
 ctx.translate(0,mood==='happy'?[0,-1,-2,-1,0,-1,0,0][frame]:mood==='barking'&&frame>1&&frame<5?-1:0);
 const closed=mood==='sleeping'&&![4,5].includes(frame)||mood==='waiting'&&[2,3,4].includes(frame)||mood==='happy'&&frame===4;
 const face=(x,y,spacing=7)=>{for(const xx of [x,x+spacing]){r(xx,y,2,closed?1:3,ink);if(!closed)r(xx,y,1,1,'#ffffff');}
 r(x+3,y+4,3,2,ink);if(mood==='barking'&&frame>=2&&frame<=5){r(x+2,y+6,5,3,ink);r(x+3,y+7,3,2,pink);}else if(mood==='happy')r(x+3,y+6,2,2,pink);};
 const feet=(a,b,y=26)=>{box(a,y,4,3,c.muzzle);box(b,y,4,3,c.muzzle);};
 switch(c.species){
 case 'cat':
  box(9,18,15,10);feet(10,20);box(24,14+wag,3,10);box(23,12+wag,4,3);
  box(7,5,6,10);box(20,5,6,10);r(9,7,2,5,pink);r(22,7,2,5,pink);box(8,10,17,13);
  if(c.breed==='persa'){box(6,13,3,8);box(24,13,3,8);r(10,20,13,3,c.muzzle);}
  if(c.breed==='siames'){r(8,11,4,8,c.accessory);r(21,11,4,8,c.accessory);r(13,16,8,6,c.accessory);}
  face(11,13);r(5,18,6,1,ink);r(22,18,6,1,ink);r(6,20,5,1,ink);r(22,20,5,1,ink);break;
 case 'rabbit':
  box(8,17,17,11);feet(8,21);box(24,20+wag,5,5,c.muzzle);
  if(c.breed==='mini-lop'){box(5,10,5,14);box(23,10,5,14);}else{box(9,2,5,13);box(19,2,5,13);r(11,4,1,8,pink);r(21,4,1,8,pink);}
  box(8,11,17,13);if(c.breed==='angora'){box(6,17,4,7,c.muzzle);box(23,17,4,7,c.muzzle);r(10,24,13,2,c.muzzle);}face(11,14);r(15,21,3,2,c.muzzle);break;
 case 'duck':case 'chicken':case 'chick':case 'bird':{
  const chick=c.species==='chick',bird=c.species==='bird',duck=c.species==='duck';
  box(chick?10:8,17,chick?13:17,10);r(11,27,3,2,ink);r(20,27,3,2,ink);r(10,29,5,1,c.muzzle);r(19,29,5,1,c.muzzle);
  box(23,16+wag,5,5);box(10,8,13,14);box(9,18+Math.sign(wag),7,7,c.muzzle);
  if(duck){box(16,17,11,4,c.muzzle);}else{box(20,16,6,4,c.muzzle);}
  if(c.species==='chicken'){box(12,4,4,6,pink);box(16,5,4,5,pink);r(19,20,3,4,pink);box(24,12+wag,4,7);}
  if(chick){r(14,6,2,3,ink);r(16,7,2,2,c.body);}
  if(bird){if(c.breed==='calopsita'){r(13,3,2,6,ink);r(16,2,2,7,c.muzzle);r(19,4,2,5,ink);r(11,17,3,3,pink);}if(c.breed==='papagaio'){box(20,15,6,6,c.muzzle);r(22,18,2,4,ink);}if(c.breed==='canario'){r(11,9,9,2,c.muzzle);box(24,20+wag,4,7,c.muzzle);}}
  r(14,12,2,closed?1:3,ink);if(mood==='barking'&&frame>=2&&frame<=5)r(21,18,4,2,ink);break;}
 case 'cow':case 'ox':
  box(6,18,21,9);feet(7,22);box(27,19+wag,3,7);r(28,24+wag,2,3,ink);
  box(5,8,5,4,c.muzzle);box(23,8,5,4,c.muzzle);box(8,10,17,14);
  box(7,5,4,c.species==='ox'?8:5,c.muzzle);box(22,5,4,c.species==='ox'?8:5,c.muzzle);
  if(c.breed==='holandesa'){r(7,19,6,5,c.accessory);r(21,21,5,4,c.accessory);r(9,11,5,5,c.accessory);}if(c.breed==='gir'){box(4,12,5,8);box(24,12,5,8);box(20,16,5,4);}if(c.breed==='jersey')r(13,10,7,3,c.muzzle);
  face(11,12);box(10,19,14,6,c.muzzle);r(13,21,2,2,ink);r(20,21,2,2,ink);break;
 case 'llama':case 'camel':{
  const camel=c.species==='camel';box(11,19,16,8);feet(12,22);box(7,10,7,15);box(5,7,12,9);
  if(camel){box(17,14,7,8);box(24,16,5,7);box(3,11,7,5,c.muzzle);box(7,5,4,4);}else{box(6,3,4,7);box(13,3,4,7);r(8,3,1,4,pink);box(10,18,5,8,c.muzzle);}
  box(27,20+wag,3,6);r(8,10,2,closed?1:3,ink);if(mood==='barking'&&frame>=2&&frame<=5)r(5,14,4,2,ink);break;}
 case 'lizard':
  box(8,19,18,7);box(23,21+Math.sign(wag),7,4);box(27,18+wag,3,5);feet(9,20,25);box(6,11,16,12);box(4,16,8,6,c.muzzle);
  if(c.breed==='iguana'){for(let x=10;x<=23;x+=3)box(x,16,3,5,c.accessory);r(8,22,5,3,c.muzzle);}if(c.breed==='camaleao'){box(24,17+wag,6,9);r(26,19+wag,2,5,c.muzzle);box(8,7,9,6);box(6,12,5,5,c.muzzle);}if(c.breed==='lagarto'){r(13,20,9,2,c.accessory);r(19,23,5,1,c.muzzle);}
  r(9,13,2,closed?1:3,ink);if(mood==='barking'&&frame>=2&&frame<=5)r(5,20,6,1,pink);break;
 }
 r(11,24,9,2,c.accessory);ctx.restore();
}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function zipStore(files){
 const chunks=[],central=[];let offset=0;const enc=new TextEncoder();
 const header=(size)=>{const a=new Uint8Array(size);return [a,new DataView(a.buffer)];};
 for(const [path,data] of files){if(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..')||path.startsWith('/'))throw Error('Caminho ZIP inválido');const name=enc.encode(path),bytes=typeof data==='string'?enc.encode(data):data,crc=crc32(bytes);let [h,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);chunks.push(h,name,bytes);
 let [ch,cv]=header(46);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.push(ch,name);offset+=30+name.length+bytes.length;}
 const centralSize=central.reduce((n,a)=>n+a.length,0);let [end,ev]=header(22);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);const all=[...chunks,...central,end],out=new Uint8Array(all.reduce((n,a)=>n+a.length,0));let p=0;for(const a of all){out.set(a,p);p+=a.length;}return out;
}
const api={SPECIES,MOODS,TIMINGS,SLEEP_SIGNS,DEFAULT,validate,manifest,frameAt,draw,crc32,zipStore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PetCore=api;
})(globalThis);
