# SEO landing pages

Qalor targets five commercial search terms: **warmtenet**, **warmtenet tekening**,
**warmtenet-ontwerp**, **warmtenetberekening** and **warmtenet business case**.

Those are not five variations on one query — they are three different search intents (a
drawing, a design, a calculation/business case), and one URL cannot rank for all of them.
So the site, while still a single SPA bundle, is prerendered to several real URLs.

## How it works

- **`SERVICE_PAGES` in `packages/shared/src/index.ts`** is the single source of truth: slug,
  `<title>`, meta description, H1, intro and body blocks, one entry per landing page.
- **`packages/web/src/App.tsx`** matches `window.location.pathname` against those slugs and
  renders `pages/ServicePage.tsx` instead of the marketing page. No router — the same
  path-check approach `/admin` already uses.
- **`scripts/prerender.mjs`** derives its `ROUTES` from the same array, navigates to each
  one in a real browser, and writes `<slug>/index.html` with that page's own title,
  description, canonical, Open Graph tags and JSON-LD. `sitemap.xml` and `llms.txt` are
  generated from it too.

Adding a landing page is therefore **one edit** in `packages/shared` — the URL, the
prerendered file, the sitemap entry and the schema all follow from it.

### Why the service pages are lean

`ServicePage.tsx` renders the Navbar, its own copy, and the Footer — deliberately *not* the
full marketing page underneath. Repeating About/Team/Werkproces/Projecten on all four would
put four near-identical copies of those sections into the index, which is the exact
duplicate-content problem these pages exist to solve.

### Preview builds are noindexed

The GitHub Pages preview serves the same real content as production. Built with `NOINDEX=1`,
every page gets a `robots` noindex meta tag, and the sitemap line is dropped from
`robots.txt`. Canonicals always point at `SITE_URL` (qalor.nl) regardless of where the build
is hosted, so even an indexed preview page credits the real domain.

Note that `robots.txt` deliberately does **not** say `Disallow: /` on a noindex build:
disallow blocks the crawl, so Googlebot never fetches the page and never sees the noindex —
and a URL blocked that way can still be indexed from an external link, with no way to get it
removed. Allowing the crawl so it reads the noindex is what actually keeps it out.

## Status of the copy

The copy below is **the client's own text**, supplied and signed off. It replaces the earlier
draft that had been written from what was already on the site.

That draft carried two open questions, and the client's wording closes both:

1. **"Ontwerp" versus "calculatie".** The ontwerp page had been written to the narrow reading —
   tracé, dimensionering and vermogensbepaling as part of the calculation, no execution or
   realisation. The client kept that framing and made it explicit (*"Qalor richt zich op
   projectcalculaties en de daarbij behorende technische analyses"*), so the narrow reading is
   the confirmed one.
2. **Terminology.** Gelijktijdigheid, aansluitwaarde, onrendabele top and temperatuurregime all
   survive in the client's own text, which settles that this is how Qalor puts it.

Editing the copy means editing `SERVICE_PAGES` in `packages/shared/src/index.ts`. **This file is
a transcript, not the source the site renders from** — the section below is generated from that
array, so regenerate it rather than editing it here, or the two silently diverge.

`SERVICE_PAGES` can now move into `SiteContent` as a list section alongside `projects`/`team`,
making it admin-editable with no shape change. That was deferred while the text was still going
to be rewritten; it no longer is, so the only thing left is doing it.

---

# De teksten

## /warmtenet-tekening/

**H1:** Warmtenet tekening in AutoCAD

**Intro**

Een betrouwbare calculatie van een warmteproject begint bij de tekening. Zonder een nauwkeurig
beeld van de ondergrond is elke kostenraming een aanname. Daarom is de nettekening in AutoCAD
bij Qalor altijd de eerste stap.

**De ondergrond als basis**

De basis voor de ondergrond is steevast een oriëntatiemelding van het Kadaster. Die geeft
gedetailleerd weer wat er al ligt: kabels, leidingen, riolering en de bijbehorende beheerders.
Op die ondergrond wordt het tracé van het warmtenet ingetekend, inclusief de punten waar het net
bestaande infrastructuur kruist. Juist die kruisingen en de beschikbare ruimte in het profiel
bepalen in de praktijk een wezenlijk deel van de aanlegkosten — een tracé dat logisch lijkt, kan
in de werkelijke ondergrond onuitvoerbaar of onnodig duur zijn.

**Wat de tekening oplevert**

De nettekening legt het tracé, de leidingdiameters en de aansluitleidingen vast in één document
dat de rest van het project draagt. De lengtes komen rechtstreeks uit de tekening en de
diameters worden berekend en dit vormt de invoer voor de investeringscalculatie (CAPEX).

**Waarom door deskundigen met een zeer uitgebreide ervaring**

Een tekening maken kan een tekenaar. Beoordelen of een tracé in de praktijk uitvoerbaar is,
vraagt iemand die warmtenetten heeft aangelegd, onderhouden en geëxploiteerd. Het team van Qalor
bestaat uit drie warmte-experts met samen meer dan 130 jaar ervaring in de energiewereld,
waarvan meer dan 100 jaar bij warmtebedrijven — bij Eneco en haar rechtsvoorgangers. Die
ervaring zit verwerkt in de keuzes die tijdens het tekenen gemaakt worden, en dat komt terug in
de kwaliteit van het opgeleverde werk.

---

## /warmtenet-ontwerp/

**H1:** Warmtenet ontwerp

**Intro**

Het ontwerp van een warmtenet is de vertaling van een warmtevraag naar een net dat die vraag
daadwerkelijk kan leveren — bij strenge vorst, tijdens de piekvraag. Qalor werkt dat ontwerp uit
tot het detailniveau dat nodig is om een project technisch en financieel te kunnen beoordelen.

**Tracé en dimensionering**

Het tracé volgt uit de nettekening en de ondergrond zoals die uit de oriëntatiemelding van het
Kadaster blijkt. Op basis van de vermogensbehoefte per aansluiting worden de leidingdiameters
bepaald, van de transportleiding tot aan de laatste aansluitleiding. Daarbij is de bepaling van
de gelijktijdigheid op alle niveaus in het warmtenet essentieel: niet alle aangeslotenen vragen
tegelijk hun maximale vermogen, en een net dat op de som van alle pieken wordt gedimensioneerd
is veel te zwaar en te duur. Een net dat te krap is uitgelegd, loopt daarentegen tegen zijn
grenzen aan zodra er wordt uitgebreid.

**Temperatuurregime**

De keuze voor het temperatuurregime — de aanvoer- en retourtemperatuur — werkt door in vrijwel
elke andere keuze in het ontwerp. Een lagere aanvoertemperatuur maakt duurzamere bronnen
bruikbaar en beperkt de warmteverliezen, maar stelt eisen aan de afgifte in de aangesloten
gebouwen en leidt tot grotere diameters. Welk regime passend is, hangt af van de gebouwvoorraad
in het projectgebied — en dus van de gebouwendatabase.

**Ruimte voor groei**

Warmtenetten worden zelden in één keer volledig aangelegd. In het ontwerp wordt daarom rekening
gehouden met latere uitbreiding: waar kan het net worden doorgetrokken, welke diameters maken
die uitbreiding mogelijk, en wat betekent dat voor de investering (CAPEX) nu tegenover de
investeringen (CAPEX) later. Die afweging is expliciet onderdeel van het ontwerp en komt terug
in de scenario's van de exploitatieberekening.

**Ontwerp en calculatie in samenhang**

Qalor richt zich op projectcalculaties en de daarbij behorende technische analyses. Het ontwerp
staat daarbij niet los van de cijfers: elke ontwerpkeuze is tegelijk een kostenkeuze, en beide
worden in samenhang uitgewerkt.

---

## /warmtenetberekening/

**H1:** Warmtenetberekening en gebouwendatabase

**Intro**

Een warmtenetberekening is niet sterker dan de gegevens waarop zij rust. Daarom stelt Qalor voor
elk project eerst een complete gebouwendatabase op of doet gefundeerde aannamen op dat gebied,
voordat vermogens en diameters worden bepaald.

**De gebouwendatabase**

De database wordt opgebouwd uit diverse openbare bronnen, waaronder het BAG-register en Atlas
Leefomgeving. Per pand in het projectgebied worden gegevens vastgelegd zoals bouwjaar,
gebruiksoppervlak en functie. Dat levert een beeld op van de gebouwvoorraad die aanmerkelijk
preciezer is dan een aanname op wijkniveau: twee wijken met evenveel woningen kunnen sterk
verschillen in warmtevraag zodra bouwjaar en woningtype uiteenlopen.

**Van gebouw naar warmtevraag**

Op basis van die gegevens wordt per pand de warmtevraag en de benodigde aansluitwaarde bepaald.
Die worden vervolgens samengevoegd tot de vermogensbehoefte van het net als geheel, waarbij
rekening wordt gehouden met gelijktijdigheid — de mate waarin aangeslotenen tegelijk warmte
vragen. Het verschil tussen de som van alle individuele pieken en het werkelijke te leveren
piekvermogen is aanzienlijk, en bepaalt rechtstreeks hoe zwaar het net en de opwekinstallatie
uitgevoerd moeten worden.

**Van warmtevraag naar leidingdimensionering**

Met de vermogens per aansluiting en het gekozen temperatuurregime volgen de benodigde debieten
en daarmee de leidingdiameters per tracé. Samen met de tracélengtes uit de nettekening levert
dat een onderbouwde materiaalstaat op: hoeveel meter van welke diameter, en waar. Dat is
tegelijk de invoer voor de kostenraming — de berekening en de business case gebruiken dezelfde
uitgangspunten, zodat een wijziging in het ontwerp overal consistent doorwerkt.

**Navolgbaar en toetsbaar**

Elke aanname in de berekening is terug te voeren op een bron of een expliciet vastgelegd
uitgangspunt. Dat maakt het resultaat toetsbaar voor derden — voor een gemeente, een
woningcorporatie of een financier die de onderbouwing wil kunnen volgen in plaats van alleen de
uitkomst te zien.

---

## /warmtenet-business-case/

**H1:** Warmtenet business case en exploitatieberekening

**Intro**

Een warmtenet is een investering met een looptijd van decennia. De vraag is zelden of het
technisch kan, maar of het financieel uit kan — en onder welke voorwaarden. De
exploitatieberekening van Qalor brengt dat in beeld.

**Het financiële model**

Op basis van de AutoCAD-tekening, de gebouwendatabase en de bepaling van het concept en de
investeringen van de energieopwekinstallatie wordt een uitgebreid financieel model in Excel
gevuld. Aan de investeringskant staan het leidingnet, de opwekinstallatie, de aansluitkosten en
de engineering; aan de opbrengstenkant het vastrecht, de warmtelevering en eventuele subsidies.
Daartegenover staan de exploitatiekosten over de looptijd: onderhoud, inkoop van warmte en
elektriciteit, netverliezen en beheer.

**Scenario's in plaats van één uitkomst**

Een business case met één uitkomst suggereert een zekerheid die er niet is. Daarom worden op
basis van verschillende uitgangspunten diverse scenario's doorgerekend: een hoger of lager
aansluitpercentage, een ander temperatuurregime, een andere warmtebron, een gefaseerde in plaats
van een integrale aanleg. Zo wordt zichtbaar welke variabelen het resultaat werkelijk bepalen —
en dat is een ander beeld dan de variabele waar in de discussie vaak de meeste aandacht naar
uitgaat.

**Onrendabele top**

Uit de berekening volgt of, en zo ja in welke mate, er sprake is van een onrendabele top: het
deel van de investering dat niet uit de exploitatie kan worden terugverdiend. Die uitkomst is de
basis voor het gesprek over subsidie, over de verdeling van kosten tussen partijen, of over de
vraag of het project in deze vorm haalbaar is.

**Onderbouwd door mensen die het geëxploiteerd hebben**

De lange ervaring van het team met het realiseren, onderhouden en exploiteren van warmte- en
koudenetten bij Eneco en haar rechtsvoorgangers zorgt voor een gedegen en betrouwbare
calculatie. Kostenposten die in theoretische modellen vaak ontbreken, komen uit de praktijk — en
die praktijk is waar een business case zonder lange ervaring kan ontsporen.
