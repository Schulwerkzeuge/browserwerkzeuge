# Browserwerkzeuge

Freie Werkzeuge für den Unterricht, die **vollständig im Browser** laufen – ohne Anmeldung, ohne Konto, ohne Werbung und ohne dass Daten an einen Server gehen. Jedes Werkzeug lässt sich als Web-App installieren und funktioniert dann auch offline.

Es sind nur HTML-, JavaScript- und Bilddateien. Sie brauchen einen aktuellen Browser (Chrome, Edge, Firefox, Safari); auf iPad und iPhone mindestens iPadOS bzw. iOS 15.4. Zum Einsetzen braucht es keinen Server mit Programmiersprache, keine Datenbank und keine Installation – ein Webspace genügt.

Entwickelt am St.-Antonius-Gymnasium Lüdinghausen für den eigenen Unterricht und frei für alle Schulen. Erstellt mit KI-Unterstützung.

## Die Werkzeuge

Alle Werkzeuge liegen nebeneinander im Ordner `werkzeuge/`. Jedes ist ein eigenständiger Ordner und funktioniert unter jeder Adresse – Sie können die Ordner beliebig anordnen, umbenennen oder nur einzelne verwenden.

| Ordner | Werkzeug | gedacht für | Worum es geht |
|---|---|---|---|
| `maustrainer` | Maustraining | Schülerinnen und Schüler | Zwölf kurze Übungen: bewegen, klicken, ziehen, scrollen, markieren, Pop-ups lesen – mit Urkunde |
| `tastaturtrainer` | Tastaturtrainer | Schülerinnen und Schüler | Großbuchstaben, Umlaute, Satzzeichen, @, E-Mail-Adressen, Tastenkürzel – für Windows und Mac/iPad |
| `passwort` | Passwort-Generator | alle | Sichere Passwörter und Wortketten erzeugen, typische Muster prüfen |
| `qr` | QR-Code-Generator | alle | Einzeln, als Druckbogen oder mehrfach auf einer Seite – ohne Tracking, ohne Umleitung |
| `struktogramm` | Struktogramm-Editor | Informatikunterricht | Struktogramme angelehnt an DIN 66261, Export als Grafik sowie Java- oder Pseudocode-Gerüst |
| `automat` | Automaten-Editor | Informatikunterricht | Endliche Automaten zeichnen, Wörter prüfen, Übergangstabelle, Grammatik, NEA → DEA |
| `uml` | UML-Editor | Informatikunterricht | Entwurfs- und Implementationsdiagramme, NRW-Abiturklassen als Vorlagen, Java-Gerüst |
| `schaltung` | Schaltungs-Editor | Informatikunterricht | Logische Schaltungen simulieren, Schaltzeichen ANSI/IEEE oder DIN EN 60617, Wahrheitstabelle, Schaltterme |
| `er` | ER-Editor | Informatikunterricht | ER-Modelle in Chen-Notation, Überführung ins relationale Schema mit SQL-Gerüst |
| `gruppen` | Zufall & Gruppen | Lehrkräfte | Fair drannehmen, Gruppen bilden (auch mit „nicht zusammen“ und Rollen), Zufallszahlen, Würfel |
| `tafel` | Tafel | Lehrkräfte | Arbeitsphasen am Beamer: Restzeit, Aufgabe, Sozialform, Material als QR-Code, Lärmampel |
| `sitzplan` | Sitzplan | Lehrkräfte | Tische anordnen, Namen setzen oder verteilen, mehrere Pläne je Klasse, Druck aus Lehrkraftsicht |
| `gutachten` | Gutachten-Generator | Ausbildungslehrkräfte | Textentwürfe für Gutachten zu Lehramtsanwärterinnen und -anwärtern, ODT-Export |
| `anleitung` | Anleitung für Lehrkräfte | Lehrkräfte | Anleitung zu Zufall & Gruppen, Tafel, Sitzplan, QR-Codes, Passwort- und Gutachten-Generator, zum Lesen oder Ausdrucken |

Zufall & Gruppen und Sitzplan teilen sich die Klassenlisten; sie lassen sich als CSV einlesen, etwa aus Moodle.

## Grundsätze

- **Alles läuft lokal.** Es werden keine externen Schriften, Skripte oder Dienste geladen. Eingaben bleiben im Browser des jeweiligen Benutzerkontos.
- **Jedes kleine Werkzeug ist genau eine `index.html`.** Dazu kommen nur die Dateien für die Web-App (`manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/`). Größere Werkzeuge (Tafel, Gutachten) bestehen aus mehreren Dateien.
- **Daten von außen werden streng geprüft.** Dateien, geteilte Links und gespeicherte Daten laufen durch eine Prüfung mit fester Liste erlaubter Felder, bevor sie angezeigt werden.
- **Daten mitnehmen und löschen:** Werkzeuge, die etwas speichern, haben unten „Daten sichern“, „Daten laden“ und „Daten löschen“, etwa für den Wechsel zwischen Browser und installierter App auf dem iPad. Der Gutachten-Generator hat eine eigene Sicherung.
- **Safari auf iPad und iPhone** löscht gespeicherte Daten einer Website, wenn sie 7 Tage lang nicht geöffnet wurde. Als App auf dem Home-Bildschirm installierte Werkzeuge sind davon nicht betroffen. Wer Daten länger braucht, installiert das Werkzeug als App oder sichert regelmäßig.
- **Bedienbar mit Maus, Finger und Tastatur.** Auch die Zeichenflächen der Diagramm-Werkzeuge und der Sitzplan lassen sich vollständig mit der Tastatur bedienen; die Tasten stehen jeweils unter „Bedienung mit der Tastatur“. Screenreader erhalten Ansagen zum gewählten Element.
- **Nichts wird automatisch gelöscht.** Der Gutachten-Generator kann auf Wunsch nach einer Frist ohne Bearbeitung an das Löschen erinnern – er bietet dann eine Sicherung an und löscht erst nach Bestätigung. Bitte die Werkzeuge nur unter der eigenen Anmeldung nutzen.

## An der eigenen Schule einsetzen

### 1. Hochladen

Den Ordner `werkzeuge/` (oder nur die gewünschten Unterordner) in den Webspace kopieren, zum Beispiel nach `https://ihre-schule.de/werkzeuge/`. Fertig – die Werkzeuge laufen sofort, etwa unter `https://ihre-schule.de/werkzeuge/qr/`.

Damit sich die Werkzeuge als App installieren lassen und offline funktionieren, muss die Website über **HTTPS** erreichbar sein. Das ist bei praktisch allen Webspaces der Fall.

### 2. Impressum und Datenschutz eintragen

In jeder Fußzeile steht ein leerer Platzhalter:

```html
<!-- rechtliches --><!-- /rechtliches -->
```

Ersetzen Sie ihn in allen `index.html`-Dateien durch Ihre Links. Am einfachsten geht das mit „Suchen und Ersetzen in allen Dateien“ Ihres Editors (z. B. in VS Code: Strg+Umschalt+H). Gesucht wird der Platzhalter oben, ersetzt durch:

```html
<!-- rechtliches --> · <a href="https://ihre-schule.de/impressum">Impressum</a> · <a href="https://ihre-schule.de/datenschutz">Datenschutz</a><!-- /rechtliches -->
```

Unter Linux oder macOS geht es auch mit einem Befehl im Ordner `werkzeuge/`:

```bash
grep -rlZ --include=index.html "<!-- rechtliches --><!-- /rechtliches -->" . | xargs -0 sed -i \
  's#<!-- rechtliches --><!-- /rechtliches -->#<!-- rechtliches --> · <a href="https://ihre-schule.de/impressum">Impressum</a> · <a href="https://ihre-schule.de/datenschutz">Datenschutz</a><!-- /rechtliches -->#'
```

(Unter macOS `sed -i ''` statt `sed -i`.)

**Wichtig:** Nach jedem Update, also nach jedem erneuten Hochladen der Dateien, ist der Platzhalter wieder leer. Den Schritt dann bitte wiederholen.

### 3. Übersichtsseite (freiwillig)

Eine Übersichtsseite gehört nicht dazu – Sie können Ihre eigene gestalten oder die Werkzeuge direkt verlinken (etwa aus Moodle oder per QR-Code).

Damit die Werkzeuge oben einen Rücklink zu Ihrer Übersicht zeigen, braucht die Übersichtsseite **eine Zeile im `<head>`**. Ein vollständiges Minimalbeispiel, abgelegt als `werkzeuge/index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Werkzeuge</title>
<script>try{localStorage.setItem("browserwerkzeuge-uebersicht:"+location.pathname.replace(/index\.html?$/,""),"Werkzeuge")}catch(e){}</script>
</head>
<body>
<h1>Werkzeuge</h1>
<ul>
  <li><a href="maustrainer/">Maustraining</a></li>
  <li><a href="struktogramm/">Struktogramm-Editor</a></li>
  <li><a href="qr/">QR-Code-Generator</a></li>
</ul>
</body>
</html>
```

Der Name am Ende der Zeile („Werkzeuge“) erscheint in den Werkzeugen als „← Werkzeuge“. Es gilt:

- Gezeigt wird die Übersicht, von der man gerade kommt. Öffnet man ein Werkzeug direkt (Lesezeichen, QR-Code), führt der Link zu der Übersicht, die über dem Ordner des Werkzeugs liegt.
- Ohne Übersicht und in der installierten Web-App erscheint kein Rücklink. Wer keine Übersicht möchte, muss also nichts tun.
- Mehrere Übersichten sind möglich (z. B. eine für Schülerinnen und Schüler, eine für Lehrkräfte), auch an anderer Stelle der Website, jede mit ihrer eigenen Zeile. Links von dort führen dann mit vollständigem Pfad zu den Werkzeugen, etwa `<a href="/werkzeuge/tafel/">`.

### 4. Schullogo im QR-Code (freiwillig)

Legen Sie Ihr Logo als `logo.svg` (oder `logo.png`) in den Ordner des QR-Generators und rufen Sie ihn mit `?logo=schule` auf, also z. B. `…/qr/?logo=schule`. Das Logo steht dann in der Mitte jedes Codes.

### 5. Server-Einstellungen (empfohlen)

Wenn Ihr Webserver es erlaubt, sollte er für die Werkzeuge diese Kopfzeilen senden:

- `Content-Security-Policy`: nur eigene Quellen (siehe unten)
- `Permissions-Policy`: Kamera, Mikrofon und Standort aus – das Mikrofon nur für die Tafel (Lärmampel)
- `Cache-Control: no-cache`, damit neue Versionen sofort ankommen (offline hilft der Service Worker)
- `X-Content-Type-Options: nosniff` und `Referrer-Policy: same-origin`
- Endung `.webmanifest` als `application/manifest+json`

Beispiel für nginx (getestet mit nginx 1.24):

```nginx
# im http-Bereich, außerhalb von server { … }:
map $uri $bw_permissions {
    default         "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
    ~/tafel/        "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";
}

# im server-Block:
location ^~ /werkzeuge/ {
    index index.html;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" always;
    add_header Permissions-Policy $bw_permissions always;
    add_header Cache-Control "no-cache" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "same-origin" always;
    location ~ \.webmanifest$ { default_type application/manifest+json; }
}
```

Achtung: Sobald ein `location`-Block eigene `add_header` setzt, übernimmt nginx die `add_header` des `server`-Blocks nicht mehr – weitere Kopfzeilen (etwa HSTS) dort dann wiederholen.

### 6. Datenschutzerklärung (Textbaustein)

Die Werkzeuge senden keine Eingaben an den Server. Für die Datenschutzerklärung Ihrer Website können Sie den folgenden Baustein anpassen – bitte mit Ihrer bzw. Ihrem Datenschutzbeauftragten abstimmen (keine Rechtsberatung):

> **Browserwerkzeuge (Unterrichtswerkzeuge unter …/werkzeuge/)**
> Die Werkzeuge laufen vollständig im Browser des genutzten Geräts. Eingaben wie Klassenlisten, Sitzpläne, Diagramme oder Gutachtentexte werden ausschließlich im Speicher dieses Browsers (localStorage) abgelegt und nicht an unseren Server oder an Dritte übertragen. Es werden keine Cookies gesetzt, keine Analyse- oder Trackingdienste und keine externen Schriften oder Skripte verwendet. Damit die Werkzeuge offline funktionieren, speichert der Browser zusätzlich die Programmdateien. Gespeicherte Daten lassen sich jederzeit mit „Daten löschen“ im jeweiligen Werkzeug oder über die Einstellungen des Browsers entfernen. Beim Aufruf der Seiten verarbeitet unser Webserver die technisch notwendigen Zugriffsdaten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Datei) wie bei jeder anderen Seite dieser Website.

Den letzten Satz bitte an Ihren Webspace anpassen (Protokolldauer, Anbieter).

### Updates

Neue Version herunterladen, den Ordner `werkzeuge/` erneut hochladen (vorhandene Dateien überschreiben), dann **Schritt 2 wiederholen**.

Gespeicherte Daten gehen dabei nicht verloren: Sie liegen im Browser und hängen an der Domain, nicht an den Dateien. Aus demselben Grund dürfen Sie Ordner auch später verschieben. Installierte Apps, Lesezeichen und gedruckte QR-Codes zeigen aber auf die alte Adresse – die Adressen daher nach der Einführung möglichst nicht mehr ändern.

## Versionen

Was sich geändert hat, steht in [CHANGELOG.md](CHANGELOG.md). Jedes Werkzeug zeigt seine Versionsnummer in der Fußzeile.

## Mitmachen

Fehler und Ideen gern als [Issue](https://github.com/Schulwerkzeuge/browserwerkzeuge/issues). Bitte keine personenbezogenen Daten in Issues oder Beispieldateien.

Die Dateien hier sind lesbarer Quellcode und dürfen frei angepasst werden. Die fünf Diagramm-Werkzeuge (Struktogramm, Automat, UML, Schaltung, ER) teilen sich allerdings einen gemeinsamen Teil, der in jeder Datei zwischen den Markierungen `diagramm-kern` steht und überall gleich ist. Änderungswünsche dafür bitte als Issue statt direkt in einer Datei – sonst laufen die Werkzeuge auseinander.

## Lizenz

Apache License 2.0 – siehe [LICENSE](LICENSE) und [NOTICE](NOTICE).
© 2025–2026 St.-Antonius-Gymnasium Lüdinghausen.
