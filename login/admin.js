const API_BASE = "/api";

function getToken() {
  return sessionStorage.getItem("adminToken") || "";
}

function setToken(value) {
  sessionStorage.setItem("adminToken", value);
}

function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#ff8a8a" : "#8bd3ff";
}

async function postAdmin(path, payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Token admin nao informado.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Erro ao salvar.");
  }
  return data;
}

const tokenForm = document.getElementById("tokenForm");
if (tokenForm) {
  tokenForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const token = document.getElementById("admin-token").value.trim();
    if (!token) {
      setStatus("tokenStatus", "Informe o token.", true);
      return;
    }
    setToken(token);
    setStatus("tokenStatus", "Token salvo com sucesso.");
  });
}

const createUserForm = document.getElementById("createUserForm");
if (createUserForm) {
  createUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("userStatus", "");
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value.trim();
    const role = document.getElementById("user-role").value;

    try {
      await postAdmin("/admin/users", { email, password, role });
      setStatus("userStatus", "Usuario criado com sucesso.");
      createUserForm.reset();
    } catch (err) {
      setStatus("userStatus", err.message, true);
    }
  });
}

const createCardForm = document.getElementById("createCardForm");
if (createCardForm) {
  createCardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("cardStatus", "");
    const payload = {
      email: document.getElementById("card-email").value.trim(),
      title: document.getElementById("card-title").value.trim(),
      meta: document.getElementById("card-meta").value.trim(),
      body: document.getElementById("card-body").value.trim(),
      action_label: document.getElementById("card-action-label").value.trim(),
      action_url: document.getElementById("card-action-url").value.trim()
    };

    try {
      await postAdmin("/admin/cards", payload);
      setStatus("cardStatus", "Card salvo com sucesso.");
      createCardForm.reset();
    } catch (err) {
      setStatus("cardStatus", err.message, true);
    }
  });
}

const createFileForm = document.getElementById("createFileForm");
if (createFileForm) {
  createFileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("fileStatus", "");
    const payload = {
      email: document.getElementById("file-email").value.trim(),
      name: document.getElementById("file-name").value.trim(),
      status: document.getElementById("file-status").value.trim(),
      date_label: document.getElementById("file-date").value.trim()
    };

    try {
      await postAdmin("/admin/files", payload);
      setStatus("fileStatus", "Arquivo salvo com sucesso.");
      createFileForm.reset();
    } catch (err) {
      setStatus("fileStatus", err.message, true);
    }
  });
}

const createPackForm = document.getElementById("createPackForm");
if (createPackForm) {
  createPackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("packStatus", "");
    const payload = {
      email: document.getElementById("pack-email").value.trim(),
      title: document.getElementById("pack-title").value.trim(),
      url: document.getElementById("pack-url").value.trim()
    };

    try {
      await postAdmin("/admin/packs", payload);
      setStatus("packStatus", "Pack salvo com sucesso.");
      createPackForm.reset();
    } catch (err) {
      setStatus("packStatus", err.message, true);
    }
  });
}
