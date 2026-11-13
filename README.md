# DropJS

A tiny dropdown library prototype in plain HTML, CSS and JavaScript. No dependencies, no build step.

This is a prototype, not a production framework.

## Run it locally

**Option 1: just open the file.** Double-click `index.html`. It works straight from disk.

**Option 2: use a local server** (closer to a real site). In the `DropJS` folder, run one of:

```bash
# Python 3 (already installed on most systems)
python3 -m http.server 8000

# or Node.js
npx serve
```

Then open <http://localhost:8000> in your browser.

## Files

```text
DropJS/
├── index.html   Demo page (navigation, profile, searchable, customization)
├── style.css    Part 1: DropJS styles. Part 2: demo page styles
├── dropjs.js    The library (one class, no dependencies)
└── README.md
```

To use DropJS in your own page, copy `dropjs.js` and Part 1 of `style.css`, then:

```html
<link rel="stylesheet" href="style.css">
<div id="dropdown"></div>
<script src="dropjs.js"></script>
<script>
  const menu = new DropJS({
    target: "#dropdown",
    label: "Menu",
    options: [
      { label: "Home", value: "home" },
      { label: "Settings", value: "settings" },
      { label: "Profile", value: "profile" }
    ],
    onSelect: (option) => console.log(option.value)
  });

  menu.open();
  menu.close();
</script>
```

DropJS builds the button and the menu inside `target`. Anything already inside that element is replaced.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `target` | required | CSS selector or element to build the dropdown in |
| `options` | required | Array of `{ label, value }`. Use `{ divider: true }` for a separator line |
| `label` | `"Select"` | Text on the button |
| `triggerHTML` | none | Custom HTML for the button, such as an avatar. `label` then becomes the screen reader name |
| `searchable` | `false` | Adds a search box that filters the list (also makes the button show your choice) |
| `selectable` | `false` | The button shows the chosen option and a check mark appears in the list |
| `placeholder` | `"Search…"` | Placeholder of the search box |
| `emptyText` | `"No results"` | Message when a search matches nothing |
| `align` | `"left"` | `"left"` or `"right"`. The menu slides back on screen if it would overflow |
| `className` | none | Extra CSS class(es) on the wrapper. Built in: `dropjs--ghost`, `dropjs--wide` |
| `style` | none | CSS variables as an object, for example `{ accent: "#d6336c", radius: "4px" }` |
| `onSelect` | none | `function (option, dropdown) {}`, called when an option is chosen |

## Methods

| Method | What it does |
| --- | --- |
| `open()` | Opens the menu |
| `close()` | Closes the menu |
| `toggle()` | Opens or closes |
| `getValue()` | Value of the chosen option (select mode), or `null` |
| `setStyle(obj)` | Updates the style variables |
| `destroy()` | Removes the dropdown and its listeners |

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space, ↓ or ↑ on the button | Open the menu |
| ↓ / ↑ | Move through options (wraps around) |
| Home / End | First / last option (not in searchable menus) |
| Enter (or Space) | Choose the highlighted option |
| Esc | Close and return to the button |
| Tab | Close and move on |

Clicking outside a dropdown also closes it. Several dropdowns can live on one page.

## Styling

Every dropdown is styled with CSS variables, so you can change the look in three ways:

1. The `style` option or `setStyle()` (as shown on the demo page).
2. Your own CSS, for example `#my-menu { --dropjs-accent: tomato; }`.
3. A custom class through `className`, then write rules for `.dropjs-trigger`, `.dropjs-menu`, `.dropjs-item`, and so on.

Variables: `--dropjs-accent`, `--dropjs-bg`, `--dropjs-text`, `--dropjs-muted`, `--dropjs-border`, `--dropjs-radius`.

## Known limits of the prototype

- Needs a modern browser (uses `color-mix()`, the `inert` attribute and `:focus-visible`).
- Options are read when the menu opens, but there is no method to replace them yet.
- No multi-select, grouped options, or type-ahead by letter.
