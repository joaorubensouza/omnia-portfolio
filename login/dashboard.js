const API_BASE = "/api";
const ADMIN_EMAIL = "jvdiamond97";

function setUserEmail(email) {
  const node = document.getElementById("userEmail");
  if (node) {
    node.textContent = email || "Cliente";
  }
}

async function fetchMe() {
  const response = await fetch(`${API_BASE}/me`, {
    credentials: "include"
  });

  if (!response.ok) {
    window.location.href = "index.html";
    return null;
  }

  const data = await response.json();
  setUserEmail(data.email);
  return data;
}

function renderCards(cards) {
  const container = document.getElementById("dashboardCards");
  if (!container) return;

  if (!cards.length) {
    container.innerHTML = `
      <article class="dashboard-card">
        <h3>Sem atualizacoes</h3>
        <p class="dashboard-meta">Aviso</p>
        <p>Nenhuma informacao foi publicada para este cliente ainda.</p>
        <button class="dashboard-link" type="button">Falar com a equipe</button>
      </article>
    `;
    return;
  }

  container.innerHTML = cards
    .map((card) => {
      const actionLabel = card.action_label || "Ver detalhes";
      const actionUrl = card.action_url || "#";
      return `
        <article class="dashboard-card">
          <h3>${card.title}</h3>
          ${card.meta ? `<p class="dashboard-meta">${card.meta}</p>` : ""}
          <p>${card.body || ""}</p>
          <a class="dashboard-link" href="${actionUrl}" target="_blank" rel="noopener">${actionLabel}</a>
        </article>
      `;
    })
    .join("");
}

function renderFiles(files) {
  const container = document.getElementById("dashboardFiles");
  if (!container) return;

  const header = `
    <div class="dashboard-row dashboard-row--head">
      <span>Arquivo</span>
      <span>Status</span>
      <span>Data</span>
    </div>
  `;

  if (!files.length) {
    container.innerHTML = `${header}
      <div class="dashboard-row">
        <span>Nenhum arquivo disponivel</span>
        <span>-</span>
        <span>-</span>
      </div>
    `;
    return;
  }

  container.innerHTML =
    header +
    files
      .map((file) => {
        return `
          <div class="dashboard-row">
            <span>${file.name}</span>
            <span>${file.status || "Disponivel"}</span>
            <span>${file.date_label || "-"}</span>
          </div>
        `;
      })
      .join("");
}

function renderPacks(packs) {
  const container = document.getElementById("packsList");
  if (!container) return;

  if (!packs.length) {
    container.innerHTML = "<p class=\"calendar-empty\">Nenhum pack cadastrado.</p>";
    return;
  }

  container.innerHTML = packs
    .map((pack) => {
      return `<a href="${pack.url}" target="_blank" rel="noopener">${pack.title}</a>`;
    })
    .join("");
}

async function fetchAlbums() {
  const response = await fetch(`${API_BASE}/albums`, {
    credentials: "include"
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json().catch(() => ({}));
  return data.albums || [];
}

let albumsCache = null;

async function getAlbums() {
  if (albumsCache) return albumsCache;
  albumsCache = await fetchAlbums();
  return albumsCache;
}

async function fetchVideoCategories() {
  const response = await fetch(`${API_BASE}/videos`, {
    credentials: "include"
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json().catch(() => ({}));
  return data.categories || [];
}

let videoCategoriesCache = null;

async function getVideoCategories() {
  if (videoCategoriesCache) return videoCategoriesCache;
  videoCategoriesCache = await fetchVideoCategories();
  return videoCategoriesCache;
}

async function fetchSiteCards() {
  const response = await fetch(`${API_BASE}/site-cards`, {
    credentials: "include"
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json().catch(() => ({}));
  return data.cards || [];
}

async function saveSiteCard(payload) {
  const response = await fetch(`${API_BASE}/site-cards`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

async function uploadSiteCardMedia(formData) {
  const response = await fetch(`${API_BASE}/site-cards/media`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

async function updateUserRole(payload) {
  const response = await fetch(`${API_BASE}/admin/user-role`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

function populateAlbumSelect(albums) {
  const select = document.getElementById("galleryAlbum");
  if (!select) return;

  if (!albums.length) {
    select.innerHTML = "<option value=\"\">Sem albuns disponiveis</option>";
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML =
    "<option value=\"\" disabled selected>Selecione um album</option>" +
    albums
      .map((album) => `<option value="${album.id}">${album.label}</option>`)
      .join("");
}

function populateVideoCategorySelect(categories) {
  const select = document.getElementById("youtubeCategory");
  if (!select) return;

  if (!categories.length) {
    select.innerHTML = "<option value=\"\">Sem categorias disponiveis</option>";
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML =
    "<option value=\"\" disabled selected>Selecione uma categoria</option>" +
    categories
      .map((category) => `<option value="${category.id}">${category.label}</option>`)
      .join("");

  renderCategoryChips("youtubeCategoryChips", select, categories);
}

function populateAdminAlbumSelect(albums) {
  const select = document.getElementById("adminAlbum");
  if (!select) return;

  if (!albums.length) {
    select.innerHTML = "<option value=\"\">Sem albuns disponiveis</option>";
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML =
    "<option value=\"\" disabled selected>Selecione um album</option>" +
    albums
      .map((album) => `<option value="${album.id}">${album.label}</option>`)
      .join("");
}

function populateAdminVideoCategorySelect(categories) {
  const select = document.getElementById("adminVideoCategory");
  if (!select) return;

  if (!categories.length) {
    select.innerHTML = "<option value=\"\">Sem categorias disponiveis</option>";
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML =
    "<option value=\"\" disabled selected>Selecione uma categoria</option>" +
    categories
      .map((category) => `<option value="${category.id}">${category.label}</option>`)
      .join("");

  renderCategoryChips("adminVideoCategoryChips", select, categories);
}

function renderCategoryChips(containerId, select, categories) {
  const container = document.getElementById(containerId);
  if (!container || !select) return;

  container.innerHTML = "";

  if (!categories.length) {
    const empty = document.createElement("span");
    empty.className = "admin-muted";
    empty.textContent = "Sem categorias disponiveis.";
    container.appendChild(empty);
    return;
  }

  const buttons = categories.map((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dashboard-chip";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.tabIndex = index === 0 ? 0 : -1;
    button.dataset.value = category.id;
    button.textContent = category.label;
    return button;
  });

  const setSelected = (value) => {
    const targetValue = String(value || "");
    select.value = targetValue;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    buttons.forEach((button) => {
      const isSelected = button.dataset.value === targetValue;
      button.setAttribute("aria-checked", isSelected ? "true" : "false");
      button.tabIndex = isSelected ? 0 : -1;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setSelected(button.dataset.value);
      button.focus();
    });

    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = buttons.indexOf(button);
      if (currentIndex === -1) return;
      const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = (currentIndex + delta + buttons.length) % buttons.length;
      const nextButton = buttons[nextIndex];
      if (nextButton) {
        setSelected(nextButton.dataset.value);
        nextButton.focus();
      }
    });
  });

  buttons.forEach((button) => container.appendChild(button));

  if (select.value) {
    setSelected(select.value);
  } else {
    const checked = buttons.find((button) => button.getAttribute("aria-checked") === "true");
    if (checked) setSelected(checked.dataset.value);
  }
}

function isAdminProfile(profile) {
  if (!profile) return false;
  const email = String(profile.email || "").toLowerCase();
  const local = email.split("@")[0];
  const role = String(profile.role || "").toLowerCase();
  const admin = ADMIN_EMAIL.toLowerCase();
  return role === "admin" || email === admin || local === admin;
}

function isMasterProfile(profile) {
  if (!profile) return false;
  const email = String(profile.email || "").toLowerCase();
  const local = email.split("@")[0];
  const admin = ADMIN_EMAIL.toLowerCase();
  return email === admin || local === admin;
}

let calendarState = {
  items: [],
  view: "month",
  monthOffset: 0,
  weekOffset: 0,
  search: "",
  type: "all",
  status: "all"
};

function applyFilters(items) {
  return items.filter((item) => {
    const matchSearch = calendarState.search
      ? `${item.title} ${item.notes || ""}`.toLowerCase().includes(calendarState.search)
      : true;
    const matchType = calendarState.type === "all" ? true : item.type === calendarState.type;
    const matchStatus = calendarState.status === "all" ? true : item.status === calendarState.status;
    return matchSearch && matchType && matchStatus;
  });
}

function buildCalendar(items) {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarTitle");
  const viewLabel = document.getElementById("calendarViewLabel");
  if (!grid || !title) return;

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  base.setMonth(base.getMonth() + calendarState.monthOffset);

  const month = base.getMonth();
  const year = base.getFullYear();
  const monthName = base.toLocaleDateString("pt-BR", { month: "long" });
  title.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  const itemsByDate = items.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  if (calendarState.view === "week") {
    viewLabel.textContent = "Semana";
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + calendarState.weekOffset * 7);
    const cells = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      cells.push({ day: date.getDate(), muted: false, date: iso });
    }

    grid.innerHTML = cells
      .map((cell) => {
        const list = itemsByDate[cell.date] || [];
        const itemsHtml = list
          .map((item) => `<span class="calendar-item ${item.type} ${item.status}" data-id="${item.id}" draggable="true" title="${item.title}">${item.title}</span>`)
          .join("");
        return `
          <div class="calendar-day ${list.length ? "has-items" : ""}" data-date="${cell.date}">
            <div class="calendar-day-number">${String(cell.day).padStart(2, "0")}</div>
            ${itemsHtml}
          </div>
        `;
      })
      .join("");
    return;
  }

  viewLabel.textContent = "Mes";
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, muted: true, date: null });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0, 10);
    cells.push({ day: d, muted: false, date: iso });
  }
  const totalCells = Math.ceil(cells.length / 7) * 7;
  const nextDays = totalCells - cells.length;
  for (let n = 1; n <= nextDays; n += 1) {
    cells.push({ day: n, muted: true, date: null });
  }

  grid.innerHTML = cells
    .map((cell) => {
      const list = cell.date ? (itemsByDate[cell.date] || []) : [];
      const itemsHtml = list
        .map((item) => `<span class="calendar-item ${item.type} ${item.status}" data-id="${item.id}" draggable="true" title="${item.title}">${item.title}</span>`)
        .join("");
      return `
        <div class="calendar-day ${cell.muted ? "muted" : ""} ${list.length ? "has-items" : ""}" data-date="${cell.date || ""}">
          <div class="calendar-day-number">${String(cell.day).padStart(2, "0")}</div>
          ${itemsHtml}
        </div>
      `;
    })
    .join("");
}

async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`, {
    credentials: "include"
  });

  if (!response.ok) {
    return;
  }

  const data = await response.json();
  renderCards(data.cards || []);
  renderFiles(data.files || []);
  renderPacks(data.packs || []);
  calendarState.items = data.calendar || [];
  const filtered = applyFilters(calendarState.items);
  buildCalendar(filtered);

  const statEvents = document.getElementById("statEvents");
  const statPacks = document.getElementById("statPacks");
  const statFiles = document.getElementById("statFiles");
  if (statEvents) statEvents.textContent = String(calendarState.items.length);
  if (statPacks) statPacks.textContent = String((data.packs || []).length);
  if (statFiles) statFiles.textContent = String((data.files || []).length);
}

async function logout() {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include"
  });
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  initYouTubeUpload();

  fetchMe()
    .then((profile) => {
      if (profile && isAdminProfile(profile)) {
        initAdminGallery();
        initAdminVideos();
        initAdminCardLabels();
        if (isMasterProfile(profile)) {
          initAdminUsers();
        }
      }
      return fetchDashboard();
    })
    .catch(() => {
      window.location.href = "index.html";
    });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const form = document.getElementById("calendarForm");
  const modal = document.getElementById("calendarModal");
  const backdrop = document.getElementById("calendarBackdrop");
  const openBtn = document.getElementById("openCalendarForm");
  const openBtnAlt = document.getElementById("openCalendarFormAlt");
  const closeBtn = document.getElementById("closeCalendarForm");
  const status = document.getElementById("calendarStatus");
  const dateInput = document.getElementById("calendar-date");
  const idInput = document.getElementById("calendar-id");
  const typeInput = document.getElementById("calendar-type");
  const statusInput = document.getElementById("calendar-status");
  const reminderInput = document.getElementById("calendar-reminder");
  const deleteBtn = document.getElementById("calendarDelete");
  const quickAddBtn = document.getElementById("calendarQuickAdd");
  const searchInput = document.getElementById("calendarSearch");
  const typeFilter = document.getElementById("calendarTypeFilter");
  const statusFilter = document.getElementById("calendarStatusFilter");
  const viewButtons = document.querySelectorAll(".calendar-toggle-btn");
  const prevBtn = document.getElementById("calendarPrev");
  const nextBtn = document.getElementById("calendarNext");
  const uploadForm = document.getElementById("galleryUploadForm");
  const dropzone = document.getElementById("galleryDropzone");
  const albumSelect = document.getElementById("galleryAlbum");
  const albumField = document.getElementById("galleryAlbumField");
  const fileInput = document.getElementById("galleryFiles");
  const filesMeta = document.getElementById("galleryFilesMeta");
  const filesList = document.getElementById("galleryFilesList");
  const uploadBtn = document.getElementById("galleryUploadBtn");
  const uploadStatus = document.getElementById("galleryUploadStatus");

  if (modal) {
    modal.hidden = true;
  }

  const openModal = (prefillDate, item) => {
    if (!modal) return;
    modal.hidden = false;
    if (deleteBtn) deleteBtn.hidden = !item;
    if (dateInput && prefillDate) {
      dateInput.value = prefillDate;
    } else if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (item) {
      if (idInput) idInput.value = item.id;
      document.getElementById("calendar-title").value = item.title || "";
      if (typeInput) typeInput.value = item.type || "geral";
      if (statusInput) statusInput.value = item.status || "pendente";
      if (reminderInput) reminderInput.value = String(item.reminder_days || 0);
      document.getElementById("calendar-notes").value = item.notes || "";
    } else if (idInput) {
      idInput.value = "";
    }
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      openModal();
    });
  }

  if (openBtnAlt) {
    openBtnAlt.addEventListener("click", () => {
      openModal();
    });
  }

  if (quickAddBtn) {
    quickAddBtn.addEventListener("click", () => {
      openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeModal();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  const grid = document.getElementById("calendarGrid");
  if (grid) {
    grid.addEventListener("click", (event) => {
      const itemEl = event.target.closest(".calendar-item");
      if (itemEl) {
        const id = Number(itemEl.dataset.id);
        const item = calendarState.items.find((i) => i.id === id);
        if (item) {
          openModal(item.date, item);
        }
        return;
      }

      const target = event.target.closest(".calendar-day");
      if (!target || target.classList.contains("muted")) return;
      const date = target.dataset.date;
      openModal(date);
    });
  }

  if (grid) {
    grid.addEventListener("dragstart", (event) => {
      const itemEl = event.target.closest(".calendar-item");
      if (itemEl) {
        event.dataTransfer.setData("text/plain", itemEl.dataset.id);
      }
    });

    grid.addEventListener("dragover", (event) => {
      if (event.target.closest(".calendar-day")) {
        event.preventDefault();
      }
    });

    grid.addEventListener("drop", async (event) => {
      const day = event.target.closest(".calendar-day");
      if (!day || day.classList.contains("muted")) return;
      const id = Number(event.dataTransfer.getData("text/plain"));
      const item = calendarState.items.find((i) => i.id === id);
      if (!item) return;
      const response = await fetch(`${API_BASE}/calendar/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          date: day.dataset.date,
          notes: item.notes || "",
          type: item.type || "geral",
          status: item.status || "pendente",
          reminder_days: item.reminder_days || 0
        })
      });
      if (response.ok) {
        fetchDashboard();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      calendarState.search = event.target.value.toLowerCase();
      buildCalendar(applyFilters(calendarState.items));
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", (event) => {
      calendarState.type = event.target.value;
      buildCalendar(applyFilters(calendarState.items));
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (event) => {
      calendarState.status = event.target.value;
      buildCalendar(applyFilters(calendarState.items));
    });
  }

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      calendarState.view = btn.dataset.view;
      buildCalendar(applyFilters(calendarState.items));
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (calendarState.view === "week") {
        calendarState.weekOffset -= 1;
      } else {
        calendarState.monthOffset -= 1;
      }
      buildCalendar(applyFilters(calendarState.items));
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (calendarState.view === "week") {
        calendarState.weekOffset += 1;
      } else {
        calendarState.monthOffset += 1;
      }
      buildCalendar(applyFilters(calendarState.items));
    });
  }

  if (uploadForm) {
    let selectedFiles = [];
    let isUploading = false;

    const renderFiles = () => {
      if (!filesList) return;
      filesList.innerHTML = "";
      selectedFiles.slice(0, 8).forEach((file) => {
        const li = document.createElement("li");
        li.textContent = file.name;
        filesList.appendChild(li);
      });
      if (selectedFiles.length > 8) {
        const li = document.createElement("li");
        li.textContent = `+ ${selectedFiles.length - 8} arquivos`;
        filesList.appendChild(li);
      }
    };

    const syncUi = () => {
      const hasFiles = selectedFiles.length > 0;
      const hasAlbum = albumSelect ? Boolean(albumSelect.value) : true;
      if (filesMeta) {
        filesMeta.textContent = hasFiles
          ? `${selectedFiles.length} foto(s) selecionada(s)`
          : "Nenhum arquivo selecionado";
      }
      if (albumField) albumField.hidden = !hasFiles;
      if (uploadBtn) uploadBtn.disabled = !hasFiles || isUploading || !hasAlbum;
      renderFiles();
    };

    const setFiles = (files) => {
      selectedFiles = files.filter((file) => file.type && file.type.startsWith("image/"));
      if (uploadStatus) uploadStatus.textContent = "";
      syncUi();
    };

    getAlbums()
      .then(populateAlbumSelect)
      .catch(() => {
        populateAlbumSelect([]);
      });

    if (albumSelect) {
      albumSelect.addEventListener("change", syncUi);
    }

    if (dropzone) {
      const openPicker = () => {
        if (fileInput) fileInput.click();
      };

      dropzone.addEventListener("click", openPicker);
      dropzone.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      });

      dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.classList.add("is-drag");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("is-drag");
      });

      dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-drag");
        const dropped = Array.from(event.dataTransfer.files || []);
        setFiles(dropped);
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        const picked = Array.from(event.target.files || []);
        setFiles(picked);
      });
    }

    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (uploadStatus) uploadStatus.textContent = "";

      const albumId = albumSelect ? albumSelect.value : "";
      if (!albumId) {
        if (uploadStatus) uploadStatus.textContent = "Selecione uma galeria.";
        return;
      }

      if (!selectedFiles.length) {
        if (uploadStatus) uploadStatus.textContent = "Adicione pelo menos uma foto.";
        return;
      }

      if (isUploading) return;
      isUploading = true;
      syncUi();

      const batchSize = 5;
      let uploadedCount = 0;

      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize);
        const formData = new FormData();
        batch.forEach((file) => formData.append("files", file));

        const response = await fetch(`${API_BASE}/albums/${albumId}/upload`, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (uploadStatus) {
            uploadStatus.textContent = data.message || "Nao foi possivel enviar.";
          }
          isUploading = false;
          syncUi();
          return;
        }

        uploadedCount += (data.assets || []).length || batch.length;
        if (uploadStatus) {
          uploadStatus.textContent = `Enviadas ${uploadedCount} foto(s)...`;
        }
      }

      if (uploadStatus) {
        uploadStatus.textContent = `Enviadas ${uploadedCount} foto(s) com sucesso.`;
      }

      selectedFiles = [];
      if (fileInput) fileInput.value = "";
      if (albumSelect) albumSelect.value = "";
      isUploading = false;
      syncUi();
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (status) status.textContent = "";

      const title = document.getElementById("calendar-title").value.trim();
      const date = document.getElementById("calendar-date").value;
      const notes = document.getElementById("calendar-notes").value.trim();
      const type = typeInput ? typeInput.value : "geral";
      const statusValue = statusInput ? statusInput.value : "pendente";
      const reminderDays = reminderInput ? Number(reminderInput.value) : 0;
      const idValue = idInput ? idInput.value : "";

      if (!title || !date) {
        if (status) status.textContent = "Preencha titulo e data.";
        return;
      }

      const endpoint = idValue ? "/calendar/update" : "/calendar";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: idValue ? Number(idValue) : undefined,
          title,
          date,
          notes,
          type,
          status: statusValue,
          reminder_days: reminderDays
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (status) status.textContent = data.message || "Nao foi possivel salvar.";
        return;
      }

      if (status) status.textContent = "Salvo com sucesso.";
      form.reset();
      closeModal();
      fetchDashboard();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const idValue = idInput ? idInput.value : "";
      if (!idValue) return;
      const response = await fetch(`${API_BASE}/calendar/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: Number(idValue) })
      });
      if (response.ok) {
        closeModal();
        fetchDashboard();
      } else if (status) {
        status.textContent = "Nao foi possivel excluir.";
      }
    });
  }
});

function initYouTubeUpload() {
  const form = document.getElementById("youtubeUploadForm");
  const urlInput = document.getElementById("youtubeUrl");
  const titleInput = document.getElementById("youtubeTitle");
  const categorySelect = document.getElementById("youtubeCategory");
  const status = document.getElementById("youtubeUploadStatus");
  const submitBtn = document.getElementById("youtubeUploadBtn");

  if (!form || !urlInput || !categorySelect) return;

  let isSubmitting = false;

  const setStatus = (message) => {
    if (status) status.textContent = message || "";
  };

  const syncUi = () => {
    if (!submitBtn) return;
    const hasUrl = Boolean(String(urlInput.value || "").trim());
    const hasCategory = Boolean(categorySelect.value);
    submitBtn.disabled = isSubmitting || !hasUrl || !hasCategory;
  };

  getVideoCategories()
    .then(populateVideoCategorySelect)
    .catch(() => populateVideoCategorySelect([]));

  urlInput.addEventListener("input", syncUi);
  categorySelect.addEventListener("change", syncUi);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus("");

    const urlValue = String(urlInput.value || "").trim();
    const categoryId = categorySelect.value;
    const titleValue = titleInput ? String(titleInput.value || "").trim() : "";

    if (!urlValue) {
      setStatus("Cole o link do YouTube.");
      return;
    }

    if (!categoryId) {
      setStatus("Selecione uma categoria.");
      return;
    }

    isSubmitting = true;
    syncUi();
    setStatus("Enviando...");

    const response = await fetch(`${API_BASE}/videos/${categoryId}/items`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlValue, title: titleValue || null })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.message || "Nao foi possivel adicionar o video.");
      isSubmitting = false;
      syncUi();
      return;
    }

    setStatus("Video adicionado com sucesso.");
    urlInput.value = "";
    if (titleInput) titleInput.value = "";
    categorySelect.value = "";
    isSubmitting = false;
    syncUi();
  });

  syncUi();
}

function initAdminVideos() {
  const section = document.getElementById("adminVideoSection");
  const select = document.getElementById("adminVideoCategory");
  const grid = document.getElementById("adminVideoGrid");
  const status = document.getElementById("adminVideoStatus");
  const refreshBtn = document.getElementById("adminVideoRefreshBtn");

  if (!section || !select || !grid) return;
  section.hidden = false;

  let currentCategoryId = "";

  const setStatus = (message) => {
    if (status) status.textContent = message || "";
  };

  const renderList = (videos) => {
    if (!videos.length) {
      grid.innerHTML = "<p class=\"admin-gallery-empty\">Nenhum video nesta categoria.</p>";
      return;
    }

    grid.innerHTML = videos
      .map((video) => {
        const titleText = video.title || `Video ${video.youtube_id}`;
        const embed = video.embed_url || `https://www.youtube.com/embed/${video.youtube_id}`;
        return `
          <article class="admin-video-card" data-id="${video.id}">
            <div class="admin-video-embed">
              <iframe
                src="${embed}"
                title="${titleText}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
            <div class="admin-video-meta">
              <span title="${titleText}">${titleText}</span>
              <button class="admin-video-delete" type="button" data-id="${video.id}">Remover</button>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const loadVideos = async () => {
    if (!currentCategoryId) {
      renderList([]);
      setStatus("Selecione uma categoria para visualizar.");
      return;
    }

    setStatus("Carregando videos...");
    const response = await fetch(`${API_BASE}/videos/${currentCategoryId}/items`, {
      credentials: "include"
    });

    if (!response.ok) {
      setStatus("Nao foi possivel carregar os videos.");
      return;
    }

    const data = await response.json().catch(() => ({}));
    renderList(data.videos || []);
    setStatus("");
  };

  select.addEventListener("change", () => {
    currentCategoryId = select.value;
    loadVideos();
  });

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadVideos();
    });
  }

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest(".admin-video-delete");
    if (!button) return;
    if (!currentCategoryId) return;

    const videoId = button.dataset.id;
    if (!videoId) return;

    const ok = window.confirm("Deseja remover este video?");
    if (!ok) return;

    button.disabled = true;
    setStatus("Removendo video...");

    const response = await fetch(`${API_BASE}/videos/${currentCategoryId}/items/${videoId}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok) {
      button.disabled = false;
      setStatus("Nao foi possivel remover o video.");
      return;
    }

    const card = button.closest(".admin-video-card");
    if (card) card.remove();
    setStatus("Video removido.");
  });

  getVideoCategories()
    .then(populateAdminVideoCategorySelect)
    .catch(() => populateAdminVideoCategorySelect([]));
}

function initAdminCardLabels() {
  const section = document.getElementById("adminCardLabelsSection");
  const form = document.getElementById("adminCardLabelsForm");
  const areaSelect = document.getElementById("adminCardArea");
  const grid = document.getElementById("adminCardLabelsGrid");
  const status = document.getElementById("adminCardLabelsStatus");
  const refreshBtn = document.getElementById("adminCardLabelsRefreshBtn");

  if (!section || !form || !areaSelect || !grid) return;
  section.hidden = false;

  const CARD_DEFS = {
    fotografia: [
      {
        card_id: "comerciais",
        label: "Fotografia: Comerciais",
        defaultTitle: "Comerciais",
        defaultSubtitle: "Impacto & Conversao",
        defaultMedia: "/img/_DSC10.png",
        subtitleEnabled: true
      },
      {
        card_id: "producoes",
        label: "Fotografia: Producoes Fotograficas",
        defaultTitle: "Producoes Fotograficas",
        defaultSubtitle: "Narrativa Visual",
        defaultMedia: "/img/_DSC9.png",
        subtitleEnabled: true
      },
      {
        card_id: "drone",
        label: "Fotografia: Drone",
        defaultTitle: "Drone",
        defaultSubtitle: "Captacao Aerea",
        defaultMedia: "/img/_DSC11.png",
        subtitleEnabled: true
      }
    ],
    audiovisual: [
      {
        card_id: "comerciais",
        label: "Audiovisual: Comerciais",
        defaultTitle: "Comerciais",
        defaultMedia: "/videos/Judo  Sfoa - Mais Novos.mp4",
        subtitleEnabled: false
      },
      {
        card_id: "cinematografica",
        label: "Audiovisual: Producoes Cinematograficas",
        defaultTitle: "Producoes Cinematograficas",
        defaultMedia: "/videos/TerceiraSegur - Artes Marciais.mp4",
        subtitleEnabled: false
      },
      {
        card_id: "drone",
        label: "Audiovisual: Drone",
        defaultTitle: "Drone",
        defaultMedia: "/videos/Drone Site.mp4",
        subtitleEnabled: false
      }
    ]
  };

  let cardsCache = [];

  const setStatus = (message) => {
    if (status) status.textContent = message || "";
  };

  const buildField = (labelText) => {
    const field = document.createElement("div");
    field.className = "dashboard-upload-field";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = "text";
    field.appendChild(label);
    field.appendChild(input);
    return { field, input };
  };

  const resolveMediaValue = (value, fallback) => {
    const trimmed = String(value || "").trim();
    if (trimmed) return trimmed;
    return fallback || "";
  };

  const updatePreview = (previewNode, area, url) => {
    if (!previewNode) return;
    const value = String(url || "").trim();
    if (!value) return;

    if (area === "fotografia") {
      previewNode.src = value;
      return;
    }

    const source = previewNode.querySelector("source");
    if (!source) return;
    source.src = value;
    previewNode.load();
    previewNode.play().catch(() => {});
  };

  const buildMediaUploader = ({ area, cardId, def, saved, previewMedia }) => {
    const field = document.createElement("div");
    field.className = "dashboard-upload-field admin-cardlabels-media";

    const label = document.createElement("label");
    label.textContent = area === "fotografia" ? "Midia (Foto)" : "Midia (Video MP4)";
    field.appendChild(label);

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "admin-card-media";
    urlInput.maxLength = 500;
    urlInput.value = saved.media_url ? String(saved.media_url) : "";
    urlInput.placeholder = def.defaultMedia || "/img/...";
    urlInput.readOnly = true;
    urlInput.hidden = true;
    field.appendChild(urlInput);

    const dropzone = document.createElement("div");
    dropzone.className = "dashboard-dropzone admin-cardmedia-dropzone";
    dropzone.tabIndex = 0;
    dropzone.setAttribute("role", "button");
    dropzone.setAttribute("aria-label", `Enviar midia para ${def.label}`);

    const content = document.createElement("div");
    content.className = "dropzone-content";
    content.innerHTML = `
      <strong>Arraste e solte o arquivo</strong>
      <span>ou clique para selecionar</span>
    `;

    const meta = document.createElement("div");
    meta.className = "dropzone-meta";
    meta.textContent = urlInput.value ? "Arquivo configurado." : "Nenhum arquivo selecionado";

    dropzone.appendChild(content);
    dropzone.appendChild(meta);
    field.appendChild(dropzone);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = area === "fotografia" ? "image/*" : "video/mp4";
    fileInput.className = "admin-card-media-file";
    fileInput.hidden = true;
    field.appendChild(fileInput);

    const pickFile = () => fileInput.click();

    const handleFile = async (file) => {
      if (!file) return;
      meta.textContent = `Enviando: ${file.name}...`;
      dropzone.classList.remove("is-drag");

      const formData = new FormData();
      formData.append("area", area);
      formData.append("card_id", cardId);
      formData.append("file", file);

      const result = await uploadSiteCardMedia(formData);
      if (!result.ok) {
        meta.textContent = result.data.message || "Nao foi possivel enviar.";
        return;
      }

      const mediaUrl = String(result.data.media_url || "").trim();
      if (!mediaUrl) {
        meta.textContent = "Upload concluido, mas sem URL.";
        return;
      }

      urlInput.value = mediaUrl;
      meta.textContent = "Upload concluido. Salve as alteracoes.";
      updatePreview(previewMedia, area, mediaUrl);
    };

    dropzone.addEventListener("click", pickFile);
    dropzone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pickFile();
      }
    });

    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("is-drag");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("is-drag");
    });

    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-drag");
      const dropped = Array.from(event.dataTransfer.files || []);
      handleFile(dropped[0]);
    });

    fileInput.addEventListener("change", (event) => {
      const file = (event.target.files || [])[0];
      handleFile(file);
    });

    return { field, urlInput };
  };

  const render = () => {
    const area = areaSelect.value || "fotografia";
    const defs = CARD_DEFS[area] || [];
    const byKey = new Map();
    cardsCache.forEach((card) => {
      if (!card || !card.area || !card.card_id) return;
      byKey.set(`${card.area}:${card.card_id}`, card);
    });

    grid.innerHTML = "";

    defs.forEach((def) => {
      const item = document.createElement("div");
      item.className = "admin-cardlabels-item";
      item.dataset.area = area;
      item.dataset.cardId = def.card_id;

      const header = document.createElement("div");
      header.className = "admin-cardlabels-item-header";
      header.textContent = def.label;
      item.appendChild(header);

      const fields = document.createElement("div");
      fields.className = "admin-cardlabels-fields";

      const saved = byKey.get(`${area}:${def.card_id}`) || {};
      const titleValue = saved.title || def.defaultTitle || "";
      const subtitleValue =
        saved.subtitle != null
          ? saved.subtitle
          : def.defaultSubtitle != null
            ? def.defaultSubtitle
            : "";
      const mediaValue = resolveMediaValue(saved.media_url, def.defaultMedia);

      const previewWrap = document.createElement("div");
      previewWrap.className = "admin-cardlabels-preview";

      let previewMedia = null;
      if (area === "fotografia") {
        previewMedia = document.createElement("img");
        previewMedia.alt = def.label;
        previewMedia.loading = "lazy";
        previewMedia.decoding = "async";
      } else {
        previewMedia = document.createElement("video");
        previewMedia.muted = true;
        previewMedia.defaultMuted = true;
        previewMedia.setAttribute("muted", "");
        previewMedia.autoplay = true;
        previewMedia.loop = true;
        previewMedia.setAttribute("playsinline", "");
        previewMedia.setAttribute("webkit-playsinline", "");
        previewMedia.preload = "metadata";
        const source = document.createElement("source");
        source.type = "video/mp4";
        previewMedia.appendChild(source);
      }

      if (previewMedia) {
        previewMedia.className = "admin-cardlabels-preview-media";
        previewWrap.appendChild(previewMedia);
        item.appendChild(previewWrap);
        updatePreview(previewMedia, area, mediaValue);
      }

      const { field: titleField, input: titleInput } = buildField("Titulo");
      titleInput.className = "admin-card-title";
      titleInput.maxLength = 80;
      titleInput.value = titleValue;
      titleInput.required = true;
      fields.appendChild(titleField);

      const { field: subtitleField, input: subtitleInput } = buildField("Subtitulo");
      subtitleInput.className = "admin-card-subtitle";
      subtitleInput.maxLength = 120;
      subtitleInput.value = subtitleValue || "";
      if (!def.subtitleEnabled) {
        subtitleInput.disabled = true;
        subtitleInput.placeholder = "Nao usado nesta area";
      } else {
        subtitleInput.placeholder = "Opcional";
      }
      fields.appendChild(subtitleField);

      item.appendChild(fields);

      const mediaUpload = buildMediaUploader({
        area,
        cardId: def.card_id,
        def,
        saved,
        previewMedia
      });
      if (mediaUpload?.field) {
        item.appendChild(mediaUpload.field);
      }

      grid.appendChild(item);
    });
  };

  const loadCards = async () => {
    setStatus("Carregando configuracoes...");
    cardsCache = await fetchSiteCards();
    render();
    setStatus("");
  };

  areaSelect.addEventListener("change", () => {
    render();
  });

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadCards();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const area = areaSelect.value || "fotografia";
    const defs = CARD_DEFS[area] || [];
    if (!defs.length) return;

    setStatus("Salvando...");

    for (const def of defs) {
      const row = grid.querySelector(
        `.admin-cardlabels-item[data-area="${area}"][data-card-id="${def.card_id}"]`
      );
      if (!row) continue;
      const titleInput = row.querySelector(".admin-card-title");
      const subtitleInput = row.querySelector(".admin-card-subtitle");
      const mediaInput = row.querySelector(".admin-card-media");
      const title = titleInput ? String(titleInput.value || "").trim() : "";
      const subtitle = subtitleInput ? String(subtitleInput.value || "").trim() : "";
      const mediaUrl = mediaInput ? String(mediaInput.value || "").trim() : "";

      if (!title) {
        setStatus("Preencha todos os titulos antes de salvar.");
        return;
      }

      const payload = {
        area,
        card_id: def.card_id,
        title,
        subtitle: def.subtitleEnabled ? (subtitle || null) : null,
        media_url: mediaUrl || null
      };

      const result = await saveSiteCard(payload);
      if (!result.ok) {
        setStatus(result.data.message || "Nao foi possivel salvar.");
        return;
      }
    }

    setStatus("Salvo com sucesso.");
    await loadCards();
  });

  loadCards();
}

function initAdminUsers() {
  const section = document.getElementById("adminUsersSection");
  const form = document.getElementById("adminUsersForm");
  const emailInput = document.getElementById("adminUsersEmail");
  const roleSelect = document.getElementById("adminUsersRole");
  const status = document.getElementById("adminUsersStatus");

  if (!section || !form || !emailInput || !roleSelect) return;
  section.hidden = false;

  const setStatus = (message) => {
    if (status) status.textContent = message || "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const email = String(emailInput.value || "").trim().toLowerCase();
    const role = String(roleSelect.value || "").trim().toLowerCase();
    if (!email) {
      setStatus("Informe o email do usuario.");
      return;
    }

    setStatus("Salvando permissao...");
    const result = await updateUserRole({ email, role });
    if (!result.ok) {
      setStatus(result.data.message || "Nao foi possivel salvar.");
      return;
    }

    setStatus("Permissao atualizada.");
    emailInput.value = "";
  });
}

function initAdminGallery() {
  const adminSection = document.getElementById("adminGallerySection");
  const adminAlbumSelect = document.getElementById("adminAlbum");
  const adminGrid = document.getElementById("adminGalleryGrid");
  const adminStatus = document.getElementById("adminGalleryStatus");
  const adminRefreshBtn = document.getElementById("adminRefreshBtn");

  if (!adminSection || !adminAlbumSelect || !adminGrid) return;
  adminSection.hidden = false;

  let currentAlbumId = "";

  const setStatus = (message) => {
    if (adminStatus) adminStatus.textContent = message || "";
  };

  const renderAssets = (assets) => {
    if (!adminGrid) return;
    if (!assets.length) {
      adminGrid.innerHTML = "<p class=\"admin-gallery-empty\">Nenhuma foto nesta galeria.</p>";
      return;
    }

    adminGrid.innerHTML = assets
      .map((asset) => {
        const safeName = asset.filename || "foto";
        return `
          <article class="admin-gallery-card" data-id="${asset.id}">
            <img src="${asset.url}" alt="${safeName}">
            <div class="admin-gallery-meta">
              <span title="${safeName}">${safeName}</span>
              <button class="admin-gallery-delete" type="button" data-id="${asset.id}">Remover</button>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const loadAssets = async () => {
    if (!currentAlbumId) {
      renderAssets([]);
      setStatus("Selecione uma galeria para visualizar.");
      return;
    }

    setStatus("Carregando fotos...");
    const response = await fetch(`${API_BASE}/albums/${currentAlbumId}/assets`, {
      credentials: "include"
    });
    if (!response.ok) {
      setStatus("Nao foi possivel carregar as fotos.");
      return;
    }
    const data = await response.json().catch(() => ({}));
    renderAssets(data.assets || []);
    setStatus("");
  };

  adminAlbumSelect.addEventListener("change", () => {
    currentAlbumId = adminAlbumSelect.value;
    loadAssets();
  });

  if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener("click", () => {
      loadAssets();
    });
  }

  adminGrid.addEventListener("click", async (event) => {
    const button = event.target.closest(".admin-gallery-delete");
    if (!button) return;
    if (!currentAlbumId) return;
    const assetId = button.dataset.id;
    if (!assetId) return;

    const confirmDelete = window.confirm("Deseja remover esta foto da galeria?");
    if (!confirmDelete) return;

    button.disabled = true;
    setStatus("Removendo foto...");
    const response = await fetch(`${API_BASE}/albums/${currentAlbumId}/assets/${assetId}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok) {
      button.disabled = false;
      setStatus("Nao foi possivel remover a foto.");
      return;
    }

    const card = button.closest(".admin-gallery-card");
    if (card) card.remove();
    setStatus("Foto removida.");
  });

  getAlbums()
    .then(populateAdminAlbumSelect)
    .catch(() => populateAdminAlbumSelect([]));
}
