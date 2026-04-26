/* =========================================================================
 * media-player.js  —  Reproductor tipo Netflix / Prime Video (standalone)
 * -------------------------------------------------------------------------
 * USO:
 *   <script src="media-player.js"></script>
 *   MediaPlayer.setLibrary([episodios...]);          // catálogo completo
 *   MediaPlayer.play(episodio);                       // abrir y reproducir
 *   MediaPlayer.close();                              // cerrar
 *
 * El reproductor se monta sobre toda la pantalla cuando se invoca.
 * Toda la UI, CSS y lógica están en este archivo.
 * ========================================================================= */
(function (global) {
  'use strict';

  /* ---------- ESTADO GLOBAL ---------- */
  const state = {
    library: [],            // todos los episodios
    series: {},             // info de series por seriesid
    queue: [],              // cola de reproducción calculada
    queueIndex: 0,
    current: null,          // episodio actual
    root: null,             // contenedor raíz
    video: null,
    controlsTimer: null,
    pauseInfoTimer: null,
    seekAccumulator: 0,
    seekAccumTimer: null,
    seekDirection: 0,
    isOpen: false,
    subtitlesOn: true,
    volume: 1,
    muted: false,
    lastTap: 0,
  };

  /* ---------- API DE SERIES ---------- */
  function setSeries(arr) {
    state.series = {};
    (arr || []).forEach(s => { if (s && s.seriesid) state.series[s.seriesid] = s; });
  }
  function setLibrary(arr) {
    state.library = (arr || []).slice();
  }

  /* ---------- COLA DE REPRODUCCIÓN ---------- */
  function buildQueue(ep) {
    const lib = state.library;
    if (ep.seriesid) {
      // todos los episodios de la misma serie ordenados por fecha asc
      const sameSeries = lib
        .filter(e => e.seriesid === ep.seriesid)
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      const idx = sameSeries.findIndex(e => e.id === ep.id);
      const rest = lib.filter(e => e.seriesid !== ep.seriesid);
      const shuffledRest = shuffle(rest);
      // empieza desde el episodio actual y continua serie, luego el resto aleatorio
      const seriesFromHere = sameSeries.slice(idx >= 0 ? idx : 0);
      state.queue = seriesFromHere.concat(shuffledRest);
    } else {
      const others = lib.filter(e => e.id !== ep.id);
      state.queue = [ep].concat(shuffle(others));
    }
    state.queueIndex = 0;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function nextEpisode() {
    if (state.queueIndex < state.queue.length - 1) {
      state.queueIndex++;
      loadEpisode(state.queue[state.queueIndex]);
    }
  }
  function prevEpisode() {
    if (state.queueIndex > 0) {
      state.queueIndex--;
      loadEpisode(state.queue[state.queueIndex]);
    }
  }

  /* ---------- ESTILOS ---------- */
  const CSS = `
  .mp-root{position:fixed;inset:0;z-index:99999;background:#000;color:#fff;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    opacity:0;transition:opacity .25s ease;user-select:none;-webkit-user-select:none;}
  .mp-root.mp-open{opacity:1;}
  .mp-stage{position:absolute;inset:0;background:#000;overflow:hidden;}
  .mp-video{width:100%;height:100%;object-fit:contain;background:#000;display:block;}
  .mp-video::cue{background:rgba(0,0,0,.6);color:#fff;font-size:1.1em;}

  /* ----- Loader ----- */
  .mp-loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .2s;}
  .mp-loader.mp-show{opacity:1;}
  .mp-spinner{width:64px;height:64px;border:4px solid rgba(255,255,255,.2);
    border-top-color:#fff;border-radius:50%;animation:mp-spin 1s linear infinite;}
  @keyframes mp-spin{to{transform:rotate(360deg);}}

  /* ----- Indicador seek ----- */
  .mp-seek-ind{position:absolute;top:50%;transform:translateY(-50%);
    background:rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    color:#fff;padding:18px 26px;border-radius:50%;
    display:flex;flex-direction:column;align-items:center;gap:4px;
    pointer-events:none;opacity:0;transition:opacity .2s;font-size:13px;font-weight:600;}
  .mp-seek-ind.mp-show{opacity:1;animation:mp-pop .35s ease;}
  .mp-seek-ind.mp-back{left:18%;}
  .mp-seek-ind.mp-fwd{right:18%;}
  .mp-seek-ind svg{width:38px;height:38px;}
  @keyframes mp-pop{0%{transform:translateY(-50%) scale(.7);}50%{transform:translateY(-50%) scale(1.1);}100%{transform:translateY(-50%) scale(1);}}

  /* ----- Indicador play/pause central ----- */
  .mp-pp-ind{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    background:rgba(0,0,0,.5);backdrop-filter:blur(10px);
    width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    pointer-events:none;opacity:0;}
  .mp-pp-ind.mp-show{animation:mp-ppanim .55s ease forwards;}
  .mp-pp-ind svg{width:48px;height:48px;fill:#fff;}
  @keyframes mp-ppanim{0%{opacity:1;transform:translate(-50%,-50%) scale(.6);}100%{opacity:0;transform:translate(-50%,-50%) scale(1.4);}}

  /* ----- Top bar ----- */
  .mp-top{position:absolute;top:0;left:0;right:0;padding:18px 24px;
    background:linear-gradient(to bottom,rgba(0,0,0,.85),transparent);
    display:flex;align-items:center;gap:14px;z-index:10;
    transform:translateY(-100%);transition:transform .3s ease,opacity .3s;opacity:0;}
  .mp-root.mp-controls-on .mp-top{transform:translateY(0);opacity:1;}
  .mp-back-btn{background:none;border:0;color:#fff;cursor:pointer;padding:8px;border-radius:50%;display:flex;}
  .mp-back-btn:hover{background:rgba(255,255,255,.15);}
  .mp-back-btn svg{width:26px;height:26px;}
  .mp-title-area{display:flex;flex-direction:column;cursor:pointer;flex:1;min-width:0;}
  .mp-title-area:hover .mp-title{text-decoration:underline;}
  .mp-title{font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mp-subtitle{font-size:13px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

  /* ----- Bottom controls ----- */
  .mp-bottom{position:absolute;bottom:0;left:0;right:0;padding:14px 24px 22px;
    background:linear-gradient(to top,rgba(0,0,0,.9),transparent);z-index:10;
    transform:translateY(100%);transition:transform .3s ease,opacity .3s;opacity:0;}
  .mp-root.mp-controls-on .mp-bottom{transform:translateY(0);opacity:1;}
  .mp-root.mp-controls-on{cursor:default;}
  .mp-root:not(.mp-controls-on){cursor:none;}

  /* progress */
  .mp-progress-wrap{padding:8px 0;cursor:pointer;}
  .mp-progress{height:5px;background:rgba(255,255,255,.25);border-radius:3px;position:relative;transition:height .15s;}
  .mp-progress-wrap:hover .mp-progress{height:8px;}
  .mp-buffered{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.4);border-radius:3px;}
  .mp-played{position:absolute;left:0;top:0;bottom:0;background:#e50914;border-radius:3px;}
  .mp-thumb{position:absolute;top:50%;width:14px;height:14px;background:#e50914;border-radius:50%;
    transform:translate(-50%,-50%) scale(0);transition:transform .15s;}
  .mp-progress-wrap:hover .mp-thumb{transform:translate(-50%,-50%) scale(1);}

  .mp-ctrl-row{display:flex;align-items:center;gap:6px;margin-top:6px;}
  .mp-btn{background:none;border:0;color:#fff;cursor:pointer;padding:8px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;transition:background .15s,transform .15s;}
  .mp-btn:hover{background:rgba(255,255,255,.18);}
  .mp-btn:active{transform:scale(.92);}
  .mp-btn svg{width:22px;height:22px;fill:#fff;}
  .mp-btn-big svg{width:30px;height:30px;}
  .mp-btn-big{padding:10px;}
  .mp-time{font-size:13px;font-variant-numeric:tabular-nums;margin:0 10px;opacity:.9;}
  .mp-spacer{flex:1;}

  /* volumen */
  .mp-vol{display:flex;align-items:center;gap:4px;}
  .mp-vol-slider{width:0;overflow:hidden;transition:width .25s ease;}
  .mp-vol:hover .mp-vol-slider{width:90px;}
  .mp-vol-slider input{width:90px;}

  input[type=range].mp-range{-webkit-appearance:none;background:transparent;height:18px;cursor:pointer;}
  input[type=range].mp-range::-webkit-slider-runnable-track{height:4px;background:rgba(255,255,255,.3);border-radius:2px;}
  input[type=range].mp-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#fff;border-radius:50%;margin-top:-5px;}
  input[type=range].mp-range::-moz-range-track{height:4px;background:rgba(255,255,255,.3);border-radius:2px;}
  input[type=range].mp-range::-moz-range-thumb{width:14px;height:14px;background:#fff;border:0;border-radius:50%;}

  /* skip buttons */
  .mp-skip{position:absolute;right:24px;bottom:120px;background:rgba(255,255,255,.95);color:#000;
    padding:10px 20px;border:0;border-radius:4px;font-weight:600;cursor:pointer;font-size:14px;
    z-index:11;transition:transform .2s,opacity .2s;display:none;}
  .mp-skip:hover{background:#fff;transform:scale(1.05);}
  .mp-skip.mp-show{display:block;animation:mp-fadein .25s;}

  /* next-up overlay (al terminar) */
  .mp-nextup{position:absolute;right:24px;bottom:120px;background:rgba(20,20,20,.92);
    backdrop-filter:blur(12px);padding:16px;border-radius:8px;width:340px;z-index:11;display:none;
    border:1px solid rgba(255,255,255,.1);}
  .mp-nextup.mp-show{display:block;animation:mp-fadein .35s;}
  .mp-nextup h4{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:.7;}
  .mp-nextup-card{display:flex;gap:12px;cursor:pointer;}
  .mp-nextup-card img{width:120px;height:68px;object-fit:cover;border-radius:4px;background:#222;}
  .mp-nextup-card .t{font-weight:600;font-size:14px;margin-bottom:4px;}
  .mp-nextup-card .d{font-size:12px;opacity:.7;line-height:1.3;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

  /* sidebar episodes */
  .mp-sidebar{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:90vw;
    background:rgba(15,15,15,.96);backdrop-filter:blur(18px);
    transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);
    z-index:20;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.08);}
  .mp-sidebar.mp-show{transform:translateX(0);}
  .mp-sidebar-head{padding:20px;display:flex;align-items:center;justify-content:space-between;
    border-bottom:1px solid rgba(255,255,255,.08);}
  .mp-sidebar-head h3{margin:0;font-size:18px;}
  .mp-sidebar-list{overflow-y:auto;padding:12px;flex:1;}
  .mp-ep-item{display:flex;gap:12px;padding:10px;border-radius:6px;cursor:pointer;margin-bottom:8px;
    transition:background .15s;}
  .mp-ep-item:hover{background:rgba(255,255,255,.08);}
  .mp-ep-item.mp-active{background:rgba(229,9,20,.18);}
  .mp-ep-item img{width:130px;height:73px;object-fit:cover;border-radius:4px;background:#222;flex-shrink:0;}
  .mp-ep-item .meta{flex:1;min-width:0;}
  .mp-ep-item .meta .t{font-weight:600;font-size:14px;margin-bottom:4px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .mp-ep-item .meta .d{font-size:12px;opacity:.7;line-height:1.3;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

  /* floating grid de episodios (scroll up) */
  .mp-floating{position:absolute;left:0;right:0;bottom:0;top:30%;
    background:linear-gradient(to top,rgba(0,0,0,.95) 30%,rgba(0,0,0,.6));
    backdrop-filter:blur(12px);padding:24px;overflow-y:auto;z-index:15;
    transform:translateY(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}
  .mp-floating.mp-show{transform:translateY(0);}
  .mp-floating-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
  .mp-floating-head h3{margin:0;font-size:20px;}
  .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
  .mp-grid-item{cursor:pointer;transition:transform .2s;}
  .mp-grid-item:hover{transform:scale(1.04);}
  .mp-grid-item img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;background:#222;}
  .mp-grid-item .t{font-weight:600;font-size:14px;margin-top:8px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .mp-grid-item .d{font-size:12px;opacity:.6;}

  /* info modal (glass) */
  .mp-info{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.4);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    z-index:30;opacity:0;pointer-events:none;transition:opacity .3s;padding:40px;}
  .mp-info.mp-show{opacity:1;pointer-events:auto;}
  .mp-info-card{background:linear-gradient(135deg,rgba(40,40,50,.7),rgba(20,20,30,.85));
    border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:32px;
    max-width:780px;width:100%;max-height:85vh;overflow-y:auto;
    box-shadow:0 20px 60px rgba(0,0,0,.6);}
  .mp-info-hero{display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;}
  .mp-info-hero img{width:200px;border-radius:8px;background:#222;flex-shrink:0;}
  .mp-info-hero .meta{flex:1;min-width:240px;}
  .mp-info-hero h2{margin:0 0 6px;font-size:28px;}
  .mp-info-hero h3{margin:0 0 10px;font-size:15px;font-weight:400;opacity:.7;}
  .mp-info-hero .tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;}
  .mp-info-hero .tag{background:rgba(255,255,255,.12);padding:3px 9px;border-radius:3px;font-size:12px;}
  .mp-info-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}
  .mp-info-btn{padding:10px 20px;border:0;border-radius:4px;cursor:pointer;font-weight:600;
    font-size:14px;display:flex;align-items:center;gap:8px;transition:transform .15s,opacity .15s;}
  .mp-info-btn:hover{transform:scale(1.04);}
  .mp-info-btn.primary{background:#fff;color:#000;}
  .mp-info-btn.secondary{background:rgba(255,255,255,.18);color:#fff;}
  .mp-info p.desc{line-height:1.5;font-size:14px;opacity:.9;margin:8px 0;}
  .mp-info .field{font-size:13px;opacity:.75;margin:4px 0;}
  .mp-info .field b{opacity:1;color:#fff;}

  /* subtitle / settings menu */
  .mp-menu{position:absolute;background:rgba(20,20,20,.96);backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:6px;min-width:160px;
    z-index:25;display:none;}
  .mp-menu.mp-show{display:block;animation:mp-fadein .15s;}
  .mp-menu button{display:block;width:100%;background:none;border:0;color:#fff;text-align:left;
    padding:8px 14px;cursor:pointer;border-radius:4px;font-size:13px;}
  .mp-menu button:hover{background:rgba(255,255,255,.1);}
  .mp-menu button.active::before{content:"✓ ";color:#e50914;}

  @keyframes mp-fadein{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

  @media (max-width:640px){
    .mp-sidebar{width:100%;}
    .mp-info-card{padding:20px;}
    .mp-info-hero img{width:140px;}
    .mp-title{font-size:15px;}
    .mp-time{font-size:11px;margin:0 4px;}
    .mp-btn svg{width:20px;height:20px;}
    .mp-btn-big svg{width:26px;height:26px;}
  }
  `;

  /* ---------- ICONOS ---------- */
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    back10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>',
    fwd10: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM9.5 12L18 6v12z"/></svg>',
    vol: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0014 8v2.18l2.45 2.45c.03-.2.05-.41.05-.63zM3 9v6h4l5 5V14.41L7.41 9.83 3 9zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"/></svg>',
    fs: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    fsExit: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    cc: '<svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM11 11H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    backArrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    info: '<svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
  };

  /* ---------- HELPERS ---------- */
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function tsToSec(ts) {
    if (!ts && ts !== 0) return null;
    if (typeof ts === 'number') return ts;
    const parts = String(ts).split(':').map(Number);
    if (parts.some(isNaN)) return null;
    let s = 0;
    for (const p of parts) s = s * 60 + p;
    return s;
  }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function injectCSS() {
    if (document.getElementById('mp-styles')) return;
    const s = document.createElement('style');
    s.id = 'mp-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- BUILD UI ---------- */
  function buildUI() {
    const root = el('div', 'mp-root');
    root.innerHTML = `
      <div class="mp-stage">
        <video class="mp-video" playsinline preload="auto" crossorigin="anonymous"></video>

        <div class="mp-loader"><div class="mp-spinner"></div></div>
        <div class="mp-pp-ind"></div>
        <div class="mp-seek-ind mp-back"></div>
        <div class="mp-seek-ind mp-fwd"></div>

        <div class="mp-top">
          <button class="mp-back-btn" data-act="close" title="Cerrar">${ICON.backArrow}</button>
          <div class="mp-title-area" data-act="info">
            <div class="mp-title"></div>
            <div class="mp-subtitle"></div>
          </div>
        </div>

        <button class="mp-skip" data-act="skip"></button>
        <div class="mp-nextup"></div>

        <div class="mp-bottom">
          <div class="mp-progress-wrap">
            <div class="mp-progress">
              <div class="mp-buffered"></div>
              <div class="mp-played"></div>
              <div class="mp-thumb"></div>
            </div>
          </div>
          <div class="mp-ctrl-row">
            <button class="mp-btn" data-act="prev" title="Anterior">${ICON.prev}</button>
            <button class="mp-btn mp-btn-big" data-act="back10" title="-10s">${ICON.back10}</button>
            <button class="mp-btn mp-btn-big" data-act="playpause" title="Play/Pause">${ICON.play}</button>
            <button class="mp-btn mp-btn-big" data-act="fwd10" title="+10s">${ICON.fwd10}</button>
            <button class="mp-btn" data-act="next" title="Siguiente">${ICON.next}</button>
            <div class="mp-vol">
              <button class="mp-btn" data-act="mute" title="Silenciar">${ICON.vol}</button>
              <div class="mp-vol-slider"><input type="range" class="mp-range" data-act="volume" min="0" max="1" step="0.01" value="1"></div>
            </div>
            <span class="mp-time">0:00 / 0:00</span>
            <div class="mp-spacer"></div>
            <button class="mp-btn" data-act="cc" title="Subtítulos">${ICON.cc}</button>
            <button class="mp-btn" data-act="episodes" title="Episodios">${ICON.list}</button>
            <button class="mp-btn" data-act="info-btn" title="Información">${ICON.info}</button>
            <button class="mp-btn" data-act="fs" title="Pantalla completa">${ICON.fs}</button>
          </div>
        </div>

        <aside class="mp-sidebar">
          <div class="mp-sidebar-head">
            <h3>Próximos episodios</h3>
            <button class="mp-btn" data-act="episodes-close">${ICON.close}</button>
          </div>
          <div class="mp-sidebar-list"></div>
        </aside>

        <section class="mp-floating">
          <div class="mp-floating-head">
            <h3>Ver más</h3>
            <button class="mp-btn" data-act="floating-close">${ICON.close}</button>
          </div>
          <div class="mp-grid"></div>
        </section>

        <div class="mp-info">
          <div class="mp-info-card"></div>
        </div>

        <div class="mp-menu mp-cc-menu"></div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  /* ---------- CONTROLES (mostrar/ocultar) ---------- */
  function showControls() {
    state.root.classList.add('mp-controls-on');
    clearTimeout(state.controlsTimer);
    if (!state.video.paused) {
      state.controlsTimer = setTimeout(hideControls, 4000);
    }
  }
  function hideControls() {
    if (state.video.paused) return;
    state.root.classList.remove('mp-controls-on');
    // cerrar menus colgantes
    state.root.querySelector('.mp-cc-menu').classList.remove('mp-show');
  }

  /* ---------- INDICADORES ---------- */
  function flashPlayPause(isPlay) {
    const el = state.root.querySelector('.mp-pp-ind');
    el.innerHTML = isPlay ? ICON.play : ICON.pause;
    el.classList.remove('mp-show'); void el.offsetWidth;
    el.classList.add('mp-show');
  }
  function flashSeek(dir, totalSec) {
    const cls = dir > 0 ? 'mp-fwd' : 'mp-back';
    const node = state.root.querySelector('.mp-seek-ind.' + cls);
    node.innerHTML = (dir > 0 ? ICON.fwd10 : ICON.back10) + `<span>${Math.abs(totalSec)}s</span>`;
    node.classList.remove('mp-show'); void node.offsetWidth;
    node.classList.add('mp-show');
    clearTimeout(node._t);
    node._t = setTimeout(() => node.classList.remove('mp-show'), 700);
  }

  /* ---------- SEEK 10s ACUMULADO ---------- */
  function seekBy(dir) {
    const v = state.video;
    if (state.seekDirection !== dir) {
      state.seekAccumulator = 0;
      state.seekDirection = dir;
    }
    state.seekAccumulator += 10 * dir;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + 10 * dir));
    flashSeek(dir, state.seekAccumulator);
    clearTimeout(state.seekAccumTimer);
    state.seekAccumTimer = setTimeout(() => {
      state.seekAccumulator = 0;
      state.seekDirection = 0;
    }, 900);
  }

  /* ---------- INFO MODAL ---------- */
  function buildInfoCard() {
    const ep = state.current; if (!ep) return '';
    const series = ep.seriesid && state.series[ep.seriesid];
    const img = ep.thumbnail2 || ep.thumbnail || (series && series.portada_serie) || '';
    const tags = (ep.utilidad || '').split(',').map(t => t.trim()).filter(Boolean);
    const has = v => v !== false && v != null && v !== '' ? v : '<i style="opacity:.5">No disponible</i>';
    return `
      <div class="mp-info-hero">
        ${img ? `<img src="${img}" alt="">` : ''}
        <div class="meta">
          <h2>${ep.title || 'Sin título'}</h2>
          ${series ? `<h3>De la serie: ${series.titulo_serie || ''}</h3>` : ''}
          <div class="tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          <p class="desc">${ep.description || ''}</p>
          ${series ? `<p class="desc" style="opacity:.75">${series.descripcion_serie || ''}</p>` : ''}
          <div class="field"><b>Producción:</b> ${has(ep.proudccion || ep.produccion)}</div>
          <div class="field"><b>Fecha:</b> ${has(ep.date)}</div>
          <div class="mp-info-actions">
            <button class="mp-info-btn primary" data-act="info-resume">▶ Continuar viendo</button>
            <button class="mp-info-btn secondary" data-act="info-next">⏭ Ver siguiente</button>
            <button class="mp-info-btn secondary" data-act="info-restart">↺ Volver al inicio</button>
            ${ep.allowDownload ? `<a class="mp-info-btn secondary" href="${ep.mediaUrl}" download>⬇ Descargar</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  function openInfo() {
    const card = state.root.querySelector('.mp-info-card');
    card.innerHTML = buildInfoCard();
    state.root.querySelector('.mp-info').classList.add('mp-show');
  }
  function closeInfo() {
    state.root.querySelector('.mp-info').classList.remove('mp-show');
  }

  /* ---------- SIDEBAR / FLOATING ---------- */
  function renderSidebar() {
    const list = state.root.querySelector('.mp-sidebar-list');
    list.innerHTML = '';
    const items = state.queue.slice(state.queueIndex);
    items.forEach((ep, i) => {
      const it = el('div', 'mp-ep-item' + (i === 0 ? ' mp-active' : ''));
      it.innerHTML = `
        <img src="${ep.thumbnail || ''}" alt="" onerror="this.style.opacity=.2">
        <div class="meta">
          <div class="t">${ep.title || 'Sin título'}</div>
          <div class="d">${ep.description || ''}</div>
        </div>`;
      it.addEventListener('click', () => {
        state.queueIndex = state.queueIndex + i;
        loadEpisode(state.queue[state.queueIndex]);
        toggleSidebar(false);
      });
      list.appendChild(it);
    });
  }
  function toggleSidebar(force) {
    const sb = state.root.querySelector('.mp-sidebar');
    const willShow = force == null ? !sb.classList.contains('mp-show') : force;
    if (willShow) renderSidebar();
    sb.classList.toggle('mp-show', willShow);
  }
  function renderFloating() {
    const grid = state.root.querySelector('.mp-grid');
    grid.innerHTML = '';
    const items = state.queue.slice(state.queueIndex + 1, state.queueIndex + 13);
    items.forEach((ep, i) => {
      const it = el('div', 'mp-grid-item');
      it.innerHTML = `
        <img src="${ep.thumbnail || ''}" alt="" onerror="this.style.opacity=.2">
        <div class="t">${ep.title || ''}</div>
        <div class="d">${ep.date || ''}</div>`;
      it.addEventListener('click', () => {
        state.queueIndex = state.queueIndex + 1 + i;
        loadEpisode(state.queue[state.queueIndex]);
        toggleFloating(false);
      });
      grid.appendChild(it);
    });
  }
  function toggleFloating(force) {
    const fl = state.root.querySelector('.mp-floating');
    const willShow = force == null ? !fl.classList.contains('mp-show') : force;
    if (willShow) renderFloating();
    fl.classList.toggle('mp-show', willShow);
  }

  /* ---------- SUBTITULOS MENU ---------- */
  function openCcMenu(anchor) {
    const menu = state.root.querySelector('.mp-cc-menu');
    const tracks = state.video.textTracks;
    let html = `<button data-cc="-1" class="${state.subtitlesOn ? '' : 'active'}">Desactivado</button>`;
    for (let i = 0; i < tracks.length; i++) {
      html += `<button data-cc="${i}" class="${state.subtitlesOn && tracks[i].mode === 'showing' ? 'active' : ''}">${tracks[i].label || tracks[i].language || 'Pista ' + (i + 1)}</button>`;
    }
    if (tracks.length === 0) html += `<button disabled style="opacity:.5">Sin subtítulos</button>`;
    menu.innerHTML = html;
    const r = anchor.getBoundingClientRect();
    const rr = state.root.getBoundingClientRect();
    menu.style.left = (r.left - rr.left - 60) + 'px';
    menu.style.bottom = (rr.bottom - r.top + 10) + 'px';
    menu.style.top = 'auto';
    menu.classList.add('mp-show');
    menu.querySelectorAll('button[data-cc]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.cc, 10);
        for (let i = 0; i < tracks.length; i++) tracks[i].mode = 'disabled';
        if (idx >= 0 && tracks[idx]) { tracks[idx].mode = 'showing'; state.subtitlesOn = true; }
        else state.subtitlesOn = false;
        menu.classList.remove('mp-show');
      });
    });
  }

  /* ---------- CARGAR EPISODIO ---------- */
  function loadEpisode(ep) {
    state.current = ep;
    const v = state.video;
    v.src = ep.mediaUrl || ep.mediaUrl2 || ep.trailer || '';
    // limpiar tracks
    while (v.firstChild) v.removeChild(v.firstChild);
    if (ep.subtitlesUrl) {
      const tr = document.createElement('track');
      tr.kind = 'subtitles';
      tr.label = 'Subtítulos';
      tr.srclang = 'es';
      tr.src = ep.subtitlesUrl;
      tr.default = true;
      v.appendChild(tr);
    }
    // estilo de fondo segun bgColor
    if (ep.bgColor) state.root.style.background = ep.bgColor;

    // titulo
    const series = ep.seriesid && state.series[ep.seriesid];
    state.root.querySelector('.mp-title').textContent = ep.title || 'Sin título';
    state.root.querySelector('.mp-subtitle').textContent = series ? series.titulo_serie : (ep.proudccion || ep.produccion || '');

    state.root.querySelector('.mp-nextup').classList.remove('mp-show');
    closeInfo();
    showLoader(true);
    v.load();
    const playPromise = v.play();
    if (playPromise && playPromise.catch) playPromise.catch(() => {/* autoplay bloqueado */});
    setMediaSession();
  }

  function showLoader(on) {
    state.root.querySelector('.mp-loader').classList.toggle('mp-show', on);
  }

  /* ---------- MEDIA SESSION ---------- */
  function setMediaSession() {
    if (!('mediaSession' in navigator) || !state.current) return;
    const ep = state.current;
    const series = ep.seriesid && state.series[ep.seriesid];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ep.title || '',
        artist: ep.proudccion || ep.produccion || '',
        album: series ? series.titulo_serie : '',
        artwork: [
          { src: ep.thumbnail2 || ep.thumbnail || '', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.setActionHandler('play', () => state.video.play());
      navigator.mediaSession.setActionHandler('pause', () => state.video.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => seekBy(-1));
      navigator.mediaSession.setActionHandler('seekforward', () => seekBy(1));
      navigator.mediaSession.setActionHandler('previoustrack', prevEpisode);
      navigator.mediaSession.setActionHandler('nexttrack', nextEpisode);
    } catch (e) {/*noop*/}
  }

  /* ---------- SKIP intro/recap/credits ---------- */
  function checkSkip() {
    const ep = state.current;
    const v = state.video;
    if (!ep) return;
    const t = v.currentTime;
    const btn = state.root.querySelector('.mp-skip');
    let target = null, label = null;
    function inRange(r) {
      if (!r) return null;
      const s = tsToSec(r.start), e = tsToSec(r.end);
      if (s == null || e == null) return null;
      return (t >= s && t < e) ? e : null;
    }
    let end;
    if ((end = inRange(ep.skipIntro))) { target = end; label = 'Saltar intro'; }
    else if ((end = inRange(ep.skipRecap))) { target = end; label = 'Saltar resumen'; }
    else if ((end = inRange(ep.skipCredits))) { target = end; label = 'Saltar créditos'; }
    if (target) {
      btn.textContent = label;
      btn.dataset.target = target;
      btn.classList.add('mp-show');
    } else {
      btn.classList.remove('mp-show');
    }
  }

  /* ---------- NEXT-UP overlay (próximos 10s del final) ---------- */
  function checkNextUp() {
    const v = state.video;
    if (!v.duration || v.duration - v.currentTime > 15) {
      state.root.querySelector('.mp-nextup').classList.remove('mp-show');
      return;
    }
    const next = state.queue[state.queueIndex + 1];
    if (!next) return;
    const nu = state.root.querySelector('.mp-nextup');
    if (nu.classList.contains('mp-show')) return;
    nu.innerHTML = `
      <h4>A continuación</h4>
      <div class="mp-nextup-card">
        <img src="${next.thumbnail || ''}" alt="">
        <div>
          <div class="t">${next.title || ''}</div>
          <div class="d">${next.description || ''}</div>
        </div>
      </div>`;
    nu.classList.add('mp-show');
    nu.querySelector('.mp-nextup-card').addEventListener('click', nextEpisode);
  }

  /* ---------- EVENTOS ---------- */
  function wireEvents() {
    const root = state.root;
    const v = state.video;

    // mouse / touch para mostrar controles
    const stage = root.querySelector('.mp-stage');
    stage.addEventListener('mousemove', showControls);
    stage.addEventListener('touchstart', showControls, { passive: true });

    // tap/click central -> play/pause + toggle controles
    stage.addEventListener('click', (e) => {
      if (e.target.closest('.mp-top, .mp-bottom, .mp-sidebar, .mp-floating, .mp-info, .mp-menu, .mp-skip, .mp-nextup')) return;
      const now = Date.now();
      if (now - state.lastTap < 300) return; // doble tap manejado abajo
      state.lastTap = now;
      setTimeout(() => {
        if (Date.now() - state.lastTap < 280) return;
        // single tap
        if (root.classList.contains('mp-controls-on')) {
          togglePlay();
        } else {
          showControls();
        }
      }, 280);
    });
    // doble tap para seek
    stage.addEventListener('dblclick', (e) => {
      if (e.target.closest('.mp-top, .mp-bottom, .mp-sidebar, .mp-floating, .mp-info, .mp-menu')) return;
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left;
      seekBy(x < r.width / 2 ? -1 : 1);
    });

    // wheel: scroll up -> floating, scroll down -> hide
    let wheelAcc = 0, wheelTimer;
    stage.addEventListener('wheel', (e) => {
      wheelAcc += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => wheelAcc = 0, 200);
      if (wheelAcc < -80) { toggleFloating(true); wheelAcc = 0; }
      if (wheelAcc > 80) { toggleFloating(false); wheelAcc = 0; }
    }, { passive: true });

    // touch swipe vertical para floating
    let tStartY = null;
    stage.addEventListener('touchstart', (e) => { tStartY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (tStartY == null) return;
      const dy = e.changedTouches[0].clientY - tStartY;
      if (dy < -80) toggleFloating(true);
      if (dy > 80) toggleFloating(false);
      tStartY = null;
    });

    // delegacion de clicks en botones
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const act = t.dataset.act;
      switch (act) {
        case 'close': close(); break;
        case 'playpause': togglePlay(); break;
        case 'back10': seekBy(-1); break;
        case 'fwd10': seekBy(1); break;
        case 'prev': prevEpisode(); break;
        case 'next': nextEpisode(); break;
        case 'mute': toggleMute(); break;
        case 'fs': toggleFs(); break;
        case 'cc': openCcMenu(t); e.stopPropagation(); break;
        case 'episodes': toggleSidebar(); break;
        case 'episodes-close': toggleSidebar(false); break;
        case 'floating-close': toggleFloating(false); break;
        case 'info': case 'info-btn': openInfo(); break;
        case 'info-resume': closeInfo(); v.play(); break;
        case 'info-next': closeInfo(); nextEpisode(); break;
        case 'info-restart': closeInfo(); v.currentTime = 0; v.play(); break;
        case 'skip':
          const tgt = parseFloat(t.dataset.target);
          if (!isNaN(tgt)) v.currentTime = tgt;
          break;
      }
    });

    // info: click para cerrar (excluye botones)
    root.querySelector('.mp-info').addEventListener('click', (e) => {
      if (e.target.closest('.mp-info-btn, .mp-info-actions')) return;
      closeInfo();
    });

    // volumen
    root.querySelector('[data-act="volume"]').addEventListener('input', (e) => {
      v.volume = parseFloat(e.target.value);
      v.muted = v.volume === 0;
      state.volume = v.volume;
    });

    // progreso
    const pw = root.querySelector('.mp-progress-wrap');
    let dragging = false;
    function seekFromEvt(ev) {
      const r = pw.getBoundingClientRect();
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const ratio = Math.max(0, Math.min(1, x / r.width));
      v.currentTime = ratio * (v.duration || 0);
    }
    pw.addEventListener('mousedown', (e) => { dragging = true; seekFromEvt(e); });
    document.addEventListener('mousemove', (e) => { if (dragging) seekFromEvt(e); });
    document.addEventListener('mouseup', () => dragging = false);
    pw.addEventListener('touchstart', (e) => { dragging = true; seekFromEvt(e); }, { passive: true });
    pw.addEventListener('touchmove', (e) => { if (dragging) seekFromEvt(e); }, { passive: true });
    pw.addEventListener('touchend', () => dragging = false);

    // video events
    v.addEventListener('loadedmetadata', () => { showLoader(false); updateProgress(); });
    v.addEventListener('waiting', () => showLoader(true));
    v.addEventListener('canplay', () => showLoader(false));
    v.addEventListener('playing', () => { showLoader(false); updatePlayBtn(); });
    v.addEventListener('pause', () => { updatePlayBtn(); startPauseInfoTimer(); showControls(); clearTimeout(state.controlsTimer); });
    v.addEventListener('play', () => { updatePlayBtn(); clearTimeout(state.pauseInfoTimer); state.controlsTimer = setTimeout(hideControls, 4000); });
    v.addEventListener('timeupdate', () => { updateProgress(); checkSkip(); checkNextUp(); });
    v.addEventListener('progress', updateBuffered);
    v.addEventListener('volumechange', updateVolBtn);
    v.addEventListener('ended', () => {
      if (state.queueIndex < state.queue.length - 1) nextEpisode();
    });
    v.addEventListener('error', () => { showLoader(false); console.warn('[MediaPlayer] error de carga', v.error); });

    // teclado
    document.addEventListener('keydown', keyHandler);

    // fullscreen change
    document.addEventListener('fullscreenchange', updateFsBtn);
  }

  function keyHandler(e) {
    if (!state.isOpen) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const v = state.video;
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); togglePlay(); break;
      case 'f': toggleFs(); break;
      case 'm': toggleMute(); break;
      case 'c': state.subtitlesOn = !state.subtitlesOn; toggleCC(); break;
      case 'ArrowRight': seekBy(1); break;
      case 'ArrowLeft': seekBy(-1); break;
      case 'ArrowUp': v.volume = Math.min(1, v.volume + 0.05); break;
      case 'ArrowDown': v.volume = Math.max(0, v.volume - 0.05); break;
      case 'n': case 'N': nextEpisode(); break;
      case 'p': case 'P': prevEpisode(); break;
      case 'i': case 'I': openInfo(); break;
      case 'Escape':
        if (state.root.querySelector('.mp-info').classList.contains('mp-show')) closeInfo();
        else if (document.fullscreenElement) document.exitFullscreen();
        else close();
        break;
    }
    showControls();
  }

  function toggleCC() {
    const tracks = state.video.textTracks;
    if (!tracks.length) return;
    if (state.subtitlesOn) tracks[0].mode = 'showing';
    else for (let i = 0; i < tracks.length; i++) tracks[i].mode = 'disabled';
  }

  function togglePlay() {
    const v = state.video;
    if (v.paused) { v.play(); flashPlayPause(true); }
    else { v.pause(); flashPlayPause(false); }
  }
  function toggleMute() {
    const v = state.video;
    v.muted = !v.muted;
    updateVolBtn();
  }
  function toggleFs() {
    if (!document.fullscreenElement) state.root.requestFullscreen?.();
    else document.exitFullscreen();
  }
  function updateFsBtn() {
    const btn = state.root.querySelector('[data-act="fs"]');
    btn.innerHTML = document.fullscreenElement ? ICON.fsExit : ICON.fs;
  }
  function updatePlayBtn() {
    const btn = state.root.querySelector('[data-act="playpause"]');
    btn.innerHTML = state.video.paused ? ICON.play : ICON.pause;
  }
  function updateVolBtn() {
    const btn = state.root.querySelector('[data-act="mute"]');
    btn.innerHTML = (state.video.muted || state.video.volume === 0) ? ICON.mute : ICON.vol;
    state.root.querySelector('[data-act="volume"]').value = state.video.muted ? 0 : state.video.volume;
  }
  function updateProgress() {
    const v = state.video;
    const ratio = v.duration ? (v.currentTime / v.duration) : 0;
    state.root.querySelector('.mp-played').style.width = (ratio * 100) + '%';
    state.root.querySelector('.mp-thumb').style.left = (ratio * 100) + '%';
    state.root.querySelector('.mp-time').textContent = `${fmt(v.currentTime)} / ${fmt(v.duration || 0)}`;
  }
  function updateBuffered() {
    const v = state.video;
    if (!v.buffered.length || !v.duration) return;
    const end = v.buffered.end(v.buffered.length - 1);
    state.root.querySelector('.mp-buffered').style.width = ((end / v.duration) * 100) + '%';
  }

  /* ---------- Pausa > 8s -> abrir info ---------- */
  function startPauseInfoTimer() {
    clearTimeout(state.pauseInfoTimer);
    state.pauseInfoTimer = setTimeout(() => {
      if (state.video.paused) openInfo();
    }, 8000);
  }

  /* ---------- API PÚBLICA ---------- */
  function open() {
    if (state.isOpen) return;
    injectCSS();
    state.root = buildUI();
    state.video = state.root.querySelector('.mp-video');
    wireEvents();
    state.isOpen = true;
    requestAnimationFrame(() => state.root.classList.add('mp-open'));
    document.documentElement.style.overflow = 'hidden';
    showControls();
  }
  function close() {
    if (!state.isOpen) return;
    try { state.video.pause(); } catch (e) {}
    document.removeEventListener('keydown', keyHandler);
    state.root.classList.remove('mp-open');
    setTimeout(() => {
      state.root?.remove();
      state.root = null; state.video = null; state.isOpen = false;
      document.documentElement.style.overflow = '';
    }, 250);
  }
  function play(ep) {
    if (!ep) return;
    if (!state.isOpen) open();
    buildQueue(ep);
    loadEpisode(state.queue[state.queueIndex]);
  }

  global.MediaPlayer = {
    setLibrary,
    setSeries,
    play,
    close,
    next: nextEpisode,
    prev: prevEpisode,
    get current() { return state.current; },
  };

})(window);
