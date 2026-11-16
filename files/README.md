# DropJS

A tiny dropdown library prototype in plain HTML, CSS and JavaScript. No dependencies, no build step.

`index.html` is **DropJS Studio**, a small visual builder for trying it out: pick components on the left, arrange them on the phone-style canvas, tune them in the Properties panel, then press **Generate** to copy the code.

This is a prototype, not a production framework.

## Run it locally

**Easiest:** open `standalone/index.html`. It is the whole website in a single file (CSS and JavaScript built in), with `standalone/studio.html` beside it for the builder. Nothing else is needed.

**Normal version:** keep every file together in one folder and open `index.html`. If the page looks unstyled or shows a huge black shape, `style.css`, `site.css` or `dropjs.js` is not in the same folder as `index.html`.

For a local server (closer to a real site), run one of these in the `DropJS` folder:

```bash
# Python 3 (already installed on most systems)
python3 -m http.server 8000

# or Node.js
npx serve
```

Then open <http://localhost:8000>.

## Files

```text
DropJS/
├── index.html       The website: hero, features, live demo, how it works, quick start
├── studio.html      DropJS Studio, a visual builder (components, canvas, properties, Generate)
├── style.css        DropJS component styles (the only CSS you need to use DropJS)
├── site.css         Website styles (index.html only)
├── studio.css       Studio styles (studio.html only)
├── dropjs.js        The library (one class, no dependencies)
├── standalone/      The same two pages with CSS and JS built in (one file each)
└── README.md
```

To use DropJS in your own page, copy `dropjs.js` and `style.css`, then:

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

## Using DropJS Studio

Open `studio.html` (or the "Open Studio" button on the website).

| Area | What it does |
| --- | --- |
| Components (left) | Click a component, press Enter on it, or drag it onto the canvas. Types: Menu, Navigation, Profile menu, Select, Searchable |
| Tree (left tab) | Lists everything on the canvas. Click a row to select it |
| Canvas (middle) | Every dropdown is live. Click one to select it, then edit it on the right |
| Properties (right) | Label, options (one per line, `---` for a divider), searchable, show chosen option, menu alignment, accent/background/text colours, corner radius, delete |
| Top bar | Project name, Open and Save (stored in this browser), New, Undo, Redo |
| Preview | Hides the editing panels so you can try the dropdowns. Press Edit to return |
| Generate | Shows ready-to-paste HTML and JavaScript for everything on the canvas |

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
| `setOptions(list)` | Replaces all options. The chosen option stays chosen if its `value` is still in the new list, otherwise the choice is cleared |
| `setStyle(obj)` | Updates the style variables |
| `destroy()` | Removes the dropdown and its listeners |

## Keyboard

| Key | Action |
| --- | --- |
| Enter, Space, ↓ or ↑ on the button | Open the menu |
| ↓ / ↑ | Move through options (wraps around) |
| Home / End | First / last option (not in searchable menus) |
| Enter (or Space) | Choose the highlighted option |
| Letters | Type-ahead: jump to the option that starts with what you type (also opens the menu from the button). Typing the same letter again cycles through matches. In searchable menus, typing filters instead |
| Esc | Close and return to the button |
| Tab | Close and move on |

Clicking outside a dropdown also closes it. Several dropdowns can live on one page.

## Styling

Every dropdown is styled with CSS variables, so you can change the look in three ways:

1. The `style` option or `setStyle()` (as shown on the demo page).
2. Your own CSS, for example `#my-menu { --dropjs-accent: tomato; }`.
3. A custom class through `className`, then write rules for `.dropjs-trigger`, `.dropjs-menu`, `.dropjs-item`, and so on.

Variables: `--dropjs-accent`, `--dropjs-bg`, `--dropjs-text`, `--dropjs-muted`, `--dropjs-border`, `--dropjs-radius`, plus the optional `--dropjs-active` (highlight colour, a tint of the accent by default).

## Known limits of the prototype

- Needs a modern browser (uses `color-mix()`, the `inert` attribute and `:focus-visible`).
- No multi-select or grouped options.
