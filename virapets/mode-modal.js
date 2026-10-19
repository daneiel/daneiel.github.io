/* Move the existing editor nodes into one native modal; no state is cloned. */
(function (root) {
'use strict';
function initialize() {
  if (root.PetModeModal) return;
  const section = document.querySelector('#studio-view .photo-section');
  const studio = document.querySelector('#studio-view .studio');
  const modes = section?.querySelector('.mode-switch');
  const photo = document.getElementById('photo-editor');
  if (!section || !studio || !modes || !photo || !root.PetPhotoEditor) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'pet-mode-modal';
  dialog.className = 'photo-section pet-mode-modal';
  dialog.setAttribute('aria-labelledby', 'pet-mode-modal-title');
  const heading = document.createElement('div');
  heading.className = 'pet-mode-modal-heading';
  const title = document.createElement('h2');
  title.id = 'pet-mode-modal-title';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.id = 'close-mode-modal';
  closeButton.textContent = 'Fechar editor ×';
  heading.append(title, closeButton);
  dialog.append(heading, modes, photo, studio);
  document.body.append(dialog);
  section.removeAttribute('aria-labelledby');
  section.setAttribute('aria-label', 'Abrir criador de pet');
  const launchers = {};
  for (const [mode, text] of [['procedural', 'Criar desenho procedural'], ['photo', 'Criar a partir de foto']]) {
    const button = document.createElement('button');
    button.id = 'open-' + mode + '-modal';
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', dialog.id);
    button.addEventListener('click', () => open(mode, button));
    launchers[mode] = button;
    section.append(button);
  }
  const colorFields = studio.querySelector('#editor fieldset');
  const ears = studio.querySelector('#editor select[name="ears"]')?.closest('label');
  const editorTitle = studio.querySelector('#editor-title');
  const note = studio.querySelector('.preview-note');
  const originalTitle = editorTitle?.textContent;
  const originalNote = note?.textContent;
  const eyebrow = studio.querySelector('.controls > .eyebrow');
  const originalEyebrow = eyebrow?.textContent;
  let returnFocus = null;
  let previousOverflow = '';
  function synchronize() {
    const active = root.PetPhotoEditor.active;
    dialog.dataset.mode = active ? 'photo' : 'procedural';
    title.textContent = active ? 'Criar pet com foto' : 'Criar desenho procedural';
    for (const element of [colorFields, ears]) {
      if (element) { element.hidden = active; element.inert = active; }
    }
    photo.hidden = !active;
    photo.inert = !active;
    if (editorTitle) editorTitle.textContent = active ? 'Prévia e exportação da foto' : originalTitle;
    if (eyebrow) eyebrow.textContent = active ? 'SUA FOTO EM PIXELS' : originalEyebrow;
    if (note) note.textContent = active ? 'Prévia do recorte pixelizado · exportações da foto ativa' : originalNote;
    studio.querySelector('.preview')?.setAttribute('aria-label', active ? 'Prévia da foto pixelizada' : 'Prévia do mascote procedural');
  }
  function open(mode, trigger) {
    if (mode !== 'photo' && mode !== 'procedural') throw new TypeError('Modo inválido');
    returnFocus = trigger || launchers[mode];
    root.PetPhotoEditor.setMode(mode === 'photo');
    synchronize();
    if (!dialog.open) {
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    dialog.scrollTop = 0;
    document.getElementById('mode-' + mode).focus();
  }
  function close() { if (dialog.open) dialog.close(); }
  const themeButton=document.createElement('button');themeButton.id='modal-theme-toggle';themeButton.type='button';themeButton.textContent='Alternar tema';themeButton.addEventListener('click',()=>document.getElementById('theme-toggle').click());closeButton.before(themeButton);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    if (returnFocus?.isConnected && location.hash !== '#prompt') returnFocus.focus();
  });
  // Capture runs before the existing hash router focuses the prompt heading.
  dialog.addEventListener('click', event => {
    if (event.target.closest('a[href="#prompt"]')) close();
  }, true);
  root.addEventListener('hashchange', () => { if (location.hash === '#prompt') close(); });
  root.addEventListener('petphotochange', synchronize);
  const style = document.createElement('style');
  style.textContent = `
#studio-view > .photo-section{display:flex;flex-wrap:wrap;gap:12px}
#pet-mode-modal{color:var(--text-primary);background:var(--surface-0);border:1px solid var(--border-strong);border-radius:20px;width:min(1120px,calc(100% - 32px));max-width:none;max-height:calc(100dvh - 32px);margin:auto;padding:24px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
#pet-mode-modal::backdrop{background:var(--surface-0);opacity:1}
#pet-mode-modal .pet-mode-modal-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
#pet-mode-modal .pet-mode-modal-heading h2{margin:0;font-size:24px}
#pet-mode-modal .studio{margin-top:24px;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}#pet-mode-modal .studio>section{min-width:0}
#pet-mode-modal button,#pet-mode-modal summary,#pet-mode-modal input:not([type=checkbox]),#pet-mode-modal select{min-height:44px}
#pet-mode-modal button,#pet-mode-modal input[type=color]{min-width:44px}
#pet-mode-modal :focus-visible{outline:3px solid var(--accent);outline-offset:3px}
#pet-mode-modal [hidden]{display:none!important}
@media(max-width:760px){#pet-mode-modal{width:calc(100% - 16px);max-height:calc(100dvh - 16px);padding:16px;border-radius:14px}#pet-mode-modal .pet-mode-modal-heading{align-items:flex-start}#pet-mode-modal .pet-mode-modal-heading h2{font-size:21px}#pet-mode-modal .mode-switch{position:relative}#pet-mode-modal .photo-inputs label{min-width:0}#pet-mode-modal .studio{gap:20px;grid-template-columns:minmax(0,1fr)}#studio-view > .photo-section > button{flex:1;min-width:200px}}
`;
  document.head.append(style);
  synchronize();
  root.PetModeModal = { open, close };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();
})(globalThis);
