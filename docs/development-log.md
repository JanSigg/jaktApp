# Development log – Tur- og jaktlogg

A log of how the first version of the app was planned, built, tested and published.

- **Date:** 2026-10-20
- **Developer:** JanSigg, working with Claude Code (an AI coding assistant)
- **Live app:** <https://jansigg.github.io/jaktApp/>
- **Repository:** <https://github.com/JanSigg/jaktApp> (private)

## Summary

The first version of the app was built and published in one session. It has three features: new registrations on the map, a list with filtering, editing and deleting, and «Min posisjon». It is a static site with no server: Leaflet and OpenStreetMap provide the map, and data is saved in the browser's localStorage. It was tested in a desktop browser, at phone size and on a real phone, and is published with GitHub Pages.

## 1. Requirements

The assignment asked for a simple prototype of a trip and hunting log with a map:

- A static site made of `index.html`, `style.css` and `app.js`, with no server, login or API keys
- Vanilla JavaScript and Leaflet from a CDN, with OpenStreetMap tiles and correct attribution
- Data stored in localStorage
- Works on GitHub Pages and looks good on a phone
- Norwegian user interface
- Validation: type is required, the number must be a positive whole number, and the date cannot be in the future

## 2. Plan and decisions

The plan was written and approved before any code was written.

**Files**

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: map, buttons, list panel and form |
| `style.css` | Appearance, designed for phones first |
| `app.js` | All logic: map, storage, form, list and location |
| `README.md` | What the app is, its purpose and how to run it |

**Data model.** All registrations are stored as a list under the localStorage key `jaktlogg.registreringer`. Each registration looks like this:

```js
{
  id: "lq3x9k-a7f2",              // unique id, used for editing and deleting
  type: "Rype",                   // one of the 8 types
  hendelse: "Observert",          // "Observert" | "Felt" | null for places
  antall: 3,                      // positive whole number
  tidspunkt: "2026-10-20T14:30",  // date and time, local time
  notat: "Flokk ved bekken",      // optional
  lat: 61.2345,
  lng: 9.8765
}
```

**Decisions**

1. The Observert/Felt choice is shown only for game: Rype, Skogsfugl, Hare, Elg and Rådyr. It is hidden for Post/tårn, Leirplass and Annet, because «Annet» may just be a place.
2. Only the date is checked against today. A later time on the same day is allowed, but tomorrow's date is not.

## 3. Build

- Leaflet 1.9.4 is loaded from unpkg with security hashes (SRI). These were checked against the real files before use.
- **Design.** The colors are dark spruce green with hunter orange, as on hunting clothing, and orange is used only for actions. The font is Barlow. Each type has its own color and icon, both on the map and in the form.
- **Form.** It opens as a pop-up window over the map. A temporary orange ring shows where you tapped.
- **List.** On phones it slides up from the bottom. On wide screens it sits as a panel on the right.
- **Storage.** All changes go through one function, `lagre()`. It saves to localStorage and then redraws the map and the list, so the two always match.
- **Safety.** Notes are shown as plain text, so HTML in a note cannot break the page. Damaged data in localStorage is skipped instead of crashing the app.

## 4. Testing on the computer

The app was run on a local server and tested in Chrome, both at full size and at phone size (390 px wide).

| Test | Result |
| --- | --- |
| Tapping the map opens the form, with date and time set to now | Passed |
| Saving without a type shows «Velg en type.» | Passed |
| Number 0, -1, 2.5 or empty shows an error | Passed |
| A future date shows an error, but a later time today is allowed | Passed |
| Observert/Felt appears for game and is hidden for places | Passed |
| Saving creates a marker with the right color and icon | Passed |
| The list is sorted newest first, and the type filter works | Passed |
| Tapping a row zooms to the marker and opens its popup | Passed |
| Editing keeps the position and does not create a copy | Passed |
| Deleting asks for confirmation and removes the marker and row | Passed |
| Registrations are still there after reloading | Passed |
| Location denied shows a clear error message (simulated) | Passed |
| Location allowed centers the map with a blue dot (simulated) | Passed |
| Tapping the map to close a popup does not open the form | Passed |
| No errors in the browser console | Passed |

**Bugs found and fixed during testing**

1. «Rype» looked selected when the form opened, because it got keyboard focus automatically. Focus now goes to the form title.
2. The time field moved out of line when the date field showed an error. The fields now stay aligned.

## 5. Publishing

| Step | Details |
| --- | --- |
| First commit | `dc05e5d` – «Første versjon av tur- og jaktloggen», pushed to `main` |
| GitHub Pages | Was off, and the repository is private. Pages for private repositories needs GitHub Pro, which the account has. |
| Pages turned on | Publishes from branch `main`, folder `/`. The build finished at 13:21. |
| Checked | The site, `app.js` and `style.css` all load. The site is public and loads without logging in. |
| README update | `4a89b2d` – «Legg til lenke til appen på GitHub Pages i README» |

## 6. Testing on a phone

On the live site, using a real phone:

- «Min posisjon» found the location and centered the map.
- With location blocked in the browser settings, the red error message appeared as expected.

## 7. Sharing

- **The app** is public. Anyone with the link can use it, with no GitHub account needed.
- **The code** is in a private repository, so only people with access can see it.
- **Registrations** are saved only in each user's own browser. Other people, including the teacher, see an empty map and cannot see your registrations.

## 8. Open items

- Decide how the teacher should see the code: add them as a collaborator on GitHub, make the repository public, or hand in a ZIP of the code.

## 9. Known limitations

- The moose icon (🫎) is a newer emoji and may show as an empty box on older devices, such as Windows 10.
- OpenStreetMap's free map tiles are fine for a prototype, but not for an app with many users.
- Double-tap zoom is turned off, because one tap on the map opens the form. Use two fingers or the +/− buttons to zoom.
- Registrations do not sync between devices or browsers.
