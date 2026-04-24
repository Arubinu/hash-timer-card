<p align="center">
  <img src="https://raw.githubusercontent.com/Arubinu/hash-timer-card/main/resources/icon/icon@2x.png" width="400" alt="Hash Timer Card Logo">
</p>

![Version](https://img.shields.io/github/v/release/Arubinu/hash-timer-card?style=for-the-badge)
![License](https://img.shields.io/github/license/Arubinu/hash-timer-card?style=for-the-badge)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)

*__Lesen in:__ [English](README.md) | [Français](README.fr.md) | [Español](README.es.md) | Deutsch | [Nederlands](README.nl.md)*

---

**Hash Timer Card** ist eine „Meta"-Lovelace-Karte, die als intelligenter Router innerhalb einer einzelnen Ansicht fungiert. Sie wechselt ihren Inhalt dynamisch anhand des URL-`#hash`, behandelt Ressourcenfehler (defekte Bilder/Videos, nicht verfügbare Entitäten) und kann mithilfe eines integrierten Timers automatisch in einen Standardzustand zurückkehren.

Ideal für interaktive Dashboards im „futuristischen Stil", ohne dabei mehrere Home-Assistant-Ansichten anlegen zu müssen.

## ✨ Hauptfunktionen

  * **URL-Hash-Routing**: Verschiedene Karten anzeigen, ohne die Seite neu zu laden.
  * **Intelligente Fehlererkennung**: Wenn ein Bild (404), ein Videostream oder eine Entität (`unavailable`/`unknown`) fehlschlägt, wechselt die Karte automatisch zu einer vordefinierten Ausweichkarte.
  * **Automatischer Rückkehr-Timer**: Lege einen Countdown fest, um zur Standardkarte zurückzukehren (z. B. „Live-Ansicht" nach 60 Sekunden verlassen).
  * **Ladeüberlagerung**: Zeige ein elegantes Übergangsbild beim ersten Laden an.
  * **Nahtlose Navigation**: Verwendet die History-API des Browsers für ein natives Erlebnis in Home Assistant.
  * **Auslöser**: Wechsle automatisch zu einer bestimmten untergeordneten Karte, wenn definierte Entitäten aktiv werden.
  * **Lokalisierungsunterstützung**: Vollständig übersetzbarer visueller Editor, in mehreren Sprachen verfügbar.

## ⚙️ Installation

### Über HACS (empfohlen)

> Falls du HACS nicht hast, folge der offiziellen Anleitung: https://hacs.xyz

[![Öffne deine Home-Assistant-Instanz und füge ein Repository im Home Assistant Community Store hinzu.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arubinu&repository=hash-timer-card&category=plugin)

1. Klicke auf die Schaltfläche oben **oder** öffne **HACS → Frontend**
2. Klicke auf **⋮ → Benutzerdefinierte Repositories**
3. Füge `https://github.com/Arubinu/hash-timer-card` als Typ **Lovelace** hinzu
4. Suche nach **Hash Timer Card** und klicke auf **Herunterladen**
5. **Lade** deinen Browser neu

### Manuell

1. Lade `hash-timer-card.js` aus dem [neuesten Release](https://github.com/Arubinu/hash-timer-card/releases) herunter
2. Kopiere die Datei nach `/config/www/`
3. Gehe zu **Einstellungen → Dashboards → Ressourcen**
4. Füge `/local/hash-timer-card.js` als **JavaScript-Modul** hinzu
5. **Lade** den Browser neu

### Ressourcenkonfiguration (empfohlen)

Um lokale Bilder zu verwenden, stelle sicher, dass `media_dirs` in deiner `configuration.yaml` so konfiguriert ist, dass `/local/` korrekt auf deine Dateien verweist:

```yaml
homeassistant:
  media_dirs:
    images: /config/www/images
```

*Hinweis: Bilder, die in `/config/www/images/` abgelegt werden, sind über die URL `/local/images/` erreichbar.*

## 🧩 Konfiguration

### Kartenoptionen

| Name | Typ | Erforderlich | Beschreibung |
| :--- | :--- | :--- | :--- |
| `type` | string | **Ja** | `custom:hash-timer-card` |
| `cards` | object | **Ja** | Wörterbuch der Karten. Der Schlüssel ist der `#hash`-Name. |
| `default` | string | **Ja** | Name der standardmäßig angezeigten Karte (wenn kein Hash vorhanden ist). |
| `aspect_ratio` | string | Nein | CSS-Seitenverhältnis (z. B. `16/9`), um Layoutverschiebungen zu vermeiden. |
| `loading_image` | string | Nein | URL des Bildes, das beim ersten Laden angezeigt wird. |
| `loading_time` | number | Nein | Anzeigedauer (ms) des Ladebildschirms (Standard: 1000). |
| `error_fallback` | object | Nein | Zuordnung zur Weiterleitung auf eine andere Karte bei einem Fehler. |
| `timers` | object | Nein | Zeit (ms) vor der Rückkehr zur `default`-Karte. |
| `trigger_entities` | object | Nein | Zuordnung von Entitäts-IDs. Die Karte wird automatisch angezeigt, wenn eine ihrer Entitäten aktiv wird. |
| `trigger_priority` | array | Nein | Liste der Kartennamen zur Festlegung der Auslöse-Priorität über `trigger_entities`. |

> ⚠️ **Wichtig:** Wenn du mehrere `hash-timer-card`-Instanzen auf demselben Dashboard verwendest, nutze **eindeutige Kartennamen** (z. B. `#livingroom_cam` und `#kitchen_cam`), damit nicht mehrere Karten gleichzeitig die Ansicht wechseln!

## 💡 Beispiele

### 1\. Einfaches Beispiel (Grundnavigation)

```yaml
type: custom:hash-timer-card
default: version
loading_time: 1000
cards:
  version:
    type: markdown
    content: >-
      {{ states.update.home_assistant_core_update.attributes.installed_version
      }} ... Klick mich!
    title: Core-Version
    tap_action:
      action: navigate
      navigation_path: "#bad-action"
  bad-action:
    type: markdown
    title: Warte mal kurz!
    content: Diese Karte ist nicht zum Anklicken gedacht...
timers:
  bad-action: 3000 # Kehrt nach 3 Sekunden zu 'version' zurück
```

### 2\. Erweitertes Beispiel: Intelligente Kamera (Realprojekt)

Dieser Anwendungsfall zeigt ein statisches Bild (regelmäßig aktualisiert), um Bandbreite zu sparen. Per Klick wechselt die Ansicht in den **Live-Modus**. Wenn die Kamera offline geht oder das Bild nicht geladen werden kann, wird automatisch ein Fehlerbildschirm angezeigt.

```yaml
type: custom:hash-timer-card
default: camera_image
aspect_ratio: 16/9.15
loading_time: 6000
loading_image: /local/images/camera-loading.jpg
error_fallback:
  camera_image: camera_error
  camera_live: camera_error
timers:
  camera_image: false  # Kein automatischer Rücksprung
  camera_live: 60000   # Live-Ansicht nach 1 Min. verlassen
  camera_error: 10000  # Bild nach 10 Sek. erneut versuchen
cards:
  # ZUSTAND 1: Statisches Bild
  camera_image:
    type: custom:button-card
    variables:
      camera: camera.argus_fluent
      battery: sensor.argus_battery
    entity_picture: >
      [[[
        return states[variables.camera].attributes.entity_picture + '&update=' + Date.now();
      ]]]
    show_name: false
    show_state: false
    show_entity_picture: true
    update_timer: 60s
    aspect_ratio: 16/9.15
    tap_action:
      action: navigate
      navigation_path: "#camera_live"

  # ZUSTAND 2: Echtzeit-Stream
  camera_live:
    type: picture-entity
    entity: camera.argus_fluent
    show_name: false
    show_state: false
    camera_view: live
    tap_action:
      action: navigate
      navigation_path: "#camera_image"

  # ZUSTAND 3: Fehlerbildschirm (wenn Entität oder Bild fehlschlägt)
  camera_error:
    type: custom:button-card
    entity_picture: /local/images/camera-offline.jpg
    show_name: false
    show_state: false
    show_entity_picture: true
    aspect_ratio: 16/9.15
    tap_action:
      action: navigate
      navigation_path: "#camera_live" # Manueller Neuversuch
```

## 📄 Lizenz

Dieses Projekt wird unter der **MIT**-Lizenz vertrieben.
<br>Du kannst es frei verwenden, verändern und weitergeben, solange das ursprüngliche Copyright erhalten bleibt.

Lies die Datei [LICENSE](LICENSE) für alle Details.
