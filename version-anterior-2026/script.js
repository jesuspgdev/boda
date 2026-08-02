/* =================================================================
   BODA MIGUEL & FATNA · Comportamiento de la página
   -----------------------------------------------------------------
   El archivo se carga con "defer", así que cuando se ejecuta el HTML
   ya está montado y no hace falta esperar a ningún evento.

   Índice
     0. Configuración   <-- lo único que hay que tocar normalmente
     1. Utilidades
     2. Idioma (español / árabe)
     3. Cuenta atrás
     4. Menú del móvil
     5. Barra superior
     6. Barra de acciones inferior
     7. Animaciones al hacer scroll
     8. Mapa (se carga solo cuando hace falta)
     9. Añadir al calendario
    10. Compartir invitación
    11. Enlace del formulario
   ================================================================= */


/* ================================================================
   0 · CONFIGURACIÓN
   ================================================================ */
const CONFIG = {

  /* Fecha y hora de la boda.
     El "+02:00" es el horario de verano español, que el 17 de octubre
     de 2026 sigue vigente. Cuando se confirme la hora de la ceremonia,
     cambia solo "12:00:00" (por ejemplo "17:30:00").
     Así la cuenta atrás sale bien aunque el invitado esté en Marruecos
     o en cualquier otro país. */
  fechaBoda: '2026-10-17T12:00:00+02:00',

  /* Cuántas horas dura el evento. Solo se usa para el archivo de
     calendario, para que el invitado no se bloquee el día entero. */
  duracionHoras: 10,

  /* Enlace del formulario de confirmación (Google Forms).
     Mientras esté vacío, el botón se muestra apagado y avisa de que
     todavía no está listo. Pega aquí la URL y listo. */
  formulario: '',

  /* Datos del lugar, para el archivo de calendario */
  lugar: 'Club Hípico y Polideportivo de Almería, Carretera Viator al Alquián km 4,2, 04120 El Alquián, Almería',

  /* Título del evento en el calendario */
  tituloEvento: 'Boda de Miguel y Fatna'
};


/* ================================================================
   1 · UTILIDADES
   ================================================================ */
const $  = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/* ¿El invitado ha pedido menos animaciones en los ajustes del móvil? */
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Ancho a partir del cual dejamos de considerarlo un móvil */
const esMovil = () => window.matchMedia('(max-width: 899px)').matches;

/* Mensajes cortos que aparecen abajo (copiado, calendario, etc.) */
const cajaMensaje = $('#mensaje');
let temporizadorMensaje;

function avisar(texto){
  cajaMensaje.textContent = texto;
  cajaMensaje.classList.add('visible');
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => cajaMensaje.classList.remove('visible'), 3400);
}


/* ================================================================
   2 · IDIOMA (español / árabe)
   -----------------------------------------------------------------
   Cada texto traducible lleva en el HTML un atributo data-ar con su
   versión en árabe. Al arrancar guardamos el original en español en
   data-es, y a partir de ahí solo intercambiamos uno por otro.
   ================================================================ */
const Idioma = (() => {
  const traducibles = $$('[data-ar]');
  const botonEs = $('#btn-es');
  const botonAr = $('#btn-ar');
  const raiz = document.documentElement;

  const CIFRAS_AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  const TITULOS = {
    es: 'Miguel & Fatna · 17 de octubre de 2026',
    ar: 'ميغيل وفاطنة · ١٧ أكتوبر ٢٠٢٦'
  };

  const TEXTOS = {
    hoy:            { es:'¡Hoy es el gran día!',                        ar:'اليوم هو اليوم الكبير!' },
    yaCasados:      { es:'¡Ya estamos casados! Gracias por acompañarnos.', ar:'لقد تزوّجنا! شكرًا لمشاركتنا هذا اليوم.' },
    enlaceCopiado:  { es:'Enlace copiado. ¡Compártelo!',                 ar:'تم نسخ الرابط. شاركه!' },
    calendarioOk:   { es:'Evento descargado. Ábrelo para añadirlo.',     ar:'تم تنزيل الحدث. افتحه لإضافته.' },
    sinFormulario:  { es:'El formulario aún no está listo. Lo publicaremos aquí muy pronto.', ar:'الاستمارة ليست جاهزة بعد. سننشرها هنا قريبًا.' }
  };

  let actual = 'es';

  traducibles.forEach(el => { el.dataset.es = el.innerHTML.trim(); });

  function aplicar(lang){
    actual = lang;
    const ar = lang === 'ar';

    traducibles.forEach(el => { el.innerHTML = ar ? el.dataset.ar : el.dataset.es; });

    raiz.setAttribute('lang', ar ? 'ar' : 'es');
    raiz.setAttribute('dir',  ar ? 'rtl' : 'ltr');
    document.body.classList.toggle('arabe', ar);
    document.title = TITULOS[lang];

    botonEs.setAttribute('aria-pressed', String(!ar));
    botonAr.setAttribute('aria-pressed', String(ar));

    try { localStorage.setItem('idioma-boda', lang); } catch(e){ /* modo privado */ }

    document.dispatchEvent(new CustomEvent('idioma:cambiado', { detail:{ lang } }));
  }

  /* Convierte 76 en ٧٦ cuando la página está en árabe */
  function numero(valor){
    const texto = String(valor);
    return actual === 'ar' ? texto.replace(/\d/g, d => CIFRAS_AR[+d]) : texto;
  }

  function texto(clave){
    return (TEXTOS[clave] || {})[actual] || '';
  }

  botonEs.addEventListener('click', () => aplicar('es'));
  botonAr.addEventListener('click', () => aplicar('ar'));

  let guardado = null;
  try { guardado = localStorage.getItem('idioma-boda'); } catch(e){ /* modo privado */ }
  if (guardado === 'ar') aplicar('ar');

  return { aplicar, numero, texto, get actual(){ return actual; } };
})();


/* ================================================================
   3 · CUENTA ATRÁS
   ================================================================ */
(() => {
  const objetivo = new Date(CONFIG.fechaBoda).getTime();
  const reloj  = $('#reloj');
  const aviso  = $('#cd-aviso');
  const casillas = {
    dias:  $('#cd-dias'),
    horas: $('#cd-horas'),
    min:   $('#cd-min'),
    seg:   $('#cd-seg')
  };

  if (Number.isNaN(objetivo)){
    console.error('CONFIG.fechaBoda no es una fecha válida:', CONFIG.fechaBoda);
    return;
  }

  function pintar(){
    const resto = objetivo - Date.now();

    if (resto <= 0){
      const finDelDia = objetivo + 24 * 60 * 60 * 1000;
      reloj.hidden = true;
      aviso.hidden = false;
      aviso.textContent = Idioma.texto(Date.now() < finDelDia ? 'hoy' : 'yaCasados');
      return;
    }

    const segundos = Math.floor(resto / 1000);
    casillas.dias.textContent  = Idioma.numero(Math.floor(segundos / 86400));
    casillas.horas.textContent = Idioma.numero(String(Math.floor(segundos % 86400 / 3600)).padStart(2,'0'));
    casillas.min.textContent   = Idioma.numero(String(Math.floor(segundos % 3600 / 60)).padStart(2,'0'));
    casillas.seg.textContent   = Idioma.numero(String(segundos % 60).padStart(2,'0'));
  }

  pintar();
  setInterval(pintar, 1000);

  /* Al cambiar de idioma repintamos ya, sin esperar al siguiente segundo */
  document.addEventListener('idioma:cambiado', pintar);
})();


/* ================================================================
   4 · MENÚ DEL MÓVIL
   ================================================================ */
(() => {
  const menu    = $('#menu');
  const boton   = $('#btn-menu');   /* la hamburguesa abre y cierra */
  const enlaces = $('.menu-nav', menu);
  let posicionScroll = 0;

  function bloquearFondo(){
    posicionScroll = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${posicionScroll}px`;
    document.body.style.width = '100%';
  }

  function liberarFondo(){
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, posicionScroll);
  }

  function abrirMenu(){
    menu.hidden = false;
    bloquearFondo();
    requestAnimationFrame(() => menu.classList.add('abierto'));
    boton.setAttribute('aria-expanded','true');
    boton.setAttribute('aria-label','Cerrar menú');
    const primero = $('a', enlaces);
    if (primero) primero.focus({ preventScroll:true });
  }

  function cerrarMenu(){
    menu.classList.remove('abierto');
    boton.setAttribute('aria-expanded','false');
    boton.setAttribute('aria-label','Abrir menú');
    liberarFondo();
    setTimeout(() => { menu.hidden = true; }, sinMovimiento ? 0 : 300);
  }

  const estaAbierto = () => boton.getAttribute('aria-expanded') === 'true';

  boton.addEventListener('click', () => estaAbierto() ? cerrarMenu() : abrirMenu());

  /* Al pulsar un enlace: cerramos primero (para devolver el scroll al
     cuerpo) y solo después saltamos a la sección. */
  enlaces.addEventListener('click', evento => {
    const enlace = evento.target.closest('a[href^="#"]');
    if (!enlace) return;

    evento.preventDefault();
    const destino = document.querySelector(enlace.getAttribute('href'));
    cerrarMenu();

    requestAnimationFrame(() => {
      if (destino) destino.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block:'start' });
    });
  });

  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && estaAbierto()) cerrarMenu();
  });

  /* Si se gira el móvil o se agranda la ventana hasta escritorio,
     el menú deja de tener sentido */
  window.addEventListener('resize', () => {
    if (!esMovil() && estaAbierto()) cerrarMenu();
  });
})();


/* ================================================================
   5 · BARRA SUPERIOR
   ================================================================ */
(() => {
  const barra = $('#barra');
  const revisar = () => barra.classList.toggle('fija', window.scrollY > 40);
  revisar();
  window.addEventListener('scroll', revisar, { passive:true });
})();


/* ================================================================
   6 · BARRA DE ACCIONES INFERIOR (solo móvil)
   -----------------------------------------------------------------
   Aparece cuando el invitado ya ha pasado la portada y desaparece
   cuando llega a la sección de confirmar, donde ya no aporta nada.
   ================================================================ */
(() => {
  const barra = $('#barra-inferior');
  const portada = $('#inicio');
  const rsvp = $('#confirmar');

  let portadaVisible = true;
  let rsvpVisible = false;
  let montada = false;

  function revisar(){
    const mostrar = esMovil() && !portadaVisible && !rsvpVisible;

    if (mostrar && !montada){
      barra.hidden = false;
      montada = true;
      /* Un fotograma antes de animar, si no el navegador se salta la transición */
      requestAnimationFrame(() => barra.classList.add('visible'));
    } else {
      barra.classList.toggle('visible', mostrar);
    }

    /* El cuerpo reserva sitio para que la barra no tape el pie de página */
    document.documentElement.style.setProperty(
      '--alto-barra-inferior',
      mostrar ? `${barra.offsetHeight}px` : '0px'
    );
  }

  if ('IntersectionObserver' in window){
    new IntersectionObserver(entradas => {
      portadaVisible = entradas[0].isIntersecting;
      revisar();
    }, { threshold: 0.15 }).observe(portada);

    new IntersectionObserver(entradas => {
      rsvpVisible = entradas[0].isIntersecting;
      revisar();
    }, { threshold: 0.2 }).observe(rsvp);
  }

  window.addEventListener('resize', revisar);
})();


/* ================================================================
   7 · ANIMACIONES AL HACER SCROLL
   ================================================================ */
(() => {
  const elementos = $$('.animar');

  /* Si el móvil pide menos movimiento, o el navegador es antiguo,
     se muestra todo de golpe */
  if (sinMovimiento || !('IntersectionObserver' in window)){
    elementos.forEach(el => el.classList.add('visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visible');
      obs.unobserve(entrada.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  elementos.forEach(el => observador.observe(el));

  /* Red de seguridad: si por lo que sea el observador no llega a
     dispararse, mostramos todo. La invitación nunca debe verse vacía. */
  setTimeout(() => {
    if (!document.querySelector('.animar.visible')){
      elementos.forEach(el => el.classList.add('visible'));
    }
  }, 2500);
})();


/* ================================================================
   8 · MAPA (se descarga solo cuando se acerca a la pantalla)
   -----------------------------------------------------------------
   Un mapa de Google pesa bastante. Quien abra la invitación solo
   para mirar la fecha no gasta esos datos.
   ================================================================ */
(() => {
  const caja = $('#mapa');
  const marco = $('iframe', caja);

  function cargar(){
    if (marco.src) return;
    marco.src = marco.dataset.src;
    marco.addEventListener('load', () => caja.classList.add('cargado'), { once:true });
  }

  if ('IntersectionObserver' in window){
    const observador = new IntersectionObserver(entradas => {
      if (entradas[0].isIntersecting){
        cargar();
        observador.disconnect();
      }
    }, { rootMargin: '400px' });
    observador.observe(caja);
  } else {
    cargar();
  }
})();


/* ================================================================
   9 · AÑADIR AL CALENDARIO
   -----------------------------------------------------------------
   Genera un archivo .ics al vuelo. Funciona con el calendario de
   iPhone, el de Android, Google Calendar y Outlook.
   ================================================================ */
(() => {
  const boton = $('#btn-calendario');

  /* 20261017T100000Z: el formato que pide el estándar iCalendar */
  const enFormatoICS = fecha =>
    fecha.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');

  /* Las comas y los puntos y coma tienen significado propio en el
     formato, así que hay que escaparlos */
  const escapar = texto =>
    String(texto).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');

  function construirICS(){
    const inicio = new Date(CONFIG.fechaBoda);
    const fin = new Date(inicio.getTime() + CONFIG.duracionHoras * 60 * 60 * 1000);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Boda Miguel y Fatna//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:boda-miguel-fatna-20261017',
      `DTSTAMP:${enFormatoICS(new Date())}`,
      `DTSTART:${enFormatoICS(inicio)}`,
      `DTEND:${enFormatoICS(fin)}`,
      `SUMMARY:${escapar(CONFIG.tituloEvento)}`,
      `LOCATION:${escapar(CONFIG.lugar)}`,
      `DESCRIPTION:${escapar('Toda la información de la boda: ' + location.href)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapar(CONFIG.tituloEvento)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  boton.addEventListener('click', () => {
    const archivo = new Blob([construirICS()], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'boda-miguel-y-fatna.ics';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar(Idioma.texto('calendarioOk'));
  });
})();


/* ================================================================
   10 · COMPARTIR INVITACIÓN
   -----------------------------------------------------------------
   En el móvil abre el menú de compartir del sistema (WhatsApp,
   mensajes...). En el ordenador copia el enlace al portapapeles.
   Si el navegador no puede hacer ninguna de las dos, el botón
   sencillamente no aparece.
   ================================================================ */
(() => {
  const boton = $('#btn-compartir');
  const puedeCompartir = typeof navigator.share === 'function';
  const puedeCopiar = !!(navigator.clipboard && navigator.clipboard.writeText);

  if (!puedeCompartir && !puedeCopiar) return;

  boton.hidden = false;

  boton.addEventListener('click', async () => {
    const datos = {
      title: 'Miguel & Fatna',
      text: '¡Nos casamos! 17 de octubre de 2026, Almería.',
      url: location.href
    };

    if (puedeCompartir){
      try {
        await navigator.share(datos);
        return;
      } catch (error){
        /* El invitado ha cerrado el menú de compartir: no es un fallo */
        if (error && error.name === 'AbortError') return;
      }
    }

    if (puedeCopiar){
      try {
        await navigator.clipboard.writeText(location.href);
        avisar(Idioma.texto('enlaceCopiado'));
      } catch (error){
        console.warn('No se ha podido copiar el enlace:', error);
      }
    }
  });
})();


/* ================================================================
   11 · ENLACE DEL FORMULARIO
   ================================================================ */
(() => {
  const boton = $('#btn-rsvp');
  const url = (CONFIG.formulario || '').trim();

  if (url){
    boton.href = url;
    return;
  }

  /* Todavía no hay formulario: el botón se ve apagado y lo explica */
  boton.classList.add('sin-enlace');
  boton.setAttribute('aria-disabled','true');
  boton.removeAttribute('target');
  boton.href = '#confirmar';

  boton.addEventListener('click', evento => {
    evento.preventDefault();
    avisar(Idioma.texto('sinFormulario'));
  });
})();
