const QuranMushaf = (() => {
  const cache = new Map();
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  function toArabicDigits(value) {
    return String(value).replace(/\d/g, n => arabicDigits[Number(n)]);
  }

  async function loadPage(pageNumber) {
    const page = Math.max(1, Math.min(604, Number(pageNumber) || 1));
    if (cache.has(page)) return cache.get(page);

    const file = `assets/mushaf/pages/${String(page).padStart(3, "0")}.json.gz`;
    const response = await fetch(file);
    if (!response.ok) throw new Error("تعذر تحميل صفحة المصحف");

    const compressed = await response.arrayBuffer();
    if (!("DecompressionStream" in window)) {
      throw new Error("المتصفح لا يدعم فك ضغط ملفات المصحف");
    }

    const stream = new Blob([compressed]).stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const data = await new Response(stream).json();

    const lines = data.lines.map(line => {
      const parts = [];
      let isHeader = false;

      for (const word of line.words) {
        const value = word.text || "";

        switch (word.type) {
          case "surah_header":
            if (value.trim()) parts.push(value);
            isHeader = true;
            break;
          case "bismillah":
          case "word":
            if (value.trim()) parts.push(value);
            break;
          case "end": {
            const number = Number(value.replace(/^V/, ""));
            if (Number.isFinite(number)) {
              parts.push(`﴿${toArabicDigits(number)}﴾`);
            }
            break;
          }
        }
      }

      return {
        number: line.line,
        text: parts.join(" "),
        isSurahHeader: isHeader
      };
    });

    const result = { number: page, lines };
    cache.set(page, result);
    return result;
  }

  async function pageForSurah(surahNumber) {
    const response = await fetch("assets/mushaf/verse-pages.json");
    if (!response.ok) throw new Error("تعذر تحميل فهرس المصحف");

    const index = await response.json();
    const value = index[`${surahNumber}:1`];
    const page = typeof value === "number" ? value : Number(value?.page);
    return Math.max(1, Math.min(604, page || 1));
  }

  return { loadPage, pageForSurah };
})();
