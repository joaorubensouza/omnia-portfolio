const form = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");

const API_BASE = "/api";

function showError(message) {
  if (!errorBox) return;
  errorBox.textContent = message;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");

    const identifier = form.querySelector("#login-email").value.trim();
    const password = form.querySelector("#login-password").value;
    const remember = form.querySelector("input[name=\"remember\"]").checked;

    if (!identifier || !password) {
      showError("Preencha o usuario/e-mail e a senha.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: identifier.toLowerCase(), password, remember })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        showError(payload.message || "Usuario/e-mail ou senha invalidos.");
        return;
      }

      window.location.href = "dashboard.html";
    } catch (err) {
      showError("Nao foi possivel conectar. Tente novamente.");
    }
  });
}

async function checkSession() {
  try {
    const response = await fetch(`${API_BASE}/me`, { credentials: "include" });
    if (response.ok) {
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    return;
  }
}

checkSession();
