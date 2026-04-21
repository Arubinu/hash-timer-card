# 🚀 Hash Timer Card

*__Read this in:__ [English](README.md) | Français*

---

[](https://github.com/hacs/integration)

**Hash Timer Card** est une carte Lovelace "méta" qui agit comme un routeur intelligent au sein d'une même vue. Elle change de contenu dynamiquement en fonction du `#hash` dans l'URL, gère les erreurs de chargement (images/vidéos cassées, entités indisponibles) et permet de revenir automatiquement à un état par défaut grâce à un minuteur.

Idéal pour créer des interfaces interactives type "tableaux de bord futuristes" sans multiplier les vues Home Assistant.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Arubinu/hash-timer-card)

-----

## ✨ Fonctionnalités Clés

  * **Routage par URL Hash** : Affichez différentes cartes sans recharger la page.
  * **Détection d'Erreurs Intelligente** : Si une image (404), un flux vidéo ou une entité (`unavailable`/`unknown`) échoue, la carte bascule automatiquement vers une carte de secours (*fallback*).
  * **Auto-Return Timer** : Définissez un délai pour revenir à la carte par défaut (ex: quitter le mode "Live" après 60 secondes).
  * **Overlay de Chargement** : Affichez une image de transition élégante pendant le rendu initial.
  * **Navigation Fluide** : Utilise l'API History du navigateur pour une intégration parfaite.

-----

## 🛠️ Installation

### Via HACS (recommandé)

[![Ouvrir votre instance Home Assistant et afficher le dépôt dans HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arubinu&repository=hash-timer-card&category=plugin)

1. Cliquez sur le bouton ci-dessus **ou** allez dans **HACS → Interface (Frontend)**
2. Cliquez sur les **⋮ → Dépôts personnalisés (Custom repositories)**
3. Ajoutez `https://github.com/Arubinu/hash-timer-card` avec le type **Lovelace**
4. Recherchez **Hash Timer Card** et cliquez sur **Télécharger (Download)**
5. **Actualisez** votre navigateur

### Manuel

1. Téléchargez le fichier `hash-timer-card.js` depuis la [dernière version (latest release)](https://github.com/Arubinu/hash-timer-card/releases)
2. Copiez le fichier dans votre dossier `/config/www/`
3. Allez dans **Paramètres → Tableaux de bord → Ressources**
4. Ajoutez `/local/hash-timer-card.js` en tant que **Module JavaScript**
5. **Actualisez** votre navigateur

### Configuration des ressources (recommandé)

Pour utiliser des images locales, assurez-vous de configurer vos `media_dirs` dans votre fichier `configuration.yaml` pour que `/local/` pointe correctement vers vos fichiers :

```yaml
homeassistant:
  media_dirs:
    images: /config/www/images
```

*Note : Vos images placées dans `/config/www/images/` seront accessibles via l'URL `/local/images/`.*

-----

## 📖 Configuration

### Options de la carte

| Nom | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Oui** | `custom:hash-timer-card` |
| `cards` | object | **Oui** | Dictionnaire des cartes. La clé est le nom du `#hash`. |
| `default` | string | **Oui** | Le nom de la carte affichée par défaut (sans hash). |
| `aspect_ratio` | string | Non | Ratio CSS (ex: `16/9`) pour éviter les sauts de mise en page. |
| `loading_image` | string | Non | URL de l'image affichée pendant le chargement initial. |
| `loading_time` | number | Non | Durée (ms) d'affichage du loader (défaut: 1000). |
| `error_fallback` | object | Non | Map pour rediriger vers une autre carte en cas d'erreur. |
| `timers` | object | Non | Temps (ms) avant de revenir à la carte `default`. |

> ⚠️ **Important :** Si vous utilisez plusieurs `hash-timer-card` sur le même tableau de bord, utilisez des noms de cartes **bien distincts** (ex: `#salon_cam` et `#cuisine_cam`) pour éviter que les cartes ne changent de vue simultanément \!

-----

## 💡 Exemples

### 1\. Exemple Simple (Navigation de base)

```yaml
type: custom:hash-timer-card
default: info
cards:
  info:
    type: entity
    entity: sun.sun
    tap_action:
      action: navigate
      navigation_path: "#details"
  details:
    type: entities
    entities:
      - sun.sun
      - sensor.outside_temp
timers:
  details: 5000 # Revient sur 'info' après 5 secondes
```

### 2\. Exemple Avancé : Caméra Intelligente (Projet Réel)

Ce cas d'usage permet d'afficher une image fixe mise à jour régulièrement pour économiser de la bande passante. Au clic, on passe en **Live**. Si la caméra est hors-ligne, une image d'erreur s'affiche automatiquement.

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
  camera_image: false  # Pas de retour automatique
  camera_live: 60000   # Quitte le live après 1 min
  camera_error: 10000  # Réessaie l'image après 10 sec
cards:
  # ÉTAT 1 : Image fixe avec batterie
  camera_image:
    type: custom:button-card
    variables:
      camera: camera.argus_fluent
      battery: sensor.argus_batterie
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

  # ÉTAT 2 : Flux Temps Réel
  camera_live:
    type: picture-entity
    entity: camera.argus_fluent
    show_name: false
    show_state: false
    camera_view: live
    tap_action:
      action: navigate
      navigation_path: "#camera_image"

  # ÉTAT 3 : Écran d'erreur (si l'entité ou l'image échoue)
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
      navigation_path: "#camera_live" # Pour retenter manuellement
```

-----

*License: MIT*