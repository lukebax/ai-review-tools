/* Format prototype. All dependencies and the image are bundled. */
const params = new URLSearchParams(window.location.search);
const printMode = params.has('print-pdf');
const deck = new Reveal({
  width:1280,height:720,margin:printMode?0:0.07,minScale:0.1,maxScale:3,
  center:false,view:'slide',scrollActivationWidth:null,
  controls:true,controlsTutorial:false,controlsBackArrows:'faded',
  progress:true,slideNumber:'c/t',hash:true,keyboard:true,touch:true,
  navigationMode:'linear',transition:'none',backgroundTransition:'none',
  autoSlide:0,pdfMaxPagesPerSlide:1,pdfSeparateFragments:false,pdfPageHeightOffset:0,
  keyboardCondition:event=>!event.target.closest('[role=tab],input,textarea,select,[contenteditable=true]') && !(event.target.closest('button') && [' ','Enter'].includes(event.key))
});
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab){
  tabs.forEach(item=>{
    const selected=item===tab;
    item.setAttribute('aria-selected',String(selected));
    item.tabIndex=selected?0:-1;
    document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;
  });
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();event.stopPropagation();selectTab(tabs[next]);tabs[next].focus();}
  });
});
let toolsTimer;
function wakeTools(){
  document.body.classList.add('tools-awake');
  clearTimeout(toolsTimer);
  toolsTimer=setTimeout(()=>document.body.classList.remove('tools-awake'),3000);
}
document.addEventListener('pointermove',wakeTools);
document.addEventListener('keydown',wakeTools);
wakeTools();
document.getElementById('export-pdf').addEventListener('click',()=>{
  const url=new URL(window.location.href);
  url.searchParams.set('print-pdf','');
  window.location.href=url.href;
});
document.getElementById('back-to-slides').addEventListener('click',()=>{
  const url=new URL(window.location.href);
  url.searchParams.delete('print-pdf');
  window.location.href=url.href;
});
document.getElementById('print-pdf').addEventListener('click',()=>window.print());
const fullscreenButton=document.getElementById('fullscreen');
fullscreenButton.hidden=!document.fullscreenEnabled;
fullscreenButton.addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{fullscreenButton.textContent='Use browser full screen';}
});
document.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
document.querySelector('.print-tools').hidden=!printMode;
deck.initialize().then(()=>{
  if(printMode)document.querySelectorAll('section.slide').forEach(slide=>{slide.hidden=false;slide.removeAttribute('aria-hidden');slide.removeAttribute('inert');});
});

// A direct offline PDF route, independent of browser print-dialog support.
// Each page is a high-resolution static image. Native printing retains text.
const downloadButton=document.getElementById('download-pdf');
downloadButton.addEventListener('click',async()=>{
  downloadButton.disabled=true;
  const status=document.getElementById('pdf-status');
  try{
    await document.fonts.ready;
    await Promise.all([...document.images].map(image=>image.decode()));
    const pdf=new jspdf.jsPDF({orientation:'landscape',unit:'pt',format:[960,540],compress:true});
    const slides=[...document.querySelectorAll('section.slide')];
    for(let i=0;i<slides.length;i++){
      status.textContent=`Preparing slide ${i+1} of ${slides.length}…`;
      const canvas=await html2canvas(slides[i],{scale:2,width:1280,height:720,backgroundColor:'#f7f9fa',logging:false});
      if(i)pdf.addPage([960,540],'landscape');
      pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,0,960,540);
    }
    pdf.setProperties({title:'A different way to present — prototype',subject:'Four 16:9 test slides',creator:'HTML presentation prototype'});
    pdf.save('html-presentation-prototype.pdf');
    status.textContent='PDF downloaded: four static 16:9 pages. Text is part of each slide image.';
  }catch(error){
    status.textContent='PDF download could not finish. Try Print / Save PDF in Chrome instead.';
    console.error('PDF export failed',error);
  }finally{downloadButton.disabled=false;}
});
