# SEO landing pages

Qalor targets a set of commercial search terms, one landing page each: **warmtenet**,
**warmtenet tekening**, **warmtenet-ontwerp**, **warmtenetberekening**, **warmtenet business
case**, **onrendabele top**, **haalbaarheidsonderzoek warmtenet**, **gelijktijdigheid** and
**Wet collectieve warmte** — plus three English pages for en-US, where a Dutch-only site
cannot appear at all.

**They must be linked, not merely built.** The first four shipped orphaned: nothing on the
site pointed at them, so they were reachable only from `sitemap.xml` and collected almost no
internal link equity. `scripts/check-internal-links.mjs` now fails the build if any page is
unlinked from its language hub or reaches no sibling.

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
gebruiksoppervlak en functie. Dat levert een beeld op van de gebouwvoorraad dat aanmerkelijk
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

---
# De nieuwe teksten

Deze teksten zijn in huis geschreven, in het register van de bestaande tekst hierboven. Dat is
het enige verschil met de sectie daarvoor: die is door de klant zelf aangeleverd. Het onderscheid
staat hier genoteerd omdat het uitmaakt wie je raadpleegt als er iets aan moet veranderen, niet
omdat er een goedkeuringsstap tussen zit.

Twee soorten toevoeging:

1. **Veelgestelde vragen** op de vier bestaande pagina's. Die beantwoorden de zoekopdrachten die
   mensen werkelijk intypen, in hun bewoording in plaats van die van de bodytekst, en worden als
   `FAQPage` JSON-LD meegegeven — wat de vermelding in de resultatenpagina breder maakt.
2. **Vier nieuwe Nederlandse pagina's en drie Engelse.** Elk gekozen op een eigen zoekintentie.

Aanpassen betekent: `SERVICE_PAGES` in `packages/shared/src/index.ts` wijzigen, niet dit bestand —
deze sectie is een transcript en loopt anders stil uit de pas met wat de site rendert.

**De Engelse pagina's bedienen en-US**, waar qalor.nl anders niet verschijnt omdat er geen
Engelstalige inhoud is. Het bereik daarvan is klein: wie in Nederland een warmtenet aanbesteedt,
zoekt in het Nederlands. Ze staan er op uitdrukkelijk verzoek.

## /warmtenet-tekening/ — veelgestelde vragen

**Waarom begint een calculatie van een warmtenet met een tekening?**

Zonder een nauwkeurig beeld van de ondergrond is elke kostenraming een aanname. De lengtes van het trace en de leidingdiameters komen rechtstreeks uit de nettekening, en die vormen de invoer voor de investeringscalculatie. Begint de calculatie zonder tekening, dan rust zij op geschatte lengtes.

**Welke ondergrond gebruikt Qalor voor de nettekening?**

Steevast een orientatiemelding van het Kadaster. Die geeft gedetailleerd weer wat er al ligt: kabels, leidingen, riolering en de bijbehorende beheerders. Op die ondergrond wordt het trace ingetekend, inclusief de punten waar het net bestaande infrastructuur kruist.

**Waarom bepalen juist de kruisingen een deel van de aanlegkosten?**

Een trace dat op kaart logisch lijkt, kan in de werkelijke ondergrond onuitvoerbaar of onnodig duur zijn. De kruisingen met bestaande infrastructuur en de beschikbare ruimte in het profiel bepalen in de praktijk een wezenlijk deel van de kosten, en die komen pas in beeld op een tekening met de juiste ondergrond.

## /warmtenet-ontwerp/ — veelgestelde vragen

**Wat betekent gelijktijdigheid bij het dimensioneren van een warmtenet?**

Niet alle aangeslotenen vragen tegelijk hun maximale vermogen. Een net dat op de som van alle pieken wordt gedimensioneerd is veel te zwaar en te duur; een net dat te krap is uitgelegd loopt tegen zijn grenzen aan zodra er wordt uitgebreid. De bepaling van de gelijktijdigheid op alle niveaus in het net is daarom essentieel.

**Hoe wordt het temperatuurregime gekozen?**

Een lagere aanvoertemperatuur maakt duurzamere bronnen bruikbaar en beperkt de warmteverliezen, maar stelt eisen aan de afgifte in de aangesloten gebouwen en leidt tot grotere diameters. Welk regime passend is hangt af van de gebouwvoorraad in het projectgebied, en dus van de gebouwendatabase.

**Wordt in het ontwerp rekening gehouden met latere uitbreiding?**

Ja. Warmtenetten worden zelden in een keer volledig aangelegd. In het ontwerp wordt vastgelegd waar het net kan worden doorgetrokken en welke diameters die uitbreiding mogelijk maken, en wat dat betekent voor de investering nu tegenover de investeringen later. Die afweging komt terug in de scenario's van de exploitatieberekening.

## /warmtenetberekening/ — veelgestelde vragen

**Waar komen de gegevens voor de gebouwendatabase vandaan?**

Uit diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving. Per pand in het projectgebied worden gegevens vastgelegd zoals bouwjaar, gebruiksoppervlak en functie.

**Waarom niet gewoon rekenen met een aanname op wijkniveau?**

Twee wijken met evenveel woningen kunnen sterk verschillen in warmtevraag zodra bouwjaar en woningtype uiteenlopen. Een database per pand levert een beeld op dat aanmerkelijk preciezer is, en dat verschil werkt door in de vermogens, de diameters en uiteindelijk in de investering.

**Is de warmtenetberekening toetsbaar voor derden?**

Elke aanname is terug te voeren op een bron of een expliciet vastgelegd uitgangspunt. Dat maakt het resultaat navolgbaar voor een gemeente, een woningcorporatie of een financier die de onderbouwing wil kunnen volgen in plaats van alleen de uitkomst te zien.

## /warmtenet-business-case/ — veelgestelde vragen

**Wat is een onrendabele top?**

Het deel van de investering dat niet uit de exploitatie kan worden terugverdiend. Uit de berekening volgt of daarvan sprake is en zo ja in welke mate. Die uitkomst is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen partijen, of over de vraag of het project in deze vorm haalbaar is.

**Waarom worden er meerdere scenario's doorgerekend?**

Een business case met een enkele uitkomst suggereert een zekerheid die er niet is. Door verschillende uitgangspunten door te rekenen - een hoger of lager aansluitpercentage, een ander temperatuurregime, een andere warmtebron, gefaseerde in plaats van integrale aanleg - wordt zichtbaar welke variabelen het resultaat werkelijk bepalen.

**Welke kosten zitten er in de exploitatieberekening?**

Aan de investeringskant het leidingnet, de opwekinstallatie, de aansluitkosten en de engineering. Aan de opbrengstenkant het vastrecht, de warmtelevering en eventuele subsidies. Daartegenover de exploitatiekosten over de looptijd: onderhoud, inkoop van warmte en elektriciteit, netverliezen en beheer.

## /onrendabele-top-warmtenet/ 

**Title:** Onrendabele top warmtenet berekenen | Qalor

**Meta description:** De onrendabele top van een warmtenet onderbouwd berekenen: welk deel van de investering niet uit de exploitatie terugkomt, en waar dat vandaan komt.

**H1:** Onrendabele top van een warmtenet berekenen

**Intro**

Bij vrijwel elk warmtenet komt het gesprek uit op dezelfde vraag: welk deel van de investering komt niet uit de exploitatie terug, en wie draagt dat. De onrendabele top is het antwoord op die vraag - maar alleen als de berekening eronder navolgbaar is.

**Wat de onrendabele top precies is**

De onrendabele top is het deel van de investering dat over de looptijd niet wordt terugverdiend uit de exploitatie. Het is geen eigenschap van de techniek maar de uitkomst van een rekensom: investering, opbrengsten en kosten over decennia, tegen elkaar afgezet. Verandert een van die posten, dan verandert de onrendabele top mee - en dat is precies waarom een enkel getal zonder onderbouwing weinig waard is.

**Waar het bedrag vandaan komt**

De onrendabele top volgt uit de exploitatieberekening en dus uit de posten daarin: het leidingnet en de opwekinstallatie aan de investeringskant, het vastrecht en de warmtelevering aan de opbrengstenkant, en over de looptijd het onderhoud, de inkoop van warmte en elektriciteit, de netverliezen en het beheer. Elk van die posten is terug te voeren op de nettekening, de gebouwendatabase of een expliciet vastgelegd uitgangspunt.

**Welke variabelen het bedrag werkelijk bepalen**

Het aansluitpercentage, het temperatuurregime en de keuze van de warmtebron doen in de meeste projecten meer met de uitkomst dan de post waar in de discussie de meeste aandacht naar uitgaat. Door scenario's naast elkaar door te rekenen wordt zichtbaar welke variabelen het resultaat dragen, en welke in de praktijk nauwelijks verschil maken.

**Waarvoor de uitkomst gebruikt wordt**

De onrendabele top is zelden een eindpunt. Het is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen gemeente, corporatie en warmtebedrijf, of over de vraag of het project in deze vorm doorgang moet vinden. Een uitkomst die niet navolgbaar is, houdt in dat gesprek geen stand.

**Veelgestelde vragen**

*Hoe bereken je de onrendabele top van een warmtenet?*

Door de volledige exploitatie over de looptijd door te rekenen: investering, opbrengsten en kosten, met de nettekening en de gebouwendatabase als onderbouwing. Het verschil dat niet uit de exploitatie terugkomt is de onrendabele top. Een berekening zonder die onderbouwing levert een getal op dat niet te toetsen is.

*Betekent een onrendabele top dat een project niet haalbaar is?*

Nee. Vrijwel elk warmtenet kent er een. De vraag is hoe groot die is, welke variabelen hem bepalen en of er partijen of subsidies zijn die hem kunnen dragen. Dat is een andere vraag dan of het project technisch kan.

*Kan de onrendabele top nog omlaag?*

Vaak wel, en meestal niet via de post waar het gesprek zich op richt. Een ander temperatuurregime, een gefaseerde aanleg of een hoger aansluitpercentage werken in veel projecten sterker door dan een scherpere prijs op het leidingwerk. Welke dat zijn, volgt uit de scenario's.

## /haalbaarheidsonderzoek-warmtenet/ 

**Title:** Haalbaarheidsonderzoek warmtenet | Qalor

**Meta description:** Haalbaarheidsonderzoek voor een warmtenet: technische en financiele onderbouwing van een projectgebied, voordat er groot geld aan vervolgstappen gaat.

**H1:** Haalbaarheidsonderzoek warmtenet

**Intro**

Voordat een warmtenet ontworpen wordt, staat er een andere vraag: is dit gebied hiervoor geschikt, en onder welke voorwaarden. Een haalbaarheidsonderzoek beantwoordt die vraag met cijfers in plaats van met een aanname.

**Wat er onderzocht wordt**

Het projectgebied wordt in kaart gebracht: welke gebouwen staan er, wat is hun warmtevraag, welke bronnen zijn beschikbaar en hoe zou een trace door de bestaande ondergrond lopen. Daaruit volgt een eerste beeld van de investering en van de exploitatie - genoeg om te beoordelen of vervolgstappen zinvol zijn.

**Waarom het met de gebouwen begint**

De warmtevraag bepaalt vrijwel alles wat erna komt: de vermogens, de diameters, de omvang van de opwekinstallatie en daarmee de investering. Die vraag wordt per pand bepaald uit openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving, en niet geschat op wijkniveau. Twee wijken met evenveel woningen kunnen sterk verschillen zodra bouwjaar en woningtype uiteenlopen.

**Wat een haalbaarheidsonderzoek niet is**

Het is geen ontwerp en geen definitieve business case. Het detailniveau is bewust lager: genoeg om een go of no-go te onderbouwen, niet genoeg om op aan te besteden. Blijkt het gebied kansrijk, dan zijn de nettekening, de warmtenetberekening en de exploitatieberekening de vervolgstappen, die op dezelfde uitgangspunten voortbouwen.

**Toetsbaar voor wie meebeslist**

Een haalbaarheidsonderzoek belandt zelden bij een enkele lezer. Gemeente, woningcorporatie, netbeheerder en financier kijken elk met een andere vraag mee. Elke aanname is daarom terug te voeren op een bron of een vastgelegd uitgangspunt, zodat de onderbouwing te volgen is en niet alleen de uitkomst.

**Veelgestelde vragen**

*Wat kost een haalbaarheidsonderzoek voor een warmtenet?*

Dat hangt af van de omvang van het projectgebied en van het detailniveau dat nodig is om de beslissing te kunnen nemen. Een gebied van enkele honderden woningen vraagt een ander onderzoek dan een wijk met utiliteit erbij. Qalor bepaalt de omvang in overleg, op basis van de vraag die beantwoord moet worden.

*Wat is het verschil met een business case?*

Een haalbaarheidsonderzoek beantwoordt of een gebied kansrijk is; een business case rekent het project financieel volledig door, inclusief scenario's en onrendabele top. Het onderzoek gaat vooraf en werkt met een lager detailniveau.

*Hoe lang duurt zo'n onderzoek?*

Dat volgt uit de omvang van het gebied en uit de beschikbaarheid van gegevens over de bestaande ondergrond en de gebouwvoorraad. In de praktijk is het opbouwen van de gebouwendatabase vaak bepalend voor de doorlooptijd.

## /gelijktijdigheid-warmtenet/ 

**Title:** Gelijktijdigheid in een warmtenet bepalen | Qalor

**Meta description:** Gelijktijdigheid bepaalt hoe zwaar een warmtenet uitgevoerd moet worden. Te ruim gedimensioneerd is duur, te krap loopt vast bij uitbreiding.

**H1:** Gelijktijdigheid in een warmtenet

**Intro**

Niet alle aangeslotenen vragen tegelijk hun maximale vermogen. Hoeveel er werkelijk tegelijk wordt gevraagd - de gelijktijdigheid - bepaalt hoe zwaar het net en de opwekinstallatie uitgevoerd moeten worden, en daarmee een aanzienlijk deel van de investering.

**Waarom de som van de pieken niet klopt**

Als elke aansluiting haar maximale vermogen zou vragen op hetzelfde moment, zou een net op die som gedimensioneerd moeten worden. Dat gebeurt in de praktijk niet. Het verschil tussen de som van alle individuele pieken en het werkelijk te leveren piekvermogen is aanzienlijk, en een net dat op die som wordt uitgelegd is veel te zwaar en te duur.

**En waarom te krap net zo duur is**

De andere kant is even reeel. Een net dat scherp op de verwachte gelijktijdigheid is uitgelegd, loopt tegen zijn grenzen aan zodra er wordt uitgebreid of zodra de gebouwvoorraad verandert. Wat op de investering bespaard is, komt dan terug als een beperking op de groei van het net.

**Op alle niveaus, niet alleen op het geheel**

Gelijktijdigheid speelt niet alleen voor het net als geheel. Ook per streng, per cluster en per aansluitleiding verschilt het beeld: hoe kleiner de groep aangeslotenen, hoe minder de pieken tegen elkaar wegvallen. De bepaling op elk niveau is daarom onderdeel van de dimensionering, van de transportleiding tot aan de laatste aansluitleiding.

**Wat het met de rest van de calculatie doet**

Uit de gelijktijdigheid volgen de vermogens, uit de vermogens en het temperatuurregime volgen de debieten, en daaruit de diameters per trace. Samen met de tracelengtes uit de nettekening levert dat de materiaalstaat op - en daarmee de investering. Een aanname over gelijktijdigheid werkt dus door tot in de business case.

**Veelgestelde vragen**

*Wat is gelijktijdigheid in een warmtenet?*

De mate waarin aangeslotenen tegelijk warmte vragen. Omdat niet iedereen op hetzelfde moment zijn maximale vermogen afneemt, is het werkelijk te leveren piekvermogen lager dan de som van alle individuele pieken.

*Waarom mag je niet gewoon alle pieken optellen?*

Omdat het net dan veel zwaarder en duurder wordt uitgevoerd dan nodig. Het verschil tussen de som van de pieken en het werkelijke piekvermogen is aanzienlijk en bepaalt rechtstreeks de diameters en de omvang van de opwekinstallatie.

*Verschilt de gelijktijdigheid per deel van het net?*

Ja. Hoe kleiner de groep aangeslotenen, hoe minder de pieken tegen elkaar wegvallen. Op een aansluitleiding ligt de gelijktijdigheid daarom dichter bij een dan op de transportleiding, en de dimensionering houdt daar op elk niveau rekening mee.

## /wet-collectieve-warmte/ 

**Title:** Wet collectieve warmte (Wcw) en uw projectcalculatie | Qalor

**Meta description:** Wat de Wet collectieve warmte betekent voor de calculatie van een warmteproject: publiek meerderheidsbelang, tarieven en de onderbouwing die daarbij hoort.

**H1:** Wet collectieve warmte (Wcw) en de projectcalculatie

**Intro**

De Wet collectieve warmte verandert wie een warmtenet mag exploiteren en hoe tarieven tot stand komen. Voor gemeenten en corporaties die nu een project voorbereiden, verandert daarmee ook wat een calculatie moet kunnen laten zien.

**Waar de wet over gaat**

De Wcw regelt de aanwijzing van warmtebedrijven, het publieke meerderheidsbelang in nieuwe collectieve warmtesystemen en de wijze waarop tarieven worden vastgesteld - weg van de koppeling met de gasprijs, richting kosten die aan het warmtesysteem zelf toe te rekenen zijn.

**Wat dat met de calculatie doet**

Een tariefstelling op basis van werkelijke kosten vraagt dat die kosten navolgbaar zijn: welke investering, welke exploitatiekosten, welke afschrijvingstermijn en welk rendement. Dat is precies de onderbouwing die een exploitatieberekening levert, en het is een strengere eis dan een business case die alleen op een eindbedrag uitkomt.

**Publiek belang en de rol van de gemeente**

Waar de gemeente of een publieke partij een meerderheidsbelang neemt, verschuift de vraag van of een marktpartij het wil doen naar of het publiek verantwoord kan. Dat maakt de verdeling van de onrendabele top tussen partijen een expliciet onderwerp in plaats van een sluitpost.

**Wat Qalor hierin doet**

Qalor stelt geen juridisch advies op. Wat Qalor levert is de rekenkundige onderbouwing waarop die gesprekken rusten: een investerings- en exploitatieberekening waarvan elke aanname terug te voeren is op een bron, zodat de cijfers standhouden tegenover een toezichthouder, een financier of een gemeenteraad.

**Veelgestelde vragen**

*Wat betekent de Wet collectieve warmte voor een lopend project?*

Vooral dat de onderbouwing van kosten en tarieven zwaarder weegt. Een calculatie die alleen een eindbedrag oplevert, volstaat niet meer waar tarieven op werkelijke kosten gebaseerd moeten worden.

*Geeft Qalor juridisch advies over de Wcw?*

Nee. Qalor richt zich op projectcalculaties en de bijbehorende technische analyses. De rekenkundige onderbouwing die de wet vraagt, is wel precies wat een exploitatieberekening van Qalor oplevert.

*Moet een gemeente nu al rekenen aan een warmtenet?*

Als er een projectgebied in beeld is, helpt het om vroeg te weten wat het kost en welke variabelen de uitkomst bepalen. Een haalbaarheidsonderzoek geeft dat beeld voordat er grote bedragen aan vervolgstappen vastzitten.

## /en/ (EN)

**Title:** District heating consultancy in the Netherlands | Qalor

**Meta description:** Qalor calculates district heating projects in the Netherlands: network drawings, load calculations and full business cases, by engineers who have run heat networks.

**H1:** District heating consultancy in the Netherlands

**Intro**

Qalor calculates district heating projects - from the network drawing through to the operating model. Three heat specialists with over 130 years of combined experience in the energy sector, more than 100 of them at heat utilities.

**What we do**

We produce project calculations and the technical analysis behind them: the network drawing in AutoCAD, a building-level database of heat demand, the sizing of pipes and plant, and a full operating calculation over the lifetime of the asset. Design and cost are worked out together, because every design choice is also a cost choice.

**Why the numbers hold up**

Every assumption traces back to a source or an explicitly recorded starting point - the Dutch Land Registry for what is already in the ground, the national building register for the building stock. That makes the result reviewable by a municipality, a housing association or a lender who wants to follow the reasoning rather than accept the outcome.

**Who we work for**

Municipalities, housing associations, developers and heat companies in the Netherlands, typically at the point where a project needs to be shown to be financially sound before it can proceed. Our work is in Dutch practice and Dutch regulation; this page exists for international parties involved in those projects.

**FAQ**

*Do you work outside the Netherlands?*

Our work is grounded in Dutch data sources, Dutch regulation and Dutch construction practice, so our projects are in the Netherlands. International parties investing in or partnering on Dutch heat projects are welcome to contact us in English.

*Can you deliver in English?*

Yes. Calculations and reporting can be delivered in English for international stakeholders, though the underlying sources and regulation remain Dutch.

## /en/district-heating-business-case/ (EN)

**Title:** District heating business case and operating model | Qalor

**Meta description:** A district heating business case built on real inputs: investment, revenue, operating cost over the lifetime, and the unprofitable top that follows from them.

**H1:** District heating business case

**Intro**

A heat network is an investment measured in decades. The question is rarely whether it can be built, but whether it can be paid for, and on what terms. That is what the operating calculation sets out to answer.

**The financial model**

Built from the network drawing, the building database and the chosen generation concept. On the investment side: the pipe network, the plant, connection costs and engineering. On the revenue side: standing charges, heat sales and any subsidy. Against those, the operating costs over the lifetime - maintenance, purchased heat and electricity, network losses and management.

**Scenarios rather than one answer**

A business case with a single outcome implies a certainty that is not there. Different starting points are modelled side by side - a higher or lower connection rate, a different temperature regime, a different heat source, phased rather than one-off construction - so it becomes visible which variables actually drive the result. That is usually not the variable the discussion focuses on.

**The unprofitable top**

The calculation shows whether, and by how much, part of the investment cannot be recovered from operations. In Dutch practice this is the onrendabele top, and it is the basis for the conversation about subsidy, about how costs are shared between parties, or about whether the project is viable in its current form.

**FAQ**

*What is an unprofitable top?*

The portion of the investment that cannot be recovered from operating the network over its lifetime. Almost every heat network has one; the useful questions are how large it is, which variables drive it, and who can carry it.

*What inputs do you need to start?*

A project area. From there the building stock is derived from public registers, and the route from the land registry record of existing underground infrastructure. Where data is missing, assumptions are made explicit rather than hidden in the result.

## /en/heat-network-feasibility-study/ (EN)

**Title:** Heat network feasibility study, Netherlands | Qalor

**Meta description:** A feasibility study for a district heating project in the Netherlands: heat demand, route, indicative investment and operating outlook, before committing to design.

**H1:** Heat network feasibility study

**Intro**

Before a heat network is designed, a different question comes first: is this area suitable, and on what terms. A feasibility study answers that with figures rather than an assumption.

**What is assessed**

The project area is mapped: which buildings are there, what their heat demand is, which sources are available, and how a route would run through the existing underground infrastructure. That yields a first view of the investment and of operations - enough to judge whether further steps are worthwhile.

**Why it starts with the buildings**

Heat demand determines nearly everything downstream: capacities, pipe diameters, the size of the plant and therefore the investment. Demand is established per building from public registers rather than estimated at neighbourhood level. Two areas with the same number of homes can differ sharply once construction year and housing type diverge.

**What it is not**

It is not a design and not a final business case. The level of detail is deliberately lower: enough to support a go or no-go, not enough to tender on. If the area looks promising, the network drawing, the load calculation and the operating model follow, building on the same starting points.

**FAQ**

*How does a feasibility study differ from a business case?*

A feasibility study answers whether an area is promising; a business case models the project financially in full, including scenarios and the unprofitable top. The study comes first and works at a lower level of detail.

*What determines how long it takes?*

The size of the area and the availability of data on the existing underground infrastructure and the building stock. In practice, assembling the building database is often what governs the timeline.
