const Duas = (() => {
  const $ = id => document.getElementById(id);
  let categories = [];

  async function load() {
    const response = await fetch("assets/duas.json");
    if (!response.ok) throw new Error("تعذر تحميل الأدعية");
    categories = await response.json();
    renderCategories();
  }

  function renderCategories() {
    const container = $("duasCategories");
    container.replaceChildren();

    categories.forEach((category, index) => {
      const button = document.createElement("button");
      button.className = "duas-category";

      const icon = document.createElement("span");
      icon.className = "icon";
      icon.textContent = category.icon;

      const name = document.createElement("span");
      name.textContent = category.title;

      button.append(icon, name);
      button.addEventListener("click", () => openCategory(index));
      container.appendChild(button);
    });
  }

  function openCategory(index) {
    const category = categories[index];
    $("duasCategories").hidden = true;
    $("duasContent").hidden = false;
    $("duasContent").replaceChildren();

    category.items.forEach(dua => {
      const card = document.createElement("article");
      card.className = "dua-item";

      const text = document.createElement("p");
      text.className = "dua-text";
      text.textContent = dua.text;

      const source = document.createElement("div");
      source.className = "dua-source";
      source.textContent = "المصدر: " + dua.source;

      card.append(text, source);
      $("duasContent").appendChild(card);
    });
  }

  function back() {
    if (!$("duasContent").hidden) {
      $("duasContent").hidden = true;
      $("duasCategories").hidden = false;
    } else {
      close();
    }
  }

  function close() {
    $("duasPage").hidden = true;
    document.querySelector("main.container").hidden = false;
    document.querySelector(".bottom-nav").hidden = false;
  }

  async function open() {
    document.querySelector("main.container").hidden = true;
    document.querySelector(".bottom-nav").hidden = true;
    $("duasPage").hidden = false;
    $("duasCategories").hidden = false;
    $("duasContent").hidden = true;

    if (!categories.length) {
      try {
        await load();
      } catch (error) {
        $("duasCategories").textContent = error.message;
      }
    }
  }

  function init() {
    $("duasBack").addEventListener("click", back);
    document.querySelectorAll('[data-page="duas"]').forEach(button => {
      button.addEventListener("click", open);
    });
  }

  return {init, open};
})();

Duas.init();
