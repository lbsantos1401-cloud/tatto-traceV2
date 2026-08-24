(() => {
  const $ = id => document.getElementById(id);
  const input=$("imageInput"), empty=$("emptyState"), stage=$("stage"), canvas=$("imageCanvas");
  const ctx=canvas.getContext("2d",{willReadFrequently:true}), lock=$("lockButton"), badge=$("lockedBadge");
  const zoom=$("zoomSlider"), zoomValue=$("zoomValue"), contrast=$("contrastSlider"), contrastValue=$("contrastValue");
  const ruler=$("ruler"), rulerSettings=$("rulerSettings"), pxInput=$("pxPerCm"), toast=$("toast");

  let img=new Image(), loaded=false, scale=1, x=0, y=0, mirror=1, lineMode=false, locked=false;
  let contrastValueNum=0, baseScale=1, dragging=false, lastX=0, lastY=0, toastTimer;
  let pxPerCm=Number(localStorage.getItem("tattoo_px_per_cm")||37.8);

  pxInput.value=pxPerCm;

  function toastMsg(s){clearTimeout(toastTimer);toast.textContent=s;toast.classList.add("show");toastTimer=setTimeout(()=>toast.classList.remove("show"),1700)}
  function resize(){canvas.width=stage.clientWidth*devicePixelRatio;canvas.height=stage.clientHeight*devicePixelRatio;canvas.style.width=stage.clientWidth+"px";canvas.style.height=stage.clientHeight+"px";draw()}
  function effectiveScale(){return baseScale*scale}
  function fit(){
    const s=Math.min((stage.clientWidth*.82)/img.naturalWidth,(stage.clientHeight*.72)/img.naturalHeight);
    baseScale=Math.max(.05,s);scale=1;x=stage.clientWidth/2;y=stage.clientHeight/2;zoom.value=100;zoomValue.textContent="100%";draw()
  }
  function draw(){
    if(!loaded)return;
    const d=devicePixelRatio,w=canvas.width/d,h=canvas.height/d;
    ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
    ctx.save();ctx.translate(x,y);ctx.scale(effectiveScale()*mirror,effectiveScale());
    ctx.translate(-img.naturalWidth/2,-img.naturalHeight/2);
    ctx.filter=`contrast(${100+contrastValueNum}%)`;
    ctx.drawImage(img,0,0);
    ctx.restore();ctx.filter="none";
    if(lineMode) applyLineArt(w,h);
  }
  function applyLineArt(w,h){
    const data=ctx.getImageData(0,0,canvas.width,canvas.height), a=data.data, copy=new Uint8ClampedArray(a);
    const W=canvas.width,H=canvas.height;
    for(let yy=1;yy<H-1;yy++){
      for(let xx=1;xx<W-1;xx++){
        const i=(yy*W+xx)*4, r=(yy*W+xx+1)*4, b=((yy+1)*W+xx)*4;
        const lum=(r0,g0,b0)=>0.299*r0+0.587*g0+0.114*b0;
        const c=lum(copy[i],copy[i+1],copy[i+2]), rx=lum(copy[r],copy[r+1],copy[r+2]), by=lum(copy[b],copy[b+1],copy[b+2]);
        const edge=Math.abs(c-rx)+Math.abs(c-by);
        const v=edge>34?0:255;
        a[i]=a[i+1]=a[i+2]=v;a[i+3]=255;
      }
    }
    ctx.putImageData(data,0,0);
  }
  function setZoom(v){scale=Math.max(.25,Math.min(3,v));zoom.value=Math.round(scale*100);zoomValue.textContent=Math.round(scale*100)+"%";draw()}
  function setContrast(v){contrastValueNum=Math.max(-100,Math.min(100,v));contrast.value=contrastValueNum;contrastValue.textContent=(contrastValueNum>0?"+":"")+contrastValueNum;draw()}
  function center(){x=stage.clientWidth/2;y=stage.clientHeight/2}
  function setLock(v){
    locked=v;document.body.classList.toggle("locked",locked);lock.classList.toggle("locked",locked);
    lock.textContent=locked?"🔒":"🔓";badge.classList.toggle("hidden",!locked);
    if(locked){toastMsg("Tela travada — apoie a folha e faça o decalque")}
    else toastMsg("Tela desbloqueada");
  }
  function toggleRuler(){ruler.classList.toggle("hidden");rulerSettings.classList.toggle("hidden");updateRuler()}
  function updateRuler(){
    pxPerCm=Number(pxInput.value)||37.8;localStorage.setItem("tattoo_px_per_cm",pxPerCm);
    const cm=10, px=Math.max(120,Math.min(stage.clientWidth*.75,pxPerCm*cm));
    document.querySelector(".ruler-line").style.width=px+"px";$("rulerLabel").textContent=`${(px/pxPerCm).toFixed(1)} cm`
  }

  input.onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const url=URL.createObjectURL(file);img.onload=()=>{loaded=true;empty.classList.add("hidden");stage.classList.remove("hidden");mirror=1;lineMode=false;setContrast(0);center();fit();toastMsg("Desenho carregado")};img.src=url;e.target.value=""
  };
  $("zoomIn").onclick=()=>setZoom(scale+.05);$("zoomOut").onclick=()=>setZoom(scale-.05);
  zoom.oninput=()=>setZoom(Number(zoom.value)/100);
  contrast.oninput=()=>setContrast(Number(contrast.value));
  $("contrastUp").onclick=()=>setContrast(contrastValueNum+10);$("contrastDown").onclick=()=>setContrast(contrastValueNum-10);
  $("mirror").onclick=()=>{mirror*=-1;draw();toastMsg(mirror===-1?"Espelhado horizontalmente":"Espelhamento removido")};
  $("lineArt").onclick=()=>{lineMode=!lineMode;draw();toastMsg(lineMode?"Modo desenho de linhas":"Foto original")}
  $("rulerButton").onclick=toggleRuler;pxInput.oninput=updateRuler;
  $("reset").onclick=()=>{mirror=1;lineMode=false;setContrast(0);fit();toastMsg("Desenho redefinido")};
  lock.onclick=()=>setLock(!locked);

  stage.addEventListener("pointerdown",e=>{
    if(locked)return;e.preventDefault();dragging=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture(e.pointerId)
  });
  stage.addEventListener("pointermove",e=>{
    if(!dragging||locked)return;e.preventDefault();x+=e.clientX-lastX;y+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;draw()
  });
  stage.addEventListener("pointerup",e=>{dragging=false;try{stage.releasePointerCapture(e.pointerId)}catch{}});
  stage.addEventListener("pointercancel",()=>dragging=false);
  stage.addEventListener("wheel",e=>{if(locked)return;e.preventDefault();setZoom(scale+(e.deltaY<0?.05:-.05))},{passive:false});
  window.addEventListener("resize",resize);

  resize();
  updateRuler();
})();
