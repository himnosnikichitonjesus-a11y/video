/* =========================================================================
 *  media-player.js  —  Reproductor estilo Netflix / Prime Video
 *  Autocontenido: HTML + CSS + JS + animaciones inyectados al vuelo.
 *
 *  Uso global:
 *     MediaPlayer.play(episodeId, { episodes, series });
 *     MediaPlayer.play(episodeObject, { episodes, series });
 *
 *  Donde:
 *     episodes : array de episodios (ver episodios.js)
 *     series   : array de series (opcional)
 *
 *  Si no se pasa { episodes, series }, intenta usar window.EPISODIOS y
 *  window.SERIES como fuentes globales.
 * ========================================================================= */
(function (global) {
  'use strict';

  /* ----------------------------- Estilos CSS ----------------------------- */
  const CSS = `
  .mp-root,.mp-root *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .mp-root{position:fixed;inset:0;z-index:2147483000;background:#000;color:#fff;display:none;opacity:0;transition:opacity .35s ease}
  .mp-root.mp-open{display:block;opacity:1}
  .mp-root.mp-cursor-hidden{cursor:none}
  .mp-stage{position:absolute;inset:0;background:#000;overflow:hidden}
  .mp-video{width:100%;height:100%;object-fit:contain;background:#000;display:block}

  /* Loader */
  .mp-loader{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .25s}
  .mp-loader.show{opacity:1}
  .mp-spin{width:64px;height:64px;border:4px solid rgba(255,255,255,.15);border-top-color:#fff;border-radius:50%;animation:mp-spin 1s linear infinite}
  @keyframes mp-spin{to{transform:rotate(360deg)}}

  /* Overlays gradiente */
  .mp-grad-top,.mp-grad-bot{position:absolute;left:0;right:0;pointer-events:none;transition:opacity .3s ease}
  .mp-grad-top{top:0;height:200px;background:linear-gradient(180deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.4) 60%,transparent 100%)}
  .mp-grad-bot{bottom:0;height:260px;background:linear-gradient(0deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 55%,transparent 100%)}
  .mp-controls-hidden .mp-grad-top,.mp-controls-hidden .mp-grad-bot{opacity:0}

  /* Top bar */
  .mp-top{position:absolute;top:0;left:0;right:0;padding:22px 32px;display:flex;align-items:center;gap:16px;z-index:5;transition:opacity .3s ease,transform .3s ease}
  .mp-controls-hidden .mp-top{opacity:0;transform:translateY(-12px);pointer-events:none}
  .mp-back{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);color:#fff;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:background .2s,transform .2s}
  .mp-back:hover{background:rgba(255,255,255,.18);transform:scale(1.06)}
  .mp-title-btn{background:none;border:0;color:#fff;font-size:20px;font-weight:600;cursor:pointer;text-align:left;line-height:1.2;padding:6px 10px;border-radius:6px;transition:background .2s;max-width:60vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-title-btn:hover{background:rgba(255,255,255,.1)}
  .mp-title-btn small{display:block;font-size:12px;font-weight:500;opacity:.75;margin-top:2px}

  /* Bottom controls */
  .mp-bottom{position:absolute;left:0;right:0;bottom:0;padding:18px 32px 26px;z-index:5;transition:opacity .3s ease,transform .3s ease}
  .mp-controls-hidden .mp-bottom{opacity:0;transform:translateY(12px);pointer-events:none}

  .mp-progress-wrap{position:relative;height:18px;display:flex;align-items:center;cursor:pointer;margin-bottom:8px}
  .mp-progress{position:relative;width:100%;height:4px;background:rgba(255,255,255,.25);border-radius:2px;transition:height .15s}
  .mp-progress-wrap:hover .mp-progress{height:6px}
  .mp-buffer{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,.4);border-radius:2px;width:0%}
  .mp-played{position:absolute;top:0;left:0;height:100%;background:#e50914;border-radius:2px;width:0%}
  .mp-thumb{position:absolute;top:50%;width:14px;height:14px;background:#e50914;border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s;left:0%}
  .mp-progress-wrap:hover .mp-thumb{transform:translate(-50%,-50%) scale(1)}
  .mp-time-tip{position:absolute;bottom:22px;background:rgba(0,0,0,.85);padding:4px 8px;border-radius:4px;font-size:12px;font-variant-numeric:tabular-nums;transform:translateX(-50%);pointer-events:none;opacity:0;transition:opacity .15s;white-space:nowrap}
  .mp-progress-wrap:hover .mp-time-tip{opacity:1}

  .mp-row{display:flex;align-items:center;gap:14px}
  .mp-btn{background:none;border:0;color:#fff;cursor:pointer;display:grid;place-items:center;border-radius:50%;transition:background .15s,transform .15s;padding:8px}
  .mp-btn:hover{background:rgba(255,255,255,.18);transform:scale(1.08)}
  .mp-btn svg{width:24px;height:24px;display:block;fill:currentColor}
  .mp-btn.big{padding:10px}
  .mp-btn.big svg{width:34px;height:34px}
  .mp-btn.huge svg{width:40px;height:40px}

  .mp-time{font-variant-numeric:tabular-nums;font-size:14px;opacity:.92;margin-left:6px;white-space:nowrap}
  .mp-spacer{flex:1}

  /* Volumen */
  .mp-vol{display:flex;align-items:center;gap:6px}
  .mp-vol-bar{width:0;overflow:hidden;transition:width .25s ease}
  .mp-vol:hover .mp-vol-bar,.mp-vol.open .mp-vol-bar{width:90px}
  .mp-vol-range{-webkit-appearance:none;appearance:none;width:90px;height:4px;background:rgba(255,255,255,.3);border-radius:2px;outline:none}
  .mp-vol-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;background:#fff;border-radius:50%;cursor:pointer}
  .mp-vol-range::-moz-range-thumb{width:12px;height:12px;background:#fff;border-radius:50%;cursor:pointer;border:0}

  /* Skip indicators (doble tap +/- 10s) */
  .mp-skip-ind{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.55);border-radius:50%;width:120px;height:120px;display:grid;place-items:center;color:#fff;font-weight:600;font-size:14px;opacity:0;pointer-events:none;text-align:center}
  .mp-skip-ind svg{width:48px;height:48px;fill:#fff}
  .mp-skip-ind.left{left:14%}
  .mp-skip-ind.right{right:14%}
  .mp-skip-ind.show{animation:mp-skip-pop .7s ease forwards}
  @keyframes mp-skip-pop{0%{opacity:0;transform:translateY(-50%) scale(.8)}30%{opacity:1;transform:translateY(-50%) scale(1.05)}100%{opacity:0;transform:translateY(-50%) scale(1)}}

  /* Center play overlay (cuando está pausado) */
  .mp-center-play{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:0;transition:opacity .25s}
  .mp-center-play.show{opacity:1}
  .mp-center-play .circ{width:96px;height:96px;border-radius:50%;background:rgba(0,0,0,.55);display:grid;place-items:center;border:2px solid rgba(255,255,255,.7)}
  .mp-center-play svg{width:46px;height:46px;fill:#fff}

  /* Skip intro / next button bottom-right */
  .mp-skip-cta{position:absolute;right:32px;bottom:120px;background:rgba(20,20,20,.85);color:#fff;border:1px solid rgba(255,255,255,.6);padding:10px 22px;font-size:15px;font-weight:600;cursor:pointer;border-radius:4px;backdrop-filter:blur(6px);z-index:6;transition:opacity .25s,transform .25s,background .15s;opacity:0;transform:translateY(8px);pointer-events:none}
  .mp-skip-cta.show{opacity:1;transform:translateY(0);pointer-events:auto}
  .mp-skip-cta:hover{background:#fff;color:#000}

  /* Sidebar próximos episodios */
  .mp-side{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:90vw;background:rgba(15,15,15,.96);backdrop-filter:blur(14px);transform:translateX(100%);transition:transform .35s cubic-bezier(.2,.8,.2,1);z-index:8;display:flex;flex-direction:column;border-left:1px solid rgba(255,255,255,.08)}
  .mp-side.open{transform:translateX(0)}
  .mp-side-head{padding:22px 22px 12px;display:flex;align-items:center;justify-content:space-between}
  .mp-side-head h3{font-size:18px;font-weight:600}
  .mp-side-list{overflow-y:auto;padding:8px 14px 24px;flex:1}
  .mp-ep-card{display:flex;gap:12px;padding:10px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:6px}
  .mp-ep-card:hover{background:rgba(255,255,255,.08)}
  .mp-ep-card.current{background:rgba(229,9,20,.18)}
  .mp-ep-thumb{width:140px;aspect-ratio:16/9;border-radius:6px;background:#222 center/cover no-repeat;flex-shrink:0;position:relative;overflow:hidden}
  .mp-ep-thumb .num{position:absolute;left:6px;top:4px;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700}
  .mp-ep-info h4{font-size:13px;font-weight:600;margin-bottom:4px;line-height:1.3}
  .mp-ep-info p{font-size:11px;opacity:.65;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

  /* Grid flotante (al hacer scroll en el video) */
  .mp-grid{position:absolute;left:0;right:0;bottom:0;top:0;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,.92) 35%);overflow-y:auto;padding:25vh 40px 60px;z-index:7;opacity:0;pointer-events:none;transition:opacity .35s}
  .mp-grid.open{opacity:1;pointer-events:auto}
  .mp-grid h2{font-size:22px;font-weight:600;margin-bottom:18px}
  .mp-grid-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
  .mp-grid-card{cursor:pointer;border-radius:8px;overflow:hidden;background:#1a1a1a;transition:transform .25s}
  .mp-grid-card:hover{transform:scale(1.04)}
  .mp-grid-card .t{aspect-ratio:16/9;background:#222 center/cover no-repeat}
  .mp-grid-card .b{padding:10px 12px}
  .mp-grid-card h4{font-size:14px;font-weight:600;margin-bottom:4px}
  .mp-grid-card p{font-size:12px;opacity:.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

  /* Info modal */
  .mp-info{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:5vh 6vw;z-index:9;opacity:0;pointer-events:none;transition:opacity .35s}
  .mp-info.open{opacity:1;pointer-events:auto}
  .mp-info-bg{position:absolute;inset:0;background:linear-gradient(135deg,rgba(10,10,15,.55),rgba(0,0,0,.75));backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%)}
  .mp-info-card{position:relative;max-width:980px;width:100%;max-height:90vh;overflow-y:auto;background:linear-gradient(180deg,rgba(30,30,35,.55),rgba(15,15,20,.7));border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:36px 42px;box-shadow:0 30px 80px rgba(0,0,0,.6);animation:mp-info-in .4s cubic-bezier(.2,.8,.2,1)}
  @keyframes mp-info-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  .mp-info-grid{display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:start}
  @media (max-width:720px){.mp-info-grid{grid-template-columns:1fr}}
  .mp-info-poster{width:100%;aspect-ratio:2/3;border-radius:10px;background:#222 center/cover no-repeat;box-shadow:0 12px 30px rgba(0,0,0,.5)}
  .mp-info h1{font-size:30px;font-weight:700;margin-bottom:6px;line-height:1.15}
  .mp-info .mp-info-sub{font-size:14px;opacity:.7;margin-bottom:18px}
  .mp-info .mp-info-desc{font-size:15px;line-height:1.55;opacity:.92;margin-bottom:18px}
  .mp-info .mp-info-meta{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13px;opacity:.85;margin-bottom:22px}
  .mp-info .mp-info-meta b{opacity:.7;font-weight:500}
  .mp-info-actions{display:flex;flex-wrap:wrap;gap:10px}
  .mp-action{padding:11px 22px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;border:0;display:inline-flex;align-items:center;gap:8px;transition:transform .15s,background .2s}
  .mp-action.primary{background:#fff;color:#000}
  .mp-action.primary:hover{background:#e5e5e5;transform:scale(1.03)}
  .mp-action.ghost{background:rgba(255,255,255,.18);color:#fff}
  .mp-action.ghost:hover{background:rgba(255,255,255,.28);transform:scale(1.03)}
  .mp-info-close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.5);border:0;color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer;display:grid;place-items:center}
  .mp-info-close:hover{background:rgba(255,255,255,.2)}

  /* Menus (audio / subs / settings) */
  .mp-menu{position:absolute;bottom:80px;background:rgba(20,20,20,.96);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:8px;min-width:220px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.5);z-index:7;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .2s,transform .2s}
  .mp-menu.open{opacity:1;transform:translateY(0);pointer-events:auto}
  .mp-menu h5{font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.55;padding:8px 12px 4px}
  .mp-menu button{display:flex;width:100%;align-items:center;gap:10px;padding:10px 12px;background:none;border:0;color:#fff;cursor:pointer;border-radius:5px;font-size:13px;text-align:left}
  .mp-menu button:hover{background:rgba(255,255,255,.1)}
  .mp-menu button.active{color:#e50914;font-weight:600}
  .mp-menu button .check{margin-left:auto;opacity:0}
  .mp-menu button.active .check{opacity:1}

  /* Toast siguiente episodio */
  .mp-next-toast{position:absolute;right:32px;bottom:120px;width:320px;background:rgba(15,15,15,.95);border:1px solid rgba(255,255,255,.12);border-radius:10px;overflow:hidden;z-index:7;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .3s,transform .3s}
  .mp-next-toast.show{opacity:1;transform:translateY(0);pointer-events:auto}
  .mp-next-toast .nt-thumb{width:100%;aspect-ratio:16/9;background:#222 center/cover no-repeat;position:relative}
  .mp-next-toast .nt-bar{position:absolute;left:0;bottom:0;height:3px;background:#e50914;width:0%;transition:width .25s linear}
  .mp-next-toast .nt-body{padding:14px 16px}
  .mp-next-toast .nt-label{font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
  .mp-next-toast .nt-title{font-size:15px;font-weight:600;margin-bottom:10px;line-height:1.3}
  .mp-next-toast .nt-actions{display:flex;gap:8px}
  .mp-next-toast .nt-actions button{flex:1;padding:8px;border:0;border-radius:5px;cursor:pointer;font-weight:600;font-size:13px}
  .mp-next-toast .nt-play{background:#fff;color:#000}
  .mp-next-toast .nt-cancel{background:rgba(255,255,255,.18);color:#fff}

  /* Esconder mientras está cargando */
  .mp-hide{display:none !important}
  `;

  /* ----------------------------- Iconos SVG ------------------------------ */
  const ICO = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    back10: '<svg viewBox="0 0 24 24"><path d="M12.5 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V2L7 6l5.5 4V3z"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="Arial">10</text></svg>',
    fwd10: '<svg viewBox="0 0 24 24"><path d="M11.5 3v3a7 7 0 1 1-7 7h-2a9 9 0 1 0 9-9V2l5.5 4-5.5 4V3z"/><text x="13" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="Arial">10</text></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>',
    volHi: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>',
    volLo: '<svg viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7zm9.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
    volMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.5 4.5 0 0 0 .05-.63zM19 12a7 7 0 0 1-.7 3l1.5 1.5A8.97 8.97 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    exitFull: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
    cc: '<svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z"/></svg>',
    audio: '<svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 9a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    info: '<svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="check" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
  };

  /* ----------------------------- Helpers --------------------------------- */
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
  };
  const parseTime = (t) => {
    if (typeof t === 'number') return t;
    if (!t || typeof t !== 'string') return null;
    const p = t.split(':').map(Number);
    if (p.some(isNaN)) return null;
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return null;
  };
  const has = (v) => v !== undefined && v !== null && v !== false && v !== '';
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ============================ Estado global ============================ */
  const State = {
    mounted: false,
    root: null, video: null, els: {},
    episodes: [], series: [],
    current: null, currentSeries: null,
    queue: [], queueIndex: 0,
    isPlaying: false,
    controlsTimer: null,
    pauseInfoTimer: null,
    cursorTimer: null,
    skipShownFor: { intro: false, recap: false, credits: false },
    audioTrack: 1, // 1 = mediaUrl, 2 = mediaUrl2
    subOn: false, subIndex: 0,
    nextToastShown: false,
    rememberTime: 0
  };

  /* ============================ Construcción DOM ========================= */
  function injectStyles() {
    if (document.getElementById('mp-styles')) return;
    const s = document.createElement('style');
    s.id = 'mp-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();
    const root = document.createElement('div');
    root.className = 'mp-root';
    root.innerHTML = `
      <div class="mp-stage" data-mp="stage">
        <video class="mp-video" data-mp="video" playsinline crossorigin="anonymous"></video>

        <div class="mp-grad-top"></div>
        <div class="mp-grad-bot"></div>

        <div class="mp-loader" data-mp="loader"><div class="mp-spin"></div></div>

        <div class="mp-center-play" data-mp="centerPlay"><div class="circ">${ICO.play}</div></div>

        <div class="mp-skip-ind left" data-mp="skipLeft">${ICO.back10}<span style="position:absolute;bottom:18px">-10s</span></div>
        <div class="mp-skip-ind right" data-mp="skipRight">${ICO.fwd10}<span style="position:absolute;bottom:18px">+10s</span></div>

        <div class="mp-top">
          <button class="mp-back" data-mp="close" title="Cerrar">${ICO.close}</button>
          <button class="mp-title-btn" data-mp="titleBtn">
            <span data-mp="titleText">Título</span>
            <small data-mp="seriesText"></small>
          </button>
        </div>

        <button class="mp-skip-cta" data-mp="skipCta">Saltar intro</button>

        <div class="mp-bottom">
          <div class="mp-progress-wrap" data-mp="progressWrap">
            <div class="mp-progress">
              <div class="mp-buffer" data-mp="buffer"></div>
              <div class="mp-played" data-mp="played"></div>
              <div class="mp-thumb" data-mp="thumb"></div>
            </div>
            <div class="mp-time-tip" data-mp="timeTip">0:00</div>
          </div>
          <div class="mp-row">
            <button class="mp-btn huge" data-mp="play" title="Reproducir/Pausar (Espacio)">${ICO.play}</button>
            <button class="mp-btn big" data-mp="back10" title="-10s (←)">${ICO.back10}</button>
            <button class="mp-btn big" data-mp="fwd10" title="+10s (→)">${ICO.fwd10}</button>
            <button class="mp-btn" data-mp="nextEp" title="Siguiente episodio (N)">${ICO.next}</button>
            <div class="mp-vol">
              <button class="mp-btn" data-mp="mute" title="Silenciar (M)">${ICO.volHi}</button>
              <div class="mp-vol-bar"><input class="mp-vol-range" data-mp="vol" type="range" min="0" max="1" step="0.01" value="1"></div>
            </div>
            <span class="mp-time" data-mp="time">0:00 / 0:00</span>
            <div class="mp-spacer"></div>
            <button class="mp-btn" data-mp="audioBtn" title="Pista de audio">${ICO.audio}</button>
            <button class="mp-btn" data-mp="ccBtn" title="Subtítulos (C)">${ICO.cc}</button>
            <button class="mp-btn" data-mp="listBtn" title="Lista de episodios">${ICO.list}</button>
            <button class="mp-btn" data-mp="full" title="Pantalla completa (F)">${ICO.full}</button>
          </div>
        </div>

        <div class="mp-menu" data-mp="audioMenu" style="right:200px"></div>
        <div class="mp-menu" data-mp="ccMenu" style="right:160px"></div>

        <aside class="mp-side" data-mp="side">
          <div class="mp-side-head">
            <h3 data-mp="sideTitle">Próximos episodios</h3>
            <button class="mp-btn" data-mp="sideClose">${ICO.close}</button>
          </div>
          <div class="mp-side-list" data-mp="sideList"></div>
        </aside>

        <div class="mp-grid" data-mp="grid">
          <h2 data-mp="gridTitle">Más episodios</h2>
          <div class="mp-grid-wrap" data-mp="gridWrap"></div>
        </div>

        <div class="mp-next-toast" data-mp="nextToast">
          <div class="nt-thumb" data-mp="ntThumb"><div class="nt-bar" data-mp="ntBar"></div></div>
          <div class="nt-body">
            <div class="nt-label">A continuación</div>
            <div class="nt-title" data-mp="ntTitle"></div>
            <div class="nt-actions">
              <button class="nt-play" data-mp="ntPlay">Ver ahora</button>
              <button class="nt-cancel" data-mp="ntCancel">Cancelar</button>
            </div>
          </div>
        </div>

        <div class="mp-info" data-mp="info">
          <div class="mp-info-bg" data-mp="infoBg"></div>
          <div class="mp-info-card" data-mp="infoCard">
            <button class="mp-info-close" data-mp="infoClose">${ICO.close}</button>
            <div class="mp-info-grid">
              <div class="mp-info-poster" data-mp="infoPoster"></div>
              <div>
                <h1 data-mp="infoTitle"></h1>
                <div class="mp-info-sub" data-mp="infoSub"></div>
                <p class="mp-info-desc" data-mp="infoDesc"></p>
                <div class="mp-info-meta" data-mp="infoMeta"></div>
                <div class="mp-info-actions">
                  <button class="mp-action primary" data-mp="infoResume">▶ Continuar viendo</button>
                  <button class="mp-action ghost" data-mp="infoNext">Ver siguiente</button>
                  <button class="mp-action ghost" data-mp="infoRestart">Volver al inicio</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    State.root = root;
    // mapear refs
    root.querySelectorAll('[data-mp]').forEach(el => State.els[el.dataset.mp] = el);
    State.video = State.els.video;
    State.mounted = true;
    bindEvents();
  }

  /* ============================ Eventos =================================== */
  function bindEvents() {
    const E = State.els, V = State.video;

    E.close.onclick = closePlayer;
    E.play.onclick = togglePlay;
    E.centerPlay.onclick = togglePlay;
    E.back10.onclick = () => skip(-10);
    E.fwd10.onclick = () => skip(10);
    E.nextEp.onclick = () => playByIndex(State.queueIndex + 1);
    E.mute.onclick = toggleMute;
    E.vol.oninput = (e) => { V.volume = +e.target.value; V.muted = V.volume === 0; updateVolIcon(); };
    E.full.onclick = toggleFullscreen;
    E.titleBtn.onclick = openInfo;
    E.infoClose.onclick = closeInfo;
    E.infoBg.onclick = (e) => { if (e.target === E.infoBg) closeInfo(); };
    E.infoResume.onclick = () => { closeInfo(); V.play(); };
    E.infoRestart.onclick = () => { V.currentTime = 0; closeInfo(); V.play(); };
    E.infoNext.onclick = () => { closeInfo(); playByIndex(State.queueIndex + 1); };
    E.listBtn.onclick = () => E.side.classList.toggle('open');
    E.sideClose.onclick = () => E.side.classList.remove('open');
    E.skipCta.onclick = handleSkipCta;
    E.audioBtn.onclick = (e) => { e.stopPropagation(); toggleMenu('audioMenu'); };
    E.ccBtn.onclick = (e) => { e.stopPropagation(); toggleMenu('ccMenu'); };
    E.ntPlay.onclick = () => playByIndex(State.queueIndex + 1);
    E.ntCancel.onclick = hideNextToast;

    // Stage taps -> toggle controles + doble tap skip
    let lastTap = 0;
    E.stage.addEventListener('click', (e) => {
      if (e.target.closest('.mp-top,.mp-bottom,.mp-side,.mp-info,.mp-menu,.mp-skip-cta,.mp-next-toast,.mp-grid')) return;
      const now = Date.now();
      if (now - lastTap < 280) {
        const rect = E.stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) { skip(-10); flashSkip('left'); }
        else { skip(10); flashSkip('right'); }
        lastTap = 0;
      } else {
        togglePlay();
        lastTap = now;
      }
    });

    // Mouse move -> mostrar controles
    E.stage.addEventListener('mousemove', () => { showControls(); resetCursor(); });
    E.stage.addEventListener('mouseleave', () => { if (State.isPlaying) hideControlsSoon(0); });

    // Cerrar menus al click fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-mp="audioMenu"],[data-mp="audioBtn"]')) E.audioMenu.classList.remove('open');
      if (!e.target.closest('[data-mp="ccMenu"],[data-mp="ccBtn"]')) E.ccMenu.classList.remove('open');
    });

    // Progress bar
    let scrubbing = false;
    const seekFromEvent = (ev) => {
      const r = E.progressWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width));
      V.currentTime = x * (V.duration || 0);
    };
    E.progressWrap.addEventListener('mousedown', (e) => { scrubbing = true; seekFromEvent(e); });
    document.addEventListener('mousemove', (e) => {
      if (scrubbing) seekFromEvent(e);
      // tooltip
      if (!E.progressWrap.matches(':hover')) return;
      const r = E.progressWrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      E.timeTip.style.left = (x * 100) + '%';
      E.timeTip.textContent = fmt(x * (V.duration || 0));
    });
    document.addEventListener('mouseup', () => scrubbing = false);

    // Scroll dentro del video -> grid flotante
    let scrollAcc = 0, scrollTimer;
    E.stage.addEventListener('wheel', (e) => {
      if (e.target.closest('.mp-side,.mp-info,.mp-grid,.mp-menu')) return;
      scrollAcc += e.deltaY;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => scrollAcc = 0, 600);
      if (scrollAcc > 80) { E.grid.classList.add('open'); scrollAcc = 0; }
      else if (scrollAcc < -80 && E.grid.classList.contains('open')) { E.grid.classList.remove('open'); scrollAcc = 0; }
    }, { passive: true });

    // Touch swipe up -> grid
    let touchY = 0;
    E.stage.addEventListener('touchstart', (e) => touchY = e.touches[0].clientY, { passive: true });
    E.stage.addEventListener('touchend', (e) => {
      const dy = touchY - (e.changedTouches[0]?.clientY || touchY);
      if (dy > 80) E.grid.classList.add('open');
      else if (dy < -80) E.grid.classList.remove('open');
    }, { passive: true });

    // Video events
    V.addEventListener('play', () => { State.isPlaying = true; setPlayIcon(true); E.centerPlay.classList.remove('show'); clearPauseInfoTimer(); hideControlsSoon(); });
    V.addEventListener('pause', () => { State.isPlaying = false; setPlayIcon(false); E.centerPlay.classList.add('show'); showControls(); schedulePauseInfo(); });
    V.addEventListener('waiting', () => E.loader.classList.add('show'));
    V.addEventListener('canplay', () => E.loader.classList.remove('show'));
    V.addEventListener('playing', () => E.loader.classList.remove('show'));
    V.addEventListener('timeupdate', onTimeUpdate);
    V.addEventListener('progress', updateBuffer);
    V.addEventListener('ended', onEnded);
    V.addEventListener('volumechange', updateVolIcon);
    V.addEventListener('loadedmetadata', () => {
      if (State.rememberTime) { V.currentTime = State.rememberTime; State.rememberTime = 0; }
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!State.root.classList.contains('mp-open')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skip(-10); flashSkip('left'); break;
        case 'ArrowRight': skip(10); flashSkip('right'); break;
        case 'ArrowUp': V.volume = Math.min(1, V.volume + 0.1); break;
        case 'ArrowDown': V.volume = Math.max(0, V.volume - 0.1); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
        case 'c': toggleSubs(); break;
        case 'n': playByIndex(State.queueIndex + 1); break;
        case 'i': openInfo(); break;
        case 'Escape': if (E.info.classList.contains('open')) closeInfo(); else if (E.grid.classList.contains('open')) E.grid.classList.remove('open'); else closePlayer(); break;
      }
    });
  }

  /* ============================ Controles helpers ========================= */
  function setPlayIcon(playing) {
    State.els.play.innerHTML = playing ? ICO.pause : ICO.play;
    State.els.centerPlay.querySelector('.circ').innerHTML = playing ? ICO.pause : ICO.play;
  }
  function togglePlay() { State.video.paused ? State.video.play() : State.video.pause(); }
  function skip(s) { State.video.currentTime = Math.max(0, Math.min((State.video.duration || 0), State.video.currentTime + s)); }
  function flashSkip(side) {
    const el = side === 'left' ? State.els.skipLeft : State.els.skipRight;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }
  function toggleMute() { State.video.muted = !State.video.muted; updateVolIcon(); }
  function updateVolIcon() {
    const v = State.video.volume, m = State.video.muted;
    State.els.vol.value = m ? 0 : v;
    State.els.mute.innerHTML = m || v === 0 ? ICO.volMute : (v < 0.5 ? ICO.volLo : ICO.volHi);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) State.root.requestFullscreen?.();
    else document.exitFullscreen?.();
    setTimeout(() => State.els.full.innerHTML = document.fullscreenElement ? ICO.exitFull : ICO.full, 100);
  }
  function showControls() {
    State.root.classList.remove('mp-controls-hidden');
    clearTimeout(State.controlsTimer);
    if (State.isPlaying) hideControlsSoon();
  }
  function hideControlsSoon(delay = 4000) {
    clearTimeout(State.controlsTimer);
    State.controlsTimer = setTimeout(() => {
      if (!State.isPlaying) return;
      if (State.els.info.classList.contains('open')) return;
      if (State.els.side.classList.contains('open')) return;
      if (State.els.grid.classList.contains('open')) return;
      State.root.classList.add('mp-controls-hidden');
    }, delay);
  }
  function resetCursor() {
    State.root.classList.remove('mp-cursor-hidden');
    clearTimeout(State.cursorTimer);
    State.cursorTimer = setTimeout(() => { if (State.isPlaying) State.root.classList.add('mp-cursor-hidden'); }, 4000);
  }

  /* ============================ Time update ============================== */
  function onTimeUpdate() {
    const V = State.video, dur = V.duration || 0, cur = V.currentTime;
    const pct = dur ? (cur / dur) * 100 : 0;
    State.els.played.style.width = pct + '%';
    State.els.thumb.style.left = pct + '%';
    State.els.time.textContent = `${fmt(cur)} / ${fmt(dur)}`;
    checkSkips(cur, dur);
    // Mostrar toast siguiente episodio en últimos 25s (si hay siguiente)
    const next = State.queue[State.queueIndex + 1];
    if (next && dur && (dur - cur) < 25 && (dur - cur) > 1 && !State.nextToastShown) showNextToast(next, dur - cur);
    if ((dur - cur) >= 25) hideNextToast();
  }
  function updateBuffer() {
    const V = State.video, dur = V.duration || 0;
    if (V.buffered.length && dur) State.els.buffer.style.width = (V.buffered.end(V.buffered.length - 1) / dur * 100) + '%';
  }

  function checkSkips(cur, dur) {
    const ep = State.current; if (!ep) return;
    const map = [
      ['skipIntro', 'Saltar intro', 'intro'],
      ['skipRecap', 'Saltar resumen', 'recap'],
      ['skipCredits', 'Ver siguiente', 'credits']
    ];
    let active = null;
    for (const [k, label, id] of map) {
      const seg = ep[k]; if (!seg) continue;
      const a = parseTime(seg.start), b = parseTime(seg.end);
      if (a == null || b == null) continue;
      if (cur >= a && cur < b) { active = { label, id, end: b }; break; }
    }
    const cta = State.els.skipCta;
    if (active) {
      cta.textContent = active.label;
      cta.dataset.action = active.id;
      cta.dataset.end = active.end;
      cta.classList.add('show');
    } else cta.classList.remove('show');
  }
  function handleSkipCta() {
    const action = State.els.skipCta.dataset.action;
    if (action === 'credits') playByIndex(State.queueIndex + 1);
    else State.video.currentTime = +State.els.skipCta.dataset.end || State.video.currentTime;
    State.els.skipCta.classList.remove('show');
  }

  /* ============================ Pausa info auto =========================== */
  function schedulePauseInfo() {
    clearPauseInfoTimer();
    State.pauseInfoTimer = setTimeout(() => { if (State.video.paused) openInfo(); }, 8000);
  }
  function clearPauseInfoTimer() { clearTimeout(State.pauseInfoTimer); State.pauseInfoTimer = null; }

  /* ============================ Info modal =============================== */
  function openInfo() {
    const ep = State.current; if (!ep) return;
    const E = State.els, s = State.currentSeries;
    E.infoTitle.textContent = ep.title || 'Sin título';
    const subParts = [];
    if (s && s.titulo_serie) subParts.push(s.titulo_serie);
    if (ep.date) subParts.push(new Date(ep.date).toLocaleDateString());
    if (ep.proudccion || ep.produccion) subParts.push(ep.proudccion || ep.produccion);
    E.infoSub.textContent = subParts.join(' • ') || 'No disponible';
    E.infoDesc.textContent = ep.description || (s && s.descripcion_serie) || 'No disponible';
    const poster = ep.thumbnail || ep.thumbnail2 || (s && s.portada_serie) || '';
    E.infoPoster.style.backgroundImage = poster ? `url('${poster}')` : 'none';
    if (s && s.bgColor) E.infoPoster.style.background = `${poster ? `url('${poster}') center/cover` : s.bgColor}`;
    // meta
    const meta = [
      ['Producción', ep.proudccion || ep.produccion],
      ['Serie', s ? s.titulo_serie : 'Episodio independiente'],
      ['Fecha', ep.date],
      ['Etiquetas', ep.utilidad],
      ['Descarga', has(ep.allowDownload) ? (ep.allowDownload ? 'Permitida' : 'No permitida') : 'No disponible']
    ];
    E.infoMeta.innerHTML = meta.map(([k, v]) => `<b>${k}</b><span>${has(v) ? v : 'No disponible'}</span>`).join('');
    E.info.classList.add('open');
    showControls();
  }
  function closeInfo() { State.els.info.classList.remove('open'); }

  /* ============================ Menus audio/subs ========================== */
  function toggleMenu(name) {
    const other = name === 'audioMenu' ? 'ccMenu' : 'audioMenu';
    State.els[other].classList.remove('open');
    if (name === 'audioMenu') buildAudioMenu();
    if (name === 'ccMenu') buildSubsMenu();
    State.els[name].classList.toggle('open');
  }
  function buildAudioMenu() {
    const ep = State.current; const m = State.els.audioMenu;
    const tracks = [];
    if (has(ep.mediaUrl)) tracks.push({ idx: 1, label: 'Audio 1' });
    if (has(ep.mediaUrl2)) tracks.push({ idx: 2, label: 'Audio 2' });
    if (!tracks.length) { m.innerHTML = '<h5>Audio</h5><div style="padding:10px 12px;font-size:13px;opacity:.6">No disponible</div>'; return; }
    m.innerHTML = '<h5>Pista de audio</h5>' + tracks.map(t =>
      `<button data-track="${t.idx}" class="${State.audioTrack === t.idx ? 'active' : ''}">${t.label}${ICO.check}</button>`
    ).join('');
    m.querySelectorAll('button').forEach(b => b.onclick = () => { switchAudioTrack(+b.dataset.track); m.classList.remove('open'); });
  }
  function buildSubsMenu() {
    const ep = State.current; const m = State.els.ccMenu;
    const subs = Array.isArray(ep.subtitles) ? ep.subtitles : (has(ep.subtitlesUrl) ? [{ lang: 'es', label: 'Español', url: ep.subtitlesUrl }] : []);
    let html = '<h5>Subtítulos</h5>';
    html += `<button data-sub="-1" class="${!State.subOn ? 'active' : ''}">Desactivados${ICO.check}</button>`;
    if (!subs.length) html += '<div style="padding:10px 12px;font-size:13px;opacity:.6">No disponible</div>';
    subs.forEach((s, i) => html += `<button data-sub="${i}" class="${State.subOn && State.subIndex === i ? 'active' : ''}">${s.label || s.lang || 'Sub ' + (i + 1)}${ICO.check}</button>`);
    m.innerHTML = html;
    m.querySelectorAll('button').forEach(b => b.onclick = () => { setSub(+b.dataset.sub, subs); m.classList.remove('open'); });
  }
  function setSub(idx, subs) {
    // limpiar tracks
    [...State.video.querySelectorAll('track')].forEach(t => t.remove());
    if (idx < 0 || !subs[idx]) { State.subOn = false; return; }
    const t = document.createElement('track');
    t.kind = 'subtitles'; t.label = subs[idx].label || ''; t.srclang = subs[idx].lang || 'es';
    t.src = subs[idx].url; t.default = true;
    State.video.appendChild(t);
    setTimeout(() => { if (State.video.textTracks[0]) State.video.textTracks[0].mode = 'showing'; }, 50);
    State.subOn = true; State.subIndex = idx;
  }
  function toggleSubs() {
    const ep = State.current;
    const subs = Array.isArray(ep.subtitles) ? ep.subtitles : (has(ep.subtitlesUrl) ? [{ lang: 'es', label: 'Español', url: ep.subtitlesUrl }] : []);
    if (!subs.length) return;
    if (State.subOn) setSub(-1, subs); else setSub(0, subs);
  }
  function switchAudioTrack(track) {
    const ep = State.current;
    const url = track === 2 ? ep.mediaUrl2 : ep.mediaUrl;
    if (!has(url)) return;
    const t = State.video.currentTime, p = !State.video.paused;
    State.audioTrack = track;
    State.video.src = url;
    State.video.addEventListener('loadedmetadata', function once() {
      State.video.removeEventListener('loadedmetadata', once);
      State.video.currentTime = t;
      if (p) State.video.play();
    });
  }

  /* ============================ Sidebar / Grid ============================ */
  function renderQueue() {
    const list = State.els.sideList, grid = State.els.gridWrap;
    const items = State.queue;
    State.els.sideTitle.textContent = State.currentSeries ? State.currentSeries.titulo_serie || 'Próximos episodios' : 'Más para ver';
    State.els.gridTitle.textContent = State.els.sideTitle.textContent;
    list.innerHTML = items.map((ep, i) => `
      <div class="mp-ep-card ${i === State.queueIndex ? 'current' : ''}" data-i="${i}">
        <div class="mp-ep-thumb" style="background-image:url('${ep.thumbnail || ep.thumbnail2 || ''}')"><span class="num">${i + 1}</span></div>
        <div class="mp-ep-info"><h4>${ep.title || 'Sin título'}</h4><p>${ep.description || 'No disponible'}</p></div>
      </div>`).join('');
    list.querySelectorAll('.mp-ep-card').forEach(c => c.onclick = () => playByIndex(+c.dataset.i));
    grid.innerHTML = items.map((ep, i) => `
      <div class="mp-grid-card" data-i="${i}">
        <div class="t" style="background-image:url('${ep.thumbnail || ep.thumbnail2 || ''}')"></div>
        <div class="b"><h4>${ep.title || 'Sin título'}</h4><p>${ep.description || 'No disponible'}</p></div>
      </div>`).join('');
    grid.querySelectorAll('.mp-grid-card').forEach(c => c.onclick = () => { State.els.grid.classList.remove('open'); playByIndex(+c.dataset.i); });
  }

  /* ============================ Next toast =============================== */
  function showNextToast(next, remaining) {
    const E = State.els;
    State.nextToastShown = true;
    E.ntThumb.style.backgroundImage = `url('${next.thumbnail || next.thumbnail2 || ''}')`;
    E.ntTitle.textContent = next.title || 'Siguiente';
    E.nextToast.classList.add('show');
    const total = remaining;
    let start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const p = Math.min(1, elapsed / total);
      E.ntBar.style.width = (p * 100) + '%';
      if (p < 1 && E.nextToast.classList.contains('show')) requestAnimationFrame(tick);
    };
    tick();
  }
  function hideNextToast() { State.els.nextToast.classList.remove('show'); State.nextToastShown = false; }

  /* ============================ Playback / Cola =========================== */
  function buildQueue(startEp) {
    const all = State.episodes.filter(e => has(e.mediaUrl) || has(e.mediaUrl2));
    if (has(startEp.seriesid)) {
      const series = all.filter(e => e.seriesid === startEp.seriesid)
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      const others = shuffle(all.filter(e => e.seriesid !== startEp.seriesid));
      const startIdx = series.findIndex(e => e.id === startEp.id);
      State.queue = series.concat(others);
      State.queueIndex = startIdx >= 0 ? startIdx : 0;
      State.currentSeries = State.series.find(s => s.seriesid === startEp.seriesid) || null;
    } else {
      const others = shuffle(all.filter(e => e.id !== startEp.id));
      State.queue = [startEp].concat(others);
      State.queueIndex = 0;
      State.currentSeries = null;
    }
  }

  function loadEpisode(ep) {
    const V = State.video, E = State.els;
    State.current = ep;
    State.currentSeries = has(ep.seriesid) ? (State.series.find(s => s.seriesid === ep.seriesid) || null) : null;
    State.skipShownFor = { intro: false, recap: false, credits: false };
    State.nextToastShown = false;
    State.audioTrack = has(ep.mediaUrl) ? 1 : 2;

    E.titleText.textContent = ep.title || 'Sin título';
    E.seriesText.textContent = State.currentSeries ? State.currentSeries.titulo_serie : '';
    if (State.currentSeries && State.currentSeries.bgColor) State.root.style.background = State.currentSeries.bgColor; else State.root.style.background = '#000';

    // limpiar tracks
    [...V.querySelectorAll('track')].forEach(t => t.remove());
    State.subOn = false;

    V.src = State.audioTrack === 2 ? ep.mediaUrl2 : ep.mediaUrl;
    V.load();
    V.play().catch(() => { /* autoplay puede fallar, mostrar overlay */ });
    renderQueue();
    hideNextToast();
    closeInfo();
    E.side.classList.remove('open');
    E.grid.classList.remove('open');
    showControls();
  }

  function playByIndex(i) {
    if (i < 0 || i >= State.queue.length) {
      // fin de cola: mezclar más
      const more = shuffle(State.episodes.filter(e => e.id !== State.current?.id));
      if (!more.length) { closePlayer(); return; }
      State.queue = State.queue.concat(more);
    }
    State.queueIndex = i;
    loadEpisode(State.queue[i]);
  }

  function onEnded() { playByIndex(State.queueIndex + 1); }

  /* ============================ Open / Close ============================== */
  function openPlayer() {
    if (!State.mounted) build();
    State.root.classList.add('mp-open');
    document.body.style.overflow = 'hidden';
  }
  function closePlayer() {
    State.video.pause();
    State.video.removeAttribute('src'); State.video.load();
    State.root.classList.remove('mp-open');
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen?.();
  }

  /* ============================ API pública =============================== */
  const MediaPlayer = {
    play(epOrId, opts = {}) {
      State.episodes = opts.episodes || global.EPISODIOS || [];
      State.series = opts.series || global.SERIES || [];
      let ep = (typeof epOrId === 'string') ? State.episodes.find(e => e.id === epOrId) : epOrId;
      if (!ep) { console.warn('[MediaPlayer] episodio no encontrado:', epOrId); return; }
      if (!has(ep.mediaUrl) && !has(ep.mediaUrl2)) { console.warn('[MediaPlayer] sin mediaUrl'); return; }
      openPlayer();
      buildQueue(ep);
      // posicionar índice al episodio inicial
      const idx = State.queue.findIndex(e => e.id === ep.id);
      if (idx >= 0) State.queueIndex = idx;
      loadEpisode(ep);
    },
    close: closePlayer,
    setData(data) { if (data.episodes) State.episodes = data.episodes; if (data.series) State.series = data.series; }
  };

  global.MediaPlayer = MediaPlayer;
})(window);
