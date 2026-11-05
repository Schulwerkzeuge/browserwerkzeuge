/* Browserwerkzeuge · pwa.js · Version 2.2.0 · SPDX-License-Identifier: Apache-2.0 · © 2026 St.-Antonius-Gymnasium Lüdinghausen
 *
 * Macht ein Tool als Web-App installierbar und offline nutzbar und ergänzt in der Fußzeile:
 *   „Als App installieren“ · „Daten sichern“ · „Daten laden“ · „Daten löschen“
 * Eingebunden wird die Datei im <head> des Tools (ohne defer, damit sie vor dem Tool-Code läuft):
 *   <script src="pwa.js" data-tool="tafel" data-name="Tafel" data-daten="ja" data-schluessel="browserwerkzeuge-tafel"></script>
 * „Daten sichern“ nimmt nur die Einträge dieses Tools mit. Welche das sind, merkt sich die Datei selbst:
 * Sie notiert jeden Speicher-Eintrag, den das Tool liest oder schreibt (unter „browserwerkzeuge-pwa-zuordnung“),
 * dazu alle Einträge, die mit einem der Namen aus data-schluessel beginnen.
 * Es werden keine Daten übertragen: Sichern erzeugt eine Datei auf dem Gerät, Laden liest sie dort ein.
 *
 * Außerdem füllt die Datei den Rücklink <a id="ruecklink" hidden> im Kopf des Tools (seit 1.4.0):
 * Eine Übersichtsseite meldet sich mit einer Zeile selbst an (siehe README, „Übersichtsseite (freiwillig)“).
 * Gibt es in diesem Browser keine passende Übersicht oder läuft das Tool als installierte Web-App,
 * wird der Link entfernt. Die Tools selbst brauchen dafür keine Einstellung.
 *
 * Umzug (seit 2.0.0): Bis Version 1.4 hießen die Speicher-Einträge „anton-…“. Beim Öffnen werden sie auf
 * „browserwerkzeuge-…“ KOPIERT; die alten bleiben stehen. Nur wenn der Speicher dafür zu voll ist, wird ein
 * Eintrag verschoben – und auch das erst, nachdem die Kopie geprüft ist. Alte Sicherungsdateien bleiben ladbar.
 * Jeder alte Eintrag zieht nur einmal um (Liste unter „browserwerkzeuge-umzug-erledigt“, seit 2.1.0).
 * „Daten laden“ übernimmt nur Einträge dieses Tools, und Sicherungen ab Version 2 nur, wenn sie von diesem Tool stammen.
 * „Daten löschen“ (seit 2.2.0) entfernt nach Rückfrage alle Einträge dieses Tools aus dem Browser.
 */
(function () {
  "use strict";
  const skript = document.currentScript;
  const TOOL = (skript && skript.dataset.tool) || "tool";
  const NAME = (skript && skript.dataset.name) || document.title || "Tool";
  const MIT_DATEN = !skript || skript.dataset.daten !== "nein";
  const PRAEFIXE = ((skript && skript.dataset.schluessel) || "").split(/\s+/).filter(Boolean);
  const VOR = "browserwerkzeuge-", ALT_VOR = "anton-";  // Namensanfang heute und bis Version 1.4
  const ZUORDNUNG = VOR + "pwa-zuordnung";             // { tool: [Einträge, die das Tool benutzt] }
  const ORDNER = new URL(".", skript ? skript.src : location.href);
  const FORMAT = VOR + "daten", ALT_FORMAT = ALT_VOR + "daten";
  const UEBERSICHT = VOR + "uebersicht:";              // Anmeldungen der Übersichtsseiten – gehören zu keinem Tool
  const UMZUG = VOR + "umzug-erledigt";                // alte Einträge, die schon einmal umgezogen sind

  const istIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const istApp = () => matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
                       navigator.standalone === true;

  /* ------------------------------------------------------------ Welche Einträge gehören zu diesem Tool? */
  let LS = null;
  try { LS = window.localStorage; } catch (e) { /* Speicher gesperrt */ }

  /* ------------------------------------------------------------ Umzug der Einträge aus Version 1.x */
  const neuerName = k => VOR + k.slice(ALT_VOR.length);
  function umzug() {
    if (!LS) return;
    let alte = [], erledigt;
    try { for (let i = 0; i < LS.length; i++) { const k = LS.key(i); if (k && k.startsWith(ALT_VOR)) alte.push(k); } }
    catch (e) { return; }
    try { const e = JSON.parse(LS.getItem(UMZUG) || "[]"); erledigt = new Set(Array.isArray(e) ? e : []); } catch (e) { erledigt = new Set(); }
    const vorher = erledigt.size;
    // Jeder alte Eintrag zieht nur einmal um – wer die neue Fassung danach löscht, bekommt die alte nicht zurück
    const fertig = k => erledigt.add(k);
    for (const k of alte) {
      try {
        if (k.startsWith(ALT_VOR + "uebersicht:") || erledigt.has(k)) continue;   // Übersichten melden sich neu an
        const ziel = neuerName(k);
        if (LS.getItem(ziel) !== null) { fertig(k); continue; }         // schon umgezogen (oder neu angelegt)
        let wert = LS.getItem(k);
        if (wert === null) continue;
        if (k === ALT_VOR + "pwa-zuordnung") {                          // Liste je Tool: Namen mit umstellen
          try {
            const z = JSON.parse(wert), neu = {};
            if (z && typeof z === "object" && !Array.isArray(z))
              for (const [tool, liste] of Object.entries(z))
                if (Array.isArray(liste)) neu[tool] = liste.filter(x => typeof x === "string").map(x => x.startsWith(ALT_VOR) ? neuerName(x) : x);
            wert = JSON.stringify(neu);
          } catch (e) { continue; }
          LS.setItem(ziel, wert);
          fertig(k);
          continue;
        }
        try {
          LS.setItem(ziel, wert);                                       // Regelfall: kopieren, alt bleibt stehen
        } catch (voll) {                                                // Speicher zu voll für eine Kopie: verschieben
          LS.removeItem(k);
          try { LS.setItem(ziel, wert); }
          catch (e) { LS.setItem(k, wert); continue; }                  // klappt auch so nicht: alles wie vorher
          if (LS.getItem(ziel) !== wert) { LS.setItem(k, wert); LS.removeItem(ziel); continue; }
        }
        fertig(k);
      } catch (e) { /* dieser Eintrag beim nächsten Öffnen erneut */ }
    }
    if (erledigt.size !== vorher) try { LS.setItem(UMZUG, JSON.stringify([...erledigt])); } catch (e) { /* dann beim nächsten Mal */ }
  }
  umzug();
  const S = window.Storage && Storage.prototype, original = S && { get: S.getItem, set: S.setItem };
  let bekannt = null;

  function zuordnung() {
    try { const z = JSON.parse(original.get.call(LS, ZUORDNUNG) || "{}"); return z && typeof z === "object" && !Array.isArray(z) ? z : {}; }
    catch (e) { return {}; }
  }
  function merke(k) {
    if (!LS || typeof k !== "string" || k === ZUORDNUNG || k === UMZUG || k.startsWith(UEBERSICHT) || k.length > 200) return;
    if (!bekannt) { const l = zuordnung()[TOOL]; bekannt = new Set(Array.isArray(l) ? l.filter(x => typeof x === "string") : []); }
    if (!k || bekannt.has(k)) return;                  // merke("") lädt nur die Zuordnung
    bekannt.add(k);
    try { const z = zuordnung(); z[TOOL] = [...bekannt].slice(-500); original.set.call(LS, ZUORDNUNG, JSON.stringify(z)); } catch (e) { /* Speicher voll */ }
  }
  if (LS && S) {
    try {
      S.getItem = function (k) { if (this === LS) merke(String(k)); return original.get.call(this, k); };
      S.setItem = function (k, v) { const r = original.set.call(this, k, v); if (this === LS) merke(String(k)); return r; };
    } catch (e) { /* ältere Browser: dann zählen nur die festen Namen */ }
  }
  const gehoertDazu = k => k !== ZUORDNUNG && k !== UMZUG && !k.startsWith(UEBERSICHT) && ((bekannt && bekannt.has(k)) || PRAEFIXE.some(p => k.startsWith(p)));

  /* ------------------------------------------------------------ Service Worker */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    addEventListener("load", () => {
      navigator.serviceWorker.register(new URL("sw.js", ORDNER), { scope: ORDNER.pathname })
        .catch(e => console.warn("Browserwerkzeuge: Offline-Modus nicht verfügbar", e));
    });
  }
  // Gespeicherte Daten möglichst vor dem automatischen Aufräumen des Browsers schützen (v. a. Safari)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(ja => ja || navigator.storage.persist()).catch(() => {});

  /* ------------------------------------------------------------ Installieren */
  let installAufforderung = null;
  addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installAufforderung = e;
    zeigeKnopf("install", true);
  });
  addEventListener("appinstalled", () => { installAufforderung = null; zeigeKnopf("install", false); });

  async function installiere() {
    if (installAufforderung) {
      installAufforderung.prompt();
      try { await installAufforderung.userChoice; } catch (e) { /* abgebrochen */ }
      installAufforderung = null;
    } else {
      dialog("Als App installieren",
        istIOS
          ? "<p>Tippen Sie auf das <strong>Teilen-Symbol</strong> <span aria-hidden=\"true\">(□↑)</span> und dann auf <strong>„Zum Home-Bildschirm“</strong>.</p>" +
            "<p>In Chrome liegt das Teilen-Symbol oben rechts in der Adressleiste.</p>" +
            "<p class=\"ap-klein\">Wichtig: Die App hat einen eigenen Speicher. Gespeicherte Daten (z.&nbsp;B. Klassenlisten) " +
            "übertragen Sie mit „Daten sichern“ im Browser und „Daten laden“ in der App.</p>"
          : "<p>Öffnen Sie das Browser-Menü (meist <strong>⋮</strong> oben rechts) und wählen Sie <strong>„App installieren“</strong> bzw. <strong>„Zum Startbildschirm hinzufügen“</strong>.</p>" +
            "<p class=\"ap-klein\">Firefox am PC kann keine Web-Apps installieren – dort einfach ein Lesezeichen anlegen. " +
            "Die installierte App hat einen eigenen Speicher: Daten übertragen Sie mit „Daten sichern“ und „Daten laden“.</p>",
        [{ text: "Verstanden", primaer: true }]);
    }
  }

  /* ------------------------------------------------------------ Daten sichern / laden */
  function toolDaten() {                               // nur die Einträge dieses Tools
    const daten = {};
    if (!LS) return daten;
    merke("");                                          // Zuordnung laden
    try {
      for (let i = 0; i < LS.length; i++) {
        const k = LS.key(i);
        if (gehoertDazu(k)) daten[k] = original.get.call(LS, k);
      }
    } catch (e) { /* ohne Speicher */ }
    return daten;
  }

  // Liste der Einträge zum Aufklappen – so ist sichtbar, was in der Datei steht
  function liste(schluessel) {
    return `<details class="ap-klein"><summary>Enthaltene Einträge anzeigen</summary><ul class="ap-liste">` +
      schluessel.slice().sort().map(k => `<li>${esc(k)}</li>`).join("") + "</ul></details>";
  }

  function sichere() {
    const schluessel = Object.keys(toolDaten()), anzahl = schluessel.length;
    if (!anzahl) { dialog("Daten sichern", `<p>Auf diesem Gerät sind für „${esc(NAME)}“ noch keine Daten gespeichert.</p>`, [{ text: "OK", primaer: true }]); return; }
    dialog("Daten sichern",
      `<p>Es wird eine Datei mit den Daten von <strong>„${esc(NAME)}“</strong> erstellt (${anzahl === 1 ? "ein Eintrag" : anzahl + " Einträge"}). ` +
      "Mit „Daten laden“ in diesem Tool holen Sie sie auf einem anderen Gerät oder in der installierten App zurück.</p>" + liste(schluessel) +
      "<p class=\"ap-klein\">Die Datei kann personenbezogene Daten enthalten (z.&nbsp;B. Namen aus Klassenlisten). Speichern Sie sie nur auf Dienstgeräten und geben Sie sie nicht weiter.</p>",
      [{ text: "Abbrechen" }, { text: "Datei erstellen", primaer: true, aktion: speichereDatei }]);
  }

  async function speichereDatei() {
    const daten = toolDaten();
    const inhalt = JSON.stringify({ format: FORMAT, version: 2, erstellt: new Date().toISOString(), tool: TOOL, name: NAME, daten }, null, 1);
    const heute = new Date(), zwei = n => String(n).padStart(2, "0");
    const name = `browserwerkzeuge-daten-${TOOL}-${heute.getFullYear()}-${zwei(heute.getMonth() + 1)}-${zwei(heute.getDate())}.json`;
    const datei = new File([inhalt], name, { type: "application/json" });
    // iPad/iPhone: Teilen-Menü („In Dateien sichern“, AirDrop …); sonst normaler Download
    if (istIOS && navigator.canShare && navigator.canShare({ files: [datei] })) {
      try { await navigator.share({ files: [datei], title: name }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(datei);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  function lade() {
    const eingabe = document.createElement("input");
    eingabe.type = "file";
    eingabe.accept = ".json,application/json";
    eingabe.addEventListener("change", async () => {
      const datei = eingabe.files && eingabe.files[0];
      if (!datei) return;
      let paket;
      try { paket = JSON.parse(await datei.text()); } catch (e) { paket = null; }
      if (paket && paket.format === ALT_FORMAT && paket.daten && typeof paket.daten === "object" && !Array.isArray(paket.daten)) {
        const neu = {};                                  // Sicherung aus Version 1.x: Namen umstellen
        for (const [k, w] of Object.entries(paket.daten)) neu[k.startsWith(ALT_VOR) ? neuerName(k) : k] = w;
        paket.daten = neu; paket.format = FORMAT;
      }
      if (!paket || paket.format !== FORMAT || !paket.daten || typeof paket.daten !== "object" || Array.isArray(paket.daten)) {
        dialog("Daten laden", "<p>Diese Datei ist keine Datensicherung dieses Tools.</p>", [{ text: "OK", primaer: true }]);
        return;
      }
      if (typeof paket.tool === "string" && paket.tool !== TOOL) {
        dialog("Daten laden", `<p>Diese Sicherung gehört zu <strong>„${esc(String(paket.name || paket.tool).slice(0, 80))}“</strong>. Bitte öffnen Sie dieses Tool und laden Sie sie dort.</p>`, [{ text: "OK", primaer: true }]);
        return;
      }
      if (paket.version >= 2 && paket.tool !== TOOL) {   // ab Version 2 trägt jede Sicherung den Namen ihres Tools
        dialog("Daten laden", "<p>Diese Datei ist keine Datensicherung dieses Tools.</p>", [{ text: "OK", primaer: true }]);
        return;
      }
      merke("");
      // Nur Einträge, die zu diesem Tool gehören (bei Sicherungen bis Version 1.2 standen dort die Daten aller Tools)
      const alle = Object.keys(paket.daten);
      const schluessel = alle.filter(k => typeof paket.daten[k] === "string" && k.length <= 200 && gehoertDazu(k));
      const uebersprungen = paket.version >= 2 ? alle.length - schluessel.length : 0;
      if (!schluessel.length) { dialog("Daten laden", `<p>Die Sicherung enthält keine Einträge für „${esc(NAME)}“.</p>`, [{ text: "OK", primaer: true }]); return; }
      const jetzt = k => original ? original.get.call(LS, k) : LS.getItem(k);
      const ueberschrieben = schluessel.filter(k => { const v = jetzt(k); return v !== null && v !== paket.daten[k]; }).length;
      const zeit = new Date(paket.erstellt), datum = paket.erstellt && !isNaN(zeit) ? `vom <strong>${esc(zeit.toLocaleString("de-DE"))}</strong>` : "(Datum unbekannt)";
      dialog("Daten laden",
        `<p>Sicherung ${datum} mit ${schluessel.length === 1 ? "einem Eintrag" : schluessel.length + " Einträgen"}.</p>` +
        (ueberschrieben ? `<p>${ueberschrieben === 1 ? "Ein vorhandener Eintrag wird" : ueberschrieben + " vorhandene Einträge werden"} durch den Stand der Sicherung ersetzt. ` +
                          "Alles, was nicht in der Sicherung steht, bleibt unverändert.</p>" : "<p>Vorhandene Daten bleiben erhalten.</p>") +
        (uebersprungen ? `<p class="ap-klein">${uebersprungen} ${uebersprungen === 1 ? "Eintrag gehört nicht zu diesem Tool oder ist unlesbar und wird" : "Einträge gehören nicht zu diesem Tool oder sind unlesbar und werden"} übersprungen.</p>` : "") + liste(schluessel),
        [{ text: "Abbrechen" }, { text: "Laden", primaer: true, aktion: () => {
          const vorher = {};
          try {
            schluessel.forEach(k => { vorher[k] = original.get.call(LS, k); original.set.call(LS, k, paket.daten[k]); merke(k); });
          } catch (e) {                              // Speicher voll: alles wieder auf den alten Stand
            try { Object.keys(vorher).forEach(k => vorher[k] === null ? LS.removeItem(k) : original.set.call(LS, k, vorher[k])); } catch (e2) { /* nichts mehr zu retten */ }
            dialog("Daten laden", "<p>Die Daten konnten nicht gespeichert werden (Speicher voll oder gesperrt). Es wurde nichts verändert.</p>", [{ text: "OK", primaer: true }]);
            return;
          }
          location.reload();
        } }]);
    });
    eingabe.click();
  }

  /* ------------------------------------------------------------ Daten löschen */
  // Alle Einträge dieses Tools aus diesem Browser entfernen – nur auf ausdrücklichen Wunsch, mit Angebot zur Sicherung.
  // Dazu gehören auch die Kopien aus Version 1.x („anton-…“). Die Einstellung hell/dunkel bleibt (gilt für alle Tools).
  function loesche() {
    const eigene = Object.keys(toolDaten()).filter(k => k !== VOR + "theme");
    const alte = eigene.filter(k => k.startsWith(VOR)).map(k => ALT_VOR + k.slice(VOR.length)).filter(k => { try { return LS.getItem(k) !== null; } catch (e) { return false; } });
    const schluessel = [...eigene, ...alte];
    if (!schluessel.length) { dialog("Daten löschen", `<p>Für „${esc(NAME)}“ sind in diesem Browser keine Daten gespeichert.</p>`, [{ text: "OK", primaer: true }]); return; }
    const geteilt = eigene.includes(VOR + "klassenlisten")
      ? "<p><strong>Achtung:</strong> Die Klassenlisten nutzen „Zufall &amp; Gruppen“ und der Sitzplan gemeinsam – sie sind danach in beiden gelöscht.</p>" : "";
    dialog("Daten löschen",
      `<p>Alle Daten von <strong>„${esc(NAME)}“</strong> werden aus diesem Browser gelöscht (${schluessel.length === 1 ? "ein Eintrag" : schluessel.length + " Einträge"}). ` +
      "Das lässt sich nicht rückgängig machen.</p>" + geteilt + liste(schluessel) +
      "<p class=\"ap-klein\">Tipp: Mit „Erst sichern“ entsteht vorher eine Datei, die sich später mit „Daten laden“ zurückholen lässt.</p>",
      [{ text: "Abbrechen" }, { text: "Erst sichern", aktion: speichereDatei },
       { text: "Endgültig löschen", primaer: true, aktion: () => { schluessel.forEach(k => { try { LS.removeItem(k); } catch (e) { /* weiter */ } }); location.reload(); } }]);
  }

  /* ------------------------------------------------------------ Rücklink zur Übersicht */
  // Gleiche Logik steht in werkzeuge/gutachten und werkzeuge/anleitung (ohne Web-App) – bei Änderungen dort mit anpassen.
  function ruecklink() {
    const link = document.getElementById("ruecklink");
    if (!link) return;
    if (istApp()) { link.remove(); return; }
    const liste = new Map();                          // Pfad der Übersicht → Name
    try {
      for (let i = 0; i < LS.length; i++) {
        const k = LS.key(i);
        if (!k || !k.startsWith(UEBERSICHT)) continue;
        const pfad = k.slice(UEBERSICHT.length), name = original ? original.get.call(LS, k) : LS.getItem(k);
        if (/^\/(?:[\w.%-]+\/)*$/.test(pfad) && !/\.\.|%2e/i.test(pfad) && typeof name === "string" && name.trim() && name.length <= 40)
          liste.set(pfad, name.trim());
      }
    } catch (e) { /* ohne Speicher: kein Link */ }
    let ziel = "";
    const merk = VOR + "ruecklink:" + location.pathname;
    try {                                             // 1. die Übersicht, von der man gerade kommt
      const herkunft = document.referrer ? new URL(document.referrer) : null;
      const pfad = herkunft && herkunft.origin === location.origin ? herkunft.pathname.replace(/index\.html?$/, "") : "";
      if (liste.has(pfad)) ziel = pfad;
      if (ziel) sessionStorage.setItem(merk, ziel);   // 2. … oder von der man in diesem Tab gekommen war
      else { const s = sessionStorage.getItem(merk); if (s && liste.has(s)) ziel = s; }
    } catch (e) { /* ohne Referrer oder Sitzungsspeicher */ }
    if (!ziel) for (const pfad of liste.keys())     // 3. sonst die Übersicht über dem eigenen Ordner
      if (location.pathname.startsWith(pfad) && pfad.length > ziel.length) ziel = pfad;
    if (!ziel) { link.remove(); return; }
    const name = liste.get(ziel), feld = link.querySelector("[data-ruecklink-name]");
    if (feld) feld.textContent = name; else link.textContent = "← " + name;   // Feld: nur der Name (Maus-/Tastaturtrainer)
    link.href = ziel;
    link.title = "Zurück zu " + name;
    link.hidden = false;
  }

  /* ------------------------------------------------------------ Oberfläche */
  const STIL = `
.ap-leiste{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin-top:6px}
.ap-leiste button{font:inherit;font-size:inherit;background:none;border:0;padding:2px 0;color:var(--akzent,var(--link,#1f5f99));cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.ap-dialog{border:1px solid var(--rand,var(--line,#d6dae0));border-radius:10px;padding:18px 20px;max-width:min(440px,calc(100vw - 32px));background:var(--flaeche,var(--surface,#fff));color:var(--text,#1f2933);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.ap-dialog::backdrop{background:rgba(0,0,0,.35)}
.ap-dialog h2{font-size:1.05rem;margin:0 0 8px}
.ap-dialog p{margin:6px 0}
.ap-klein{font-size:.88em;color:var(--dezent,var(--muted,#5f6b7a))}
.ap-dialog details{margin:8px 0}.ap-dialog summary{cursor:pointer}
.ap-liste{max-height:160px;overflow:auto;margin:6px 0 0;padding-left:20px;font-family:ui-monospace,monospace;font-size:.95em;word-break:break-all}
.ap-knoepfe{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.ap-knoepfe button{font:inherit;padding:6px 14px;border:1px solid var(--rand,var(--line,#d6dae0));border-radius:6px;background:var(--flaeche,var(--surface,#fff));color:inherit;cursor:pointer}
.ap-knoepfe button.ap-primaer{background:var(--akzent,var(--link,#1f5f99));border-color:var(--akzent,var(--link,#1f5f99));color:var(--auf-akzent,#fff)}
@media print{.ap-leiste{display:none}}`;

  const knoepfe = {};
  function zeigeKnopf(name, sichtbar) { if (knoepfe[name]) knoepfe[name].hidden = !sichtbar; }

  function esc(t) { return String(t).replace(/[&<>"]/g, z => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z])); }

  function dialog(titel, html, aktionen) {
    const d = document.createElement("dialog");
    const id = "ap-titel-" + Math.random().toString(36).slice(2, 8);
    d.className = "ap-dialog";
    d.setAttribute("aria-labelledby", id);
    d.innerHTML = `<h2 id="${id}">${esc(titel)}</h2>${html}<div class="ap-knoepfe"></div>`;
    const leiste = d.querySelector(".ap-knoepfe");
    aktionen.forEach(a => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = a.text;
      if (a.primaer) b.className = "ap-primaer";
      b.addEventListener("click", () => { d.close(); if (a.aktion) a.aktion(); });
      leiste.appendChild(b);
    });
    d.addEventListener("close", () => d.remove());
    document.body.appendChild(d);
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }

  function baueLeiste() {
    const stil = document.createElement("style");
    stil.textContent = STIL;
    document.head.appendChild(stil);
    const fuss = document.querySelector("footer") || document.body;
    const leiste = document.createElement("div");
    leiste.className = "ap-leiste";
    const neu = (name, text, aktion, sichtbar) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = text; b.hidden = !sichtbar;
      b.addEventListener("click", aktion);
      leiste.appendChild(b); knoepfe[name] = b;
    };
    // Ohne Installations-Aufforderung des Browsers (iPad/iPhone, Android in manchen Browsern) gibt es eine Anleitung
    neu("install", "Als App installieren", installiere, !istApp());
    if (MIT_DATEN) {
      neu("sichern", "Daten sichern", sichere, true);
      neu("laden", "Daten laden", lade, true);
      neu("loeschen", "Daten löschen", loesche, true);
    }
    fuss.appendChild(leiste);
  }

  const start = () => { ruecklink(); baueLeiste(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
