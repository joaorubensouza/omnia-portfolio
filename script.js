/* =====================
   MENU LATERAL
===================== */
function openMenu() {
  document.getElementById("sideMenu").classList.add("open");
}

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
}

/* =====================
   PERFORMANCE + AUTOPLAY
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const saveData =
    "connection" in navigator && navigator.connection && navigator.connection.saveData;

  document.querySelectorAll("img").forEach((img) => {
    const isCritical = img.closest(".navbar") || img.closest(".hero");
    if (!img.hasAttribute("loading")) {
      img.loading = isCritical ? "eager" : "lazy";
    }
    if (!img.hasAttribute("decoding")) {
      img.decoding = "async";
    }
  });

  const allVideos = Array.from(document.querySelectorAll("video"));
  const autoVideos = allVideos.filter((video) => video.hasAttribute("autoplay"));

  allVideos.forEach((video) => {
    if (!video.getAttribute("preload")) {
      video.preload = "metadata";
    }
    if (!video.hasAttribute("playsinline")) {
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.playsInline = true;
    }
  });

  autoVideos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
  });

  if (saveData) {
    autoVideos.forEach((video) => video.pause());
    return;
  }

  const tryPlay = (video) => {
    const promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(() => {});
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            tryPlay(video);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.2 }
    );

    autoVideos.forEach((video) => observer.observe(video));
  } else {
    autoVideos.forEach((video) => tryPlay(video));
  }

  const unlock = () => {
    autoVideos.forEach((video) => tryPlay(video));
  };

  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("click", unlock, { once: true, passive: true });
});

/* =====================
   LIGHTBOX PORTFÓLIO
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(
    ".portfolio-grid img, .portfolio-grid video"
  );
  const lightbox = document.getElementById("lightbox");
  const imgBox = document.getElementById("lightbox-img");
  const videoBox = document.getElementById("lightbox-video");

  const nextBtn = document.querySelector(".next");
  const prevBtn = document.querySelector(".prev");
  const closeBtn = document.querySelector(".close");

  let index = 0;
  let startX = 0;

  items.forEach((item, i) => {
    item.addEventListener("click", () => {
      index = i;
      openLightbox();
    });
  });

  function openLightbox() {
    lightbox.style.display = "flex";
    showItem();
  }

  function showItem() {
    imgBox.style.display = "none";
    videoBox.style.display = "none";
    videoBox.pause();

    const el = items[index];

    if (el.tagName === "IMG") {
      imgBox.src = el.src;
      imgBox.style.display = "block";
    } else {
      videoBox.src = el.src;
      videoBox.style.display = "block";
      videoBox.play();
    }
  }

  nextBtn.onclick = () => {
    index = (index + 1) % items.length;
    showItem();
  };

  prevBtn.onclick = () => {
    index = (index - 1 + items.length) % items.length;
    showItem();
  };

  closeBtn.onclick = () => {
    lightbox.style.display = "none";
    videoBox.pause();
  };

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeBtn.onclick();
  });

  /* SWIPE MOBILE */
  lightbox.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  lightbox.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) nextBtn.onclick();
    if (endX - startX > 50) prevBtn.onclick();
  });
});

/* =====================
   SCROLL REVEAL
===================== */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach((el) => {
    const top = el.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;

    if (top < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

/* =====================
   PARALLAX REAL (BLOG)
===================== */
window.addEventListener("scroll", () => {
  document.querySelectorAll(".parallax-inner").forEach((el) => {
    const speed = 0.25;
    const offset = window.pageYOffset;
    el.style.transform = `translateY(${offset * speed}px)`;
  });
});

/* =====================
   FORM ANIMAÇÃO (ENTRADA)
===================== */
const formAnimated = document.querySelector(".form-animate");

if (formAnimated) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        formAnimated.classList.add("visible");
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(formAnimated);
}

/* =====================
   FORM SUBMIT (AJAX + SUCESSO)
===================== */
const contactForm = document.getElementById("contactForm");
const successMsg = document.getElementById("form-success");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🚫 impede redirect do Formspree

    const formData = new FormData(contactForm);

    try {
      const response = await fetch(
        "https://formspree.io/f/xreebyrq",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
  contactForm.reset();
  successMsg.style.display = "block";

  successMsg.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
} else {
        alert("Erro ao enviar o formulário. Tente novamente.");
      }
    } catch (error) {
      alert("Erro de conexão. Verifique sua internet.");
    }
  });
}

/* =====================
   CODE TYPING EFFECT
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const editors = document.querySelectorAll(".code-editor");

  editors.forEach(editor => {
    const codeTarget = editor.querySelector(".typing");
    const source = document.getElementById("code-html");

    if (!codeTarget || !source) return;

    const text = source.textContent.trim();
    let index = 0;

    const cursor = document.createElement("span");
    cursor.classList.add("cursor");
    codeTarget.after(cursor);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();

        const typing = setInterval(() => {
          codeTarget.textContent += text.charAt(index);
          index++;

          if (index >= text.length) {
            clearInterval(typing);
            cursor.remove();
          }
        }, 25);
      },
      { threshold: 0.4 }
    );

    observer.observe(editor);
  });
});

/* =====================
   CARDS 3D – PRODUÇÃO AUDIOVISUAL
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const cards3D = document.querySelectorAll(".card-3d");

  if (!cards3D.length) return;

  cards3D.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      cards3D.forEach((c) => {
        if (c === card) {
          c.classList.add("active");
          c.classList.remove("not-active");
        } else {
          c.classList.remove("active");
          c.classList.add("not-active");
        }
      });
    });

    card.addEventListener("mouseleave", () => {
      cards3D.forEach((c) => {
        c.classList.remove("active", "not-active");
      });
    });
  });
});

document.addEventListener("click", function (e) {
  const menu = document.getElementById("sideMenu");
  const button = document.querySelector(".menu-btn");

  if (!menu || !button) return;

  if (
    menu.classList.contains("open") &&
    !menu.contains(e.target) &&
    !button.contains(e.target)
  ) {
    closeMenu();
  }
});

// MENU COLAPSÁVEL
document.querySelectorAll('.menu-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const group = toggle.parentElement;
    group.classList.toggle('open');
  });
});

document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");

    if (!href || href === "#") return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;

    const isCardLink =
      link.classList.contains("card-link") &&
      link.closest(".audiovisual-cards-section");

    if (isCardLink && window.innerWidth < 768) {
      const now = Date.now();
      const lastTap = Number(link.dataset.lastTap || 0);

      if (now - lastTap > 450) {
        link.dataset.lastTap = String(now);
        const card = link.querySelector(".card-3d");
        if (card) {
          document
            .querySelectorAll(".audiovisual-cards-section .card-3d")
            .forEach((c) => c.classList.remove("active"));
          card.classList.add("active");
        }
        e.preventDefault();
        return;
      }

      link.dataset.lastTap = "";
    }

    const isSameOrigin = link.origin === window.location.origin;
    const isSamePath = link.pathname === window.location.pathname;
    const hasHash = Boolean(link.hash);

    if (isSameOrigin && isSamePath && hasHash) {
      e.preventDefault();

      if (link.hash === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const target = document.querySelector(link.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }

      if (link.hash === "#top") {
        document.querySelectorAll(".hero-video").forEach((video) => {
          if (video.paused) {
            video.play().catch(() => {});
          }
        });
      }

      if (history.pushState) {
        history.pushState(null, "", link.hash);
      }

      return;
    }

    e.preventDefault();
    document.body.classList.add("page-transition");
    setTimeout(() => {
      window.location = link.href;
    }, 400);
  });
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-transition");
});

window.addEventListener("pagehide", () => {
  document.querySelectorAll("video").forEach((video) => video.pause());
});


document.querySelectorAll(".service-card").forEach(card => {
  let tapped = false;

  card.addEventListener("click", e => {
    if (!tapped && window.innerWidth < 768) {
      e.preventDefault();
      card.classList.add("active");
      tapped = true;

      setTimeout(() => tapped = false, 1200);
    }
  });
});

/* =====================
   CODE GAME (JOGO DA FORCA)
===================== */
document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.querySelector("[data-run-hm]");
  const lettersWrap = document.querySelector("[data-hm-letters]");
  const wordEl = document.querySelector("[data-hm-word]");
  const status = document.querySelector("[data-hm-status]");
  const figure = document.querySelector("[data-hm-figure]");
  const drawing = document.querySelector("[data-hm-drawing]");
  const score = document.querySelector("[data-hm-score]");
  const answer = document.querySelector("[data-hm-answer]");
  const game = document.querySelector("[data-hm-game]");

  if (!runBtn || !lettersWrap || !wordEl) return;

  const secret = "OMNIA";
  const maxErrors = 6;
  let guessed = new Set();
  let errors = 0;
  let active = false;

  const renderWord = () => {
    const display = secret
      .split("")
      .map((letter) => (guessed.has(letter) ? letter : "_"))
      .join(" ");
    wordEl.textContent = display;
  };

  const renderStatus = (message) => {
    if (status) status.textContent = message;
    if (score) score.textContent = `Erros: ${errors}/${maxErrors}`;
    if (drawing) drawing.setAttribute("data-stage", String(errors));
  };

  const finish = (message, isWin) => {
    active = false;
    renderStatus(message);
    if (answer) answer.classList.add("show");
    if (game) {
      game.classList.toggle("win", Boolean(isWin));
    }
    lettersWrap.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
    });
  };

  const checkGame = () => {
    const won = secret.split("").every((letter) => guessed.has(letter));
    if (won) {
      finish("Resposta: Omnia", true);
      return;
    }
    if (errors >= maxErrors) {
      finish("Fim de jogo.", false);
    }
  };

  const handleGuess = (letter, button) => {
    if (!active || guessed.has(letter)) return;
    guessed.add(letter);
    button.disabled = true;
    if (!secret.includes(letter)) {
      errors += 1;
      button.classList.add("wrong");
    } else {
      button.classList.add("right");
    }
    renderWord();
    renderStatus("Jogando...");
    checkGame();
  };

  const buildLetters = () => {
    lettersWrap.innerHTML = "";
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    alphabet.split("").forEach((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = letter;
      btn.addEventListener("click", () => handleGuess(letter, btn));
      lettersWrap.appendChild(btn);
    });
  };

  const reset = () => {
    guessed = new Set();
    errors = 0;
    active = true;
    if (game) {
      game.classList.add("active");
      game.classList.remove("hidden");
      game.classList.remove("win");
    }
    if (answer) answer.classList.remove("show");
    buildLetters();
    renderWord();
    renderStatus("Jogando...");
  };

  runBtn.addEventListener("click", reset);
});

function resumeHeroVideos() {
  document.querySelectorAll(".hero-video").forEach((video) => {
    if (video.paused) {
      video.play().catch(() => {});
    }
  });
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeHeroVideos();
});

window.addEventListener("pageshow", () => {
  resumeHeroVideos();
});

const hero = document.querySelector(".hero");
if (hero) {
  hero.addEventListener("click", resumeHeroVideos);
  hero.addEventListener("touchstart", resumeHeroVideos, { passive: true });
}

/* =====================
   CAMERA CURSOR (DESKTOP)
===================== */
(() => {
  if (!document.body || !window.matchMedia) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.body.classList.add("camera-cursor");

  if (document.querySelector(".cursor-flash")) return;

  const flash = document.createElement("span");
  flash.className = "cursor-flash";
  document.body.appendChild(flash);

  const triggerFlash = (x, y) => {
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.classList.remove("is-active");
    void flash.offsetWidth;
    flash.classList.add("is-active");
  };

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    if (event.button !== 0) return;
    triggerFlash(event.clientX, event.clientY);
  });
})();
