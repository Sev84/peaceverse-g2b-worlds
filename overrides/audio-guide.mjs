import {language} from './i18n.mjs';
const words={
 en:{title:'Audio guide',language:'English → Turkish narration',note:'Each recording plays English first, then Turkish. Romanian and Ukrainian are available as written page content.',choose:'Choose a scene',play:'Play / pause narration',transcript:'Read the recording transcript (EN / TR)',open:'Open audio file',padlet:'Open this scene’s Padlet ↗',ready:'Press play to listen.',error:'The recording could not load. Check your connection or open the audio file.',stopped:'Narration paused.'},
 tr:{title:'Sesli rehber',language:'İngilizce → Türkçe seslendirme',note:'Her kayıtta önce İngilizce, ardından Türkçe konuşulur. Romence ve Ukraynaca içerik sayfalarda yazılı olarak bulunur.',choose:'Sahne seç',play:'Seslendirmeyi oynat / duraklat',transcript:'Seslendirme metnini oku (EN / TR)',open:'Ses dosyasını aç',padlet:'Bu sahnenin Padlet panosunu aç ↗',ready:'Dinlemek için oynat düğmesine basın.',error:'Ses kaydı yüklenemedi. Bağlantınızı kontrol edin veya ses dosyasını açın.',stopped:'Seslendirme duraklatıldı.'},
 ro:{title:'Ghid audio',language:'Narațiune în engleză → turcă',note:'Fiecare înregistrare este mai întâi în engleză, apoi în turcă. Conținutul în română și ucraineană este disponibil în scris pe pagini.',choose:'Alege o scenă',play:'Redă / întrerupe narațiunea',transcript:'Citește transcrierea (EN / TR)',open:'Deschide fișierul audio',padlet:'Deschide Padlet-ul acestei scene ↗',ready:'Apasă redare pentru a asculta.',error:'Înregistrarea nu s-a încărcat. Verifică conexiunea sau deschide fișierul audio.',stopped:'Narațiune întreruptă.'},
 uk:{title:'Аудіогід',language:'Озвучення англійською → турецькою',note:'Кожен запис звучить спочатку англійською, потім турецькою. Румунська й українська версії доступні як письмовий текст на сторінках.',choose:'Обери сцену',play:'Відтворити / призупинити озвучення',transcript:'Прочитати текст запису (EN / TR)',open:'Відкрити аудіофайл',padlet:'Відкрити Padlet цієї сцени ↗',ready:'Натисни відтворення, щоб слухати.',error:'Не вдалося завантажити запис. Перевір з’єднання або відкрий аудіофайл.',stopped:'Озвучення призупинено.'}
};
export async function createAudioGuide(project){
 const t=words[language]||words.en;
 const response=await fetch('./data/narration.json');
 if(!response.ok)throw Error(t.error);
 const catalog=await response.json(),tracks=catalog[project];
 if(!Array.isArray(tracks)||!tracks.length)throw Error(t.error);
 const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.id='scene-narration';audio.setAttribute('aria-label',t.language);
 let current=-1,status=null;
 const select=index=>{if(!tracks[index])return;if(current!==index){audio.pause();current=index;audio.src=tracks[index].src;}if(status)status.textContent=t.ready;};
 audio.addEventListener('play',()=>{document.getElementById('ambient')?.pause();const button=document.getElementById('music-button');if(button)button.setAttribute('aria-pressed','false');if(status)status.textContent=t.language;});
 audio.addEventListener('error',()=>{if(status)status.textContent=t.error;});
 const stop=()=>{audio.pause();if(status)status.textContent=t.stopped;};
 async function toggle(index){select(index);if(audio.paused){try{await audio.play();}catch{if(status)status.textContent=t.error;}}else stop();}
 function mount(host,index=0,{choose=false}={}){
  host.replaceChildren();host.className='audio-guide';
  const heading=document.createElement('h3');heading.textContent='♫ '+t.title;host.append(heading);
  if(choose){const label=document.createElement('label'),pick=document.createElement('select');label.textContent=t.choose;pick.id='narration-scene';tracks.forEach((track,i)=>{const option=document.createElement('option');option.value=i;option.textContent=track.title;pick.append(option)});pick.value=String(index);pick.onchange=()=>mount(host,Number(pick.value),{choose:true});label.append(pick);host.append(label);}
  select(index);
  const caption=document.createElement('p');caption.textContent=tracks[index].title+' · '+t.language;host.append(caption,audio);
  status=document.createElement('p');status.setAttribute('role','status');status.className='meta';status.textContent=t.ready;host.append(status);
  const note=document.createElement('p');note.className='meta';note.textContent=t.note;host.append(note);
  const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent=t.transcript;text.textContent=tracks[index].transcript;text.className='narration-transcript';details.append(summary,text);host.append(details);
  const actions=document.createElement('div');actions.className='actions';
  for(const [title,href] of [[t.open,tracks[index].src],[t.padlet,tracks[index].padlet]]){const a=document.createElement('a');a.textContent=title;a.href=href;a.target='_blank';a.rel='noopener noreferrer';actions.append(a)}host.append(actions);
 }
 return {tracks,labels:t,mount,stop,toggle,select};
}
