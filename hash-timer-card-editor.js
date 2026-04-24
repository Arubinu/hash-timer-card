/**
 * @file hash-timer-card-editor.js
 * @description Visual editor for hash-timer-card in Home Assistant Lovelace.
 *   Uses native HA elements (ha-entity-picker, hui-card-picker) mounted
 *   imperatively via the DOM. Child card editing opens a native
 *   hui-dialog-edit-card modal — the same mechanism used by actions-card.
 *
 * @author  Alvin Pergens
 * @version 1.0.0
 * @license MIT
 */

// ---------------------------------------------------------------------------
// Translations — add a new language block to extend i18n support.
// English is always the fallback when a key is missing in the active language.
// ---------------------------------------------------------------------------

const TRANSLATIONS = {
  en: {
    tab_general:          "GENERAL",
    label_default_card:   "Default Card",
    label_trigger_priority: "Trigger Priority",
    label_hash_id:        "Hash ID",
    label_auto_return:    "Auto-return (ms)",
    label_fallback:       "Fallback",
    label_trigger_entities: "Triggers",
    label_child_card:     "Child Card",
    btn_add_entity:       "Add an entity",
    btn_delete_card:      "Delete the card",
    no_card:              "No card available — choose one below.",
    choose:               "-- Choose --",
    none:                 "None",
    edit_card:            "Edit the card",
    delete_card:          "Delete the card",
    opt_loading_time:     "Loading time (ms)",
    opt_loading_image:    "Loading image (url)",
    opt_background_image: "Background image (url)",
    opt_aspect_ratio:     "Aspect Ratio (e.g., 16/9)",
  },
  fr: {
    tab_general:          "GÉNÉRAL",
    label_default_card:   "Carte par défaut",
    label_trigger_priority: "Priorité des déclencheurs",
    label_hash_id:        "ID de Hash",
    label_auto_return:    "Retour auto (ms)",
    label_fallback:       "Repli",
    label_trigger_entities: "Déclencheurs",
    label_child_card:     "Carte enfant",
    btn_add_entity:       "Ajouter une entité",
    btn_delete_card:      "Supprimer la carte",
    no_card:              "Aucune carte — choisissez-en une ci-dessous.",
    choose:               "-- Choisir --",
    none:                 "Aucun",
    edit_card:            "Modifier la carte",
    delete_card:          "Supprimer la carte",
    opt_loading_time:     "Temps de chargement (ms)",
    opt_loading_image:    "Image de chargement (url)",
    opt_background_image: "Image de fond (url)",
    opt_aspect_ratio:     "Ratio d'aspect (ex : 16/9)",
  },
  de: {
    tab_general:          "ALLGEMEIN",
    label_default_card:   "Standardkarte",
    label_trigger_priority: "Auslöser-Priorität",
    label_hash_id:        "Hash-ID",
    label_auto_return:    "Auto-Rückkehr (ms)",
    label_fallback:       "Ausweich-Karte",
    label_trigger_entities: "Auslöser",
    label_child_card:     "Untergeordnete Karte",
    btn_add_entity:       "Entität hinzufügen",
    btn_delete_card:      "Karte löschen",
    no_card:              "Keine Karte — wählen Sie eine unten aus.",
    choose:               "-- Wählen --",
    none:                 "Keine",
    edit_card:            "Karte bearbeiten",
    delete_card:          "Karte löschen",
    opt_loading_time:     "Ladezeit (ms)",
    opt_loading_image:    "Ladebild (URL)",
    opt_background_image: "Hintergrundbild (URL)",
    opt_aspect_ratio:     "Seitenverhältnis (z.B. 16/9)",
  },
  es: {
    tab_general:          "GENERAL",
    label_default_card:   "Tarjeta por defecto",
    label_trigger_priority: "Prioridad de activadores",
    label_hash_id:        "ID de hash",
    label_auto_return:    "Retorno auto (ms)",
    label_fallback:       "Alternativa",
    label_trigger_entities: "Activadores",
    label_child_card:     "Tarjeta hija",
    btn_add_entity:       "Añadir entidad",
    btn_delete_card:      "Eliminar tarjeta",
    no_card:              "Sin tarjeta — elige una a continuación.",
    choose:               "-- Elegir --",
    none:                 "Ninguno",
    edit_card:            "Editar tarjeta",
    delete_card:          "Eliminar tarjeta",
    opt_loading_time:     "Tiempo de carga (ms)",
    opt_loading_image:    "Imagen de carga (url)",
    opt_background_image: "Imagen de fondo (url)",
    opt_aspect_ratio:     "Relación de aspecto (ej: 16/9)",
  },
  nl: {
    tab_general:          "ALGEMEEN",
    label_default_card:   "Standaardkaart",
    label_trigger_priority: "Triggerprioriteit",
    label_hash_id:        "Hash-ID",
    label_auto_return:    "Auto-terugkeer (ms)",
    label_fallback:       "Terugvalkaart",
    label_trigger_entities: "Triggers",
    label_child_card:     "Onderliggende kaart",
    btn_add_entity:       "Entiteit toevoegen",
    btn_delete_card:      "Kaart verwijderen",
    no_card:              "Geen kaart — kies er hieronder een.",
    choose:               "-- Kies --",
    none:                 "Geen",
    edit_card:            "Kaart bewerken",
    delete_card:          "Kaart verwijderen",
    opt_loading_time:     "Laadtijd (ms)",
    opt_loading_image:    "Laadafbeelding (url)",
    opt_background_image: "Achtergrondafbeelding (url)",
    opt_aspect_ratio:     "Beeldverhouding (bijv. 16/9)",
  },
};

class HashTimerCardEditor extends HTMLElement {

  // ---------------------------------------------------------------------------
  // Web Component lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Initializes the Shadow DOM and internal editor state.
   *
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    /** @type {Object | null} The Home Assistant object. */
    this._hass = null;

    /** @type {Object | null} The Lovelace dashboard context. */
    this._lovelace = null;

    /** @type {Object | null} The current card configuration being edited. */
    this._config = null;

    /** @type {number} Index of the currently selected tab (0 = General, n = card tab). */
    this._selectedTab = 0;

    /**
     * Set of hui-dialog-edit-card elements currently open on document.body.
     * Tracked so they can be cleaned up on disconnectedCallback.
     *
     * @type {Set<HTMLElement>}
     */
    this._activeDialogs = new Set();
  }

  // ---------------------------------------------------------------------------
  // Internationalisation
  // ---------------------------------------------------------------------------

  /**
   * Returns the two-letter language code from hass, defaulting to "en".
   *
   * @private
   * @returns {string}
   */
  get _lang() {
    return this._hass?.language?.split("-")[0] || "en";
  }

  /**
   * Translates a key using the active language, falling back to English.
   *
   * @private
   * @param {string} key - A key from the TRANSLATIONS object.
   * @returns {string}
   */
  _t(key) {
    return (TRANSLATIONS[this._lang] ?? {})[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  /**
   * Setter called by HA on every state update.
   * Forwards hass to any already-mounted HA child elements.
   *
   * @param {Object} hass - The Home Assistant object.
   */
  set hass(hass) {
    this._hass = hass;
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach(el => { el.hass = hass; });
    this.shadowRoot.querySelectorAll("hui-card-picker").forEach(el => { el.hass = hass; });
  }

  /**
   * Setter for the Lovelace dashboard context.
   * Forwarded to any already-mounted hui-card-picker.
   *
   * @param {Object} lovelace - The Lovelace context object.
   */
  set lovelace(lovelace) {
    this._lovelace = lovelace;
    this.shadowRoot.querySelectorAll("hui-card-picker").forEach(el => { el.lovelace = lovelace; });
  }

  /**
   * Receives the card configuration from Lovelace and triggers the initial render.
   * Ensures all optional top-level keys exist to avoid null checks throughout.
   *
   * @param {Object} config - The raw configuration object from the YAML.
   */
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.cards)            this._config.cards = {};
    if (!this._config.timers)           this._config.timers = {};
    if (!this._config.error_fallback)   this._config.error_fallback = {};
    if (!this._config.trigger_entities) this._config.trigger_entities = {};
    if (!this._config.trigger_priority) this._config.trigger_priority = [];
    this._render();
  }

  /**
   * Called by the browser when the component is removed from the DOM.
   * Cleans up any open child edit dialogs to prevent orphaned modals.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    this._activeDialogs.forEach(dialog => {
      if (dialog.parentNode) {
        try { dialog.parentNode.removeChild(dialog); } catch (_) {}
      }
    });
    this._activeDialogs.clear();
  }

  // ---------------------------------------------------------------------------
  // Static data
  // ---------------------------------------------------------------------------

  /**
   * Definitions of optional global fields that can be added via the dropdown menu.
   *
   * @returns {{ key: string, label: string, icon: string }[]}
   */
  get _globalOptionalFields() {
    return [
      { key: "loading_time",     label: this._t("opt_loading_time"),     icon: "mdi:timer-sand"   },
      { key: "loading_image",    label: this._t("opt_loading_image"),    icon: "mdi:image-sync"   },
      { key: "background_image", label: this._t("opt_background_image"), icon: "mdi:image-area"   },
      { key: "aspect_ratio",     label: this._t("opt_aspect_ratio"),     icon: "mdi:aspect-ratio" },
    ];
  }

  // ---------------------------------------------------------------------------
  // Render — full cycle
  // ---------------------------------------------------------------------------

  /**
   * Full render cycle. Writes the static HTML skeleton via innerHTML, then
   * mounts all imperative HA custom elements (entity pickers, card picker).
   *
   * @private
   * @returns {void}
   */
  _render() {
    if (!this._config || !this._hass) return;

    const hashes = Object.keys(this._config.cards);
    const availableGlobalOpts = this._globalOptionalFields.filter(opt => this._config[opt.key] === undefined);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; color: var(--primary-text-color); }

        /* Tab bar */
        .tabs-container { display: flex; align-items: center; border-bottom: 1px solid var(--divider-color); margin-bottom: 12px; }
        .tabs-bar { display: flex; overflow-x: auto; flex-grow: 1; gap: 4px; }
        .tab-item { padding: 10px 14px; cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; color: var(--secondary-text-color); text-transform: uppercase; font-weight: 500; font-size: 12px; }
        .tab-item.active { border-bottom: 2px solid var(--primary-color); color: var(--primary-color); }

        /* Form fields — use HA native elements (ha-textfield, ha-select) for theme support */
        .field { display: flex; flex-direction: column; margin-top: 12px; margin-bottom: 8px; }
        .field label { font-size: 11px; color: var(--secondary-text-color); margin-bottom: 4px; font-weight: 500; text-transform: uppercase; }
        ha-textfield, ha-select { display: block; width: 100%; }

        .input-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
        .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .entity-picker-slot { flex-grow: 1; }

        /* Buttons */
        .btn-icon { cursor: pointer; color: var(--secondary-text-color); background: none; border: none; padding: 4px; display: flex; align-items: center; gap: 4px; font-family: inherit; font-size: 13px; }
        .btn-icon:hover { color: var(--primary-text-color); }
        .btn-delete { color: var(--error-color); }
        .btn-add-entity { border: 1px dashed var(--divider-color); justify-content: center; padding: 8px; width: 100%; border-radius: 4px; }

        /* Selected card row — no border, no background, flush */
        .card-row { display: flex; align-items: center; padding: 4px 0; margin-bottom: 4px; border: 1px solid var(--divider-color); border-radius: 4px; }
        .card-editor-label { font-size: 11px; color: var(--secondary-text-color); text-transform: uppercase; font-weight: 500; margin-bottom: 4px; }
        .card-info { flex-grow: 1; display: flex; align-items: center; gap: 8px; overflow: hidden; }
        .card-type { font-size: 14px; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: 14px; }
        .card-name { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-actions { display: flex; align-items: center; flex-shrink: 0; }
        .card-actions ha-icon-button { --mdc-icon-button-size: 36px; color: var(--secondary-text-color); }
        .card-actions ha-icon-button:hover { color: var(--primary-text-color); }

        .no-card { text-align: center; color: var(--secondary-text-color); padding: 12px; border: 1px dashed var(--divider-color); border-radius: var(--ha-card-border-radius, 4px); margin-bottom: 8px; font-size: 13px; }

        /* Card picker slot */
        #card-picker-slot { display: block; margin-bottom: 12px; }

        /* Card editor slot — no border, no background: flush with the rest */
        .card-editor-slot { display: block; margin-top: 12px; }

        .bottom-actions { display: flex; justify-content: flex-end; margin-top: 12px; border-top: 1px solid var(--divider-color); padding-top: 12px; }

        /* Dropdown menu */
        .dropdown { position: relative; }
        .dropdown-content { display: none; position: absolute; right: 0; background: var(--card-background-color, var(--primary-background-color)); min-width: 180px; box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.2)); z-index: 100; border-radius: var(--ha-card-border-radius, 4px); border: 1px solid var(--divider-color); }
        .dropdown-content div { padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--primary-text-color); }
        .dropdown-content div:hover { background: var(--secondary-background-color, rgba(0,0,0,0.04)); }
        .show { display: block !important; }
      </style>

      <div class="wrapper">

        <!-- Tab bar -->
        <div class="tabs-container">
          <div class="tabs-bar">
            <div class="tab-item ${this._selectedTab === 0 ? "active" : ""}" data-idx="0">${this._t("tab_general")}</div>
            ${hashes.map((h, i) => `
              <div class="tab-item ${this._selectedTab === i + 1 ? "active" : ""}" data-idx="${i + 1}">${h}</div>
            `).join("")}
          </div>
          <div style="display:flex;">
            <div class="dropdown">
              <button class="btn-icon" id="dropbtn"><ha-icon icon="mdi:dots-vertical"></ha-icon></button>
              <div id="myDropdown" class="dropdown-content">
                ${availableGlobalOpts.map(opt => `
                  <div data-add-global="${opt.key}"><ha-icon icon="${opt.icon}"></ha-icon> ${opt.label}</div>
                `).join("")}
              </div>
            </div>
            <button class="btn-icon" id="add-card-btn"><ha-icon icon="mdi:plus"></ha-icon></button>
          </div>
        </div>

        <!-- Tab content -->
        <div class="content">
          ${this._selectedTab === 0
            ? this._buildGeneralTabHTML(hashes)
            : this._buildCardTabHTML(hashes[this._selectedTab - 1], hashes)
          }
        </div>

      </div>
    `;

    this._mountDynamicElements();
    this._attachEventListeners();
  }

  // ---------------------------------------------------------------------------
  // HTML builders
  // ---------------------------------------------------------------------------

  /**
   * Builds the HTML string for the General tab.
   *
   * @private
   * @param {string[]} hashes - All card names.
   * @returns {string}
   */
  _buildGeneralTabHTML(hashes) {
    // Cards with at least one defined trigger_entity — eligible for priority.
    const triggerHashes = hashes.filter(h => this._getTriggerList(h).length > 0);

    // Current order: keep valid entries, add missing ones at the end.
    const priority = [
      ...this._config.trigger_priority.filter(h => triggerHashes.includes(h)),
      ...triggerHashes.filter(h => !this._config.trigger_priority.includes(h)),
    ];

    return `
      <div class="field">
        <div id="default-select-slot"></div>
      </div>
      ${this._globalOptionalFields
        .filter(f => this._config[f.key] !== undefined)
        .map(f => `
          <div style="display:flex; align-items:center; gap:4px; margin-bottom:8px;">
            <ha-textfield label="${f.label}" type="${f.key === "loading_time" ? "number" : "text"}" data-config="${f.key}" value="${this._config[f.key] ?? ""}" style="flex:1;"></ha-textfield>
            <button class="btn-icon btn-delete" data-del-global="${f.key}"><ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
          </div>
        `).join("")}
      ${triggerHashes.length > 1 ? `
        <div class="field">
          <label>${this._t("label_trigger_priority")}</label>
          <div id="trigger-priority-list">
            ${priority.map((h, i) => `
              <div class="input-row" data-priority-row="${i}">
                <span style="flex:1; font-size:13px; color:var(--primary-text-color);">${h}</span>
                <button class="btn-icon" data-prio-up="${i}" ${i === 0 ? "disabled style=\"opacity:.3\"" : ""}>
                  <ha-icon icon="mdi:arrow-up"></ha-icon>
                </button>
                <button class="btn-icon" data-prio-down="${i}" ${i === priority.length - 1 ? "disabled style=\"opacity:.3\"" : ""}>
                  <ha-icon icon="mdi:arrow-down"></ha-icon>
                </button>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
  }

  /**
   * Builds the HTML string skeleton for a card tab.
   * The card picker and entity pickers are mounted imperatively afterward.
   *
   * @private
   * @param   {string}   hash      - The card name for this tab.
   * @param   {string[]} allHashes - All card names.
   * @returns {string}
   */
  _buildCardTabHTML(hash, allHashes) {
    const triggerList = this._getTriggerList(hash);
    const fallbacks   = allHashes.filter(h => h !== hash);
    const cardConfig  = this._config.cards[hash];
    const hasCard     = cardConfig && cardConfig.type;
    const cardTypeName = hasCard
      ? (cardConfig.type.startsWith("custom:") ? cardConfig.type.slice(7) : cardConfig.type)
          .split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "";
    const cardLabel = cardConfig?.title || cardConfig?.name || "";

    return `
      <!-- Hash identifier -->
      <div style="margin-bottom:8px;">
        <ha-textfield label="${this._t("label_hash_id")}" type="text" value="${hash}" data-old-hash="${hash}" class="hash-rename-input" style="width:100%;"></ha-textfield>
      </div>

      <!-- Timer + Fallback -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
        <ha-textfield label="${this._t("label_auto_return")}" type="number" data-timer-hash="${hash}" value="${this._config.timers[hash] || ""}" style="width:100%;"></ha-textfield>
        <div id="fallback-select-slot"></div>
      </div>

      <!-- Trigger entities -->
      <div class="field">
        <label>${this._t("label_trigger_entities")}</label>
        <div id="entity-pickers-container">
          ${triggerList.map((_, i) => `
            <div class="entity-row" data-entity-row="${i}">
              <div class="entity-picker-slot" data-picker-slot="${i}"></div>
              <button class="btn-icon btn-delete" data-del-entity="${i}" data-hash="${hash}">
                <ha-icon icon="mdi:trash-can-outline"></ha-icon>
              </button>
            </div>
          `).join("")}
        </div>
        <button class="btn-icon btn-add-entity" id="add-ent-btn">
          <ha-icon icon="mdi:plus"></ha-icon> ${this._t("btn_add_entity")}
        </button>
      </div>

      <!-- Card selection -->
      <div class="card-editor-slot">
        <div class="card-editor-label">${this._t("label_child_card")}</div>
        ${hasCard ? `
          <div class="card-row">
            <div class="card-info">
              <span class="card-type">${cardTypeName}</span>
              ${cardLabel ? `<span class="card-name">(${cardLabel})</span>` : ""}
            </div>
            <div class="card-actions">
              <ha-icon-button
                id="btn-edit-card"
                label="${this._t("edit_card")}"
                path="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
              ></ha-icon-button>
              <ha-icon-button
                id="btn-remove-card"
                label="${this._t("delete_card")}"
                path="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                style="color: var(--error-color);"
              ></ha-icon-button>
            </div>
          </div>
        ` : `
          <div class="no-card">${this._t("no_card")}</div>
          <div id="card-picker-slot"></div>
        `}
      </div>

      <!-- Delete this hash tab -->
      <div class="bottom-actions">
        <button class="btn-icon btn-delete" data-del-card="${hash}">
          <ha-icon icon="mdi:trash-can-outline"></ha-icon> ${this._t("btn_delete_card")}
        </button>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Imperative DOM mounting
  // ---------------------------------------------------------------------------

  /**
   * Mounts all HA custom elements that require JS property assignment.
   * Called synchronously after innerHTML is written.
   *
   * @private
   * @returns {void}
   */
  _mountDynamicElements() {
    const hash = this._selectedTab === 0
      ? null
      : Object.keys(this._config.cards)[this._selectedTab - 1];

    // ── General tab ──────────────────────────────────────────────────────────
    if (this._selectedTab === 0) {
      // Mount native ha-select for the default card picker.
      const defaultSlot = this.shadowRoot.querySelector("#default-select-slot");
      if (defaultSlot) {
        const hashes = Object.keys(this._config.cards);
        const sel = document.createElement("ha-select");
        sel.label = this._t("label_default_card");
        sel.value = this._config.default || "";
        sel.style.width = "100%";

        const noneItem = document.createElement("mwc-list-item");
        noneItem.value = "";
        noneItem.textContent = this._t("choose");
        sel.appendChild(noneItem);

        hashes.forEach(h => {
          const item = document.createElement("mwc-list-item");
          item.value = h;
          item.textContent = h;
          sel.appendChild(item);
        });

        sel.addEventListener("selected", (ev) => {
          ev.stopPropagation();
          const val = sel.value;
          if (val) this._config.default = val;
          this._valueChanged();
        });
        sel.addEventListener("closed", (ev) => ev.stopPropagation());

        defaultSlot.appendChild(sel);
      }
      return;
    }

    // ── Card tab ─────────────────────────────────────────────────────────────

    // 1. Mount ha-entity-picker elements into their placeholder slots.
    this._getTriggerList(hash).forEach((entityId, index) => {
      const slot = this.shadowRoot.querySelector(`[data-picker-slot="${index}"]`);
      if (!slot) return;

      const picker = document.createElement("ha-entity-picker");
      picker.hass              = this._hass;
      picker.value             = entityId;
      picker.allowCustomEntity = false;
      picker.style.width       = "100%";
      picker.addEventListener("value-changed", (ev) => this._handleEntityChanged(ev, hash, index));
      slot.appendChild(picker);
    });

    // 2. Mount ha-select + mwc-list-item for the fallback dropdown.
    // ha-select must be created imperatively — innerHTML cannot set .value on LitElement.
    const fallbacks = Object.keys(this._config.cards).filter(h => h !== hash);
    const fallbackSlot = this.shadowRoot.querySelector("#fallback-select-slot");
    if (fallbackSlot) {
      const sel = document.createElement("ha-select");
      sel.label   = this._t("label_fallback");
      sel.value   = this._config.error_fallback[hash] || "";
      sel.style.width = "100%";

      const noneItem = document.createElement("mwc-list-item");
      noneItem.value = "";
      noneItem.textContent = this._t("none");
      sel.appendChild(noneItem);

      fallbacks.forEach(f => {
        const item = document.createElement("mwc-list-item");
        item.value = f;
        item.textContent = f;
        sel.appendChild(item);
      });

      sel.addEventListener("selected", (ev) => {
        ev.stopPropagation();
        const val = sel.value;
        if (val) this._config.error_fallback[hash] = val;
        else delete this._config.error_fallback[hash];
        this._valueChanged();
      });

      // ha-select also fires "closed" on dropdown close — stop it bubbling up.
      sel.addEventListener("closed", (ev) => ev.stopPropagation());

      fallbackSlot.appendChild(sel);
    }

    // 3. Mount hui-card-picker if no card is configured yet.
    const pickerSlot = this.shadowRoot.querySelector("#card-picker-slot");
    if (pickerSlot) {
      this._mountCardPicker(hash, pickerSlot);
    }
  }

  /**
   * Asynchronously mounts a hui-card-picker into the given container.
   * hui-card-picker is lazy-loaded by HA, so we wait for it to be defined
   * before creating it — the same approach used by actions-card.
   *
   * When the user picks a card, the picker fires a `config-changed` event
   * whose detail.config contains the new card configuration.
   *
   * @private
   * @async
   * @param {string}      hash      - The card name being configured.
   * @param {HTMLElement} container - The DOM node to insert the picker into.
   * @returns {Promise<void>}
   */
  async _mountCardPicker(hash, container) {
    try {
      await window.loadCardHelpers();
      await customElements.whenDefined("hui-card-picker");
    } catch (e) {
      console.warn("[HashTimerCardEditor] Could not load hui-card-picker:", e);
      return;
    }

    // Abort if the user navigated away while we were waiting.
    if (!this.shadowRoot.contains(container)) return;

    const picker = document.createElement("hui-card-picker");
    picker.hass     = this._hass;
    picker.lovelace = this._lovelace || undefined;

    picker.addEventListener("config-changed", (ev) => {
      ev.stopPropagation();
      this._config.cards[hash] = ev.detail.config;
      this._valueChanged();
    });

    container.appendChild(picker);
  }

  // ---------------------------------------------------------------------------
  // Child card dialog — same mechanism as actions-card
  // ---------------------------------------------------------------------------

  /**
   * Opens a native hui-dialog-edit-card modal to edit the child card config.
   * The dialog is appended to document.body, exactly as actions-card does it.
   * When the user saves, the returned config is written back to our config.
   *
   * @private
   * @async
   * @param {string} hash - The card name whose child card should be edited.
   * @returns {Promise<void>}
   */
  async _openCardEditDialog(hash) {
    const cardConfig = this._config.cards[hash];
    if (!cardConfig) return;

    try {
      await customElements.whenDefined("hui-dialog-edit-card");
    } catch (e) {
      console.warn("[HashTimerCardEditor] hui-dialog-edit-card not available:", e);
      return;
    }

    // Resolve the lovelace context — walk the composed DOM tree if needed.
    const lovelace = this._lovelace || this._resolveLovelaceContext();

    const dialog = document.createElement("hui-dialog-edit-card");
    dialog.hass = this._hass;
    this._activeDialogs.add(dialog);
    document.body.appendChild(dialog);

    // Clean up when the dialog closes.
    const onClose = () => {
      dialog.removeEventListener("dialog-closed", onClose);
      this._activeDialogs.delete(dialog);
      if (dialog.parentNode) {
        try { dialog.parentNode.removeChild(dialog); } catch (_) {}
      }
    };
    dialog.addEventListener("dialog-closed", onClose);

    await dialog.showDialog({
      cardConfig,
      lovelaceConfig: lovelace,
      saveCardConfig: (newConfig) => {
        if (!newConfig) return;
        this._config.cards[hash] = newConfig;
        this._valueChanged();
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------------

  /**
   * Attaches all event listeners to static elements after each _render() call.
   *
   * @private
   * @returns {void}
   */
  _attachEventListeners() {
    const root = this.shadowRoot;

    // Tab navigation
    root.querySelectorAll(".tab-item").forEach(el => {
      el.onclick = () => { this._selectedTab = parseInt(el.dataset.idx); this._render(); };
    });

    // Dropdown toggle
    const dropBtn = root.getElementById("dropbtn");
    if (dropBtn) {
      dropBtn.onclick = (e) => {
        e.stopPropagation();
        root.getElementById("myDropdown").classList.toggle("show");
      };
    }
    window.onclick = () => root.getElementById("myDropdown")?.classList.remove("show");

    // Add new card tab
    root.getElementById("add-card-btn").onclick = () => {
      for (let i = (Object.keys(this._config.cards).length + 1); i <= 100; i++) {
        const id = `CARD ${i}`;
        if (!this._config.cards[id]) {
          this._config.cards[id] = { type: "button", name: "Card" };
          this._selectedTab = Object.keys(this._config.cards).length;
          this._valueChanged();
          break;
        }
      }
    };

    // General: field changes
    root.querySelectorAll("[data-config]").forEach(el => {
      el.onchange = () => { this._config[el.dataset.config] = el.value; this._valueChanged(); };
    });

    // General: add optional field
    root.querySelectorAll("[data-add-global]").forEach(el => {
      el.onclick = () => {
        this._config[el.dataset.addGlobal] = el.dataset.addGlobal === "loading_time" ? 1000 : "";
        this._valueChanged();
      };
    });

    // General: remove optional field
    root.querySelectorAll("[data-del-global]").forEach(el => {
      el.onclick = () => { delete this._config[el.dataset.delGlobal]; this._valueChanged(); };
    });

    // Card tab: rename hash
    root.querySelectorAll(".hash-rename-input").forEach(el => {
      el.onchange = (ev) => {
        const oldH = el.dataset.oldHash;
        const newH = ev.target.value.trim();
        if (!newH || newH === oldH) return;

        this._config.cards[newH] = this._config.cards[oldH];
        delete this._config.cards[oldH];

        ["timers", "error_fallback", "trigger_entities"].forEach(k => {
          if (this._config[k][oldH] !== undefined) {
            this._config[k][newH] = this._config[k][oldH];
            delete this._config[k][oldH];
          }
        });

        if (this._config.default === oldH) this._config.default = newH;
        this._valueChanged();
      };
    });

    // Card tab: timer
    root.querySelectorAll("[data-timer-hash]").forEach(el => {
      el.onchange = () => {
        const val = parseInt(el.value);
        if (val > 0) this._config.timers[el.dataset.timerHash] = val;
        else delete this._config.timers[el.dataset.timerHash];
        this._valueChanged();
      };
    });

    // Card tab: open edit dialog for child card
    const btnEditCard = root.getElementById("btn-edit-card");
    if (btnEditCard) {
      btnEditCard.onclick = () => {
        const hash = Object.keys(this._config.cards)[this._selectedTab - 1];
        this._openCardEditDialog(hash);
      };
    }

    // Card tab: remove child card (shows picker again)
    const btnRemoveCard = root.getElementById("btn-remove-card");
    if (btnRemoveCard) {
      btnRemoveCard.onclick = () => {
        const hash = Object.keys(this._config.cards)[this._selectedTab - 1];
        this._config.cards[hash] = {};
        this._valueChanged();
      };
    }

    // Card tab: add trigger entity
    const btnAddEnt = root.getElementById("add-ent-btn");
    if (btnAddEnt) {
      btnAddEnt.onclick = () => {
        const hash = Object.keys(this._config.cards)[this._selectedTab - 1];
        const list = this._getTriggerList(hash);
        list.push("");
        this._config.trigger_entities[hash] = list;
        this._render();

        requestAnimationFrame(() => {
          const pickers = this.shadowRoot.querySelectorAll("ha-entity-picker");
          if (pickers.length) pickers[pickers.length - 1].focus();
        });
      };
    }

    // Card tab: delete trigger entity
    root.querySelectorAll("[data-del-entity]").forEach(el => {
      el.onclick = () => {
        const h   = el.dataset.hash;
        const idx = parseInt(el.dataset.delEntity);
        const list = this._getTriggerList(h);
        list.splice(idx, 1);
        this._config.trigger_entities[h] = list;
        this._valueChanged();
      };
    });

    // Card tab: delete entire card tab
    root.querySelectorAll("[data-del-card]").forEach(el => {
      el.onclick = () => {
        const h = el.dataset.delCard;
        delete this._config.cards[h];
        ["timers", "error_fallback", "trigger_entities"].forEach(k => delete this._config[k][h]);
        this._selectedTab = 0;
        this._valueChanged();
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles a value-changed event from an ha-entity-picker.
   *
   * @private
   * @param {CustomEvent} ev    - The value-changed event.
   * @param {string}      hash  - The card name.
   * @param {number}      index - Index in the trigger list.
   * @returns {void}
   */
  _handleEntityChanged(ev, hash, index) {
    const list = this._getTriggerList(hash);
    list[index] = ev.detail.value || "";
    this._config.trigger_entities[hash] = list.filter(e => e !== "");
    this._valueChanged();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Resolves a Lovelace context by walking up the composed DOM tree.
   * Used as fallback when this._lovelace is not injected by HA.
   *
   * @private
   * @returns {Object} A lovelace-like context object.
   */
  _resolveLovelaceContext() {
    let node = this;
    while (node) {
      if (node.lovelace) return node.lovelace;
      node = node.getRootNode?.()?.host ?? node.parentElement;
    }
    return { editMode: true, config: { resources: [] } };
  }

  /**
   * Returns the trigger entity list for a given card as a mutable array.
   * Handles both array and legacy comma-separated string formats.
   *
   * @private
   * @param {string} hash - The card name.
   * @returns {string[]}
   */
  _getTriggerList(hash) {
    const raw = this._config.trigger_entities[hash];
    if (!raw) return [];
    if (Array.isArray(raw)) return [...raw];
    return raw.split(",").map(e => e.trim()).filter(e => e !== "");
  }

  /**
   * Dispatches a config-changed event and triggers a re-render.
   *
   * @private
   * @returns {void}
   */
  _valueChanged() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
    this._render();
  }
}

customElements.define("hash-timer-card-editor", HashTimerCardEditor);