document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([15.5007, 32.5599], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
});