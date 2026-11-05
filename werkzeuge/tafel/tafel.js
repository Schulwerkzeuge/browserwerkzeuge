"use strict";
// SPDX-License-Identifier: Apache-2.0 · © 2026 St.-Antonius-Gymnasium Lüdinghausen
// Tafel: Arbeitsphasen mit Uhr, Aufgabe, Sozialform, Material-QR,
// Lärmampel und Murmelglas. Benötigt qr-kodierung.js (stellt QR.erzeuge bereit).

const SPEICHER = "browserwerkzeuge-tafel";
const DESIGN = "browserwerkzeuge-theme";   // gemeinsam mit allen Tools: "dark" / "light"
const MAX_PHASEN = 30;
const $ = id => document.getElementById(id);

const SOZIALFORMEN = {
  "": "keine Angabe",
  einzel: "Einzelarbeit",
  partner: "Partnerarbeit",
  gruppe: "Gruppenarbeit",
  plenum: "Plenum"
};

// grenze: erlaubter Pegel in dB über der gemessenen Grundruhe.
// Erfahrungswerte – über den Empfindlichkeitsregler an der Tafel anpassbar.
const LAUTSTAERKEN = {
  aus:       { name: "keine Lärmampel" },
  stille:    { name: "Stille", grenze: 6 },
  fluestern: { name: "Flüstern", grenze: 12 },
  zimmer:    { name: "Zimmerlautstärke", grenze: 20 }
};

const GLAS_STANDARD = { groesse: 50, minuten: 1, murmeln: 0, gruenMs: 0, belohnung: "" };
const GLAS_FARBEN = ["#e05d5d", "#4f8fd9", "#46b37b", "#f0b429", "#9b6fd6", "#e98a3c", "#3bb3c4"];

// Einfache Personensymbole (k = Verkleinerung)
const person = (x, k = 1) => {
  const w = 5.5 * k, h = 7 * k;
  return `<circle cx="${x}" cy="${21 - h - 4.2 * k}" r="${3.2 * k}"/>` +
         `<path d="M${x - w} 21c0-${4 * k} ${2.5 * k}-${h} ${w}-${h}s${w} ${3 * k} ${w} ${h}z"/>`;
};
const SYMBOLE = {
  einzel: person(12),
  partner: person(7.5, 0.9) + person(16.5, 0.9),
  gruppe: person(4.5, 0.7) + person(12, 0.7) + person(19.5, 0.7),
  plenum: '<rect x="3" y="3" width="18" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
          '<path d="M8 21l4-7 4 7" fill="none" stroke="currentColor" stroke-width="2"/>'
};
const sozialSvg = art => (SYMBOLE[art] ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SYMBOLE[art]}</svg>` : "");

function neuePhase(teil = {}) {
  return { titel: "", minuten: 10, sozialform: "einzel", aufgabe: "", fertig: "", link: "", laut: "aus", ...teil };
}

const App = {
  // Vorlagen und Gläser ohne Prototyp: beliebige Namen (auch „__proto__“, „constructor“) sind gewöhnliche Einträge
  daten: { ablauf: [], vorlagen: Object.create(null), gong: true, empfindlichkeit: 0, glaeser: Object.create(null), glas: "" },
  aktuell: 0,
  laeuft: false,
  endeZeit: 0,          // Zeitpunkt (ms), an dem die laufende Phase endet
  restMs: 0,            // Restzeit, solange pausiert
  gesamtMs: 0,
  gongGespielt: false,
  takt: null,
  leisteTimer: null,
  hinweisTimer: null,
  wakeLock: null,
  meldungTimer: null,
  audioCtx: null,
  audio: null,          // { stream, quelle, analyser, puffer, zuletzt }
  mikroStartet: false,
  basisDb: null,        // gemessene Grundruhe
  pegelDb: null,        // geglätteter aktueller Pegel
  kalibrierung: null,   // { werte, bis }
  ampelRaf: null,

  init() {
    this.lade();
    window.addEventListener("storage", e => {         // zweiter Tab: nicht stillschweigend überschreiben
      if (e.key === SPEICHER) this.meldung("Die Tafel wurde in einem anderen Tab geändert. Zum Übernehmen die Seite neu laden.");
    });
    this.initDesign();
    $("opt-gong").checked = this.daten.gong;
    $("t-empfindlichkeit").value = this.daten.empfindlichkeit;
    this.renderPhasen();
    this.renderVorlagen();
    this.renderGlaeser();
    this.binde();
  },

  // ------------------------------------------------ Speichern

  lade() {
    try {
      const d = JSON.parse(localStorage.getItem(SPEICHER));
      if (d && Array.isArray(d.ablauf)) {
        this.daten.ablauf = d.ablauf.slice(0, MAX_PHASEN).map(p => this.bereinige(p));
        if (d.vorlagen && typeof d.vorlagen === "object") {
          for (const [name, ablauf] of Object.entries(d.vorlagen)) {
            if (Array.isArray(ablauf) && ablauf.length) this.daten.vorlagen[name] = ablauf.slice(0, MAX_PHASEN).map(p => this.bereinige(p));
          }
        }
        if (d.glaeser && typeof d.glaeser === "object") {
          for (const [name, glas] of Object.entries(d.glaeser)) this.daten.glaeser[name] = this.bereinigeGlas(glas);
        }
        if (typeof d.glas === "string" && Object.hasOwn(this.daten.glaeser, d.glas)) this.daten.glas = d.glas;
        if (typeof d.gong === "boolean") this.daten.gong = d.gong;
        if (typeof d.empfindlichkeit === "number") this.daten.empfindlichkeit = Math.max(-10, Math.min(10, d.empfindlichkeit));
      }
    } catch (e) { /* beschädigte Daten ignorieren */ }
    if (!this.daten.ablauf.length) this.daten.ablauf = [neuePhase()];
  },

  speichere() {
    try {
      localStorage.setItem(SPEICHER, JSON.stringify(this.daten));
    } catch (e) {
      this.meldung("Speichern im Browser ist nicht möglich.");
    }
  },

  // Nur erwartete Felder und Werte übernehmen (auch beim Laden fremder Dateien)
  bereinige(p) {
    p = p && typeof p === "object" ? p : {};
    const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
    const min = Math.round(Number(p.minuten));
    return {
      titel: text(p.titel, 80),
      minuten: Number.isFinite(min) ? Math.min(240, Math.max(0, min)) : 10,
      sozialform: Object.prototype.hasOwnProperty.call(SOZIALFORMEN, p.sozialform) ? p.sozialform : "",
      aufgabe: text(p.aufgabe, 2000),
      fertig: text(p.fertig, 500),
      link: text(p.link, 500),
      laut: Object.prototype.hasOwnProperty.call(LAUTSTAERKEN, p.laut) ? p.laut : "aus"
    };
  },

  bereinigeGlas(g) {
    g = g && typeof g === "object" ? g : {};
    const zahl = (v, min, max, standard) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : standard);
    const groesse = Math.round(zahl(g.groesse, 5, 200, GLAS_STANDARD.groesse));
    return {
      groesse,
      minuten: Math.round(zahl(g.minuten, 0.5, 10, GLAS_STANDARD.minuten) * 2) / 2,
      murmeln: Math.round(zahl(g.murmeln, 0, groesse, 0)),
      gruenMs: zahl(g.gruenMs, 0, 600000, 0),
      belohnung: typeof g.belohnung === "string" ? g.belohnung.slice(0, 120) : ""
    };
  },

  // ------------------------------------------------ Planung: Phasen

  renderPhasen() {
    const ziel = $("phasen");
    ziel.innerHTML = "";
    const anzahl = this.daten.ablauf.length;
    this.daten.ablauf.forEach((p, i) => {
      const karte = document.createElement("div");
      karte.className = "phase";
      karte.innerHTML = `
        <div class="phase-kopf">
          <span class="phase-nr">${i + 1}.</span>
          <input type="text" class="phase-titel" data-feld="titel" maxlength="80" placeholder="Titel, z. B. Erarbeitung" aria-label="Titel der Phase">
          <label>Minuten <input type="number" class="phase-minuten" data-feld="minuten" min="0" max="240"></label>
          <button type="button" data-aktion="hoch" title="nach oben">↑</button>
          <button type="button" data-aktion="runter" title="nach unten">↓</button>
          <button type="button" data-aktion="kopie" title="Phase kopieren">Kopie</button>
          <button type="button" data-aktion="weg" title="Phase löschen">✕</button>
        </div>
        <div class="phase-felder">
          <label class="feld"><span>Sozialform</span><select data-feld="sozialform"></select></label>
          <label class="feld"><span>Lärmampel</span><select data-feld="laut"></select></label>
          <label class="feld"><span>Link zum Material (erscheint als QR-Code)</span><input type="text" data-feld="link" placeholder="https://…"></label>
        </div>
        <label class="feld"><span>Aufgabe</span><textarea data-feld="aufgabe" rows="3"></textarea></label>
        <label class="feld"><span>Wenn ihr fertig seid … (optional)</span><textarea data-feld="fertig" rows="1"></textarea></label>`;

      const sozial = karte.querySelector('[data-feld="sozialform"]');
      Object.entries(SOZIALFORMEN).forEach(([wert, name]) => sozial.add(new Option(name, wert)));
      const laut = karte.querySelector('[data-feld="laut"]');
      Object.entries(LAUTSTAERKEN).forEach(([wert, stufe]) => laut.add(new Option(stufe.name, wert)));

      karte.querySelectorAll("[data-feld]").forEach(el => {
        const feld = el.dataset.feld;
        el.value = p[feld];
        el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
          this.daten.ablauf[i] = this.bereinige({ ...this.daten.ablauf[i], [feld]: el.value });
          this.speichere();
        });
      });
      karte.querySelector('[data-aktion="hoch"]').disabled = i === 0;
      karte.querySelector('[data-aktion="runter"]').disabled = i === anzahl - 1;
      karte.querySelectorAll("[data-aktion]").forEach(b =>
        b.addEventListener("click", () => this.phaseAktion(i, b.dataset.aktion)));
      ziel.appendChild(karte);
    });
  },

  phaseAktion(i, aktion) {
    const a = this.daten.ablauf;
    if (aktion === "hoch" && i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]];
    else if (aktion === "runter" && i < a.length - 1) [a[i + 1], a[i]] = [a[i], a[i + 1]];
    else if (aktion === "kopie") {
      if (a.length >= MAX_PHASEN) { this.meldung(`Höchstens ${MAX_PHASEN} Phasen.`); return; }
      a.splice(i + 1, 0, { ...a[i] });
    } else if (aktion === "weg") {
      if ((a[i].aufgabe || a[i].titel) && !confirm(`Phase ${i + 1} löschen?`)) return;
      if (a.length === 1) a[0] = neuePhase(); else a.splice(i, 1);
    }
    this.speichere();
    this.renderPhasen();
  },

  // ------------------------------------------------ Planung: Murmelgläser

  aktivesGlas() {
    return this.daten.glaeser[this.daten.glas] || null;
  },

  renderGlaeser() {
    const wahl = $("glas-wahl");
    wahl.innerHTML = "";
    wahl.add(new Option("kein Glas", ""));
    Object.keys(this.daten.glaeser).sort((x, y) => x.localeCompare(y, "de", { numeric: true }))
      .forEach(n => wahl.add(new Option(n, n)));
    wahl.value = this.daten.glas;
    const glas = this.aktivesGlas();
    $("glas-einstellungen").hidden = !glas;
    $("btn-glas-loeschen").disabled = !glas;
    if (!glas) return;
    $("glas-groesse").value = glas.groesse;
    $("glas-minuten").value = glas.minuten;
    $("glas-belohnung").value = glas.belohnung;
    $("glas-stand").textContent = `Füllstand: ${glas.murmeln} von ${glas.groesse} Murmeln` +
      (glas.murmeln >= glas.groesse ? " – das Glas ist voll." : "");
  },

  glasNeu() {
    const name = (prompt("Name der Lerngruppe, z. B. „6a“:") || "").trim().slice(0, 40);
    if (!name) return;
    if (Object.hasOwn(this.daten.glaeser, name)) {
      this.meldung(`Ein Glas „${name}“ gibt es schon.`);
    } else {
      this.daten.glaeser[name] = { ...GLAS_STANDARD };
    }
    this.daten.glas = name;
    this.speichere();
    this.renderGlaeser();
  },

  glasLoeschen() {
    const name = this.daten.glas;
    if (!name || !confirm(`Das Glas „${name}“ mit allen Murmeln löschen?`)) return;
    delete this.daten.glaeser[name];
    this.daten.glas = "";
    this.speichere();
    this.renderGlaeser();
  },

  glasLeeren() {
    const glas = this.aktivesGlas();
    if (!glas || !confirm(`Das Glas „${this.daten.glas}“ leeren? Alle Murmeln werden entfernt.`)) return;
    glas.murmeln = 0;
    glas.gruenMs = 0;
    this.speichere();
    this.renderGlaeser();
  },

  glasEinstellung() {
    const glas = this.aktivesGlas();
    if (!glas) return;
    const neu = this.bereinigeGlas({
      ...glas,
      groesse: $("glas-groesse").value,
      minuten: $("glas-minuten").value,
      belohnung: $("glas-belohnung").value
    });
    this.daten.glaeser[this.daten.glas] = neu;
    this.speichere();
    this.renderGlaeser();
  },

  // ------------------------------------------------ Vorlagen

  renderVorlagen() {
    const wahl = $("vorlage-wahl");
    wahl.innerHTML = "";
    const namen = Object.keys(this.daten.vorlagen).sort((x, y) => x.localeCompare(y, "de", { numeric: true }));
    if (!namen.length) wahl.add(new Option("– noch keine Vorlagen –", ""));
    namen.forEach(n => {
      const zahl = this.daten.vorlagen[n].length;
      wahl.add(new Option(`${n} (${zahl} Phase${zahl === 1 ? "" : "n"})`, n));
    });
  },

  vorlageSpeichern() {
    const name = (prompt("Name der Vorlage, z. B. „Stationenlernen Geschichte 8“:") || "").trim().slice(0, 60);
    if (!name) return;
    if (Object.hasOwn(this.daten.vorlagen, name) && !confirm(`Die Vorlage „${name}“ gibt es schon. Überschreiben?`)) return;
    this.daten.vorlagen[name] = this.daten.ablauf.map(p => ({ ...p }));
    this.speichere();
    this.renderVorlagen();
    $("vorlage-wahl").value = name;
    this.meldung(`Vorlage „${name}“ gespeichert.`);
  },

  vorlageLaden() {
    const name = $("vorlage-wahl").value;
    if (!name || !this.daten.vorlagen[name]) return;
    if (!confirm(`Den aktuellen Ablauf durch „${name}“ ersetzen?`)) return;
    this.daten.ablauf = this.daten.vorlagen[name].map(p => ({ ...p }));
    this.speichere();
    this.renderPhasen();
  },

  vorlageLoeschen() {
    const name = $("vorlage-wahl").value;
    if (!name || !confirm(`Vorlage „${name}“ löschen?`)) return;
    delete this.daten.vorlagen[name];
    this.speichere();
    this.renderVorlagen();
  },

  exportiere() {
    if (!Object.keys(this.daten.vorlagen).length) { this.meldung("Es gibt noch keine Vorlagen."); return; }
    const inhalt = JSON.stringify({ art: "browserwerkzeuge-tafel-vorlagen", version: 1, vorlagen: this.daten.vorlagen }, null, 2);
    const url = URL.createObjectURL(new Blob([inhalt], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "Tafel-Vorlagen.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);   // großzügig: Safari/iPad beginnt den Download teils verzögert
  },

  async importiere(datei) {
    try {
      const d = JSON.parse(await datei.text());
      if (!d || typeof d.vorlagen !== "object") throw new Error("Format");
      let anzahl = 0;
      for (const [roh, ablauf] of Object.entries(d.vorlagen)) {
        if (!Array.isArray(ablauf) || !ablauf.length) continue;
        const name = String(roh).trim().slice(0, 60) || "Vorlage";
        if (Object.hasOwn(this.daten.vorlagen, name) && !confirm(`„${name}“ gibt es schon. Überschreiben?`)) continue;
        this.daten.vorlagen[name] = ablauf.slice(0, MAX_PHASEN).map(p => this.bereinige(p));
        anzahl++;
      }
      this.speichere();
      this.renderVorlagen();
      this.meldung(`${anzahl} Vorlage${anzahl === 1 ? "" : "n"} geladen.`);
    } catch (e) {
      this.meldung("Die Datei ist keine gültige Vorlagen-Sicherung.");
    }
  },

  // ------------------------------------------------ Ereignisse

  binde() {
    const knopf = (id, fn) => $(id).addEventListener("click", e => { fn(); e.currentTarget.blur(); });

    knopf("btn-phase-neu", () => {
      if (this.daten.ablauf.length >= MAX_PHASEN) { this.meldung(`Höchstens ${MAX_PHASEN} Phasen.`); return; }
      this.daten.ablauf.push(neuePhase());
      this.speichere();
      this.renderPhasen();
    });
    knopf("btn-leeren", () => {
      if (!confirm("Alle Phasen des aktuellen Ablaufs entfernen?")) return;
      this.daten.ablauf = [neuePhase()];
      this.speichere();
      this.renderPhasen();
    });
    knopf("btn-start", () => this.starteTafel());

    // Murmelgläser
    $("glas-wahl").addEventListener("change", e => { this.daten.glas = e.target.value; this.speichere(); this.renderGlaeser(); });
    knopf("btn-glas-neu", () => this.glasNeu());
    knopf("btn-glas-loeschen", () => this.glasLoeschen());
    knopf("btn-glas-leeren", () => this.glasLeeren());
    ["glas-groesse", "glas-minuten", "glas-belohnung"].forEach(id => $(id).addEventListener("change", () => this.glasEinstellung()));

    // Vorlagen und Einstellungen
    knopf("btn-vorlage-laden", () => this.vorlageLaden());
    knopf("btn-vorlage-speichern", () => this.vorlageSpeichern());
    knopf("btn-vorlage-loeschen", () => this.vorlageLoeschen());
    knopf("btn-export", () => this.exportiere());
    knopf("btn-import", () => $("datei").click());
    $("datei").addEventListener("change", e => {
      const datei = e.target.files[0];
      e.target.value = "";
      if (datei) this.importiere(datei);
    });
    $("opt-gong").addEventListener("change", e => { this.daten.gong = e.target.checked; this.speichere(); });
    knopf("btn-design", () => {
      const neu = document.documentElement.dataset.design === "dunkel" ? "hell" : "dunkel";
      this.setzeDesign(neu);
      try { localStorage.setItem(DESIGN, neu === "dunkel" ? "dark" : "light"); } catch (e) { /* ohne Folgen */ }
    });

    // Tafel
    knopf("t-zurueck", () => this.wechslePhase(-1));
    knopf("t-pause", () => this.pausieren());
    knopf("t-minus", () => this.aendereZeit(-1));
    knopf("t-plus", () => this.aendereZeit(1));
    knopf("t-weiter", () => this.wechslePhase(1));
    knopf("t-vollbild", () => this.toggleVollbild());
    knopf("t-bearbeiten", () => this.beendeTafel());
    knopf("t-kalibrieren", () => this.kalibriere());
    knopf("t-glas-plus", () => this.aendereMurmeln(1));
    knopf("t-glas-minus", () => this.aendereMurmeln(-1));
    $("t-empfindlichkeit").addEventListener("input", e => {
      this.daten.empfindlichkeit = Number(e.target.value);
      this.speichere();
    });

    ["pointermove", "pointerdown"].forEach(art => $("tafel").addEventListener(art, () => this.zeigeLeiste()));

    // Tastatur und Presenter
    document.addEventListener("keydown", e => {
      if ($("tafel").hidden) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const k = e.key;
      if (k === " ") { e.preventDefault(); this.pausieren(); }
      else if (k === "ArrowRight" || k === "PageDown") { e.preventDefault(); this.wechslePhase(1); }
      else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); this.wechslePhase(-1); }
      else if (k === "+" || k === "=") this.aendereZeit(1);
      else if (k === "-") this.aendereZeit(-1);
      else return;
      this.zeigeLeiste();
    });

    document.addEventListener("fullscreenchange", () => {
      $("t-vollbild").textContent = document.fullscreenElement ? "Vollbild beenden" : "Vollbild";
    });
    // Bildschirmsperre wird beim Tab-Wechsel aufgehoben – danach neu anfordern
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !$("tafel").hidden) this.halteWach();
    });
  },

  // ------------------------------------------------ Tafel

  starteTafel() {
    this.audioKontext();   // jetzt anlegen: Browser erlauben Ton nur nach einer Bedienhandlung
    $("planung").hidden = true;
    $("tafel").hidden = false;
    document.body.classList.add("tafel-modus");
    this.renderGlasTafel(false);
    this.zeigePhase(0);
    this.halteWach();
    this.zeigeLeiste();
    clearInterval(this.takt);
    this.takt = setInterval(() => this.tick(), 200);
  },

  beendeTafel() {
    clearInterval(this.takt);
    this.takt = null;
    this.laeuft = false;
    this.stoppeMikro();
    this.gibWachFrei();
    clearTimeout(this.leisteTimer);
    clearTimeout(this.hinweisTimer);
    $("t-hinweis").hidden = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.classList.remove("tafel-modus", "ohne-zeiger");
    this.speichere();
    this.renderGlaeser();
    $("tafel").hidden = true;
    $("planung").hidden = false;
  },

  zeigePhase(index) {
    const anzahl = this.daten.ablauf.length;
    this.aktuell = Math.max(0, Math.min(anzahl - 1, index));
    const p = this.daten.ablauf[this.aktuell];

    this.gesamtMs = p.minuten * 60000;
    this.restMs = this.gesamtMs;
    this.gongGespielt = false;
    this.laeuft = p.minuten > 0;
    this.endeZeit = Date.now() + this.restMs;

    const sozial = $("t-sozial");
    sozial.innerHTML = sozialSvg(p.sozialform);
    if (p.sozialform) sozial.append(SOZIALFORMEN[p.sozialform]);
    sozial.hidden = !p.sozialform;
    $("t-phase").textContent = [p.titel, anzahl > 1 ? `Phase ${this.aktuell + 1} von ${anzahl}` : ""].filter(Boolean).join(" · ");

    $("t-aufgabe").textContent = p.aufgabe;
    $("t-fertig").textContent = p.fertig ? `Fertig? ${p.fertig}` : "";
    const link = this.normalisiereLink(p.link);
    const qr = link ? this.qrSvg(link) : "";
    $("t-qr").innerHTML = qr;
    const hatText = !!(p.aufgabe || p.fertig);
    $("t-mitte").classList.toggle("nur-uhr", !hatText && !qr);
    $("t-inhalt").classList.toggle("ohne-qr", !qr);
    $("t-inhalt").classList.toggle("ohne-text", !hatText);

    $("t-zurueck").disabled = this.aktuell === 0;
    $("t-weiter").disabled = this.aktuell === anzahl - 1;
    this.ampelFuerPhase(p);
    this.tick();
  },

  wechslePhase(richtung) {
    const ziel = this.aktuell + richtung;
    if (ziel < 0 || ziel >= this.daten.ablauf.length) return;
    this.zeigePhase(ziel);
  },

  tick() {
    const p = this.daten.ablauf[this.aktuell];
    if (!p) return;
    const uhr = $("t-uhr");
    const ohneZeit = p.minuten === 0;
    $("t-balken-rahmen").hidden = ohneZeit;
    $("t-pause").disabled = $("t-minus").disabled = $("t-plus").disabled = ohneZeit;

    if (ohneZeit) {
      uhr.textContent = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      uhr.className = "t-uhr";
      $("t-rest").textContent = "ohne Zeitvorgabe";
      return;
    }

    const rest = this.laeuft ? this.endeZeit - Date.now() : this.restMs;
    const sek = Math.max(0, Math.ceil(rest / 1000));
    uhr.textContent = `${String(Math.floor(sek / 60)).padStart(2, "0")}:${String(sek % 60).padStart(2, "0")}`;
    const farbe = sek === 0 ? "rot" : sek <= 60 ? "gelb" : "";
    uhr.className = "t-uhr" + (farbe ? " " + farbe : "");
    const balken = $("t-balken");
    balken.style.width = (this.gesamtMs ? Math.max(0, Math.min(1, rest / this.gesamtMs)) * 100 : 0) + "%";
    balken.className = farbe;

    let text;
    if (sek === 0) text = "Zeit ist um";
    else if (!this.laeuft) text = "pausiert";
    else if (sek <= 60) text = "noch knapp eine Minute";
    else text = `noch ${Math.ceil(sek / 60)} von ${Math.round(this.gesamtMs / 60000)} Minuten`;
    $("t-rest").textContent = text;
    $("t-pause").textContent = this.laeuft || sek === 0 ? "Pause" : "Fortsetzen";

    if (sek === 0 && this.laeuft && !this.gongGespielt) {
      this.gongGespielt = true;
      this.laeuft = false;
      this.restMs = 0;
      if (this.daten.gong) this.gong();
    }
  },

  pausieren() {
    const p = this.daten.ablauf[this.aktuell];
    if (!p || p.minuten === 0) return;
    if (this.laeuft) {
      this.restMs = Math.max(0, this.endeZeit - Date.now());
      this.laeuft = false;
    } else if (this.restMs > 0) {
      this.endeZeit = Date.now() + this.restMs;
      this.laeuft = true;
    }
    this.tick();
  },

  aendereZeit(minuten) {
    const p = this.daten.ablauf[this.aktuell];
    if (!p || p.minuten === 0) return;
    const rest = this.laeuft ? this.endeZeit - Date.now() : this.restMs;
    const neu = Math.max(0, rest + minuten * 60000);
    this.gesamtMs = Math.max(this.gesamtMs, neu);
    if (neu > 0) this.gongGespielt = false;
    if (this.laeuft || (rest <= 0 && neu > 0)) {
      // läuft weiter – oder nach Ablauf per +1 min direkt wieder starten
      this.laeuft = true;
      this.endeZeit = Date.now() + neu;
    } else {
      this.restMs = neu;
    }
    this.tick();
  },

  normalisiereLink(link) {
    const l = (link || "").trim();
    if (!l) return "";
    return /^https?:\/\//i.test(l) ? l : "https://" + l;
  },

  qrSvg(text) {
    try {
      const qr = QR.erzeuge(new TextEncoder().encode(text), "M");
      const n = qr.groesse, rand = 4, b = n + 2 * rand;
      let pfad = "";
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          if (qr.modul[y][x]) pfad += `M${x + rand} ${y + rand}h1v1h-1z`;
      return `<svg viewBox="0 0 ${b} ${b}" role="img" aria-label="QR-Code zum Material">` +
             `<rect width="${b}" height="${b}" fill="#fff"/><path d="${pfad}" fill="#000" shape-rendering="crispEdges"/></svg>`;
    } catch (e) {
      return "";
    }
  },

  zeigeLeiste() {
    const leiste = $("t-leiste");
    leiste.classList.remove("leise");
    document.body.classList.remove("ohne-zeiger");
    clearTimeout(this.leisteTimer);
    this.leisteTimer = setTimeout(() => {
      if (leiste.matches(":hover")) return;
      leiste.classList.add("leise");
      document.body.classList.add("ohne-zeiger");
    }, 4000);
  },

  zeigeHinweis(text, dauerMs) {
    const hinweis = $("t-hinweis");
    hinweis.textContent = text;
    hinweis.hidden = false;
    clearTimeout(this.hinweisTimer);
    if (dauerMs) this.hinweisTimer = setTimeout(() => { hinweis.hidden = true; }, dauerMs);
  },

  toggleVollbild() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => this.meldung("Vollbild ist auf diesem Gerät nicht möglich."));
  },

  async halteWach() {
    try {
      if ("wakeLock" in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request("screen");
        this.wakeLock.addEventListener("release", () => { this.wakeLock = null; });
      }
    } catch (e) { /* nicht unterstützt – ohne Folgen */ }
  },

  gibWachFrei() {
    if (this.wakeLock) this.wakeLock.release().catch(() => {});
    this.wakeLock = null;
  },

  // ------------------------------------------------ Murmelglas an der Tafel

  renderGlasTafel(neu) {
    const glas = this.aktivesGlas();
    $("t-glas").hidden = !glas;
    $("t-glas-knoepfe").hidden = !glas;
    if (!glas) return;
    $("t-glas-bild").innerHTML = this.glasSvg(glas, neu);
    $("t-glas-zahl").textContent = `${glas.murmeln} von ${glas.groesse}`;
    $("t-glas").classList.toggle("voll", glas.murmeln >= glas.groesse);
    $("t-glas").title = `Murmelglas ${this.daten.glas}` + (glas.belohnung ? ` – Belohnung: ${glas.belohnung}` : "");
    $("t-glas-plus").disabled = glas.murmeln >= glas.groesse;
    $("t-glas-minus").disabled = glas.murmeln <= 0;
  },

  // Glas mit Murmeln als SVG; die Murmeln füllen es Reihe für Reihe von unten
  glasSvg(glas, neu) {
    const breite = 44, hoehe = 54;
    let spalten = 3;
    while (Math.ceil(glas.groesse / spalten) * (breite / spalten) > hoehe) spalten++;
    const d = breite / spalten, r = d * 0.42;
    let kreise = "";
    for (let i = 0; i < glas.murmeln; i++) {
      const cx = 8 + d * ((i % spalten) + 0.5);
      const cy = 79 - d * (Math.floor(i / spalten) + 0.5);
      const farbe = GLAS_FARBEN[(i * 3 + (i >> 2)) % GLAS_FARBEN.length];
      const klasse = neu && i === glas.murmeln - 1 ? ' class="neu"' : "";
      kreise += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${farbe}"${klasse}/>`;
    }
    return '<svg viewBox="0 0 60 84" aria-hidden="true">' +
           '<rect x="12" y="4" width="36" height="7" rx="2" class="deckel"/>' +
           '<path d="M14 11h32v5c4 2 6 5 6 9v48c0 5-3 8-8 8H16c-5 0-8-3-8-8V25c0-4 2-7 6-9z" class="glas"/>' +
           kreise + "</svg>";
  },

  aendereMurmeln(anzahl) {
    const glas = this.aktivesGlas();
    if (!glas) return;
    const vorher = glas.murmeln;
    glas.murmeln = Math.max(0, Math.min(glas.groesse, glas.murmeln + anzahl));
    if (glas.murmeln === vorher) return;
    this.speichere();
    this.renderGlasTafel(anzahl > 0);
    if (anzahl > 0 && glas.murmeln >= glas.groesse) this.feiere(glas);
  },

  // Nur bei grüner Ampel, laufender Zeit (oder Phase ohne Zeitvorgabe) und nicht vollem Glas
  sammle(dt) {
    const glas = this.aktivesGlas();
    const p = this.daten.ablauf[this.aktuell];
    if (!glas || !p || glas.murmeln >= glas.groesse) return;
    if (p.minuten > 0 && !this.laeuft) return;
    glas.gruenMs += dt * 1000;
    const proMurmel = glas.minuten * 60000;
    if (glas.gruenMs >= proMurmel) {
      glas.gruenMs -= proMurmel;
      this.aendereMurmeln(1);
    }
  },

  feiere(glas) {
    this.zeigeHinweis("Das Murmelglas ist voll – geschafft!" + (glas.belohnung ? `\nBelohnung: ${glas.belohnung}` : ""), 8000);
    if (this.daten.gong) this.gong([523.25, 659.25, 783.99]);
  },

  // ------------------------------------------------ Ton

  async holeMikro() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const f = new Error("keine mediaDevices"); f.name = "KeineSchnittstelle"; throw f;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
    } catch (e) {
      // manche Geräte lehnen die Sonderwünsche ab – dann mit Standardeinstellungen versuchen
      if (e && (e.name === "OverconstrainedError" || e.name === "TypeError"))
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      throw e;
    }
  },
  mikroFehler(e) {
    const name = (e && e.name) || "Fehler";
    const texte = {
      NotAllowedError:    "Mikrofon nicht erlaubt – im Browser freigeben",
      SecurityError:      "Mikrofon vom Server/Browser gesperrt",
      NotFoundError:      "Kein Mikrofon gefunden",
      OverconstrainedError: "Mikrofon passt nicht",
      NotReadableError:   "Mikrofon wird von anderer App benutzt",
      AbortError:         "Mikrofon wird von anderer App benutzt",
      KeineSchnittstelle: window.isSecureContext ? "Mikrofon hier nicht möglich – in Safari/Chrome öffnen"
                                                 : "Mikrofon nur über https möglich"
    };
    $("t-ampel-text").textContent = (texte[name] || "Mikrofon nicht verfügbar") + " · antippen = erneut";
    $("t-ampel").title = name + (e && e.message ? ": " + e.message : "");
    $("t-ampel").style.cursor = "pointer";
    console.warn("Tafel – Mikrofon:", name, e);
    this.mikroFehlt = true;
    if (!this.mikroKlickBereit) {
      this.mikroKlickBereit = true;
      $("t-ampel").addEventListener("click", () => {
        if (!this.mikroFehlt || this.audio) return;
        $("t-ampel-text").textContent = "Mikrofon wird gestartet …";
        this.audioKontext();          // direkt aus dem Antippen heraus – wichtig für iPad/iPhone
        this.starteMikro();
      });
    }
  },
  audioKontext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!this.audioCtx && Ctx) this.audioCtx = new Ctx();
    if (this.audioCtx && this.audioCtx.state === "suspended") this.audioCtx.resume().catch(() => {});
    return this.audioCtx;
  },

  // Leiser Gong aus mehreren Tönen, im Browser erzeugt (keine Tondatei nötig)
  gong(toene = [523.25, 659.25]) {
    const ctx = this.audioKontext();
    if (!ctx) return;
    const t = ctx.currentTime;
    toene.forEach((frequenz, i) => {
      const versatz = i * 0.2;
      const osc = ctx.createOscillator();
      const lautstaerke = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequenz;
      lautstaerke.gain.setValueAtTime(0.0001, t + versatz);
      lautstaerke.gain.exponentialRampToValueAtTime(0.25, t + versatz + 0.02);
      lautstaerke.gain.exponentialRampToValueAtTime(0.0001, t + versatz + 2.2);
      osc.connect(lautstaerke).connect(ctx.destination);
      osc.start(t + versatz);
      osc.stop(t + versatz + 2.3);
    });
  },

  // ------------------------------------------------ Lärmampel

  ampelFuerPhase(p) {
    const aktiv = p.laut !== "aus";
    $("t-ampel").hidden = !aktiv;
    $("t-ampel-regler").hidden = !aktiv;
    if (!aktiv) { this.stoppeMikro(); return; }
    $("t-ampel-text").textContent = LAUTSTAERKEN[p.laut].name;
    this.starteMikro();
  },

  async starteMikro() {
    if (this.audio || this.mikroStartet) return;
    this.mikroStartet = true;
    try {
      const stream = await this.holeMikro();
      // Inzwischen nicht mehr gebraucht (Tafel beendet oder Phase ohne Ampel)?
      const p = this.daten.ablauf[this.aktuell];
      if ($("tafel").hidden || !p || p.laut === "aus") {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      const ctx = this.audioKontext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const quelle = ctx.createMediaStreamSource(stream);
      quelle.connect(analyser);
      this.audio = { stream, quelle, analyser, puffer: new Float32Array(analyser.fftSize), zuletzt: performance.now() };
      this.pegelDb = null; this.mikroFehlt = false;
      if (this.basisDb === null) this.kalibriere();
      this.ampelSchleife();
    } catch (e) {
      this.mikroFehler(e);
      this.setzeAmpel(null);
    } finally {
      this.mikroStartet = false;
    }
  },

  stoppeMikro() {
    if (!this.audio) return;
    cancelAnimationFrame(this.ampelRaf);
    this.audio.quelle.disconnect();
    this.audio.stream.getTracks().forEach(t => t.stop());
    this.audio = null;
    if (this.kalibrierung) $("t-hinweis").hidden = true;
    this.kalibrierung = null;
  },

  // Aktueller Schallpegel in dB (relativ, nicht geeicht)
  messeDb() {
    const { analyser, puffer } = this.audio;
    analyser.getFloatTimeDomainData(puffer);
    let summe = 0;
    for (let i = 0; i < puffer.length; i++) summe += puffer[i] * puffer[i];
    return 20 * Math.log10(Math.max(Math.sqrt(summe / puffer.length), 1e-8));
  },

  ampelSchleife() {
    if (!this.audio) return;
    const jetzt = performance.now();
    const dt = Math.min(0.5, (jetzt - this.audio.zuletzt) / 1000);
    this.audio.zuletzt = jetzt;
    const db = this.messeDb();
    // Träge Anzeige: gleitender Mittelwert mit etwa 2,5 s Zeitkonstante
    const anteil = 1 - Math.exp(-dt / 2.5);
    this.pegelDb = this.pegelDb === null ? db : this.pegelDb + (db - this.pegelDb) * anteil;

    if (this.kalibrierung) {
      this.kalibrierung.werte.push(db);
      if (jetzt >= this.kalibrierung.bis) this.beendeKalibrierung();
    } else if (this.basisDb !== null) {
      const stufe = LAUTSTAERKEN[this.daten.ablauf[this.aktuell].laut];
      if (stufe && stufe.grenze !== undefined) {
        const ueber = this.pegelDb - (this.basisDb + stufe.grenze - this.daten.empfindlichkeit);
        const farbe = ueber <= 0 ? "gruen" : ueber <= 6 ? "gelb" : "rot";
        this.setzeAmpel(farbe);
        if (farbe === "gruen") this.sammle(dt);
      }
    }
    this.ampelRaf = requestAnimationFrame(() => this.ampelSchleife());
  },

  kalibriere() {
    if (!this.audio) {
      this.basisDb = null;   // Mikrofon startet und misst dann automatisch
      this.starteMikro();
      return;
    }
    this.kalibrierung = { werte: [], bis: performance.now() + 3000 };
    this.setzeAmpel(null);
    this.zeigeHinweis("Einen Moment Ruhe bitte – die Lärmampel misst die Grundlautstärke …", 0);
  },

  beendeKalibrierung() {
    const werte = this.kalibrierung.werte.sort((x, y) => x - y);
    this.basisDb = werte.length ? werte[Math.floor(werte.length / 2)] : -60;   // Median
    this.pegelDb = this.basisDb;
    this.kalibrierung = null;
    $("t-hinweis").hidden = true;
  },

  setzeAmpel(stufe) {
    document.querySelectorAll("#t-ampel .licht").forEach(l => l.classList.toggle("an", l.dataset.stufe === stufe));
  },

  // ------------------------------------------------ Allgemeines

  initDesign() {
    let gespeichert = null;
    try { gespeichert = localStorage.getItem(DESIGN); } catch (e) { /* ohne Speicher */ }
    const dunkel = gespeichert ? gespeichert === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    this.setzeDesign(dunkel ? "dunkel" : "hell");
  },

  setzeDesign(design) {
    document.documentElement.dataset.design = design;
    $("btn-design").textContent = design === "dunkel" ? "Hell" : "Dunkel";
  },

  meldung(text) {
    const m = $("meldung");
    m.textContent = text;
    m.hidden = false;
    clearTimeout(this.meldungTimer);
    this.meldungTimer = setTimeout(() => { m.hidden = true; }, 4000);
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
