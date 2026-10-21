const printMode = new URLSearchParams(location.search).has('print-pdf');
window.deck = new Reveal({plugins:printMode?[]:[RevealNotes],showNotes:false,width:1280,height:720,margin:printMode?0:.07,minScale:.1,maxScale:3,center:false,view:'slide',scrollActivationWidth:null,controls:true,controlsTutorial:false,controlsBackArrows:'faded',progress:true,slideNumber:false,hash:true,keyboard:true,touch:true,navigationMode:'linear',transition:'none',backgroundTransition:'none',autoSlide:0,pdfMaxPagesPerSlide:1,pdfSeparateFragments:false,pdfPageHeightOffset:0,keyboardCondition:event=>!event.target?.closest?.('input,textarea,select,[contenteditable=true]') && !(event.target?.closest?.('button,a') && [' ','Enter'].includes(event.key))});
// Printing finishes after Reveal initialization; expose its actual ready event.
window.printReady=printMode?new Promise(resolve=>deck.on('pdf-ready',resolve)):Promise.resolve();
window.presentationReady=deck.initialize().then(()=>{if(printMode)document.querySelectorAll('section.slide').forEach(s=>{s.hidden=false;s.removeAttribute('aria-hidden');s.removeAttribute('inert')});});
let timer;function wake(){document.body.classList.add('tools-awake');clearTimeout(timer);timer=setTimeout(()=>document.body.classList.remove('tools-awake'),2500)}document.addEventListener('pointermove',wake);document.addEventListener('keydown',wake);wake();
const full=document.getElementById('fullscreen');full.hidden=!document.fullscreenEnabled;full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{full.textContent='Use browser full screen'}});document.addEventListener('fullscreenchange',()=>full.textContent=document.fullscreenElement?'Exit full screen':'Full screen');

// Local-file browsers may open a PDF instead of honoring the download attribute.
if(location.protocol==='file:'){
  const pdf=document.querySelector('.toolbar a[download]');
  pdf.removeAttribute('download');pdf.target='_blank';pdf.rel='noopener';
  pdf.textContent='Open PDF';
}

// Notes live in a separate presenter window; never put them on audience slides.
const notesButton=document.getElementById('presenter-notes');
const openNotes=()=>{
  if(location.protocol==='file:'){
    alert('For presenter notes, open the presentation on GitHub Pages or through the local preview server (python3 preview.py).');
    return;
  }
  try{if(!localStorage.getItem('reveal-speaker-layout'))localStorage.setItem('reveal-speaker-layout','wide')}catch{}
  try{deck.getPlugin('notes').open()}
  catch{alert('The presenter window could not open. Allow pop-ups for this site, then try Presenter notes again.')}
};
notesButton.addEventListener('click',openNotes);
window.presentationReady.then(()=>{
  if(!printMode && !deck.isSpeakerNotes()){
    deck.addKeyBinding({keyCode:83,key:'S',description:'Presenter notes'},openNotes);
  }
  if(deck.isSpeakerNotes())document.querySelector('.toolbar').hidden=true;
});

// Each new passage should start at the top, even after reading a long note.
let presenterWindow=null;
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.source?.opener!==window || typeof event.data!=='string')return;
  try{
    const message=JSON.parse(event.data);
    if(message.namespace==='reveal-notes' && message.type==='connected')presenterWindow=event.source;
  }catch{}
});
deck.on('slidechanged',()=>{
  if(presenterWindow && !presenterWindow.closed){
    presenterWindow.document.getElementById('speaker-controls')?.scrollTo(0,0);
  }
});
