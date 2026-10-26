/* HUB MANTT — Fase 1 (solo lectura)
 * Datos: data/equipos.json, generado por tools/build_data.py a partir de
 *   - Plantilla_Levantamiento_Equipos_Planta.xlsx   -> equipos físicos
 *   - Plantilla_Digitalizacion_Equipos_v2.xlsx      -> procedimientos (Pasos_PuestaEnMarcha, Mantenimiento_Limpieza)
 * Rutas (hash; las de equipo son las que llevan los QR, no cambiarlas):
 *   #/                       Inicio
 *   #/equipos[?filtro=..]    Lista de equipos
 *   #/equipo/{CODIGO}        Ficha
 *   #/equipo/{CODIGO}/{sec}  funcionamiento | marcha | fallas | mantenimiento
 *   #/mantenimiento  #/fallas  #/admin
 */
(function () {
  'use strict';

  var JSQR_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  var AREA = 'Sistemas e Innovación';
  var app = document.getElementById('app');
  var DATA = null;
  var listaEstado = { q: '', cat: '' };

  // Datos mínimos para considerar una ficha completa
  var CAMPOS_CLAVE = [['fotos', 'foto'], ['categoria', 'categoría'], ['centro', 'centro de trabajo'], ['ubicacion', 'ubicación']];
  var ORDEN_FRECUENCIA = ['DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];

  var ICONS = {
    home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.7-6.7M14.7 6.3 13 4.6a4 4 0 0 0-5.6 5.6l.9.9L3 16.4V21h4.6l5.3-5.3"/>',
    alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2M18 16v2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    bolt: '<path d="M13 3 4 14h7l-1 7 9-11h-7z"/>',
    play: '<circle cx="12" cy="12" r="8.5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    drop: '<path d="M12 3.5s-6 6.4-6 10.5a6 6 0 0 0 12 0c0-4.1-6-10.5-6-10.5z"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.7-6.7M14.7 6.3 13 4.6a4 4 0 0 0-5.6 5.6l.9.9L3 16.4V21h4.6l5.3-5.3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>'; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Datos ---------- */

  fetch('data/equipos.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      DATA = json;
      DATA.porCodigo = {};
      DATA.equipos.forEach(function (e) { DATA.porCodigo[e.codigo] = e; });
      router();
    })
    .catch(function (err) {
      app.innerHTML = '<main class="wrap"><div class="empty">' + ic('alert') +
        'No se pudo cargar la base de equipos.<br><span class="mono">' + esc(err.message) + '</span></div></main>';
    });

  window.addEventListener('hashchange', router);

  function getEquipo(codigo) { return DATA.porCodigo[String(codigo || '').trim().toUpperCase()]; }
  function foto(n) { return 'assets/equipos/' + encodeURIComponent(n); }
  function urlEquipo(e, sec) { return '#/equipo/' + encodeURIComponent(e.codigo) + (sec ? '/' + sec : ''); }
  function plantillaDe(e) { return e.plantilla ? DATA.plantillas[e.plantilla] : null; }
  function equiposDePlantilla(k) { return DATA.equipos.filter(function (e) { return e.plantilla === k; }); }

  function faltantes(e) {
    return CAMPOS_CLAVE.filter(function (c) {
      var v = e[c[0]];
      return !v || (Array.isArray(v) && !v.length);
    }).map(function (c) { return c[1]; });
  }

  function nombreFamilia(k) {
    // el nombre más corto de la familia (ej. "Intercambiador de calor" y no "... de tubos concéntricos")
    var nombres = equiposDePlantilla(k).map(function (e) {
      return e.nombre.replace(/\s*\(.*$/, '').replace(/\s+\d+\s*$/, '').trim().toLowerCase();
    }).sort(function (a, b) { return a.length - b.length; });
    if (!nombres.length) return k;
    var n = nombres[0];
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  function agrupar(lista, clave) {
    var g = {}, orden = [];
    lista.forEach(function (x) {
      var k = clave(x);
      if (!g[k]) { g[k] = []; orden.push(k); }
      g[k].push(x);
    });
    return orden.map(function (k) { return { clave: k, items: g[k] }; });
  }

  function procedimientos(p) {
    return agrupar(p ? p.mantenimiento : [], function (t) { return t.tipo + '|' + (t.procedimiento || t.texto); })
      .map(function (g) {
        var conFrec = g.items.filter(function (t) { return t.frecuencia; })[0];
        return { tipo: g.items[0].tipo, nombre: g.items[0].procedimiento || g.items[0].texto, frecuencia: conFrec ? conFrec.frecuencia : null, pasos: g.items };
      });
  }

  function rangoFrecuencia(f) {
    if (!f) return 99;
    var up = f.toUpperCase();
    for (var i = 0; i < ORDEN_FRECUENCIA.length; i++) if (up.indexOf(ORDEN_FRECUENCIA[i]) === 0) return i;
    return 50;
  }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* ---------- Marco: encabezado + barra inferior ---------- */

  function encabezado(volver) {
    var izq = volver
      ? '<a class="back-btn" href="' + volver.href + '">' + ic('back') + '<span>' + esc(volver.txt) + '</span></a>'
      : '<div class="mark">HM</div><div class="top-name">HUB MANTT<small>Equipos de planta</small></div>';
    return '<header class="top"><div class="top-in">' + izq +
      '<div class="who" title="' + esc(AREA) + '"><span class="ava">SI</span><span>' + esc(AREA) + '</span></div>' +
      '</div></header>';
  }

  function barra(tab) {
    var tabs = [['inicio', '#/', 'home', 'Inicio'], ['equipos', '#/equipos', 'gear', 'Equipos'],
      ['mantenimiento', '#/mantenimiento', 'wrench', 'Mantenimiento'], ['fallas', '#/fallas', 'alert', 'Fallas'], ['admin', '#/admin', 'lock', 'Admin']];
    return '<nav class="nav" aria-label="Secciones"><div class="nav-in">' + tabs.map(function (t) {
      return '<a class="nav-b" href="' + t[1] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + ic(t[2]) + t[3] + '</a>';
    }).join('') + '</div></nav>';
  }

  function pintar(tab, cuerpo, volver) {
    app.innerHTML = encabezado(volver) + '<main class="wrap">' + cuerpo + '</main>' + barra(tab);
  }

  /* ---------- Router ---------- */

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, i = h.indexOf('?');
    if (i > -1) {
      h.slice(i + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      h = h.slice(0, i);
    }
    return { partes: h.split('/').filter(Boolean).map(decodeURIComponent), q: q };
  }

  function router() {
    if (!DATA) return;
    var r = parseHash(), p = r.partes;
    if (p[0] === 'equipo' && p[1]) { if (p[2]) vSeccion(p[1], p[2]); else vFicha(p[1]); }
    else if (p[0] === 'equipos') vLista(r.q);
    else if (p[0] === 'mantenimiento') vMantenimiento();
    else if (p[0] === 'fallas') vFallas();
    else if (p[0] === 'admin') vAdmin();
    else vInicio();
    window.scrollTo(0, 0);
  }

  /* ---------- Inicio ---------- */

  function vInicio() {
    var eq = DATA.equipos;
    var conProc = eq.filter(function (e) { return e.plantilla; }).length;
    var incompletos = eq.filter(function (e) { return faltantes(e).length; }).length;
    var sinUso = eq.filter(function (e) { return e.estado; }).length;
    var nTareas = 0;
    Object.keys(DATA.plantillas).forEach(function (k) { nTareas += procedimientos(DATA.plantillas[k]).length; });
    var h = new Date().getHours();
    var saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';

    function stat(n, txt, href, alerta) {
      return '<a class="stat" href="' + href + '"><b' + (alerta ? ' class="alerta"' : '') + '>' + n + '</b><span>' + txt + '</span></a>';
    }
    function mod(href, icon, titulo, sub, id) {
      return '<' + (id ? 'button type="button" id="' + id + '"' : 'a href="' + href + '"') + ' class="mod">' +
        '<span class="mod-ic">' + ic(icon) + '</span><span class="mod-tx"><b>' + titulo + '</b><small>' + sub + '</small></span>' + ic('chev') +
        '</' + (id ? 'button' : 'a') + '>';
    }

    pintar('inicio',
      '<section class="greet"><h1>' + saludo + ' &#128075;</h1><p>Consulta cómo operar y mantener cada equipo de planta.</p></section>' +
      '<button class="cta" type="button" id="btnQR"><span class="plus">' + ic('qr') + '</span>' +
        '<span><b>Escanear QR</b><small>Apunta a la placa del equipo para abrir su ficha</small></span></button>' +
      '<section class="stack"><div class="sec-h"><h2>Resumen</h2></div><div class="stats">' +
        stat(eq.length, 'Equipos registrados', '#/equipos', false) +
        stat(conProc, 'Con procedimiento', '#/equipos?filtro=procedimiento', false) +
        stat(incompletos, 'Fichas incompletas', '#/equipos?filtro=incompletos', incompletos > 0) +
        stat(sinUso, 'Sin uso / en reparación', '#/equipos?filtro=estado', sinUso > 0) +
      '</div></section>' +
      '<section class="stack"><div class="sec-h"><h2>Accesos rápidos</h2></div>' +
        mod('#/equipos?buscar=1', 'search', 'Buscar equipo', 'Por nombre o código') +
        mod('#/mantenimiento', 'wrench', 'Mantenimientos', plural(nTareas, 'tarea registrada', 'tareas registradas')) +
        mod('#/fallas', 'alert', 'Fallas conocidas', 'Síntoma, causa y solución') +
      '</section>');

    document.getElementById('btnQR').addEventListener('click', escanearQR);
  }

  /* ---------- Lista de equipos ---------- */

  var FILTROS = {
    incompletos: { titulo: 'Fichas incompletas', fn: function (e) { return faltantes(e).length; } },
    procedimiento: { titulo: 'Con procedimiento', fn: function (e) { return e.plantilla; } },
    estado: { titulo: 'Sin uso / en reparación', fn: function (e) { return e.estado; } }
  };

  function vLista(q) {
    var filtro = FILTROS[q.filtro];
    var cats = [];
    DATA.equipos.forEach(function (e) { if (e.categoria && cats.indexOf(e.categoria) === -1) cats.push(e.categoria); });
    cats.sort();
    if (listaEstado.cat && cats.indexOf(listaEstado.cat) === -1) listaEstado.cat = '';

    pintar('equipos',
      '<div class="s-head">' + (filtro ? '<span class="eyebrow">Equipos</span>' : '') +
        '<h1>' + (filtro ? esc(filtro.titulo) : 'Equipos') + '</h1></div>' +
      '<div class="filters">' +
        '<div class="search">' + ic('search') + '<input id="buscador" class="input" type="search" placeholder="Buscar por nombre o código" aria-label="Buscar equipo" value="' + esc(listaEstado.q) + '"></div>' +
        '<button class="btn primary block" type="button" id="btnQR">' + ic('qr') + 'Escanear QR del equipo</button>' +
        '<div class="chips" id="chips"><button class="chip" data-cat="">Todas</button>' +
          cats.map(function (c) { return '<button class="chip" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') +
        '</div>' +
        (filtro ? '<a class="count" href="#/equipos" style="color:var(--brand);font-weight:600">Ver todos los equipos</a>' : '') +
      '</div>' +
      '<div class="stack"><p class="count" id="contador"></p><div class="list" id="lista"></div></div>',
      filtro ? { href: '#/equipos', txt: 'Equipos' } : null);

    var buscador = document.getElementById('buscador');
    var lista = document.getElementById('lista');

    function render() {
      var f = listaEstado.q.trim().toLowerCase();
      var items = DATA.equipos.filter(function (e) {
        if (filtro && !filtro.fn(e)) return false;
        if (listaEstado.cat && e.categoria !== listaEstado.cat) return false;
        return !f || e.nombre.toLowerCase().indexOf(f) > -1 || e.codigo.toLowerCase().indexOf(f) > -1;
      });
      document.querySelectorAll('#chips .chip').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-cat') === listaEstado.cat ? 'true' : 'false');
      });
      document.getElementById('contador').textContent = plural(items.length, 'equipo', 'equipos');
      if (!items.length) { lista.innerHTML = '<div class="empty">' + ic('search') + 'Ningún equipo coincide con tu búsqueda.</div>'; return; }
      lista.innerHTML = items.map(function (e) {
        var meta = '<span class="mono">' + esc(e.codigo) + '</span>' + (e.centro ? '<span>· ' + esc(e.centro) + '</span>' : '');
        var extra = q.filtro === 'incompletos'
          ? '<span class="pill gris plano">Falta: ' + esc(faltantes(e).join(', ')) + '</span>'
          : e.estado ? '<span class="pill">' + esc(e.estado) + '</span>' : e.plantilla ? '<span class="pill ok">Con procedimiento</span>' : '';
        return '<a class="card" href="' + urlEquipo(e) + '">' +
          '<span class="thumb">' + (e.fotos.length ? '<img src="' + foto(e.fotos[0]) + '" alt="" loading="lazy">' : esc(e.codigo.split('-')[0])) + '</span>' +
          '<span class="main"><span class="name">' + esc(e.nombre) + '</span><span class="meta">' + meta + '</span>' +
          (extra ? '<span class="meta">' + extra + '</span>' : '') + '</span>' + ic('chev') + '</a>';
      }).join('');
    }

    render();
    buscador.addEventListener('input', function () { listaEstado.q = buscador.value; render(); });
    document.getElementById('chips').addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip');
      if (b) { listaEstado.cat = b.getAttribute('data-cat'); render(); }
    });
    document.getElementById('btnQR').addEventListener('click', escanearQR);
    if (q.buscar) buscador.focus();
  }

  /* ---------- Ficha ---------- */

  function noEncontrado(codigo) {
    pintar('equipos', '<div class="empty">' + ic('qr') + 'No se encontró ningún equipo con el código <b class="mono">' + esc(codigo) +
      '</b>.<br>Verifica el código grabado en la placa del equipo.</div>', { href: '#/equipos', txt: 'Equipos' });
  }

  function vFicha(codigo) {
    var e = getEquipo(codigo);
    if (!e) { noEncontrado(codigo); return; }
    if (e.codigo !== codigo) { location.replace(urlEquipo(e)); return; }
    var p = plantillaDe(e);
    var nProc = procedimientos(p).length;
    var nPasos = p ? p.puestaEnMarcha.length : 0;
    var nTec = e.bloques.reduce(function (a, b) { return a + b.campos.length; }, 0) + (e.parametros || []).length;

    function dato(label, v, full) {
      return '<div class="dato' + (full ? ' full' : '') + '"><span>' + label + '</span><b' + (v ? '>' + esc(v) : ' class="vacio">Sin registrar') + '</b></div>';
    }
    function secb(id, icon, titulo, txt, n) {
      return '<a class="secb' + (n ? '' : ' vacia') + '" href="' + urlEquipo(e, id) + '"><span class="ic">' + ic(icon) + '</span><b>' + titulo + '</b><small>' + txt + '</small></a>';
    }

    var galeria = e.fotos.length
      ? '<div class="gallery"><div class="gal" id="gal">' + e.fotos.map(function (f, i) {
          return '<img src="' + foto(f) + '" alt="' + esc(e.nombre) + '" data-i="' + i + '"' + (i ? ' loading="lazy"' : '') + '>';
        }).join('') + '</div>' + (e.fotos.length > 1 ? '<span class="gal-n" id="galn">1 / ' + e.fotos.length + '</span>' : '') + '</div>'
      : '<div class="nofoto">' + ic('image') + '<b>' + esc(e.codigo) + '</b><small>Foto pendiente</small></div>';

    pintar('equipos',
      galeria +
      '<div class="d-head"><h1>' + esc(e.nombre) + '</h1><div class="d-meta"><span class="mono">' + esc(e.codigo) + '</span>' +
        (e.departamento ? '<span>· ' + esc(e.departamento) + '</span>' : '') + (e.estado ? '<span class="pill">' + esc(e.estado) + '</span>' : '') + '</div></div>' +
      '<div class="datos">' +
        dato('Categoría', e.categoria) + dato('Capacidad', e.capacidad) +
        dato('Modelo', e.modelo) + dato('N° de serie', e.serie) +
        dato('Centro de trabajo', e.centro) + dato('Ubicación', e.ubicacion) +
        dato('Proveedor', e.proveedor, true) +
      '</div>' +
      '<div class="secs">' +
        secb('funcionamiento', 'bolt', 'Funcionamiento', nTec ? plural(nTec, 'dato técnico', 'datos técnicos') : 'Sin datos', nTec + e.notas.length) +
        secb('marcha', 'play', 'Puesta en marcha', nPasos ? plural(nPasos, 'paso', 'pasos') : 'Sin datos', nPasos) +
        secb('fallas', 'alert', 'Fallas y soluciones', 'Sin datos', 0) +
        secb('mantenimiento', 'wrench', 'Mantenimiento', nProc ? plural(nProc, 'tarea', 'tareas') : 'Sin datos', nProc) +
      '</div>',
      { href: '#/equipos', txt: 'Equipos' });

    var gal = document.getElementById('gal');
    if (gal) {
      var galn = document.getElementById('galn');
      if (galn) gal.addEventListener('scroll', function () {
        galn.textContent = (Math.round(gal.scrollLeft / gal.clientWidth) + 1) + ' / ' + e.fotos.length;
      }, { passive: true });
      gal.addEventListener('click', function (ev) {
        var i = ev.target.getAttribute('data-i');
        if (i != null) verFoto(e, +i);
      });
    }
  }

  function verFoto(e, i) {
    var v = document.createElement('div');
    v.className = 'viewer';
    v.innerHTML = '<div class="v-top"><b>' + esc(e.codigo) + '</b><span class="mono" style="color:#a9b6ae">' + (i + 1) + ' / ' + e.fotos.length + '</span>' +
      '<button class="x" type="button" aria-label="Cerrar">' + ic('x') + '</button></div>' +
      '<div class="v-img"><img src="' + foto(e.fotos[i]) + '" alt="' + esc(e.nombre) + '"></div>';
    v.addEventListener('click', function (ev) { if (ev.target.closest('.x') || ev.target.classList.contains('v-img')) v.remove(); });
    document.body.appendChild(v);
  }

  /* ---------- Secciones ---------- */

  var TITULOS = { funcionamiento: 'Funcionamiento', marcha: 'Puesta en marcha', fallas: 'Fallas y soluciones', mantenimiento: 'Mantenimiento' };

  function vSeccion(codigo, sec) {
    var e = getEquipo(codigo);
    if (!e) { noEncontrado(codigo); return; }
    if (!TITULOS[sec] || e.codigo !== codigo) { location.replace(urlEquipo(e, TITULOS[sec] ? sec : '')); return; }
    var p = plantillaDe(e);
    var cuerpo = '';

    if (sec === 'funcionamiento') {
      cuerpo = avisos(e) + listaParam(e, 'Parámetro', 'Parámetros de operación', 'bolt') + listaParam(e, 'Señal', 'Señales y alarmas', 'info') +
      e.bloques.map(function (b) {
        return '<div class="box"><h3>' + esc(b.titulo) + '</h3><div class="kv">' +
          b.campos.map(function (kv) { return '<span>' + esc(kv[0]) + '</span><b>' + esc(kv[1]) + '</b>'; }).join('') + '</div></div>';
      }).join('') +
      (e.notas.length ? '<div class="box"><h3>Observaciones</h3>' + e.notas.map(function (n) { return '<p class="muted">' + esc(n) + '</p>'; }).join('') + '</div>' : '');
      if (!cuerpo) cuerpo = vacio('bolt', 'Aún no hay datos técnicos registrados para este equipo.');
    }

    if (sec === 'marcha') {
      cuerpo = p && p.puestaEnMarcha.length
        ? compartido(e) + agrupar(p.puestaEnMarcha, function (x) { return x.tipo; }).map(function (g) {
            var t = g.clave === 'Puesta en marcha' ? 'Encendido' : g.clave;
            return '<section class="stack"><div class="grupo">' + esc(t) + '<span class="n">' + g.items.length + '</span></div>' +
              '<div class="box"><div class="steps">' + pasos(g.items, 'obs') + '</div></div></section>';
          }).join('')
        : vacio('play', 'Aún no hay pasos de puesta en marcha registrados para este equipo.');
    }

    if (sec === 'fallas') {
      cuerpo = vacio('alert', 'Aún no hay fallas documentadas para este equipo.<br>En la siguiente fase podrás reportar una falla con foto desde aquí.');
    }

    if (sec === 'mantenimiento') {
      var procs = procedimientos(p);
      if (procs.length) {
        var tipos = agrupar(procs, function (t) { return t.tipo; });
        tipos.sort(function (a, b) { return (a.clave === 'Limpieza') - (b.clave === 'Limpieza'); });
        cuerpo = avisos(e) + compartido(e) + tipos.map(function (g) {
          return '<section class="stack"><div class="grupo">' + esc(g.clave) + '<span class="n">' + g.items.length + '</span></div>' +
            g.items.map(tarea).join('') + '</section>';
        }).join('');
      } else {
        cuerpo = avisos(e) + vacio('wrench', 'Aún no hay tareas de mantenimiento o limpieza registradas para este equipo.');
      }
    }

    pintar('equipos',
      '<div class="s-head"><span class="eyebrow">' + esc(e.codigo) + ' · ' + esc(e.nombre) + '</span><h1>' + TITULOS[sec] + '</h1></div>' + cuerpo,
      { href: urlEquipo(e), txt: e.codigo });
  }

  function delTipo(e, tipo) {
    return (e.parametros || []).filter(function (x) { return x.tipo.toLowerCase() === tipo.toLowerCase(); });
  }

  function avisos(e) {
    return delTipo(e, 'Aviso').map(function (x) {
      return '<div class="warn" style="margin-top:0">' + ic('alert') + '<span><b>Importante:</b> ' + esc(x.texto) + '</span></div>';
    }).join('');
  }

  function listaParam(e, tipo, titulo, icon) {
    var xs = delTipo(e, tipo);
    if (!xs.length) return '';
    return '<div class="box"><h3>' + titulo + '</h3><div class="steps">' + xs.map(function (x) {
      return '<div class="step"><span class="step-n">' + ic(icon) + '</span><div><p>' + esc(x.texto) + '</p></div></div>';
    }).join('') + '</div></div>';
  }

  function vacio(icon, txt) { return '<div class="empty">' + ic(icon) + txt + '</div>'; }

  function compartido(e) {
    var otros = equiposDePlantilla(e.plantilla).filter(function (x) { return x.codigo !== e.codigo; });
    if (!otros.length) return '';
    return '<div class="note">' + ic('info') + '<span>Procedimiento común a todos los equipos de tipo <b>' + esc(nombreFamilia(e.plantilla).toLowerCase()) +
      '</b>: ' + otros.map(function (x) { return esc(x.codigo); }).join(', ') + '.</span></div>';
  }

  function pasos(lista, campoAviso) {
    return lista.map(function (s, i) {
      return '<div class="step"><span class="step-n">' + esc(s.n || i + 1) + '</span><div>' +
        '<p>' + esc(s.texto) + '</p>' +
        (s.duracion ? '<p class="tool">' + ic('info') + 'Duración: ' + esc(s.duracion) + '</p>' : '') +
        (s.herramientas ? '<p class="tool">' + ic('tool') + esc(s.herramientas) + '</p>' : '') +
        (s[campoAviso] ? '<div class="warn">' + ic('alert') + '<span>' + esc(s[campoAviso]) + '</span></div>' : '') +
        '</div></div>';
    }).join('');
  }

  function tarea(t) {
    return '<div class="box"><h3><span>' + esc(t.nombre) + '</span>' + (t.frecuencia ? '<span class="pill">' + esc(t.frecuencia) + '</span>' : '') + '</h3>' +
      '<div class="steps">' + pasos(t.pasos, 'notas') + '</div></div>';
  }

  /* ---------- Pestañas generales ---------- */

  function vMantenimiento() {
    var items = [];
    Object.keys(DATA.plantillas).forEach(function (k) {
      procedimientos(DATA.plantillas[k]).forEach(function (t) { items.push({ k: k, t: t }); });
    });
    items.sort(function (a, b) { return rangoFrecuencia(a.t.frecuencia) - rangoFrecuencia(b.t.frecuencia); });

    var cuerpo = '<div class="s-head"><h1>Mantenimiento</h1><p class="muted">Tareas de mantenimiento y limpieza, agrupadas por frecuencia.</p></div>';
    if (!items.length) { pintar('mantenimiento', cuerpo + vacio('wrench', 'Aún no hay tareas registradas.')); return; }
    cuerpo += agrupar(items, function (x) { return x.t.frecuencia ? x.t.frecuencia.toUpperCase() : 'Sin frecuencia definida'; })
      .map(function (g) {
        return '<section class="stack"><div class="grupo">' + esc(g.clave.charAt(0) + g.clave.slice(1).toLowerCase()) + '<span class="n">' + g.items.length + '</span></div>' +
          g.items.map(function (x) {
            return '<div class="box"><h3><span>' + esc(x.t.nombre) + '</span><span class="pill' + (x.t.tipo === 'Limpieza' ? ' ok' : '') + '">' + esc(x.t.tipo) + '</span></h3>' +
              '<p class="muted">' + esc(nombreFamilia(x.k)) + ' · ' + plural(x.t.pasos.length, 'paso', 'pasos') + '</p>' +
              '<div class="tags">' + equiposDePlantilla(x.k).map(function (e) {
                return '<a class="tag" href="' + urlEquipo(e, 'mantenimiento') + '">' + esc(e.codigo) + '</a>';
              }).join('') + '</div></div>';
          }).join('') + '</section>';
      }).join('') +
      '<p class="muted" style="font-size:13px">El registro de tareas realizadas (bitácora) llega en la Fase 2.</p>';
    pintar('mantenimiento', cuerpo);
  }

  function vFallas() {
    pintar('fallas', '<div class="s-head"><h1>Fallas</h1></div>' +
      vacio('alert', 'Aún no hay fallas documentadas.<br>En la Fase 2 cualquier persona podrá reportar una falla con foto, que llegará a Mantenimiento.'));
  }

  function vAdmin() {
    pintar('admin', '<div class="s-head"><h1>Admin</h1></div>' +
      vacio('lock', 'Panel de administración — disponible en la Fase 2.<br>Acceso con usuario y contraseña para editar equipos, fotos y procedimientos.') +
      '<p class="muted mono" style="text-align:center">Datos: ' + esc((DATA.generado || '').replace('T', ' ')) + ' · ' + plural(DATA.equipos.length, 'equipo', 'equipos') + '</p>');
  }

  /* ---------- Escáner QR ---------- */

  function codigoDesdeQR(texto) {
    texto = String(texto || '').trim();
    var m = texto.match(/equipo\/([^/?#\s]+)/i);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    return (texto.split(/[/#?=]/).filter(Boolean).pop() || '').toUpperCase();
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function irAEquipo(texto) {
    var codigo = codigoDesdeQR(texto);
    var e = getEquipo(codigo);
    if (e) location.hash = urlEquipo(e);
    else toast('No se encontró ningún equipo con el código "' + codigo + '".');
  }

  function pedirCodigo(mensaje) {
    var bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = '<form class="sheet"><h2>Escribir código</h2>' +
      (mensaje ? '<p class="muted">' + esc(mensaje) + '</p>' : '<p class="muted">Es el código grabado en la placa del equipo.</p>') +
      '<input class="input mono" name="c" placeholder="Ej. MARM-01" autocapitalize="characters" autocomplete="off" required>' +
      '<button class="btn primary block" type="submit">Abrir ficha</button>' +
      '<button class="btn block" type="button" data-x>Cancelar</button></form>';
    document.body.appendChild(bg);
    var input = bg.querySelector('input');
    input.focus();
    bg.addEventListener('click', function (ev) { if (ev.target === bg || ev.target.hasAttribute('data-x')) bg.remove(); });
    bg.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      bg.remove();
      irAEquipo(input.value);
    });
  }

  function cargarJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = JSQR_URL;
      s.onload = function () { ok(window.jsQR); };
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function escanearQR() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { pedirCodigo('Este navegador no permite usar la cámara.'); return; }
    var ov = document.createElement('div');
    ov.className = 'scanner';
    ov.innerHTML = '<video playsinline muted></video><div class="s-frame"></div>' +
      '<div class="v-top"><b>Escanear QR</b><button class="x" type="button" data-a="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div>' +
      '<div class="s-bar"><p>Apunta al código QR de la placa del equipo</p>' +
      '<button class="btn" type="button" data-a="manual">' + ic('keyboard') + 'Escribir código</button></div>';
    document.body.appendChild(ov);
    var video = ov.querySelector('video');
    var stream = null, activo = true, timer = null;

    function cerrar() {
      activo = false;
      clearTimeout(timer);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      ov.remove();
    }
    function encontrado(txt) { if (!activo) return; cerrar(); irAEquipo(txt); }
    ov.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-a]');
      if (!b) return;
      cerrar();
      if (b.getAttribute('data-a') === 'manual') pedirCodigo();
    });

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(function (s) {
        stream = s;
        if (!activo) { cerrar(); return; }
        video.srcObject = s;
        return video.play();
      })
      .then(function () {
        if (!activo) return;
        if ('BarcodeDetector' in window) {
          var det = new BarcodeDetector({ formats: ['qr_code'] });
          (function loop() {
            if (!activo) return;
            det.detect(video).then(function (c) {
              if (c.length) encontrado(c[0].rawValue); else timer = setTimeout(loop, 250);
            }).catch(function () { timer = setTimeout(loop, 400); });
          })();
        } else {
          // Safari / iPhone: no tienen BarcodeDetector, se usa jsQR
          cargarJsQR().then(function (jsQR) {
            var cv = document.createElement('canvas');
            var ctx = cv.getContext('2d', { willReadFrequently: true });
            (function loop() {
              if (!activo) return;
              if (video.videoWidth) {
                var w = Math.min(640, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
                cv.width = w; cv.height = h;
                ctx.drawImage(video, 0, 0, w, h);
                var r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
                if (r && r.data) { encontrado(r.data); return; }
              }
              timer = setTimeout(loop, 200);
            })();
          }).catch(function () { cerrar(); pedirCodigo('No se pudo cargar el lector de QR. Revisa la conexión.'); });
        }
      })
      .catch(function () { if (!activo) return; cerrar(); pedirCodigo('No se pudo acceder a la cámara.'); });
  }

  /* ---------- PWA ---------- */

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
