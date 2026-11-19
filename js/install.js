const button = document.getElementById("install-app"),
  help = document.getElementById("install-help");
let prompt;
const standalone = matchMedia("(display-mode: standalone)");
function installed() {
  button.hidden = true;
  help.textContent =
    "ColetaJá aberto como aplicativo. O mapa precisa de internet.";
}
if (standalone.matches || navigator.standalone) installed();
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  prompt = event;
  if (!standalone.matches) { button.hidden = false; help.textContent = ""; }
});
button.addEventListener("click", async () => {
  if (!prompt) return;
  const current = prompt;
  prompt = null;
  button.hidden = true;
  try {
    await current.prompt();
    const choice = await current.userChoice;
    help.textContent =
      choice.outcome === "accepted"
        ? "Instalação solicitada. Confira a tela inicial."
        : "Você pode instalar depois pelo menu do navegador.";
  } catch {
    help.textContent =
      "Abra o menu do navegador para adicionar o ColetaJá à tela inicial.";
  }
});
window.addEventListener("appinstalled", installed);

