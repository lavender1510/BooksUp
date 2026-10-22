# BooksUp: LibreTranslate ohne kostenpflichtigen API-Key

**Quelle:** [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) · freie, selbst gehostete Übersetzungssoftware (AGPL-3.0). Die offizielle `docker-compose.yml` verwendet das Image `libretranslate/libretranslate`. In `libretranslate/default_values.py` ist `LT_API_KEYS` standardmäßig deaktiviert. `POST /translate` erlaubt Arrays mit `q: string[]`. Diese Lösung verwendet **keinen gekauften API-Key**.

Das kostenlose Programm ist **kein kostenloser Hosting-Dienst**. Für eine gemeinsame Android-/Windows-Instanz brauchst du einen dauerhaft erreichbaren Server (z. B. eigenen Rechner/VPS mit Docker) und eine Domain. Der Rechner muss online sein, wenn BooksUp online übersetzen soll. Ein GitHub-Repository oder GitHub Pages allein kann diesen Python-Dienst nicht dauerhaft ausführen.

## 1. Server einrichten

Auf einem Linux-Host mit Docker Engine + Compose Plugin:

1. Erstelle einen DNS-A-Record `translate.DEINEDOMAIN.TLD`, der auf die öffentliche IP deines Servers zeigt. Wenn du einen AAAA-Record verwendest, muss er ebenfalls auf den richtigen Server zeigen.
2. Öffne eingehend TCP-Port **80 und 443**. Port **5000 darf nicht öffentlich weitergeleitet** werden.
3. Lade/kopiere dieses Repository auf den Host, gehe in den Ordner `deploy/libretranslate` und erzeuge deine lokale Konfiguration:

   ```bash
   cd deploy/libretranslate
   cp .env.example .env
   # .env bearbeiten: TRANSLATE_DOMAIN=translate.DEINEDOMAIN.TLD
   docker compose -f compose.yml up -d
   docker compose -f compose.yml logs -f --tail=60
   ```

   Die `.env` mit deiner Domain ist lokal; Docker Compose verwendet sie für Caddy. **Keinen API-Key und keine privaten Zugangsdaten in Git einchecken.**
4. Beim ersten Start müssen Modelle für `de,en,fr,es,it` geladen werden; je nach Rechner und Netzwerk dauert dies. Caddy stellt ein automatisch erneuertes HTTPS-Zertifikat aus, sobald DNS und Ports stimmen.
5. Vom Betreiberrechner:

   ```bash
   curl -fsS https://translate.DEINEDOMAIN.TLD/languages
   node tools/smoke-libretranslate.cjs https://translate.DEINEDOMAIN.TLD/translate
   ```

   Der Node-Test muss **alle fünf** Zielsprachen mit einem echten Batch-`POST` erfolgreich abfragen. Er sendet nur feste, unpersönliche Beispieltexte. Für diesen Server ist **kein API-Key** nötig. Falls der Test scheitert: DNS, HTTPS-Zertifikat, Caddy-Logs, LibreTranslate-Modellstart und Firewall überprüfen. **Einen fehlgeschlagenen Test nicht als Erfolg behandeln.**

**Wichtige Grenzen:** Ein öffentlich erreichbarer keyfreier Server ist auch für andere Internetnutzer aufrufbar. Das Compose-Setup begrenzt Anfragen auf 30/min, 300/h und 12 Texte pro Batch sowie 200 Zeichen pro Text, deaktiviert Dateiübersetzung und Web-UI und beschränkt die Caddy-Routen. Prüfe Nutzung und Hostingkosten, erwäge zusätzlich IP-/Netzwerk- oder Reverse-Proxy-Zugriffsbeschränkungen und verwende im produktiven Betrieb eine fest geprüfte Docker-Image-Version statt dauerhaft `latest`. Für eine öffentliche App ohne im Client gespeichertes Geheimnis lässt sich die Serveradresse grundsätzlich nicht vollständig vor fremder Nutzung verstecken.

## 2. BooksUp automatisch verbinden (beide Plattformen)

Lege unter **`lavender1510/BooksUp` → Settings → Secrets and variables → Actions → Variables** eine Repository-Variable an:

- Name: `BOOKSUP_PUBLIC_TRANSLATION_URL`
- Wert: `https://translate.DEINEDOMAIN.TLD/translate`

Der Wert enthält **nur die öffentliche HTTPS-Adresse**, niemals ein API-Key oder Token.

- Beim **Windows-Build** schreibt `tools/configure-public-translation.cjs` den geprüften Wert in `www/booksup-translation-config.json`. Electron liest ihn zur Laufzeit im geschützten Hauptprozess; der Renderer sieht keinen geheimen Token.
- Beim **Android-Build** übernimmt `tools/android-init.cjs` denselben Wert ausschließlich in die generierte mobile JavaScript-Asset-Datei `booksup-android-48.js`. Das bestehende `www/` und das ursprüngliche Android-4.6-Layout bleiben unverändert. Die native Netzwerkbrücke sendet die Batch-Anfragen über HTTPS.
- Wenn keine URL konfiguriert wurde, verwendet BooksUp nur seine mitgelieferten statischen Übersetzungen und den lokalen Cache. Es wird **nicht** automatisch die schlüsselpflichtige Instanz `de.libretranslate.com` angesprochen.
- Die alten Windows-Konfigurationen `BOOKSUP_LIBRETRANSLATE_URL` und optional `BOOKSUP_LIBRETRANSLATE_API_KEY` können als bewusste, lokale Betreiber-Overrides weiterhin genutzt werden. Für die eigene keyfreie Instanz ist **kein** API-Key erforderlich. Auf Android wird niemals ein geheimer Schlüssel mit ausgeliefert.

**Lokale Builds:** `BOOKSUP_PUBLIC_TRANSLATION_URL=https://.../translate node tools/configure-public-translation.cjs` setzt den öffentlichen Endpoint in `www/booksup-translation-config.json`. Bei Windows anschließend mit `npm run desktop:windows` bauen, bei Android `npm run android:release` bzw. `npm run android:init`. Den mit einem realen Domainnamen gefüllten JSON-Konfigurationswert nur veröffentlichen, wenn die Adresse bewusst öffentlich sein soll. Er ist kein Geheimnis.

## 3. Übersetzungs-API und Schutz

- `GET /languages`: Prüft verfügbare Sprachmodelle.
- `POST /translate`: `{q:["...","..."],source:"auto",target:"de"|"en"|"fr"|"es"|"it",format:"text"}`.
- LibreTranslate basiert auf **Argos Translate** und kann offline *auf dem Server* arbeiten, sobald Sprachmodelle heruntergeladen sind. BooksUp benötigt für die Online-Anfrage weiterhin eine Verbindung zum Server.
- Der existierende `BooksUpTranslationService` in `www/booksup-53.js` dedupliziert, bündelt und speichert UI-Übersetzungen lokal. Private Buchtexte, Lesernotizen und Profile werden nicht automatisch übertragen. Statische Übersetzungen haben Vorrang; bei Netzwerkfehlern bleiben Text und App erhalten.
- Die ursprüngliche öffentliche Instanz `de.libretranslate.com` antwortete am 22. Oktober 2026 bei anonymen POST-Tests mit HTTP 400 und einem Hinweis auf API-Keys. Das ist **kein** Widerspruch zur keyfreien Nutzung einer eigenen LibreTranslate-Installation.

## 4. Qualitätssicherung

Die Pull-Request-CI testet Konfiguration, Endpoint-Validierung, Android-/Windows-Build-Verdrahtung, Cache, Offline-Fallback, Sprachen und bestehende Regressionen. Sie **hostet nicht** automatisch eine permanente LibreTranslate-Instanz. Nach echtem Deployment muss der separate Live-Smoke-Test auf dem eingerichteten Server bestehen und die App auf Windows und Android getestet werden.

Die übrigen Release-Sperren des PRs (Medimops-Verkaufspreisquelle, vollständige Sprachabdeckung außerhalb explizit markierter Labels und Gerätetests) bleiben unabhängig davon bestehen.
