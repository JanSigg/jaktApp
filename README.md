# Tur- og jaktlogg

En enkel nettapp for å markere observasjoner og steder på et kart mens du er på tur eller jakt, og se dem igjen senere.

Prototypen er laget som en skoleoppgave.

## Formål

På tur og jakt er det nyttig å huske hvor du så rypa, hvor elgen ble felt eller hvor posten står. Appen gjør det raskt å legge inn slike punkter på kartet fra mobilen, og samler dem i en liste du kan bla i etterpå.

## Funksjoner

- **Ny registrering:** Trykk på kartet og fyll ut skjemaet. Du velger type (Rype, Skogsfugl, Hare, Elg, Rådyr, Post/tårn, Leirplass eller Annet), og for vilt om det ble observert eller felt. Du fyller også inn antall, dato og klokkeslett, og kan legge til et notat. Hver type får sin egen farge og sitt eget ikon på kartet.
- **Liste:** Alle registreringene, med de nyeste først. Du kan filtrere på type, trykke på en rad for å se den på kartet, og redigere eller slette den.
- **Min posisjon:** Sentrerer kartet der du er. Hvis appen ikke får tilgang til posisjonen din, får du en tydelig melding.

## Teknologi

- Ren HTML, CSS og JavaScript, uten byggesteg og uten server
- [Leaflet](https://leafletjs.com/) 1.9.4 til kartet, hentet fra CDN
- Kartfliser fra [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Data lagres i nettleserens `localStorage`

## Personvern

Alt du registrerer blir lagret i nettleseren på enheten din. Ingenting sendes til en server. Det betyr også at registreringene ikke følger med til andre enheter eller nettlesere, og at de forsvinner hvis du sletter nettleserdataene.

## Kjøre lokalt

Start en enkel lokal server i prosjektmappen:

```bash
python3 -m http.server 8000
```

Åpne deretter <http://localhost:8000> i nettleseren.

## Filer

| Fil | Innhold |
| --- | --- |
| `index.html` | Oppsettet for siden: kart, knapper, liste og skjema |
| `style.css` | Utseendet, laget for mobil først |
| `app.js` | All logikk: kart, lagring, skjema, liste og posisjon |

## Kilder

Kartdata © [OpenStreetMap](https://www.openstreetmap.org/copyright)-bidragsytere, lisensiert under ODbL. Kartflisene følger [OSMs retningslinjer for bruk](https://operations.osmfoundation.org/policies/tiles/), og passer derfor for en prototype, men ikke for en app med mange brukere.
