"""Génère les 6 fiches restantes du Fascicule 12 :
Pédodontie, Implantologie, Parodontologie, Traumatologie,
Prothèse conjointe, Prothèse adjointe.

Réutilise les helpers de gen_fiches_f12.py.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

# On importe tout le toolkit de la première fiche
from gen_fiches_f12 import (  # type: ignore
    header_block, acte_block, info_box, build,
    Paragraph, Spacer, PageBreak,
    H1, H2, H3, BODY,
    C_PRIMARY, C_PRIMARY_SOFT, C_TEXT, C_MUTED, C_GREEN, C_AMBER,
    colors,
)


# =========================================================
# FICHE 4 — PÉDODONTIE
# =========================================================
pedo = []
pedo.append(header_block(
    "Pédodontie",
    "Fascicule 12 · Soins adaptés à l'enfant — psychologie, accueil, soins spécifiques",
))
pedo.append(Spacer(1, 8))

pedo.append(info_box(
    "<b>Principe :</b> les soins sont les mêmes que chez l'adulte mais doivent "
    "être adaptés. Tout débute par <b>instaurer un climat de confiance</b> dès le 1er RDV.",
))
pedo.append(Spacer(1, 6))

pedo.append(Paragraph("Psychologie de l'enfant — par âge", H2))
pedo.append(acte_block(
    "Approche selon l'âge",
    "À adapter à chaque tranche d'âge",
    [
        ("Très jeune enfant", "Peur de l'inconnu · sensible aux stimuli brutaux (bruits, mouvements)"),
        ("3-4 ans (1re année maternelle)", "<b>Craint la séparation</b> — ne pas séparer des parents"),
        ("4-6 ans (années maternelles)", "Peur des atteintes corporelles"),
        ("7 ans", "Désire tout comprendre · environnement familial primordial"),
        ("8-14 ans", "Comprend les soins et leur importance · impact familial fort"),
    ],
))

pedo.append(Paragraph("Accueil au cabinet — règles d'or", H2))
pedo.append(acte_block(
    "Cadre d'accueil",
    "L'AD est centrale dans la mise en confiance",
    [
        ("Préparation", "Climat de confiance dès le 1er RDV · cadre gai et accueillant"),
        ("Horaire", "RDV le matin (enfant reposé) plutôt que le soir après l'école"),
        ("Communication", "S'adresser <b>directement à l'enfant</b> · voix calme mais ferme · mots choisis"),
        ("À éviter (anxiogène)", "« N'aie pas peur », « Ne t'inquiète pas », « Ça ne fait pas mal », « Il va te faire une piqûre »"),
        ("Praticien", "Gestes rapides et précis · féliciter et rassurer · ne pas hésiter à interrompre"),
        ("Rôle AD", "Côté rassurant (vs praticien) · aide précieuse pour l'aspiration · main du praticien doit quitter le moins possible la bouche"),
    ],
))

pedo.append(PageBreak())

pedo.append(Paragraph("Soins chez l'enfant — adaptations", H2))
pedo.append(info_box(
    "<b>Matériau de choix dents temporaires :</b> <b>CVI</b> (mise en œuvre plus aisée, "
    "ne craint pas la salive). <b>Pulpotomie privilégiée</b> pour les dents temporaires "
    "(rapide, résultats satisfaisants pour la longévité).",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))
pedo.append(Spacer(1, 4))

pedo.append(Paragraph("Traitements spécifiques des dents permanentes immatures", H2))
pedo.append(acte_block(
    "Apexogénèse",
    "Pulpotomie sur dent permanente immature — préserve la vitalité pulpaire dans les racines pour permettre la fin de l'édification radiculaire",
    [
        ("Anesthésie", "Plateau anesthésie"),
        ("Pose de la digue", "Feuille de digue · pince Ainsworth · clamp · pince Brewer · cadre Young"),
        ("Éviction carieuse", "Turbine + diamantée · CA bague bleue + CT · excavateur"),
        ("Pulpotomie", "Élimination de la pulpe camérale (excavateur ou fraise stérile)"),
        ("Hémostase", "Compresse stérile humide · sérum physiologique"),
        ("Obturation chambre pulpaire", "<b>Biomatériau</b> (MTA, Biodentine…) — clé pour préserver la vitalité"),
        ("Obturation définitive", "CVI ou composite"),
    ],
))
pedo.append(acte_block(
    "Apexification",
    "Traitement canalaire d'une dent permanente immature à pulpe nécrosée — formation d'une barrière apicale",
    [
        ("Anesthésie + digue", "Idem"),
        ("Cavité d'accès", "Turbine + fraise endo · fraise boule"),
        ("Désinfection canalaire", "Limes endo · irrigation hypochlorite de sodium"),
        ("Mise en place barrière apicale", "<b>Hydroxyde de calcium</b> (Ca(OH)₂) en plusieurs séances OU <b>MTA</b> en monobloc apical"),
        ("Obturation canalaire différée", "Gutta-percha + ciment de scellement"),
        ("Obturation coronaire", "CVI ou composite"),
    ],
))

pedo.append(Spacer(1, 6))
pedo.append(info_box(
    "<b>À retenir :</b> apexogénèse = pulpe vivante à protéger (biomatériau coiffant). "
    "Apexification = pulpe nécrosée à remplacer (Ca(OH)₂ ou MTA pour créer une barrière).",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-pedodontie.pdf", pedo)


# =========================================================
# FICHE 5 — IMPLANTOLOGIE
# =========================================================
imp = []
imp.append(header_block(
    "Implantologie",
    "Fascicule 12 · Pose d'implant + acte prothétique (transfert, empreinte, élément prothétique)",
))
imp.append(Spacer(1, 8))

imp.append(info_box(
    "<b>2 grandes phases :</b> <b>(1) Acte chirurgical</b> (pose de l'implant dans l'os) "
    "puis <b>(2) Acte prothétique</b> (transfert → empreinte → élément prothétique). "
    "L'AD prépare le plateau stérile et assiste à chaque temps.",
))
imp.append(Spacer(1, 6))

imp.append(Paragraph("1 · Acte chirurgical — pose de l'implant", H2))
imp.append(acte_block(
    "Plateau pose d'implant",
    "4 étapes : lambeau → forages → pose implant → vis (cicatrisation ou couverture)",
    [
        ("Anesthésie", "Plateau anesthésie locale"),
        ("Réalisation d'un lambeau", "Bistouri · décolleurs · précelles à lambeau"),
        ("Forages successifs", "Trousse chirurgicale implantaire : forets de diamètres croissants (2.0, 2.8, pilot, etc.) montés sur CA implant + moteur d'implantologie + irrigation sérum physiologique"),
        ("Pose de l'implant", "Implant + tournevis adapté OU contre-angle implantaire (vissé dans l'os)"),
        ("Pose vis de cicatrisation (1 temps)", "Vis de cicatrisation · tournevis"),
        ("Pose vis de couverture (2 temps)", "Vis de couverture + sutures · 2e temps quelques jours avant la phase prothétique pour poser le pilier de cicatrisation"),
        ("Sutures", "Porte-aiguille · fil + aiguille · ciseaux"),
    ],
))

imp.append(Spacer(1, 4))
imp.append(info_box(
    "<b>1 temps chirurgical :</b> vis de cicatrisation posée le jour J. "
    "<b>2 temps chirurgicaux :</b> vis de couverture J0, puis 2e intervention pour "
    "exposer l'implant et poser le pilier de cicatrisation.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))

imp.append(PageBreak())

imp.append(Paragraph("2 · Acte prothétique", H2))
imp.append(Paragraph("3 sous-étapes : <b>Transfert → Empreinte → Pose élément prothétique</b>.", BODY))

imp.append(acte_block(
    "a · Transfert d'empreinte",
    "Se positionne à la place de la vis de cicatrisation — transfère forme et position de l'implant à l'empreinte",
    [
        ("Dépose vis cicatrisation", "Tournevis"),
        ("Mise en place transfert", "Transfert d'empreinte · vissé sur l'implant"),
    ],
))

imp.append(acte_block(
    "b · Empreinte à ciel fermé (pop-on / repositionnement)",
    "Avantages : technique simple/rapide, implant unitaire, postérieur, faible ouverture buccale",
    [
        ("Empreinte classique", "Porte-empreinte · matériau élastomère ou polyéther"),
        ("Dévissage transfert", "Tournevis (en bouche après prise du matériau)"),
        ("Repositionnement au labo", "Analogue d'implant ajouté au transfert · transfert + analogue replacés dans l'empreinte"),
    ],
))

imp.append(acte_block(
    "b' · Empreinte à ciel ouvert (pick up)",
    "Avantages : pas de repositionnement, multiples implants non parallèles, implant très enfoui. Inconvénient : difficile en postérieur",
    [
        ("Préparation PEI/PE", "PEI ou PE jetable percé en regard de l'implant"),
        ("Pose transfert de laboratoire", "Transfert de labo (plus long) vissé sur l'implant"),
        ("Empreinte", "Élastomère ou polyéther"),
        ("Dévissage + désinsertion", "Le transfert reste dans l'empreinte"),
        ("Au labo", "Ajout analogue d'implant sur le transfert directement dans l'empreinte"),
    ],
))

imp.append(acte_block(
    "c · Pose de l'élément prothétique",
    "Couronne scellée OU vissée OU trans-vissée",
    [
        ("Sur faux-moignon (accastillage)", "Titane ou zircone · différentes formes et angulations"),
        ("Scellement", "Ciment de scellement sur accastillage préalablement vissé"),
        ("Vissage direct", "Vis prothétique + tournevis · couronne <b>trans-vissée</b>"),
        ("Vis de laboratoire", "Plus longues que les vis prothétiques · pour maquettes en cire et usinage des moignons"),
    ],
))

build("fascicule-12-implantologie.pdf", imp)


# =========================================================
# FICHE 6 — PARODONTOLOGIE
# =========================================================
par = []
par.append(header_block(
    "Parodontologie",
    "Fascicule 12 · Examen parodontal, traitements non chirurgicaux et chirurgicaux",
))
par.append(Spacer(1, 8))

par.append(info_box(
    "<b>Étiologie principale :</b> la <b>plaque dentaire</b>. Tout traitement parodontal "
    "doit débuter par une bonne maîtrise de l'élimination de la plaque. "
    "Gingivite = atteinte gencive SANS perte d'attache. Parodontite = perte d'attache + os.",
))
par.append(Spacer(1, 6))

par.append(Paragraph("Examen parodontal", H2))
par.append(acte_block(
    "Plateau d'examen parodontal",
    "Examen clinique + radiologique + diagnostic",
    [
        ("Set de consultation", "Miroir · précelle · sonde droite"),
        ("Sondage parodontal", "<b>Sonde parodontale millimétrée</b> (mesure profondeur des poches)"),
        ("Plaque", "<b>Révélateur de plaque</b>"),
        ("Radio", "Film radio / capteur + angulateur"),
        ("Examens complémentaires", "Microscope optique · fiche clinique paro (papier ou numérique) · +/- porte-empreinte + alginate · +/- appareil photo"),
    ],
))

par.append(Paragraph("Diagnostic", H2))
par.append(acte_block(
    "Gingivite vs Parodontite",
    "Différence clé : la perte d'attache",
    [
        ("Gingivite", "Rougeur · œdème · hypertrophie gingivale · saignement spontané ou au brossage/sondage · <b>PAS de perte d'attache</b>"),
        ("Parodontite", "Atteinte des tissus superficiels ET profonds · <b>PERTE D'ATTACHE</b> · poches parodontales · destruction osseuse"),
    ],
))

par.append(PageBreak())

par.append(Paragraph("Traitements non chirurgicaux — curetage / surfaçage", H2))
par.append(acte_block(
    "Plateau curetage / surfaçage",
    "Élimination du tartre sous-gingival et du tissu inflammatoire — favorise le retour à un parodonte sain",
    [
        ("Anesthésie", "Aiguille · carpule tiédie et désinfectée · porte-carpule · anesthésique de contact"),
        ("Curetage / surfaçage", "<b>Curettes de Gracey</b> (utilisation en traction · technique en aveugle · formes selon la dent à traiter et sa face)"),
        ("Polissage", "Brossette montée sur CA + pâte à polir"),
        ("Antiseptiques", "Matériel d'irrigation des poches (seringue + chlorhexidine par exemple)"),
        ("Compresses", "Compresses · aéropolisseur"),
        ("US + insert", "Détartreur ultrasonique + insert"),
        ("Antibiotiques (si besoin)", "Voie locale ou générale selon prescription"),
    ],
))

par.append(Paragraph("Traitements chirurgicaux", H2))
par.append(Paragraph(
    "<b>2 types :</b> chirurgie d'assainissement (poches inaccessibles) OU "
    "chirurgie réparatrice (rétablir des conditions favorables).", BODY,
))
par.append(Spacer(1, 4))
par.append(acte_block(
    "Plateau chirurgie parodontale (lambeau d'assainissement, comblement osseux, ROG, greffe)",
    "Protocole complet en 7 étapes",
    [
        ("Prévoir", "Champ opératoire stérile · produit de désinfection exo/endo-buccale · sérum physiologique (nettoyer/rincer) · compresses · canule d'aspiration stérile"),
        ("Anesthésie", "Aiguille · carpule tiédie et désinfectée · porte-carpule · anesthésique de contact"),
        ("Incision", "Bistouri + lame"),
        ("Décollement du lambeau", "Décolleur"),
        ("Curetage / surfaçage", "Curettes de Gracey · US + insert"),
        ("Comblement osseux (si besoin)", "Matériau de comblement osseux"),
        ("Sutures", "Porte-aiguille · fil de sutures · ciseaux"),
    ],
))

par.append(Spacer(1, 4))
par.append(info_box(
    "<b>Prescription pré/post-op :</b> antibiothérapie · anti-inflammatoires · "
    "antalgiques · antiseptiques (bain de bouche) · brosses 6.5/100 puis 15/100 · "
    "poche de glace.",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

par.append(Paragraph("Maintenance parodontale", H2))
par.append(Paragraph(
    "Visites de contrôle régulières · détartrage / polissage · rappel des règles d'hygiène. "
    "Pronostic gingivite = excellent si retour à une bonne hygiène. "
    "Pronostic parodontite = incertain, dépend de l'implication du patient.", BODY,
))

build("fascicule-12-parodontologie.pdf", par)


# =========================================================
# FICHE 7 — TRAUMATOLOGIE
# =========================================================
tra = []
tra.append(header_block(
    "Traumatologie",
    "Fascicule 12 · Fractures dentaires et atteintes des tissus mous (denture temporaire et permanente)",
))
tra.append(Spacer(1, 8))

tra.append(info_box(
    "<b>2 types d'atteintes :</b> <b>fractures</b> (coronaire, corono-radiculaire, "
    "radiculaire) ET <b>atteintes des tissus mous</b> (intrusion, extrusion, "
    "luxation, expulsion). Traitement = dépend du type et de la maturité de la dent.",
))
tra.append(Spacer(1, 6))

tra.append(Paragraph("Fractures — arbre décisionnel", H2))
tra.append(acte_block(
    "Fracture coronaire SANS exposition pulpaire",
    "Limitée à l'émail/dentine, sans atteinte de la pulpe",
    [
        ("Traitement", "<b>Polissage</b> (si très limitée) OU <b>composite</b> de restauration"),
        ("Plateau", "Plateau OCR (turbine · CA bague rouge/bleue · composite · adhésif · lampe à polymériser · fraises diamantées grains fins · cupules à polir)"),
    ],
))

tra.append(acte_block(
    "Fracture coronaire AVEC exposition pulpaire",
    "La pulpe est exposée — réaction selon maturité de la dent",
    [
        ("Dent mature", "<b>Coiffage direct</b> (effraction limitée) OU <b>pulpotomie / traitement endo</b> (effraction étendue)"),
        ("Dent immature", "<b>Apexogénèse</b> (pulpe vivante à préserver pour fin d'édification) OU <b>apexification</b> (pulpe nécrosée)"),
        ("Plateau", "Plateau OCE (digue · CA bague bleue · limes endo · irrigation hypochlorite · biomatériau ou hydroxyde de calcium · gutta + ciment de scellement)"),
    ],
))

tra.append(acte_block(
    "Fracture corono-radiculaire",
    "Selon le trait de fracture et la communication avec le milieu buccal",
    [
        ("Sans exposition pulpaire", "<b>Extraction du fragment</b> mobile"),
        ("Avec exposition pulpaire", "<b>Avulsion</b> OU <b>extrusion ortho ou chirurgicale</b> pour conservation"),
    ],
))

tra.append(acte_block(
    "Fracture radiculaire",
    "Selon le niveau du trait et la distance entre les fragments",
    [
        ("1/3 coronaire", "<b>Traitement endo + prothèse</b> · contention · surveillance vitalité pulpaire"),
        ("1/3 médian", "<b>Extraction</b> · contention · surveillance vitalité pulpaire"),
        ("1/3 apical", "<b>Apicectomie + traitement endo</b> · contention + surveillance vitalité pulpaire"),
    ],
))

tra.append(PageBreak())

tra.append(Paragraph("Atteintes des tissus mous — arbre décisionnel", H2))
tra.append(acte_block(
    "Intrusion",
    "La dent est enfoncée dans l'alvéole",
    [
        ("Option 1", "<b>Ré-éruption spontanée</b> possible (surveillance)"),
        ("Option 2", "<b>Repositionnement orthodontique ou chirurgical</b>"),
        ("Suite", "Surveillance régulière"),
    ],
))

tra.append(acte_block(
    "Extrusion / Luxation",
    "La dent est sortie ou déplacée de son alvéole sans expulsion",
    [
        ("Traitement", "<b>Repositionnement + contention</b>"),
        ("Suite", "Surveillance régulière"),
    ],
))

tra.append(acte_block(
    "Expulsion (avulsion traumatique)",
    "La dent est totalement sortie de l'alvéole — pronostic dépend du Temps Extra-Alvéolaire (TEA)",
    [
        ("TEA < 60 min + milieu adéquat (sérum, lait, salive)", "<b>Réimplantation + contention</b> · surveillance régulière"),
        ("TEA > 60 min OU milieu inadéquat", "<b>Traitement endo + réimplantation</b>"),
        ("Plateau", "Sérum physiologique stérile · digue · contention (fil + composite OU attelle) · matériel d'endo si TEA > 60 min"),
    ],
))

tra.append(Spacer(1, 6))
tra.append(info_box(
    "<b>Conseils au patient (TEA) :</b> ne jamais nettoyer la dent (préserver le ligament). "
    "Conserver dans : <b>sérum physiologique → lait → salive du patient</b>. "
    "Consulter en urgence : pronostic excellent si réimplantation rapide.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))

tra.append(Paragraph("Rôle de l'AD en traumatologie", H2))
tra.append(Paragraph(
    "Accueillir l'urgence · rassurer le patient (et les parents si enfant) · "
    "préparer le plateau adapté · aspirer · préparer la radio · "
    "appliquer les conseils post-trauma (alimentation molle, hygiène douce, "
    "surveillance de la couleur de la dent dans les semaines suivantes).", BODY,
))

build("fascicule-12-traumatologie.pdf", tra)


# =========================================================
# FICHE 8 — PROTHÈSE CONJOINTE
# =========================================================
prc = []
prc.append(header_block(
    "Prothèse conjointe",
    "Fascicule 12 · Inlay-onlay, facettes, couronnes, bridges — fixe en bouche",
))
prc.append(Spacer(1, 8))

prc.append(info_box(
    "<b>Rôles :</b> préventif (protection des tissus restants) · fonctionnel "
    "(mastication, occlusion) · esthétique. <b>Types :</b> inlay-onlay-overlay, "
    "facettes, couronnes (unitaires), bridges (pluralles), prothèse sur implant.",
))
prc.append(Spacer(1, 6))

prc.append(Paragraph("Inlay / Onlay / Overlay", H2))
prc.append(acte_block(
    "Plateau inlay-onlay (2 séances)",
    "Restauration indirecte par pièce prothétique — alternative au composite pour cavités étendues",
    [
        ("1re séance · préparation", "Plateau éviction (turbine · CA bague rouge · fraises diamantées)"),
        ("1re séance · empreinte", "Porte-empreinte · matériau élastomère OU caméra optique numérique"),
        ("1re séance · obturation provisoire", "Cavit · eugénate"),
        ("2e séance · scellement", "Ciment de scellement OU composite de collage"),
        ("2e séance · réglage et polissage", "Papier à articuler · pince de Miller · fraises diamantées grains fins · cupules à polir"),
    ],
))

prc.append(Paragraph("Facettes (3 séances)", H2))
prc.append(acte_block(
    "Plateau facettes — protocole en 3 temps",
    "Restauration esthétique des faces vestibulaires antérieures",
    [
        ("1re séance · empreinte de situation", "Matériau à empreinte (alginate) · PE — pour wax-up et clé en silicone"),
        ("2e séance · anesthésie", "Aiguille · carpule · porte-carpule · anesthésique de contact"),
        ("2e séance · taille des dents", "Turbine ou CAR · fraise diamantée congé"),
        ("2e séance · empreinte", "Matériau silicone ou polyéther · PE · cire d'occlusion"),
        ("2e séance · facettes temporaires", "Provisoires fabriquées via clé silicone"),
        ("3e séance · dépose temporaires", "US + insert"),
        ("3e séance · essayage", "Facettes reçues du laboratoire"),
        ("3e séance · collage", "Composite de collage · lampe à photopolymériser"),
    ],
))

prc.append(PageBreak())

prc.append(Paragraph("Reconstructions du pilier (dent dépulpée)", H2))
prc.append(acte_block(
    "Inlay-core (2 séances) — pièce prothétique fabriquée par le prothésiste",
    "Tenon radiculaire + reconstitution de la portion coronaire — la dent est obligatoirement <b>dépulpée</b>",
    [
        ("1re séance", "Alésage du canal · empreinte du canal · obturation provisoire"),
        ("Au labo", "Coulée de l'inlay-core (titane, cobalt-chrome, zircone…)"),
        ("2e séance", "Essayage · scellement (ciment) · préparation pour couronne"),
    ],
))
prc.append(acte_block(
    "Tenon + composite foulé",
    "Alternative directe au cabinet (1 séance) — pas de support obligatoire de couronne",
    [
        ("Préparation canal", "Forets calibrés"),
        ("Pose tenon", "Tenon radiculaire (fibre, métal) · ciment de scellement"),
        ("Reconstitution", "Composite foulé · spatule · lampe à photopolymériser"),
    ],
))

prc.append(Paragraph("Couronnes (2 ou 4 séances selon biscuit ou non)", H2))
prc.append(acte_block(
    "Plateau couronne — protocole standard",
    "Restauration complète d'une dent dépulpée ou très délabrée",
    [
        ("1re séance · préparation", "Turbine + fraises diamantées · ligne de finition selon couronne (épaulement, congé ou chanfrein)"),
        ("1re séance · éviction gingivale", "Cordonnet + solution hémostatique OU pâte à base d'argile OU curetage rotatif (fraise à sulcus) OU laser/bistouri électrique"),
        ("1re séance · empreinte", "Wash Technic, double mélange OU polyéthers (élastomères)"),
        ("1re séance · provisoire", "Couronne provisoire scellée au ciment provisoire"),
        ("2e séance (ou 4e) · dépose provisoire", "US + insert"),
        ("2e séance · essayage + réglage", "Couronne reçue du labo · alcool (désinfection) · papier à articuler · pince de Miller · CA ou PAM + meulettes spécifiques · turbine + diamantées grains fins"),
        ("2e séance · pose", "Ciment de scellement OU composite de collage (selon matériau de la couronne)"),
    ],
))

prc.append(PageBreak())

prc.append(Paragraph("Bridges (prothèse plurale)", H2))
prc.append(acte_block(
    "Plateau bridge — protocole proche couronne",
    "Remplace une ou plusieurs dents manquantes en s'appuyant sur les dents adjacentes (piliers)",
    [
        ("Préparation des piliers", "Idem couronne — sur 2 dents (mésial + distal du pontique)"),
        ("Empreinte globale", "Élastomère · enregistrement des piliers + pontique"),
        ("Provisoire", "Bridge provisoire scellé au ciment provisoire"),
        ("Essayage + scellement", "Bridge reçu du labo · ciment de scellement"),
        ("Variante", "Bridge attelle (collé sur faces palatines/linguales sans préparation lourde)"),
    ],
))

prc.append(Paragraph("Attachements (prothèse mixte / combinée)", H2))
prc.append(Paragraph(
    "<b>Dispositifs extra-coronaires</b> : suivent le même protocole que les couronnes, "
    "faits en concomitance de la prothèse amovible. "
    "<b>Dispositifs intra-radiculaires</b> : préparés comme les inlays-cores.", BODY,
))

prc.append(Paragraph("Prothèse sur implant", H2))
prc.append(Paragraph(
    "Unitaire ou plurale, en céramique ou céramo-métal. Couronne <b>scellée</b> "
    "sur faux-moignon vissé sur l'implant, ou directement <b>vissée</b> "
    "(on dit <b>trans-vissée</b>). Peut aussi être un attachement pour prothèse "
    "amovible sur implant.", BODY,
))

prc.append(Spacer(1, 6))
prc.append(info_box(
    "<b>Hygiène spécifique :</b> brossage classique + fil dentaire. "
    "Pour bridges / inters : <b>hydropulseur</b> et brossettes inter-dentaires "
    "(sous les inters et autour des piliers).",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-prothese-conjointe.pdf", prc)


# =========================================================
# FICHE 9 — PROTHÈSE ADJOINTE (PPA + PAC)
# =========================================================
pra = []
pra.append(header_block(
    "Prothèse adjointe",
    "Fascicule 12 · PPA (partielle amovible) et PAC/PAT (complète) — amovible",
))
pra.append(Spacer(1, 8))

pra.append(info_box(
    "<b>2 grandes catégories :</b> <b>PPA</b> (Prothèse Partielle Adjointe) "
    "pour remplacer quelques dents · <b>PAC ou PAT</b> (Prothèse Adjointe Complète/Totale) "
    "pour édentement total uni- ou bimaxillaire. Matériaux : résine, métallique (stellite), souple.",
))
pra.append(Spacer(1, 6))

pra.append(Paragraph("PPA — Prothèse Partielle Adjointe", H2))
pra.append(acte_block(
    "Étapes Fauteuil ↔ Laboratoire (PPA)",
    "Réalisation en plusieurs séances, alternant fauteuil et laboratoire",
    [
        ("Fauteuil · examen clinique", "Set consultation · bilan radio · empreintes d'étude éventuelles"),
        ("Fauteuil · empreinte primaire pour PEI", "Porte-empreinte du commerce + alginate"),
        ("Labo · 1", "Coulée des empreintes + réalisation des <b>PEI</b> (Porte-Empreinte Individuel)"),
        ("Fauteuil · empreinte secondaire anatomo-fonctionnelle", "PEI · matériau à empreinte (élastomère, polysulfure…) — enregistre dents restantes + tissus mous + muscles périphériques"),
        ("Labo · 2", "Coulée + réalisation des <b>cires d'occlusion</b>"),
        ("Fauteuil · RIA (Rapport Inter-Arcades)", "Maquettes d'occlusion · +/- arc facial · choix forme/taille/teinte des dents"),
        ("Labo · 3", "Mise en articulateur · élaboration de l'<b>infrastructure métallique</b> (stellite)"),
        ("Fauteuil · essayage du châssis", "Vérification adaptation"),
        ("Labo · 4", "Montage dents sur cire"),
        ("Fauteuil · essayage esthétique", "Vérifie insertion/désinsertion · adaptation des selles · occlusion · esthétique"),
        ("Labo · 5", "Mise en moufle (transformation cire → résine) · polissage"),
        ("Fauteuil · pose + équilibration", "Pose + conseils · contrôle quelques jours après (équilibration / doléances)"),
    ],
))

pra.append(PageBreak())

pra.append(Paragraph("PAC / PAT — Prothèse Adjointe Complète / Totale", H2))
pra.append(info_box(
    "<b>Triade de Housset :</b> <b>Sustentation</b> (résistance à l'enfoncement) · "
    "<b>Rétention</b> (résistance à l'arrachement) · <b>Stabilisation</b> "
    "(équilibre sur le plan latéral). La PAC doit être stable, rétentive, esthétique, équilibrée.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))

pra.append(acte_block(
    "Étapes Fauteuil ↔ Laboratoire (PAC)",
    "Protocole proche de la PPA mais sans dents restantes à enregistrer",
    [
        ("Fauteuil · examen clinique", "Set consultation"),
        ("Fauteuil · empreinte primaire pour PEI", "Porte-empreinte commerce + alginate"),
        ("Labo · 1", "Coulée + réalisation des <b>PEI</b>"),
        ("Fauteuil · empreinte secondaire", "PEI · matériau à empreinte (élastomère ou polysulfure)"),
        ("Labo · 2", "Coulée avec <b>boxage</b> · réalisation des <b>maquettes d'occlusion</b>"),
        ("Fauteuil · RIA", "Maquettes d'occlusion · choix forme/taille/teinte"),
        ("Labo · 3", "Mise en articulateur · montage des dents sur cire · maquettes en cire"),
        ("Fauteuil · essayage", "Vérification cire/dents · esthétique · occlusion"),
        ("Labo · 4", "<b>Mise en moufle</b> : transformation cire → résine · polissage"),
        ("Fauteuil · pose + équilibration secondaire", "Pose · contrôle quelques jours après"),
    ],
))

pra.append(Spacer(1, 6))
pra.append(Paragraph("Passage édentement partiel → complet", H2))
pra.append(Paragraph(
    "<b>2 voies possibles :</b> prothèse amovible transitoire immédiate "
    "(le jour des avulsions) OU modifications successives d'une PPA vers une PAC "
    "(au fur et à mesure des pertes dentaires).", BODY,
))

pra.append(Paragraph("Conseils au patient porteur de PAC", H2))
pra.append(Paragraph(
    "<b>Hygiène quotidienne :</b> nettoyer la prothèse après chaque repas (brosse + savon doux, "
    "PAS de dentifrice abrasif) · trempage antiseptique régulier. "
    "<b>Port :</b> retirer la nuit (repos des muqueuses) · masser les gencives. "
    "<b>Alimentation :</b> commencer par aliments mous, progresser. "
    "<b>Contrôles :</b> consultation tous les 6-12 mois (réajustement, rebasage, "
    "vérification de l'occlusion).", BODY,
))

build("fascicule-12-prothese-adjointe.pdf", pra)


print("\nDONE -> 6 nouveaux fichiers générés.")
