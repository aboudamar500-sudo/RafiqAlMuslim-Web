const Adhkar = (() => {
  const $ = id => document.getElementById(id);
  let categories = [];
  let currentCategory = -1;
  let progress = {};

  function loadProgress() {
    try {
      progress = JSON.parse(localStorage.getItem("rafiq-adhkar-progress") || "{}");
    } catch {
      progress = {};
    }
  }

  function saveProgress() {
    localStorage.setItem("rafiq-adhkar-progress", JSON.stringify(progress));
  }

  async function loadCategories() {
    const response = await fetch("assets/adhkar.json");
    if (!response.ok) throw new Error("تعذر تحميل الأذكار");
    categories = await response.json();
    renderCategories();
  }

  function renderCategories() {
    $("adhkarCategories").replaceChildren();

    categories.forEach((category, index) => {
      const button = document.createElement("button");
      button.className = "adhkar-category";

      const icon = document.createElement("span");
      icon.className = "icon";
      icon.textContent = category.icon;

      const name = document.createElement("span");
      name.textContent = category.title;

      button.append(icon, name);
      button.addEventListener("click", () => openCategory(index));
      $("adhkarCategories").appendChild(button);
    });
  }

  function openCategory(index) {
    currentCategory = index;
    const category = categories[index];
    $("adhkarCategories").hidden = true;
    $("adhkarContent").hidden = false;
    $("adhkarContent").replaceChildren();

    category.items.forEach((item, itemIndex) => {
      const key = `${index}-${itemIndex}`;
      const count = Math.min(Number(progress[key]) || 0, item.count);

      const card = document.createElement("article");
      card.className = "adhkar-item";
      if (count >= item.count) card.classList.add("adhkar-done");

      const text = document.createElement("p");
      text.className = "adhkar-text";
      text.textContent = item.text;

      const controls = document.createElement("div");
      controls.className = "adhkar-progress";

      const status = document.createElement("span");
      status.className = "adhkar-count";

      const button = document.createElement("button");
      button.className = "adhkar-counter";

      function update() {
        const current = Math.min(Number(progress[key]) || 0, item.count);
        status.textContent = `${current} / ${item.count}`;
        button.textContent = current >= item.count ? "اكتمل ✓" : "تسبيح";
        button.disabled = current >= item.count;
        card.classList.toggle("adhkar-done", current >= item.count);
      }

      button.addEventListener("click", () => {
        progress[key] = Math.min((Number(progress[key]) || 0) + 1, item.count);
        saveProgress();
        update();
      });

      controls.append(status, button);
      card.append(text, controls);
      $("adhkarContent").appendChild(card);
      update();
    });
  }

  function back() {
    if (!$("adhkarContent").hidden) {
      $("adhkarContent").hidden = true;
      $("adhkarCategories").hidden = false;
      currentCategory = -1;
    } else {
      close();
    }
  }

  function close() {
    $("adhkarPage").hidden = true;
    document.querySelector("main.container").hidden = false;
    document.querySelector(".bottom-nav").hidden = false;
  }

  async function open() {
    document.querySelector("main.container").hidden = true;
    document.querySelector(".bottom-nav").hidden = true;
    $("adhkarPage").hidden = false;
    $("adhkarCategories").hidden = false;
    $("adhkarContent").hidden = true;

    if (!categories.length) {
      try {
        await loadCategories();
      } catch (error) {
        $("adhkarCategories").textContent = error.message;
      }
    }
  }

  function init() {
    loadProgress();
    $("adhkarBack").addEventListener("click", back);
    document.querySelectorAll('[data-page="adhkar"]').forEach(button => {
      button.addEventListener("click", open);
    });
  }

  return { init, open };
})();

Adhkar.init();
