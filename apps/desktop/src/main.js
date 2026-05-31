// Access the Tauri API through the global object exposed by withGlobalTauri (no bundler needed)
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const els = {
  card: document.getElementById("card"),
  switch: document.getElementById("switch"),
  stateText: document.getElementById("stateText"),
  acOnly: document.getElementById("acOnly"),
  powerText: document.getElementById("powerText"),
  warn: document.getElementById("warn"),
  platformText: document.getElementById("platformText"),
};

function render(s) {
  els.switch.classList.toggle("on", s.desired);
  els.switch.setAttribute("aria-checked", String(s.desired));
  els.acOnly.checked = s.ac_only;
  els.card.classList.toggle("active", s.engaged);

  let txt;
  if (s.engaged) txt = "Active · system won't sleep";
  else if (s.desired && s.ac_only && s.on_ac === false) txt = "Paused (on battery)";
  else if (s.desired) txt = "Turning on…";
  else txt = "Off";
  els.stateText.textContent = txt;

  if (s.on_ac === true) els.powerText.textContent = "🔌 Plugged in";
  else if (s.on_ac === false) els.powerText.textContent = "🔋 On battery";
  else els.powerText.textContent = "";

  const names = { windows: "Windows", macos: "macOS" };
  els.platformText.textContent = names[s.platform] || s.platform;
}

els.switch.addEventListener("click", async () => {
  const next = !els.switch.classList.contains("on");
  render(await invoke("set_desired", { desired: next }));
});

els.acOnly.addEventListener("change", async () => {
  render(await invoke("set_ac_only", { acOnly: els.acOnly.checked }));
});

// Refresh live whenever the background monitor's status changes
listen("status-changed", (e) => render(e.payload));

(async () => {
  render(await invoke("get_status"));
  const report = await invoke("system_report");
  if (report && report.note) {
    els.warn.hidden = false;
    els.warn.textContent = "⚠ " + report.note;
  }
})();
