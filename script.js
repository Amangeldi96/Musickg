import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://xvdkoilhxvqpyljuaabq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZGtvaWxoeHZxcHlsanVhYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjc5MzIsImV4cCI6MjA4NjgwMzkzMn0.4hL5UriqWuCrHVNwyx_XJVBQoQu4Nv6lLxhr5-xXSJ8';
const supabase = createClient(supabaseUrl, supabaseKey);

let ytPlayer, storyYtPlayer, currentBtn = null, progressInterval;

// ==========================================
// 1. ИКОНКАЛАР ЖАНА СПИННЕР
// ==========================================
const iconHTML = `<svg width="22" height="22" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.98047 3.51001C5.43047 4.39001 4.98047 9.09992 4.98047 12.4099C4.98047 15.7199 5.41047 20.4099 7.98047 21.3199C10.6905 22.2499 18.9805 16.1599 18.9805 12.4099C18.9805 8.65991 10.6905 2.58001 7.98047 3.51001Z" fill="currentColor"/></svg>`;
const pauseIconHTML = `<svg width="22" height="22" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 5H10V19H6V5ZM15 5H19V19H15V5Z" fill="currentColor"/></svg>`;
const spinnerHTML = `<div class="btn-spinner"></div>`;

// Автоматтык стилдер (Спиннер жана Прогресс үчүн)
const style = document.createElement('style');
style.innerHTML = `
    .btn-spinner {
        width: 20px; height: 20px;
        border: 2.5px solid rgba(255,255,255,0.2);
        border-top: 2.5px solid #ffffff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ==========================================
// 2. МААЛЫМАТТАРДЫ ЖҮКТӨӨ
// ==========================================
async function loadContent() {
    await Promise.all([loadShorts(), loadTopHits(), loadHits(), loadUpcoming()]);
}

async function loadShorts() {
    const { data } = await supabase.from('shorts').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('shortsList');
    if (container && data) {
        container.innerHTML = data.map(item => {
            const vid = extractVideoId(item.src);
            return `
                <div class="story-item" onclick="viewStory('${vid}')">
                    <div class="story-circle"><div class="video-wrapper"><img src="https://img.youtube.com/vi/${vid}/mqdefault.jpg"></div></div>
                    <p>${item.artist}</p>
                </div>`;
        }).join('');
    }
}

async function loadTopHits() {
    const { data } = await supabase.from('top_hits').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('albumList');
    if (container && data) {
        container.innerHTML = data.map(song => `
            <div class="block">
                <div class="progress-container"><div class="progress-bg"></div></div>
                <div class="song-image" style="background-image: url('${song.cover || ''}');"></div>
                <div class="block-text"><b>${song.artist}</b><p>${song.name}</p></div>
                <div class="mini-play" onclick="togglePlay(this, '${song.src}')">${iconHTML}</div>
            </div>`).join('');
    }
}

async function loadHits() {
    const { data } = await supabase.from('hits').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('hitList');
    if (container && data) {
        container.innerHTML = data.map(song => `
            <div class="song-item">
                <div class="progress-container"><div class="progress-bg"></div></div>
                <div class="play-icon-circle" onclick="togglePlay(this, '${song.src}')">${iconHTML}</div>
                <div class="song-name"><b>${song.name}</b><span>${song.artist}</span></div>
            </div>`).join('');
    }
}

// ЖАКЫНДА ЧЫГУУЧУЛАР - СИЗДИН СТИЛИҢИЗГЕ ЫЛАЙЫКТАЛДЫ
async function loadUpcoming() {
    const { data } = await supabase.from('upcoming').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('upcomingList');
    if (container && data) {
        container.innerHTML = data.map(item => `
            <div class="upcoming-card">
                <div class="progress-container"><div class="progress-bg"></div></div>
                <div class="upcoming-badge">ЖАКЫНДА</div>
                <div class="cover" style="background-image: url('${item.cover || ''}');"></div>
                <div class="card-content">
                    <b>${item.name}</b>
                    <p>${item.artist}</p>
                </div>
                <div class="upcoming-play" onclick="togglePlay(this, '${item.src}')">
                    ${iconHTML}
                </div>
            </div>`).join('');
    }
}

// ==========================================
// 3. ПЛЕЕР ЖАНА ПРОГРЕСС ЛОГИКАСЫ
// ==========================================
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('ytPlayer', {
        height: '0', width: '0',
        playerVars: { 'playsinline': 1, 'controls': 0 },
        events: { 'onStateChange': onPlayerStateChange }
    });
    storyYtPlayer = new YT.Player('storyYoutubePlayer', {
        height: '100%', width: '100%',
        playerVars: { 'playsinline': 1, 'controls': 0 }
    });
};

function extractVideoId(url) {
    const reg = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(reg);
    return (match && match[1].length === 11) ? match[1] : "";
}

window.togglePlay = function(btn, src) {
    const vid = extractVideoId(src);
    
    if (currentBtn === btn) {
        const state = ytPlayer.getPlayerState();
        if (state === 1) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    } else {
        if (currentBtn) {
            currentBtn.innerHTML = iconHTML;
            resetProgress(currentBtn);
        }
        currentBtn = btn;
        currentBtn.innerHTML = spinnerHTML; // Спиннерди көрсөтүү
        ytPlayer.loadVideoById(vid);
        ytPlayer.playVideo();
    }
};

function onPlayerStateChange(event) {
    if (event.data === 1) { // PLAYING
        currentBtn.innerHTML = pauseIconHTML;
        startProgress();
    } else if (event.data === 2 || event.data === 0) { // PAUSED же ENDED
        currentBtn.innerHTML = iconHTML;
        clearInterval(progressInterval);
    }
}

function startProgress() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (ytPlayer && ytPlayer.getDuration && currentBtn) {
            const pct = (ytPlayer.getCurrentTime() / ytPlayer.getDuration()) * 100;
            // Бардык типтеги карточкалардан прогресс-барды издөө
            const bar = currentBtn.closest('.block, .song-item, .upcoming-card')?.querySelector('.progress-bg');
            if (bar) bar.style.width = pct + '%';
        }
    }, 500);
}

function resetProgress(btn) {
    const bar = btn.closest('.block, .song-item, .upcoming-card')?.querySelector('.progress-bg');
    if (bar) bar.style.width = '0%';
}

// ==========================================
// 4. СТОРИЗ
// ==========================================
window.viewStory = function(vid) {
    if (ytPlayer) ytPlayer.pauseVideo();
    document.getElementById('storyFullscreen').style.display = 'block';
    storyYtPlayer.loadVideoById(vid);
    storyYtPlayer.playVideo();
};

window.closeStory = function() {
    document.getElementById('storyFullscreen').style.display = 'none';
    storyYtPlayer.stopVideo();
};

document.addEventListener('DOMContentLoaded', loadContent);
