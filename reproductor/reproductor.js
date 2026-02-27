// ===== reproductor.js =====
(function() {
  // ==================== CONFIGURACIÓN Y ESTADO GLOBAL ====================
  const STORAGE_KEYS = {
    PLAYLIST: 'playlist',
    LIKES: 'likes',
    HISTORY: 'history',
    STATE: 'playerState'
  };

  let currentMedia = null;
  let playlist = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYLIST)) || [];
  let likes = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIKES)) || [];
  let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
  let currentIndex = -1;
  let nextList = [];
  let recomendados = window.RECOMENDADOS || [];
  let cachedRecomendados = [];
  let episodeText = '';
  let episodeAuthor = 'Roberto';
  let activeList = 'next';
  let userPlaylistAutoPlay = false;
  let timerValue = 0;
  let timerId = null;
  let timerCountdownInterval = null;
  let isAudioMode = true;
  let isFullscreenMode = false;
  let repeatMode = 0;
  let currentEpisodeId = null;
  let isExpanded = false;
  let isHidden = false;
  let isMuted = false;
  let isAutoMuted = false;
  let isUserMuted = false;
  let isDraggingExpanded = false;
  let isDraggingMinimized = false;
  let isPanelFullHeight = false;
  let likesViewMode = 'carousel';

  // Elementos del DOM
  const playerUniversal = document.getElementById('playerUniversal');
  const playerExpanded = document.getElementById('playerExpanded');
  const playerMinimized = document.getElementById('playerMinimized');
  let mediaElement = document.getElementById('mediaElement');
  const mediaCover = document.getElementById('mediaCover');
  const mediaContainer = document.getElementById('mediaContainer');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const mediaModeToggle = document.getElementById('mediaModeToggle');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const expandBtn = document.getElementById('expandBtn');
  const episodeInfo = document.getElementById('episodeInfo');
  const episodeTitle = document.getElementById('episodeTitle');
  const episodeTitleMinimized = document.getElementById('episodeTitleMinimized');
  const episodeAuthorElem = document.getElementById('episodeAuthor');
  const minimizedCover = document.getElementById('minimizedCover');
  const progressContainerExpanded = document.getElementById('progressContainerExpanded');
  const progressBarExpanded = document.getElementById('progressBarExpanded');
  const progressContainerMinimized = document.getElementById('progressContainerMinimized');
  const progressBarMinimized = document.getElementById('progressBarMinimized');
  const currentTimeExpanded = document.getElementById('currentTimeExpanded');
  const durationExpanded = document.getElementById('durationExpanded');
  const playPauseExpanded = document.getElementById('playPauseExpanded');
  const playPauseIconExpanded = document.getElementById('playPauseIconExpanded');
  const playPauseMinimized = document.getElementById('playPauseMinimized');
  const playPauseIconMinimized = document.getElementById('playPauseIconMinimized');
  const rewindExpanded = document.getElementById('rewindExpanded');
  const forwardExpanded = document.getElementById('forwardExpanded');
  const previousExpanded = document.getElementById('previousExpanded');
  const nextExpanded = document.getElementById('nextExpanded');
  const rewindMinimized = document.getElementById('rewindMinimized');
  const forwardMinimized = document.getElementById('forwardMinimized');
  const speedIcon = document.getElementById('speedIcon');
  const speedSlider = document.getElementById('speedSlider');
  const currentSpeed = document.getElementById('currentSpeed');
  const timerIcon = document.getElementById('timerIcon');
  const timerOptions = document.getElementById('timerOptions');
  const timerCountdown = document.getElementById('timerCountdown');
  const countdownDisplay = document.getElementById('countdownDisplay');
  const deactivateTimer = document.getElementById('deactivateTimer');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadIcon = document.getElementById('downloadIcon');
  const shareBtn = document.getElementById('shareBtn');
  const programBtn = document.getElementById('programBtn');
  const repeatBtn = document.getElementById('repeatBtn');
  const addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
  const addToPlaylistIcon = document.getElementById('addToPlaylistIcon');
  const colaBtn = document.getElementById('colaBtn');
  const detallesBtn = document.getElementById('detallesBtn');
  const bibliotecaBtn = document.getElementById('bibliotecaBtn');
  const likesBtn = document.getElementById('likesBtn');
  const likesIcon = document.getElementById('likesIcon');
  const panelContainer = document.getElementById('panelContainer');
  const likesCarousel = document.getElementById('likesCarousel');
  const playlistItems = document.getElementById('playlistItems');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const togglePanelHeightBtn = document.getElementById('togglePanelHeightBtn');
  const nextItems = document.getElementById('nextItems');
  const recomendadosItems = document.getElementById('recomendadosItems');
  const recomendadosSeparator = document.getElementById('recomendadosSeparator');
  const textContent = document.getElementById('textContent');
  const tabCola = document.getElementById('tabCola');
  const tabDetalles = document.getElementById('tabDetalles');
  const tabBiblioteca = document.getElementById('tabBiblioteca');
  const tabVelocidad = document.getElementById('tabVelocidad');
  const tabTemporizador = document.getElementById('tabTemporizador');
  const colaContent = document.getElementById('colaContent');
  const detallesContent = document.getElementById('detallesContent');
  const bibliotecaContent = document.getElementById('bibliotecaContent');
  const velocidadContent = document.getElementById('velocidadContent');
  const temporizadorContent = document.getElementById('temporizadorContent');
  const linkCola = document.getElementById('linkCola');
  const linkDetalles = document.getElementById('linkDetalles');
  const linkBiblioteca = document.getElementById('linkBiblioteca');
  const speedContainer = document.querySelector('.speed-container');
  const timerContainer = document.querySelector('.timer-container');
  const overlayGradient = document.getElementById('overlayGradient');
  const playPauseMedia = document.getElementById('playPauseMedia');
  const playPauseIconMedia = document.getElementById('playPauseIconMedia');
  const seekIndicatorLeft = document.getElementById('seekIndicatorLeft');
  const seekSecondsLeft = document.getElementById('seekSecondsLeft');
  const seekIndicatorRight = document.getElementById('seekIndicatorRight');
  const seekSecondsRight = document.getElementById('seekSecondsRight');
  const muteIndicator = document.getElementById('muteIndicator');
  const viewAllLikes = document.getElementById('viewAllLikes');
  const likesView = document.getElementById('likesView');

  // ==================== UTILIDADES ====================
  const throttle = (func, limit) => {
    let lastCall = null;
    return (...args) => {
      const now = Date.now();
      if (!lastCall || now - lastCall > limit) {
        lastCall = now;
        return func(...args);
      }
    };
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadImageWithFallback = (imgElement, src, alt, fallbackSrc) => {
    if (!imgElement) return;
    imgElement.src = src;
    imgElement.alt = alt;
    imgElement.onerror = () => {
      imgElement.src = fallbackSrc || 'https://via.placeholder.com/24';
      imgElement.onerror = null;
    };
  };

  // ==================== APLICAR COLOR DE FONDO ====================
  const applyBackgroundColor = (color) => {
    const bgColor = color || '#0f7dbd'; // color por defecto
    playerExpanded.style.backgroundColor = bgColor;
    playerMinimized.style.backgroundColor = bgColor;
  };

  // ==================== GUARDADO DE ESTADO (con throttling) ====================
  const saveState = () => {
    const state = {
      mediaUrl: currentMedia?.mediaUrl,
      mediaType: currentMedia?.mediaType,
      coverUrlContainer: currentMedia?.coverUrlContainer,
      coverUrlInfo: currentMedia?.coverUrlInfo,
      title: currentMedia?.title,
      detailUrl: currentMedia?.detailUrl,
      author: currentMedia?.author,
      next: currentMedia?.next,
      text: currentMedia?.text,
      allowDownload: currentMedia?.allowDownload,
      color: currentMedia?.color,
      currentTime: mediaElement.currentTime,
      isPlaying: !mediaElement.paused,
      playbackRate: mediaElement.playbackRate,
      isExpanded: isExpanded,
      isHidden: isHidden,
      isMuted: mediaElement.muted,
      isAudioMode: isAudioMode,
      activeList: activeList,
      userPlaylistAutoPlay: userPlaylistAutoPlay,
      timerValue: timerValue,
      repeatMode: repeatMode,
    };
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  };
  const throttledSaveState = throttle(saveState, 500);

  // ==================== ACTUALIZACIÓN DE HISTORIAL ====================
  const updateHistory = () => {
    if (!currentMedia) return;
    const now = Date.now();
    const existingIndex = history.findIndex(item => item.mediaUrl === currentMedia.mediaUrl);
    const progress = mediaElement.currentTime / (mediaElement.duration || 1);
    const isFinished = progress >= 0.95;

    const historyEntry = {
      ...currentMedia,
      lastPlayed: now,
      progress: progress,
      finished: isFinished,
      time: mediaElement.currentTime,
      duration: mediaElement.duration
    };

    if (existingIndex !== -1) {
      history[existingIndex] = { ...history[existingIndex], ...historyEntry };
    } else {
      history.unshift(historyEntry);
    }
    if (history.length > 100) history.pop();
    throttledSaveState();
  };

  // ==================== CARGA DE MEDIOS ====================
  const mapEpisodeToMedia = (item) => {
    return {
      mediaUrl: item.mediaUrl || '',
      mediaType: item.type || 'audio',
      coverUrlContainer: item.coverUrl || '',
      coverUrlInfo: item.series?.portada_serie || item.coverUrl || '',
      title: item.title || '',
      detailUrl: item.detailUrl || '',
      author: item.series?.titulo_serie || item.author || 'Unknown',
      next: item.next || [],
      text: item.description || item.text || '',
      allowDownload: item.allowDownload !== false,
      color: item.color || null
    };
  };

  const loadMedia = (mediaUrl, mediaType, coverUrlContainer, coverUrlInfo, title, detailUrl, author = 'Roberto', next = [], text = '', allowDownload = true, isFromRecomendados = false, recIndex = -1, colorOverride = null) => {
    try {
      currentEpisodeId = mediaUrl;
      if (timerId && timerValue === 'end') {
        clearTimeout(timerId);
        timerId = null;
        updateTimerButtons(0);
        timerContainer.classList.remove('active');
      }

      // Limpiar eventos anteriores
      const newMediaElement = mediaElement.cloneNode(true);
      mediaElement.parentNode.replaceChild(newMediaElement, mediaElement);
      mediaElement = newMediaElement;
      mediaElement.addEventListener('timeupdate', updateProgress);
      mediaElement.addEventListener('loadedmetadata', updateProgress);
      mediaElement.addEventListener('volumechange', checkMute);
      mediaElement.addEventListener('ended', handleMediaEnd);
      mediaElement.addEventListener('play', () => {
        updateIcons(true);
        updateAllItemIcons(true);
        updateOpenPlayerButton(true);
      });
      mediaElement.addEventListener('pause', () => {
        updateIcons(false);
        updateAllItemIcons(false);
        updateOpenPlayerButton(false);
      });

      currentMedia = { mediaUrl, mediaType, coverUrlContainer, coverUrlInfo, title, detailUrl, author, next, text, allowDownload, color: colorOverride };
      mediaElement.src = mediaUrl;
      mediaElement.load();
      loadImageWithFallback(
        mediaCover,
        coverUrlContainer || 'https://niki-chiton-jesus.odoo.com/web/image/slide.channel/1/image_1024/Cuando%20comenz%C3%B3%20todo?unique=6ba13cc',
        'Cover',
        'https://via.placeholder.com/300'
      );
      episodeTitle.textContent = title || '';
      episodeTitle.setAttribute('data-text', title || '');
      episodeTitleMinimized.textContent = title || '';
      episodeTitleMinimized.setAttribute('data-text', title || '');
      episodeAuthorElem.textContent = author;
      loadImageWithFallback(
        episodeInfo.querySelector('.left-section img'),
        coverUrlInfo || 'https://i.pinimg.com/280x280_RS/2a/ec/33/2aec332af056fc746a0a3552a6f97fc5.jpg',
        'Portada',
        'https://via.placeholder.com/40'
      );
      loadImageWithFallback(
        minimizedCover,
        coverUrlInfo || 'https://i.pinimg.com/280x280_RS/2a/ec/33/2aec332af056fc746a0a3552a6f97fc5.jpg',
        'Portada',
        'https://via.placeholder.com/40'
      );

      playerUniversal.style.display = 'block';
      nextList = next;
      episodeText = text;
      currentIndex = nextList.findIndex(item => item.mediaUrl === mediaUrl);
      if (currentIndex === -1) currentIndex = 0;
      if (next.length === 0) {
        if (isFromRecomendados && recIndex >= 0) {
          nextList = cachedRecomendados.slice(recIndex + 1).map(mapEpisodeToMedia);
          activeList = 'next';
        } else {
          nextList = cachedRecomendados.map(mapEpisodeToMedia);
          activeList = 'next';
        }
      }
      updateNextList();
      updateRecomendadosList();
      updateTextContent();
      updateAddButton();
      updateDownloadButton();
      updateLikesButton();

      // Aplicar color de fondo
      applyBackgroundColor(colorOverride);

      // Recuperar progreso del historial
      const previousEntry = history.find(item => item.mediaUrl === mediaUrl);
      if (previousEntry) {
        mediaElement.addEventListener('canplay', () => {
          mediaElement.currentTime = previousEntry.time || 0;
        }, { once: true });
      }

      if (!history.some(item => item.mediaUrl === mediaUrl)) {
        updateHistory();
      }

      isAudioMode = mediaType !== 'video';
      updateMediaMode();
      updateModeToggleState();
      updateMediaSession();

      throttledSaveState();
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  // ==================== FUNCIONES DE INTERFAZ ====================
  const updateIcons = (isPlaying) => {
    const playIcon = 'https://marca1.odoo.com/web/image/508-f876320c/play.svg';
    const pauseIcon = 'https://nikichitonjesus.odoo.com/web/image/983-5c0bffd9/Pause.webp';
    loadImageWithFallback(playPauseIconExpanded, isPlaying ? pauseIcon : playIcon, isPlaying ? 'Pause' : 'Play', 'https://via.placeholder.com/24');
    loadImageWithFallback(playPauseIconMinimized, isPlaying ? pauseIcon : playIcon, isPlaying ? 'Pause' : 'Play', 'https://via.placeholder.com/24');
    loadImageWithFallback(playPauseIconMedia, isPlaying ? pauseIcon : playIcon, isPlaying ? 'Pause' : 'Play', 'https://via.placeholder.com/24');
  };

  const updateAllItemIcons = (isPlaying) => {
    document.querySelectorAll('.item-play-pause img').forEach(icon => {
      const item = icon.closest('.playlist-item, .next-item');
      const isCurrent = item?.classList.contains('active');
      loadImageWithFallback(icon, isCurrent ? (isPlaying ? 'https://nikichitonjesus.odoo.com/web/image/983-5c0bffd9/Pause.webp' : 'https://nikichitonjesus.odoo.com/web/image/984-ba35a699/play.webp') : 'https://marca1.odoo.com/web/image/508-f876320c/play.svg', isPlaying ? 'Pause' : 'Play', 'https://via.placeholder.com/20');
    });
  };

  const updateOpenPlayerButton = (isPlaying) => {
    const openPlayerBtn = document.querySelector('#openPlayerBtn');
    if (!openPlayerBtn) return;
    const img = openPlayerBtn.querySelector('img');
    const textSpan = openPlayerBtn.querySelector('span');
    if (img && textSpan) {
      if (isPlaying) {
        img.src = 'https://nikichitonjes-home.odoo.com/web/image/477-973a1ff8/Escuchar.gif';
        img.alt = 'Escuchando';
        textSpan.textContent = 'Escuchando';
      } else {
        img.src = 'https://nikichitonjes-home.odoo.com/web/image/478-0e3df8d3/reanudar.gif';
        img.alt = 'Escuchar';
        textSpan.textContent = 'Escuchar';
      }
    }
  };

  const playWithFallback = () => {
    mediaElement.muted = isMuted;
    mediaElement.play().then(() => {
      updateIcons(true);
      updateAllItemIcons(true);
      isAutoMuted = false;
      updateMediaSession();
      updateOpenPlayerButton(true);
    }).catch((error) => {
      console.log("Autoplay blocked, trying muted:", error);
      mediaElement.muted = true;
      isMuted = true;
      isAutoMuted = true;
      isUserMuted = false;
      mediaElement.play().then(() => {
        updateIcons(true);
        updateAllItemIcons(true);
        showMuteIndicator();
        updateMediaSession();
        updateOpenPlayerButton(true);
      }).catch((err) => {
        console.log("Play failed:", err);
      });
    });
  };

  const togglePlayPause = (forcePlay = false) => {
    if (mediaElement.dataset.isToggling === 'true') return;
    mediaElement.dataset.isToggling = 'true';
    if (forcePlay || mediaElement.paused) {
      playWithFallback();
    } else {
      mediaElement.pause();
      updateIcons(false);
      updateAllItemIcons(false);
      updateOpenPlayerButton(false);
    }
    checkMute();
    throttledSaveState();
    setTimeout(() => {
      mediaElement.dataset.isToggling = 'false';
    }, 100);
  };

  const rewind = (seconds = 15) => {
    if (isNaN(mediaElement.duration)) return;
    mediaElement.currentTime = Math.max(0, mediaElement.currentTime - seconds);
    showSeekIndicator('left', seconds);
    throttledSaveState();
  };

  const forward = (seconds = 15) => {
    if (isNaN(mediaElement.duration)) return;
    mediaElement.currentTime = Math.min(mediaElement.duration, mediaElement.currentTime + seconds);
    showSeekIndicator('right', seconds);
    throttledSaveState();
  };

  const previous = () => {
    if (repeatMode !== 0) return;
    if (activeList === 'playlist' && userPlaylistAutoPlay && currentIndex > 0) {
      currentIndex--;
      const item = playlist[currentIndex];
      loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
      togglePlayPause(true);
    } else if (activeList === 'next' && currentIndex > 0) {
      currentIndex--;
      const item = nextList[currentIndex];
      loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, nextList, item.text, item.allowDownload, false, -1, item.color);
      togglePlayPause(true);
    } else if (history.length > 0) {
      const prevItem = history[history.length - 1];
      loadMedia(prevItem.mediaUrl, prevItem.mediaType, prevItem.coverUrlContainer, prevItem.coverUrlInfo, prevItem.title, prevItem.detailUrl, prevItem.author, prevItem.next, prevItem.text, prevItem.allowDownload, false, -1, prevItem.color);
      togglePlayPause(true);
    } else {
      mediaElement.currentTime = 0;
    }
    throttledSaveState();
  };

  const next = () => {
    if (repeatMode !== 0) return;
    if (activeList === 'next' && currentIndex < nextList.length - 1) {
      currentIndex++;
      const item = nextList[currentIndex];
      loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, nextList, item.text, item.allowDownload, false, -1, item.color);
      togglePlayPause(true);
    } else if (activeList === 'playlist' && userPlaylistAutoPlay && currentIndex < playlist.length - 1) {
      currentIndex++;
      const item = playlist[currentIndex];
      loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
      togglePlayPause(true);
    } else if (userPlaylistAutoPlay && playlist.length > 0) {
      activeList = 'playlist';
      currentIndex = 0;
      const item = playlist[currentIndex];
      loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
      togglePlayPause(true);
    } else if (cachedRecomendados.length > 0) {
      const nextRecItem = cachedRecomendados.shift();
      const mappedRec = mapEpisodeToMedia(nextRecItem);
      loadMedia(
        mappedRec.mediaUrl,
        mappedRec.mediaType,
        mappedRec.coverUrlContainer,
        mappedRec.coverUrlInfo,
        mappedRec.title,
        mappedRec.detailUrl,
        mappedRec.author,
        cachedRecomendados.map(mapEpisodeToMedia),
        mappedRec.text,
        mappedRec.allowDownload,
        true,
        0,
        mappedRec.color
      );
      togglePlayPause(true);
    }
    throttledSaveState();
  };

  const handleMediaEnd = () => {
    updateHistory();
    if (repeatMode === 2) {
      mediaElement.play();
    } else if (repeatMode === 1) {
      mediaElement.play();
      repeatMode = 0;
      updateRepeatButton();
    } else {
      next();
    }
  };

  const showMuteIndicator = () => {
    muteIndicator.style.display = (isAutoMuted && !isUserMuted) ? 'block' : 'none';
  };

  const updateMediaMode = () => {
    mediaModeToggle.classList.toggle('audio', isAudioMode);
    mediaModeToggle.classList.toggle('video', !isAudioMode);
    if (isAudioMode) {
      mediaElement.style.display = 'none';
      mediaCover.style.display = 'block';
      mediaModeToggle.querySelector('.mode-right').classList.add('disabled');
    } else {
      if (currentMedia.mediaType === 'video') {
        mediaElement.style.display = 'block';
        mediaCover.style.display = 'none';
        mediaModeToggle.querySelector('.mode-right').classList.remove('disabled');
      } else {
        mediaElement.style.display = 'none';
        mediaCover.style.display = 'block';
        mediaModeToggle.querySelector('.mode-right').classList.add('disabled');
      }
    }
  };

  const toggleMediaMode = () => {
    if (currentMedia.mediaType === 'video') {
      isAudioMode = !isAudioMode;
      updateMediaMode();
      updateModeToggleState();
      throttledSaveState();
    }
  };

  const updateModeToggleState = () => {
    if (!mediaModeToggle) return;
    const left = mediaModeToggle.querySelector('.mode-left');
    const right = mediaModeToggle.querySelector('.mode-right');
    mediaModeToggle.classList.remove('disabled', 'audio', 'video', 'active-left', 'active-right');
    left.classList.remove('active');
    right.classList.remove('active');
    if (!currentMedia || currentMedia.mediaType !== 'video') {
      mediaModeToggle.classList.add('disabled', 'audio');
      left.classList.add('active');
    } else {
      mediaModeToggle.classList.remove('disabled');
      if (isAudioMode) {
        mediaModeToggle.classList.add('audio', 'active-left');
        left.classList.add('active');
      } else {
        mediaModeToggle.classList.add('video', 'active-right');
        right.classList.add('active');
      }
    }
  };

  const updateDownloadButton = () => {
    if (currentMedia.allowDownload) {
      downloadBtn.classList.remove('disabled');
      loadImageWithFallback(downloadIcon, 'https://nikichitonjesus.odoo.com/web/image/624-ec376d7f/descargar.png', 'Download', 'https://via.placeholder.com/20');
    } else {
      downloadBtn.classList.add('disabled');
      loadImageWithFallback(downloadIcon, 'https://nikichitonjesus.odoo.com/web/image/1051-622a3db3/no-desc.webp', 'Download Disabled', 'https://via.placeholder.com/20');
    }
  };

  const updateAddButton = () => {
    if (playlist.some(item => item.mediaUrl === currentMedia?.mediaUrl)) {
      loadImageWithFallback(addToPlaylistIcon, 'https://nikichitonjesus.odoo.com/web/image/1112-d141b3eb/a%C3%B1adido.png', 'Added', 'https://via.placeholder.com/20');
    } else {
      loadImageWithFallback(addToPlaylistIcon, 'https://nikichitonjesus.odoo.com/web/image/772-ea85aa4b/a%C3%B1adir%20a.png', 'Add to Playlist', 'https://via.placeholder.com/20');
    }
  };

  const updateLikesButton = () => {
    if (likes.some(item => item.mediaUrl === currentMedia?.mediaUrl)) {
      loadImageWithFallback(likesIcon, 'https://nikichitonjesus.odoo.com/web/image/1069-2ad205f2/megus.webp', 'Liked', 'https://via.placeholder.com/20');
      likesBtn.querySelector('span').textContent = 'Te gusta';
    } else {
      loadImageWithFallback(likesIcon, 'https://marca1.odoo.com/web/image/511-0363beb5/meg.svg', 'Me gusta', 'https://via.placeholder.com/20');
      likesBtn.querySelector('span').textContent = 'Me gusta';
    }
  };

  const toggleLikes = () => {
    if (!currentMedia) return;
    const index = likes.findIndex(item => item.mediaUrl === currentMedia.mediaUrl);
    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.unshift({ ...currentMedia, addedDate: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
    updateLikes();
    updateLikesButton();
    throttledSaveState();
  };

  const updateLikes = () => {
    likesCarousel.innerHTML = '';
    likes.sort((a, b) => b.addedDate - a.addedDate);
    likesView.className = 'likes-view ' + likesViewMode;
    if (likes.length > 0) {
      likes.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'likes-item';
        div.innerHTML = `
          <img src="${item.coverUrlInfo || 'https://via.placeholder.com/80'}" alt="Cover" loading="lazy">
          <span>${item.title}</span>
        `;
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, item.next, item.text, item.allowDownload, false, -1, item.color);
          togglePlayPause(true);
        });
        likesCarousel.appendChild(div);
      });
    } else {
      likesCarousel.innerHTML = '<div class="no-items">No hay me gusta</div>';
    }
  };

  const toggleLikesView = () => {
    likesViewMode = likesViewMode === 'carousel' ? 'grid' : 'carousel';
    updateLikes();
    viewAllLikes.textContent = likesViewMode === 'grid' ? 'Ver carrusel' : 'Ver todo';
  };

  const updatePlaylist = () => {
    playlistItems.innerHTML = '';
    if (playlist.length > 0) {
      playlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'playlist-item';
        div.draggable = true;
        div.dataset.index = index;
        if (item.mediaUrl === currentMedia?.mediaUrl) {
          div.classList.add('active');
        }
        div.innerHTML = `
          <img class="cover" src="${item.coverUrlInfo || 'https://via.placeholder.com/30'}" alt="Cover" loading="lazy">
          <span>${item.title}</span>
          <div class="item-controls">
            <button class="item-play-pause">
              <img src="${(item.mediaUrl === currentMedia?.mediaUrl) ? (mediaElement.paused ? 'https://marca1.odoo.com/web/image/508-f876320c/play.svg' : 'https://nikichitonjesus.odoo.com/web/image/983-5c0bffd9/Pause.webp') : 'https://marca1.odoo.com/web/image/508-f876320c/play.svg'}" alt="Play/Pause" loading="lazy">
            </button>
            <button class="remove-playlist-item" data-index="${index}">
              <img src="https://niki-chiton-jesus.odoo.com/web/image/457-5d13d269/remove.webp" alt="Remove" loading="lazy">
            </button>
            <div class="drag-handle">
              <img src="https://nikichitonjesus.odoo.com/web/image/813-b2644056/listbtn.webp" alt="Drag" loading="lazy">
            </div>
          </div>
        `;
        div.addEventListener('click', (e) => {
          if (!e.target.closest('.remove-playlist-item') && !e.target.closest('.drag-handle') && !e.target.closest('.item-play-pause')) {
            e.stopPropagation();
            currentIndex = index;
            loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
            togglePlayPause(true);
          }
        });
        div.querySelector('.item-play-pause').addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.mediaUrl !== currentMedia?.mediaUrl) {
            currentIndex = index;
            loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
          }
          togglePlayPause();
        });
        playlistItems.appendChild(div);
      });
      document.querySelectorAll('.remove-playlist-item').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt(e.target.closest('button').dataset.index);
          playlist.splice(index, 1);
          localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
          if (index <= currentIndex) {
            currentIndex--;
          }
          updatePlaylist();
          updateAddButton();
        });
      });
      // setupPlaylistDrag (simplificado, se puede implementar si se necesita)
    } else {
      playlistItems.innerHTML = '<div class="no-items">No has agregado tus episodios</div>';
    }
  };

  const updateNextList = () => {
    nextItems.innerHTML = '';
    if (nextList.length > 0) {
      nextList.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'next-item';
        if (item.mediaUrl === currentMedia?.mediaUrl) {
          div.classList.add('active');
        }
        div.innerHTML = `
          <img class="cover" src="${item.coverUrlInfo || 'https://via.placeholder.com/30'}" alt="Cover" loading="lazy">
          <span>${item.title}</span>
          <div class="item-controls">
            <button class="item-play-pause">
              <img src="${(item.mediaUrl === currentMedia?.mediaUrl) ? (mediaElement.paused ? 'https://marca1.odoo.com/web/image/508-f876320c/play.svg' : 'https://nikichitonjesus.odoo.com/web/image/983-5c0bffd9/Pause.webp') : 'https://marca1.odoo.com/web/image/508-f876320c/play.svg'}" alt="Play/Pause" loading="lazy">
            </button>
          </div>
        `;
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = index;
          loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, nextList, item.text, item.allowDownload, false, -1, item.color);
          togglePlayPause(true);
        });
        div.querySelector('.item-play-pause').addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.mediaUrl !== currentMedia?.mediaUrl) {
            currentIndex = index;
            loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, nextList, item.text, item.allowDownload, false, -1, item.color);
          }
          togglePlayPause();
        });
        nextItems.appendChild(div);
      });
    } else {
      nextItems.innerHTML = '<div class="no-items">Episodio único</div>';
    }
  };

  const updateRecomendadosList = () => {
    if (cachedRecomendados.length === 0) {
      cachedRecomendados = [...recomendados];
    }
    recomendadosItems.innerHTML = '';
    if (cachedRecomendados.length > 0) {
      recomendadosSeparator.style.display = 'block';
      cachedRecomendados.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'next-item';
        div.innerHTML = `
          <img class="cover" src="${item.coverUrl || 'https://via.placeholder.com/30'}" alt="Cover" loading="lazy">
          <span>${item.title}</span>
          <div class="item-controls">
            <button class="item-play-pause">
              <img src="${(item.mediaUrl === currentMedia?.mediaUrl) ? (mediaElement.paused ? 'https://marca1.odoo.com/web/image/508-f876320c/play.svg' : 'https://nikichitonjesus.odoo.com/web/image/983-5c0bffd9/Pause.webp') : 'https://marca1.odoo.com/web/image/508-f876320c/play.svg'}" alt="Play/Pause" loading="lazy">
            </button>
          </div>
        `;
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          const mappedItem = mapEpisodeToMedia(item);
          loadMedia(
            mappedItem.mediaUrl,
            mappedItem.mediaType,
            mappedItem.coverUrlContainer,
            mappedItem.coverUrlInfo,
            mappedItem.title,
            mappedItem.detailUrl,
            mappedItem.author,
            mappedItem.next,
            mappedItem.text,
            mappedItem.allowDownload,
            true,
            index,
            mappedItem.color
          );
          togglePlayPause(true);
        });
        div.querySelector('.item-play-pause').addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.mediaUrl !== currentMedia?.mediaUrl) {
            const mappedItem = mapEpisodeToMedia(item);
            loadMedia(
              mappedItem.mediaUrl,
              mappedItem.mediaType,
              mappedItem.coverUrlContainer,
              mappedItem.coverUrlInfo,
              mappedItem.title,
              mappedItem.detailUrl,
              mappedItem.author,
              mappedItem.next,
              mappedItem.text,
              mappedItem.allowDownload,
              true,
              index,
              mappedItem.color
            );
          }
          togglePlayPause();
        });
        recomendadosItems.appendChild(div);
      });
    } else {
      recomendadosSeparator.style.display = 'none';
    }
  };

  const updateTextContent = () => {
    textContent.innerHTML = `<h4>${currentMedia?.title || ''}</h4><p>${episodeText || 'No hay texto disponible'}</p>`;
  };

  const showExpanded = () => {
    isExpanded = true;
    isHidden = false;
    playerExpanded.style.display = 'flex';
    playerMinimized.style.display = 'none';
    throttledSaveState();
    updatePlaylist();
    updateLikes();
    updateNextList();
    updateRecomendadosList();
    updateTextContent();
  };

  const showMinimized = () => {
    isExpanded = false;
    isHidden = false;
    playerExpanded.style.display = 'none';
    playerMinimized.style.display = 'flex';
    panelContainer.style.display = 'none';
    throttledSaveState();
  };

  const hidePlayer = () => {
    isHidden = true;
    playerExpanded.style.display = 'none';
    playerMinimized.style.display = 'none';
    panelContainer.style.display = 'none';
    throttledSaveState();
  };

  const togglePanel = (tab = 'cola') => {
    const wasVisible = panelContainer.style.display === 'flex';
    panelContainer.style.display = wasVisible ? 'none' : 'flex';
    if (panelContainer.style.display === 'flex') {
      const groups = {
        content: ['cola', 'detalles', 'biblioteca'],
        speed: ['velocidad'],
        timer: ['temporizador']
      };
      const getGroup = (tabName) => {
        for (let g in groups) {
          if (groups[g].includes(tabName)) return g;
        }
        return 'content';
      };
      const group = getGroup(tab);
      document.querySelectorAll('.tabs a').forEach(t => {
        t.classList.remove('visible');
        const tabName = t.id.replace('tab', '').toLowerCase();
        if (groups[group].includes(tabName)) {
          t.classList.add('visible');
        }
      });
      switchTab(tab);
      closePanelBtn.classList.add('visible');
      isPanelFullHeight = false;
      panelContainer.classList.remove('full-height');
      togglePanelHeightBtn.querySelector('img').src = 'https://marca1.odoo.com/web/image/513-e0bcd17f/maz.svg';
      minimizeBtn.style.position = 'fixed';
      minimizeBtn.style.bottom = 'auto';
      minimizeBtn.style.top = 'max(12px, env(safe-area-inset-top))';
    } else {
      closePanelBtn.classList.remove('visible');
    }
  };

  const togglePanelHeight = () => {
    isPanelFullHeight = !isPanelFullHeight;
    panelContainer.classList.toggle('full-height', isPanelFullHeight);
    togglePanelHeightBtn.querySelector('img').src = isPanelFullHeight ? 'https://marca1.odoo.com/web/image/514-efa5e8dd/minimizar.svg' : 'https://marca1.odoo.com/web/image/513-e0bcd17f/maz.svg';
    if (isPanelFullHeight) {
      minimizeBtn.style.position = 'absolute';
      minimizeBtn.style.bottom = '10px';
      minimizeBtn.style.top = 'auto';
    } else {
      minimizeBtn.style.position = 'fixed';
      minimizeBtn.style.bottom = 'auto';
      minimizeBtn.style.top = 'max(12px, env(safe-area-inset-top))';
    }
  };

  const switchTab = (tab) => {
    document.querySelectorAll('.tabs a').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
    if (tab === 'cola') {
      tabCola.classList.add('active');
      colaContent.classList.add('active');
    } else if (tab === 'detalles') {
      tabDetalles.classList.add('active');
      detallesContent.classList.add('active');
    } else if (tab === 'biblioteca') {
      tabBiblioteca.classList.add('active');
      bibliotecaContent.classList.add('active');
    } else if (tab === 'velocidad') {
      tabVelocidad.classList.add('active');
      velocidadContent.classList.add('active');
    } else if (tab === 'temporizador') {
      tabTemporizador.classList.add('active');
      temporizadorContent.classList.add('active');
      updateTimerView();
    }
  };

  const updateTimerView = () => {
    if (timerValue !== 0 && timerValue !== '0') {
      timerCountdown.style.display = 'flex';
      timerOptions.style.display = 'none';
    } else {
      timerCountdown.style.display = 'none';
      timerOptions.style.display = 'block';
    }
  };

  const setupTimer = () => {
    if (timerId) clearTimeout(timerId);
    if (timerCountdownInterval) clearInterval(timerCountdownInterval);
    if (timerValue === 'end') {
      currentEpisodeId = currentMedia.mediaUrl;
      const updateEndTimer = () => {
        const remaining = mediaElement.duration - mediaElement.currentTime;
        if (remaining <= 0 && currentEpisodeId === currentMedia.mediaUrl) {
          mediaElement.pause();
          resetTimer();
        }
      };
      mediaElement.addEventListener('timeupdate', updateEndTimer);
      timerCountdownInterval = setInterval(() => {
        countdownDisplay.textContent = formatTime(mediaElement.duration - mediaElement.currentTime);
      }, 1000);
    } else if (timerValue !== '0') {
      const minutes = parseInt(timerValue);
      let remaining = minutes * 60;
      timerId = setTimeout(() => {
        mediaElement.pause();
        resetTimer();
      }, remaining * 1000);
      timerCountdownInterval = setInterval(() => {
        remaining--;
        countdownDisplay.textContent = formatTime(remaining);
        if (remaining <= 0) clearInterval(timerCountdownInterval);
      }, 1000);
    }
    updateTimerButtons(timerValue);
    if (timerValue !== '0') timerContainer.classList.add('active');
  };

  const resetTimer = () => {
    if (timerId) clearTimeout(timerId);
    if (timerCountdownInterval) clearInterval(timerCountdownInterval);
    timerValue = 0;
    timerId = null;
    timerCountdownInterval = null;
    currentEpisodeId = null;
    timerContainer.classList.remove('active');
    timerCountdown.style.display = 'none';
    timerOptions.style.display = 'block';
    updateTimerButtons(0);
    throttledSaveState();
  };

  const updateTimerButtons = (value) => {
    timerOptions.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    const btn = timerOptions.querySelector(`button[data-value="${value}"]`);
    if (btn) btn.classList.add('selected');
  };

  const updateProgress = () => {
    if (!mediaElement.duration) return;
    const percentage = (mediaElement.currentTime / mediaElement.duration) * 100;
    progressBarExpanded.style.width = percentage + '%';
    progressBarMinimized.style.width = percentage + '%';
    currentTimeExpanded.textContent = formatTime(mediaElement.currentTime);
    durationExpanded.textContent = formatTime(mediaElement.duration);
    throttledSaveState();
  };

  const updateProgressDrag = (clientX, container, progressBar) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    let percentage = (x / width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    progressBar.style.width = percentage + '%';
    if (mediaElement.duration) {
      mediaElement.currentTime = (percentage / 100) * mediaElement.duration;
    }
    throttledSaveState();
  };

  const showSeekIndicator = (side, seconds) => {
    const indicator = side === 'left' ? seekIndicatorLeft : seekIndicatorRight;
    const secondsElem = side === 'left' ? seekSecondsLeft : seekSecondsRight;
    secondsElem.textContent = `${seconds}s`;
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 1000);
  };

  const checkMute = () => {
    isMuted = mediaElement.muted;
    isUserMuted = !isAutoMuted && isMuted;
    const volumeIconSrc = isMuted ? 'https://nikichitonjesus.odoo.com/web/image/584-d2f5c35f/mute.png' : 'https://nikichitonjesus.odoo.com/web/image/587-e4437449/volumen.png';
    loadImageWithFallback(volumeIcon, volumeIconSrc, isMuted ? 'Muted' : 'Volume', 'https://via.placeholder.com/24');
    showMuteIndicator();
    throttledSaveState();
  };

  const updateRepeatButton = () => {
    const span = repeatBtn.querySelector('span');
    if (repeatMode === 0) span.textContent = 'Repetir';
    else if (repeatMode === 1) span.textContent = 'Repetir una vez';
    else span.textContent = 'Repetir infinito';
    repeatBtn.classList.toggle('repeat-active', repeatMode > 0);
  };

  const updateSpeedButtons = (value) => {
    currentSpeed.textContent = `${value}x`;
    speedContainer.classList.toggle('active', value !== 1);
  };

  const updateMediaSession = () => {
    if (!('mediaSession' in navigator)) return;
    if (!currentMedia || !mediaElement) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMedia.title || 'Episodio sin título',
      artist: currentMedia.author || 'Roberto',
      album: 'By Balta',
      artwork: [
        { src: currentMedia.coverUrlContainer || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' },
        { src: currentMedia.coverUrlContainer || 'https://via.placeholder.com/256', sizes: '256x256', type: 'image/png' }
      ]
    });
    navigator.mediaSession.setActionHandler('play', () => togglePlayPause(true));
    navigator.mediaSession.setActionHandler('pause', togglePlayPause);
    navigator.mediaSession.setActionHandler('previoustrack', previous);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('seekbackward', () => rewind(15));
    navigator.mediaSession.setActionHandler('seekforward', () => forward(15));
    if (!isNaN(mediaElement.duration)) {
      navigator.mediaSession.setPositionState({
        duration: mediaElement.duration,
        playbackRate: mediaElement.playbackRate,
        position: mediaElement.currentTime
      });
    }
  };

  // ==================== EVENTOS ====================
  const attachEvents = () => {
    minimizeBtn.addEventListener('click', (e) => { e.stopPropagation(); showMinimized(); });
    expandBtn.addEventListener('click', (e) => { e.stopPropagation(); showExpanded(); });
    playerMinimized.addEventListener('click', (e) => {
      if (!progressContainerMinimized.contains(e.target) && !e.target.closest('.minimized-controls')) {
        showExpanded();
      }
    });

    mediaModeToggle.addEventListener('click', toggleMediaMode);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    volumeBtn.addEventListener('click', () => { mediaElement.muted = !mediaElement.muted; checkMute(); });
    playPauseMedia.addEventListener('click', () => togglePlayPause());
    rewindExpanded.addEventListener('click', () => rewind());
    forwardExpanded.addEventListener('click', () => forward());
    previousExpanded.addEventListener('click', previous);
    nextExpanded.addEventListener('click', next);
    rewindMinimized.addEventListener('click', (e) => { e.stopPropagation(); rewind(); });
    forwardMinimized.addEventListener('click', (e) => { e.stopPropagation(); forward(); });
    playPauseMinimized.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });

    speedContainer.addEventListener('click', (e) => { e.stopPropagation(); togglePanel('velocidad'); });
    timerContainer.addEventListener('click', (e) => { e.stopPropagation(); togglePanel('temporizador'); setTimeout(updateTimerView, 100); });

    speedSlider.addEventListener('input', () => {
      const value = parseFloat(speedSlider.value);
      mediaElement.playbackRate = value;
      updateSpeedButtons(value);
      throttledSaveState();
    });

    timerOptions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        timerValue = btn.dataset.value;
        setupTimer();
        togglePanel();
        throttledSaveState();
        updateTimerView();
      });
    });

    deactivateTimer.addEventListener('click', (e) => {
      e.stopPropagation();
      resetTimer();
      togglePanel();
      updateTimerView();
    });

    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentMedia.allowDownload) return;
      const link = document.createElement('a');
      link.href = currentMedia.mediaUrl;
      link.download = currentMedia.title || 'media';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navigator.share) {
        navigator.share({ title: currentMedia.title, url: currentMedia.detailUrl }).catch(() => {});
      } else {
        navigator.clipboard.writeText(currentMedia.detailUrl).then(() => alert('Enlace copiado'));
      }
    });

    repeatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      repeatMode = (repeatMode + 1) % 3;
      mediaElement.loop = repeatMode === 2;
      updateRepeatButton();
      throttledSaveState();
    });

    addToPlaylistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentMedia && !playlist.some(p => p.mediaUrl === currentMedia.mediaUrl)) {
        playlist.unshift(currentMedia);
        localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
        updatePlaylist();
        updateAddButton();
      } else if (currentMedia) {
        const index = playlist.findIndex(p => p.mediaUrl === currentMedia.mediaUrl);
        if (index > -1) {
          playlist.splice(index, 1);
          localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
          updatePlaylist();
          updateAddButton();
        }
      }
      throttledSaveState();
    });

    likesBtn.addEventListener('click', toggleLikes);
    colaBtn.addEventListener('click', () => togglePanel('cola'));
    detallesBtn.addEventListener('click', () => togglePanel('detalles'));
    bibliotecaBtn.addEventListener('click', () => togglePanel('biblioteca'));

    linkCola.addEventListener('click', (e) => { e.preventDefault(); togglePanel('cola'); });
    linkDetalles.addEventListener('click', (e) => { e.preventDefault(); togglePanel('detalles'); });
    linkBiblioteca.addEventListener('click', (e) => { e.preventDefault(); togglePanel('biblioteca'); });

    closePanelBtn.addEventListener('click', togglePanel);
    togglePanelHeightBtn.addEventListener('click', togglePanelHeight);

    tabCola.addEventListener('click', () => switchTab('cola'));
    tabDetalles.addEventListener('click', () => switchTab('detalles'));
    tabBiblioteca.addEventListener('click', () => switchTab('biblioteca'));
    tabVelocidad.addEventListener('click', () => switchTab('velocidad'));
    tabTemporizador.addEventListener('click', () => switchTab('temporizador'));

    viewAllLikes.addEventListener('click', toggleLikesView);
    playUserPlaylistBtn.addEventListener('click', () => {
      userPlaylistAutoPlay = !userPlaylistAutoPlay;
      playUserPlaylistBtn.classList.toggle('active', userPlaylistAutoPlay);
      if (userPlaylistAutoPlay && playlist.length > 0) {
        activeList = 'playlist';
        currentIndex = 0;
        const item = playlist[currentIndex];
        loadMedia(item.mediaUrl, item.mediaType, item.coverUrlContainer, item.coverUrlInfo, item.title, item.detailUrl, item.author, playlist, item.text, item.allowDownload, false, -1, item.color);
        togglePlayPause(true);
      } else if (!userPlaylistAutoPlay) {
        activeList = 'next';
      }
      throttledSaveState();
    });

    // Drag en barras de progreso
    progressContainerExpanded.addEventListener('mousedown', (e) => {
      isDraggingExpanded = true;
      progressContainerExpanded.classList.add('dragging');
      updateProgressDrag(e.clientX, progressContainerExpanded, progressBarExpanded);
      e.stopPropagation();
    });
    document.addEventListener('mousemove', (e) => {
      if (isDraggingExpanded) updateProgressDrag(e.clientX, progressContainerExpanded, progressBarExpanded);
    });
    document.addEventListener('mouseup', () => {
      if (isDraggingExpanded) {
        isDraggingExpanded = false;
        progressContainerExpanded.classList.remove('dragging');
      }
    });
    progressContainerExpanded.addEventListener('touchstart', (e) => {
      isDraggingExpanded = true;
      progressContainerExpanded.classList.add('dragging');
      updateProgressDrag(e.touches[0].clientX, progressContainerExpanded, progressBarExpanded);
      e.preventDefault();
    });
    document.addEventListener('touchmove', (e) => {
      if (isDraggingExpanded) updateProgressDrag(e.touches[0].clientX, progressContainerExpanded, progressBarExpanded);
    });
    document.addEventListener('touchend', () => {
      if (isDraggingExpanded) {
        isDraggingExpanded = false;
        progressContainerExpanded.classList.remove('dragging');
      }
    });

    progressContainerMinimized.addEventListener('mousedown', (e) => {
      isDraggingMinimized = true;
      progressContainerMinimized.classList.add('dragging');
      updateProgressDrag(e.clientX, progressContainerMinimized, progressBarMinimized);
      e.stopPropagation();
    });
    document.addEventListener('mousemove', (e) => {
      if (isDraggingMinimized) updateProgressDrag(e.clientX, progressContainerMinimized, progressBarMinimized);
    });
    document.addEventListener('mouseup', () => {
      if (isDraggingMinimized) {
        isDraggingMinimized = false;
        progressContainerMinimized.classList.remove('dragging');
      }
    });
    progressContainerMinimized.addEventListener('touchstart', (e) => {
      isDraggingMinimized = true;
      progressContainerMinimized.classList.add('dragging');
      updateProgressDrag(e.touches[0].clientX, progressContainerMinimized, progressBarMinimized);
      e.preventDefault();
    });

    // Tap en media container
    let tapCount = 0;
    let lastTapTime = 0;
    let tapSide = '';
    let tapTimeout = null;
    mediaContainer.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const now = Date.now();
      if (now - lastTapTime < 250) tapCount++;
      else tapCount = 1;
      lastTapTime = now;
      const rect = mediaContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      tapSide = x < rect.width / 2 ? 'left' : 'right';
      if (tapTimeout) clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        if (tapCount === 1) {
          mediaContainer.classList.toggle('show-controls');
          if (mediaContainer.classList.contains('show-controls')) {
            setTimeout(() => mediaContainer.classList.remove('show-controls'), 3000);
          }
        } else if (tapCount > 1) {
          const seconds = 15 * (tapCount - 1);
          if (tapSide === 'left') rewind(seconds);
          else forward(seconds);
        }
        tapCount = 0;
      }, 250);
    });

    // Swipe para minimizar/expandir
    let touchStartY = 0, touchEndY = 0, isSwiping = false;
    const swipeThreshold = 100;
    playerExpanded.addEventListener('touchstart', (e) => {
      if (e.target.closest('.media-container') || e.target.closest('.controls') || e.target.closest('.panel-container') || e.target.closest('button')) return;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    });
    playerExpanded.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      touchEndY = e.touches[0].clientY;
    });
    playerExpanded.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      const deltaY = touchStartY - touchEndY;
      if (deltaY > swipeThreshold) showMinimized();
      isSwiping = false;
    });

    playerMinimized.addEventListener('touchstart', (e) => {
      if (e.target.closest('.minimized-controls') || progressContainerMinimized.contains(e.target)) return;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    });
    playerMinimized.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      touchEndY = e.touches[0].clientY;
    });
    playerMinimized.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      const deltaY = touchStartY - touchEndY;
      if (deltaY > swipeThreshold) showExpanded();
      isSwiping = false;
    });

    // Guardar historial periódicamente
    mediaElement.addEventListener('timeupdate', throttle(() => {
      updateHistory();
    }, 5000));

    programBtn.addEventListener('click', () => {
      const programa = window.PROGRAMA_DEL_DIA || {
        mediaUrl: 'https://awscdn.podcasts.com/audio-vhhlggMJNysHnLYW8KXAQwu4w.mp3',
        mediaType: 'audio',
        coverUrlContainer: 'https://s3.amazonaws.com/podcasts-image-uploads/el-populismo-y-la-democracia-jesus-huerta-de-soto-1400x1400.png',
        coverUrlInfo: 'https://www.edu.balta.lat/web/image/415-8ae27244/media.png',
        title: 'El populismo y la democracia',
        detailUrl: '#',
        author: "Jesús Huerta de Soto",
        text: "No disponible",
        allowDownload: true,
        color: '#0f7dbd'
      };
      loadMedia(programa.mediaUrl, programa.mediaType, programa.coverUrlContainer, programa.coverUrlInfo, programa.title, programa.detailUrl, programa.author, [], programa.text, programa.allowDownload, false, -1, programa.color);
      showExpanded();
      togglePlayPause(true);
    });
  };

  // Función para fullscreen (simplificada)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mediaContainer.requestFullscreen().then(() => {
        isFullscreenMode = true;
        // Aquí puedes mostrar controles de fullscreen si los tienes
      }).catch(err => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen();
    }
  };

  // ==================== INICIALIZACIÓN ====================
  const init = () => {
    attachEvents();

    // Cargar estado guardado
    const state = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATE)) || {};
    if (state.mediaUrl) {
      loadMedia(
        state.mediaUrl,
        state.mediaType,
        state.coverUrlContainer,
        state.coverUrlInfo,
        state.title,
        state.detailUrl,
        state.author || 'Roberto',
        state.next || [],
        state.text || '',
        state.allowDownload !== false,
        false,
        -1,
        state.color
      );
      mediaElement.addEventListener('canplay', () => {
        mediaElement.currentTime = state.currentTime || 0;
        mediaElement.playbackRate = state.playbackRate || 1;
        mediaElement.muted = state.isMuted || false;
        isAudioMode = state.isAudioMode || true;
        updateMediaMode();
        if (state.isPlaying) {
          playWithFallback();
          updateIcons(true);
          updateOpenPlayerButton(true);
        } else {
          mediaElement.pause();
          updateIcons(false);
          updateOpenPlayerButton(false);
        }
      }, { once: true });
      updateSpeedButtons(state.playbackRate || 1);
      repeatMode = state.repeatMode || 0;
      updateRepeatButton();
      activeList = state.activeList || 'next';
      userPlaylistAutoPlay = state.userPlaylistAutoPlay || false;
      timerValue = state.timerValue || 0;
      if (timerValue !== 0) setupTimer();
      if (state.isExpanded) showExpanded();
      else if (!state.isHidden) showMinimized();
      else hidePlayer();
    } else {
      // Reproductor oculto inicialmente (se mostrará cuando se llame a togglePlayer)
      playerUniversal.style.display = 'none';
    }

    // Exponer funciones globales
    window.togglePlayer = () => {
      if (!currentMedia) {
        const programa = window.PROGRAMA_DEL_DIA || {
          mediaUrl: 'https://awscdn.podcasts.com/audio-vhhlggMJNysHnLYW8KXAQwu4w.mp3',
          mediaType: 'audio',
          coverUrlContainer: 'https://s3.amazonaws.com/podcasts-image-uploads/el-populismo-y-la-democracia-jesus-huerta-de-soto-1400x1400.png',
          coverUrlInfo: 'https://www.edu.balta.lat/web/image/415-8ae27244/media.png',
          title: 'El populismo y la democracia',
          detailUrl: '#',
          author: "Jesús Huerta de Soto",
          text: "No disponible",
          allowDownload: true,
          color: '#0f7dbd'
        };
        loadMedia(programa.mediaUrl, programa.mediaType, programa.coverUrlContainer, programa.coverUrlInfo, programa.title, programa.detailUrl, programa.author, [], programa.text, programa.allowDownload, false, -1, programa.color);
        togglePlayPause(true);
        showExpanded();
      } else {
        showExpanded();
      }
    };

    window.playEpisode = (mediaUrl, mediaType = 'audio', coverUrlContainer = '', coverUrlInfo = '', title = '', detailUrl = '', author = 'Roberto', next = [], text = '', allowDownload = true, color = null) => {
      if (currentMedia && currentMedia.mediaUrl === mediaUrl && !mediaElement.paused) {
        togglePlayPause();
      } else {
        loadMedia(mediaUrl, mediaType, coverUrlContainer, coverUrlInfo, title, detailUrl, author, next, text, allowDownload, false, -1, color);
        togglePlayPause(true);
      }
    };

    window.playEpisodeExpanded = (mediaUrl, mediaType = 'audio', coverUrlContainer = '', coverUrlInfo = '', title = '', detailUrl = '', author = 'Roberto', next = [], text = '', allowDownload = true, color = null) => {
      window.playEpisode(mediaUrl, mediaType, coverUrlContainer, coverUrlInfo, title, detailUrl, author, next, text, allowDownload, color);
      showExpanded();
    };

    window.playExpanded = (episodioObj) => {
      if (!episodioObj) return;
      let mapped = episodioObj;
      let isFromRec = false;
      let recIndex = -1;
      if (episodioObj.type && !episodioObj.mediaType) {
        mapped = mapEpisodeToMedia(episodioObj);
        recIndex = cachedRecomendados.findIndex(r => r.mediaUrl === episodioObj.mediaUrl);
        if (recIndex >= 0) isFromRec = true;
      }
      window.playEpisodeExpanded(
        mapped.mediaUrl || '',
        mapped.mediaType || 'audio',
        mapped.coverUrlContainer || '',
        mapped.coverUrlInfo || '',
        mapped.title || '',
        mapped.detailUrl || '',
        mapped.author || 'Roberto',
        mapped.next || [],
        mapped.text || '',
        mapped.allowDownload ?? true,
        mapped.color || null
      );
    };

    window.addToUserPlaylist = (obj) => {
      if (!obj || !obj.mediaUrl) return false;
      if (!playlist.some(p => p.mediaUrl === obj.mediaUrl)) {
        playlist.unshift(obj);
        localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
        updatePlaylist();
        updateAddButton();
        return true;
      }
      return false;
    };

    window.loadEpisode = loadMedia;
    window.playEpisodeMinimized = (mediaUrl, mediaType = 'audio', coverUrlContainer = '', coverUrlInfo = '', title = '', detailUrl = '', author = 'Roberto', next = [], text = '', allowDownload = true, color = null) => {
      loadMedia(mediaUrl, mediaType, coverUrlContainer, coverUrlInfo, title, detailUrl, author, next, text, allowDownload, false, -1, color);
      togglePlayPause(true);
      showMinimized();
    };
  };

  // Asegurar que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
