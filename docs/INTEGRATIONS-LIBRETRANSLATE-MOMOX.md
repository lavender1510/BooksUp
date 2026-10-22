# BooksUp – LibreTranslate und momox/Medimops (Integrationsstatus)

**Noch kein Produktionsrelease:** Ein eigener LibreTranslate-Server muss real betrieben und mit den Apps geprüft werden. Auch ein echter Medimops-Verkaufspreisdienst fehlt noch. Stabile Version auf `main` bleibt 5.5.1.

## 1. LibreTranslate

- Der bestehende Sprachcode liegt in `www/booksup-53.js`. `window.BooksUpTranslationService` ist eine zentrale, additive Übersetzungsschicht.
- `POST https://<eigene-domain>/translate` mit JSON `{q: string[], source: "auto", target: "de|en|fr|es|it", format: "text"}`. Der Dienst akzeptiert laut API-Spezifikation ein Array für `q`, seine Antwort enthält ein gleich langes `translatedText`-Array.
- Verfügbare Sprachen: **de, en, fr, es, it**. Statische Einträge in `BU44_WORDS` und den bisherigen Dictionaries haben Vorrang.
- Nur ausdrücklich markierte, von Entwicklern verfasste UI-Textbereiche (`data-bu-ui-translate`) dürfen an den Dienst. Bücher, Nutzernamen, Notizen, Reader-Text, ISBNs und beliebige Eingaben werden nicht automatisch übertragen. Weitere UI-Texte dürfen nur nach einer Datenschutzprüfung markiert werden.
- Caching: `localStorage`, maximal 400 Übersetzungspaare, getrennt nach Zielsprache. Deduplizierung, Debounce 450 ms, Bündel bis 12 Texte. Eine fehlgeschlagene Anfrage führt zu 60 Sekunden Cooldown. Bei API-Key-Fehler, Timeout, Offline oder ungültiger Antwort bleibt die lokale/statische Beschriftung erhalten; die App stürzt nicht ab.
- Windows: `electron/preload.cjs` → `booksup-translate:batch` in `electron/main.cjs`, ohne API-Key im Renderer. Konfiguration durch die **System-Umgebungsvariablen** `BOOKSUP_LIBRETRANSLATE_URL` (HTTPS-URL mit Pfad `/translate`) und optional `BOOKSUP_LIBRETRANSLATE_API_KEY`. Diese Variablen dürfen nicht im Repository stehen.
- Android: `BooksUpNetwork.translateText` nutzt natives HTTPS zum vom Betreiber freigegebenen Übersetzungsserver. Dessen öffentliche Adresse wird beim Android-Build per `BOOKSUP_PUBLIC_TRANSLATION_URL` injiziert; kein API-Key befindet sich in der APK. Ohne konfigurierte URL bleibt die App beim Offline-/Cache-Fallback.
- **Eigene kostenfreie Instanz statt Public-Key:** Offizielles Docker-Image, Caddy-HTTPS, fünf Sprachmodelle, Request-Limits, GitHub-Variable und reale Prüfung sind in [`deploy/libretranslate/README.md`](../deploy/libretranslate/README.md) dokumentiert. LibreTranslate hat laut upstream `LT_API_KEYS=false` als Standard. Ein Server/VPS oder dauerhaft laufender Computer wird benötigt; GitHub allein hostet ihn nicht.
- **Liveprobe am 22.10.2026:** `de.libretranslate.com` antwortete anonym mit HTTP 400 (Key verlangt); die eigene Docker-Installation kann ohne Key laufen. Ohne eigene URL versucht BooksUp keinen öffentlichen schlüsselpflichtigen Endpunkt.

## 2. momox und Medimops sind unterschiedliche Preisquellen

Die Open-Source-Referenz `steffkes/medimops-momox-data` demonstriert aus **Januar 2021**:
```
GET https://api.momox.de/api/v4/offer/?ean=<ISBN/EAN>
X-API-TOKEN: <serverseitig geheimer und gültiger Token>
X-MARKETPLACE-ID: momox_de
Accept: application/json
```
Beispiel-Antwort mit `status: "offer"`, `price`, `currency: "eur"` und `product.ean`. Dies ist das **Ankaufangebot von momox**, nicht der Verkaufspreis auf medimops.de. Das alte Token aus dem Open-Source-README wird **nicht** verwendet. Für die produktive Nutzung sind eigene Berechtigung und aktuelle API-Verfügbarkeit zu verifizieren. Keine Cookies oder Frontend-Tokens.

- `tools/refresh-medimops.cjs` ist der serverseitige Integrationspunkt. Optionaler momox-Zweig prüft echte ISBN-10/13-Prüfziffern und nutzt `BOOKSUP_MOMOX_API_TOKEN` (GitHub Actions Secret), `BOOKSUP_MOMOX_EANS` (vom Herausgeber explizit gepflegte Repository-Variable, maximal 40 öffentliche ISBNs) und `BOOKSUP_MOMOX_MARKETPLACE_ID` (Standard `momox_de`). Rate-Limit HTTP 429 und Autorisierungsfehler stoppen die Aktualisierung ohne erfundene Werte.
- `www/medimops-prices.json` enthält **separat** `prices` = nachweislich vom MediMops-Verkaufspreisanbieter gelieferte EUR-Angebote und `momoxOffers` = explizit als `kind: "buyback"` bezeichnete momox-Ankaufangebote. Die App erzeugt ausschließlich aus `prices` MediMops-Preisalarm-Benachrichtigungen.
- Ein echter MediMops-Verkaufspreislieferant benötigt weiterhin `BOOKSUP_MEDIMOPS_PROVIDER_URL` und optional `BOOKSUP_MEDIMOPS_PROVIDER_TOKEN` (GitHub Actions Secrets). **Die momox-Referenz bietet keinen solchen Retail-Endpunkt.** Ohne passenden Anbieter bleibt der Preisalarm lokal angelegt, zeigt transparent fehlende Preise und erzeugt keine fingierten Alarmmeldungen.
- `www/booksup-44.js`: ISBN-Prüfziffer, Preisprüfung auf Anforderung, 60-Sekunden-Limit bei manuellen Anfragen, 14-Tage-Feedaktualität, gespeicherter letzter Preis und Verlauf, optionaler Zielpreis, Preisänderungs- und Zielpreisbenachrichtigungen bei laufender App (Android bei Berechtigung). Hintergrund-Push bei geschlossener App ist nicht verfügbar.
- `www/booksup-55.js`: Bestehende Buchausgaben-/ISBN-Auswahl bleibt erhalten; bei fehlender ISBN Eingabe oder Ausgabensuche statt irreführender Meldung.

## Prüfmatrix und offene Freigabepunkte

Automatisiert (Pull Request): `node tools/test-56-integrations.cjs`, `node tools/test-56-functional.cjs`, bestehende statische und Android/Windows-Checks. Mocktests decken EAN, Header, Token-Geheimhaltung, Fehlantworten, fehlende Provider, Cache, Offline und Privacy-Gate ab.

Manuell **vor Release erforderlich**:
1. LibreTranslate (de, en, fr, es, it): echte anonyme oder berechtigt konfigurierte Anfrage, Mehrfachtexte, API-Key-Fehler 401/403, 429, Offline, Neustart/Cache, CORS-freier Android- und Windows-Laufzeitpfad.
2. Momox: eigene aktuelle Berechtigung/Token, echte ISBN-EAN, API v4 200 und Fehler 401/403/429; **kein** Verkaufspreis-Label bei Ankauf.
3. MediMops: autorisierten Retail-Provider anbinden, ISBN mit/ohne Ausgabe, Preisaktualisierung, Zielpreis, Historie, erlaubte Benachrichtigungen.
4. Regression: Reader-Markierungen, fünf Sprachen, Design, Einstellungen, Geräteübertragung auf realen Geräten.

**Sperre:** Kein 5.6.x-Stable-Release, solange die benötigten Live-Provider und diese Tests nicht erfolgreich bestätigt sind.
