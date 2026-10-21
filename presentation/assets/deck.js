const printMode = new URLSearchParams(location.search).has('print-pdf');
window.deck = new Reveal({width:1280,height:720,margin:printMode?0:.07,minScale:.1,maxScale:3,center:false,view:'slide',scrollActivationWidth:null,controls:true,controlsTutorial:false,controlsBackArrows:'faded',progress:true,slideNumber:'c/t',hash:true,keyboard:true,touch:true,navigationMode:'linear',transition:'none',backgroundTransition:'none',autoSlide:0,pdfMaxPagesPerSlide:1,pdfSeparateFragments:false,pdfPageHeightOffset:0,keyboardCondition:event=>!event.target.closest('input,textarea,select,[contenteditable=true]') && !(event.target.closest('button,a') && [' ','Enter'].includes(event.key))});
window.presentationReady=deck.initialize().then(()=>{if(printMode)document.querySelectorAll('section.slide').forEach(s=>{s.hidden=false;s.removeAttribute('aria-hidden');s.removeAttribute('inert')});});
let timer;function wake(){document.body.classList.add('tools-awake');clearTimeout(timer);timer=setTimeout(()=>document.body.classList.remove('tools-awake'),2500)}document.addEventListener('pointermove',wake);document.addEventListener('keydown',wake);wake();
const full=document.getElementById('fullscreen');full.hidden=!document.fullscreenEnabled;full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{full.textContent='Use browser full screen'}});document.addEventListener('fullscreenchange',()=>full.textContent=document.fullscreenElement?'Exit full screen':'Full screen');

// Local-file browsers may open a PDF instead of honoring the download attribute.
if(location.protocol==='file:'){
  const pdf=document.querySelector('.toolbar a[download]');
  pdf.removeAttribute('download');pdf.target='_blank';pdf.rel='noopener';
  pdf.textContent='Open PDF';
}
