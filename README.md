# MSS Bewertungsrechner

Ein moderner, performanter Notenrechner für das MSS-Punktesystem (Mainzer Studienstufe), gebaut mit **Vite**, **TypeScript** und **Tailwind CSS 4**.

## 🚀 Features

-   **Echtzeit-Berechnung:** Ergebnisse werden sofort bei der Eingabe aktualisiert.
-   **Klausur-Verwaltung & Analyse:** Verwaltung von Schülerlisten, Erfassung von Metadaten (Titel, Datum) und automatische Berechnung des Notenschnitts inklusive Verteilungsdiagramm.
-   **Daten-Persistenz:** Automatische Speicherung aller Eingaben (Punkte, Schüler, Einstellungen) im LocalStorage, um Datenverlust zu vermeiden.
-   **CSV Import/Export:** Vollständiger Export der Klausurdaten (Einstellungen, Schüler, Noten) als CSV und Import-Funktion zur Wiederherstellung.
-   **Schnellwahl-Presets:** Gängige maximale Punktzahlen (15, 20, 30, etc.) mit einem Klick setzen.
-   **Anpassbare Rundung:** Unterstützung für "Exakt", "Abrunden" (Standard), "0,5er Schritte" und "Aufrunden".
-   **IST-Prozentanzeige:** Anzeige des tatsächlichen Prozentsatzes nach der Rundung für jeden Notenschritt.
-   **Markdown-Export:** Direkter Export der Bewertungstabelle als Markdown in die Zwischenablage.
-   **Modernes UI:** Dunkelmodus-Unterstützung, optimiert für Mobile und Desktop (Tailwind CSS 4).
-   **PWA-Ready:** Offline-Unterstützung und "Zum Home-Bildschirm hinzufügen".
-   **Barrierefrei:** Semantisches HTML, ARIA-Labels und tastaturbedienbar.

## 🛠 Tech Stack

-   **Framework:** [Vite](https://vitejs.dev/)
-   **Sprache:** TypeScript
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
-   **Vorschau:** [Rolldown-Vite](https://github.com/rolldown/rolldown) (experimentell in diesem Projekt)

## 📦 Entwicklung

1.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

2.  **Dev-Server starten:**
    ```bash
    npm run dev
    ```

3.  **Produktions-Build erstellen:**
    ```bash
    npm run build
    ```

## 📖 Code-Struktur

-   `src/main.ts`: Enthält die gesamte Logik (Berechnung, DOM-Manipulation, Event-Handling).
-   `src/style.css`: Tailwind 4 Konfiguration und globale Styles.
-   `index.html`: Das HTML-Skelett mit der Tabellenstruktur.

## ⚖️ Skala

Die Berechnung basiert auf der Standard-MSS-Skala von 0 bis 15 Punkten:
-   15 Punkte: 96%
-   14 Punkte: 91%
-   ...
-   0 Punkte: 0%
