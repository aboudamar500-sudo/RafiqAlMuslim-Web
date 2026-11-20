const Tasbeeh = (() => {
  const $ = id => document.getElementById(id);

  const common = [
    {text:"أستغفر الله",count:3},
    {text:"اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام",count:1},
    {text:"سبحان الله",count:33},
    {text:"الحمد لله",count:33},
    {text:"الله أكبر",count:33},
    {text:"لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",count:1}
  ];

  const extra = [
    {text:"قل هو الله أحد",count:3},
    {text:"قل أعوذ برب الفلق",count:3},
    {text:"قل أعوذ برب الناس",count:3}
  ];

  let mode = "";
  let prayerItems = [];
  let prayerIndex = 0;
  let prayerCount = 0;
  let openCount = 0;

  try {
    openCount = Number(localStorage.getItem("rafiq-open-tasbeeh")) || 0;
  } catch {}

  function showHome() {
    $("tasbeehHome").hidden = false;
    $("tasbeehCounter").hidden = true;
    mode = "";
  }

  function startOpen() {
    mode = "open";
    $("tasbeehHome").hidden = true;
    $("tasbeehCounter").hidden = false;
    $("tasbeehTitle").textContent = "📿 تسبيح مفتوح";
    $("tasbeehProgress").textContent = "";
    $("tasbeehText").textContent = "سبّح واستغفر الله";
    $("tasbeehNumber").textContent = openCount;
    $("tasbeehTap").textContent = "سبّح";
  }

  function startPrayer() {
    const prayer = localStorage.getItem("rafiq-current-prayer") || "";
    if (!prayer) {
      $("tasbeehTitle").textContent = "افتح الصفحة الرئيسية أولاً لتحديث مواقيت الصلاة";
      $("tasbeehProgress").textContent = "";
      $("tasbeehText").textContent = "";
      $("tasbeehNumber").textContent = "";
      $("tasbeehHome").hidden = true;
      $("tasbeehCounter").hidden = false;
      mode = "notice";
      $("tasbeehTap").hidden = true;
      $("tasbeehReset").hidden = true;
      return;
    }

    prayerItems = prayer === "الفجر" || prayer === "المغرب"
      ? common.concat(extra)
      : common.slice();

    prayerIndex = 0;
    prayerCount = 0;
    mode = "prayer";
    $("tasbeehHome").hidden = true;
    $("tasbeehCounter").hidden = false;
    $("tasbeehTap").hidden = false;
    $("tasbeehReset").hidden = true;
    renderPrayer();
  }

  function renderPrayer() {
    const item = prayerItems[prayerIndex];
    $("tasbeehTitle").textContent = `🕌 أذكار بعد صلاة ${localStorage.getItem("rafiq-current-prayer")}`;
    $("tasbeehProgress").textContent =
      `الذكر ${prayerIndex + 1} من ${prayerItems.length}\n${prayerCount} / ${item.count}`;
    $("tasbeehText").textContent = item.text;
    $("tasbeehNumber").textContent = prayerCount;
    $("tasbeehTap").textContent = "📿 تسبيح";
  }

  function completePrayer() {
    mode = "complete";
    $("tasbeehTitle").textContent = "تقبل الله طاعاتكم";
    $("tasbeehProgress").textContent = "";
    $("tasbeehText").textContent = "أتممت أذكار ما بعد الصلاة";
    $("tasbeehNumber").textContent = "✓";
    $("tasbeehTap").hidden = true;
    $("tasbeehReset").hidden = true;
  }

  function tap() {
    if (mode === "open") {
      openCount++;
      $("tasbeehNumber").textContent = openCount;
      try {
        localStorage.setItem("rafiq-open-tasbeeh", String(openCount));
      } catch {}
      return;
    }

    if (mode === "prayer") {
      prayerCount++;
      const item = prayerItems[prayerIndex];

      if (prayerCount >= item.count) {
        prayerIndex++;
        prayerCount = 0;

        if (prayerIndex >= prayerItems.length) {
          completePrayer();
          return;
        }
      }
      renderPrayer();
    }
  }

  function back() {
    if (mode === "prayer" || mode === "complete" || mode === "notice") {
      showHome();
      $("tasbeehTap").hidden = false;
      $("tasbeehReset").hidden = false;
    } else if (mode === "open") {
      showHome();
    } else {
      close();
    }
  }

  function close() {
    $("tasbeehPage").hidden = true;
    document.querySelector("main.container").hidden = false;
    document.querySelector(".bottom-nav").hidden = false;
    showHome();
    $("tasbeehTap").hidden = false;
    $("tasbeehReset").hidden = false;
  }

  function open() {
    $("tasbeehPage").hidden = false;
    showHome();
  }

  function init() {
    $("tasbeehBack").addEventListener("click", back);
    $("tasbeehExit").addEventListener("click", () => {
      if (mode === "open") openCount = 0;
      try {
        localStorage.setItem("rafiq-open-tasbeeh", String(openCount));
      } catch {}
      close();
    });
    $("tasbeehTap").addEventListener("click", tap);
    $("tasbeehReset").addEventListener("click", () => {
      openCount = 0;
      $("tasbeehNumber").textContent = "0";
      try {
        localStorage.setItem("rafiq-open-tasbeeh", "0");
      } catch {}
    });

    document.querySelectorAll('[data-page="tasbeeh"]').forEach(button => {
      button.addEventListener("click", open);
    });

    document.querySelectorAll('[data-mode="open"]').forEach(button => {
      button.addEventListener("click", startOpen);
    });


    document.querySelectorAll('[data-mode="prayer"]').forEach(button => {
      button.addEventListener("click", startPrayer);
    });
  }

  return {init, open};
})();

Tasbeeh.init();
