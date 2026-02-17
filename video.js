// --- 1. ЮТУБ API ЖҮКТӨӨ ---
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player, uiTimer, dragging = false;

// Элементтерди алуу
const playerCard = document.getElementById('player');
const pFill = document.getElementById('pFill');
const playIco = document.getElementById('playIco');
const pauseIco = document.getElementById('pauseIco');
const enterFs = document.getElementById('enterFs');
const exitFs = document.getElementById('exitFs');
const touchOverlay = document.getElementById('touchOverlay');

// --- 2. ЮТУБ API ДАЯР БОЛГОНДО ---
function onYouTubeIframeAPIReady() {
    player = new YT.Player('ytPlayer', {
        height: '100%',
        width: '100%',
        videoId: 'XRh-mr7YZhg',
        playerVars: { 
            'autoplay': 0, 
            'controls': 0, 
            'playsinline': 1, 
            'modestbranding': 1, 
            'rel': 0,
            'iv_load_policy': 3
        },
        events: { 
            'onReady': onPlayerReady, 
            'onStateChange': onPlayerStateChange 
        }
    });
}

// --- 3. ИНТЕРФЕЙСТИ БАШКАРУУ (UI) ---
function showUI() {
    playerCard.classList.remove('ui-hidden');
    clearTimeout(uiTimer);
    
    // Эгер видео ойноп жатса жана прогресс барды кармабаса, 3 сек кийин жашырат
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING && !dragging) {
        uiTimer = setTimeout(() => {
            playerCard.classList.add('ui-hidden');
        }, 3000);
    }
}

function onPlayerReady() {
    // Play/Pause
    document.getElementById('pBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        const state = player.getPlayerState();
        state === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
        showUI();
    });

    // Прогресс бар (Таймлайн басканда)
    document.getElementById('pArea').addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        player.seekTo(pct * player.getDuration());
        showUI();
    });

    // Экранды басканда UI көрсөтүү/жашыруу
    touchOverlay.addEventListener('click', (e) => {
        if (playerCard.classList.contains('ui-hidden')) {
            showUI();
        } else {
            playerCard.classList.add('ui-hidden');
        }
    });

    // Фулскрин кнопкасы
    document.getElementById('fBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            if (playerCard.requestFullscreen) playerCard.requestFullscreen();
            else if (playerCard.webkitRequestFullscreen) playerCard.webkitRequestFullscreen();
            else if (playerCard.msRequestFullscreen) playerCard.msRequestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // Прогресс барды автоматтык жаңыртуу
    setInterval(() => {
        if (player && player.getCurrentTime && player.getDuration() > 0) {
            const pct = (player.getCurrentTime() / player.getDuration()) * 100;
            if (!dragging) pFill.style.width = pct + "%";
        }
    }, 500);
}

// --- 4. ВИДЕОНУН АБАЛЫ ӨЗГӨРГӨНДӨ ---
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        playIco.style.display = 'none';
        pauseIco.style.display = 'block';
        showUI();
    } else {
        playIco.style.display = 'block';
        pauseIco.style.display = 'none';
        showUI(); // Токтогондо UI көрсөтүлөт
    }
}

// --- 5. ФУЛСКРИН ӨЗГӨРҮҮСҮН КӨЗӨМӨЛДӨӨ ---
document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    enterFs.style.display = isFs ? 'none' : 'block';
    exitFs.style.display = isFs ? 'block' : 'none';
    
    if (isFs) {
        playerCard.classList.add('fullscreen-mode');
    } else {
        playerCard.classList.remove('fullscreen-mode');
    }
    showUI();
});

// --- 6. ПЛЕЙЛИСТ ---
window.loadYTVideo = function(id, title, el) {
    player.loadVideoById(id);
    
    // Плейлисттеги активдүүлүктү жаңыртуу
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('active');
        const mark = item.querySelector('.playing-mark');
        if (mark) mark.remove();
    });
    
    el.classList.add('active');
    const thumb = el.querySelector('.pl-thumb');
    if (thumb) {
        thumb.insertAdjacentHTML('afterbegin', '<span class="playing-mark">Ойнолууда</span>');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
