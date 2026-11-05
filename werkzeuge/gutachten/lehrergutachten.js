"use strict";
/*
 * Gutachten-Generator (Lehrergutachten) – Version 2.1.1
 * © 2025–2026 St.-Antonius-Gymnasium Lüdinghausen – Apache License 2.0 (SPDX-License-Identifier: Apache-2.0)
 * Benötigt saetze.js (Satzbank), die vor dieser Datei geladen wird.
 */

const NOTEN = ["sehr gut", "gut", "befriedigend", "ausreichend", "mangelhaft", "ungenügend"];
const FAECHER = [
  "Biologie", "Chemie", "Deutsch", "Englisch", "Ethik", "Französisch", "Geografie", "Geschichte",
  "Informatik", "Kunst", "Latein", "Literatur", "Mathematik", "Musik", "Pädagogik", "Philosophie",
  "Physik", "Physik-BIO-Chemie (PBC)", "Politik", "Psychologie", "Religion", "Sozialkunde",
  "Sozialwissenschaften", "Spanisch", "Sport", "Technik", "Wirtschaft", "Wirtschaft-Politik"
];
const SPEICHER_DATEN = "lehrergutachten2-daten";
const SPEICHER_EINSTELLUNGEN = "lehrergutachten2-einstellungen";
const SPEICHER_ALTDATEN_GEFRAGT = "lehrergutachten2-altdaten-gefragt";
const ALTE_SCHLUESSEL = ["lehrergutachtenData", "lehrergutachtenSecurity"];
const PBKDF2_ITERATIONEN = 600000;
const INFO_FELDER = ["vorname", "nachname", "fach", "lerngruppe", "von", "bis", "besuche", "grundlagen"];
const ABSCHLUSS_FELDER = ["ort", "ausstellung", "verfasser"];
const PLATZHALTER = ["{PERSON}", "{SEIN_IHR}", "{SEINE_IHRE}"];
// Wörter, die bei der Wiederholungsprüfung nicht zählen, weil sie zwangsläufig häufig vorkommen
const STOPPWOERTER = new Set([
  "nicht", "werden", "schülerinnen", "schüler", "lernenden", "lerngruppe", "unterricht", "unterrichts",
  "stunden", "stunde", "eigenen", "eigene", "einer", "eines", "einem", "einen", "dabei", "sowie",
  "diese", "dieser", "dieses", "deren"
]);

const $ = id => document.getElementById(id);

function neuerZustand() {
  return {
    format: 2,
    info: { anrede: "", vorname: "", nachname: "", fach: "", lerngruppe: "", von: "", bis: "", besuche: "", grundlagen: "" },
    noten: {},
    belege: {},
    gesamtnote: 0,
    zusammenfassung: "",
    ort: "",
    ausstellung: "",
    verfasser: "",
    dokument: null,
    ansicht: { bereich: "allgemein", feld: 0 }
  };
}

function datum(iso) {
  if (!iso) return "";
  const [jahr, monat, tag] = iso.split("-");
  return `${tag}.${monat}.${jahr}`;
}

function heuteIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function grossAnfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Ergänzt einen Punkt, wenn ein frei eingegebener Text ohne Satzzeichen endet.
function satzende(text) {
  const t = text.trim();
  return t && !/[.!?…:"“”»)]$/.test(t) ? t + "." : t;
}

function anfangVon(vorlage) {
  if (vorlage.startsWith("{PERSON}")) return "p";
  if (vorlage.startsWith("{SEIN")) return "s";
  return "x";
}

function sortiert(objekt) {
  return Object.keys(objekt).sort().map(k => [k, objekt[k]]);
}

// Liefert die aussagekräftigen Wörter eines Textes (ab 5 Buchstaben, ohne Stoppwörter).
function signalwoerter(text) {
  return text.replace(/\{[A-Z_]+\}/g, " ").toLowerCase()
    .split(/[^a-zäöüß]+/)
    .filter(w => w.length >= 5 && !STOPPWOERTER.has(w));
}

function zuBase64(bytes) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(text);
}

function vonBase64(base64) {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

const App = {
  zustand: neuerZustand(),
  einstellungen: { verschluesselung: false, ablaufTage: 0, sperreMinuten: 0 },
  kryptoVerfuegbar: false,
  schluessel: null,
  salz: null,
  iterationen: PBKDF2_ITERATIONEN,
  gesperrt: false,
  zuletztBearbeitet: Date.now(),
  speicherTimer: null,
  ablauf: null,                                      // { tage, seit }, wenn die Löschfrist abgelaufen ist
  speicherNummer: 0,
  sperrTimer: null,
  kriterienListe: [],
  kriterienIndex: Object.create(null),               // ohne Prototyp: nur echte Kriterien-IDs liefern einen Treffer

  // ---------------------------------------------------------------- Start

  init() {
    if (typeof SATZBANK === "undefined") {
      alert("Die Datei saetze.js wurde nicht gefunden. Sie muss im selben Ordner wie index.html liegen.");
      return;
    }
    SATZBANK.handlungsfelder.forEach(feld => feld.kriterien.forEach(k => {
      this.kriterienListe.push(k);
      this.kriterienIndex[k.id] = k;
    }));
    const fach = $("fach");
    FAECHER.forEach(f => fach.add(new Option(f, f)));

    this.bindeEreignisse();
    this.ladeEinstellungen();
    this.pruefeAltdaten();
    let status = this.ladeLokal();
    if (this.ablauf && this.frageAblauf()) status = "leer";

    // Verschlüsselung ist eingestellt, es gibt aber keine verschlüsselten Daten (z. B. nach automatischer Löschung).
    // Ohne Schlüssel könnte dann nichts gespeichert werden – daher Einstellung zurücksetzen.
    if (status !== "gesperrt" && this.einstellungen.verschluesselung) {
      this.einstellungen.verschluesselung = false;
      this.einstellungen.sperreMinuten = 0;
      this.sichereEinstellungen();
      this.meldung("Es sind keine verschlüsselten Daten mehr vorhanden. Bitte aktivieren Sie die Verschlüsselung bei Bedarf in den Einstellungen neu.", "warnung");
    }

    this.aktualisiereSchloss();
    this.starteSperrTimer();

    if (status === "gesperrt") {
      this.zeige("allgemein");
      this.entsperren();
    } else {
      this.zeige(this.zustand.ansicht.bereich || "allgemein");
    }
  },

  bindeEreignisse() {
    $("info-form").addEventListener("submit", e => e.preventDefault());   // Eingabetaste schickt nichts ab
    document.querySelectorAll("nav button[data-ziel]").forEach(b =>
      b.addEventListener("click", () => this.zeige(b.dataset.ziel)));

    $("schloss").addEventListener("click", () => (this.gesperrt ? this.entsperren() : this.oeffneEinstellungen()));
    $("btn-neu").addEventListener("click", () => this.neu());
    $("btn-sicherung").addEventListener("click", () => this.sicherungSpeichern());
    $("btn-laden").addEventListener("click", () => $("datei").click());
    $("datei").addEventListener("change", e => {
      const datei = e.target.files[0];
      e.target.value = "";
      if (datei) this.sicherungLaden(datei);
    });
    $("btn-einstellungen").addEventListener("click", () => this.oeffneEinstellungen());

    // Allgemeine Angaben
    const infoGeaendert = () => {
      this.leseInfo();
      $("info-fehler").textContent = "";
      this.speichern();
    };
    $("info-form").addEventListener("input", infoGeaendert);
    $("info-form").addEventListener("change", infoGeaendert);
    $("info-weiter").addEventListener("click", () => {
      this.leseInfo();
      const fehler = this.infoFehler();
      if (fehler) {
        $("info-fehler").textContent = fehler;
        return;
      }
      this.zustand.ansicht.feld = 0;
      this.zeige("bewertung");
    });

    // Bewertung (jeweils genau ein Listener pro Schaltfläche)
    $("feld-zurueck").addEventListener("click", () => {
      if (this.zustand.ansicht.feld > 0) {
        this.zustand.ansicht.feld--;
        this.zeige("bewertung");
      } else {
        this.zeige("allgemein");
      }
    });
    $("feld-weiter").addEventListener("click", () => {
      if (this.zustand.ansicht.feld < SATZBANK.handlungsfelder.length - 1) {
        this.zustand.ansicht.feld++;
        this.zeige("bewertung");
      } else {
        this.zeige("abschluss");
      }
    });

    // Abschluss
    $("gesamtnote").addEventListener("change", () => {
      this.zustand.gesamtnote = parseInt($("gesamtnote").value, 10) || 0;
      this.speichern();
    });
    $("zusammenfassung").addEventListener("input", () => {
      this.zustand.zusammenfassung = $("zusammenfassung").value;
      this.speichern();
    });
    ABSCHLUSS_FELDER.forEach(id => $(id).addEventListener("input", () => {
      this.zustand[id] = $(id).value;
      this.speichern();
    }));
    $("abschluss-zurueck").addEventListener("click", () => {
      this.zustand.ansicht.feld = SATZBANK.handlungsfelder.length - 1;
      this.zeige("bewertung");
    });
    $("abschluss-weiter").addEventListener("click", () => this.zeige("vorschau"));

    // Vorschau
    $("vorschau-zurueck").addEventListener("click", () => this.zeige("abschluss"));
    $("btn-neu-erzeugen").addEventListener("click", () => this.neuErzeugen());
    $("veraltet-erzeugen").addEventListener("click", () => this.neuErzeugen());
    $("btn-kopieren").addEventListener("click", () => this.kopieren());
    $("btn-txt").addEventListener("click", () => this.exportiereText());
    $("btn-odt").addEventListener("click", () => this.exportiereOdt());
    $("btn-drucken").addEventListener("click", () => this.drucken());

    // Einstellungen
    $("e-verschl").addEventListener("change", () => {
      $("e-pw-block").hidden = !($("e-verschl").checked && !this.schluessel);
    });
    $("e-abbrechen").addEventListener("click", () => $("dlg-einstellungen").close());
    $("e-speichern").addEventListener("click", () => this.speichereEinstellungen());

    // Inaktivität – "capture", damit auch Scrollen innerhalb von Bereichen zählt
    ["mousedown", "keydown", "touchstart", "scroll"].forEach(ereignis =>
      document.addEventListener(ereignis, () => { if (this.sperrTimer) this.starteSperrTimer(); },
        { passive: true, capture: true }));

    window.addEventListener("pagehide", () => this.speichernJetzt());
    // In einem zweiten Tab geändert: warnen, sonst überschreibt dieser Tab den anderen Stand beim nächsten Speichern
    window.addEventListener("storage", e => {
      if (e.key === SPEICHER_DATEN)
        this.meldung("Das Gutachten wurde in einem anderen Tab oder Fenster geändert. Bitte nur in einem Tab arbeiten und diese Seite neu laden, bevor Sie weiterschreiben.", "warnung");
    });
  },

  ladeEinstellungen() {
    this.kryptoVerfuegbar = !!(window.isSecureContext && window.crypto && window.crypto.subtle);
    try {
      const g = JSON.parse(localStorage.getItem(SPEICHER_EINSTELLUNGEN));
      if (g && typeof g === "object") {
        const ganz = (v, max) => Number.isInteger(v) && v >= 0 && v <= max ? v : 0;
        this.einstellungen.verschluesselung = g.verschluesselung === true;
        this.einstellungen.ablaufTage = ganz(g.ablaufTage, 365);
        this.einstellungen.sperreMinuten = ganz(g.sperreMinuten, 1440);
      }
    } catch (e) {
      console.warn("Einstellungen konnten nicht gelesen werden.", e);
    }
  },

  // ---------------------------------------------------------------- Navigation

  zeige(bereich) {
    if (["bewertung", "abschluss", "vorschau"].includes(bereich)) {
      const fehler = this.infoFehler();
      if (fehler) {
        $("info-fehler").textContent = fehler;
        this.meldung("Bitte vervollständigen Sie zuerst die allgemeinen Angaben.", "warnung");
        bereich = "allgemein";
      }
    }
    document.querySelectorAll("main > section").forEach(s => { s.hidden = s.id !== "s-" + bereich; });
    document.querySelectorAll("nav button[data-ziel]").forEach(b => b.classList.toggle("aktiv", b.dataset.ziel === bereich));
    this.zustand.ansicht.bereich = bereich;

    if (bereich === "bewertung") this.zeigeFeld();
    if (bereich === "abschluss") this.zeigeAbschluss();
    if (bereich === "vorschau") this.zeigeVorschau();
    if (bereich === "satzbank") this.zeigeSatzbank();

    this.speichern(false); // Seitenwechsel ist keine Bearbeitung
    window.scrollTo(0, 0);
  },

  meldung(text, art = "info") {
    const element = document.createElement("div");
    element.className = "meldung meldung-" + art;
    element.textContent = text;
    $("meldungen").appendChild(element);
    setTimeout(() => element.remove(), 6000);
  },

  liste(eintraege) {
    const ul = document.createElement("ul");
    eintraege.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    return ul;
  },

  // ---------------------------------------------------------------- Allgemeine Angaben

  leseInfo() {
    const info = this.zustand.info;
    const anrede = document.querySelector('input[name="anrede"]:checked');
    info.anrede = anrede ? anrede.value : "";
    INFO_FELDER.forEach(f => { info[f] = $(f).value.trim(); });
  },

  schreibeInfo() {
    const info = this.zustand.info;
    document.querySelectorAll('input[name="anrede"]').forEach(r => { r.checked = r.value === info.anrede; });
    INFO_FELDER.forEach(f => { $(f).value = info[f] || ""; });
    ABSCHLUSS_FELDER.forEach(f => { $(f).value = this.zustand[f] || ""; });
  },

  infoFehler() {
    const i = this.zustand.info;
    if (!i.anrede || !i.vorname || !i.nachname || !i.fach || !i.lerngruppe || !i.von || !i.bis) {
      return "Bitte füllen Sie alle Pflichtfelder aus (Anrede, Name, Fach, Lerngruppe, Zeitraum).";
    }
    if (i.von > i.bis) return "Das Startdatum muss vor dem Enddatum liegen.";
    return "";
  },

  // ---------------------------------------------------------------- Bewertung

  zeigeFeld() {
    const felder = SATZBANK.handlungsfelder;
    let index = this.zustand.ansicht.feld;
    if (!(index >= 0 && index < felder.length)) index = this.zustand.ansicht.feld = 0;
    const feld = felder[index];

    $("feld-titel").textContent = `${feld.id} – ${feld.titel}`;
    $("feld-zaehler").textContent = `Handlungsfeld ${index + 1} von ${felder.length}`;
    $("feld-hilfe").textContent = feld.hilfe;
    $("feld-zurueck").textContent = index === 0 ? "Zurück zu Allgemeines" : "Zurück";
    $("feld-weiter").textContent = index === felder.length - 1 ? "Weiter zum Abschluss" : "Weiter";

    const liste = $("kriterien-liste");
    liste.innerHTML = "";
    feld.kriterien.forEach(k => liste.appendChild(this.baueKriterium(k)));
    this.aktualisiereFortschritt();
  },

  baueKriterium(krit) {
    const box = document.createElement("div");
    box.className = "kriterium";

    const kopf = document.createElement("div");
    kopf.className = "kriterium-kopf";
    const name = document.createElement("strong");
    name.textContent = krit.name;
    const hilfe = document.createElement("span");
    hilfe.className = "hinweis";
    hilfe.textContent = krit.hilfe;
    kopf.append(name, hilfe);

    const noten = document.createElement("div");
    noten.className = "noten";
    noten.setAttribute("role", "radiogroup");
    noten.setAttribute("aria-label", krit.name);
    const aktuell = this.zustand.noten[krit.id] || 0;
    [1, 2, 3, 4, 5, 6, 0].forEach(n => {
      const label = document.createElement("label");
      label.className = "note-wahl";
      const eingabe = document.createElement("input");
      eingabe.type = "radio";
      eingabe.name = "note-" + krit.id;
      eingabe.value = String(n);
      eingabe.checked = aktuell === n;
      eingabe.addEventListener("change", () => {
        if (n === 0) delete this.zustand.noten[krit.id];
        else this.zustand.noten[krit.id] = n;
        this.aktualisiereFortschritt();
        this.speichern();
      });
      label.append(eingabe, document.createTextNode(n === 0 ? "nicht bewertet" : NOTEN[n - 1]));
      noten.appendChild(label);
    });

    const details = document.createElement("details");
    const titel = document.createElement("summary");
    titel.textContent = "Beobachtung als Beleg ergänzen (optional)";
    const feld = document.createElement("textarea");
    feld.rows = 2;
    feld.placeholder = "z. B.: In der Stunde zur Weimarer Verfassung wurden die Beiträge der Lernenden gezielt miteinander verknüpft.";
    feld.value = this.zustand.belege[krit.id] || "";
    details.open = !!feld.value;
    feld.addEventListener("input", () => {
      if (feld.value.trim()) this.zustand.belege[krit.id] = feld.value;
      else delete this.zustand.belege[krit.id];
      this.speichern();
    });
    details.append(titel, feld);

    box.append(kopf, noten, details);
    return box;
  },

  aktualisiereFortschritt() {
    const gesamt = this.kriterienListe.length;
    const bewertet = this.kriterienListe.filter(k => this.zustand.noten[k.id]).length;
    $("fortschritt-balken").style.width = Math.round(bewertet / gesamt * 100) + "%";
    $("fortschritt-text").textContent = `${bewertet} von ${gesamt} Kriterien bewertet`;
  },

  // ---------------------------------------------------------------- Abschluss

  zeigeAbschluss() {
    const werte = this.kriterienListe.map(k => this.zustand.noten[k.id]).filter(n => n >= 1 && n <= 6);
    $("durchschnitt").textContent = werte.length
      ? (werte.reduce((a, b) => a + b, 0) / werte.length).toFixed(1).replace(".", ",") + ` (aus ${werte.length} Einzelbewertungen)`
      : "noch keine Einzelbewertungen";
    if (!this.zustand.ausstellung) this.zustand.ausstellung = heuteIso();
    $("gesamtnote").value = String(this.zustand.gesamtnote || 0);
    $("zusammenfassung").value = this.zustand.zusammenfassung;
    ABSCHLUSS_FELDER.forEach(id => { $(id).value = this.zustand[id] || ""; });
  },

  // ---------------------------------------------------------------- Textgenerierung

  personFormen(info = this.zustand.info) {
    const voll = `${info.vorname} ${info.nachname}`;
    if (info.anrede === "herr" || info.anrede === "frau") {
      const herr = info.anrede === "herr";
      return {
        neutral: false,
        nomVoll: `${herr ? "Herr" : "Frau"} ${voll}`,
        nom: `${herr ? "Herr" : "Frau"} ${info.nachname}`,
        datVoll: `${herr ? "Herrn" : "Frau"} ${voll}`,
        dat: `${herr ? "Herrn" : "Frau"} ${info.nachname}`,
        pronomen: herr ? "er" : "sie",
        seinIhr: herr ? "Sein" : "Ihr",
        seineIhre: herr ? "Seine" : "Ihre"
      };
    }
    const genitiv = voll + (/[sßxz]$/i.test(voll) ? "’" : "s");
    return { neutral: true, nomVoll: voll, nom: voll, datVoll: voll, dat: voll, pronomen: null, seinIhr: genitiv, seineIhre: genitiv };
  },

  // Ersetzt die Platzhalter. Ein Pronomen wird nur verwendet, wenn der vorherige Satz
  // die Person mit Namen genannt hat – so bleibt der Bezug eindeutig.
  setzeEin(vorlage, { formen, vorherName }) {
    let text = vorlage;
    let nennung = "keine";
    if (text.includes("{PERSON}")) {
      const pronomen = !formen.neutral && vorherName;
      text = text.split("{PERSON}").join(pronomen ? formen.pronomen : formen.nom);
      nennung = pronomen ? "pronomen" : "name";
    }
    text = text.split("{SEIN_IHR}").join(formen.seinIhr).split("{SEINE_IHRE}").join(formen.seineIhre);
    return { text: grossAnfang(text), nennung };
  },

  // Bewertet jede Variante: neues Leitwort stark bevorzugt, bereits verwendete Wörter bestraft,
  // drei gleiche Satzanfänge hintereinander möglichst vermieden, bei gewünschter Überleitung
  // Sätze mit der Person am Anfang bevorzugt.
  waehleVariante(krit, note, kontext, ausschliessen) {
    const varianten = krit.saetze[note] || [];
    let besteIndex = -1;
    let besterWert = -Infinity;
    varianten.forEach((variante, index) => {
      if (index === ausschliessen && varianten.length > 1) return;
      const anfang = anfangVon(variante[0]);
      let wert = Math.random();
      if (!kontext.leitwoerter.has(variante[1])) wert += 10;
      const ueberschneidungen = signalwoerter(variante[0]).filter(w => kontext.woerter.has(w)).length;
      wert -= 1.5 * ueberschneidungen;
      const letzte = kontext.letzteAnfaenge.slice(-2);
      if (letzte.length === 2 && letzte[0] === anfang && letzte[1] === anfang) wert -= 4;
      if (kontext.brueckeGewuenscht && anfang === "p") wert += 2;
      if (wert > besterWert) {
        besterWert = wert;
        besteIndex = index;
      }
    });
    return besteIndex;
  },

  waehleBruecke(richtung, krit, benutzt) {
    const alle = SATZBANK.bruecken[richtung];
    const frei = alle.filter(b => !benutzt.has(b));
    const auswahl = frei.length ? frei : alle;
    const bruecke = auswahl[Math.floor(Math.random() * auswahl.length)];
    benutzt.add(bruecke);
    return bruecke.replace("{BEZ}", krit.bez);
  },

  textElement(text) {
    return { art: "text", text, bearbeitet: false };
  },

  erzeugeDokument() {
    const info = this.zustand.info;
    const formen = this.personFormen();
    const abschnitte = [];

    // Einleitung
    const einleitung = [this.textElement(
      `Grundlage dieses Gutachtens ist die Tätigkeit von ${formen.datVoll} im Fach ${info.fach} in der Lerngruppe ${info.lerngruppe} im Zeitraum vom ${datum(info.von)} bis zum ${datum(info.bis)}.`)];
    const besuche = parseInt(info.besuche, 10);
    if (besuche === 1) einleitung.push(this.textElement("In diesem Zeitraum wurde eine Unterrichtsstunde besucht."));
    else if (besuche > 1) einleitung.push(this.textElement(`In diesem Zeitraum wurden ${besuche} Unterrichtsstunden besucht.`));
    if (info.grundlagen) einleitung.push(this.textElement(satzende(info.grundlagen)));
    abschnitte.push({ titel: null, elemente: einleitung });

    // Hauptteil nach Handlungsfeldern
    const kontext = { leitwoerter: new Set(), woerter: new Set(), letzteAnfaenge: [], brueckeGewuenscht: false };
    const brueckenBenutzt = new Set();

    SATZBANK.handlungsfelder.forEach(feld => {
      const elemente = [];
      let vorherName = false;
      let vorherNote = 0;
      let vorherBruecke = false;
      let brueckenImAbschnitt = 0;

      feld.kriterien.forEach(krit => {
        const note = this.zustand.noten[krit.id];
        if (!note) return;
        const differenz = vorherNote ? note - vorherNote : 0; // positiv = schlechter
        kontext.brueckeGewuenscht = differenz !== 0 && !vorherBruecke && brueckenImAbschnitt < 2;
        const index = this.waehleVariante(krit, note, kontext, -1);
        if (index < 0) return;
        const [vorlage, leitwort] = krit.saetze[note][index];

        let bruecke = "";
        if (kontext.brueckeGewuenscht && anfangVon(vorlage) === "p") {
          bruecke = this.waehleBruecke(differenz > 0 ? "schlechter" : "besser", krit, brueckenBenutzt);
          brueckenImAbschnitt++;
        }
        // Nach einer Überleitung immer den Namen verwenden, sonst wäre das Pronomen mehrdeutig.
        const ergebnis = this.setzeEin(vorlage, { formen, vorherName: bruecke ? false : vorherName });
        elemente.push({
          art: "satz", krit: krit.id, note, variante: index, leitwort, bruecke,
          nennung: ergebnis.nennung, text: bruecke + ergebnis.text, bearbeitet: false
        });
        kontext.leitwoerter.add(leitwort);
        signalwoerter(bruecke + " " + vorlage).forEach(w => kontext.woerter.add(w));
        kontext.letzteAnfaenge.push(anfangVon(vorlage));
        vorherName = ergebnis.nennung === "name";
        vorherBruecke = !!bruecke;
        vorherNote = note;

        const beleg = satzende(this.zustand.belege[krit.id] || "");
        if (beleg) {
          elemente.push({ art: "beleg", krit: krit.id, text: beleg, bearbeitet: false });
          signalwoerter(beleg).forEach(w => kontext.woerter.add(w));
          vorherName = false;
          kontext.letzteAnfaenge.push("x");
        }
      });
      if (elemente.length) abschnitte.push({ titel: feld.titel, elemente });
    });

    // Zusammenfassung
    const schluss = [];
    const zusammenfassung = satzende(this.zustand.zusammenfassung);
    if (zusammenfassung) schluss.push(this.textElement(zusammenfassung));
    const g = this.zustand.gesamtnote;
    if (g >= 1 && g <= 6) {
      schluss.push(this.textElement(
        `Zusammenfassend werden die Leistungen von ${formen.dat} im Fach ${info.fach} in der Lerngruppe ${info.lerngruppe} mit der Note „${NOTEN[g - 1]}“ (${g}) bewertet.`));
    }
    if (schluss.length) abschnitte.push({ titel: "Zusammenfassung", elemente: schluss });

    this.zustand.dokument = { abschnitte, signatur: this.signatur(), erstellt: Date.now() };
  },

  signatur() {
    const z = this.zustand;
    return JSON.stringify([z.info, sortiert(z.noten), sortiert(z.belege), z.gesamtnote, z.zusammenfassung]);
  },

  // ---------------------------------------------------------------- Vorschau

  zeigeVorschau() {
    if (!this.zustand.dokument) this.erzeugeDokument();
    $("veraltet").hidden = this.zustand.dokument.signatur === this.signatur();
    if (!this.kriterienListe.some(k => this.zustand.noten[k.id])) {
      this.meldung("Es ist noch kein Kriterium bewertet.", "warnung");
    }
    this.rendereDokument();
  },

  kopfzeile() {
    const i = this.zustand.info;
    return `${this.personFormen().nomVoll} · Fach: ${i.fach} · Lerngruppe: ${i.lerngruppe} · Zeitraum: ${datum(i.von)} bis ${datum(i.bis)}`;
  },

  rendereDokument() {
    const ziel = $("dokument");
    const scrollPosition = ziel.scrollTop;
    ziel.innerHTML = "";
    const titel = document.createElement("h2");
    titel.textContent = "Gutachten";
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = this.kopfzeile();
    ziel.append(titel, meta);

    this.zustand.dokument.abschnitte.forEach((abschnitt, ai) => {
      if (abschnitt.titel) {
        const h3 = document.createElement("h3");
        h3.textContent = abschnitt.titel;
        ziel.appendChild(h3);
      }
      abschnitt.elemente.forEach((element, ei) => ziel.appendChild(this.baueElement(element, ai, ei)));
    });

    const schluss = this.schlussblock();
    if (schluss) {
      const block = document.createElement("div");
      block.className = "unterschrift";
      block.title = "Ort, Datum und Verfasser werden im Abschluss eingegeben.";
      [schluss.ortDatum, "______________________________", schluss.verfasser].forEach(zeile => {
        if (!zeile) return;
        const p = document.createElement("p");
        p.textContent = zeile;
        block.appendChild(p);
      });
      ziel.appendChild(block);
    }
    ziel.scrollTop = scrollPosition;
  },

  baueElement(element, ai, ei) {
    const box = document.createElement("div");
    box.className = "element element-" + element.art + (element.art === "satz" ? " note-" + element.note : "");

    const marke = document.createElement("span");
    marke.className = "marke";
    marke.textContent = "von Hand bearbeitet";
    marke.hidden = !element.bearbeitet;

    const feld = document.createElement("textarea");
    feld.rows = 1;
    feld.value = element.text;
    feld.setAttribute("aria-label", element.art === "satz" ? "Satz des Gutachtens (bearbeitbar)" : "Text des Gutachtens (bearbeitbar)");
    feld.addEventListener("input", () => {
      element.text = feld.value;
      element.bearbeitet = true;
      marke.hidden = false;
      this.passeHoeheAn(feld);
      this.speichern();
    });

    const leiste = document.createElement("div");
    leiste.className = "element-leiste";
    if (element.art === "satz") {
      const krit = this.kriterienIndex[element.krit];
      const name = document.createElement("span");
      name.textContent = krit ? krit.name : element.krit;
      const auswahl = document.createElement("select");
      auswahl.setAttribute("aria-label", "Note");
      NOTEN.forEach((t, i) => {
        const option = new Option(t, String(i + 1));
        option.selected = element.note === i + 1;
        auswahl.appendChild(option);
      });
      auswahl.addEventListener("change", () => this.formuliereNeu(ai, ei, parseInt(auswahl.value, 10)));
      const knopf = document.createElement("button");
      knopf.type = "button";
      knopf.textContent = "Neu formulieren";
      knopf.addEventListener("click", () => this.formuliereNeu(ai, ei, element.note));
      leiste.append(name, auswahl, knopf);
    } else {
      const art = document.createElement("span");
      art.textContent = element.art === "beleg" ? "Beleg" : "Text";
      leiste.appendChild(art);
    }
    leiste.appendChild(marke);

    box.append(feld, leiste);
    requestAnimationFrame(() => this.passeHoeheAn(feld));
    return box;
  },

  passeHoeheAn(feld) {
    feld.style.height = "auto";
    feld.style.height = feld.scrollHeight + "px";
  },

  formuliereNeu(ai, ei, note) {
    const dokument = this.zustand.dokument;
    const abschnitt = dokument.abschnitte[ai];
    const element = abschnitt.elemente[ei];
    const krit = this.kriterienIndex[element.krit];
    if (!krit || !(krit.saetze[note] || []).length) return;
    if (element.bearbeitet && !confirm("Dieser Satz wurde von Hand bearbeitet. Die Änderungen verwerfen?")) {
      this.rendereDokument();
      return;
    }

    const warAktuell = dokument.signatur === this.signatur();
    const noteGeaendert = note !== element.note;
    if (noteGeaendert) this.zustand.noten[element.krit] = note;

    const kontext = { leitwoerter: new Set(), woerter: new Set(), letzteAnfaenge: [], brueckeGewuenscht: false };
    dokument.abschnitte.forEach(a => a.elemente.forEach(e => {
      if (e === element) return;
      if (e.leitwort) kontext.leitwoerter.add(e.leitwort);
      signalwoerter(e.text).forEach(w => kontext.woerter.add(w));
    }));
    const vorher = abschnitt.elemente[ei - 1];
    const vorherName = !!vorher && vorher.art === "satz" && vorher.nennung === "name" && !vorher.bearbeitet;
    const index = this.waehleVariante(krit, note, kontext, noteGeaendert ? -1 : element.variante);
    const [vorlage, leitwort] = krit.saetze[note][index];
    const formen = this.personFormen();
    const ergebnis = this.setzeEin(vorlage, { formen, vorherName });
    Object.assign(element, {
      note, variante: index, leitwort, bruecke: "", nennung: ergebnis.nennung, text: ergebnis.text, bearbeitet: false
    });

    // Folgesatz anpassen: Eine Überleitung passt nach einer Notenänderung nicht mehr,
    // ein Pronomen hätte ohne vorherige Namensnennung keinen eindeutigen Bezug.
    const nach = abschnitt.elemente[ei + 1];
    if (nach && nach.art === "satz" && !nach.bearbeitet) {
      const nachKrit = this.kriterienIndex[nach.krit];
      const nachVorlage = nachKrit && nachKrit.saetze[nach.note] && nachKrit.saetze[nach.note][nach.variante];
      const brueckeUngueltig = nach.bruecke && noteGeaendert;
      const pronomenOhneBezug = nach.nennung === "pronomen" && ergebnis.nennung !== "name";
      if (nachVorlage && (brueckeUngueltig || pronomenOhneBezug)) {
        const neu = this.setzeEin(nachVorlage[0], { formen, vorherName: ergebnis.nennung === "name" });
        Object.assign(nach, { bruecke: "", nennung: neu.nennung, text: neu.text });
      }
    }

    if (noteGeaendert && warAktuell) dokument.signatur = this.signatur();
    this.speichern();
    this.zeigeVorschau();
  },

  neuErzeugen() {
    const dokument = this.zustand.dokument;
    const bearbeitet = dokument && dokument.abschnitte.some(a => a.elemente.some(e => e.bearbeitet));
    if (bearbeitet && !confirm("Der Entwurf enthält von Hand bearbeitete Sätze. Beim Neuerzeugen gehen diese Änderungen verloren. Fortfahren?")) return;
    this.erzeugeDokument();
    this.speichern();
    this.zeigeVorschau();
  },

  // ---------------------------------------------------------------- Export

  absaetze() {
    return this.zustand.dokument.abschnitte.map(a => ({
      titel: a.titel,
      text: a.elemente.map(e => e.text.trim()).filter(Boolean).join(" ")
    }));
  },

  schlussblock() {
    const z = this.zustand;
    const ortDatum = [(z.ort || "").trim(), datum(z.ausstellung)].filter(Boolean).join(", ");
    const verfasser = (z.verfasser || "").trim();
    if (!ortDatum && !verfasser) return null;
    return { ortDatum, verfasser };
  },

  dokumentAlsText() {
    const zeilen = ["Gutachten", this.kopfzeile(), ""];
    this.absaetze().forEach(a => {
      if (a.titel) zeilen.push(a.titel);
      if (a.text) zeilen.push(a.text);
      zeilen.push("");
    });
    const schluss = this.schlussblock();
    if (schluss) {
      if (schluss.ortDatum) zeilen.push(schluss.ortDatum, "", "");
      zeilen.push("______________________________");
      if (schluss.verfasser) zeilen.push(schluss.verfasser);
    }
    return zeilen.join("\n").trim() + "\n";
  },

  async kopieren() {
    if (!this.zustand.dokument) return;
    const text = this.dokumentAlsText();
    try {
      await navigator.clipboard.writeText(text);
      this.meldung("Der Text wurde in die Zwischenablage kopiert.", "ok");
    } catch (e) {
      const hilfsfeld = document.createElement("textarea");
      hilfsfeld.value = text;
      document.body.appendChild(hilfsfeld);
      hilfsfeld.select();
      const ok = document.execCommand("copy");
      hilfsfeld.remove();
      this.meldung(ok ? "Der Text wurde in die Zwischenablage kopiert." : "Kopieren war nicht möglich.", ok ? "ok" : "fehler");
    }
  },

  exportiereText() {
    if (!this.zustand.dokument) return;
    this.herunterladen(this.dokumentAlsText(), this.dateiname("txt"), "text/plain;charset=utf-8");
  },

  exportiereOdt() {
    if (!this.zustand.dokument) return;
    // Steuerzeichen sind in XML verboten (die Datei ließe sich sonst nicht öffnen); Zeilenumbrüche als ODF-Umbruch
    const x = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/\r?\n/g, "<text:line-break/>");
    let inhalt = `<text:p text:style-name="Titel">Gutachten</text:p>\n<text:p text:style-name="Meta">${x(this.kopfzeile())}</text:p>\n`;
    this.absaetze().forEach(a => {
      if (a.titel) inhalt += `<text:p text:style-name="Abschnitt">${x(a.titel)}</text:p>\n`;
      if (a.text) inhalt += `<text:p text:style-name="Fliesstext">${x(a.text)}</text:p>\n`;
    });
    const schluss = this.schlussblock();
    if (schluss) {
      if (schluss.ortDatum) inhalt += `<text:p text:style-name="Unterschrift">${x(schluss.ortDatum)}</text:p>\n`;
      inhalt += `<text:p text:style-name="Linie">______________________________</text:p>\n`;
      if (schluss.verfasser) inhalt += `<text:p text:style-name="Meta">${x(schluss.verfasser)}</text:p>\n`;
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
 office:version="1.2" office:mimetype="application/vnd.oasis.opendocument.text">
<office:styles>
 <style:style style:name="Fliesstext" style:family="paragraph">
  <style:paragraph-properties fo:margin-bottom="0.3cm" fo:text-align="justify" fo:line-height="130%"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="11pt"/>
 </style:style>
 <style:style style:name="Titel" style:family="paragraph">
  <style:paragraph-properties fo:margin-bottom="0.15cm"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="16pt" fo:font-weight="bold"/>
 </style:style>
 <style:style style:name="Meta" style:family="paragraph">
  <style:paragraph-properties fo:margin-bottom="0.5cm"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="10pt"/>
 </style:style>
 <style:style style:name="Abschnitt" style:family="paragraph">
  <style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.15cm" fo:keep-with-next="always"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="11.5pt" fo:font-weight="bold"/>
 </style:style>
 <style:style style:name="Unterschrift" style:family="paragraph">
  <style:paragraph-properties fo:margin-top="1cm"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="11pt"/>
 </style:style>
 <style:style style:name="Linie" style:family="paragraph">
  <style:paragraph-properties fo:margin-top="1.2cm" fo:margin-bottom="0.05cm"/>
  <style:text-properties fo:font-family="Liberation Sans" fo:font-size="11pt"/>
 </style:style>
</office:styles>
<office:body><office:text>
${inhalt}</office:text></office:body>
</office:document>`;
    this.herunterladen(xml, this.dateiname("fodt"), "application/vnd.oasis.opendocument.text");
  },

  drucken() {
    if (!this.zustand.dokument) return;
    const ziel = $("druck");
    ziel.innerHTML = "";
    const fuege = (tag, text, klasse) => {
      const e = document.createElement(tag);
      e.textContent = text;
      if (klasse) e.className = klasse;
      ziel.appendChild(e);
    };
    fuege("h1", "Gutachten");
    fuege("p", this.kopfzeile(), "meta");
    this.absaetze().forEach(a => {
      if (a.titel) fuege("h2", a.titel);
      if (a.text) fuege("p", a.text);
    });
    const schluss = this.schlussblock();
    if (schluss) {
      if (schluss.ortDatum) fuege("p", schluss.ortDatum, "ort");
      fuege("p", "______________________________", "linie");
      if (schluss.verfasser) fuege("p", schluss.verfasser, "verfasser");
    }
    window.print();
  },

  herunterladen(inhalt, name, typ) {
    const url = URL.createObjectURL(new Blob([inhalt], { type: typ }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);   // großzügig: Safari/iPad beginnt den Download teils verzögert
  },

  dateiname(endung, praefix = "Gutachten") {
    const i = this.zustand.info;
    const teile = [praefix, i.nachname, i.vorname, i.fach, i.lerngruppe].filter(Boolean).join("_");
    return teile.replace(/[^A-Za-z0-9ÄÖÜäöüß_-]+/g, "-") + "." + endung;
  },

  // ---------------------------------------------------------------- Satzbank-Prüfung

  pruefeSatzbank() {
    const probleme = [];
    const leitwoerter = {};
    this.kriterienListe.forEach(k => {
      for (let n = 1; n <= 6; n++) {
        const varianten = k.saetze[n] || [];
        if (varianten.length === 0) probleme.push(`${k.name}: keine Sätze für „${NOTEN[n - 1]}“`);
        else if (varianten.length < 2) probleme.push(`${k.name}: nur eine Variante für „${NOTEN[n - 1]}“`);
        varianten.forEach(([satz, leitwort]) => {
          const schluessel = n + "|" + leitwort;
          (leitwoerter[schluessel] = leitwoerter[schluessel] || []).push(k.name);
          const unbekannt = (satz.match(/\{[A-Z_]+\}/g) || []).filter(p => !PLATZHALTER.includes(p));
          if (unbekannt.length) probleme.push(`${k.name} (${NOTEN[n - 1]}): unbekannter Platzhalter ${unbekannt.join(", ")}`);
          if (/\{SEINE?_IHRE?\}/.test(satz.slice(1))) probleme.push(`${k.name} (${NOTEN[n - 1]}): Besitz-Platzhalter nur am Satzanfang erlaubt`);
        });
      }
    });
    const doppelt = Object.entries(leitwoerter)
      .filter(([, namen]) => namen.length > 1)
      .map(([schluessel, namen]) => {
        const [n, leitwort] = schluessel.split("|");
        return `„${leitwort}“ (${NOTEN[n - 1]}): ${namen.join(", ")}`;
      });
    return { probleme, doppelt };
  },

  zeigeSatzbank() {
    const { probleme, doppelt } = this.pruefeSatzbank();
    const pruefung = $("satzbank-pruefung");
    pruefung.innerHTML = "";
    const box = document.createElement("div");
    box.className = "hinweis-box " + (probleme.length ? "warnung" : "info");
    const titel = document.createElement("strong");
    titel.textContent = probleme.length
      ? `${probleme.length} Problem(e) in der Satzbank:`
      : "Die Satzbank ist vollständig: Alle Kriterien haben für jede Note mindestens zwei Varianten.";
    box.appendChild(titel);
    if (probleme.length) box.appendChild(this.liste(probleme));
    pruefung.appendChild(box);
    if (doppelt.length) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `${doppelt.length} Leitwörter kommen innerhalb einer Notenstufe mehrfach vor (erlaubt, verringert aber die Abwechslung)`;
      details.append(summary, this.liste(doppelt));
      pruefung.appendChild(details);
    }

    const beispielNoetig = !!this.infoFehler();
    const formen = this.personFormen(beispielNoetig ? { anrede: "frau", vorname: "Maria", nachname: "Muster" } : this.zustand.info);
    const inhalt = $("satzbank-inhalt");
    inhalt.innerHTML = "";
    if (beispielNoetig) {
      const hinweis = document.createElement("p");
      hinweis.className = "dezent klein";
      hinweis.textContent = "Die allgemeinen Angaben sind noch unvollständig, daher wird der Beispielname „Frau Maria Muster“ verwendet.";
      inhalt.appendChild(hinweis);
    }

    SATZBANK.handlungsfelder.forEach(feld => {
      const h3 = document.createElement("h3");
      h3.textContent = `${feld.id} – ${feld.titel}`;
      inhalt.appendChild(h3);
      feld.kriterien.forEach(krit => {
        const kritBox = document.createElement("div");
        kritBox.className = "satzbank-krit";
        const h4 = document.createElement("h4");
        h4.textContent = krit.name;
        kritBox.appendChild(h4);
        for (let n = 1; n <= 6; n++) {
          const notenTitel = document.createElement("strong");
          notenTitel.className = "klein";
          notenTitel.textContent = NOTEN[n - 1];
          const ol = document.createElement("ol");
          (krit.saetze[n] || []).forEach(([vorlage, leitwort]) => {
            const li = document.createElement("li");
            li.textContent = this.setzeEin(vorlage, { formen, vorherName: false }).text + " ";
            const lw = document.createElement("span");
            lw.className = "lw";
            lw.textContent = `[${leitwort}]`;
            li.appendChild(lw);
            ol.appendChild(li);
          });
          kritBox.append(notenTitel, ol);
        }
        inhalt.appendChild(kritBox);
      });
    });
  },

  // ---------------------------------------------------------------- Speichern und Laden

  // geaendert = false bei reinem Seitenwechsel; nur echte Bearbeitungen setzen den Zeitstempel,
  // der für die automatische Löschung maßgeblich ist.
  speichern(geaendert = true) {
    if (geaendert) this.zuletztBearbeitet = Date.now();
    clearTimeout(this.speicherTimer);
    this.speicherTimer = setTimeout(() => this.speichernJetzt(), 300);
  },

  async speichernJetzt() {
    clearTimeout(this.speicherTimer);
    if (this.gesperrt) return;
    const nummer = ++this.speicherNummer;
    try {
      const eintrag = { format: 2, zeit: this.zuletztBearbeitet, verschluesselt: false, inhalt: this.zustand };
      if (this.einstellungen.verschluesselung) {
        if (!this.schluessel) return;
        eintrag.verschluesselt = true;
        eintrag.inhalt = await this.verschluesseln(this.zustand);
        // Ein neuerer Speichervorgang ist bereits gestartet – dieser ältere Stand darf ihn nicht überschreiben.
        if (nummer !== this.speicherNummer || this.gesperrt) return;
      }
      localStorage.setItem(SPEICHER_DATEN, JSON.stringify(eintrag));
    } catch (e) {
      console.error(e);
      this.meldung("Speichern im Browser ist fehlgeschlagen.", "fehler");
    }
  },

  sichereEinstellungen() {
    try {
      localStorage.setItem(SPEICHER_EINSTELLUNGEN, JSON.stringify(this.einstellungen));
    } catch (e) {
      console.error(e);
    }
  },

  // Erzeugtes Gutachten prüfen. Ein Satz mit unbekanntem Kriterium wird zu freiem Text – sein Wortlaut bleibt erhalten.
  pruefeDokument(d) {
    if (!d || typeof d !== "object" || !Array.isArray(d.abschnitte)) return null;
    const text = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
    const abschnitte = d.abschnitte.slice(0, 50).filter(a => a && typeof a === "object" && Array.isArray(a.elemente)).map(a => ({
      titel: text(a.titel, 300),
      elemente: a.elemente.slice(0, 500).filter(e => e && typeof e === "object" && typeof e.text === "string").map(e => {
        const krit = typeof e.krit === "string" && Object.hasOwn(this.kriterienIndex, e.krit) ? e.krit : "";
        const bearbeitet = e.bearbeitet === true;
        const note = Number.isInteger(e.note) && e.note >= 1 && e.note <= 6 ? e.note : 0;
        if (e.art === "satz" && krit && note) {
          return { art: "satz", krit, note, variante: Number.isInteger(e.variante) && e.variante >= 0 ? e.variante : 0,
                   leitwort: text(e.leitwort, 200), bruecke: text(e.bruecke, 500), nennung: e.nennung === "name" ? "name" : "pronomen",
                   text: text(e.text, 20000), bearbeitet };
        }
        if (e.art === "beleg" && krit) return { art: "beleg", krit, text: text(e.text, 20000), bearbeitet };
        return { art: "text", text: text(e.text, 50000), bearbeitet };
      })
    }));
    return { abschnitte, signatur: text(d.signatur, 200000), erstellt: Number.isFinite(d.erstellt) ? d.erstellt : Date.now() };
  },

  // Eingestellte Frist ohne Bearbeitung ist abgelaufen: Sicherung anbieten, erst dann (auf Wunsch) löschen.
  // Rückgabe true, wenn die Daten gelöscht wurden.
  frageAblauf() {
    const { tage, seit } = this.ablauf;
    this.ablauf = null;
    const behalten = () => { this.meldung("Die Daten bleiben gespeichert. Die Frage erscheint beim nächsten Öffnen erneut, solange nichts bearbeitet wird.", "info"); return false; };
    if (!confirm(`Die gespeicherten Gutachtendaten wurden seit ${seit} Tagen nicht bearbeitet (eingestellt: löschen nach ${tage} Tagen ohne Bearbeitung).\n\n` +
                 "Jetzt eine Sicherungsdatei herunterladen und die Daten danach aus diesem Browser löschen?\n(„Abbrechen“ behält die Daten.)")) return behalten();
    let roh = null;
    try { roh = localStorage.getItem(SPEICHER_DATEN); } catch (e) { /* Speicher gesperrt */ }
    if (roh === null) return false;
    this.herunterladen(roh, this.dateiname("json", "Gutachten-Daten"), "application/json");   // gleiches Format wie „Sicherung speichern“
    if (!confirm("Wurde die Sicherungsdatei gespeichert?\n\n„OK“ löscht die Daten jetzt aus diesem Browser, „Abbrechen“ behält sie.")) return behalten();
    try { localStorage.removeItem(SPEICHER_DATEN); } catch (e) { return behalten(); }
    this.gesperrt = false;
    this.zustand = neuerZustand();
    this.schreibeInfo();
    this.meldung("Die Daten wurden gesichert und aus diesem Browser gelöscht.", "ok");
    return true;
  },

  // Rückgabe: "leer", "geladen" oder "gesperrt"
  ladeLokal() {
    let eintrag = null;
    try {
      eintrag = JSON.parse(localStorage.getItem(SPEICHER_DATEN));
    } catch (e) {
      eintrag = null;
    }
    if (!eintrag || eintrag.format !== 2) return "leer";

    // Länger nicht bearbeitet: nicht ungefragt löschen – beim Start wird nachgefragt (frageAblauf)
    const tage = this.einstellungen.ablaufTage, zeit = Number(eintrag.zeit) || 0;
    if (tage > 0 && zeit > 0 && Date.now() - zeit > tage * 86400000)
      this.ablauf = { tage, seit: Math.floor((Date.now() - zeit) / 86400000) };
    this.zuletztBearbeitet = eintrag.zeit || Date.now();
    if (eintrag.verschluesselt) {
      this.gesperrt = true;
      return "gesperrt";
    }
    this.uebernehmeZustand(eintrag.inhalt);
    return "geladen";
  },

  // Daten aus Speicher oder Sicherungsdatei streng prüfen: nur bekannte Felder mit passendem Typ,
  // Noten nur 1–6 und nur für vorhandene Kriterien. Texte bleiben vollständig erhalten.
  uebernehmeZustand(daten) {
    const z = neuerZustand();
    const objekt = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
    const text = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
    const note = v => Number.isInteger(v) && v >= 1 && v <= 6 ? v : 0;
    const istKrit = id => typeof id === "string" && Object.hasOwn(this.kriterienIndex, id);
    if (daten && typeof daten === "object") {
      const info = objekt(daten.info);
      for (const k of Object.keys(z.info)) z.info[k] = text(info[k], 2000);
      for (const [k, n] of Object.entries(objekt(daten.noten))) if (istKrit(k) && note(n)) z.noten[k] = n;
      for (const [k, b] of Object.entries(objekt(daten.belege))) if (istKrit(k) && typeof b === "string" && b.trim()) z.belege[k] = b.slice(0, 20000);
      z.gesamtnote = note(daten.gesamtnote);
      z.zusammenfassung = text(daten.zusammenfassung, 50000);
      z.ort = text(daten.ort, 200);
      z.ausstellung = text(daten.ausstellung, 20);
      z.verfasser = text(daten.verfasser, 1000);
      z.dokument = this.pruefeDokument(daten.dokument);
      const ansicht = objekt(daten.ansicht);
      if (["allgemein", "bewertung", "abschluss", "vorschau", "satzbank", "hilfe"].includes(ansicht.bereich)) z.ansicht.bereich = ansicht.bereich;
      if (Number.isInteger(ansicht.feld) && ansicht.feld >= 0) z.ansicht.feld = ansicht.feld;
    }
    this.zustand = z;
    this.schreibeInfo();
  },

  pruefeAltdaten() {
    let vorhanden = [];
    try {
      vorhanden = ALTE_SCHLUESSEL.filter(k => localStorage.getItem(k) !== null);
      if (!vorhanden.length || localStorage.getItem(SPEICHER_ALTDATEN_GEFRAGT)) return;
    } catch (e) { return; }                            // Speicher gesperrt: nichts zu prüfen
    const loeschen = confirm(
      "Im Browser liegen noch Daten der Version 1.x. Sie sind nicht wirksam verschlüsselt und werden von Version 2.0 nicht verwendet.\n\n" +
      "Jetzt löschen?\n(Bei „Abbrechen“ bleiben sie erhalten, und diese Frage erscheint nicht erneut.)");
    if (loeschen) {
      vorhanden.forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem("lehrergutachtenPassword");
      this.meldung("Die Daten der Version 1.x wurden gelöscht.", "ok");
    } else {
      localStorage.setItem(SPEICHER_ALTDATEN_GEFRAGT, "1");
    }
  },

  neu() {
    const frage = this.gesperrt
      ? "Die gespeicherten Daten sind verschlüsselt und gesperrt. Bei einem Neubeginn werden sie endgültig gelöscht. Fortfahren?"
      : "Alle Eingaben verwerfen und ein neues Gutachten beginnen?";
    if (!confirm(frage)) return;
    if (this.gesperrt) {
      localStorage.removeItem(SPEICHER_DATEN);
      this.gesperrt = false;
      this.einstellungen.verschluesselung = false;
      this.einstellungen.sperreMinuten = 0;
      this.sichereEinstellungen();
      this.meldung("Die verschlüsselten Daten wurden gelöscht. Die Verschlüsselung kann in den Einstellungen neu aktiviert werden.", "info");
    }
    this.zustand = neuerZustand();
    this.zuletztBearbeitet = Date.now();
    this.schreibeInfo();
    $("info-fehler").textContent = "";
    this.aktualisiereSchloss();
    this.starteSperrTimer();
    this.zeige("allgemein");
    this.speichernJetzt();
  },

  async sicherungSpeichern() {
    if (this.gesperrt) {
      this.meldung("Bitte entsperren Sie zuerst die gespeicherten Daten.", "warnung");
      return;
    }
    const eintrag = { format: 2, zeit: Date.now(), verschluesselt: false, inhalt: this.zustand };
    if (this.einstellungen.verschluesselung && this.schluessel) {
      eintrag.verschluesselt = true;
      eintrag.inhalt = await this.verschluesseln(this.zustand);
    }
    this.herunterladen(JSON.stringify(eintrag), this.dateiname("json", "Gutachten-Daten"), "application/json");
    this.meldung(eintrag.verschluesselt ? "Verschlüsselte Sicherung gespeichert." : "Sicherung gespeichert (unverschlüsselt).", "ok");
  },

  async sicherungLaden(datei) {
    if (this.gesperrt) {
      this.meldung("Bitte entsperren Sie zuerst die gespeicherten Daten oder beginnen Sie über „Neu“.", "warnung");
      return;
    }
    let eintrag;
    try {
      eintrag = JSON.parse(await datei.text());
    } catch (e) {
      this.meldung("Die Datei konnte nicht gelesen werden.", "fehler");
      return;
    }
    if (!eintrag || eintrag.format !== 2 || !eintrag.inhalt) {
      this.meldung("Die Datei ist keine gültige Sicherung dieses Programms (ab Version 2.0).", "fehler");
      return;
    }
    if (!confirm("Die aktuellen Eingaben werden durch die Sicherung ersetzt. Fortfahren?")) return;

    let daten = eintrag.inhalt;
    if (eintrag.verschluesselt) {
      if (!this.kryptoVerfuegbar) {
        this.meldung("Dieser Browser unterstützt die benötigte Entschlüsselung hier nicht.", "fehler");
        return;
      }
      const passwort = await this.passwortAbfragen("Sicherung entschlüsseln", "Diese Sicherung ist verschlüsselt. Bitte geben Sie das zugehörige Passwort ein.");
      if (passwort === null) return;
      try {
        daten = (await this.entschluesseln(eintrag.inhalt, passwort)).objekt;
      } catch (e) {
        this.meldung("Das Passwort ist falsch.", "fehler");
        return;
      }
    }
    this.uebernehmeZustand(daten);
    this.zuletztBearbeitet = Date.now();
    await this.speichernJetzt();
    this.zeige("allgemein");
    const zusatz = eintrag.verschluesselt && !this.schluessel
      ? " Sie wird im Browser unverschlüsselt gespeichert, solange die Verschlüsselung nicht aktiviert ist."
      : "";
    this.meldung("Die Sicherung wurde geladen." + zusatz, "ok");
  },

  // ---------------------------------------------------------------- Verschlüsselung

  async leiteSchluesselAb(passwort, salz, iterationen) {
    const basis = await crypto.subtle.importKey("raw", new TextEncoder().encode(passwort), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salz, iterations: iterationen, hash: "SHA-256" },
      basis,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  },

  async verschluesseln(objekt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const daten = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.schluessel,
      new TextEncoder().encode(JSON.stringify(objekt)));
    return { iter: this.iterationen, salz: zuBase64(this.salz), iv: zuBase64(iv), daten: zuBase64(new Uint8Array(daten)) };
  },

  async entschluesseln(paket, passwort) {
    const iterationen = paket.iter || 310000; // Pakete ohne Angabe stammen aus der ersten Fassung von 2.0
    const salz = vonBase64(paket.salz);
    const schluessel = await this.leiteSchluesselAb(passwort, salz, iterationen);
    const klartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: vonBase64(paket.iv) }, schluessel, vonBase64(paket.daten));
    return { objekt: JSON.parse(new TextDecoder().decode(klartext)), schluessel, salz, iterationen };
  },

  passwortAbfragen(titel, text) {
    return new Promise(resolve => {
      const dialog = $("dlg-passwort");
      const feld = $("p-feld");
      $("p-titel").textContent = titel;
      $("p-text").textContent = text;
      feld.value = "";
      const ende = wert => {
        $("p-ok").onclick = null;
        $("p-abbrechen").onclick = null;
        feld.onkeydown = null;
        dialog.oncancel = null;
        if (dialog.open) dialog.close();
        resolve(wert);
      };
      $("p-ok").onclick = () => ende(feld.value);
      $("p-abbrechen").onclick = () => ende(null);
      feld.onkeydown = e => {
        if (e.key === "Enter") {
          e.preventDefault();
          ende(feld.value);
        }
      };
      dialog.oncancel = e => {
        e.preventDefault();
        ende(null);
      };
      dialog.showModal();
      feld.focus();
    });
  },

  async entsperren() {
    if (!this.kryptoVerfuegbar) {
      this.meldung("Dieser Browser unterstützt die benötigte Verschlüsselung hier nicht; die Daten können nicht entsperrt werden.", "fehler");
      return;
    }
    while (this.gesperrt) {
      const passwort = await this.passwortAbfragen("Daten entsperren", "Die gespeicherten Daten sind verschlüsselt. Bitte geben Sie Ihr Passwort ein.");
      if (passwort === null) {
        this.meldung("Die Daten bleiben gesperrt. Über die Schaltfläche „Gesperrt“ oben können Sie sie später entsperren.", "info");
        return;
      }
      try {
        const eintrag = JSON.parse(localStorage.getItem(SPEICHER_DATEN));
        const ergebnis = await this.entschluesseln(eintrag.inhalt, passwort);
        this.schluessel = ergebnis.schluessel;
        this.salz = ergebnis.salz;
        this.iterationen = ergebnis.iterationen;
        this.zuletztBearbeitet = eintrag.zeit || Date.now();
        if (this.iterationen < PBKDF2_ITERATIONEN) {
          // Ältere Daten automatisch auf die aktuelle Iterationszahl umstellen
          this.salz = crypto.getRandomValues(new Uint8Array(16));
          this.iterationen = PBKDF2_ITERATIONEN;
          this.schluessel = await this.leiteSchluesselAb(passwort, this.salz, this.iterationen);
        }
        this.gesperrt = false;
        this.einstellungen.verschluesselung = true;
        this.sichereEinstellungen();
        this.uebernehmeZustand(ergebnis.objekt);
        await this.speichernJetzt();
        this.aktualisiereSchloss();
        this.starteSperrTimer();
        this.zeige(this.zustand.ansicht.bereich || "allgemein");
        this.meldung("Die Daten wurden entsperrt.", "ok");
      } catch (e) {
        this.meldung("Das Passwort ist falsch.", "fehler");
      }
    }
  },

  async sperren() {
    if (!this.schluessel) return;
    await this.speichernJetzt();
    document.querySelectorAll("dialog[open]").forEach(d => d.close());
    this.schluessel = null;
    this.salz = null;
    this.gesperrt = true;
    clearTimeout(this.sperrTimer);
    this.sperrTimer = null;
    this.zustand = neuerZustand();
    this.schreibeInfo();
    this.aktualisiereSchloss();
    this.zeige("allgemein");
    this.meldung("Die Sitzung wurde wegen Inaktivität gesperrt.", "info");
    this.entsperren();
  },

  starteSperrTimer() {
    clearTimeout(this.sperrTimer);
    this.sperrTimer = null;
    const minuten = this.einstellungen.sperreMinuten;
    if (this.einstellungen.verschluesselung && this.schluessel && minuten > 0) {
      this.sperrTimer = setTimeout(() => this.sperren(), minuten * 60000);
    }
  },

  aktualisiereSchloss() {
    // Gesperrt: Eingaben sperren, sonst gingen sie verloren (gespeichert wird erst nach dem Entsperren)
    ["s-allgemein", "s-bewertung", "s-abschluss", "s-vorschau"].forEach(id => { const s = $(id); if (s) s.inert = this.gesperrt; });
    $("gesperrt-hinweis").hidden = !this.gesperrt;
    const knopf = $("schloss");
    if (this.gesperrt) {
      knopf.textContent = "Gesperrt – entsperren";
      knopf.className = "schloss gesperrt";
      knopf.title = "Die gespeicherten Daten sind verschlüsselt und gesperrt.";
    } else if (this.einstellungen.verschluesselung && this.schluessel) {
      knopf.textContent = "Verschlüsselt";
      knopf.className = "schloss an";
      knopf.title = "Die Daten werden verschlüsselt im Browser gespeichert.";
    } else {
      knopf.textContent = "Unverschlüsselt";
      knopf.className = "schloss aus";
      knopf.title = "Die Daten werden unverschlüsselt im Browser gespeichert. Klicken, um die Einstellungen zu öffnen.";
    }
  },

  oeffneEinstellungen() {
    if (this.gesperrt) {
      this.meldung("Bitte entsperren Sie zuerst die gespeicherten Daten.", "warnung");
      return;
    }
    const e = this.einstellungen;
    $("e-verschl").checked = e.verschluesselung && !!this.schluessel;
    $("e-verschl").disabled = !this.kryptoVerfuegbar;
    $("e-krypto-hinweis").hidden = this.kryptoVerfuegbar;
    $("e-pw1").value = "";
    $("e-pw2").value = "";
    $("e-pw-block").hidden = true;
    $("e-ablauf").value = e.ablaufTage;
    $("e-sperre").value = e.sperreMinuten;
    $("e-fehler").textContent = "";
    $("dlg-einstellungen").showModal();
  },

  async speichereEinstellungen() {
    const fehler = $("e-fehler");
    fehler.textContent = "";
    const willVerschluesseln = $("e-verschl").checked && this.kryptoVerfuegbar;
    const ablaufTage = Math.max(0, parseInt($("e-ablauf").value, 10) || 0);
    const sperreMinuten = Math.max(0, parseInt($("e-sperre").value, 10) || 0);

    if (willVerschluesseln && !this.schluessel) {
      const pw1 = $("e-pw1").value;
      const pw2 = $("e-pw2").value;
      if (pw1.length < 8) {
        fehler.textContent = "Das Passwort muss mindestens 8 Zeichen lang sein.";
        return;
      }
      if (pw1 !== pw2) {
        fehler.textContent = "Die Passwörter stimmen nicht überein.";
        return;
      }
      try {
        this.salz = crypto.getRandomValues(new Uint8Array(16));
        this.iterationen = PBKDF2_ITERATIONEN;
        this.schluessel = await this.leiteSchluesselAb(pw1, this.salz, this.iterationen);
      } catch (e) {
        console.error(e);
        this.salz = null;
        this.schluessel = null;
        fehler.textContent = "Der Schlüssel konnte nicht erzeugt werden.";
        return;
      }
    }
    if (!willVerschluesseln && this.schluessel) {
      if (!confirm("Verschlüsselung deaktivieren? Die Daten werden danach unverschlüsselt im Browser gespeichert.")) return;
      this.schluessel = null;
      this.salz = null;
    }

    this.einstellungen = {
      verschluesselung: willVerschluesseln,
      ablaufTage,
      sperreMinuten: willVerschluesseln ? sperreMinuten : 0
    };
    this.sichereEinstellungen();
    $("e-pw1").value = "";
    $("e-pw2").value = "";
    await this.speichernJetzt();
    this.aktualisiereSchloss();
    this.starteSperrTimer();
    $("dlg-einstellungen").close();
    this.meldung("Die Einstellungen wurden gespeichert.", "ok");
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
