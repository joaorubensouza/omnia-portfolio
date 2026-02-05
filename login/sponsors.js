document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("sponsorAudio");
  const tracks = Array.from(document.querySelectorAll("[data-track]"));
  const toggle = document.getElementById("playerToggle");
  const title = document.getElementById("playerTitle");
  const artist = document.getElementById("playerArtist");
  const current = document.getElementById("playerCurrent");
  const total = document.getElementById("playerTotal");
  const fill = document.getElementById("playerFill");
  const topPlay = document.getElementById("topPlay");
  const topPrev = document.getElementById("topPrev");
  const topNext = document.getElementById("topNext");
  const topVolume = document.getElementById("topVolume");
  const topTitle = document.getElementById("topPlayerTitle");
  const topArtist = document.getElementById("topPlayerArtist");
  const topCurrent = document.getElementById("topCurrent");
  const topTotal = document.getElementById("topTotal");
  const topFill = document.getElementById("topFill");
  const topCover = document.querySelector(".top-player-cover");
  const defaultCover = topCover ? topCover.dataset.defaultCover : "";
  const topProgressTrack = document.querySelector(".top-player-track");
  const bottomProgressTrack = document.querySelector(".player-track");
  const countdown = document.querySelector("[data-countdown]");
  const countdownNote = document.getElementById("countdownNote");
  const sponsorGrid = document.getElementById("sponsorGrid");
  const featuredTrack = document.getElementById("featuredTrack");
  const featuredCarousel = document.getElementById("featuredCarousel");
  const timelineTrack = document.getElementById("timelineTrack");
  const carouselPrev = document.querySelector("[data-carousel=\"prev\"]");
  const carouselNext = document.querySelector("[data-carousel=\"next\"]");

  const initCountdown = () => {
    if (!countdown) return;
    const targetValue = countdown.dataset.target;
    if (!targetValue) return;
    const targetDate = new Date(targetValue);
    if (Number.isNaN(targetDate.getTime())) return;

    const daysEl = countdown.querySelector("[data-days]");
    const hoursEl = countdown.querySelector("[data-hours]");
    const minutesEl = countdown.querySelector("[data-minutes]");
    const secondsEl = countdown.querySelector("[data-seconds]");

    const update = () => {
      const now = new Date();
      let diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        diff = 0;
        if (countdownNote) {
          countdownNote.textContent = "Hoje a Omnia celebra 10 anos.";
        }
      } else if (countdownNote) {
        countdownNote.textContent = "Faltam poucos instantes para os 10 anos da Omnia.";
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    update();
    setInterval(update, 1000);
  };

  const parseJson = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (error) {
      return null;
    }
  };

  const renderSponsors = () => {
    const data = parseJson("sponsorsData");
    if (!data) return;

    const sponsors = Array.isArray(data.sponsors) ? data.sponsors : [];
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const featured = sponsors.filter((item) => item.featured);

    const buildTags = (tags) =>
      (tags || []).map((tag) => `<span>${tag}</span>`).join("");

    const roleClass = (role) =>
      role && role.toLowerCase() === "dj" ? "dj" : "atleta";

    if (sponsorGrid) {
      sponsorGrid.innerHTML = sponsors
        .map(
          (item) => `
          <article class="sponsor-card">
            <div class="sponsor-card-media">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="sponsor-card-body">
              <span class="sponsor-tag ${roleClass(item.role)}">${item.role}</span>
              <h3>${item.name}</h3>
              <p>${item.bio}</p>
              <div class="sponsor-meta">
                ${buildTags(item.tags)}
              </div>
            </div>
          </article>
        `
        )
        .join("");
    }

    if (featuredTrack) {
      featuredTrack.innerHTML = featured
        .map(
          (item) => `
          <article class="featured-card">
            <div class="featured-media">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="featured-body">
              <span class="sponsor-tag ${roleClass(item.role)}">${item.role}</span>
              <h3>${item.name}</h3>
              <p>${item.bio}</p>
              <div class="sponsor-meta">
                ${buildTags(item.tags)}
              </div>
            </div>
          </article>
        `
        )
        .join("");
    }

    if (timelineTrack) {
      timelineTrack.innerHTML = timeline
        .map(
          (item) => `
          <article class="timeline-item">
            <span class="timeline-year">${item.year}</span>
            <div class="timeline-card">
              <h4>${item.title}</h4>
              <p>${item.text}</p>
            </div>
          </article>
        `
        )
        .join("");
    }
  };

  const initCarousel = () => {
    if (!featuredCarousel) return;
    const scrollByAmount = () => featuredCarousel.clientWidth * 0.85;

    if (carouselPrev) {
      carouselPrev.addEventListener("click", () => {
        featuredCarousel.scrollBy({ left: -scrollByAmount(), behavior: "smooth" });
      });
    }

    if (carouselNext) {
      carouselNext.addEventListener("click", () => {
        featuredCarousel.scrollBy({ left: scrollByAmount(), behavior: "smooth" });
      });
    }
  };

  if (topCover && defaultCover) {
    topCover.style.backgroundImage = `url('${defaultCover}')`;
    topCover.style.backgroundSize = "cover";
    topCover.style.backgroundPosition = "center";
  }

  initCountdown();
  renderSponsors();
  initCarousel();

  if (!audio || tracks.length === 0) return;

  let activeIndex = -1;

  const formatTime = (value) => {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const updateMeta = (button) => {
    if (!button) return;
    const trackTitle = button.dataset.title || "Faixa sem titulo";
    const trackArtist = button.dataset.artist || "Omnia Sponsors";
    if (title) title.textContent = trackTitle;
    if (artist) artist.textContent = trackArtist;
    if (topTitle) topTitle.textContent = trackTitle;
    if (topArtist) topArtist.textContent = trackArtist;

    const cover = button.dataset.cover;
    if (topCover && cover) {
      topCover.style.backgroundImage = `url('${cover}')`;
      topCover.style.backgroundSize = "cover";
      topCover.style.backgroundPosition = "center";
    } else if (topCover && defaultCover) {
      topCover.style.backgroundImage = `url('${defaultCover}')`;
      topCover.style.backgroundSize = "cover";
      topCover.style.backgroundPosition = "center";
    }
  };

  const updateToggle = (isPlaying) => {
    const label = isPlaying ? "Pausar" : "Tocar";
    if (toggle) toggle.textContent = label;
    if (topPlay) topPlay.textContent = label;
    if (toggle) toggle.classList.toggle("is-playing", isPlaying);
    if (topPlay) topPlay.classList.toggle("is-playing", isPlaying);
  };

  const updateProgress = () => {
    const time = audio.currentTime || 0;
    if (current) current.textContent = formatTime(time);
    if (topCurrent) topCurrent.textContent = formatTime(time);

    const progress = audio.duration ? (time / audio.duration) * 100 : 0;
    if (fill) fill.style.width = `${progress}%`;
    if (topFill) topFill.style.width = `${progress}%`;
  };

  const updateTotal = () => {
    const duration = formatTime(audio.duration);
    if (total) total.textContent = duration;
    if (topTotal) topTotal.textContent = duration;
  };


  const setActiveTrack = (index) => {
    const button = tracks[index];
    if (!button) return;

    tracks.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    if (button.dataset.src) {
      audio.src = button.dataset.src;
    }
    updateMeta(button);

    activeIndex = index;
  };


  const changeTrack = (direction) => {
    if (!tracks.length) return;
    let nextIndex = activeIndex;
    if (nextIndex === -1) {
      nextIndex = 0;
    } else {
      nextIndex = (nextIndex + direction + tracks.length) % tracks.length;
    }
    setActiveTrack(nextIndex);
    audio.play().catch(() => {});
  };

  const playActive = () => {
    if (activeIndex === -1) {
      setActiveTrack(0);
    }
    audio.play().catch(() => {});
  };


  const seekTo = (event, trackEl) => {
    if (!audio.duration) return;
    const rect = trackEl.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, percent));
    audio.currentTime = clamped * audio.duration;
  };

  tracks.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (activeIndex === index) {
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      setActiveTrack(index);
      audio.play().catch(() => {});
    });
  });

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (audio.paused) {
        playActive();
      } else {
        audio.pause();
      }
    });
  }

  if (topPlay) {
    topPlay.addEventListener("click", () => {
      if (audio.paused) {
        playActive();
      } else {
        audio.pause();
      }
    });
  }

  if (topPrev) {
    topPrev.addEventListener("click", () => {
      changeTrack(-1);
    });
  }

  if (topNext) {
    topNext.addEventListener("click", () => {
      changeTrack(1);
    });
  }


  if (topVolume) {
    audio.volume = Number(topVolume.value);
    topVolume.addEventListener("input", (event) => {
      audio.volume = Number(event.target.value);
    });
  }

  if (topProgressTrack) {
    topProgressTrack.addEventListener("click", (event) => {
      seekTo(event, topProgressTrack);
    });
  }

  if (bottomProgressTrack) {
    bottomProgressTrack.addEventListener("click", (event) => {
      seekTo(event, bottomProgressTrack);
    });
  }

  audio.addEventListener("play", () => {
    updateToggle(true);
  });

  audio.addEventListener("pause", () => {
    updateToggle(false);
  });

  audio.addEventListener("loadedmetadata", () => {
    updateTotal();
    updateProgress();
  });

  audio.addEventListener("timeupdate", () => {
    updateProgress();
  });

  audio.addEventListener("ended", () => {
    if (!tracks.length) return;
    const nextIndex = activeIndex + 1 < tracks.length ? activeIndex + 1 : 0;
    setActiveTrack(nextIndex);
    audio.play().catch(() => {});
  });
});
