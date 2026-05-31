// 通过 withGlobalTauri 暴露的全局对象访问 Tauri API（无需打包器）
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
  if (s.engaged) txt = "已保活 · 系统不会睡眠";
  else if (s.desired && s.ac_only && s.on_ac === false) txt = "已暂停（当前使用电池）";
  else if (s.desired) txt = "正在启用…";
  else txt = "未启用";
  els.stateText.textContent = txt;

  if (s.on_ac === true) els.powerText.textContent = "🔌 已接通电源";
  else if (s.on_ac === false) els.powerText.textContent = "🔋 使用电池";
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

// 后台 monitor 状态变化时实时刷新
listen("status-changed", (e) => render(e.payload));

(async () => {
  render(await invoke("get_status"));
  const report = await invoke("system_report");
  if (report && report.note) {
    els.warn.hidden = false;
    els.warn.textContent = "⚠ " + report.note;
  }
})();
