const API_BASE = "/api";

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
    return;
  }

  const data = await response.json();
  setUserEmail(data.email);
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
  fetchMe()
    .then(fetchDashboard)
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

    fetchAlbums()
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
