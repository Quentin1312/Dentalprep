"""Fiches compléments du Fascicule 12 :
- OCE / Endodontie (pulpotomie, biopulpectomie, traitement canalaire, retraitement)
- Préalables chirurgicaux (lavage mains, tenue, salle, matériel chir, sutures)
- ODF (Orthopédie Dento-Faciale)
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether,
)

sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "fiches"))
os.makedirs(OUT_DIR, exist_ok=True)

C_PRIMARY = colors.HexColor("#0A66E0")
C_PRIMARY_SOFT = colors.HexColor("#E6F0FF")
C_TEXT = colors.HexColor("#0F1B2D")
C_MUTED = colors.HexColor("#5B6B82")
C_BORDER = colors.HexColor("#D6DEEC")
C_BG_ROW = colors.HexColor("#FBFCFE")
C_GREEN = colors.HexColor("#0D9488")
C_AMBER = colors.HexColor("#D97706")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=22, leading=26, textColor=C_TEXT, spaceAfter=4)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], fontName="Helvetica",
                     fontSize=10, leading=13, textColor=C_MUTED, spaceAfter=14)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=13, leading=16, textColor=C_PRIMARY,
                    spaceBefore=14, spaceAfter=6)
H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                    fontSize=11, leading=14, textColor=C_TEXT,
                    spaceBefore=8, spaceAfter=4)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=9.5, leading=13, textColor=C_TEXT)


def header_block(title, sub):
    t = Table([[Paragraph(f"<b>{title}</b>", H1)], [Paragraph(sub, SUB)]],
              colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (-1, -1), C_PRIMARY_SOFT),
        ("LINEBELOW", (0, -1), (-1, -1), 1.2, C_PRIMARY),
    ]))
    return t


def acte_block(nom, indications, etapes_materiel):
    elements = [Paragraph(f"<b>{nom}</b>", H3)]
    if indications:
        elements.append(Paragraph(
            f"<font color='#5B6B82'><b>Indications :</b> {indications}</font>", BODY))
        elements.append(Spacer(1, 3))
    rows = [[
        Paragraph("<b>Étape</b>", ParagraphStyle("th", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
        Paragraph("<b>Matériel</b>", ParagraphStyle("th2", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
    ]]
    for etape, mat in etapes_materiel:
        rows.append([Paragraph(etape, BODY), Paragraph(mat, BODY)])
    tbl = Table(rows, colWidths=[75 * mm, 95 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_BG_ROW]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, C_BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 8))
    return KeepTogether(elements)


def info_box(text, bg=C_PRIMARY_SOFT, border=C_PRIMARY):
    t = Table([[Paragraph(text, BODY)]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(C_MUTED)
    canvas.drawCentredString(A4[0] / 2, 12 * mm,
        f"DentalPrep · Fascicule 12 - Travail au fauteuil · {doc.page}")
    canvas.restoreState()


def build(filename, elements):
    path = os.path.join(OUT_DIR, filename)
    doc = SimpleDocTemplate(path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=15 * mm, bottomMargin=18 * mm,
        title="DentalPrep - " + filename.replace(".pdf", ""), author="DentalPrep")
    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    print(f"OK -> {path}")


# =========================================================
# FICHE 10 — OCE / ENDODONTIE
# =========================================================
oce = []
oce.append(header_block(
    "OCE — Endodontie",
    "Fascicule 12 · Pulpotomie · Biopulpectomie · Traitement canalaire · Retraitement",
))
oce.append(Spacer(1, 8))

oce.append(info_box(
    "<b>L'endodontie</b> = traitement des pulpopathies. Dépend du degré de maturité "
    "de la dent, du type de dent (temporaire/permanente) et de la gravité. "
    "<b>La pose de la digue est INDISPENSABLE dans tous les cas !!!</b>",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))
oce.append(Spacer(1, 6))

oce.append(Paragraph("Vocabulaire à connaître", H2))
oce.append(acte_block(
    "Les 3 types de traitements",
    "À bien différencier",
    [
        ("Pulpotomie", "Amputation de la <b>pulpe camérale</b> uniquement (la racine reste vivante)"),
        ("Biopulpectomie", "Ablation totale de la <b>pulpe vivante</b> (camérale + radiculaire)"),
        ("Traitement canalaire", "Ablation totale de la <b>pulpe nécrosée</b> (camérale + radiculaire)"),
        ("Retraitement", "Reprise d'un traitement endo déjà fait (infection, granulome, kyste, ramolli)"),
    ],
))

oce.append(Paragraph("1 · Pulpotomie — plateau complet", H2))
oce.append(acte_block(
    "Indications",
    "Dents temporaires (matériau de choix CVI) et permanentes immatures",
    [
        ("Dents temporaires", "Indication large · CONTRE-indications : résorption radiculaire, atteinte furcation, pas de reconstitution coronaire possible → <b>avulsion</b>"),
        ("Dents permanentes immatures", "Inflammation localisée · CONTRE-indication : inflammation généralisée → <b>pulpectomie</b>"),
        ("Signaux d'avulsion", "Pas de saignement (nécrose) · hémostase non obtenue (inflammation trop importante)"),
    ],
))
oce.append(acte_block(
    "Plateau pulpotomie",
    "9 étapes — l'anesthésie est obligatoire (pulpe vivante)",
    [
        ("1/ Radio pré-op", "Film radio / capteur · porte-film / angulateur"),
        ("2/ Anesthésie", "Carpule · porte-carpule · aiguille · anesthésique de contact"),
        ("3/ Pose de la digue", "Feuille de digue · pince Ainsworth · clamp · pince Brewer · cadre Young"),
        ("4/ Éviction tissu carieux", "Turbine + fraise diamantée · CA bague bleue + fraise tungstène"),
        ("5/ Ouverture de la chambre pulpaire", "CA + fraise <b>boule tungstène</b>"),
        ("6/ Élimination plafond caméral + parenchyme caméral", "Turbine + <b>fraise EndoZ</b> (bout mousse, non travaillant — élimine le plafond sans léser le plancher)"),
        ("7/ Hémostase", "Boulette de coton · sérum physiologique"),
        ("8/ Obturation chambre pulpaire", "<b>Eugénate</b> ou <b>biomatériau</b> (Biodentine, MTA)"),
        ("9/ Obturation coronaire", "<b>CVI</b> (dent temporaire) · amalgame · <b>coiffe pédiatrique</b> si grosse perte"),
        ("10/ Radio post-op", "Film radio · porte-film"),
    ],
))

oce.append(PageBreak())

oce.append(Paragraph("2 · Biopulpectomie — plateau complet", H2))
oce.append(acte_block(
    "Indications",
    "Dent permanente mature avec pulpite ou cause prothétique/iatrogène — pulpe vivante",
    [
        ("Indication principale", "Dent permanente mature · pulpite irréversible · cause prothétique/iatrogène"),
        ("Sur dent temporaire", "Peu réalisée (long, difficile chez le jeune enfant)"),
        ("Sur dent immature", "Tenter de conserver la vitalité avant si possible (pulpotomie)"),
    ],
))
oce.append(acte_block(
    "Plateau biopulpectomie — étapes 1-5 identiques à la pulpotomie",
    "Anesthésie obligatoire (pulpe vivante) · suite spécifique au traitement canalaire",
    [
        ("1-5 (idem pulpotomie)", "Radio · anesthésie · digue · éviction · ouverture chambre · ablation parenchyme caméral et radiculaire"),
        ("Outil ouverture canaux", "Turbine + fraise EndoZ · <b>Sonde 17</b> (vérifie qu'il ne reste pas de plafond caméral qui obstruerait l'entrée canalaire)"),
        ("6/ Repérage des entrées canalaires", "<b>Sonde droite</b> ou <b>sonde 23</b>"),
        ("7/ Cathétérisme (pénétration initiale)", "<b>Lime K 10 ou 15</b> · <b>localisateur d'apex</b> (détermine la Longueur de Travail LT) · jauge · +/- radio avec limes en place"),
        ("8/ Mise en forme canalaire (alésage)", "<b>Manuel :</b> limes K + H (racleur) en alternance ou broches · <b>Mécanique :</b> limes mécanisées · CA endo · forets (élargissement coronaire)"),
        ("Irrigation continue", "Hypochlorite de sodium (NaOCl) entre chaque lime"),
        ("9/ Obturation canalaire", "<b>Gutta-percha</b> + ciment de scellement endo · fouloirs · spreaders"),
        ("10/ Obturation coronaire", "CVI ou composite (provisoire ou définitive)"),
        ("11/ Radio post-op", "Film radio · porte-film"),
    ],
))

oce.append(PageBreak())

oce.append(Paragraph("Limes endodontiques — code couleur", H2))
oce.append(info_box(
    "<b>Code couleur des limes (selon diamètre de la partie active) :</b><br/>"
    "<b>Rose 06</b> · <b>Gris 08</b> · <b>Violet 10</b> · <b>Blanc 15/45/90</b> · "
    "<b>Jaune 20/50/100</b> · <b>Rouge 25/55/110</b> · <b>Bleu 30/60/120</b> · "
    "<b>Vert 35/70/130</b> · <b>Noir 40/80/140</b>.",
))
oce.append(acte_block(
    "Types de limes manuelles",
    "Différenciées par la section de la partie active",
    [
        ("Section ronde · spirale à pas serrés", "<b>Racleurs</b> (limes H/Hedström)"),
        ("Section carrée · pas serrés", "<b>Limes K</b> (limes Kerr)"),
        ("Section triangulaire · spirale à pas larges", "<b>Broches</b>"),
    ],
))

oce.append(Paragraph("3 · Traitement canalaire (pulpe nécrosée)", H2))
oce.append(acte_block(
    "Protocole proche de la biopulpectomie — 3 différences clés",
    "Pulpe nécrosée — pas de vitalité à préserver",
    [
        ("Anesthésie", "<b>PAS nécessaire</b> car la pulpe est nécrosée"),
        ("Désinfection", "Encore plus importante (charge bactérienne élevée)"),
        ("Obturation canalaire", "Peut être <b>différée</b> : interséance avec <b>hydroxyde de calcium</b> (Ca(OH)₂) dans le canal si écoulement purulent, saignement, lésion apicale, traitement difficile"),
        ("Étapes restantes", "Idem biopulpectomie (radio · digue · éviction · ouverture · cathétérisme · mise en forme · irrigation · obturation gutta + ciment)"),
    ],
))

oce.append(Paragraph("4 · Retraitement endodontique", H2))
oce.append(acte_block(
    "Indications + protocole",
    "Reprise d'un traitement endo déjà réalisé",
    [
        ("Indications", "Infection (granulome péri-apical, kyste) · traitement ramolli et/ou infiltré"),
        ("Anesthésie", "<b>PAS nécessaire</b> (dent non vitale)"),
        ("1/ Dépose obturation coronaire ou élément prothétique", "Turbine + diamantée · US + insert (si couronne)"),
        ("2/ Désobturation du réseau canalaire", "Solvant chimique (eucalyptol, chloroforme) · limes spécifiques · forets de désobturation"),
        ("3/ Obturation du réseau canalaire", "Reprise du protocole canalaire normal (mise en forme, irrigation, obturation gutta)"),
        ("4/ Obturation coronaire provisoire", "CVI ou ciment provisoire"),
    ],
))

build("fascicule-12-oce-endodontie.pdf", oce)


# =========================================================
# FICHE 11 — PRÉALABLES CHIRURGICAUX
# =========================================================
pre = []
pre.append(header_block(
    "Préalables chirurgicaux",
    "Fascicule 12 · Lavage des mains, tenue, salle de soins, matériel chir, sutures",
))
pre.append(Spacer(1, 8))

pre.append(info_box(
    "<b>5 préalables à connaître :</b> (1) lavage des mains (3 types) · "
    "(2) tenue et protection · (3) préparation de la salle · "
    "(4) connaître les risques (questionnaire médical, prémédication) · "
    "(5) matériel commun à toute chirurgie.",
))
pre.append(Spacer(1, 6))

pre.append(Paragraph("1 · Lavage des mains — 3 techniques", H2))
pre.append(acte_block(
    "Lavage SIMPLE",
    "Avant et après chaque acte de soin courant — savon doux",
    [
        ("Étapes", "Se mouiller les mains · prélever du <b>savon doux</b> · savonner sans oublier les espaces interdigitaux <b>pendant 30 secondes</b> · rincer · sécher par tamponnement avec essuie-mains à usage unique · jeter l'essuie-mains sans toucher la poubelle"),
    ],
))
pre.append(acte_block(
    "Lavage ANTISEPTIQUE (hygiénique)",
    "Avant tout soin invasif non-chirurgical — savon antiseptique",
    [
        ("Étapes", "Idem lavage simple MAIS : <b>savon antiseptique</b> · savonnage <b>pendant 1 minute</b>"),
    ],
))
pre.append(acte_block(
    "Lavage CHIRURGICAL",
    "Avant tout acte chirurgical — savon antiseptique + friction chirurgicale",
    [
        ("1/ Lavage", "Se mouiller mains et avant-bras · prélever savon antiseptique · savonner mains <b>et coudes inclus</b> pendant plusieurs minutes · brosser les ongles pendant 1 minute avec brosse stérile"),
        ("2/ Rinçage", "Rincer abondamment mains ET avant-bras <b>en relevant les mains</b> — laisser couler la mousse et l'eau vers les coudes"),
        ("3/ Séchage", "Tamponner avec essuie-mains à usage unique <b>stérile</b>"),
        ("4/ Jeter sans toucher", "Jeter dans la poubelle sans la toucher"),
        ("5/ Friction chirurgicale", "Après le lavage · 2 frictions de produit hydro-alcoolique (paume contre paume · paume sur dos de main · espaces interdigitaux · paumes contre dos des doigts · pulpe des doigts · pouces · poignets · avant-bras) · respecter dose et temps du fabricant"),
    ],
))

pre.append(PageBreak())

pre.append(Paragraph("2 · Tenue et protection", H2))
pre.append(acte_block(
    "Plateau tenue chirurgicale",
    "À avoir avant tout acte chirurgical",
    [
        ("Tenue de base", "Tenue professionnelle +/- sur-blouse"),
        ("Masque", "Masque chirurgical"),
        ("Yeux", "<b>Lunettes larges</b> (protection projections)"),
        ("Mains", "<b>Gants stériles</b> (jamais latex si patient allergique)"),
        ("Cheveux", "<b>Charlotte</b>"),
    ],
))

pre.append(Paragraph("3 · Préparation de la salle de soins", H2))
pre.append(info_box(
    "Une fois les gants stériles enfilés, <b>plus rien ne doit être touché par l'opérateur "
    "si ce n'est des instruments stériles</b>. Si oubli → l'AD doit retirer les gants, "
    "se frictionner les mains, sortir le matériel manquant, refaire les étapes de lavage "
    "ou friction chirurgicale et remettre une nouvelle paire de gants stériles.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))
pre.append(acte_block(
    "Préparation salle",
    "Asepsie + confort patient",
    [
        ("Instruments", "Préparés en fonction de l'acte prévu · disposés sur champs stériles · cassettes ou boîtes stériles favorisent l'organisation"),
        ("Environnement", "Luminosité adaptée · température · confort patient (position longue durée)"),
        ("Planning", "Prévoir la chirurgie dans l'agenda (durée + position dans la séquence des soins du jour)"),
    ],
))

pre.append(Paragraph("4 · Connaître les risques", H2))
pre.append(Paragraph(
    "Avant tout acte médical/chirurgical : <b>questionnaire médical</b> rempli pour "
    "mettre en évidence les risques <b>hémorragiques, infectieux, allergiques</b>… "
    "Une <b>prémédication</b> peut être nécessaire.", BODY,
))

pre.append(Paragraph("5 · Matériel commun à toute chirurgie", H2))
pre.append(acte_block(
    "Plateau de base chirurgical",
    "À prévoir pour tout acte chirurgical (en plus du plateau spécifique à l'acte)",
    [
        ("Champs stériles", "1 champ pour <b>déposer le matériel</b> · 1 champ <b>troué pour couvrir le patient</b>"),
        ("Aspiration", "Aspiration chirurgicale <b>stérile</b>"),
        ("Antiseptiques", "Solution type <b>Bétadine®</b> ou <b>Hexomédine®</b> pour badigeon extra-buccal · solution type <b>Eludril®</b> pour bain de bouche pré-op"),
        ("Anesthésie", "Plateau anesthésie classique (cf. fiche OCR)"),
        ("Compresses", "Compresses stériles"),
        ("Hémostase", "Éponges hémostatiques"),
        ("Pince spécifique", "<b>Pince gouge</b> (sectionne des fragments osseux)"),
        ("Sutures", "Fil de sutures + aiguille · <b>pince porte-aiguille</b> · <b>ciseaux à sutures</b>"),
    ],
))

build("fascicule-12-prealables-chirurgicaux.pdf", pre)


# =========================================================
# FICHE 12 — ODF
# =========================================================
odf = []
odf.append(header_block(
    "Orthopédie Dento-Faciale (ODF)",
    "Fascicule 12 · Prévention, dépistage, diagnostic et traitement des malpositions",
))
odf.append(Spacer(1, 8))

odf.append(info_box(
    "<b>ODF :</b> science qui a pour objet la prévention, le dépistage, le diagnostic "
    "et le traitement des malformations et malpositions de la face, des maxillaires, "
    "des arcades dentaires et des dents.<br/>"
    "<b>Orthodontie :</b> mêmes buts mais uniquement au niveau des <b>arcades dentaires, "
    "os alvéolaire et dents</b>. C'est une partie de l'ODF.",
))
oce.append(Spacer(1, 6))

odf.append(Paragraph("Buts de l'ODF", H2))
odf.append(acte_block(
    "3 grands buts",
    "À connaître pour comprendre les indications",
    [
        ("Fonctionnels", "Rétablir une bonne occlusion"),
        ("Esthétiques", "Harmonie du sourire et du visage"),
        ("Préventifs", "Bonne occlusion → meilleure hygiène → prévient caries et parodontopathies · prévient troubles de l'ATM · intercepte les mauvaises habitudes"),
    ],
))

odf.append(Paragraph("Classification d'Angle — à connaître par cœur", H2))
odf.append(acte_block(
    "Les 3 classes d'occlusion",
    "Référence anatomique : rapport de la 1re molaire maxillaire/mandibulaire",
    [
        ("Classe I", "<b>Occlusion harmonieuse</b> — pas de décalage antéro-postérieur entre maxillaire et mandibule"),
        ("Classe II", "Maxillaire en <b>avant</b> de la mandibule (rétrognathie mandibulaire ou prognathie maxillaire)"),
        ("Classe III", "Mandibule en <b>avant</b> du maxillaire (prognathie mandibulaire ou rétrognathie maxillaire)"),
    ],
))

odf.append(Paragraph("Principes du déplacement dentaire", H2))
odf.append(Paragraph(
    "Le déplacement est possible grâce à une propriété de l'os : il se <b>remodèle "
    "toute la vie</b> par destruction et reconstruction. L'appareil exerce une force "
    "sur la racine → propagée au ligament et à l'os → l'os se détruit en regard de la "
    "pression et se reconstruit derrière la racine. <b>D'où l'intérêt de la contention "
    "post-traitement</b> pour stabiliser le résultat.", BODY,
))

odf.append(PageBreak())

odf.append(Paragraph("Déroulement d'un traitement ODF", H2))
odf.append(acte_block(
    "Étape 1 — Dossier ODF (examen clinique + paraclinique)",
    "Récolte des données de diagnostic",
    [
        ("Examen extra-buccal", "Examen de la face · muscles faciaux au repos · muscles faciaux en fonction"),
        ("Examen intra-buccal", "Arcades · dents et parodonte · freins · OIM (Occlusion d'Intercuspidation Maximale) · hygiène"),
        ("Examen fonctions oro-faciales", "Ventilation · phonation · déglutition · mastication · succion · incompétence labiale"),
        ("Examen paraclinique", "<b>Moulages d'étude</b> (alginate, mesure dents et arcades) · <b>panoramique dentaire</b> (bilan) · <b>téléradiographie du crâne de profil + étude céphalométrique</b> (croissance faciale, mesure des dysmorphoses)"),
    ],
))

odf.append(acte_block(
    "Étape 2 — Traitement PRÉVENTIF",
    "Dépister les troubles mineurs facilement traitables chez le jeune enfant",
    [
        ("Buts", "Prévenir l'apparition des malformations OU empêcher leur aggravation"),
        ("Exemples", "Dépister les troubles d'origine fonctionnelle (succion du pouce, déglutition atypique, ventilation buccale)"),
    ],
))

odf.append(acte_block(
    "Étape 3 — Traitement INTERCEPTIF",
    "Corriger précocement une dysmorphose pour éviter le traitement actif",
    [
        ("Appareils fonctionnels / physiologiques", "<b>ELN (Enveloppe Linguale Nocturne)</b> — éducation de la position de langue la nuit"),
        ("Appareils amovibles", "<b>Plaque à vérin</b> · plaque palatine"),
        ("Appareils fixes (bibagues)", "<b>Quad-hélix</b> · disjoncteur maxillaire"),
    ],
))

odf.append(acte_block(
    "Étape 4 — Traitement ACTIF",
    "En denture permanente — déplace activement les dents",
    [
        ("Type", "Appareillages <b>multi-attaches</b> (bagues collées + arcs métalliques)"),
        ("Techniques", "<b>Edgewise</b> (technique classique) · <b>technique linguale</b> (bagues côté palatin, invisibles) · <b>Damon</b> (auto-ligaturant) · <b>aligneurs transparents</b> (Invisalign)"),
        ("Compléments extra-oraux", "Force extra-orale (FEO) · masque facial · mentonnière (selon le cas)"),
    ],
))

odf.append(acte_block(
    "Étape 5 — CONTENTION (cruciale !)",
    "Maintien du résultat après traitement actif",
    [
        ("Pourquoi", "L'os continue de se remodeler après l'arrêt du traitement — sans contention le résultat se perd"),
        ("Moyens", "Fil collé en lingual (contention fixe) · gouttière thermoformée nocturne (contention amovible)"),
    ],
))

odf.append(Spacer(1, 6))
odf.append(info_box(
    "<b>Rôle de l'AD en ODF :</b> accueillir le patient (souvent jeune) · "
    "préparer les empreintes d'étude · gérer l'agenda des RDV de pose / activation / contrôle · "
    "informer sur l'hygiène spécifique aux multi-attaches (brossette interdentaire, fil dentaire avec passe-fil, gel fluoré) · "
    "stériliser les instruments · rassurer.",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-odf.pdf", odf)


print("\nDONE -> 3 nouvelles fiches générées.")
