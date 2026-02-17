(async function() {
    // ================= 1. SUPABASE ТУТАШУУ =================
    // createClient'ди import кылуу (HTML'де <script type="module"> болушу керек)
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

    const supabaseUrl = 'https://xvdkoilhxvqpyljuaabq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZGtvaWxoeHZxcHlsanVhYWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjc5MzIsImV4cCI6MjA4NjgwMzkzMn0.4hL5UriqWuCrHVNwyx_XJVBQoQu4Nv6lLxhr5-xXSJ8';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ================= 2. ЭЛЕМЕНТТЕРДИ АЛУУ =================
    let ytPlayer;
    let progressInterval;

    const listDiv = document.getElementById('allList');
    const playerBar = document.getElementById('playerBar');
    const pFill = document.getElementById('pFill');
    const pCont = document.getElementById('pCont');
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    const nextBtn = document.getElementById('nextBtn');
    const searchInput = document.getElementById('searchInput');
    const handle = document.querySelector('.p-handle');

    let currentBtn = null;
    let currentSrcTitle = ""; 
    let currentIndex = -1;
    let isDragging = false; 
    let blockAutoUpdate = false; 
    let currentSongsList = []; // Базадан келген ырлар ушул жерге сакталат

    // Иконкалар
    const getPlayIcon = () => `<svg width="24" height="24" viewBox="-0.5 0 25 25" fill="none"><path d="M7.98047 3.51001C5.43047 4.39001 4.98047 9.09992 4.98047 12.4099C4.98047 15.7199 5.41047 20.4099 7.98047 21.3199C10.6905 22.2499 18.9805 16.1599 18.9805 12.4099C18.9805 8.65991 10.6905 2.58001 7.98047 3.51001Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
    const getPauseIcon = () => `<svg width="24" height="24" viewBox="-0.5 0 25 25" fill="none"><path d="M10 6.42004C10 4.76319 8.65685 3.42004 7 3.42004C5.34315 3.42004 4 4.76319 4 6.42004V18.42C4 20.0769 5.34315 21.42 7 21.42C8.65685 21.42 10 20.0769 10 18.42V6.42004Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 6.42004C20 4.76319 18.6569 3.42004 17 3.42004C15.3431 3.42004 14 4.76319 14 6.42004V18.42C14 20.0769 15.3431 21.42 17 21.42C18.6569 21.42 20 20.0769 20 18.42V6.42004Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
    const getLoadingIcon = () => `<div class="is-loading-circle"></div>`;

    // ================= 3. БАЗАДАН ЫРЛАРДЫ АЛУУ (Жаңы хит + Хит) =================
    async function fetchSongsFromDB() {
        const { data: newHits } = await supabase.from('new_hits').select('*').order('created_at', { ascending: false });
        const { data: hits } = await supabase.from('hits').select('*').order('created_at', { ascending: false });
        
        // Маалыматтарды бир массивге бириктирүү (Жаңы хиттер биринчи келет)
        const combined = [...(newHits || []), ...(hits || [])];
        
        // Базадагы 'name' талаасын 'title' кылып форматтап алуу
        currentSongsList = combined.map(item => ({
            artist: item.artist,
            title: item.name, 
            src: item.src
        }));

        renderSongs(currentSongsList);
    }

    // ================= 4. ПЛЕЕР ЛОГИКАСЫ (ОҢДОЛГОН) =================
    function setIcons(state){
        const icon = (state === "playing") ? getPauseIcon() : (state === "loading" ? getLoadingIcon() : getPlayIcon());
        if(currentBtn) currentBtn.innerHTML = icon;
        if(mainPlayBtn) mainPlayBtn.innerHTML = icon;
    }

    window.onYouTubeIframeAPIReady = function() {
        ytPlayer = new YT.Player('ytPlayer', {
            events: { 'onStateChange': onPlayerStateChange }
        });
    };

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            setIcons("playing");
            startProgressTracking();
        } else if (event.data === YT.PlayerState.BUFFERING) {
            setIcons("loading");
        } else if (event.data === YT.PlayerState.ENDED) {
            window.playNext();
        } else {
            setIcons("paused");
        }
    }

    window.toggleMainPlay = function() {
        if (!ytPlayer || typeof ytPlayer.getPlayerState !== "function") return;
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    };

    if(mainPlayBtn) mainPlayBtn.onclick = (e) => { e.preventDefault(); window.toggleMainPlay(); };

    window.togglePlay = function(btn, src, title, artist){
        if(!src) return;
        if(currentSrcTitle === title){ 
            window.toggleMainPlay();
            return;
        }
        if(currentBtn) currentBtn.innerHTML = getPlayIcon();
        currentBtn = btn;
        currentSrcTitle = title;
        currentIndex = currentSongsList.findIndex(s => s.title === title);
        
        document.getElementById('pTitle').innerText = title;
        document.getElementById('pArtist').innerText = artist;
        playerBar.classList.add('active');
        setIcons("loading");
        
        const vidMatch = src.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        if(vidMatch) {
            ytPlayer.loadVideoById(vidMatch[1]);
        }
    };

    function startProgressTracking() {
        clearInterval(progressInterval);
        progressInterval = setInterval(() => {
            if (ytPlayer && ytPlayer.getCurrentTime && !isDragging && !blockAutoUpdate) {
                const curr = ytPlayer.getCurrentTime();
                const dur = ytPlayer.getDuration();
                if (dur > 0) updateProgressBar((curr / dur) * 100);
            }
        }, 500);
    }

    function updateProgressBar(percent) {
        percent = Math.max(0, Math.min(100, percent));
        if(pFill) pFill.style.width = percent + "%";
        if(handle) handle.style.left = percent + "%";
    }

    // SEEKING LOGIC (Өзгөртүүсүз)
    if(pCont){
        const handleSeek = (e) => {
            if(!ytPlayer || typeof ytPlayer.getDuration !== "function") return;
            const dur = ytPlayer.getDuration();
            if(dur <= 0) return;
            const rect = pCont.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            blockAutoUpdate = true; 
            updateProgressBar(percent * 100);
            ytPlayer.seekTo(percent * dur, true);
        };
        const startDragging = (e) => { isDragging = true; handleSeek(e); };
        const stopDragging = () => { isDragging = false; setTimeout(() => { blockAutoUpdate = false; }, 800); };
        pCont.onmousedown = startDragging;
        window.addEventListener('mousemove', (e) => isDragging && handleSeek(e));
        window.addEventListener('mouseup', stopDragging);
        pCont.ontouchstart = startDragging;
        window.addEventListener('touchmove', (e) => isDragging && handleSeek(e));
        window.addEventListener('touchend', stopDragging);
    }

    window.playNext = function() {
        if(!currentSongsList.length) return;
        currentIndex++;
        if(currentIndex >= currentSongsList.length) currentIndex = 0;
        
        const next = currentSongsList[currentIndex];
        const allBtns = listDiv.querySelectorAll('.play-icon-circle');
        window.togglePlay(allBtns[currentIndex], next.src, next.title, next.artist);
    };

    if(nextBtn) nextBtn.onclick = window.playNext;

    window.renderSongs = function(songsToDisplay){
        if(!listDiv) return;
        listDiv.innerHTML = "";
        songsToDisplay.forEach((song, idx)=>{
            const div = document.createElement('div');
            div.className = 'song-item';
            div.innerHTML = `
                <div class="play-icon-circle">${getPlayIcon()}</div>
                <div class="song-info">
                    <b>${song.title}</b>
                    <span>${song.artist}</span>
                </div>`;
            const btn = div.querySelector('.play-icon-circle');
            div.onclick = () => window.togglePlay(btn, song.src, song.title, song.artist);
            listDiv.appendChild(div);
        });
    };

    if (searchInput) {
        searchInput.oninput = function() {
            const query = this.value.toLowerCase();
            const filtered = currentSongsList.filter(song => 
                song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
            );
            renderSongs(filtered);
        };
    }

    // АЛГАЧКЫ ЖҮКТӨӨ
    fetchSongsFromDB();

})();