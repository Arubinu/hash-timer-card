# 🚀 Hash Timer Card

*__Read this in:__ English | [Français](README.fr.md)*

---

[](https://github.com/hacs/integration)

**Hash Timer Card** is a "meta" Lovelace card that acts as a smart router within a single view. It dynamically changes its content based on the URL `#hash`, handles resource errors (broken images/videos, unavailable entities), and can automatically return to a default state using a built-in timer.

Perfect for creating interactive, "futuristic dashboard" style interfaces without multiplying your Home Assistant views.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/Arubinu/hash-timer-card)

-----

## ✨ Key Features

  * **URL Hash Routing**: Display different cards without reloading the page.
  * **Intelligent Error Detection**: If an image (404), video stream, or entity (`unavailable`/`unknown`) fails, the card automatically switches to a predefined fallback card.
  * **Auto-Return Timer**: Set a countdown to return to the default card (e.g., exit "Live View" after 60 seconds).
  * **Loading Overlay**: Show a sleek transition image during the initial render.
  * **Seamless Navigation**: Uses the browser's History API for a native feel within Home Assistant.

-----

## 🛠️ Installation

### Via HACS (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arubinu&repository=hash-timer-card&category=plugin)

1. Click the button above **or** open **HACS → Frontend**
2. Click **⋮ → Custom repositories**
3. Add `https://github.com/Arubinu/hash-timer-card` as type **Lovelace**
4. Find **Hash Timer Card** and click **Download**
5. **Reload** your browser

### Manual

1. Download `hash-timer-card.js` from the [latest release](https://github.com/Arubinu/hash-timer-card/releases)
2. Copy both files to `/config/www/`
3. Go to **Settings → Dashboards → Resources**
4. Add `/local/hash-timer-card.js` as a **JavaScript module**
5. **Reload** the browser

### Resource Configuration (recommended)

To use local images, ensure your `media_dirs` are configured in your `configuration.yaml` so that `/local/` correctly maps to your files:

```yaml
homeassistant:
  media_dirs:
    images: /config/www/images
```

*Note: Images placed in `/config/www/images/` will be accessible via the URL `/local/images/`.*

-----

## 📖 Configuration

### Card Options

| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Yes** | `custom:hash-timer-card` |
| `cards` | object | **Yes** | Dictionary of cards. The key is the `#hash` name. |
| `default` | string | **Yes** | Name of the card shown by default (when no hash is present). |
| `aspect_ratio` | string | No | CSS aspect-ratio (e.g., `16/9`) to prevent layout shifts. |
| `loading_image` | string | No | URL of the image shown during initial loading. |
| `loading_time` | number | No | Duration (ms) the loader is displayed (default: 1000). |
| `error_fallback` | object | No | Map to redirect to another card upon error. |
| `timers` | object | No | Time (ms) before returning to the `default` card. |
| `trigger_entities` | object | Non | Map of entity IDs. The card is automatically displayed if one of its entities is active.. |
| `trigger_priority` | array | Non | List of map names to define priority for triggering by `trigger_entities`. |

> ⚠️ **Important:** If you use multiple `hash-timer-card` instances on the same dashboard, use **distinct card names** (e.g., `#livingroom_cam` and `#kitchen_cam`) to prevent multiple cards from switching views simultaneously\!

-----

## 💡 Examples

### 1\. Simple Example (Basic Navigation)

```yaml
type: custom:hash-timer-card
default: version
loading_time: 1000
cards:
  version:
    type: markdown
    content: >-
      {{ states.update.home_assistant_core_update.attributes.installed_version
      }} ... Hit me!
    title: Core Version
    tap_action:
      action: navigate
      navigation_path: "#bad-action"
  bad-action:
    type: markdown
    content: This map is not meant to be clickable...
    title: Wait wait wait!
timers:
  bad-action: 3000 # Returns to 'version' after 3 seconds
```

### 2\. Advanced Example: Smart Camera (Real-World Project)

This use case displays a static frame (updated regularly) to save bandwidth. Upon clicking, it switches to **Live View**. If the camera goes offline or the image fails to load, an error screen is automatically displayed.

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
  camera_image: false  # No auto-return
  camera_live: 60000   # Exit live view after 1 min
  camera_error: 10000  # Retry the image after 10 sec
cards:
  # STATE 1: Static Image
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
    custom_fields:
      battery:
        card:
          type: custom:button-card
          entity: "[[[ return variables.battery; ]]]"
          show_icon: true
          show_name: false
          show_state: true
          styles:
            card:
              - background: transparent
              - outline: none
              - border: none
              - border-radius: 0
              - box-shadow: none
              - backdrop-filter: none
              - filter: drop-shadow(0 0 1px black)
              - pointer-events: none
            state:
              - margin-top: "-4px"
            icon:
              - width: 30px
              - transform: rotate(90deg)
    styles:
      card:
        - padding: 0
      entity_picture:
        - width: 100%
        - height: 100%
      custom_fields:
        battery:
          - position: absolute
          - top: 20px
          - right: "-26px"
          - width: 54px
          - font-weight: bold
          - color: white
          - transform: translate(-50%, calc(-50% + 2px)) scale(0.8)
          - pointer-events: none
          - z-index: 5
          - padding: 0
    tap_action:
      action: navigate
      navigation_path: "#camera_live"

  # STATE 2: Real-time Stream
  camera_live:
    type: picture-entity
    entity: camera.argus_fluent
    show_name: false
    show_state: false
    camera_view: live
    tap_action:
      action: navigate
      navigation_path: "#camera_image"

  # STATE 3: Error Screen (if entity or image fails)
  camera_error:
    type: custom:button-card
    entity_picture: /local/images/camera-offline.jpg
    show_name: false
    show_state: false
    show_entity_picture: true
    aspect_ratio: 16/9.15
    styles:
      card:
        - padding: 0
      entity_picture:
        - width: 100%
        - height: 100%
    tap_action:
      action: navigate
      navigation_path: "#camera_live" # Manual retry
```

-----

*License: MIT*