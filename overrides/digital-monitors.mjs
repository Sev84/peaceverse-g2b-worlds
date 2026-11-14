import * as THREE from 'three';
// Canvas screens have a separate front and rear face: text is never mirrored.
export function addDigitalMonitors({world,meta,targets,catalog}){
 const root=new THREE.Group();root.name='Digital exhibition monitors';world.add(root);
 const labels=catalog.labels,textureCache=new Map();
 function wrap(ctx,text,x,y,width,step,max){let line='',n=0;for(const word of String(text).split(/\s+/)){if(ctx.measureText(line+word).width>width&&line){ctx.fillText(line,x,y);y+=step;line='';if(++n>=max)return}line+=word+' '}ctx.fillText(line,x,y)}
 function texture(item,live=false){const key=live?'live':item.id;if(textureCache.has(key))return textureCache.get(key);const c=document.createElement('canvas');c.width=1280;c.height=800;const ctx=c.getContext('2d');
  function draw(image){ctx.fillStyle='#102b32';ctx.fillRect(0,0,1280,800);ctx.fillStyle='#c8ddb1';ctx.font='500 29px sans-serif';ctx.fillText(catalog.project+' · '+labels.nov,42,52);ctx.fillStyle='#f5f1df';ctx.font='500 48px Georgia';wrap(ctx,live?labels.live:item.title,42,126,1196,55,2);
   if(image){const scale=Math.min(1160/image.width,490/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,(1280-w)/2,200+(490-h)/2,w,h)}else{ctx.fillStyle='#244d48';ctx.fillRect(42,220,1196,450);ctx.fillStyle='#e9efdf';ctx.font='34px sans-serif';wrap(ctx,live?labels.intro:item.body,80,280,1116,49,7)}
   ctx.fillStyle='#d8be83';ctx.font='29px sans-serif';ctx.fillText(labels.tap+' →',42,756);ctx.textAlign='right';ctx.fillStyle='#b8cdc4';ctx.font='22px sans-serif';ctx.fillText(live?labels.demo:item.school,1238,756,800);ctx.textAlign='left';tex.needsUpdate=true}
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;draw();textureCache.set(key,tex);
  const url=live?catalog.items.find(i=>i.image)?.image:item.image;if(url){const image=new Image();image.onload=()=>draw(image);image.src=url}return tex;
 }
 function monitor(g,side,forward,action,map,width=2.7,height=1.69){const e=new THREE.Vector3().fromArray(g.entry),look=new THREE.Vector3().fromArray(g.lookAt);const dir=look.sub(e);dir.y=0;dir.normalize();const right=new THREE.Vector3(-dir.z,0,dir.x);const pos=e.clone().addScaledVector(dir,forward).addScaledVector(right,side);pos.y=e.y+.32;
  const unit=new THREE.Group();unit.position.copy(pos);unit.lookAt(e.x,pos.y,e.z);root.add(unit);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(width+.15,height+.15,.13),new THREE.MeshStandardMaterial({color:'#153136',metalness:.55,roughness:.32}));unit.add(frame);
  const material=new THREE.MeshBasicMaterial({map,side:THREE.FrontSide,toneMapped:false});
  for(const rear of [false,true]){const screen=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);screen.position.z=rear?-.077:.077;screen.rotation.y=rear?Math.PI:0;screen.userData.action=action;unit.add(screen);targets.push(screen)}
  const poleHeight=Math.max(.4,pos.y-height/2-(meta.defaultGroundY||0));const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,poleHeight,12),frame.material);pole.position.y=-height/2-poleHeight/2;unit.add(pole);
  const foot=new THREE.Mesh(new THREE.CylinderGeometry(.38,.43,.07,24),frame.material);foot.position.y=-height/2-poleHeight;unit.add(foot);
 }
 for(const g of meta.galleries){monitor(g,2.2,2.8,{kind:'digital-padlet',index:g.monthIndex},texture(null,true));
  catalog.items.filter(i=>i.scene===g.monthIndex).forEach((item,j)=>monitor(g,j%2?-2.2:2.2,5.7+Math.floor(j/2)*2.5,{kind:'digital-work',id:item.id},texture(item),2.6,1.625));
 }
 return root;
}
