import {language} from './i18n.mjs';
const words = {
  tr: {
    title: 'VR / AR açılamadı', close: 'Mesajı kapat', code: 'Hata kodu',
    busy: 'VR / AR başlatılıyor…', ending: 'VR / AR kapatılıyor…',
    NotSupportedError: 'Bu cihaz veya tarayıcı seçilen VR/AR modunu desteklemiyor. VR için gözlüğün tarayıcısını; AR için WebXR ve yüzey algılama destekli bir cihazı kullanın.',
    SecurityError: 'Siteyi HTTPS bağlantısıyla doğrudan tarayıcıda açın. Gerekli XR izinlerini kontrol edip VR/AR düğmesine yeniden dokunun.',
    NotAllowedError: 'XR izni verilmedi. Tarayıcıdaki site izinlerini kontrol edip tekrar deneyin.',
    InvalidStateError: 'Tarayıcıda başka bir XR oturumu açık veya başlatılıyor olabilir. Önce o deneyimden çıkın, sonra bu sayfada tekrar deneyin.',
    fallback: 'XR bağlantısı kurulamadı. Diğer VR/AR deneyimlerini kapatıp sayfayı yenileyin. Sorun sürerse aşağıdaki hata kodunu ve kullandığınız cihaz/tarayıcıyı öğretmeninize iletin.'
  },
  en: {
    title: 'VR / AR could not start', close: 'Dismiss message', code: 'Error code',
    busy: 'Starting VR / AR…', ending: 'Closing VR / AR…',
    NotSupportedError: 'This device or browser does not support the selected VR/AR mode. Use the headset browser for VR, or a device with WebXR and surface detection for AR.',
    SecurityError: 'Open the HTTPS link directly in your browser. Check XR permissions, then tap the VR/AR button again.',
    NotAllowedError: 'XR permission was not granted. Check the browser’s site permissions and try again.',
    InvalidStateError: 'Another XR session may be open or starting in this browser. Exit that experience before trying again here.',
    fallback: 'The XR connection failed. Close other VR/AR experiences and reload. If it persists, share the error code and your device/browser with your teacher.'
  },
  ro: {
    title: 'VR / AR nu a pornit', close: 'Închide mesajul', code: 'Cod de eroare',
    busy: 'Se pornește VR / AR…', ending: 'Se închide VR / AR…',
    NotSupportedError: 'Dispozitivul sau browserul nu acceptă modul VR/AR ales. Pentru VR folosește browserul căștii; pentru AR, un dispozitiv cu WebXR și detectarea suprafețelor.',
    SecurityError: 'Deschide linkul HTTPS direct în browser. Verifică permisiunile XR și apasă din nou butonul VR/AR.',
    NotAllowedError: 'Permisiunea XR nu a fost acordată. Verifică permisiunile site-ului în browser și încearcă din nou.',
    InvalidStateError: 'O altă sesiune XR poate fi deschisă sau în curs de pornire. Ieși din acea experiență înainte să încerci din nou.',
    fallback: 'Conexiunea XR a eșuat. Închide alte experiențe VR/AR și reîncarcă pagina. Dacă problema persistă, transmite profesorului codul de eroare și dispozitivul/browserul folosit.'
  },
  uk: {
    title: 'Не вдалося запустити VR / AR', close: 'Закрити повідомлення', code: 'Код помилки',
    busy: 'Запуск VR / AR…', ending: 'Закриття VR / AR…',
    NotSupportedError: 'Пристрій або браузер не підтримує обраний режим VR/AR. Для VR відкрий браузер гарнітури; для AR потрібен пристрій із WebXR і виявленням поверхонь.',
    SecurityError: 'Відкрий посилання HTTPS безпосередньо в браузері. Перевір дозволи XR і знову натисни кнопку VR/AR.',
    NotAllowedError: 'Дозвіл XR не надано. Перевір дозволи сайту в браузері та спробуй знову.',
    InvalidStateError: 'Інший сеанс XR може бути відкритий або запускатися. Спочатку вийди з нього, а потім спробуй знову тут.',
    fallback: 'Не вдалося встановити з’єднання XR. Закрий інші VR/AR-сеанси й онови сторінку. Якщо проблема залишиться, повідом учителю код помилки та назву пристрою/браузера.'
  }
};
export function createXRFeedback(support) {
  const t = words[language] || words.en;
  const notice = document.createElement('section');
  notice.id = 'xr-feedback'; notice.hidden = true; notice.setAttribute('role', 'alert');
  Object.assign(notice.style, {position:'fixed',zIndex:'100',top:'85px',right:'16px',
    width:'min(430px, calc(100vw - 32px))',boxSizing:'border-box',padding:'22px',
    borderRadius:'16px',background:'#fff9e9',color:'#153f35',boxShadow:'0 10px 35px #0004',
    maxHeight:'70vh',overflow:'auto',pointerEvents:'auto'});
  const heading = document.createElement('strong'), body = document.createElement('p');
  const detail = document.createElement('p'), dismiss = document.createElement('button');
  dismiss.type = 'button'; dismiss.textContent = t.close;
  dismiss.onclick = () => { notice.hidden = true; };
  notice.append(heading, body, detail, dismiss);
  document.getElementById('app-ui').append(notice);
  const vr = document.getElementById('vr-button'), ar = document.getElementById('ar-button');
  const labels = [vr.textContent, ar.textContent];
  return {
    state(state) {
      const locked = state !== 'idle';
      vr.disabled = locked || !support.vr; ar.disabled = locked || !support.ar;
      document.getElementById('exit-xr').hidden = !locked;
      document.getElementById('language').disabled = locked;
      vr.textContent = state === 'starting' ? t.busy : state === 'ending' ? t.ending : labels[0];
      ar.textContent = labels[1];
      if (state === 'starting') notice.hidden = true;
    },
    error(error) {
      heading.textContent = t.title;
      body.textContent = t[error.name] || t.fallback;
      detail.textContent = t.code + ': ' + String(error.name || 'UnknownError').slice(0,80) +
        ' · XR 4.1 · ' + String(error.message || '').slice(0,240);
      detail.style.overflowWrap = 'anywhere';
      notice.hidden = false;
    }
  };
}
