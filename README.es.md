<p align="center">
  <img src="https://raw.githubusercontent.com/Arubinu/hash-timer-card/main/resources/icon/icon@2x.png" width="400" alt="Hash Timer Card Logo">
</p>

![Version](https://img.shields.io/github/v/release/Arubinu/hash-timer-card?style=for-the-badge)
![License](https://img.shields.io/github/license/Arubinu/hash-timer-card?style=for-the-badge)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)

*__Leer en:__ [English](README.md) | [Français](README.fr.md) | Español | [Deutsch](README.de.md) | [Nederlands](README.nl.md)*

---

**Hash Timer Card** es una tarjeta Lovelace "meta" que actúa como un enrutador inteligente dentro de una única vista. Cambia dinámicamente su contenido según el `#hash` de la URL, gestiona errores de recursos (imágenes/vídeos rotos, entidades no disponibles) y puede volver automáticamente a un estado predeterminado mediante un temporizador integrado.

Perfecto para crear interfaces interactivas de estilo "dashboard futurista" sin multiplicar tus vistas de Home Assistant.

## ✨ Características principales

  * **Enrutamiento por Hash URL**: Muestra distintas tarjetas sin recargar la página.
  * **Detección inteligente de errores**: Si una imagen (404), un flujo de vídeo o una entidad (`unavailable`/`unknown`) falla, la tarjeta cambia automáticamente a una tarjeta de respaldo predefinida.
  * **Temporizador de retorno automático**: Configura una cuenta atrás para volver a la tarjeta predeterminada (p. ej., salir de "Vista en vivo" tras 60 segundos).
  * **Superposición de carga**: Muestra una imagen de transición elegante durante el renderizado inicial.
  * **Navegación fluida**: Usa la API History del navegador para una experiencia nativa dentro de Home Assistant.
  * **Activadores**: Cambia automáticamente a una tarjeta hija específica cuando las entidades definidas se activan.
  * **Soporte de localización**: Editor visual totalmente traducible, disponible en varios idiomas para una experiencia de configuración nativa.

## ⚙️ Instalación

### Vía HACS (recomendado)

> Si no tienes HACS, sigue la guía oficial: https://hacs.xyz

[![Abre tu instancia de Home Assistant y abre un repositorio en la Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Arubinu&repository=hash-timer-card&category=plugin)

1. Haz clic en el botón anterior **o** abre **HACS → Frontend**
2. Haz clic en **⋮ → Repositorios personalizados**
3. Añade `https://github.com/Arubinu/hash-timer-card` como tipo **Lovelace**
4. Busca **Hash Timer Card** y haz clic en **Descargar**
5. **Recarga** tu navegador

### Manual

1. Descarga `hash-timer-card.js` desde la [última versión](https://github.com/Arubinu/hash-timer-card/releases)
2. Copia el archivo en `/config/www/`
3. Ve a **Ajustes → Paneles → Recursos**
4. Añade `/local/hash-timer-card.js` como **módulo JavaScript**
5. **Recarga** el navegador

### Configuración de recursos (recomendado)

Para usar imágenes locales, asegúrate de que `media_dirs` está configurado en tu `configuration.yaml` para que `/local/` apunte correctamente a tus archivos:

```yaml
homeassistant:
  media_dirs:
    images: /config/www/images
```

*Nota: Las imágenes colocadas en `/config/www/images/` serán accesibles mediante la URL `/local/images/`.*

## 🧩 Configuración

### Opciones de la tarjeta

| Nombre | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `type` | string | **Sí** | `custom:hash-timer-card` |
| `cards` | object | **Sí** | Diccionario de tarjetas. La clave es el nombre del `#hash`. |
| `default` | string | **Sí** | Nombre de la tarjeta mostrada por defecto (cuando no hay hash). |
| `aspect_ratio` | string | No | Relación de aspecto CSS (p. ej., `16/9`) para evitar saltos de diseño. |
| `loading_image` | string | No | URL de la imagen mostrada durante la carga inicial. |
| `loading_time` | number | No | Duración (ms) de la pantalla de carga (por defecto: 1000). |
| `error_fallback` | object | No | Mapa para redirigir a otra tarjeta en caso de error. |
| `timers` | object | No | Tiempo (ms) antes de volver a la tarjeta `default`. |
| `trigger_entities` | object | No | Mapa de IDs de entidades. La tarjeta se muestra automáticamente si una de sus entidades se activa. |
| `trigger_priority` | array | No | Lista de nombres de tarjetas para definir la prioridad de activación por `trigger_entities`. |

> ⚠️ **Importante:** Si usas varias instancias de `hash-timer-card` en el mismo panel, utiliza **nombres de tarjeta distintos** (p. ej., `#livingroom_cam` y `#kitchen_cam`) para evitar que varias tarjetas cambien de vista simultáneamente.

## 💡 Ejemplos

### 1\. Ejemplo simple (navegación básica)

```yaml
type: custom:hash-timer-card
default: version
loading_time: 1000
cards:
  version:
    type: markdown
    content: >-
      {{ states.update.home_assistant_core_update.attributes.installed_version
      }} ... ¡Tócame!
    title: Versión del núcleo
    tap_action:
      action: navigate
      navigation_path: "#bad-action"
  bad-action:
    type: markdown
    title: ¡Espera, espera, espera!
    content: Esta tarjeta no está pensada para ser clicable...
timers:
  bad-action: 3000 # Vuelve a 'version' después de 3 segundos
```

### 2\. Ejemplo avanzado: Cámara inteligente (proyecto real)

Este caso muestra una imagen estática (actualizada regularmente) para ahorrar ancho de banda. Al hacer clic, cambia a **Vista en vivo**. Si la cámara se desconecta o la imagen falla, se muestra automáticamente una pantalla de error.

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
  camera_image: false  # Sin retorno automático
  camera_live: 60000   # Salir de vista en vivo tras 1 min
  camera_error: 10000  # Reintentar la imagen tras 10 seg
cards:
  # ESTADO 1: Imagen estática
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

  # ESTADO 2: Transmisión en tiempo real
  camera_live:
    type: picture-entity
    entity: camera.argus_fluent
    show_name: false
    show_state: false
    camera_view: live
    tap_action:
      action: navigate
      navigation_path: "#camera_image"

  # ESTADO 3: Pantalla de error (si la entidad o la imagen falla)
  camera_error:
    type: custom:button-card
    entity_picture: /local/images/camera-offline.jpg
    show_name: false
    show_state: false
    show_entity_picture: true
    aspect_ratio: 16/9.15
    tap_action:
      action: navigate
      navigation_path: "#camera_live" # Reintento manual
```

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**.
<br>Puedes usarlo, modificarlo y distribuirlo libremente, siempre que se conserve el copyright original.

Consulta el archivo [LICENSE](LICENSE) para más detalles.
