// Locally generated rotating torus knot; no dependencies or network calls.
const canvas = document.querySelector('#sculpture');
const button = document.querySelector('#motion');
const ctx = canvas?.getContext('2d');
if (ctx) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches, visible = true, angle = .2, last = 0, frame = 0, width = 0, height = 0;
  const points = Array.from({length: 240}, (_, i) => {
    const t = i / 240 * Math.PI * 2, r = 1.65 + .72 * Math.cos(3 * t);
    return [r * Math.cos(2 * t), r * Math.sin(2 * t), .9 * Math.sin(3 * t)];
  });
  function draw() {
    ctx.clearRect(0,0,width,height);
    const scale = Math.min(width,height) * .18, c = Math.cos(angle), s = Math.sin(angle), segments = [];
    for (let tube = 0; tube < 11; tube++) {
      const o = tube / 11 * Math.PI * 2;
      const line = points.map(([x,y,z], i) => {
        const t = i / points.length * Math.PI * 2;
        const px = x + .2*Math.cos(o)*Math.cos(2*t), py = y + .2*Math.cos(o)*Math.sin(2*t), pz = z + .2*Math.sin(o);
        const rx = px*c+pz*s, rz = -px*s+pz*c, ry = py*.82-rz*.57, depth = py*.57+rz*.82, perspective = 6/(6+depth);
        return {x:width/2+rx*scale*perspective,y:height/2+ry*scale*perspective,depth};
      });
      for(let i=0;i<line.length;i++){const a=line[i],b=line[(i+1)%line.length];segments.push({a,b,depth:(a.depth+b.depth)/2,tube});}
    }
    segments.sort((a,b)=>b.depth-a.depth);
    ctx.lineCap='round';
    for(const {a,b,depth,tube} of segments){
      const light=Math.max(.18,Math.min(1,.65-depth*.17));
      ctx.strokeStyle=tube%3===0 ? `rgba(214,249,133,${light})` : `rgba(224,167,242,${light})`;
      ctx.lineWidth=1.1+light*.45;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
  function tick(time){frame=0;if(paused||!visible||document.hidden){last=0;return;}if(last)angle+=Math.min(time-last,40)*.00013;last=time;draw();frame=requestAnimationFrame(tick);}
  function start(){if(!frame&&!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  function label(){button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Hareketi başlat ▷':'Hareketi durdur Ⅱ';}
  button.hidden=false;label();
  button.addEventListener('click',()=>{paused=!paused;label();start();});
  preference.addEventListener('change',event=>{paused=event.matches;label();start();});
  new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();start();}).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();}).observe(canvas);
  document.addEventListener('visibilitychange',start);
}
