// Tur- og jaktlogg
// All logikken i appen. Filen er delt i seksjoner:
// oppsett, lagring, hjelpefunksjoner, kart, skjema, liste, min posisjon og meldinger.
// Helt nederst startes appen.

'use strict';

// ---------- Oppsett ----------

// Nøkkelen dataene lagres under i nettleserens localStorage
const LAGRINGSNOKKEL = 'jaktlogg.registreringer';

// Alle typene appen kjenner. vilt: true betyr at skjemaet spør om hendelse (Observert/Felt).
const TYPER = {
  'Rype':      { ikon: '🐦', farge: '#3B6FB6', vilt: true },
  'Skogsfugl': { ikon: '🪶', farge: '#2C6B3F', vilt: true },
  'Hare':      { ikon: '🐇', farge: '#8A5CB8', vilt: true },
  'Elg':       { ikon: '🫎', farge: '#7A4A22', vilt: true },
  'Rådyr':     { ikon: '🦌', farge: '#B07D12', vilt: true },
  'Post/tårn': { ikon: '🪜', farge: '#3E4A52', vilt: false },
  'Leirplass': { ikon: '⛺', farge: '#0F7C86', vilt: false },
  'Annet':     { ikon: '📌', farge: '#7A7A7A', vilt: false },
};

// Kartutsnitt som viser hele Norge. Brukes når det ikke finnes registreringer ennå.
const NORGE = [[57.9, 4.5], [71.2, 31.1]];

// Sann når skjermen er så bred at listen ligger som sidepanel (samme grense som i style.css)
const bredSkjerm = window.matchMedia('(min-width: 900px)');

// Elementer fra index.html
const visListeKnapp = document.getElementById('vis-liste');
const antallTotalt = document.getElementById('antall-totalt');
const melding = document.getElementById('melding');
const meldingTekst = document.getElementById('melding-tekst');
const lukkMeldingKnapp = document.getElementById('lukk-melding');
const hint = document.getElementById('hint');
const posisjonKnapp = document.getElementById('min-posisjon');
const posisjonKnappTekst = document.getElementById('min-posisjon-tekst');
const listePanel = document.getElementById('liste-panel');
const lukkListeKnapp = document.getElementById('lukk-liste');
const filterType = document.getElementById('filter-type');
const liste = document.getElementById('liste');
const listeTom = document.getElementById('liste-tom');
const dialog = document.getElementById('skjema-dialog');
const skjema = document.getElementById('skjema');
const skjemaTittel = document.getElementById('skjema-tittel');
const skjemaPosisjon = document.getElementById('skjema-posisjon');
const typeValg = document.getElementById('type-valg');
const hendelseFelt = document.getElementById('hendelse-felt');
const feilLagring = document.getElementById('feil-lagring');
const lagreKnapp = document.getElementById('lagre');
const avbrytKnapp = document.getElementById('avbryt');

// ---------- Lagring (localStorage) ----------

// Alle registreringene. Endres bare via lagre(), så skjermen og lagringen alltid er like.
let registreringer = hentRegistreringer();

// Leser registreringene. Ødelagte data hoppes over i stedet for å krasje appen.
function hentRegistreringer() {
  try {
    const data = JSON.parse(localStorage.getItem(LAGRINGSNOKKEL));
    return Array.isArray(data) ? data.filter(erGyldig) : [];
  } catch {
    return [];
  }
}

function erGyldig(r) {
  return r !== null && typeof r === 'object'
    && typeof r.id === 'string'
    && Object.hasOwn(TYPER, r.type)
    && typeof r.tidspunkt === 'string' && !Number.isNaN(Date.parse(r.tidspunkt))
    && Number.isFinite(r.lat) && Number.isFinite(r.lng);
}

// Lagrer en ny versjon av listen og tegner kart og liste på nytt.
// Gir false hvis nettleseren ikke lot oss lagre (for eksempel full lagringsplass).
function lagre(nyListe) {
  try {
    localStorage.setItem(LAGRINGSNOKKEL, JSON.stringify(nyListe));
  } catch {
    return false;
  }
  registreringer = nyListe;
  oppdaterVisning();
  return true;
}

function finnRegistrering(id) {
  return registreringer.find((r) => r.id === id);
}

function lagId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Hjelpefunksjoner ----------

// Lager et HTML-element. Tekst settes med textContent, så den aldri tolkes som HTML.
function lagElement(tag, klasse, tekst) {
  const element = document.createElement(tag);
  if (klasse) element.className = klasse;
  if (tekst !== undefined) element.textContent = tekst;
  return element;
}

// Rundt symbol med farge og ikon for en type. Brukes på kartet, i listen og i skjemaet.
function lagSymbol(type) {
  const symbol = lagElement('span', 'symbol', TYPER[type].ikon);
  symbol.style.setProperty('--farge', TYPER[type].farge);
  symbol.setAttribute('aria-hidden', 'true');
  return symbol;
}

function tosifret(tall) {
  return String(tall).padStart(2, '0');
}

// Dato og klokkeslett akkurat nå, i samme format som skjemafeltene bruker
function naa() {
  const d = new Date();
  return {
    dato: `${d.getFullYear()}-${tosifret(d.getMonth() + 1)}-${tosifret(d.getDate())}`,
    klokkeslett: `${tosifret(d.getHours())}:${tosifret(d.getMinutes())}`,
  };
}

// Gjør "2026-10-20T14:30" om til "20. okt. 2026, 14:30"
const tidsformat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'medium', timeStyle: 'short' });

function formaterTid(tidspunkt) {
  return tidsformat.format(new Date(tidspunkt));
}

// Kort tekst som "Observert, 3 stk." for vilt eller "1 stk." for steder
function beskrivelse(r) {
  return r.hendelse ? `${r.hendelse}, ${r.antall} stk.` : `${r.antall} stk.`;
}

// ---------- Kart ----------

// Dobbeltklikk-zoom er slått av fordi ett trykk på kartet åpner skjemaet
const kart = L.map('kart', { doubleClickZoom: false });

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsytere',
}).addTo(kart);

const markorLag = L.layerGroup().addTo(kart); // alle markørene
const markorer = new Map();                    // id → markør, så listen finner riktig markør
let nyttPunkt = null;                          // midlertidig markør mens skjemaet er åpent
let sistLukketPopup = 0;

function lagIkon(type) {
  return L.divIcon({
    className: 'markor',
    html: lagSymbol(type),
    iconSize: [36, 36],
    popupAnchor: [0, -20],
  });
}

function tegnMarkorer() {
  markorLag.clearLayers();
  markorer.clear();
  for (const r of registreringer) {
    const markor = L.marker([r.lat, r.lng], { icon: lagIkon(r.type), title: r.type })
      .bindPopup(() => lagPopup(r))
      .addTo(markorLag);
    markorer.set(r.id, markor);
  }
}

// Innholdet i boblen som åpnes når du trykker på en markør
function lagPopup(r) {
  const boks = lagElement('div', 'popup');
  boks.append(
    lagElement('p', 'popup__tittel', r.type),
    lagElement('p', '', beskrivelse(r)),
    lagElement('p', 'popup__dempet', formaterTid(r.tidspunkt)),
  );
  if (r.notat) boks.append(lagElement('p', 'popup__notat', r.notat));
  boks.append(lagHandlinger(r, 'popup__knapper'));
  return boks;
}

// Knappene Rediger og Slett. Brukes både i boblen på kartet og i listen.
function lagHandlinger(r, klasse) {
  const handlinger = lagElement('div', klasse);
  const beskrivendeNavn = `${r.type}, ${formaterTid(r.tidspunkt)}`;

  const redigerKnapp = lagElement('button', 'knapp knapp--sekundar knapp--liten', 'Rediger');
  redigerKnapp.type = 'button';
  redigerKnapp.setAttribute('aria-label', `Rediger ${beskrivendeNavn}`);
  redigerKnapp.addEventListener('click', () => redigerRegistrering(r.id));

  const slettKnapp = lagElement('button', 'knapp knapp--sekundar knapp--liten knapp--fare', 'Slett');
  slettKnapp.type = 'button';
  slettKnapp.setAttribute('aria-label', `Slett ${beskrivendeNavn}`);
  slettKnapp.addEventListener('click', () => slettRegistrering(r.id));

  handlinger.append(redigerKnapp, slettKnapp);
  return handlinger;
}

// Viser alle registreringene, eller hele Norge hvis det ikke finnes noen
function visAlleEllerNorge() {
  if (registreringer.length > 0) {
    kart.fitBounds(registreringer.map((r) => [r.lat, r.lng]), { padding: [40, 40], maxZoom: 14 });
  } else {
    kart.fitBounds(NORGE);
  }
}

// Et trykk på kartet som bare lukker en åpen boble skal ikke åpne skjemaet.
// Leaflet lukker boblen rett før klikket kommer, så vi husker når det skjedde.
kart.on('popupclose', () => {
  sistLukketPopup = Date.now();
});

kart.on('click', (e) => {
  if (dialog.open || Date.now() - sistLukketPopup < 400) return;
  aapneSkjema(e.latlng.wrap());
});

// ---------- Skjema ----------

let redigererId = null; // id når vi redigerer, null når det er en ny registrering
let skjemaPunkt = null; // posisjonen til registreringen i skjemaet

const FELT_SOM_SJEKKES = ['type', 'antall', 'dato', 'klokkeslett'];

// Lager én flis per type i skjemaet og ett valg per type i filteret over listen
function byggTypevalg() {
  for (const type of Object.keys(TYPER)) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'type';
    input.value = type;

    const innhold = lagElement('span', 'type-flis__innhold');
    innhold.append(lagSymbol(type), lagElement('span', '', type));

    const flis = lagElement('label', 'type-flis');
    flis.append(input, innhold);
    typeValg.append(flis);

    filterType.append(new Option(type, type));
  }
}

// Åpner skjemaet. Uten registrering er det en ny registrering på punktet du trykket.
function aapneSkjema(punkt, registrering = null) {
  const felt = skjema.elements;
  skjema.reset();
  visFeil({});
  feilLagring.textContent = '';
  redigererId = registrering ? registrering.id : null;
  skjemaPunkt = punkt;

  if (registrering) {
    const [dato, klokkeslett] = registrering.tidspunkt.split('T');
    felt.type.value = registrering.type;
    felt.hendelse.value = registrering.hendelse ?? 'Observert';
    felt.antall.value = registrering.antall;
    felt.dato.value = dato;
    felt.klokkeslett.value = klokkeslett;
    felt.notat.value = registrering.notat ?? '';
  } else {
    const tid = naa();
    felt.antall.value = 1;
    felt.dato.value = tid.dato;
    felt.klokkeslett.value = tid.klokkeslett;
    visNyttPunkt(punkt);
  }

  felt.dato.max = naa().dato; // datovelgeren lar deg ikke velge fremtidige datoer
  skjemaTittel.textContent = registrering ? 'Rediger registrering' : 'Ny registrering';
  lagreKnapp.textContent = registrering ? 'Lagre endringer' : 'Lagre registrering';
  skjemaPosisjon.textContent = `Posisjon: ${punkt.lat.toFixed(5)}, ${punkt.lng.toFixed(5)}`;
  oppdaterHendelsefelt();
  dialog.showModal();
}

// Viser en oransje ring der du trykket, så du ser hvor registreringen havner
function visNyttPunkt(punkt) {
  nyttPunkt = L.marker(punkt, {
    icon: L.divIcon({ className: 'markor', html: '<span class="ny-punkt"></span>', iconSize: [24, 24] }),
    interactive: false,
    keyboard: false,
  }).addTo(kart);
}

// Hendelse (Observert/Felt) vises bare når valgt type er vilt.
// disabled gjør i tillegg at feltet ikke blir med når skjemaet leses.
function oppdaterHendelsefelt() {
  const type = skjema.elements.type.value;
  const erVilt = Boolean(TYPER[type]?.vilt);
  hendelseFelt.hidden = !erVilt;
  hendelseFelt.disabled = !erVilt;
}

// Sjekker verdiene fra skjemaet. Gir én feilmelding per felt som er feil (tomt objekt = alt ok).
function valider(verdier) {
  const feil = {};
  const antall = Number(verdier.antall);

  if (!Object.hasOwn(TYPER, verdier.type)) {
    feil.type = 'Velg en type.';
  }
  if (!/^\d+$/.test(verdier.antall) || !Number.isSafeInteger(antall) || antall < 1) {
    feil.antall = 'Antall må være et helt tall, 1 eller mer.';
  }
  if (!verdier.dato) {
    feil.dato = 'Velg en dato.';
  } else if (verdier.dato > naa().dato) {
    // Datoene er tekst som "2026-10-20", så de kan sammenlignes direkte
    feil.dato = 'Datoen kan ikke være i fremtiden.';
  }
  if (!verdier.klokkeslett) {
    feil.klokkeslett = 'Velg et klokkeslett.';
  }
  return feil;
}

function visFeil(feil) {
  for (const navn of FELT_SOM_SJEKKES) {
    visFeilFor(navn, feil[navn] ?? '');
  }
}

function visFeilFor(navn, tekst) {
  document.getElementById(`feil-${navn}`).textContent = tekst;
  const felt = skjema.elements[navn];
  if (felt instanceof HTMLInputElement) {
    felt.setAttribute('aria-invalid', tekst ? 'true' : 'false');
  }
}

// Når du endrer et felt, forsvinner feilmeldingen for det feltet
skjema.addEventListener('input', (e) => {
  if (FELT_SOM_SJEKKES.includes(e.target.name)) visFeilFor(e.target.name, '');
  if (e.target.name === 'type') oppdaterHendelsefelt();
});

skjema.addEventListener('submit', (e) => {
  e.preventDefault(); // hindrer at nettleseren laster siden på nytt
  const felt = skjema.elements;
  const verdier = {
    type: felt.type.value,
    hendelse: hendelseFelt.disabled ? null : felt.hendelse.value,
    antall: felt.antall.value.trim(),
    dato: felt.dato.value,
    klokkeslett: felt.klokkeslett.value,
    notat: felt.notat.value.trim(),
  };

  const feil = valider(verdier);
  visFeil(feil);
  const forsteFeil = Object.keys(feil)[0];
  if (forsteFeil) {
    const feltMedFeil = forsteFeil === 'type' ? typeValg.querySelector('input') : felt[forsteFeil];
    feltMedFeil.focus();
    return;
  }

  const erNy = redigererId === null;
  const registrering = {
    id: erNy ? lagId() : redigererId,
    type: verdier.type,
    hendelse: verdier.hendelse,
    antall: Number(verdier.antall),
    tidspunkt: `${verdier.dato}T${verdier.klokkeslett}`,
    notat: verdier.notat,
    lat: skjemaPunkt.lat,
    lng: skjemaPunkt.lng,
  };
  const nyListe = erNy
    ? [...registreringer, registrering]
    : registreringer.map((r) => (r.id === redigererId ? registrering : r));

  if (!lagre(nyListe)) {
    feilLagring.textContent = 'Kunne ikke lagre. Lagringsplassen i nettleseren er full eller blokkert.';
    return;
  }
  dialog.close();
  visMelding(erNy ? 'Registreringen er lagret.' : 'Endringene er lagret.');
});

avbrytKnapp.addEventListener('click', () => dialog.close());

// Kjører både ved Avbryt, Esc-tasten og etter lagring
dialog.addEventListener('close', () => {
  nyttPunkt?.remove();
  nyttPunkt = null;
  redigererId = null;
});

function redigerRegistrering(id) {
  const r = finnRegistrering(id);
  if (!r) return;
  kart.closePopup();
  aapneSkjema(L.latLng(r.lat, r.lng), r);
}

function slettRegistrering(id) {
  const r = finnRegistrering(id);
  if (!r || !confirm(`Vil du slette «${r.type}» fra ${formaterTid(r.tidspunkt)}?`)) return;
  if (lagre(registreringer.filter((x) => x.id !== id))) {
    visMelding('Registreringen er slettet.');
  } else {
    visMelding('Kunne ikke slette. Lagringen i nettleseren er blokkert.', 'feil');
  }
}

// ---------- Liste ----------

function tegnListe() {
  const valgtType = filterType.value;
  const synlige = registreringer
    .filter((r) => !valgtType || r.type === valgtType)
    // Nyeste først. Tidspunktene er tekst som "2026-10-20T14:30", så tekstsammenligning gir riktig rekkefølge.
    .sort((a, b) => (a.tidspunkt === b.tidspunkt ? 0 : a.tidspunkt < b.tidspunkt ? 1 : -1));

  liste.replaceChildren(...synlige.map(lagListerad));
  listeTom.hidden = synlige.length > 0;
  listeTom.textContent = registreringer.length === 0
    ? 'Ingen registreringer ennå. Trykk på kartet for å legge inn den første.'
    : `Ingen registreringer av typen ${valgtType}.`;

  antallTotalt.textContent = registreringer.length;
  hint.hidden = registreringer.length > 0;
}

function lagListerad(r) {
  const tekst = lagElement('span', 'rad__tekst');
  tekst.append(
    lagElement('span', 'rad__tittel', r.type),
    lagElement('span', 'rad__meta', beskrivelse(r)),
    lagElement('span', 'rad__meta', formaterTid(r.tidspunkt)),
  );
  if (r.notat) tekst.append(lagElement('span', 'rad__notat', r.notat));

  // Hele raden er en knapp som viser registreringen på kartet
  const visKnapp = lagElement('button', 'rad__vis');
  visKnapp.type = 'button';
  visKnapp.append(lagSymbol(r.type), tekst);
  visKnapp.addEventListener('click', () => visPaKart(r.id));

  const rad = lagElement('li', 'rad');
  rad.append(visKnapp, lagHandlinger(r, 'rad__handlinger'));
  return rad;
}

// Zoomer til markøren og åpner boblen. På PC ligger listen over høyre del av kartet,
// så der flytter vi midtpunktet slik at markøren havner midt i den synlige delen.
function visPaKart(id) {
  const markor = markorer.get(id);
  if (!markor) return;

  const zoom = Math.max(kart.getZoom(), 15);
  let forskyvning = 0;
  if (bredSkjerm.matches) {
    forskyvning = listePanel.offsetWidth / 2;
  } else {
    lukkListe(); // på mobil dekker listen kartet, så vi lukker den
  }

  const midtpunkt = kart.project(markor.getLatLng(), zoom).add([forskyvning, 0]);
  kart.once('moveend', () => markor.openPopup());
  kart.setView(kart.unproject(midtpunkt, zoom), zoom);
}

function listeErApen() {
  return listePanel.classList.contains('apen');
}

function aapneListe() {
  listePanel.classList.add('apen');
  listePanel.inert = false;
  visListeKnapp.setAttribute('aria-expanded', 'true');
  lukkListeKnapp.focus();
}

function lukkListe() {
  listePanel.classList.remove('apen');
  listePanel.inert = true;
  visListeKnapp.setAttribute('aria-expanded', 'false');
}

visListeKnapp.addEventListener('click', () => {
  if (listeErApen()) {
    lukkListe();
  } else {
    aapneListe();
  }
});

lukkListeKnapp.addEventListener('click', () => {
  lukkListe();
  visListeKnapp.focus();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && listeErApen() && !dialog.open) {
    lukkListe();
    visListeKnapp.focus();
  }
});

filterType.addEventListener('change', tegnListe);

// ---------- Min posisjon ----------

let minPosisjon = null; // blå prikk og sirkel som viser hvor nøyaktig posisjonen er

function finnMinPosisjon() {
  if (!('geolocation' in navigator)) {
    visMelding('Nettleseren din kan ikke finne posisjon. Prøv en annen nettleser.', 'feil');
    return;
  }
  if (!window.isSecureContext) {
    visMelding('Posisjon virker bare når siden åpnes via https (som på GitHub Pages) eller localhost.', 'feil');
    return;
  }

  settPosisjonOpptatt(true);
  navigator.geolocation.getCurrentPosition(visMinPosisjon, posisjonFeilet, {
    enableHighAccuracy: true, // bruk GPS hvis telefonen har det
    timeout: 15000,           // gi opp etter 15 sekunder
    maximumAge: 30000,        // en posisjon som er inntil 30 sekunder gammel er god nok
  });
}

function visMinPosisjon(posisjon) {
  settPosisjonOpptatt(false);
  const { latitude, longitude, accuracy } = posisjon.coords;
  const punkt = [latitude, longitude];

  minPosisjon?.remove();
  minPosisjon = L.layerGroup([
    L.circle(punkt, { radius: accuracy, color: '#1A73E8', weight: 1, fillOpacity: 0.12, interactive: false }),
    L.circleMarker(punkt, { radius: 8, color: '#FFFFFF', weight: 3, fillColor: '#1A73E8', fillOpacity: 1, interactive: false }),
  ]).addTo(kart);

  kart.setView(punkt, Math.max(kart.getZoom(), 15));
  if (melding.classList.contains('melding--feil')) skjulMelding();
}

function posisjonFeilet(feil) {
  settPosisjonOpptatt(false);
  let tekst;
  switch (feil.code) {
    case feil.PERMISSION_DENIED:
      tekst = 'Appen fikk ikke tilgang til posisjonen din. Tillat posisjon for denne nettsiden i nettleserens innstillinger, og trykk på «Min posisjon» igjen.';
      break;
    case feil.POSITION_UNAVAILABLE:
      tekst = 'Fant ikke posisjonen din. Sjekk at posisjonstjenester (GPS) er slått på.';
      break;
    case feil.TIMEOUT:
      tekst = 'Det tok for lang tid å finne posisjonen. Prøv igjen, gjerne under åpen himmel.';
      break;
    default:
      tekst = 'Kunne ikke finne posisjonen din. Prøv igjen.';
  }
  visMelding(tekst, 'feil');
}

function settPosisjonOpptatt(opptatt) {
  posisjonKnapp.disabled = opptatt;
  posisjonKnappTekst.textContent = opptatt ? 'Finner posisjon …' : 'Min posisjon';
}

posisjonKnapp.addEventListener('click', finnMinPosisjon);

// ---------- Meldinger ----------

let meldingTimer = null;

// Feilmeldinger blir stående til du lukker dem. Andre meldinger forsvinner etter 4 sekunder.
function visMelding(tekst, type = 'info') {
  clearTimeout(meldingTimer);
  meldingTekst.textContent = tekst;
  melding.classList.toggle('melding--feil', type === 'feil');
  melding.hidden = false;
  if (type !== 'feil') meldingTimer = setTimeout(skjulMelding, 4000);
}

function skjulMelding() {
  melding.hidden = true;
}

lukkMeldingKnapp.addEventListener('click', skjulMelding);

// ---------- Start ----------

function oppdaterVisning() {
  tegnMarkorer();
  tegnListe();
}

byggTypevalg();
oppdaterVisning();
visAlleEllerNorge();
