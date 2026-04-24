<p align="center">
  <img src="https://raw.githubusercontent.com/Arubinu/hash-timer-card/main/resources/icon/icon@2x.png" width="400" alt="Hash Timer Card Logo">
</p>

![Version](https://img.shields.io/github/v/release/Arubinu/hash-timer-card?style=for-the-badge)
![License](https://img.shields.io/github/license/Arubinu/hash-timer-card?style=for-the-badge)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)

*__Lees in:__ [English](README.md) | [Français](README.fr.md) | [Español](README.es.md) | [Deutsch](README.de.md) | Nederlands*

---

**Hash Timer Card** is een "meta" Lovelace-kaart die fungeert als een slimme router binnen één enkele weergave. De inhoud verandert dynamisch op basis van de URL-`#hash`, verwerkt resourcefouten (defecte afbeeldingen/video's, niet-beschikbare entiteiten) en kan automatisch terugkeren naar een standaardstatus via een ingebouwde timer.

Perfect voor het maken van interactieve dashboards in "futuristische stijl" zonder meerdere Home Assistant-weergaven aan te maken.

## ✨ Belangrijkste functies

  * **URL-Hash-routing**: Andere kaarten weergeven zonder de pagina te herladen.
  * **Intelligente foutdetectie**: Als een afbeelding (404), videostream of entiteit (`unavailable`/`unknown`) uitvalt, schakelt de kaart automatisch over naar een vooraf ingestelde reservekaart.
  * **Automatische terugkeertimer**: Stel een aftelling in om terug te keren naar de standaardkaart (bijv. "Live-weergave" verlaten na 60 seconden).
  * **Laadoverlay**: Toon een strakke overgangsafbeelding tijdens het eerste laden.
  * **Naadloze navigatie**: Gebruikt de History API van de browser voor een native ervaring binnen Home Assistant.
  * **Activatoren**: Schakel automatisch over naar een specifieke onderliggende kaart wanneer gedefinieerde entiteiten actief worden.
  * **Lokalisatie-ondersteuning**: Volledig vertaalbare visuele editor, beschikbaar in meerdere talen.

## ⚙️ Installatie

### Via HACS (aanbevolen)

> Als je HACS niet hebt, volg dan de officiële handleiding: https://hacs.xyz

[![Open je Home Assistant-instantie en open een repository in de Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arubinu&repository=hash-timer-card&category=plugin)

1. Klik op de knop hierboven **of** open **HACS → Frontend**
2. Klik op **⋮ → Aangepaste repositories**
3. Voeg `https://github.com/Arubinu/hash-timer-card` toe als type **Lovelace**
4. Zoek naar **Hash Timer Card** en klik op **Downloaden**
5. **Herlaad** je browser

### Handmatig

1. Download `hash-timer-card.js` van de [laatste release](https://github.com/Arubinu/hash-timer-card/releases)
2. Kopieer het bestand naar `/config/www/`
3. Ga naar **Instellingen → Dashboards → Bronnen**
4. Voeg `/local/hash-timer-card.js` toe als **JavaScript-module**
5. **Herlaad** de browser

### Resourceconfiguratie (aanbevolen)

Om lokale afbeeldingen te gebruiken, zorg ervoor dat `media_dirs` is geconfigureerd in je `configuration.yaml` zodat `/local/` correct verwijst naar je bestanden:

```yaml
homeassistant:
  media_dirs:
    images: /config/www/images
```

*Opmerking: Afbeeldingen in `/config/www/images/` zijn bereikbaar via de URL `/local/images/`.*

## 🧩 Configuratie

### Kaartopties

| Naam | Type | Vereist | Beschrijving |
| :--- | :--- | :--- | :--- |
| `type` | string | **Ja** | `custom:hash-timer-card` |
| `cards` | object | **Ja** | Woordenboek van kaarten. De sleutel is de `#hash`-naam. |
| `default` | string | **Ja** | Naam van de standaard weergegeven kaart (wanneer er geen hash aanwezig is). |
| `aspect_ratio` | string | Nee | CSS-beeldverhouding (bijv. `16/9`) om lay-outverschuivingen te voorkomen. |
| `loading_image` | string | Nee | URL van de afbeelding die bij het eerste laden wordt weergegeven. |
| `loading_time` | number | Nee | Weergaveduur (ms) van het laadscherm (standaard: 1000). |
| `error_fallback` | object | Nee | Toewijzing om bij een fout naar een andere kaart door te verwijzen. |
| `timers` | object | Nee | Tijd (ms) vóór terugkeer naar de `default`-kaart. |
| `trigger_entities` | object | Nee | Toewijzing van entiteits-ID's. De kaart wordt automatisch weergegeven als een van de entiteiten actief wordt. |
| `trigger_priority` | array | Nee | Lijst van kaartnamen om de activatieprioriteit via `trigger_entities` te definiëren. |

> ⚠️ **Belangrijk:** Als je meerdere `hash-timer-card`-instanties op hetzelfde dashboard gebruikt, gebruik dan **unieke kaartnamen** (bijv. `#livingroom_cam` en `#kitchen_cam`) om te voorkomen dat meerdere kaarten tegelijk van weergave wisselen!

## 💡 Voorbeelden

### 1\. Eenvoudig voorbeeld (basisnavigatie)

```yaml
type: custom:hash-timer-card
default: version
loading_time: 1000
cards:
  version:
    type: markdown
    content: >-
      {{ states.update.home_assistant_core_update.attributes.installed_version
      }} ... Klik me!
    title: Core-versie
    tap_action:
      action: navigate
      navigation_path: "#bad-action"
  bad-action:
    type: markdown
    title: Wacht even!
    content: Deze kaart is niet bedoeld om op te klikken...
timers:
  bad-action: 3000 # Keert na 3 seconden terug naar 'version'
```

### 2\. Geavanceerd voorbeeld: Slimme camera (echt project)

Deze use case toont een statisch beeld (regelmatig bijgewerkt) om bandbreedte te besparen. Na een klik schakelt het over naar **Live-weergave**. Als de camera offline gaat of het beeld niet geladen kan worden, wordt automatisch een foutscherm weergegeven.

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
  camera_image: false  # Geen automatische terugkeer
  camera_live: 60000   # Live-weergave verlaten na 1 min
  camera_error: 10000  # Afbeelding opnieuw proberen na 10 sec
cards:
  # STAAT 1: Statisch beeld
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

  # STAAT 2: Realtime stream
  camera_live:
    type: picture-entity
    entity: camera.argus_fluent
    show_name: false
    show_state: false
    camera_view: live
    tap_action:
      action: navigate
      navigation_path: "#camera_image"

  # STAAT 3: Foutscherm (als entiteit of afbeelding uitvalt)
  camera_error:
    type: custom:button-card
    entity_picture: /local/images/camera-offline.jpg
    show_name: false
    show_state: false
    show_entity_picture: true
    aspect_ratio: 16/9.15
    tap_action:
      action: navigate
      navigation_path: "#camera_live" # Handmatige nieuwe poging
```

## 📄 Licentie

Dit project wordt gedistribueerd onder de **MIT**-licentie.
<br>Je mag het vrij gebruiken, aanpassen en verspreiden, zolang het originele auteursrecht behouden blijft.

Lees het bestand [LICENSE](LICENSE) voor alle details.
