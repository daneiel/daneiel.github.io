/* One shared preview/export node lives inside the active inline editor. */
(function(root){
'use strict';
const photo=document.querySelector('#photo-editor'),studio=document.querySelector('.studio'),form=document.querySelector('#editor');
const procedural=document.createElement('section');procedural.id='procedural-editor';procedural.setAttribute('aria-label','Editor de desenho procedural');
studio.before(procedural);procedural.append(studio);const how=document.querySelector('.how');if(how)procedural.append(how);
const photoOutput=document.createElement('div');photoOutput.id='photo-output';photo.append(photoOutput);
// Keep recipe recovery available even when a photo has no finished art yet.
const importer=document.querySelector('label.import'),shared=document.createElement('div');shared.className='shared-recipe';document.querySelector('.mode-switch').after(shared);shared.append(importer);
const fields=[form.querySelector('fieldset'),form.querySelector('[name="ears"]').closest('label'),document.querySelector('#species-fields')];
const title=document.querySelector('#editor-title'),note=document.querySelector('.preview-note'),eyebrow=document.querySelector('.controls > .eyebrow');
function synchronize(){
 const active=root.PetPhotoEditor.active,ready=root.PetPhotoEditor.hasArt;
 photo.hidden=!active;photo.inert=!active;
 procedural.hidden=active;procedural.inert=active;
 const destination=active?photoOutput:procedural;if(studio.parentElement!==destination)destination.prepend(studio);
 studio.hidden=active&&!ready;studio.inert=studio.hidden;
 photoOutput.hidden=!ready;photoOutput.inert=!ready;
 for(const element of fields)if(element){element.hidden=active;element.inert=active;}
 title.textContent=active?'Prévia e exportação da foto':'Dê vida ao seu pet';
 eyebrow.textContent=active?'SUA FOTO EM PIXELS':'DO SEU JEITO';
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
