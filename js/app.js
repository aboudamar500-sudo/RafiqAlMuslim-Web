const $ = id => document.getElementById(id);

const savedTheme = localStorage.getItem("rafiq-theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");

$("themeToggle").addEventListener("click", () => {
  const dark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("rafiq-theme", dark ? "dark" : "light");
  $("themeToggle").textContent = dark ? "☀" : "☾";
});
$("themeToggle").textContent =
  document.documentElement.classList.contains("dark") ? "☀" : "☾";

const prayerNames = [
  ["الفجر", "Fajr"], ["الشروق", "Sunrise"], ["الظهر", "Dhuhr"],
  ["العصر", "Asr"], ["المغرب", "Maghrib"], ["العشاء", "Isha"]
];
let prayerTimes = [];

function formatTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour < 12 ? "ص" : "م";
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2,"0")} ${period}`;
}

function renderPrayers(timings) {
  prayerTimes = prayerNames.map(([name,key]) => ({
    name, time: timings[key].split(" ")[0]
  }));
  $("prayerList").innerHTML = prayerTimes.map(p =>
    `<div class="prayer-row"><strong>${formatTime(p.time)}</strong><span>${p.name}</span></div>`
  ).join("");
  updateNextPrayer();
  saveCurrentPrayer();
}

function saveCurrentPrayer() {
  if (!prayerTimes.length) return;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  let name = "العشاء";

  for (const prayer of prayerTimes) {
    if (prayer.name === "الشروق") continue;
    const [h, m] = prayer.time.split(":").map(Number);
    if (current >= h * 60 + m) name = prayer.name;
  }

  localStorage.setItem("rafiq-current-prayer", name);
}

function updateNextPrayer() {
  if (!prayerTimes.length) return;
  const now = new Date();
  const current = now.getHours()*60 + now.getMinutes();
  let next = prayerTimes.find(p => {
    const [h,m] = p.time.split(":").map(Number);
    return h*60+m > current;
  });
  let target = new Date(now);
  if (!next) {
    next = prayerTimes[0];
    target.setDate(target.getDate()+1);
  }
  const [h,m] = next.time.split(":").map(Number);
  target.setHours(h,m,0,0);
  $("nextPrayer").textContent = next.name;
  const diff = Math.max(0,target-now);
  const hours = Math.floor(diff/3600000);
  const minutes = Math.floor(diff%3600000/60000);
  const seconds = Math.floor(diff%60000/1000);
  $("remaining").textContent =
    `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}
setInterval(() => { updateNextPrayer(); saveCurrentPrayer(); },1000);

$("locationButton").addEventListener("click", () => {
  if (!navigator.geolocation) {
    $("locationStatus").textContent = "المتصفح لا يدعم تحديد الموقع.";
    return;
  }
  $("locationStatus").textContent = "جارٍ تحديد موقعك...";
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const {latitude,longitude} = position.coords;
      const date = new Date();
      const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const url = `https://api.aladhan.com/v1/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=4&school=0&timezonestring=${encodeURIComponent(timezone)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("تعذر الاتصال بالخدمة");
      const result = await response.json();
      if (result.code !== 200) throw new Error("لم تصل بيانات المواقيت");
      renderPrayers(result.data.timings);
      $("locationStatus").textContent = "تم تحديث مواقيت الصلاة لموقعك.";
    } catch (error) {
      $("locationStatus").textContent = "تعذر جلب المواقيت: " + error.message;
    }
  }, error => {
    $("locationStatus").textContent =
      error.code === 1 ? "لم تسمح بالوصول إلى الموقع." : "تعذر تحديد الموقع.";
  }, {enableHighAccuracy:true,timeout:15000});
});

/* تشغيل قارئ المصحف */
(() => {
  const reader = $("quranReader");
  if (!reader || typeof QuranMushaf === "undefined") return;

  let currentPage = 1;
  let previousPage = "home";

  const title = $("quranSurahTitle");
  const label = $("quranPageLabel");
  const container = $("quranPageContainer");

  async function renderQuranPage(number) {
    container.innerHTML = '<div class="quran-loading">جارٍ تحميل الصفحة...</div>';

    try {
      const page = await QuranMushaf.loadPage(number);
      currentPage = page.number;
      label.textContent = `صفحة ${currentPage} من 604`;

      const paper = document.createElement("div");
      paper.className = "quran-paper";

      const ornament = document.createElement("div");
      ornament.className = "quran-ornament";
      ornament.textContent = "۞     الْقُرْآنُ الْكَرِيمُ     ۞";
      paper.appendChild(ornament);

      const lines = document.createElement("div");
      lines.className = "quran-lines";

      for (const line of page.lines) {
        const element = document.createElement("div");
        element.className = "quran-line";
        if (line.isSurahHeader) element.classList.add("surah-header");
        element.textContent = line.text;
        lines.appendChild(element);
      }

      paper.appendChild(lines);

      const footer = document.createElement("div");
      footer.className = "quran-footer";
      footer.textContent = `—  ${toArabicPageNumber(currentPage)}  —`;
      paper.appendChild(footer);

      container.replaceChildren(paper);
      title.textContent = "القرآن الكريم";
    } catch (error) {
      container.innerHTML = "";
      const message = document.createElement("div");
      message.className = "quran-loading";
      message.textContent = "تعذر تحميل المصحف: " + error.message;
      container.appendChild(message);
    }
  }

  function toArabicPageNumber(number) {
    return String(number).replace(/\d/g, n => "٠١٢٣٤٥٦٧٨٩"[Number(n)]);
  }


  const indexBox = $("quranSurahIndex");
  const surahList = $("quranSurahList");
  const searchBox = $("quranSurahSearch");
  let surahs = [];

  async function loadSurahIndex() {
    if (surahs.length) return;
    const response = await fetch("assets/mushaf/surahs.json");
    if (!response.ok) throw new Error("تعذر تحميل فهرس السور");
    const data = await response.json();
    surahs = Object.entries(data).map(([number, name]) => ({
      number: Number(number), name
    })).sort((a,b) => a.number-b.number);
    renderSurahIndex("");
  }

  function renderSurahIndex(query) {
    const filtered = surahs.filter(s => s.name.includes(query.trim()));
    surahList.replaceChildren();
    filtered.forEach(s => {
      const button = document.createElement("button");
      button.className = "quran-surah-item";
      button.textContent = `${s.number}. ${s.name}`;
      button.addEventListener("click", async () => {
        title.textContent = s.name;
        indexBox.hidden = true;
        container.hidden = false;
        $("quranPrevious").hidden = false;
        $("quranNext").hidden = false;
        await renderQuranPage(await QuranMushaf.pageForSurah(s.number));
      });
      surahList.appendChild(button);
    });
    if (!filtered.length) surahList.textContent = "لا توجد سورة بهذا الاسم";
  }

  searchBox.addEventListener("input", () => renderSurahIndex(searchBox.value));

  async function openQuran() {
    previousPage = "home";
    document.querySelector("main.container").hidden = true;
    reader.hidden = false;
    document.querySelector(".bottom-nav").hidden = true;
    indexBox.hidden = false;
    container.hidden = true;
    $("quranPrevious").hidden = true;
    $("quranNext").hidden = true;
    searchBox.value = "";
    await loadSurahIndex();
  }

  function closeQuran() {
    reader.hidden = true;
    document.querySelector("main.container").hidden = false;
    document.querySelector(".bottom-nav").hidden = false;
    document.querySelectorAll(".bottom-nav button").forEach(button => {
      button.classList.toggle("active", button.dataset.page === previousPage);
    });
  }

  $("quranBack").addEventListener("click", closeQuran);
  $("quranPrevious").addEventListener("click", () => {
    if (currentPage > 1) renderQuranPage(currentPage - 1);
  });
  $("quranNext").addEventListener("click", () => {
    if (currentPage < 604) renderQuranPage(currentPage + 1);
  });

  document.querySelectorAll('[data-page="quran"]').forEach(button => {
    button.addEventListener("click", openQuran);
  });
})();
