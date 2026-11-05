// SPDX-License-Identifier: Apache-2.0 · © 2025–2026 St.-Antonius-Gymnasium Lüdinghausen
/*
 * Satzbank für den Gutachten-Generator (Version 2.0)
 *
 * Platzhalter:
 *   {PERSON}      Name bzw. Pronomen im Nominativ (z. B. "Herr Muster" / "er")
 *   {SEIN_IHR}    nur am Satzanfang, vor maskulinen oder neutralen Nomen im Nominativ ("Sein" / "Ihr")
 *   {SEINE_IHRE}  nur am Satzanfang, vor femininen Nomen oder Plural im Nominativ ("Seine" / "Ihre")
 *
 * Jede Variante: ["Satz", "Leitwort"]. Das Leitwort nutzt der Generator, um Wiederholungen zu vermeiden.
 * Noten: 1 = sehr gut … 6 = ungenügend.
 * "bez" ist die Bezeichnung des Kriteriums im Nominativ mit Artikel; sie wird in Überleitungen verwendet.
 */
const SATZBANK = {
  bruecken: {
    besser: ["Überzeugender ist {BEZ}: ", "Positiver fällt {BEZ} aus: ", "Günstiger stellt sich {BEZ} dar: "],
    schlechter: ["Weniger überzeugend ist {BEZ}: ", "Hinter diesem Niveau bleibt {BEZ} zurück: ", "Kritischer fällt {BEZ} aus: "]
  },

  handlungsfelder: [
    {
      id: "U",
      titel: "Unterricht für heterogene Lerngruppen gestalten und Lernprozesse nachhaltig anlegen",
      hilfe: "Planung, Durchführung und Gestaltung des Fachunterrichts in der Lerngruppe.",
      kriterien: [
        {
          id: "fachkenntnisse", name: "Fachkenntnisse", bez: "das fachliche Wissen",
          hilfe: "Sicherheit und Tiefe des Fachwissens, fachliche Korrektheit der Darstellung.",
          saetze: {
            1: [["{PERSON} verfügt über umfassende und sichere Fachkenntnisse, die deutlich über die Anforderungen des Unterrichts hinausreichen.", "umfassend"],
                ["{SEIN_IHR} fachliches Wissen ist in besonderem Maße fundiert; Inhalte werden durchgängig präzise und fachlich einwandfrei dargestellt.", "in besonderem Maße"],
                ["In fachlichen Fragen agiert {PERSON} jederzeit souverän, auch bei weiterführenden Rückfragen der Lerngruppe.", "souverän"]],
            2: [["{PERSON} verfügt über fundierte Fachkenntnisse und bringt diese gewinnbringend in den Unterricht ein.", "fundiert"],
                ["{SEIN_IHR} fachliches Wissen ist sicher und ermöglicht eine inhaltlich zuverlässige Unterrichtsgestaltung.", "sicher"],
                ["Auf fachliche Rückfragen reagiert {PERSON} sachkundig und präzise.", "sachkundig"]],
            3: [["{PERSON} verfügt über solide Fachkenntnisse, die eine inhaltlich korrekte Unterrichtsgestaltung ermöglichen.", "solide"],
                ["{SEIN_IHR} fachliches Wissen ist insgesamt angemessen; bei vertiefenden Fragestellungen zeigen sich vereinzelt Unsicherheiten.", "insgesamt angemessen"],
                ["Fachliche Inhalte werden meist korrekt dargestellt, gelegentlich bleiben Erläuterungen jedoch an der Oberfläche.", "meist"]],
            4: [["{PERSON} verfügt über grundlegende Fachkenntnisse, die jedoch nicht in allen Themenbereichen gesichert sind.", "grundlegend"],
                ["{SEIN_IHR} fachliches Wissen reicht für die Unterrichtsgestaltung in Grundzügen aus, weist aber Lücken auf.", "in Grundzügen"],
                ["Bei fachlichen Rückfragen der Schülerinnen und Schüler zeigen sich wiederholt Unsicherheiten.", "Unsicherheiten"]],
            5: [["{PERSON} weist in zentralen Themenbereichen deutliche fachliche Lücken auf.", "deutliche Lücken"],
                ["Fachliche Inhalte werden in den besuchten Stunden häufig ungenau oder fehlerhaft dargestellt.", "fehlerhaft"],
                ["{SEIN_IHR} fachliches Wissen reicht für eine sachgerechte Unterrichtsgestaltung nicht aus.", "reicht nicht aus"]],
            6: [["{PERSON} verfügt nicht über die für den Unterricht erforderlichen fachlichen Grundlagen.", "Grundlagen fehlen"],
                ["Im Unterricht werden wiederholt gravierende fachliche Fehler vermittelt, die nicht korrigiert werden.", "gravierend"],
                ["{SEIN_IHR} fachliches Wissen weist grundlegende Defizite auf, die eine sachgerechte Vermittlung der Inhalte verhindern.", "grundlegende Defizite"]]
          }
        },
        {
          id: "curriculum", name: "Curriculare Vorgaben", bez: "die Umsetzung der curricularen Vorgaben",
          hilfe: "Bezug zum Kernlehrplan und zum schulinternen Lehrplan, längerfristige Planung.",
          saetze: {
            1: [["{PERSON} setzt die curricularen Vorgaben konsequent und reflektiert um und verknüpft sie schlüssig mit dem schulinternen Lehrplan.", "reflektiert"],
                ["Die Kompetenzerwartungen des Kernlehrplans sind in den Unterrichtsvorhaben durchgängig präsent und werden stringent aufeinander aufgebaut.", "stringent"],
                ["Bei der längerfristigen Planung berücksichtigt {PERSON} die curricularen Vorgaben vorbildlich und begründet Schwerpunktsetzungen überzeugend.", "vorbildlich"]],
            2: [["{PERSON} setzt die curricularen Vorgaben sicher und zielgerichtet um.", "zielgerichtet"],
                ["Die Unterrichtsvorhaben orientieren sich klar an den Kompetenzerwartungen des Kernlehrplans.", "klar"],
                ["Die Vorgaben des schulinternen Lehrplans werden gewissenhaft berücksichtigt und in die Unterrichtsplanung eingebunden.", "gewissenhaft"]],
            3: [["{PERSON} berücksichtigt die curricularen Vorgaben im Wesentlichen angemessen.", "im Wesentlichen"],
                ["Der Bezug zu den Kompetenzerwartungen des Kernlehrplans wird in der Regel hergestellt, bleibt aber oft implizit.", "in der Regel"],
                ["Die Umsetzung der curricularen Vorgaben gelingt überwiegend, die Abfolge der Unterrichtsvorhaben wirkt aber stellenweise wenig schlüssig.", "überwiegend"]],
            4: [["{PERSON} berücksichtigt die curricularen Vorgaben nur teilweise.", "teilweise"],
                ["Der Bezug der Unterrichtsvorhaben zu den Kompetenzerwartungen des Kernlehrplans wird lediglich ansatzweise hergestellt.", "ansatzweise"],
                ["Die Vorgaben des schulinternen Lehrplans werden zwar beachtet, ihre Umsetzung bleibt aber unsystematisch.", "unsystematisch"]],
            5: [["{PERSON} berücksichtigt die curricularen Vorgaben nur unzureichend.", "unzureichend"],
                ["Ein Bezug der Unterrichtsvorhaben zu den Kompetenzerwartungen wird selten hergestellt.", "selten"],
                ["Wesentliche Vorgaben des Kernlehrplans bleiben in der Unterrichtsplanung mehrfach unberücksichtigt.", "unberücksichtigt"]],
            6: [["Die curricularen Vorgaben werden in der Unterrichtsplanung nicht berücksichtigt.", "nicht berücksichtigt"],
                ["Ein Bezug zu den Kompetenzerwartungen des Kernlehrplans fehlt.", "fehlt"],
                ["{PERSON} setzt sich mit den curricularen Vorgaben nicht auseinander.", "keine Auseinandersetzung"]]
          }
        },
        {
          id: "reduktion", name: "Didaktische Reduktion und Schwerpunktsetzung", bez: "die didaktische Reduktion",
          hilfe: "Aufbereitung komplexer Inhalte, begründete Schwerpunktsetzung.",
          saetze: {
            1: [["{PERSON} reduziert komplexe Sachverhalte in hervorragender Weise auf ihren Kern, ohne sie fachlich zu verfälschen.", "hervorragend"],
                ["Die Schwerpunktsetzung ist durchgängig begründet und genau auf die Lernvoraussetzungen der Lerngruppe abgestimmt.", "genau abgestimmt"],
                ["Besonders hervorzuheben ist die Fähigkeit, anspruchsvolle Inhalte altersgerecht aufzubereiten und dabei das Wesentliche herauszustellen.", "besonders hervorzuheben"]],
            2: [["{PERSON} reduziert komplexe Sachverhalte gezielt und fachlich korrekt.", "gezielt"],
                ["Die Schwerpunkte des Unterrichts sind sinnvoll gewählt und für die Lerngruppe nachvollziehbar.", "sinnvoll"],
                ["Anspruchsvolle Inhalte werden geschickt auf das Wesentliche konzentriert.", "geschickt"]],
            3: [["Die didaktische Reduktion gelingt in den meisten Fällen, vereinzelt werden Inhalte jedoch zu stark vereinfacht.", "in den meisten Fällen"],
                ["Die Schwerpunktsetzung ist grundsätzlich nachvollziehbar, könnte aber stärker an den Lernvoraussetzungen ausgerichtet werden.", "grundsätzlich"],
                ["Komplexe Inhalte werden im Allgemeinen verständlich aufbereitet, wobei Nebenaspekte gelegentlich zu viel Raum einnehmen.", "im Allgemeinen"]],
            4: [["Die didaktische Reduktion gelingt nur eingeschränkt; Inhalte werden mal zu komplex, mal verkürzt dargestellt.", "eingeschränkt"],
                ["Die Schwerpunktsetzung ist nicht immer nachvollziehbar.", "nicht immer"],
                ["{PERSON} konzentriert Inhalte zwar auf zentrale Aspekte, dies gelingt jedoch nicht durchgängig.", "nicht durchgängig"]],
            5: [["Komplexe Sachverhalte werden kaum auf ihren Kern reduziert, sodass die Lerngruppe vielfach überfordert ist.", "kaum"],
                ["Eine begründete Schwerpunktsetzung ist nur schwach ausgeprägt.", "schwach"],
                ["Vereinfachungen führen wiederholt zu fachlich verzerrten Darstellungen.", "verzerrt"]],
            6: [["Eine didaktische Reduktion findet nicht statt; Inhalte werden ungefiltert oder fachlich unzulässig verkürzt präsentiert.", "findet nicht statt"],
                ["Eine Schwerpunktsetzung fehlt, zentrale und nebensächliche Inhalte werden gleichrangig behandelt.", "gleichrangig"],
                ["{PERSON} ist nicht in der Lage, komplexe Inhalte für die Lerngruppe aufzubereiten.", "nicht in der Lage"]]
          }
        },
        {
          id: "planung", name: "Unterrichtsplanung und Strukturierung", bez: "die Strukturierung des Unterrichts",
          hilfe: "Zielklarheit, Aufbau der Stunden, Phasierung, Übergänge und Zeitmanagement.",
          saetze: {
            1: [["{PERSON} plant den Unterricht außerordentlich durchdacht; Ziele, Inhalte und Phasen greifen schlüssig ineinander.", "durchdacht"],
                ["Die Stunden sind klar strukturiert, die Übergänge zwischen den Phasen gelingen mühelos und das Lernziel bleibt stets im Blick.", "mühelos"],
                ["Die Unterrichtsplanung ist mustergültig: Sie berücksichtigt Alternativen und ermöglicht flexible Reaktionen auf den Lernprozess.", "mustergültig"]],
            2: [["{PERSON} plant den Unterricht zielorientiert und strukturiert ihn in nachvollziehbare Phasen.", "zielorientiert"],
                ["Die Stunden sind folgerichtig aufgebaut, und die Übergänge zwischen den Phasen sind gut vorbereitet.", "folgerichtig"],
                ["Die Unterrichtsplanung ist sorgfältig und berücksichtigt die zur Verfügung stehende Zeit realistisch.", "sorgfältig"]],
            3: [["{PERSON} plant den Unterricht weitgehend zielorientiert, einzelne Phasen sind jedoch zu lang oder zu knapp bemessen.", "weitgehend"],
                ["Die Stunden sind im Großen und Ganzen nachvollziehbar aufgebaut; einzelne Übergänge wirken noch unvermittelt.", "im Großen und Ganzen"],
                ["Die Unterrichtsplanung ist tragfähig, das Zeitmanagement gelingt aber nicht in allen Stunden.", "tragfähig"]],
            4: [["Die Unterrichtsplanung weist eine grobe Struktur auf, Ziele werden jedoch nicht immer deutlich.", "grobe Struktur"],
                ["Die Phasierung der Stunden ist wechselhaft; Übergänge wirken häufig abrupt.", "wechselhaft"],
                ["{PERSON} verliert im Stundenverlauf mitunter das Stundenziel aus dem Blick.", "mitunter"]],
            5: [["Den Stunden fehlt meist ein nachvollziehbarer Aufbau; Phasen stehen weitgehend unverbunden nebeneinander.", "unverbunden"],
                ["{PERSON} formuliert Stundenziele nur unklar, sodass die Planung wenig zielgerichtet bleibt.", "unklar"],
                ["Das Zeitmanagement gelingt in den besuchten Stunden überwiegend nicht.", "Zeitmanagement"]],
            6: [["Eine planvolle Strukturierung des Unterrichts ist nicht gegeben.", "nicht gegeben"],
                ["{PERSON} legt den Stunden keine klaren Ziele zugrunde; der Unterricht verläuft weitgehend beliebig.", "beliebig"],
                ["Die Unterrichtsplanung ist in keiner Weise tragfähig.", "in keiner Weise"]]
          }
        },
        {
          id: "methoden", name: "Methoden- und Medieneinsatz", bez: "der Methoden- und Medieneinsatz",
          hilfe: "Passung und Vielfalt der Methoden, funktionaler Einsatz analoger und digitaler Medien.",
          saetze: {
            1: [["{PERSON} setzt Methoden und Medien äußerst zielführend ein und begründet ihre Auswahl überzeugend.", "zielführend"],
                ["Der Methoden- und Medieneinsatz ist vielfältig, stets funktional und in herausragender Weise auf die Lernziele abgestimmt.", "herausragend"],
                ["Digitale und analoge Medien werden gekonnt und mit deutlichem Mehrwert für das Lernen eingesetzt.", "gekonnt"]],
            2: [["{PERSON} wählt Methoden und Medien passend zu den Lernzielen aus und setzt sie wirksam ein.", "wirksam"],
                ["Der Methoden- und Medieneinsatz ist abwechslungsreich und unterstützt den Lernprozess.", "abwechslungsreich"],
                ["Medien werden funktional eingesetzt und tragen zur Klarheit des Unterrichts bei.", "funktional"]],
            3: [["{PERSON} setzt Methoden und Medien zumeist passend ein, ihre Funktion für das Lernziel bleibt jedoch mitunter unklar.", "zumeist"],
                ["Der Methodeneinsatz ist zufriedenstellend, bleibt in seiner Vielfalt aber eher begrenzt.", "zufriedenstellend"],
                ["Medien werden angemessen genutzt, ihr Potenzial wird jedoch nicht ganz ausgeschöpft.", "nicht ausgeschöpft"]],
            4: [["Die Wahl der Methoden ist nur bedingt auf die Lernziele abgestimmt.", "bedingt"],
                ["{PERSON} setzt überwiegend dieselben Methoden ein; Medien werden eher beiläufig genutzt.", "beiläufig"],
                ["Der Methoden- und Medieneinsatz unterstützt das Lernen lediglich in Teilen.", "in Teilen"]],
            5: [["Methoden und Medien werden oft ohne Bezug zu den Lernzielen eingesetzt.", "ohne Bezug"],
                ["Der Methodeneinsatz ist einseitig und wenig wirksam.", "einseitig"],
                ["{PERSON} setzt Medien vielfach so ein, dass sie den Lernprozess eher stören als unterstützen.", "stören"]],
            6: [["Ein zielgerichteter Einsatz von Methoden und Medien ist nicht festzustellen.", "nicht festzustellen"],
                ["Die gewählten Methoden sind für die Lerngruppe und die Inhalte ungeeignet.", "ungeeignet"],
                ["{PERSON} nutzt Methoden und Medien ohne jeden didaktischen Bezug.", "ohne jeden Bezug"]]
          }
        },
        {
          id: "aktivierung", name: "Schülerorientierung und Aktivierung", bez: "die Aktivierung der Lernenden",
          hilfe: "Anknüpfen an Interessen, Eigenaktivität und Lernbereitschaft der Lernenden.",
          saetze: {
            1: [["{PERSON} aktiviert die Lernenden nachhaltig und schafft zahlreiche Gelegenheiten für eigenständiges Denken und Handeln.", "nachhaltig"],
                ["Der Unterricht knüpft beispielhaft an die Interessen und Erfahrungen der Schülerinnen und Schüler an und weckt deutliche Lernbereitschaft.", "beispielhaft"],
                ["Die Lernenden arbeiten in den besuchten Stunden durchgängig engagiert und übernehmen Verantwortung für ihren Lernprozess.", "engagiert"]],
            2: [["{PERSON} bezieht die Lernenden aktiv ein und berücksichtigt ihre Interessen bei der Unterrichtsgestaltung.", "aktiv"],
                ["Der Unterricht bietet den Schülerinnen und Schülern gute Möglichkeiten zur Eigenaktivität.", "gute Möglichkeiten"],
                ["Die Lernenden werden zum Mitdenken angeregt und arbeiten motiviert mit.", "motiviert"]],
            3: [["Alles in allem werden die Lernenden angemessen einbezogen, Phasen der Eigenaktivität bleiben aber eher kurz.", "alles in allem"],
                ["Die Interessen der Schülerinnen und Schüler werden aufgegriffen, der Unterricht ist jedoch noch recht lehrerzentriert.", "lehrerzentriert"],
                ["{PERSON} regt die Lernenden vielfach zur Mitarbeit an, eigenständiges Arbeiten wird jedoch seltener ermöglicht.", "vielfach"]],
            4: [["Die Lernenden werden nur zeitweise aktiviert; über längere Phasen bleibt der Unterricht lehrerzentriert.", "zeitweise"],
                ["{PERSON} greift die Interessen der Schülerinnen und Schüler nur gelegentlich auf.", "gelegentlich"],
                ["Die Lernbereitschaft der Lerngruppe wird mit Einschränkungen gefördert.", "mit Einschränkungen"]],
            5: [["Die Lernenden verbleiben die meiste Zeit in einer passiven Rolle.", "passiv"],
                ["{PERSON} berücksichtigt die Interessen und Voraussetzungen der Lerngruppe nur in geringem Maße.", "in geringem Maße"],
                ["Der Unterricht bietet wenig Anlass zur Mitarbeit, sodass viele Schülerinnen und Schüler unbeteiligt bleiben.", "unbeteiligt"]],
            6: [["Eine Aktivierung der Lernenden bleibt aus.", "bleibt aus"],
                ["{PERSON} richtet den Unterricht nicht an den Lernenden aus.", "nicht ausgerichtet"],
                ["Die Schülerinnen und Schüler erhalten keine Gelegenheit zur Eigenaktivität.", "keine Gelegenheit"]]
          }
        },
        {
          id: "gespraech", name: "Gesprächsführung", bez: "die Gesprächsführung",
          hilfe: "Qualität von Impulsen und Fragen, Umgang mit Schülerbeiträgen.",
          saetze: {
            1: [["{PERSON} führt Unterrichtsgespräche ausgezeichnet: Impulse sind präzise, offen und regen zu vertieftem Nachdenken an.", "ausgezeichnet"],
                ["Die Gesprächsführung ist ausgesprochen schülerorientiert; Beiträge der Lernenden werden aufgegriffen und gewinnbringend miteinander verknüpft.", "schülerorientiert"],
                ["Impulse und Fragen sind sprachlich klar und didaktisch sehr wirkungsvoll.", "wirkungsvoll"]],
            2: [["{PERSON} führt Unterrichtsgespräche strukturiert und lenkt sie zielführend.", "strukturiert"],
                ["Die Impulse sind verständlich formuliert und regen die Lernenden zum Nachdenken an.", "verständlich"],
                ["Beiträge der Schülerinnen und Schüler werden aufmerksam aufgenommen und weitergeführt.", "aufmerksam"]],
            3: [["{PERSON} leitet Unterrichtsgespräche angemessen, stellt jedoch noch häufig eng geführte Fragen.", "eng geführt"],
                ["Die Gesprächsführung trägt den Unterricht, Beiträge der Lernenden werden aber eher selten weitergeführt.", "trägt"],
                ["Die Impulse sind in der Mehrzahl verständlich, gelegentlich jedoch zu kleinschrittig.", "kleinschrittig"]],
            4: [["{PERSON} lenkt Unterrichtsgespräche stark und lässt den Lernenden wenig Raum für eigene Gedanken.", "stark gelenkt"],
                ["Die Impulse sind nicht durchweg verständlich, sodass Gesprächsphasen stocken.", "stocken"],
                ["Schülerbeiträge werden häufig nur zur Kenntnis genommen, ohne sie weiterzuführen.", "zur Kenntnis genommen"]],
            5: [["Die Gesprächsführung ist wenig strukturiert; Gespräche verlaufen wiederholt ziellos.", "ziellos"],
                ["{PERSON} stellt vielfach unklare oder suggestive Fragen.", "suggestiv"],
                ["Beiträge der Lernenden bleiben weitgehend unbeachtet.", "unbeachtet"]],
            6: [["Eine zielgerichtete Gesprächsführung gelingt nicht.", "gelingt nicht"],
                ["{PERSON} beantwortet eigene Fragen überwiegend selbst; ein echtes Unterrichtsgespräch entsteht nicht.", "entsteht nicht"],
                ["Schülerbeiträge finden im Unterrichtsgespräch keine Beachtung.", "keine Beachtung"]]
          }
        },
        {
          id: "differenzierung", name: "Differenzierung und individuelle Förderung", bez: "die Differenzierung",
          hilfe: "Berücksichtigung unterschiedlicher Lernvoraussetzungen, Hilfen und Erweiterungen.",
          saetze: {
            1: [["{PERSON} differenziert den Unterricht umsichtig und passgenau nach den Lernvoraussetzungen der Schülerinnen und Schüler.", "passgenau"],
                ["Unterstützungs- und Erweiterungsangebote sind in beeindruckender Weise auf die Heterogenität der Lerngruppe abgestimmt.", "beeindruckend"],
                ["Individuelle Lernwege werden konsequent ermöglicht und gezielt begleitet.", "Lernwege"]],
            2: [["{PERSON} berücksichtigt unterschiedliche Lernvoraussetzungen durch geeignete Differenzierungsangebote.", "geeignet"],
                ["Leistungsstärkere und leistungsschwächere Lernende erhalten passende Aufgaben und Hilfen.", "passend"],
                ["Die individuelle Förderung ist planvoll angelegt und unterstützt die Lernenden spürbar.", "planvoll"]],
            3: [["{PERSON} berücksichtigt unterschiedliche Lernvoraussetzungen, die Differenzierungsangebote sind aber noch wenig ausgeschärft.", "wenig ausgeschärft"],
                ["Hilfen für leistungsschwächere Lernende sind vorhanden, Erweiterungsangebote für leistungsstärkere fehlen jedoch häufiger.", "Hilfen vorhanden"],
                ["Die Differenzierung ist angemessen, erfolgt aber überwiegend quantitativ.", "quantitativ"]],
            4: [["Differenzierende Maßnahmen werden nur vereinzelt eingesetzt.", "vereinzelt"],
                ["{PERSON} richtet den Unterricht überwiegend an einem mittleren Leistungsniveau aus.", "mittleres Niveau"],
                ["Unterschiedliche Lernvoraussetzungen werden in der Planung bedacht, im Unterricht aber nur zum Teil berücksichtigt.", "zum Teil"]],
            5: [["Unterschiedliche Lernvoraussetzungen finden wenig Beachtung.", "wenig Beachtung"],
                ["{PERSON} bietet leistungsschwächeren Lernenden nur sporadisch Unterstützung an.", "sporadisch"],
                ["Differenzierungsangebote sind, sofern vorhanden, wenig durchdacht.", "wenig durchdacht"]],
            6: [["Eine Differenzierung des Unterrichts unterbleibt.", "unterbleibt"],
                ["{PERSON} lässt die unterschiedlichen Lernvoraussetzungen der Lerngruppe unberücksichtigt.", "unberücksichtigt"],
                ["Individuelle Förderung ist nicht vorhanden.", "nicht vorhanden"]]
          }
        }
      ]
    },
    {
      id: "E",
      titel: "Den Erziehungsauftrag in Schule und Unterricht wahrnehmen",
      hilfe: "Klassenführung, Lernklima und erzieherisches Handeln.",
      kriterien: [
        {
          id: "klassenfuehrung", name: "Klassenführung", bez: "die Klassenführung",
          hilfe: "Regeln und Rituale, Präsenz, Umgang mit Störungen, Nutzung der Lernzeit.",
          saetze: {
            1: [["{PERSON} führt die Lerngruppe mit großer Präsenz und Ruhe; Störungen werden frühzeitig und unaufgeregt unterbunden.", "Präsenz"],
                ["Regeln und Rituale sind fest etabliert, sodass die Lernzeit optimal genutzt wird.", "optimal"],
                ["Die Klassenführung ist in jeder Situation klar, konsequent und zugleich wertschätzend.", "in jeder Situation"]],
            2: [["{PERSON} führt die Lerngruppe klar und konsequent.", "konsequent"],
                ["Regeln und Abläufe sind etabliert; Störungen werden zügig und angemessen aufgefangen.", "zügig"],
                ["Die Lernzeit wird effektiv genutzt.", "effektiv"]],
            3: [["{PERSON} führt die Lerngruppe größtenteils sicher, bei Unruhe fehlt es jedoch mitunter an Konsequenz.", "größtenteils"],
                ["Regeln sind vorhanden, werden aber nicht in jedem Fall eingefordert.", "nicht in jedem Fall"],
                ["Die Lernzeit wird ordentlich genutzt, Übergänge kosten aber gelegentlich Zeit.", "ordentlich"]],
            4: [["Die Klassenführung ist noch unsicher; auf Störungen wird verzögert reagiert.", "verzögert"],
                ["Regeln werden eingeführt, jedoch inkonsequent durchgesetzt.", "inkonsequent"],
                ["Ein Teil der Lernzeit geht durch Unruhe und organisatorische Abläufe verloren.", "Lernzeit verloren"]],
            5: [["{PERSON} hat erhebliche Schwierigkeiten, die Lerngruppe zu führen.", "erhebliche Schwierigkeiten"],
                ["Störungen werden vielfach übersehen oder bleiben folgenlos.", "folgenlos"],
                ["Durch anhaltende Unruhe geht viel Lernzeit verloren.", "anhaltende Unruhe"]],
            6: [["{PERSON} kann das Unterrichtsgeschehen in den besuchten Stunden nicht steuern.", "nicht steuern"],
                ["Regeln und Absprachen haben für die Lerngruppe keine Verbindlichkeit.", "keine Verbindlichkeit"],
                ["Ein geordnetes Arbeiten ist in den besuchten Stunden nicht möglich.", "nicht möglich"]]
          }
        },
        {
          id: "lernklima", name: "Lernklima und Beziehungsgestaltung", bez: "das Lernklima",
          hilfe: "Wertschätzung, Beziehung zur Lerngruppe, Umgang mit Fehlern.",
          saetze: {
            1: [["{PERSON} begegnet den Schülerinnen und Schülern mit großer Wertschätzung und schafft ein ausgesprochen lernförderliches Klima.", "Wertschätzung"],
                ["Das Lernklima ist von gegenseitigem Respekt und Vertrauen geprägt; Fehler werden als Lernchance genutzt.", "Vertrauen"],
                ["{SEINE_IHRE} Beziehung zur Lerngruppe ist herzlich und zugleich professionell.", "herzlich"]],
            2: [["{PERSON} geht respektvoll und zugewandt mit den Lernenden um.", "zugewandt"],
                ["Im Unterricht herrscht eine angenehme, lernförderliche Atmosphäre.", "angenehm"],
                ["Die Schülerinnen und Schüler trauen sich, Fragen zu stellen und Fehler zu machen.", "trauen sich"]],
            3: [["{PERSON} geht freundlich mit den Lernenden um, die Beziehung wirkt jedoch noch etwas distanziert.", "distanziert"],
                ["Das Lernklima ist insgesamt positiv, Fehler werden aber noch zu wenig als Lernchance genutzt.", "positiv"],
                ["Die Atmosphäre ist ruhig und sachlich, ermutigende Rückmeldungen sind aber eher selten.", "sachlich"]],
            4: [["{SEINE_IHRE} Beziehung zur Lerngruppe ist noch wenig gefestigt.", "wenig gefestigt"],
                ["{PERSON} reagiert auf Fehler der Lernenden nicht immer ermutigend.", "ermutigend"],
                ["Das Lernklima ist schwankend und hängt stark von der jeweiligen Situation ab.", "schwankend"]],
            5: [["Das Lernklima ist angespannt; viele Schülerinnen und Schüler beteiligen sich kaum.", "angespannt"],
                ["{PERSON} reagiert auf Fragen der Lernenden mehrfach ungeduldig.", "ungeduldig"],
                ["Fehler werden überwiegend negativ bewertet, was die Lernbereitschaft hemmt.", "hemmt"]],
            6: [["In den besuchten Stunden ist das Verhältnis zur Lerngruppe deutlich gestört.", "gestört"],
                ["{PERSON} begegnet den Schülerinnen und Schülern ohne die gebotene Wertschätzung.", "ohne Wertschätzung"],
                ["Ein lernförderliches Klima kommt nicht zustande.", "kommt nicht zustande"]]
          }
        },
        {
          id: "erziehung", name: "Erzieherisches Handeln und Umgang mit Konflikten", bez: "das erzieherische Handeln",
          hilfe: "Wahrnehmen erzieherischer Situationen, Umgang mit Konflikten, Werteorientierung.",
          saetze: {
            1: [["{PERSON} nimmt den Erziehungsauftrag mit großer Klarheit und Umsicht wahr.", "Umsicht"],
                ["Konflikte werden sensibel wahrgenommen und in bemerkenswerter Weise konstruktiv gelöst.", "bemerkenswert"],
                ["Werte und Normen werden im Unterricht glaubwürdig vorgelebt und thematisiert.", "glaubwürdig"]],
            2: [["{PERSON} reagiert auf Konflikte besonnen und lösungsorientiert.", "lösungsorientiert"],
                ["Erzieherische Situationen werden umsichtig aufgegriffen.", "umsichtig"],
                ["Vereinbarungen zum Miteinander werden verlässlich eingefordert.", "verlässlich"]],
            3: [["{PERSON} reagiert auf Konflikte angemessen, geht ihren Ursachen aber noch zu selten nach.", "Ursachen"],
                ["Erzieherisch bedeutsame Situationen werden wahrgenommen, aber nicht konsequent aufgegriffen.", "nicht konsequent aufgegriffen"],
                ["Konflikte werden beruhigt, nachhaltige Lösungen entstehen aber eher selten.", "beruhigt"]],
            4: [["{PERSON} reagiert auf Konflikte zögerlich.", "zögerlich"],
                ["Erzieherische Situationen werden häufig übersehen oder nur oberflächlich behandelt.", "oberflächlich"],
                ["Konflikte werden zwar unterbrochen, aber nicht weiter bearbeitet.", "nicht weiter bearbeitet"]],
            5: [["{PERSON} reagiert auf Konflikte häufig unangemessen oder gar nicht.", "unangemessen"],
                ["Erzieherisch bedeutsame Situationen bleiben in der Regel ungenutzt.", "ungenutzt"],
                ["Konflikte eskalieren wiederholt, ohne dass wirksam eingegriffen wird.", "eskalieren"]],
            6: [["{PERSON} nimmt den Erziehungsauftrag im Unterricht nicht wahr.", "nicht wahrgenommen"],
                ["In Konfliktsituationen trägt das eigene Verhalten wiederholt zur Verschärfung bei.", "verschärft"],
                ["Auf Regelverstöße erfolgt keine Reaktion.", "keine Reaktion"]]
          }
        }
      ]
    },
    {
      id: "L",
      titel: "Lernen und Leisten herausfordern, dokumentieren, rückmelden und beurteilen",
      hilfe: "Lernstandsdiagnose, Rückmeldung und Leistungsbeurteilung.",
      kriterien: [
        {
          id: "diagnose", name: "Diagnose und Rückmeldung", bez: "die Lerndiagnose",
          hilfe: "Erkennen von Lernständen und Lernschwierigkeiten, lernförderliche Rückmeldungen.",
          saetze: {
            1: [["{PERSON} erfasst Lernstände und Lernschwierigkeiten sehr genau und nutzt diese Erkenntnisse konsequent für die weitere Planung.", "sehr genau"],
                ["Rückmeldungen an die Lernenden sind präzise, ermutigend und zeigen klare nächste Schritte auf.", "nächste Schritte"],
                ["Diagnostische Verfahren werden äußerst fachkundig eingesetzt und klug ausgewertet.", "fachkundig"]],
            2: [["{PERSON} erkennt Lernstände zuverlässig und berücksichtigt sie in der Planung.", "zuverlässig"],
                ["{SEINE_IHRE} Rückmeldungen sind konstruktiv und lernförderlich.", "konstruktiv"],
                ["Lernschwierigkeiten werden frühzeitig bemerkt und aufgegriffen.", "frühzeitig"]],
            3: [["{PERSON} erfasst Lernstände angemessen, nutzt die Ergebnisse aber erst ansatzweise für die weitere Planung.", "erst ansatzweise genutzt"],
                ["Rückmeldungen sind freundlich, bleiben aber oft allgemein.", "allgemein"],
                ["Lernschwierigkeiten werden bemerkt, die Unterstützung bleibt aber eher unspezifisch.", "unspezifisch"]],
            4: [["Lernstände werden nur punktuell erfasst.", "punktuell"],
                ["{PERSON} gibt Rückmeldungen überwiegend in Form von Lob oder Tadel ohne weiterführende Hinweise.", "Lob oder Tadel"],
                ["Lernschwierigkeiten werden häufig erst spät bemerkt.", "spät"]],
            5: [["{PERSON} nimmt Lernschwierigkeiten der Schülerinnen und Schüler vielfach nicht wahr.", "vielfach nicht"],
                ["Rückmeldungen fehlen weitgehend oder sind wenig hilfreich.", "wenig hilfreich"],
                ["Diagnostische Erkenntnisse fließen allenfalls vereinzelt in die Planung ein.", "allenfalls"]],
            6: [["Lernstände werden nicht erhoben.", "nicht erhoben"],
                ["{PERSON} gibt den Lernenden keine verwertbaren Rückmeldungen.", "keine Rückmeldungen"],
                ["Lernschwierigkeiten bleiben durchgängig unerkannt.", "unerkannt"]]
          }
        },
        {
          id: "leistung", name: "Leistungsbeurteilung", bez: "die Leistungsbeurteilung",
          hilfe: "Transparente Kriterien, Angemessenheit und Nachvollziehbarkeit der Bewertung.",
          saetze: {
            1: [["{PERSON} beurteilt Leistungen auf der Grundlage transparenter Kriterien außerordentlich differenziert und nachvollziehbar.", "differenziert"],
                ["Die Bewertungskriterien werden gemeinsam mit der Lerngruppe erarbeitet und sind allen vollständig transparent.", "vollständig transparent"],
                ["Leistungsbewertungen sind in hohem Maße gerecht und werden den Lernenden lernförderlich erläutert.", "gerecht"]],
            2: [["{PERSON} beurteilt Leistungen kriterienorientiert und nachvollziehbar.", "kriterienorientiert"],
                ["Die Bewertungsmaßstäbe sind transparent und angemessen.", "transparent"],
                ["Leistungsbewertungen werden sachlich begründet.", "sachlich begründet"]],
            3: [["{PERSON} beurteilt Leistungen angemessen, die Kriterien sind der Lerngruppe aber nicht durchgehend transparent.", "nicht durchgehend transparent"],
                ["{SEINE_IHRE} Bewertungen sind nachvollziehbar, bleiben in der Begründung jedoch eher knapp.", "knapp"],
                ["Die Bewertungsmaßstäbe sind vertretbar, könnten aber stärker differenziert werden.", "vertretbar"]],
            4: [["Die Kriterien der Leistungsbeurteilung sind für die Lernenden wenig transparent.", "wenig transparent"],
                ["{PERSON} bewertet Leistungen nicht durchweg nachvollziehbar.", "nicht durchweg"],
                ["Die Bewertungsmaßstäbe sind uneinheitlich.", "uneinheitlich"]],
            5: [["Leistungen werden ohne klare Kriterien bewertet.", "ohne Kriterien"],
                ["{PERSON} legt bei der Bewertung wechselnde, teils zu strenge, teils zu nachsichtige Maßstäbe an.", "wechselnde Maßstäbe"],
                ["Bewertungen sind für die Lernenden schwer nachvollziehbar.", "schwer nachvollziehbar"]],
            6: [["Die Leistungsbeurteilung entbehrt einer nachvollziehbaren Grundlage.", "ohne Grundlage"],
                ["{PERSON} kann die eigenen Bewertungen nicht begründen.", "nicht begründen"],
                ["Grundlegende Anforderungen an eine faire Leistungsbewertung werden nicht erfüllt.", "nicht erfüllt"]]
          }
        }
      ]
    },
    {
      id: "B",
      titel: "Schülerinnen und Schüler und Eltern beraten",
      hilfe: "Beratung von Schülerinnen, Schülern und Eltern – nur bewerten, wenn Beratungssituationen beobachtet werden konnten.",
      kriterien: [
        {
          id: "beratung", name: "Beratung", bez: "die Beratung",
          hilfe: "Lernberatung sowie Gespräche mit Schülerinnen, Schülern und Eltern.",
          saetze: {
            1: [["{PERSON} führt Beratungsgespräche mit Schülerinnen, Schülern und Eltern ausgesprochen professionell und stets ergebnisorientiert.", "professionell"],
                ["Die Lernberatung ist individuell, fundiert und eröffnet den Lernenden konkrete Perspektiven.", "Perspektiven"],
                ["In Elterngesprächen tritt {PERSON} kompetent, einfühlsam und überzeugend auf.", "einfühlsam"]],
            2: [["{PERSON} berät Schülerinnen und Schüler kompetent und verständnisvoll.", "kompetent"],
                ["Beratungsgespräche sind gut vorbereitet und führen zu konkreten Vereinbarungen.", "Vereinbarungen"],
                ["Gespräche mit Eltern werden sachlich und vertrauensvoll geführt.", "vertrauensvoll"]],
            3: [["{PERSON} berät Schülerinnen und Schüler angemessen, Vereinbarungen bleiben aber eher unverbindlich.", "unverbindlich"],
                ["Beratungsgespräche werden sachgerecht geführt, ihre Vorbereitung ist jedoch ausbaufähig.", "ausbaufähig"],
                ["Gespräche mit Eltern verlaufen sachlich, sind aber noch wenig zielgerichtet.", "wenig zielgerichtet"]],
            4: [["Beratungsgespräche bleiben häufig allgemein und wenig konkret.", "wenig konkret"],
                ["{PERSON} führt Beratungsgespräche noch unsicher.", "unsicher"],
                ["Beratungsanlässe werden nicht konsequent genutzt.", "nicht konsequent"]],
            5: [["{PERSON} nimmt Beratungsanlässe nur ausnahmsweise wahr.", "ausnahmsweise"],
                ["Beratungsgespräche sind unstrukturiert und bleiben ohne Ergebnis.", "unstrukturiert"],
                ["In Gesprächen mit Eltern fehlt es an Sachlichkeit und Klarheit.", "Sachlichkeit"]],
            6: [["Eine Beratung der Schülerinnen und Schüler erfolgt nicht.", "erfolgt nicht"],
                ["{PERSON} weicht Beratungsgesprächen aus.", "weicht aus"],
                ["Gespräche mit Eltern verlaufen unprofessionell und belasten die Zusammenarbeit.", "unprofessionell"]]
          }
        }
      ]
    },
    {
      id: "S",
      titel: "Im System Schule mit allen Beteiligten entwicklungsorientiert zusammenarbeiten",
      hilfe: "Zusammenarbeit im Kollegium sowie Reflexion und professionelle Weiterentwicklung.",
      kriterien: [
        {
          id: "kooperation", name: "Kooperation und Kommunikation", bez: "die Zusammenarbeit im Kollegium",
          hilfe: "Zusammenarbeit, Absprachen und Kommunikation im Kollegium.",
          saetze: {
            1: [["{PERSON} arbeitet ausgesprochen kooperativ mit Kolleginnen und Kollegen zusammen und bringt eigene Ideen gewinnbringend ein.", "kooperativ"],
                ["Absprachen werden ausnahmslos eingehalten, Informationen umgehend weitergegeben.", "ausnahmslos"],
                ["Im Kollegium wird {PERSON} als engagierte und geschätzte Ansprechperson wahrgenommen.", "geschätzt"]],
            2: [["{PERSON} arbeitet partnerschaftlich und offen mit dem Kollegium zusammen.", "partnerschaftlich"],
                ["Absprachen werden eingehalten und Informationen zeitnah weitergegeben.", "zeitnah"],
                ["An der Arbeit in Fachgruppen und Teams beteiligt sich {PERSON} bereitwillig.", "bereitwillig"]],
            3: [["{PERSON} arbeitet kollegial mit anderen zusammen, bringt sich aber eher zurückhaltend ein.", "zurückhaltend"],
                ["Absprachen werden eingehalten, die Kommunikation könnte jedoch aktiver gestaltet werden.", "Kommunikation"],
                ["Die Zusammenarbeit im Kollegium verläuft unproblematisch, eigene Impulse sind jedoch selten.", "unproblematisch"]],
            4: [["{PERSON} beteiligt sich nur auf Nachfrage an gemeinsamer Arbeit.", "auf Nachfrage"],
                ["Absprachen werden nicht durchgängig eingehalten.", "Absprachen"],
                ["Die Kommunikation mit Kolleginnen und Kollegen ist lückenhaft.", "lückenhaft"]],
            5: [["{PERSON} zieht sich weitgehend aus der Zusammenarbeit zurück.", "zurückgezogen"],
                ["Absprachen werden in vielen Fällen nicht eingehalten.", "in vielen Fällen"],
                ["Informationen werden unzuverlässig weitergegeben, was die gemeinsame Arbeit erschwert.", "erschwert"]],
            6: [["{PERSON} beteiligt sich trotz Aufforderung nicht an der Zusammenarbeit im Kollegium.", "trotz Aufforderung"],
                ["Getroffene Absprachen werden durchgängig nicht eingehalten.", "durchgängig nicht eingehalten"],
                ["Das Verhalten im Kollegium belastet die gemeinsame Arbeit erheblich.", "belastet"]]
          }
        },
        {
          id: "reflexion", name: "Reflexion und professionelle Entwicklung", bez: "die Reflexion des eigenen Unterrichts",
          hilfe: "Selbstreflexion, Umgang mit Beratung, Weiterentwicklung im Beurteilungszeitraum.",
          saetze: {
            1: [["{PERSON} reflektiert den eigenen Unterricht außerordentlich tiefgehend und selbstkritisch.", "tiefgehend"],
                ["Hinweise aus Beratungsgesprächen werden umgehend aufgegriffen und eigenständig weiterentwickelt.", "eigenständig weiterentwickelt"],
                ["Im Beurteilungszeitraum zeigt sich eine herausragende professionelle Entwicklung.", "herausragende Entwicklung"]],
            2: [["{PERSON} reflektiert den eigenen Unterricht selbstkritisch und benennt Stärken und Entwicklungsfelder treffend.", "treffend"],
                ["Beratungshinweise werden offen angenommen und erfolgreich umgesetzt.", "erfolgreich umgesetzt"],
                ["Im Beurteilungszeitraum ist eine deutliche Weiterentwicklung festzustellen.", "deutliche Weiterentwicklung"]],
            3: [["{PERSON} reflektiert den eigenen Unterricht nachvollziehbar, bleibt dabei aber eher beschreibend.", "beschreibend"],
                ["Beratungshinweise werden angenommen, ihre Umsetzung gelingt jedoch mit Verzögerung.", "Verzögerung"],
                ["Eine Entwicklung im Beurteilungszeitraum ist sichtbar, verläuft aber langsam.", "langsam"]],
            4: [["{PERSON} reflektiert den eigenen Unterricht wenig selbstkritisch.", "wenig selbstkritisch"],
                ["Beratungshinweise werden angenommen, aber nur schleppend umgesetzt.", "schleppend"],
                ["Die professionelle Entwicklung im Beurteilungszeitraum ist gering.", "gering"]],
            5: [["{PERSON} bemerkt Schwächen des eigenen Unterrichts nur in wenigen Fällen.", "in wenigen Fällen"],
                ["Beratungshinweise bleiben größtenteils ohne Folgen für den Unterricht.", "ohne Folgen"],
                ["Eine Weiterentwicklung im Beurteilungszeitraum ist nur geringfügig festzustellen.", "geringfügig"]],
            6: [["{PERSON} lässt in den Nachbesprechungen keine Bereitschaft zur Reflexion des eigenen Unterrichts erkennen.", "keine Bereitschaft"],
                ["Beratungshinweise werden zurückgewiesen.", "zurückgewiesen"],
                ["Eine professionelle Entwicklung ist im Beurteilungszeitraum ausgeblieben.", "ausgeblieben"]]
          }
        }
      ]
    }
  ]
};
