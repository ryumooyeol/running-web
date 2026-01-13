let running = false;
let startTime = 0;
let timer = null;
let elapsed = 0;

let watchId = null;
let lastPos = null;
let distance = 0;
let lapDistance = 0;
let lapCount = 1;

const timeEl = document.getElementById("time");
const distEl = document.getElementById("distance");
const paceEl = document.getElementById("pace");
const lapsEl = document.getElementById("laps");
const startBtn = document.getElementById("startBtn");

const map = L.map("map").setView([37.5665, 126.9780], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
const path = L.polyline([], { color: "red" }).addTo(map);

function formatTime(ms) {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(2);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(5, "0")}`;
}

function getDistance(p1, p2) {
  const R = 6371e3;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

document.getElementById("startBtn").onclick = () => {
  if (!running) {
    running = true;
    startBtn.innerText = "일시정지";
    startTime = Date.now() - elapsed;

    timer = setInterval(() => {
      elapsed = Date.now() - startTime;
      timeEl.innerText = formatTime(elapsed);

      if (distance > 0) {
        const pace = elapsed / distance / 60;
        paceEl.innerText =
          `${Math.floor(pace)}'${Math.floor((pace % 1) * 60)} /km`;
      }
    }, 100);

    watchId = navigator.geolocation.watchPosition(pos => {
      const current = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      if (lastPos) {
        const d = getDistance(lastPos, current);
        distance += d;
        lapDistance += d;

        if (lapDistance >= 1000) {
          const lapTime = elapsed / lapCount;
          const pace = lapTime / 60000;
          const li = document.createElement("li");
          li.innerText = `Lap ${lapCount} - ${pace.toFixed(2)} min/km`;
          lapsEl.appendChild(li);
          lapCount++;
          lapDistance = 0;
        }
      }

      lastPos = current;
      path.addLatLng(current);
      map.panTo(current);

      distEl.innerText = (distance / 1000).toFixed(2) + " km";
    });
  } else {
    running = false;
    startBtn.innerText = "러닝 시작";
    clearInterval(timer);
    navigator.geolocation.clearWatch(watchId);
  }
};

document.getElementById("stopBtn").onclick = () => {
  localStorage.setItem("lastRun", JSON.stringify({
    time: elapsed,
    distance: distance
  }));

  location.reload();
};
