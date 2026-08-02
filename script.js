/* =================================================================
   BODA FATNA & MIGUEL · Comportamiento de la página
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
    12. Fotos (portada, parallax y cierre)
    13. Música de fondo
   ================================================================= */


/* ================================================================
   0 · CONFIGURACIÓN
   ================================================================ */
const CONFIG = {

  /* Fecha y hora de la ceremonia: sábado 17 de octubre de 2026, 19:00.
     El "+02:00" es el horario de verano español, que ese día sigue
     vigente (el cambio de hora es el 25 de octubre). Gracias a eso la
     cuenta atrás sale bien esté donde esté el invitado. */
  fechaBoda: '2026-10-17T19:00:00+02:00',

  /* Cuántas horas dura el evento. Solo se usa para el archivo de
     calendario, para que el invitado no se bloquee el día entero. */
  duracionHoras: 10,

  /* Enlace del formulario de confirmación (Google Forms).
     Se abre en pestaña nueva desde todos los botones de confirmar. */
  formulario: 'https://docs.google.com/forms/d/e/1FAIpQLSdD9nJdal2QIGYYscEnS0RkpFOHQZ9p-4FgyFSfkqTuB9Z9xw/viewform?usp=header',

  /* UBICACIÓN · se toca solo aquí. El JS pone este enlace en todos los
     botones de "Cómo llegar" y monta con él el mapa incrustado.

     Ojo: la Sala Sofía Palacios NO está dada de alta en Google Maps.
     Si la buscas por su nombre no sale. Lo que sí sale es el recinto
     que la contiene, el Club Hípico y Polideportivo de Almería, y por
     eso el mapa y el enlace apuntan a la dirección del recinto. */
  mapa: 'https://maps.app.goo.gl/Fpr5xjMgJ3d8sCZV7?g_st=aw',

  /* Lo que se busca en el mapa incrustado. Va por NOMBRE del recinto y
     no por dirección: la carretera sola cae en mitad del campo (probado,
     salía el parque El Boticario), mientras que el nombre pone la
     chincheta justo en la entrada. */
  mapaBusqueda: 'Club Hípico y Polideportivo de Almería, El Alquián, Almería',

  /* Datos del lugar, para el archivo de calendario */
  lugar: 'Sala Sofía Palacios (dentro del Club Hípico y Polideportivo de Almería), Carretera Viator al Alquián Km 4.2, 04120 El Alquián, Almería',

  /* Título del evento en el calendario */
  tituloEvento: 'Boda de Fatna y Miguel',

  /* FOTOS · basta con guardar cada archivo en la carpeta "fotos" con
     estos nombres (o cambiar aquí el nombre y listo, una sola línea).
     Si un archivo no existe todavía, la web se ve bien igualmente.

     PENDIENTE: Miguel tiene que pasar la foto definitiva de la
     portada. Cuando la tengas, guárdala como fotos/portada.jpg
     (o cambia solo la línea de abajo). */
  fotos: {
    portada:  'fotos/portada.jpg',   /* los novios en la puerta marrón (fondo del inicio) */
    parallax: 'fotos/arco.jpg',      /* el arco con vistas al valle (sección con capa oscura) */
    banda:    'fotos/foto.jpg',      /* el plano abierto de la puerta (banda entre regalos y confirmar) */
    cierre:   'fotos/ramo.jpg'       /* el primer plano con el ramo (dentro de la corona) */
  },

  /* MÚSICA · "River Flows in You" (Yiruma). La pieza sigue con
     derechos de autor y no hay versiones con licencia libre de verdad
     (lo comprobamos en Pixabay y Free Music Archive), así que:
     - Si guardas un MP3 con este nombre en la carpeta "musica"
       (por ejemplo una versión que tengáis con licencia), sonará
       aquí mismo, en la propia web.
     - Mientras el archivo no exista, el botón de la nota abre la
       versión oficial de YouTube en una pestaña nueva (el enlace de
       abajo). Más detalles en musica/LEEME.txt. */
  musica: 'musica/river-flows-in-you.mp3',
  musicaEnlace: 'https://www.youtube.com/watch?v=7maJOI3QMu0'
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
   La maquetación se voltea sola: la hoja de estilos usa propiedades
   lógicas, así que basta con poner dir="rtl" en la página.
   ================================================================ */
const Idioma = (() => {
  const traducibles = $$('[data-ar]');
  const botonEs = $('#btn-es');
  const botonAr = $('#btn-ar');
  const raiz = document.documentElement;

  const CIFRAS_AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

  const TITULOS = {
    es: 'Fatna & Miguel · 17 de octubre de 2026',
    ar: 'فاطنة وميغيل · ١٧ أكتوبر ٢٠٢٦'
  };

  const TEXTOS = {
    hoy:           { es:'¡Hoy es el gran día!',                            ar:'اليوم هو اليوم الكبير!' },
    yaCasados:     { es:'¡Ya estamos casados! Gracias por acompañarnos.',   ar:'لقد تزوّجنا! شكرًا لمشاركتنا هذا اليوم.' },
    enlaceCopiado: { es:'Enlace copiado. ¡Compártelo!',                     ar:'تم نسخ الرابط. شاركه!' },
    calendarioOk:  { es:'Evento descargado. Ábrelo para añadirlo.',         ar:'تم تنزيل الحدث. افتحه لإضافته.' },
    sinFormulario: { es:'El formulario aún no está listo. Lo publicaremos aquí muy pronto.', ar:'الاستمارة ليست جاهزة بعد. سننشرها هنا قريبًا.' },
    sinMusica:     { es:'La música estará lista muy pronto.',               ar:'ستكون الموسيقى جاهزة قريبًا.' },
    musicaYoutube: { es:'Abrimos nuestra canción en YouTube. ♪',            ar:'نفتح أغنيتنا على يوتيوب. ♪' }
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

  /* Convierte 441 en ٤٤١ cuando la página está en árabe */
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
   8 · MAPA Y ENLACES DE "CÓMO LLEGAR"
   -----------------------------------------------------------------
   Todo sale de CONFIG (mapa y mapaBusqueda), así que para cambiar de
   sitio basta con tocar esas dos líneas de arriba.

   El mapa además no se descarga hasta que se acerca a la pantalla:
   pesa bastante y quien abra la invitación solo para mirar la fecha
   no tiene por qué gastar esos datos.
   ================================================================ */
(() => {
  const caja = $('#mapa');
  const marco = $('iframe', caja);

  /* Todos los botones que llevan a Google Maps */
  $$('.enlace-mapa').forEach(enlace => { enlace.href = CONFIG.mapa; });

  function cargar(){
    if (marco.src) return;
    marco.src = 'https://www.google.com/maps?q=' +
      encodeURIComponent(CONFIG.mapaBusqueda) + '&hl=es&z=16&output=embed';
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

  /* 20261017T170000Z: el formato que pide el estándar iCalendar */
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
      'PRODID:-//Boda Fatna y Miguel//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:boda-fatna-miguel-20261017',
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
    enlace.download = 'boda-fatna-y-miguel.ics';
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
      title: 'Fatna & Miguel',
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
   -----------------------------------------------------------------
   Todos los botones con la clase "enlace-formulario" (el de la
   portada y el de la sección de confirmar) abren el Google Forms
   en una pestaña nueva.
   ================================================================ */
(() => {
  const botones = $$('.enlace-formulario');
  const url = (CONFIG.formulario || '').trim();

  botones.forEach(boton => {
    if (url){
      boton.href = url;
      boton.target = '_blank';
      boton.rel = 'noopener noreferrer';
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
  });
})();


/* ================================================================
   12 · FOTOS (portada, parallax y cierre)
   -----------------------------------------------------------------
   Cada foto se intenta cargar primero en memoria. Solo si el archivo
   existe de verdad se pone en la página; si falta, la web se queda
   con su aspecto de papel marfil y no se rompe nada.
   ================================================================ */
(() => {
  function cargarFoto(ruta, alCargar){
    if (!ruta) return;
    const foto = new Image();
    foto.onload = () => alCargar(ruta);
    foto.src = ruta;
  }

  /* Portada: la foto pasa a ser el fondo y la tarjeta flota encima */
  cargarFoto(CONFIG.fotos.portada, ruta => {
    const portada = $('#inicio');
    portada.style.setProperty('--foto-portada', `url("${ruta}")`);
    portada.classList.add('con-foto');
  });

  /* Sección parallax: fondo + capa oscura + texto en blanco */
  cargarFoto(CONFIG.fotos.parallax, ruta => {
    const seccion = $('#parallax');
    seccion.style.setProperty('--foto-parallax', `url("${ruta}")`);
    seccion.classList.add('con-foto');
  });

  /* Banda entre los regalos y la confirmación: si no hay foto, la
     sección sigue oculta y no queda un hueco vacío en medio */
  cargarFoto(CONFIG.fotos.banda, ruta => {
    const banda = $('#banda-foto');
    banda.style.setProperty('--foto-banda', `url("${ruta}")`);
    banda.hidden = false;
  });

  /* Cierre: la foto redonda dentro de la corona dorada */
  cargarFoto(CONFIG.fotos.cierre, ruta => {
    const imagen = $('#foto-cierre');
    imagen.src = ruta;
    imagen.alt = 'Fatna y Miguel';
    imagen.hidden = false;
  });
})();


/* ================================================================
   13 · MÚSICA DE FONDO
   -----------------------------------------------------------------
   La música arranca sola al entrar. Ojo: TODOS los navegadores
   bloquean el sonido automático en la primera visita (es una norma
   suya, no algo que se pueda desactivar desde la web). Por eso:

     1. Lo intentamos nada más cargar.
     2. Si el navegador lo bloquea, dejamos preparado el arranque
        para el primer gesto del invitado (un toque, un scroll, una
        tecla). En la práctica suena en cuanto empieza a mirar.

   Si alguien la apaga con el botón de la nota, se respeta su
   decisión y ya no se le vuelve a poner en las siguientes visitas.

   Si el MP3 está en la carpeta "musica", suena aquí mismo, en la
   web. Si todavía no está, el botón abre la versión oficial de
   YouTube en una pestaña nueva (CONFIG.musicaEnlace), para que
   nadie se quede sin la canción.
   ================================================================ */
(() => {
  const botones = [$('#btn-musica'), $('#btn-musica-pie')].filter(Boolean);
  const flotante = $('#btn-musica');
  const ruta = (CONFIG.musica || '').trim();
  const enlace = (CONFIG.musicaEnlace || '').trim();

  if ((!ruta && !enlace) || botones.length === 0) return;

  flotante.hidden = false;

  let audio = null;
  let fallo = !ruta;

  /* ¿El invitado la apagó a mano alguna vez? */
  const silenciada = () => {
    try { return localStorage.getItem('musica-boda') === 'no'; } catch(e){ return false; }
  };
  const recordar = valor => {
    try { localStorage.setItem('musica-boda', valor); } catch(e){ /* modo privado */ }
  };

  /* Preguntamos pronto si el archivo existe (solo los primeros KB,
     no la canción entera): así el primer toque ya sabe qué hacer. */
  if (ruta){
    const sonda = new Audio();
    sonda.preload = 'metadata';
    sonda.addEventListener('error', () => { fallo = true; });
    sonda.src = ruta;
  }

  function pintarEstado(sonando){
    flotante.setAttribute('aria-pressed', String(sonando));
    flotante.setAttribute('aria-label', sonando ? 'Pausar la música' : 'Activar la música');
  }

  function abrirEnlace(){
    if (!enlace){
      avisar(Idioma.texto('sinMusica'));
      return;
    }
    window.open(enlace, '_blank', 'noopener');
    avisar(Idioma.texto('musicaYoutube'));
  }

  function prepararAudio(){
    if (audio) return audio;
    audio = new Audio(ruta);
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      /* El archivo no está en la carpeta "musica": a partir de
         ahora el botón lleva a YouTube en vez de no hacer nada */
      fallo = true;
      pintarEstado(false);
    });
    return audio;
  }

  /* Llevamos nosotros la cuenta de si suena o no.
     No sirve mirar audio.paused: en cuanto llamas a play() pasa a
     false, aunque el navegador vaya a rechazar la reproducción medio
     segundo después. Si el botón se fiara de eso, en esa ventana haría
     lo contrario de lo que le pides. */
  let sonando = false;

  function encender(){
    prepararAudio().play()
      .then(() => {
        sonando = true;
        recordar('si');
        pintarEstado(true);
        quitarGestos();
      })
      .catch(() => {
        /* Bloqueado por el navegador: seguimos esperando un gesto */
        sonando = false;
        pintarEstado(false);
      });
  }

  function apagar(){
    sonando = false;
    recordar('no');
    if (audio) audio.pause();
    pintarEstado(false);
    quitarGestos();
  }

  function alternar(){
    if (fallo){
      abrirEnlace();
      return;
    }
    if (sonando) apagar(); else encender();
  }

  botones.forEach(boton => boton.addEventListener('click', alternar));


  /* ---- Arranque automático ------------------------------------ */

  /* Los navegadores solo consideran "gesto del usuario" unos eventos
     concretos; el scroll no siempre cuenta, por eso van varios. */
  const GESTOS = ['pointerdown','touchstart','keydown','scroll'];

  /* Ojo con el botón de la nota: su "pointerdown" llega ANTES que su
     "click". Si lo dejáramos pasar por aquí, la música arrancaría con
     el pointerdown y el click siguiente la pararía en el acto. Lo que
     se toque en los botones lo gestiona solo alternar(). */
  function alPrimerGesto(evento){
    const destino = evento && evento.target;
    if (destino && destino.closest && destino.closest('#btn-musica, #btn-musica-pie')) return;
    if (!sonando && !fallo) encender();
  }

  function quitarGestos(){
    GESTOS.forEach(evento => window.removeEventListener(evento, alPrimerGesto));
  }

  if (!ruta || silenciada()) return;

  GESTOS.forEach(evento =>
    window.addEventListener(evento, alPrimerGesto, { passive:true })
  );

  encender();
})();
