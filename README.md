# Risskov Sushi · bestilling til afhentning (demo)

Demo lavet af OviaSpecs til Risskov Sushi, Nordre Strandvej 82, 8240 Risskov. Ikke en officiel side, ingen aftale. `noindex` er sat. Del ikke linket offentligt.

## Hvad den viser
- `index.html`: kundeside. Næste ledige afhentningstid, tidslinje over aftenen, menukort med rigtige priser, og et samtaleflow i fire trin: vælg menuer → vælg afhentningstid (15 min, 16.00–19.45) → navn og telefon → bekræft. Fyldte kvarterer er grå med "fuldt – prøv 17.45". Fremskridtet er en tidslinje over aftenen. Til sidst "printes" en bon. Afhentningstid kan rettes bagefter.
- `ejer.html`: køkkenets visning. Ordrer sorteret efter afhentningstid, en kapacitetsbjælke pr. kvarter, "Sæt fuldt" med ét tryk, status Ny → Set → Godkendt → Klar → Afsluttet, røde "mangler", markerede ændringer og en køkkenliste.
- Mulig fordel (ikke bekræftet): ingen gebyr pr. ordre i forhold til bestillingsplatforme. Prisen er IKKE fastlagt.

## Kør lokalt
Åbn `index.html`, eller kør `python -m http.server 8767` i mappen og åbn http://localhost:8767/index.html. Skrifter og GSAP/ScrollTrigger/Lenis/SplitType hentes fra nettet. Uden net virker siden, men uden animation og med reserveskrifter. Alle stier er relative.

## Falske demo-data og antagelser
- Fire eksempel-ordrer ("Mette (demo)" osv.) og to kvarterer (17.15, 17.30) markeret som fuldt er opdigtede. Alt gemmes kun i `localStorage` på enheden. Ingen server, betaling, login, mails eller sms.
- DEMO-ANTAGELSER, ikke fra stedet: maks. 6 ordrer pr. kvarter (Rons brief, `CAP` i `js/shared.js`), tidligste afhentning 15 min efter bestilling (`LEAD`), sidste kvarter 19.45. Tjek med stedet.
- "Demo-tid" nederst på kundesiden skifter mellem tirsdag 16.40 (standard), tirsdag 18.10, mandag (lukket) og rigtigt ur. "Nulstil demo" ligger nederst på begge sider.
- Problemhypotesen (telefonen afbryder i spidsbelastning, afhentninger klumper sig) er IKKE bekræftet. Siden skriver kun, at der kan opstå ventetid, og at man skal ringe i god tid.

## Kilder (hentet 17. november 2026)
- https://risskovsushi.dk/ : åbningstider (tirs–lør 16–20, søn 17–20, man lukket), telefon 8613 2040, telefonen åbner kl. 12, "laves frisk", "kan opstå ventetid", links til Facebook og Instagram.
- Menukort (PDF, august 2025): https://risskovsushi.dk/wp-content/uploads/2025/08/Menukort_RisskovSushi_0825_WEB.pdf : alle menuer og priser i `js/shared.js` (20 poster). Menuen blev læst fra PDF'en visuelt; tjek priser mod stedet.
- Farverne (mørk blå-sort, grøn, sand) er hentet fra menukortets udtryk. Skrifter: Shippori Mincho og Inter Tight (Google Fonts).

## Stadig "[tjek med stedet]" / "[tjek menu]"
Enkeltstykker, tilbehør, drikkevarer, månedens tilbud, allergener, evt. nyere priser end august 2025, om der er online-bestilling eller levering, hvor lang ventetiden typisk er, betalingsmåder, stedets egne billeder (alle billeder er pladsholdere), og at kapaciteten er 6 pr. kvarter. Facebook og Instagram er ikke læst. Ingen logo eller fotos fra stedet er brugt.

## Skift billeder
Pladsholderen "Jeres eget billede her" er `<div class="ph">` i `index.html` (4:5). Læg stedets egne fotos (med tilladelse) i en mappe `img/` og erstat indholdet med `<img src="./img/..." alt="..." style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`.

## Kendte mangler
Ikke set på en rigtig telefon, kun headless Chrome (390 px) og et almindeligt Chrome-vindue. Tilgængelighed er tænkt ind (labels, tastatur, kontrast) men ikke testet med skærmlæser.
