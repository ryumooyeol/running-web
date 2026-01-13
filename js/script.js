const toggleBtn = document.getElementById("toggleBtn");
const stopBtn = document.getElementById("stopBtn");
const timeDisplay = document.getElementById("timeDisplay");
const distanceDisplay = document.getElementById("distanceDisplay");

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

// GPS
let watchId = null;
let lastLatLng = null;
let totalDistance = 0;

// 지도
let map = null;
let polyline = null;

// 거리 계산 (km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 시간 포맷
function formatTime(ms) {
  const sec = ms / 1000;
  const min = Math.floor(sec / 60);
  const remain = (sec % 60).toFixed(2);

  return `${String(min).padStart(2, "0")}:${String(remain).padStart(5, "0")}`;
}

// 시작 / 일시정지
toggleBtn.addEventListener("click", () => {
  if (!isRunning) {
    isRunning = true;
    toggleBtn.innerText = "⏸ 일시정지";

    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timeDisplay.innerText = "⏱ " + formatTime(elapsedTime);
    }, 10);

    startGPS();
  } else {
    isRunning = false;
    toggleBtn.innerText = "🚀 러닝 시작";
    clearInterval(timerInterval);
    stopGPS();
  }
});

// 러닝 종료
stopBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  stopGPS();

  isRunning = false;
  elapsedTime = 0;
  totalDistance = 0;
  lastLatLng = null;

  timeDisplay.innerText = "⏱ 00:00.00";
  distanceDisplay.innerText = "📍 거리: 0.00 km";
  toggleBtn.innerText = "🚀 러닝 시작";

  if (polyline) polyline.setLatLngs([]);
});

// GPS 시작
function startGPS() {
  if (!navigator.geolocation) {
    alert("GPS를 지원하지 않습니다.");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const current = [lat, lng];

      if (!map) {
        map = L.map("map").setView(current, 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
        }).addTo(map);

        polyline = L.polyline([], { color: "red" }).addTo(map);
      }

      polyline.addLatLng(current);
      map.setView(current);

      if (lastLatLng) {
        totalDistance += getDistance(
          lastLatLng[0],
          lastLatLng[1],
          lat,
          lng
        );
        distanceDisplay.innerText =
          "📍 거리: " + totalDistance.toFixed(2) + " km";
      }

      lastLatLng = current;
    },
    (err) => alert("GPS 오류: " + err.message),
    { enableHighAccuracy: true }
  );
}

// GPS 종료
function stopGPS() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
