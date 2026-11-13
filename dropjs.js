/**
 * DropJS - a tiny dropdown prototype in plain JavaScript.
 *
 *   const menu = new DropJS({
 *     target: "#dropdown",
 *     options: [{ label: "Home", value: "home" }]
 *   });
 *   menu.open();
 *   menu.close();
 *
 * See README.md for every setting.
 */

let dropCount = 0; // gives every dropdown a unique id

class DropJS {
  constructor(config) {
    config = config || {};

    // 1. Find the element the dropdown will be built inside
    const root =
      typeof config.target === "string"
        ? document.querySelector(config.target)
        : config.target;
    if (!root) {
      throw new Error('DropJS: target "' + config.target + '" was not found.');
    }
    if (!Array.isArray(config.options)) {
      throw new Error("DropJS: options must be an array.");
    }

    // 2. Settings (whatever you pass in overrides these defaults)
    this.config = Object.assign(
      {
        label: "Select",      // text on the button
        triggerHTML: "",      // custom HTML for the button (overrides label)
        searchable: false,    // adds a search box
        selectable: false,    // button shows the chosen option
        placeholder: "Search…",
        emptyText: "No results",
        align: "left",        // "left" or "right"
        className: "",        // extra CSS class(es) for the wrapper
        style: null,          // e.g. { accent: "#e11d48", radius: "4px" }
        onSelect: null        // function (option, dropdown) {}
      },
      config
    );

    this.root = root;
    this.options = config.options;
    this.id = "dropjs-" + ++dropCount;
    this.isSelect = this.config.selectable || this.config.searchable;

    // 3. State
    this.isOpen = false;
    this.selected = null;  // the chosen option (select mode only)
    this.visible = [];     // options currently shown in the list
    this.items = [];       // the matching <li> elements
    this.activeIndex = -1; // highlighted item (keyboard / hover)

    this._build();
    this._bind();
  }

  /* ---------------------------------------------------------
     Public methods
     --------------------------------------------------------- */

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    if (this.input) this.input.value = "";
    this._renderList();
    this._position();

    this.menu.removeAttribute("inert");
    this.root.classList.add("is-open");
    this.trigger.setAttribute("aria-expanded", "true");
    this.focusEl.focus({ preventScroll: true });
  }

  // returnFocus: send keyboard focus back to the button
  close(returnFocus) {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.root.classList.remove("is-open");
    this.trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) this.trigger.focus();

    // "inert" keeps the hidden menu out of the Tab order. It is applied on the
    // next tick so a Tab key press can finish moving focus first.
    setTimeout(() => {
      if (!this.isOpen) this.menu.setAttribute("inert", "");
    }, 0);
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  // Value of the chosen option (select mode), or null
  getValue() {
    return this.selected ? this.selected.value : null;
  }

  // Each key becomes a CSS variable: { accent: "red" } sets --dropjs-accent
  setStyle(style) {
    for (const key in style) {
      this.root.style.setProperty("--dropjs-" + key, style[key]);
    }
  }

  destroy() {
    document.removeEventListener("pointerdown", this._onDocPointerDown);
    document.removeEventListener("keydown", this._onDocKeydown);
    window.removeEventListener("resize", this._onResize);
    this.root.innerHTML = "";
    this.root.classList.remove(
      "dropjs", "dropjs--select", "dropjs--align-right", "has-value", "is-open", "is-up"
    );
  }

  /* ---------------------------------------------------------
     Building the HTML
     --------------------------------------------------------- */

  _build() {
    const c = this.config;
    const listRole = this.isSelect ? "listbox" : "menu";

    this.root.innerHTML = "";
    this.root.classList.add("dropjs");
    if (this.isSelect) this.root.classList.add("dropjs--select");
    if (c.align === "right") this.root.classList.add("dropjs--align-right");
    if (c.className) {
      c.className.split(" ").filter(Boolean).forEach((name) => {
        this.root.classList.add(name);
      });
    }
    if (c.style) this.setStyle(c.style);

    // Button
    this.trigger = document.createElement("button");
    this.trigger.type = "button";
    this.trigger.className = "dropjs-trigger";
    this.trigger.setAttribute("aria-haspopup", listRole);
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("aria-controls", this.id + "-menu");
    this.trigger.innerHTML =
      '<span class="dropjs-trigger-content"></span>' +
      '<svg class="dropjs-chevron" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">' +
      '<path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';

    this.labelEl = this.trigger.querySelector(".dropjs-trigger-content");
    if (c.triggerHTML) {
      this.labelEl.innerHTML = c.triggerHTML;
      this.trigger.setAttribute("aria-label", c.label); // name for screen readers
    } else {
      this.labelEl.textContent = c.label;
    }

    // Menu (starts hidden and inert)
    this.menu = document.createElement("div");
    this.menu.className = "dropjs-menu";
    this.menu.id = this.id + "-menu";
    this.menu.setAttribute("inert", "");

    // Optional search box
    if (c.searchable) {
      const wrap = document.createElement("div");
      wrap.className = "dropjs-search";

      this.input = document.createElement("input");
      this.input.type = "text";
      this.input.className = "dropjs-input";
      this.input.placeholder = c.placeholder;
      this.input.setAttribute("autocomplete", "off");
      this.input.setAttribute("aria-label", c.placeholder);
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-expanded", "true");
      this.input.setAttribute("aria-autocomplete", "list");
      this.input.setAttribute("aria-controls", this.id + "-list");

      wrap.appendChild(this.input);
      this.menu.appendChild(wrap);
    }

    // List of options
    this.list = document.createElement("ul");
    this.list.className = "dropjs-list";
    this.list.id = this.id + "-list";
    this.list.setAttribute("role", listRole);
    this.list.tabIndex = -1;
    this.menu.appendChild(this.list);

    // "No results" message
    this.empty = document.createElement("div");
    this.empty.className = "dropjs-empty";
    this.empty.textContent = c.emptyText;
    this.empty.hidden = true;
    this.menu.appendChild(this.empty);

    this.root.appendChild(this.trigger);
    this.root.appendChild(this.menu);

    // The element that holds keyboard focus while the menu is open
    this.focusEl = this.input || this.list;
  }

  // Draws the options (filtered by the search box, if there is one)
  _renderList() {
    const query = this.input ? this.input.value.trim().toLowerCase() : "";
    const itemRole = this.isSelect ? "option" : "menuitem";

    this.list.innerHTML = "";
    this.visible = [];
    this.items = [];
    this.activeIndex = -1;

    this.options.forEach((option) => {
      if (option.divider) {
        if (query) return; // hide dividers while searching
        const line = document.createElement("li");
        line.className = "dropjs-divider";
        line.setAttribute("role", "separator");
        this.list.appendChild(line);
        return;
      }

      if (query && option.label.toLowerCase().indexOf(query) === -1) return;

      const index = this.visible.length;
      const li = document.createElement("li");
      li.className = "dropjs-item";
      li.id = this.id + "-item-" + index;
      li.dataset.index = index;
      li.setAttribute("role", itemRole);
      li.textContent = option.label;

      if (this.isSelect) {
        const isChosen = this.selected === option;
        li.setAttribute("aria-selected", isChosen ? "true" : "false");
        if (isChosen) li.classList.add("is-selected");
      }

      this.visible.push(option);
      this.items.push(li);
      this.list.appendChild(li);
    });

    this.empty.hidden = this.visible.length > 0;

    // Highlight: first match while searching, otherwise the chosen option
    const start = query ? 0 : this.visible.indexOf(this.selected);
    this._setActive(this.visible.length ? start : -1);
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */

  _bind() {
    // Click the button
    this.trigger.addEventListener("click", () => this.toggle());

    // Arrow keys on the button open the menu
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      this.open();
      if (this.activeIndex === -1) this._move(e.key === "ArrowDown" ? 1 : -1);
    });

    // Keys inside the menu
    this.menu.addEventListener("keydown", (e) => this._onMenuKeydown(e));
    this.menu.addEventListener("keyup", (e) => {
      // Space selects on key-up so the key press can't "click" the button we
      // move focus back to.
      if (e.key === " " && !this.config.searchable && this.isOpen) {
        this._select(this.activeIndex);
      }
    });

    // Search box
    if (this.input) {
      this.input.addEventListener("input", () => this._renderList());
    }

    // Mouse: choose an item, highlight on hover
    this.list.addEventListener("click", (e) => {
      const li = e.target.closest(".dropjs-item");
      if (li) this._select(Number(li.dataset.index));
    });
    this.list.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".dropjs-item");
      if (!li) return;
      const index = Number(li.dataset.index);
      if (index !== this.activeIndex) this._setActive(index);
    });
    // keep focus where it is when clicking inside the list
    this.list.addEventListener("mousedown", (e) => e.preventDefault());

    // Click outside closes
    this._onDocPointerDown = (e) => {
      if (this.isOpen && !this.root.contains(e.target)) this.close();
    };
    document.addEventListener("pointerdown", this._onDocPointerDown);

    // Escape closes
    this._onDocKeydown = (e) => {
      if (e.key === "Escape" && this.isOpen) {
        e.preventDefault();
        this.close(true);
      }
    };
    document.addEventListener("keydown", this._onDocKeydown);

    // Keep the menu on screen when the window changes size
    this._onResize = () => {
      if (this.isOpen) this._position();
    };
    window.addEventListener("resize", this._onResize);
  }

  _onMenuKeydown(e) {
    const searchable = this.config.searchable;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this._move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._move(-1);
    } else if (e.key === "Home" && !searchable) {
      e.preventDefault();
      this._setActive(0);
    } else if (e.key === "End" && !searchable) {
      e.preventDefault();
      this._setActive(this.visible.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat) this._select(this.activeIndex);
    } else if (e.key === " " && !searchable) {
      e.preventDefault(); // stops the page scrolling; selection happens on key-up
    } else if (e.key === "Tab") {
      this.close();
    }
  }

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  // Move the highlight up (-1) or down (+1), wrapping around
  _move(direction) {
    const count = this.visible.length;
    if (!count) return;
    if (this.activeIndex === -1) {
      this._setActive(direction > 0 ? 0 : count - 1);
    } else {
      this._setActive((this.activeIndex + direction + count) % count);
    }
  }

  _setActive(index) {
    const previous = this.items[this.activeIndex];
    if (previous) previous.classList.remove("is-active");

    this.activeIndex = index;
    const item = this.items[index];

    if (!item) {
      this.focusEl.removeAttribute("aria-activedescendant");
      return;
    }

    item.classList.add("is-active");
    this.focusEl.setAttribute("aria-activedescendant", item.id);

    // Scroll the list (not the page) so the item is visible
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < this.list.scrollTop) {
      this.list.scrollTop = top;
    } else if (bottom > this.list.scrollTop + this.list.clientHeight) {
      this.list.scrollTop = bottom - this.list.clientHeight;
    }
  }

  _select(index) {
    const option = this.visible[index];
    if (!option) return;

    if (this.isSelect) {
      this.selected = option;
      this.labelEl.textContent = option.label;
      this.root.classList.add("has-value");
    }

    this.close(true);
    if (typeof this.config.onSelect === "function") {
      this.config.onSelect(option, this);
    }
  }

  // Keep the menu inside the window: slide it sideways, or open it upwards
  _position() {
    const gap = 8;
    const box = this.root.getBoundingClientRect();
    const menuWidth = this.menu.offsetWidth;
    const menuHeight = this.menu.offsetHeight;
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = window.innerHeight;

    let left = this.config.align === "right" ? box.right - menuWidth : box.left;
    left = Math.max(gap, Math.min(left, viewWidth - menuWidth - gap));
    this.menu.style.left = left - box.left + "px";

    const noRoomBelow = box.bottom + gap + menuHeight > viewHeight;
    const roomAbove = box.top - gap - menuHeight > 0;
    this.root.classList.toggle("is-up", noRoomBelow && roomAbove);
  }
}

window.DropJS = DropJS;
