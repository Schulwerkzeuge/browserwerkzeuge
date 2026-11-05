/* Browserwerkzeuge · Service Worker für „Automaten-Editor“ · SPDX-License-Identifier: Apache-2.0 · © 2026 St.-Antonius-Gymnasium Lüdinghausen
 * Automatisch erzeugt – bitte nicht von Hand ändern.
 *
 * Strategie „Netz zuerst“: Online kommt immer der aktuelle Stand vom Server (und landet im Zwischenspeicher).
 * Ist das Netz weg, antwortet der Server mit einem Fehler oder nicht binnen weniger Sekunden,
 * liefert der Zwischenspeicher. Es werden ausschließlich Dateien dieser Website gespeichert – keine fremden Server.
 */
"use strict";
const KENNUNG = "automat";
const STAND = "24d8a551cd";                            // Prüfsumme über alle Dateien – ändert sich mit jeder neuen Fassung
const DATEIEN = [
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon.svg",
  "./",
  "manifest.webmanifest",
  "pwa.js?v=24d8a551cd"
];
const WARTEZEIT_MS = 3500;
const STARTSEITE = new URL(self.registration.scope).pathname;
// Der Ort (Kurzwert der Adresse) steht mit im Namen: Liegt dasselbe Werkzeug zweimal auf der Website
// (z. B. /a/qr/ und /b/qr/), hat jede Kopie ihren eigenen Speicher und räumt nur diesen auf.
const ORT = (text => {
  let h = 0x811c9dc5;                                 // FNV-1a, 32 Bit
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
})(self.registration.scope);
const CACHE = "browserwerkzeuge-" + KENNUNG + "-" + ORT + "-" + STAND;
// Ältere Fassungen dieses Werkzeugs an diesem Ort, dazu die Namen bis Version 1.x ohne Ort
// („anton-tools-…“, „anton-pult-…“, „browserwerkzeuge-tools-…“, „browserwerkzeuge-pult-…“)
const ALT = new RegExp("^(?:(?:anton|browserwerkzeuge)-(?:tools|pult)-" + KENNUNG + "|browserwerkzeuge-" + KENNUNG + "-" + ORT + ")-[0-9a-f]{10}$");

self.addEventListener("install", ereignis => {
  ereignis.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const alte = (await caches.keys()).filter(n => ALT.test(n) && n !== CACHE);
    await Promise.all(DATEIEN.map(async url => {
      try {
        // cache: "reload" umgeht den Browser-Cache, damit wirklich der aktuelle Stand gespeichert wird
        const antwort = await fetch(url, { cache: "reload", credentials: "same-origin" });
        if (antwort.ok && !antwort.redirected) { await cache.put(url, antwort); return; }
      } catch (e) { /* offline oder Datei fehlt */ }
      for (const name of alte) {                      // dann den bisherigen Stand dieser Datei übernehmen
        const vorher = await (await caches.open(name)).match(url);
        if (vorher) { await cache.put(url, vorher); return; }
      }
    }));
    // Ohne Startseite wäre die App offline unbrauchbar – dann lieber beim alten Stand bleiben
    if (!(await cache.match(STARTSEITE))) { await caches.delete(CACHE); throw new Error("Startseite nicht erreichbar"); }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", ereignis => {
  ereignis.waitUntil((async () => {
    for (const name of await caches.keys())
      if (ALT.test(name) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

async function ausSpeicher(anfrage, navigation) {
  const cache = await caches.open(CACHE);
  if (navigation) {                                   // Seitenaufrufe immer ohne ?… und #… nachschlagen
    const u = new URL(anfrage.url);
    return (await cache.match(u.origin + u.pathname)) || (await cache.match(STARTSEITE));
  }
  return (await cache.match(anfrage)) || (await cache.match(anfrage, { ignoreSearch: true }));
}

self.addEventListener("fetch", ereignis => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);
  if (url.origin !== location.origin) return;        // fremde Adressen nicht anfassen
  if (anfrage.headers.has("range")) return;          // Teilanfragen (Audio/Video) direkt durchreichen
  const navigation = anfrage.mode === "navigate";

  // Seiten am Browser-Cache vorbei immer beim Server nachfragen (cache: "no-cache" = mit Prüfung, ob sich etwas geändert hat)
  const holen = navigation
    ? fetch(url.origin + url.pathname + url.search, { cache: "no-cache", credentials: "same-origin" })
        .then(a => a.redirected ? fetch(anfrage) : a)
    : fetch(anfrage);

  let speichern = Promise.resolve();
  const netz = holen.then(antwort => {
    if (antwort.ok && antwort.type === "basic" && !antwort.redirected) {
      const ziel = navigation ? url.origin + url.pathname : anfrage;   // Seiten ohne ?… speichern
      const kopie = antwort.clone();
      speichern = caches.open(CACHE).then(c => c.put(ziel, kopie)).catch(() => {});
    }
    return antwort;
  });
  netz.catch(() => {});                               // spätere Fehler nicht als „unbehandelt“ melden
  // waitUntil muss sofort aufgerufen werden – das Speichern läuft dann auch nach der Auslieferung zu Ende
  ereignis.waitUntil(netz.then(() => speichern, () => {}));

  ereignis.respondWith((async () => {
    const zeitlimit = new Promise(fertig => setTimeout(fertig, WARTEZEIT_MS));
    try {
      const schnell = await Promise.race([netz, zeitlimit]);
      if (schnell && !(navigation && schnell.status >= 500)) return schnell;   // Server hat rechtzeitig (und ohne Fehler) geantwortet
      const gespeichert = await ausSpeicher(anfrage, navigation);              // zu langsam oder Serverfehler → gespeicherter Stand
      if (gespeichert) return gespeichert;
      return schnell || await netz;
    } catch (e) {                                     // offline
      const gespeichert = await ausSpeicher(anfrage, navigation);
      if (gespeichert) return gespeichert;
      return new Response("Offline – diese Datei wurde noch nicht gespeichert.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
