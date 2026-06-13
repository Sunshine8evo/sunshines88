/*
 * Sync dashboard light/dark theme into embedded legacy iframes.
 * Parent and iframe share origin → localStorage + postMessage both work.
 */
(function () {
  if (!document.documentElement.classList.contains("embed-mode")) return;

  var KEY = "sunshine-dashboard-theme";

  function applyTheme(theme) {
    var dark = theme === "dark";
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  try {
    applyTheme(localStorage.getItem(KEY) || "light");
  } catch (e) {}

  window.addEventListener("storage", function (ev) {
    if (ev.key === KEY) applyTheme(ev.newValue || "light");
  });

  window.addEventListener("message", function (ev) {
    if (ev.origin !== window.location.origin) return;
    var data = ev.data;
    if (data && data.type === "sunshine-set-theme") {
      applyTheme(data.theme === "dark" ? "dark" : "light");
    }
  });
})();
