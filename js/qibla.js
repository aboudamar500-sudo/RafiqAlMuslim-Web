const Qibla = (() => {
  const $ = id => document.getElementById(id);
  const KAABA_LAT = 21.4225;
  const KAABA_LON = 39.8262;
  let bearing = 0;
  let heading = null;

  function calculate(lat, lon) {
    const rad = Math.PI / 180;
    const lat1 = lat * rad;
    const lon1 = lon * rad;
    const lat2 = KAABA_LAT * rad;
    const lon2 = KAABA_LON * rad;
    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2)
      - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (Math.atan2(y, x) / rad + 360) % 360;
  }

  function updateCompass() {
    if (heading === null) return;
    const rotation = bearing - heading;
    $("qiblaNeedle").style.transform =
      `translate(-50%,-50%) rotate(${rotation}deg)`;
  }

  function onOrientation(event) {
    let direction = null;

    if (typeof event.webkitCompassHeading === "number") {
      direction = event.webkitCompassHeading;
    } else if (typeof event.alpha === "number") {
      direction = 360 - event.alpha;
    }

    if (direction === null) return;
    heading = direction;
    updateCompass();
  }

  async function enableCompass() {
    try {
      if (typeof DeviceOrientationEvent === "undefined") {
        $("qiblaStatus").textContent =
          "تم تحديد الموقع، لكن البوصلة غير متاحة";
        return;
      }

      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission =
          await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          $("qiblaStatus").textContent =
            "اسمح باستخدام مستشعر الاتجاه لتشغيل البوصلة";
          return;
        }
      }

      window.addEventListener("deviceorientation", onOrientation, true);
      $("qiblaStatus").textContent =
        "✅ تم تحديد الموقع — حرّك الهاتف لمعايرة البوصلة";
    } catch {
      $("qiblaStatus").textContent =
        "تعذر تشغيل مستشعر الاتجاه";
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      $("qiblaStatus").textContent =
        "المتصفح لا يدعم تحديد الموقع";
      return;
    }

    $("qiblaStatus").textContent = "📡 جاري تحديد موقعك...";
    $("qiblaResult").textContent = "انتظر حتى يتم تحديد موقعك";

    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude, accuracy} = position.coords;
        bearing = calculate(latitude, longitude);

        $("qiblaStatus").textContent = "✅ تم تحديد موقعك";
        $("qiblaResult").textContent =
          `دقة الموقع: ${Math.round(accuracy)} متر\n` +
          `خط العرض: ${latitude.toFixed(5)}\n` +
          `خط الطول: ${longitude.toFixed(5)}\n\n` +
          `🕋 اتجاه القبلة: ${Math.round(bearing)}°`;

        enableCompass();
      },
      error => {
        const messages = {
          1: "لم تسمح بالوصول إلى الموقع",
          2: "تعذر تحديد موقعك",
          3: "انتهت مهلة تحديد الموقع"
        };
        $("qiblaStatus").textContent =
          messages[error.code] || "حدث خطأ أثناء تحديد الموقع";
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 0}
    );
  }

  function close() {
    $("qiblaPage").hidden = true;
    document.querySelector("main.container").hidden = false;
    document.querySelector(".bottom-nav").hidden = false;
  }

  function open() {
    document.querySelector("main.container").hidden = true;
    document.querySelector(".bottom-nav").hidden = true;
    $("qiblaPage").hidden = false;
    locate();
  }

  function init() {
    $("qiblaBack").addEventListener("click", close);
    $("qiblaRetry").addEventListener("click", locate);
    document.querySelectorAll('[data-page="qibla"]').forEach(button => {
      button.addEventListener("click", open);
    });
  }

  return {init, open};
})();

Qibla.init();
