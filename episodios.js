/* episodios.js — Datos de ejemplo de episodios y series.
 * El reproductor leerá window.EPISODIOS y window.SERIES si no se pasan
 * explícitamente al método MediaPlayer.play(id, { episodes, series }).
 *
 * Campos soportados por episodio:
 *   id, date, mediaUrl, mediaUrl2, trailer, thumbnail, thumbnail2,
 *   title, description, utilidad, allowDownload, proudccion (o produccion),
 *   seriesid, skipIntro {start,end}, skipRecap, skipCredits,
 *   detailUrl, bgColor, subtitlesUrl  (o subtitles: [{lang,label,url}])
 *
 * Si seriesid es '' / false / undefined => episodio suelto.
 * Cualquier campo vacío/false se mostrará como "No disponible".
 */
window.SERIES = [
  {
    seriesid: 'jesucristo',
    portada_serie: 'https://nikichitonjesus1.odoo.com/web/image/465-4e045826/Min-jesus.webp',
    titulo_serie: 'Jesucristo hombre',
    descripcion_serie: 'La historia de Jesús contada en varios episodios.',
    url_serie: '/jesucristo-hombre',
    bgColor: '#1e40af'
  },
  {
    seriesid: 'derecho',
    portada_serie: '',
    titulo_serie: 'Derecho Procesal Constitucional',
    descripcion_serie: 'Curso completo en video.',
    url_serie: '/derecho',
    bgColor: '#1f2937'
  }
];

window.EPISODIOS = [
  {
    id: 'la-vida-de-jesucristo',
    date: '2025-11-28',
    mediaUrl: 'https://archive.org/download/la-vida-de-jesus-en-ixil-trailer/la%20vida%20de%20Jes%C3%BAs.mp4',
    mediaUrl2: 'https://archive.org/download/la-vida-de-jesus-en-espanol-trailer/la%20vida%20de%20Jes%C3%BAs.mp4',
    trailer: 'https://archive.org/download/la-vida-de-jesus-en-ixil-trailer/la%20vida%20de%20Jes%C3%BAs.mp4',
    thumbnail: 'https://nikichitonjesus1.odoo.com/web/image/465-4e045826/Min-jesus.webp',
    thumbnail2: 'https://video.nikichitonjesus.org/web/image/438-44d31586/6.webp',
    title: 'Jesucristo sobre la tierra',
    description: 'Esta es la historia más grande jamás contada.',
    utilidad: '18 años, gracia, amor, fe, vida, compasión, drama, español, inglés',
    allowDownload: false,
    proudccion: 'Niki Chiton Jesus',
    seriesid: 'jesucristo',
    skipIntro: { start: '00:00', end: '00:30' },
    skipRecap: { start: '01:20', end: '03:00' },
    skipCredits: { start: '50:00', end: '50:10' },
    detailUrl: '/la-vida-de-jesucristo',
    bgColor: '#46210a',
    subtitlesUrl: ''
  },
  {
    id: 'jesus-cap-2',
    date: '2025-12-05',
    mediaUrl: 'https://archive.org/download/la-vida-de-jesus-en-espanol-trailer/la%20vida%20de%20Jes%C3%BAs.mp4',
    mediaUrl2: '',
    thumbnail: 'https://video.nikichitonjesus.org/web/image/438-44d31586/6.webp',
    title: 'Jesucristo: ministerio',
    description: 'Segundo capítulo de la serie.',
    utilidad: 'fe, esperanza',
    allowDownload: false,
    proudccion: 'Niki Chiton Jesus',
    seriesid: 'jesucristo',
    skipIntro: { start: '00:00', end: '00:20' },
    skipCredits: { start: '49:30', end: '50:00' },
    bgColor: '#46210a'
  },
  {
    id: 'episodio-suelto-1',
    date: '2025-10-15',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaUrl2: '',
    thumbnail: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    title: 'Big Buck Bunny',
    description: 'Cortometraje de animación de muestra.',
    utilidad: 'familia, animación',
    allowDownload: true,
    proudccion: 'Blender Foundation',
    seriesid: '',
    bgColor: '#0b3d2e'
  },
  {
    id: 'episodio-suelto-2',
    date: '2025-09-01',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_s5_both.jpg',
    title: 'Elephants Dream',
    description: 'Otro corto de muestra.',
    utilidad: '',
    allowDownload: false,
    proudccion: 'Orange Open Movie Project',
    seriesid: '',
    bgColor: '#2a1b3d'
  },
  {
    id: 'derecho-1',
    date: '2025-08-12',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: '',
    title: 'Derecho Procesal — Clase 1',
    description: 'Introducción al curso.',
    utilidad: 'derecho, educación',
    allowDownload: true,
    seriesid: 'derecho',
    bgColor: '#1f2937'
  },
  {
    id: 'derecho-2',
    date: '2025-08-19',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: '',
    title: 'Derecho Procesal — Clase 2',
    description: 'Principios fundamentales.',
    seriesid: 'derecho',
    bgColor: '#1f2937'
  }
];
