/* Local Canvas encoder + WebP RIFF muxer. Canvas WebP may be lossy; no lossless claim.
 * Specs: developers.google.com/speed/webp/docs/riff_container
 * github.com/WhatsApp/stickers/blob/main/Android/README.md
 */
(function(root){
'use strict';
const core=typeof module!=='undefined'&&module.exports?require('./pet-core.js'):root.PetCore;
const MAX_BYTES=500000, SIZE=512;
const ascii=(b,o,n)=>String.fromCharCode(...b.subarray(o,o+n));
function concat(parts){const out=new Uint8Array(parts.reduce((n,b)=>n+b.length,0));let p=0;for(const b of parts){out.set(b,p);p+=b.length;}return out;}
function uint(b,p,n,value){for(let i=0;i<n;i++){b[p+i]=value&255;value=Math.floor(value/256);}}
function read(b,p,n){let value=0;for(let i=n-1;i>=0;i--)value=value*256+b[p+i];return value;}
function chunk(tag,data){const b=new Uint8Array(8+data.length+(data.length%2));for(let i=0;i<4;i++)b[i]=tag.charCodeAt(i);uint(b,4,4,data.length);b.set(data,8);return b;}
function chunks(b,start=0,end=b.length){const out=[];for(let p=start;p<end;){if(p+8>end)throw Error('Cabeçalho RIFF truncado');const length=read(b,p+4,4),next=p+8+length+(length%2);if(next>end)throw Error('Chunk RIFF truncado');if(length%2&&b[next-1]!==0)throw Error('Padding RIFF inválido');out.push({tag:ascii(b,p,4),data:b.slice(p+8,p+8+length)});p=next;}return out;}
function riff(parts){const body=concat(parts),head=new Uint8Array(12);head.set([82,73,70,70]);uint(head,4,4,body.length+4);head.set([87,69,66,80],8);return concat([head,body]);}
function parseRiff(bytes){const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);if(b.length<12||ascii(b,0,4)!=='RIFF'||ascii(b,8,4)!=='WEBP'||read(b,4,4)!==b.length-8)throw Error('WebP RIFF inválido');return chunks(b,12);}
function frameData(bytes){const list=parseRiff(bytes);if(list.some(c=>c.tag==='ANIM'||c.tag==='ANMF'))throw Error('Esperado WebP estático por quadro');const images=list.filter(c=>c.tag==='VP8 '||c.tag==='VP8L');if(images.length!==1)throw Error('Bitstream WebP ausente ou duplicado');const image=images[0],d=image.data;let width,height,alpha=false;
 if(image.tag==='VP8L'){if(d.length<5||d[0]!==47||(d[4]&224)!==0)throw Error('Cabeçalho VP8L inválido');const bits=read(d,1,4);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;alpha=!!(bits&0x10000000);}
 else {if(d.length<10||(d[0]&1)||d[3]!==157||d[4]!==1||d[5]!==42)throw Error('Cabeçalho VP8 inválido');width=read(d,6,2)&16383;height=read(d,8,2)&16383;}
 const alph=list.filter(c=>c.tag==='ALPH');if(alph.length>1||(alph.length&&(image.tag!=='VP8 '||list.indexOf(alph[0])>list.indexOf(image)||!alph[0].data.length)))throw Error('ALPH inválido');alpha=alpha||alph.length>0;
 if(width!==SIZE||height!==SIZE)throw Error('Cada quadro precisa de 512 × 512 pixels');
 return {alpha,data:concat([...alph,image].map(c=>chunk(c.tag,c.data)))};
}
function muxAnimation(frames,durations){if(!Array.isArray(frames)||(frames.length<8||frames.length>64||frames.length%8!==0)||!Array.isArray(durations)||durations.length!==frames.length||durations.some(t=>!Number.isInteger(t)||t<8)||durations.reduce((a,b)=>a+b,0)>10000)throw Error('Use de 8 a 64 quadros em múltiplos de 8, tempos >=8 ms e ciclo <=10 s');const parsed=frames.map(frameData),vp8x=new Uint8Array(10);vp8x[0]=2|(parsed.some(f=>f.alpha)?16:0);uint(vp8x,4,3,511);uint(vp8x,7,3,511);const anim=new Uint8Array(6);const parts=[chunk('VP8X',vp8x),chunk('ANIM',anim)];for(let i=0;i<frames.length;i++){const header=new Uint8Array(16);uint(header,6,3,511);uint(header,9,3,511);uint(header,12,3,durations[i]);header[15]=2; // full frame, no blending; transparent pixels replace the previous pose
 parts.push(chunk('ANMF',concat([header,parsed[i].data])));}const out=riff(parts);if(out.length>MAX_BYTES)throw Error('Sticker excede 500 KB; simplifique a arte.');return out;}
function canvas(w,h){if(!root.document)throw Error('A exportação precisa de navegador com Canvas');const c=root.document.createElement('canvas');c.width=w;c.height=h;return c;}
function composeFrame(config,mood,index,renderer){const tile=canvas(256,256),t=tile.getContext('2d');if(renderer)renderer(t,config,mood,index);else core.draw(t,config,mood,index);if(renderer?.effects)renderer.effects(t,mood,index);const source=canvas(256,280),s=source.getContext('2d');s.drawImage(tile,0,24);const sign=mood==='sleeping'&&!renderer?.effects?core.SLEEP_SIGNS[index]:null;if(sign){const pixels=t.getImageData(0,0,256,256).data;let head=256;for(let y=0;y<256&&head===256;y++)for(let x=0;x<256;x++)if(pixels[(y*256+x)*4+3]>=128){head=y;break;}
 const [text,drift,row]=sign,scale=3,advance=12,originY=Math.max(0,head+24-8-15-(1-row)*6),x=Math.max(2,Math.min(256-text.length*advance-2,128+drift*advance)),glyphs={Z:['111','001','010','100','111'],z:['000','000','111','010','111']};s.fillStyle='#cdb7f6';[...text].forEach((char,i)=>glyphs[char].forEach((bits,y)=>[...bits].forEach((bit,col)=>{if(bit==='1')s.fillRect(x+i*advance+col*scale,originY+y*scale,scale,scale);})));}
 const out=canvas(512,512),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;const w=Math.round(256*480/280);ctx.drawImage(source,Math.floor((512-w)/2),16,w,480);return out;}
function encode(c,type,quality){return new Promise((resolve,reject)=>c.toBlob(async blob=>{try{if(!blob||blob.type!==type)throw Error('Este navegador não oferece exportação '+type);resolve(new Uint8Array(await blob.arrayBuffer()));}catch(error){reject(error);}},type,quality));}
// Match the existing GIF pipeline: rounded cumulative 10 ms boundaries.
function durationsFor(mood,subdivisions=1){if(![1,4].includes(subdivisions)||!core.MOODS.includes(mood))throw Error('Subdivisão inválida');let elapsed=0,last=0;return core.TIMINGS[mood].flatMap(t=>Array.from({length:subdivisions},()=>{elapsed+=t/subdivisions;const boundary=Math.floor((elapsed+5)/10)*10,result=boundary-last;last=boundary;return result;}));}
async function exportMood(config,mood,renderer){const c=core.validate(config);if(!core.MOODS.includes(mood))throw Error('Humor inválido');const frames=[],subdivisions=renderer?.smooth?4:1;for(let i=0;i<8*subdivisions;i++)frames.push(await encode(composeFrame(c,mood,i/subdivisions,renderer),'image/webp',0.95));return muxAnimation(frames,durationsFor(mood,subdivisions));}
async function exportPack(config,renderer){const c=core.validate(config),files=[['title.txt',c.name+' animado\n'],['author.txt',c.author+'\n']];const cover=canvas(96,96);cover.getContext('2d').drawImage(composeFrame(c,'happy',0,renderer),0,0,96,96);const png=await encode(cover,'image/png');if(png.length>50000)throw Error('Capa excede 50 KB');files.push(['cover.png',png]);for(const mood of core.MOODS)files.push([c.id+'-'+mood+'.webp',await exportMood(c,mood,renderer)]);return core.zipStore(files);}
const api={exportPack,exportMood,composeFrame,muxAnimation,parseRiff,frameData,durationsFor,MAX_BYTES,encodingNote:'Canvas WebP pode usar compressão com perdas; cores visíveis podem variar. Importação .wastickers depende de aplicativo compatível.'};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PetStickers=api;
})(globalThis);
