// SPDX-License-Identifier: Apache-2.0 · © 2026 St.-Antonius-Gymnasium Lüdinghausen
// QR-Kodierung (Byte-Modus, Versionen 1–40) – gleiche Kodierung wie im QR-Code-Generator (qr/index.html)
"use strict";

const QR = (() => {
  const ECC_PRO_BLOCK = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  };
  const BLOECKE = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  };
  const FORMAT = { L: 1, M: 0, Q: 3, H: 2 };

  function rohModule(v) {
    let ergebnis = (16 * v + 128) * v + 64;
    if (v >= 2) {
      const anzahl = Math.floor(v / 7) + 2;
      ergebnis -= (25 * anzahl - 10) * anzahl - 55;
      if (v >= 7) ergebnis -= 36;
    }
    return ergebnis;
  }

  function datenCodewoerter(v, stufe) {
    return Math.floor(rohModule(v) / 8) - ECC_PRO_BLOCK[stufe][v] * BLOECKE[stufe][v];
  }

  // Multiplikation im Galois-Feld GF(2^8) mit dem Polynom 0x11D
  function gfMal(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  function rsDivisor(grad) {
    const ergebnis = new Array(grad).fill(0);
    ergebnis[grad - 1] = 1;
    let wurzel = 1;
    for (let i = 0; i < grad; i++) {
      for (let j = 0; j < ergebnis.length; j++) {
        ergebnis[j] = gfMal(ergebnis[j], wurzel);
        if (j + 1 < ergebnis.length) ergebnis[j] ^= ergebnis[j + 1];
      }
      wurzel = gfMal(wurzel, 0x02);
    }
    return ergebnis;
  }

  function rsRest(daten, divisor) {
    const ergebnis = divisor.map(() => 0);
    for (const b of daten) {
      const faktor = b ^ ergebnis.shift();
      ergebnis.push(0);
      divisor.forEach((koeff, i) => { ergebnis[i] ^= gfMal(koeff, faktor); });
    }
    return ergebnis;
  }

  // Aufteilen in Blöcke, Fehlerkorrektur anhängen, verschränken
  function mitFehlerkorrektur(daten, v, stufe) {
    const anzahlBloecke = BLOECKE[stufe][v];
    const eccLaenge = ECC_PRO_BLOCK[stufe][v];
    const roh = Math.floor(rohModule(v) / 8);
    const kurzeBloecke = anzahlBloecke - roh % anzahlBloecke;
    const kurzeLaenge = Math.floor(roh / anzahlBloecke);
    const divisor = rsDivisor(eccLaenge);
    const bloecke = [];
    for (let i = 0, k = 0; i < anzahlBloecke; i++) {
      const block = daten.slice(k, k + kurzeLaenge - eccLaenge + (i < kurzeBloecke ? 0 : 1));
      k += block.length;
      const ecc = rsRest(block, divisor);
      if (i < kurzeBloecke) block.push(0);
      bloecke.push(block.concat(ecc));
    }
    const ergebnis = [];
    for (let i = 0; i < bloecke[0].length; i++) {
      bloecke.forEach((block, j) => {
        if (i !== kurzeLaenge - eccLaenge || j >= kurzeBloecke) ergebnis.push(block[i]);
      });
    }
    return ergebnis;
  }

  function ausrichtungsPositionen(v) {
    if (v === 1) return [];
    const anzahl = Math.floor(v / 7) + 2;
    const schritt = Math.floor((v * 8 + anzahl * 3 + 5) / (anzahl * 4 - 4)) * 2;
    const ergebnis = [6];
    for (let pos = v * 4 + 17 - 7; ergebnis.length < anzahl; pos -= schritt) ergebnis.splice(1, 0, pos);
    return ergebnis;
  }

  // Bewertung einer Maske nach den vier Regeln der Norm (kleiner ist besser)
  function strafe(m, n) {
    let summe = 0;
    for (let a = 0; a < n; a++) {
      let laufZeile = 1, laufSpalte = 1;
      for (let b = 1; b < n; b++) {
        if (m[a][b] === m[a][b - 1]) laufZeile++;
        else { if (laufZeile >= 5) summe += laufZeile - 2; laufZeile = 1; }
        if (m[b][a] === m[b - 1][a]) laufSpalte++;
        else { if (laufSpalte >= 5) summe += laufSpalte - 2; laufSpalte = 1; }
      }
      if (laufZeile >= 5) summe += laufZeile - 2;
      if (laufSpalte >= 5) summe += laufSpalte - 2;
    }
    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) summe += 3;
      }
    }
    const muster = [[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]];
    for (let a = 0; a < n; a++) {
      for (let b = 0; b + 11 <= n; b++) {
        muster.forEach(p => {
          if (p.every((w, k) => m[a][b + k] === (w === 1))) summe += 40;
          if (p.every((w, k) => m[b + k][a] === (w === 1))) summe += 40;
        });
      }
    }
    let dunkel = 0;
    m.forEach(zeile => zeile.forEach(w => { if (w) dunkel++; }));
    summe += Math.floor(Math.abs(dunkel * 20 - n * n * 10) / (n * n)) * 10;
    return summe;
  }

  // Liefert { version, groesse, modul, fest }; "fest" markiert Suchmuster, Taktlinien,
  // Format- und Versionsinformation, die ein Logo nie verdecken darf.
  function erzeuge(bytes, stufe, minVersion = 1) {
    let version, kapazitaet = 0;
    for (version = minVersion; version <= 40; version++) {
      kapazitaet = datenCodewoerter(version, stufe) * 8;
      if (4 + (version < 10 ? 8 : 16) + bytes.length * 8 <= kapazitaet) break;
    }
    if (version > 40) throw new Error("Text zu lang");

    const bits = [];
    const anhaengen = (wert, laenge) => { for (let i = laenge - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
    anhaengen(4, 4);
    anhaengen(bytes.length, version < 10 ? 8 : 16);
    bytes.forEach(b => anhaengen(b, 8));
    anhaengen(0, Math.min(4, kapazitaet - bits.length));
    anhaengen(0, (8 - bits.length % 8) % 8);
    for (let fuell = 0xEC; bits.length < kapazitaet; fuell ^= 0xEC ^ 0x11) anhaengen(fuell, 8);
    const codewoerter = [];
    for (let i = 0; i < bits.length; i += 8) {
      let w = 0;
      for (let j = 0; j < 8; j++) w = (w << 1) | bits[i + j];
      codewoerter.push(w);
    }
    const alle = mitFehlerkorrektur(codewoerter, version, stufe);

    const n = version * 4 + 17;
    const leer = () => Array.from({ length: n }, () => new Array(n).fill(false));
    const modul = leer(), funktion = leer(), fest = leer();
    const setze = (x, y, dunkel, istFest) => {
      modul[y][x] = dunkel;
      funktion[y][x] = true;
      if (istFest) fest[y][x] = true;
    };
    const bit = (w, i) => ((w >>> i) & 1) !== 0;

    const formatBits = maske => {
      const daten = FORMAT[stufe] << 3 | maske;
      let rest = daten;
      for (let i = 0; i < 10; i++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
      const f = (daten << 10 | rest) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setze(8, i, bit(f, i), true);
      setze(8, 7, bit(f, 6), true);
      setze(8, 8, bit(f, 7), true);
      setze(7, 8, bit(f, 8), true);
      for (let i = 9; i < 15; i++) setze(14 - i, 8, bit(f, i), true);
      for (let i = 0; i < 8; i++) setze(n - 1 - i, 8, bit(f, i), true);
      for (let i = 8; i < 15; i++) setze(8, n - 15 + i, bit(f, i), true);
      setze(8, n - 8, true, true);
    };

    for (let i = 0; i < n; i++) {
      setze(6, i, i % 2 === 0, true);
      setze(i, 6, i % 2 === 0, true);
    }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const abstand = Math.max(Math.abs(dx), Math.abs(dy));
          const x = cx + dx, y = cy + dy;
          if (x >= 0 && x < n && y >= 0 && y < n) setze(x, y, abstand !== 2 && abstand !== 4, true);
        }
      }
    });
    const pos = ausrichtungsPositionen(version);
    const k = pos.length;
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === k - 1) || (i === k - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            setze(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, false);
      }
    }
    formatBits(0);
    if (version >= 7) {
      let rest = version;
      for (let i = 0; i < 12; i++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1F25);
      const v = version << 12 | rest;
      for (let i = 0; i < 18; i++) {
        const a = n - 11 + i % 3, b = Math.floor(i / 3);
        setze(a, b, bit(v, i), true);
        setze(b, a, bit(v, i), true);
      }
    }

    // Datenbits im Zickzack von unten rechts einsetzen
    let index = 0;
    for (let rechts = n - 1; rechts >= 1; rechts -= 2) {
      if (rechts === 6) rechts = 5;
      for (let senk = 0; senk < n; senk++) {
        for (let j = 0; j < 2; j++) {
          const x = rechts - j;
          const aufwaerts = ((rechts + 1) & 2) === 0;
          const y = aufwaerts ? n - 1 - senk : senk;
          if (!funktion[y][x] && index < alle.length * 8) {
            modul[y][x] = bit(alle[index >>> 3], 7 - (index & 7));
            index++;
          }
        }
      }
    }

    const maskiere = maske => {
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (funktion[y][x]) continue;
          let umkehren;
          switch (maske) {
            case 0: umkehren = (x + y) % 2 === 0; break;
            case 1: umkehren = y % 2 === 0; break;
            case 2: umkehren = x % 3 === 0; break;
            case 3: umkehren = (x + y) % 3 === 0; break;
            case 4: umkehren = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: umkehren = (x * y) % 2 + (x * y) % 3 === 0; break;
            case 6: umkehren = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
            default: umkehren = ((x + y) % 2 + (x * y) % 3) % 2 === 0;
          }
          if (umkehren) modul[y][x] = !modul[y][x];
        }
      }
    };

    let besteMaske = 0, besteStrafe = Infinity;
    for (let maske = 0; maske < 8; maske++) {
      maskiere(maske);
      formatBits(maske);
      const s = strafe(modul, n);
      if (s < besteStrafe) { besteStrafe = s; besteMaske = maske; }
      maskiere(maske);
    }
    maskiere(besteMaske);
    formatBits(besteMaske);
    return { version, groesse: n, modul, fest };
  }

  return { erzeuge };
})();
