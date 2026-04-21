/**
 * @file hash-timer-card.js
 * @description Custom Lovelace card for Home Assistant.
 *   Dynamically renders a child card based on the current URL hash,
 *   with resource error detection, configurable fallback routing, and an auto-return timer.
 *
 * @author        Your Name
 * @version       1.2.0
 * @license       MIT
 *
 * @example
 * # Minimal YAML configuration
 * type: custom:hash-timer-card
 * default: home
 * cards:
 *   home:
 *     type: picture
 *     image: /local/images/home.jpg
 *   detail:
 *     type: entities
 *     entities:
 *       - sensor.temperature
 * error_fallback:
 *   detail: home
 * timers:
 *   detail: 10000
 */

/**
 * @typedef {Object} HashTimerCardConfig
 * @property {Object.<string, Object>} cards               - Map of HA card configurations indexed by hash name.
 * @property {string}                  default             - Name of the card shown when the hash is absent or unrecognized.
 * @property {number}                  [loading_time=1000] - Duration in milliseconds to display the initial loading overlay.
 * @property {string}                  [loading_image]     - URL of the image shown during the initial load.
 * @property {string}                  [background_image]  - URL of the background image applied to the main container.
 * @property {string}                  [aspect_ratio]      - CSS aspect-ratio applied to the host element (e.g. "16/9").
 * @property {Object.<string, string>} [error_fallback]    - Map of card name → fallback card name on error.
 * @property {Object.<string, number>} [timers]            - Map of card name → duration (ms) before auto-returning to the default card.
 */

class HashTimerCard extends HTMLElement {

  // ---------------------------------------------------------------------------
  // Web Component lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Initializes the Shadow DOM and the component's internal state.
   * Methods used as event callbacks are explicitly bound to the instance
   * to ensure `this` always refers to the component, not the event emitter.
   *
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /** @type {ReturnType<typeof setTimeout> | null} Reference to the active auto-return timer. */
    this._timer = null;

    /** @type {boolean} True until the first render has completed. */
    this._initialLoad = true;

    /** @type {HashTimerCardConfig | null} Configuration object provided by Lovelace. */
    this._config = null;

    /** @type {Object | null} The `hass` object injected by Home Assistant. */
    this._hass = null;

    /** @type {HTMLElement | null} The currently rendered child card element. */
    this._childCard = null;

    /** @type {string | null} Name of the currently active card. */
    this._currentActive = null;

    /** @type {Function | null} Stored hash change listener reference for clean removal. */
    this._hashListener = null;

    // Explicit binding ensures `this` is the component instance
    // when these methods are invoked as external event callbacks.
    this._onErrorCaptured = this._onErrorCaptured.bind(this);

    /**
     * MutationObserver watching the child card's Shadow DOM.
     * Detects dynamic injection of HA error elements after render.
     *
     * @type {MutationObserver}
     */
    this._observer = new MutationObserver((mutations) => this._onMutation(mutations));
  }

  /**
   * Setter called by Home Assistant on every global state update.
   * Forwards the `hass` object to the child card if it is already instantiated.
   *
   * @param {Object} hass - The Home Assistant object containing all entity states.
   */
  set hass(hass) {
    this._hass = hass;
    if (this._childCard) this._childCard.hass = hass;
  }

  /**
   * Lovelace configuration entry point, called by HA before `connectedCallback`.
   * Validates the presence of the `cards` key, merges default values,
   * then initializes the layout and triggers the first render.
   *
   * @param {HashTimerCardConfig} config - The configuration object from the Lovelace YAML.
   * @throws {Error} If the `cards` property is missing or is not an object.
   */
  setConfig(config) {
    if (!config.cards || typeof config.cards !== 'object') {
      throw new Error("You must define a 'cards' object.");
    }
    this._config = { loading_time: 1000, ...config };
    this._setupLayout();
    this._render();
  }

  /**
   * Called by the browser when the component is inserted into the DOM.
   * Registers listeners for hash changes and captures resource load errors
   * at the root Shadow DOM level.
   *
   * @returns {void}
   */
  connectedCallback() {
    this._hashListener = () => this._render();
    window.addEventListener("location-changed", this._hashListener);
    window.addEventListener("popstate", this._hashListener);

    // Use capture phase (3rd argument `true`) to intercept errors before
    // they can be consumed by a child handler.
    this.shadowRoot.addEventListener("error", this._onErrorCaptured, true);
  }

  /**
   * Called by the browser when the component is removed from the DOM.
   * Cleans up all event listeners, the mutation observer, and any active timer
   * to prevent memory leaks.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._hashListener);
    window.removeEventListener("popstate", this._hashListener);
    this.shadowRoot.removeEventListener("error", this._onErrorCaptured, true);
    this._observer.disconnect();
    if (this._timer) clearTimeout(this._timer);
  }

  // ---------------------------------------------------------------------------
  // Layout initialization
  // ---------------------------------------------------------------------------

  /**
   * Generates and injects the HTML/CSS skeleton into the Shadow DOM.
   * Dynamically applies visual options from the config:
   * background image, aspect ratio, and loading overlay image.
   *
   * @private
   * @returns {void}
   */
  _setupLayout() {
    const bg = this._config.background_image;
    const ratio = this._config.aspect_ratio;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; position: relative; border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; ${ratio ? `aspect-ratio: ${ratio};` : ''} }
        #container { width: 100%; ${bg ? `background: url('${bg}') center/cover no-repeat;` : ''} ${ratio ? 'height: 100%; position: absolute; top: 0; left: 0;' : 'height: auto;'} display: flex; flex-direction: column; }
        #container > * { flex: 1 1 auto; height: 100%; width: 100%; display: flex; flex-direction: column; }
        .loading-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('${this._config.loading_image || ""}') center/cover no-repeat; z-index: 10; display: ${this._config.loading_image && this._initialLoad ? 'block' : 'none'}; pointer-events: none; }
      </style>
      <div class="loading-overlay" id="loader"></div>
      <div id="container"></div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Resource error handling
  // ---------------------------------------------------------------------------

  /**
   * Capture-phase handler for `error` events on media resources.
   * Fired when the browser fails to load an image, video, or source element
   * within the Shadow DOM (native or child).
   *
   * Explicitly filters for `HTMLImageElement`, `HTMLVideoElement`, and
   * `HTMLSourceElement` to ignore unrelated JavaScript errors.
   *
   * @private
   * @param {Event} event - The captured `error` event.
   * @returns {void}
   */
  _onErrorCaptured(event) {
    const target = event.target;
    if (
      target instanceof HTMLImageElement ||
      target instanceof HTMLVideoElement ||
      target instanceof HTMLSourceElement
    ) {
      console.warn("[HashTimerCard] Failed to load resource:", target.src || target.currentSrc);
      this._handleError(this._currentActive);
    }
  }

  /**
   * Recursively attaches the `_onErrorCaptured` listener to the Shadow DOM
   * of a given root node and to all Shadow DOMs of nested custom elements.
   *
   * This is required because `error` events from resource loading do not
   * bubble across Shadow DOM boundaries. The method manually walks down
   * the tree and attaches the listener at every `shadowRoot` found.
   *
   * @private
   * @param {ShadowRoot} root - The Shadow DOM root to start the traversal from.
   * @returns {void}
   */
  _attachErrorListenerDeep(root) {
    if (!root) return;

    root.addEventListener("error", this._onErrorCaptured, true);

    root.querySelectorAll("*").forEach(el => {
      if (el.shadowRoot) {
        this._attachErrorListenerDeep(el.shadowRoot);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Child DOM mutation observation
  // ---------------------------------------------------------------------------

  /**
   * Callback for the `MutationObserver` watching the child card's Shadow DOM.
   * Handles two scenarios:
   *  1. HA injects an error element (`hui-error-card`, `ha-alert`, `.error`) after render.
   *  2. A new node with its own Shadow DOM is added dynamically — error listeners
   *     are attached immediately so deferred resources are not missed.
   *
   * @private
   * @param {MutationRecord[]} mutations - The list of observed DOM mutations.
   * @returns {void}
   */
  _onMutation(mutations) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const hasError = Array.from(mutation.addedNodes).some(node =>
          node.tagName === "HUI-ERROR-CARD" ||
          node.tagName === "HA-ALERT" ||
          (node.classList && node.classList.contains("error"))
        );

        if (hasError) {
          console.error("[HashTimerCard] HA error element detected via MutationObserver.");
          this._handleError(this._currentActive);
        }

        // Propagate error listeners to newly added nodes that have their own Shadow DOM.
        Array.from(mutation.addedNodes).forEach(node => {
          if (node.shadowRoot) {
            this._attachErrorListenerDeep(node.shadowRoot);
          }
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  /**
   * Resolves the active card from the current URL hash, instantiates the child card
   * via Lovelace helpers, injects it into the DOM, then sets up error observation
   * and the auto-return timer.
   *
   * Rendering is skipped if the active card has not changed (`_currentActive`).
   * If any step throws, `_handleError` is called to trigger the fallback.
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async _render() {
    const hash = window.location.hash.replace('#', '');
    const cardNames = Object.keys(this._config.cards);
    const activeName = cardNames.includes(hash) ? hash : this._config.default;

    if (this._currentActive === activeName) return;
    this._currentActive = activeName;

    const cardConfig = this._config.cards[activeName];
    if (!cardConfig) return;

    try {
      const helpers = await window.loadCardHelpers();
      this._childCard = await helpers.createCardElement(cardConfig);
      this._childCard.hass = this._hass;

      const container = this.shadowRoot.querySelector("#container");
      while (container.firstChild) { container.removeChild(container.firstChild); }
      container.appendChild(this._childCard);

      // Step 1 — Synchronous check for a configured entity that is already invalid.
      if (this._checkEntityInvalid(cardConfig)) {
        this._handleError(activeName);
        return;
      }

      // Step 2 — Wait for the child card to complete its render cycle (LitElement).
      this._observer.disconnect();
      if (this._childCard.updateComplete) {
        await this._childCard.updateComplete;
      }

      // Step 3 — Attach the observer and error listeners to the child card's Shadow DOM.
      if (this._childCard.shadowRoot) {
        this._observer.observe(this._childCard.shadowRoot, { childList: true, subtree: true });
        this._attachErrorListenerDeep(this._childCard.shadowRoot);

        // Immediate check: HA may have already injected an error card during render.
        const tag = this._childCard.tagName;
        if (tag === "HUI-ERROR-CARD" || this._childCard.shadowRoot.querySelector("ha-alert")) {
          this._handleError(activeName);
        }
      }

      // Step 4 — Hide the loading overlay after the configured delay (first render only).
      if (this._initialLoad) {
        setTimeout(() => {
          const loader = this.shadowRoot.querySelector("#loader");
          if (loader) loader.style.display = 'none';
          this._initialLoad = false;
        }, this._config.loading_time);
      }

    } catch (e) {
      console.error("[HashTimerCard] Failed to create child card:", e);
      this._handleError(activeName);
    }

    this._startTimer(this._config.timers && this._config.timers[activeName]);
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Checks whether the entity referenced in a card configuration is currently invalid.
   * An entity is considered invalid if it is absent from the HA state tree,
   * or if its state is `'unavailable'` or `'unknown'`.
   *
   * @private
   * @param {Object} config          - The child card configuration object.
   * @param {string} [config.entity] - The HA entity ID to validate.
   * @returns {boolean} `true` if the entity is invalid, `false` if valid or not specified.
   */
  _checkEntityInvalid(config) {
    if (!config.entity || !this._hass) return false;
    const state = this._hass.states[config.entity];
    return !state || state.state === 'unavailable' || state.state === 'unknown';
  }

  /**
   * Triggers navigation to the configured fallback card for `currentName`.
   * If no fallback is defined, or if the fallback resolves to the same card
   * (loop guard), the method is a no-op.
   *
   * Navigation is performed via `history.replaceState` combined with a
   * `location-changed` dispatch to integrate with HA's internal router.
   *
   * @private
   * @param {string | null} currentName - The name of the card that encountered an error.
   * @returns {void}
   */
  _handleError(currentName) {
    if (!currentName) return;
    const fallback = this._config.error_fallback && this._config.error_fallback[currentName];
    if (fallback && fallback !== currentName) {
      window.history.replaceState(null, null, `#${fallback}`);
      window.dispatchEvent(new Event("location-changed"));
    }
  }

  /**
   * Starts (or resets) the auto-return timer that navigates back to the default card.
   * Any previously active timer is cancelled before a new one is started.
   * Does nothing if `duration` is falsy or non-positive.
   *
   * @private
   * @param {number | undefined} duration - Time in milliseconds before returning to the default card.
   * @returns {void}
   */
  _startTimer(duration) {
    if (this._timer) clearTimeout(this._timer);
    if (!duration || duration <= 0) return;
    this._timer = setTimeout(() => {
      window.history.replaceState(null, null, `#${this._config.default}`);
      window.dispatchEvent(new Event("location-changed"));
    }, duration);
  }
}

customElements.define("hash-timer-card", HashTimerCard);