/* Inline mode switching: preserve existing editor nodes and all local state. */
(function(root){
'use strict';
const photo=document.querySelector('#photo-editor'),studio=document.querySelector('.studio'),form=document.querySelector('#editor');
const procedural=[form.querySelector('fieldset'),form.querySelector('[name="ears"]').closest('label'),document.querySelector('#species-fields')];
const title=document.querySelector('#editor-title'),note=document.querySelector('.preview-note');
function synchronize(){
 const active=root.PetPhotoEditor.active;
 photo.hidden=!active;photo.inert=!active;
 for(const element of procedural)if(element){element.hidden=active;element.inert=active;}
 title.textContent=active?'Prévia e exportação da foto':'Dê vida ao seu pet';
 note.textContent=active?'Recorte suave · efeitos seguem a cabeça marcada':'8 quadros por humor · fundo transparente · arte original';
 studio.querySelector('.preview').setAttribute('aria-label',active?'Prévia da foto pixelizada':'Prévia do mascote procedural');
 const species=form.elements.namedItem('species')?.value||'dog';
 const ears=form.elements.namedItem('ears').closest('label');ears.hidden=active||species!=='dog';ears.inert=ears.hidden;
 document.querySelector('[data-mood="barking"]').textContent=active||species==='dog'?'Latindo':'Chamando';
 document.querySelector('#preview').setAttribute('aria-label',active?'Recorte pixel art animado':'Personagem pixel art animado');
}
window.addEventListener('petphotochange',synchronize);form.addEventListener('input',synchronize);synchronize();
root.PetModeInline={synchronize};
})(globalThis);
