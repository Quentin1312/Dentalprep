"""Génère les fiches PDF du Fascicule 12 - Travail au fauteuil.
Sortie : public/fiches/fascicule-12-*.pdf
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether,
)

sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = os.path.join(
    os.path.dirname(__file__), "..", "public", "fiches"
)
OUT_DIR = os.path.abspath(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

# Palette alignée avec l'app
C_PRIMARY = colors.HexColor("#0A66E0")
C_PRIMARY_SOFT = colors.HexColor("#E6F0FF")
C_TEXT = colors.HexColor("#0F1B2D")
C_MUTED = colors.HexColor("#5B6B82")
C_BORDER = colors.HexColor("#D6DEEC")
C_BG_ROW = colors.HexColor("#FBFCFE")
C_GREEN = colors.HexColor("#0D9488")
C_AMBER = colors.HexColor("#D97706")

styles = getSampleStyleSheet()

H1 = ParagraphStyle(
    "H1", parent=styles["Heading1"],
    fontName="Helvetica-Bold", fontSize=22, leading=26,
    textColor=C_TEXT, spaceAfter=4,
)
SUB = ParagraphStyle(
    "SUB", parent=styles["Normal"],
    fontName="Helvetica", fontSize=10, leading=13,
    textColor=C_MUTED, spaceAfter=14,
)
H2 = ParagraphStyle(
    "H2", parent=styles["Heading2"],
    fontName="Helvetica-Bold", fontSize=13, leading=16,
    textColor=C_PRIMARY, spaceBefore=14, spaceAfter=6,
)
H3 = ParagraphStyle(
    "H3", parent=styles["Heading3"],
    fontName="Helvetica-Bold", fontSize=11, leading=14,
    textColor=C_TEXT, spaceBefore=8, spaceAfter=4,
)
BODY = ParagraphStyle(
    "BODY", parent=styles["Normal"],
    fontName="Helvetica", fontSize=9.5, leading=13,
    textColor=C_TEXT,
)
BULLET = ParagraphStyle(
    "BULLET", parent=BODY,
    leftIndent=12, bulletIndent=2, spaceAfter=2,
)
TAG = ParagraphStyle(
    "TAG", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=8, leading=10,
    textColor=C_PRIMARY, spaceAfter=2,
    textTransform=None,
)
FOOTER = ParagraphStyle(
    "FOOTER", parent=styles["Normal"],
    fontName="Helvetica", fontSize=7.5, leading=9,
    textColor=C_MUTED, alignment=TA_CENTER,
)


def header_block(title, sub):
    """Bloc titre coloré en haut de page."""
    t = Table(
        [[Paragraph(f"<b>{title}</b>", H1)],
         [Paragraph(sub, SUB)]],
        colWidths=[170 * mm],
    )
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (-1, -1), C_PRIMARY_SOFT),
        ("ROUNDEDCORNERS", [10, 10, 10, 10]),
        ("LINEBELOW", (0, -1), (-1, -1), 1.2, C_PRIMARY),
    ]))
    return t


def tag(text, bg=C_PRIMARY, fg=colors.white):
    """Petite étiquette colorée inline."""
    t = Table([[Paragraph(f"<b>{text}</b>", ParagraphStyle(
        "tagP", fontName="Helvetica-Bold", fontSize=7.5, textColor=fg, leading=9,
    ))]], colWidths=[30 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


def acte_block(nom, indications, etapes_materiel):
    """Bloc structuré pour un acte : nom, indications, tableau étapes/matériel."""
    elements = []
    # Titre acte
    elements.append(Paragraph(f"<b>{nom}</b>", H3))
    if indications:
        elements.append(Paragraph(
            f"<font color='#5B6B82'><b>Indications :</b> {indications}</font>",
            BODY,
        ))
        elements.append(Spacer(1, 3))

    # Tableau étapes / matériel
    rows = [[
        Paragraph("<b>Étape</b>", ParagraphStyle("th", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
        Paragraph("<b>Matériel</b>", ParagraphStyle("th2", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
    ]]
    for etape, mat in etapes_materiel:
        rows.append([
            Paragraph(etape, BODY),
            Paragraph(mat, BODY),
        ])
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
    """Encart d'information (rappel, astuce…)."""
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
    """Footer avec numéro de page."""
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(C_MUTED)
    canvas.drawCentredString(
        A4[0] / 2, 12 * mm,
        f"DentalPrep · Fascicule 12 - Travail au fauteuil · {doc.page}",
    )
    canvas.restoreState()


def build(filename, elements):
    path = os.path.join(OUT_DIR, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=15 * mm, bottomMargin=18 * mm,
        title="DentalPrep - " + filename.replace(".pdf", ""),
        author="DentalPrep",
    )
    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    print(f"OK -> {path}")


# =========================================================
# FICHE 1 — MÉMO RÉCAP "Tous les plateaux"
# =========================================================
memo = []
memo.append(header_block(
    "Mémo plateaux — Travail au fauteuil",
    "Fiche récap rapide · tous les plateaux du fascicule 12 en un coup d'œil",
))
memo.append(Spacer(1, 8))

memo.append(info_box(
    "<b>Rôle clé de l'AD :</b> assurer l'isolation salivaire "
    "(asepsie, visibilité, protection des matériaux, confort patient). "
    "Cumul fréquent <b>aspiration + isolation</b>.",
))
memo.append(Spacer(1, 8))

memo.append(Paragraph("Isolation salivaire", H2))
memo.append(acte_block(
    "Plateau isolation",
    "Tout acte conservateur, endodontique, prothétique",
    [
        ("Par aspiration", "Pompe à salive · grosse aspiration (canules usage unique ou stérilisables) · aspiration chirurgicale"),
        ("Par isolation", "Rouleaux de coton · écrans salivaires · <b>digue</b> (la plus efficace)"),
        ("Pose de la digue", "Feuille de digue · pince d'Ainsworth (perforation) · clamps/crampons · pince de Brewer · cadre de Young"),
    ],
))

memo.append(Paragraph("PID — Porte-Instruments Dynamiques", H2))
memo.append(acte_block(
    "Vitesses & instruments",
    "À connaître par cœur : bagues, vitesses, usages",
    [
        ("Turbine", "350 000 à 450 000 tr/min · fraises diamantées ou carbure de Tungstène · mandrin court et lisse"),
        ("Contre-angle bague verte", "8 000 tr/min · démultiplicateur"),
        ("Contre-angle bague bleue", "40 000 tr/min · instruments endo · mandrin court ou long"),
        ("Contre-angle bague rouge (CAR)", "200 000 tr/min · mandrin avec gorge et méplat · CA surmultiplié"),
        ("Pièce à main (PAM)", "Petite vitesse · fraises résine/risque/meulette · mandrin long gros, lisse, rond"),
    ],
))

memo.append(Paragraph("Fraises — codes couleur granulométrie", H2))
memo.append(info_box(
    "<b>Diamantées :</b> noir (extra-gros 151-213) · vert (gros 107-181) · "
    "bleu/blanc (standard 66-126) · <b>rouge (fine 27-76)</b> · jaune (extra-fine 10-36) · "
    "blanc (ultra-fine 4-14). Norme ISO de 494 à 544.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))

memo.append(PageBreak())

memo.append(Paragraph("Plateaux OCR (Odontologie conservatrice restauratrice)", H2))
memo.append(acte_block(
    "Soin de carie standard",
    "Toute lésion carieuse à restaurer",
    [
        ("Anesthésie (si besoin)", "Porte-carpule (avec/sans aspiration) · carpule tiédie + embout désinfecté · aiguille · anesthésique de contact"),
        ("Éviction tissu carieux", "Turbine + fraise diamantée (émail) · CA bague bleue + fraise carbure de Tungstène (dentine) · excavateur"),
        ("Fond de cavité", "CVI · eugénate · vernis · biomatériau · hydroxyde de calcium"),
        ("Obturation provisoire", "Ciment prêt à l'emploi ou eugénate (Cavit, Eugénate…)"),
        ("Obturation définitive", "Amalgame (capsule pré-dosée) OU composite + adhésif + lampe à photopolymériser"),
        ("Aides à l'obturation", "Matrice + porte-matrice · coin de bois inter-dentaire"),
        ("Ancrages", "Tenons dentinaires (dent vivante) · tenons radiculaires (dent dépulpée)"),
    ],
))

memo.append(Paragraph("Plateaux Prévention", H2))
memo.append(acte_block(
    "Fluoration (remboursée < 9 ans à risque)",
    "Renforcement de l'émail par fluor topique",
    [
        ("Nettoyage de l'arcade", "Contre-angle · brossettes"),
        ("Séchage", "Souffleur d'air · rouleaux de coton"),
        ("Application solution fluorée", "Solution fluorée (Duraphat…) · pinceau ou tip"),
    ],
))
memo.append(acte_block(
    "Scellement des puits et fissures (remboursé < 16 ans, 1res et 2es molaires)",
    "Comblement des anfractuosités pour réduire la rétention de plaque",
    [
        ("Nettoyage", "Contre-angle · brossettes"),
        ("Mordançage", "Acide orthophosphorique"),
        ("Scellement", "Résine de scellement · lampe à photopolymériser"),
    ],
))

memo.append(PageBreak())

memo.append(Paragraph("Plateaux Chirurgie", H2))
memo.append(acte_block(
    "Avulsion simple",
    "Dent mobile, cassée, de lait, dent de sagesse sur arcade, dent saine pour ODF",
    [
        ("Anesthésie", "Plateau anesthésie (cf. OCR)"),
        ("Syndesmotomie", "Syndesmotome"),
        ("Luxation", "Élévateur (droits = maxillaire / coudés = mandibule)"),
        ("Avulsion", "Davier adapté à la dent"),
        ("Nettoyage alvéole", "Curette de Lucas ou de Hemingway"),
        ("Hémostase", "Compresse · éponge hémostatique · fils de suture si besoin"),
    ],
))
memo.append(acte_block(
    "Extraction avec alvéolectomie",
    "Dent fracturée, racines résiduelles, dent incluse, accès difficile",
    [
        ("Lambeau", "Bistouri · décolleurs · précelles à lambeau"),
        ("Ablation table osseuse", "Fraise Zekrya + contre-angle bague rouge"),
        ("Mobilisation", "Élévateur fin"),
        ("Avulsion", "Davier racine ou élévateur (mouvements de bascule)"),
        ("Sutures", "Porte-aiguille · fils + aiguille · ciseaux"),
    ],
))

memo.append(Spacer(1, 6))
memo.append(info_box(
    "<b>À retenir :</b> tout plateau chirurgical commence par <b>anesthésie</b> "
    "et se termine par <b>hémostase + conseils post-op</b>. "
    "Toujours préparer compresses et aspiration chirurgicale.",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-memo-plateaux.pdf", memo)


# =========================================================
# FICHE 2 — OCR détaillé
# =========================================================
ocr = []
ocr.append(header_block(
    "Plateaux OCR — Odontologie conservatrice",
    "Fascicule 12 · OCR : restauration des tissus minéralisés (émail, dentine, pulpe)",
))
ocr.append(Spacer(1, 8))

ocr.append(info_box(
    "<b>Définitions clés.</b> <b>OC</b> = science de l'émail, dentine, pulpe. "
    "<b>OCR</b> = restauration des tissus minéralisés et lésés. "
    "<b>OCE</b> (endodontie) = traitement des pulpopathies.",
))
ocr.append(Spacer(1, 6))

ocr.append(Paragraph("Schéma général du soin de carie", H2))
ocr.append(Paragraph(
    "<b>1.</b> Anesthésie (si nécessaire) → <b>2.</b> Éviction du tissu carieux "
    "(émail non soutenu, puis dentine ramollie) → <b>3.</b> Fond de cavité (si besoin) "
    "→ <b>4.</b> Obturation (provisoire ou définitive).",
    BODY,
))

ocr.append(Paragraph("1 · Anesthésie", H2))
ocr.append(acte_block(
    "Plateau anesthésie",
    "Soins sur dentine, pulpe ou tissus innervés (l'émail ne nécessite pas d'anesthésie)",
    [
        ("Préparation", "Anesthésique de contact (gel) sur muqueuse séchée"),
        ("Injection", "Porte-carpule (avec aspiration / sans aspiration / tronculaire ouvert) · carpule tiédie, embout désinfecté · aiguille (taille adaptée au type d'anesthésie)"),
        ("Composition carpule", "Anesthésique + vasoconstricteur (sauf contre-indication)"),
    ],
))

ocr.append(Paragraph("2 · Éviction du tissu carieux", H2))
ocr.append(acte_block(
    "Élimination des pans d'émail non soutenus",
    "L'émail est le tissu le plus dur — seules les fraises diamantées en éliminent",
    [
        ("Instrument rotatif", "<b>Turbine</b> ou <b>CA bague rouge (CAR)</b>"),
        ("Fraise", "Fraise <b>diamantée</b> (vitesse de rotation suffisante)"),
    ],
))
ocr.append(acte_block(
    "Élimination de la dentine ramollie",
    "La dentine est plus 'tendre' que l'émail",
    [
        ("Approche mécanique", "CA bague bleue + fraise carbure de Tungstène (effet coupant, façon ciseau à bois)"),
        ("Approche manuelle", "Excavateur (copeaux de dentine)"),
        ("Atout combiné", "Permet au praticien de ressentir l'atteinte de la dentine saine"),
    ],
))

ocr.append(Paragraph("PID — vitesses et instruments", H2))
ocr.append(acte_block(
    "Récap PID",
    "À mémoriser : code couleur + vitesse + instruments compatibles",
    [
        ("Turbine", "350 000 - 450 000 tr/min · fraises diamantées ou carbure Tungstène · mandrin court et lisse"),
        ("CA bague verte", "8 000 tr/min (démultiplicateur)"),
        ("CA bague bleue", "40 000 tr/min · fraises acier/carbure Tungstène · instruments endo · mandrin court/long"),
        ("CA bague rouge", "200 000 tr/min · mandrin avec gorge et méplat · CA surmultiplié"),
        ("PAM", "Petite vitesse · fraises résine/risque/meulette · mandrin long gros, lisse, rond"),
    ],
))

ocr.append(PageBreak())

ocr.append(Paragraph("3 · Fonds de cavité", H2))
ocr.append(info_box(
    "<b>Buts :</b> isoler/protéger la dentine et la pulpe des agressions, "
    "favoriser la dentine tertiaire réactionnelle, assurer l'étanchéité "
    "à l'interface dentine-obturation.",
))
ocr.append(acte_block(
    "Matériaux disponibles",
    "Choix selon coiffage pulpaire direct ou indirect",
    [
        ("Coiffage indirect (carie juxta-pulpaire)", "CVI · eugénate · vernis · biomatériau · hydroxyde de calcium"),
        ("Coiffage direct (effraction pulpaire)", "Biomatériau biocompatible · hydroxyde de calcium"),
    ],
))

ocr.append(Paragraph("4 · Obturation", H2))
ocr.append(acte_block(
    "Obturation provisoire",
    "Quand le traitement n'est pas fini en une séance — assure herméticité, étanchéité, maintien d'un pansement",
    [
        ("Matériaux", "Ciments prêts à l'emploi · oxyde de zinc eugénol · Cavit · eugénate"),
    ],
))
ocr.append(acte_block(
    "Obturation définitive — amalgame",
    "Obturations métalliques en capsules pré-dosées (alliage argent/cuivre/étain/zinc + mercure)",
    [
        ("Mise en œuvre", "Capsule pré-dosée · vibreur (rompt la membrane interne) · porte-amalgame"),
        ("Mise en forme", "Fouloirs · brunissoirs"),
        ("Polissage", "Fraises diamantées grains fins · cupules à polir"),
    ],
))
ocr.append(acte_block(
    "Obturation définitive — composite",
    "Obturations esthétiques (résine photopolymérisable)",
    [
        ("Préparation", "Mordançage acide orthophosphorique · rinçage · séchage"),
        ("Collage", "Adhésif amélo-dentinaire · lampe à photopolymériser"),
        ("Obturation", "Composite (apport par couches) · spatule à composite · lampe à polymériser"),
        ("Finition", "Fraises diamantées grains fins · disques · cupules à polir"),
    ],
))
ocr.append(acte_block(
    "Aides à l'obturation",
    "Cavité composée (plusieurs faces atteintes) → besoin d'une matrice",
    [
        ("Matrice", "Matrice métallique ou transparente"),
        ("Maintien", "Porte-matrice"),
        ("Coin", "Coin de bois ou plastique inter-dentaire (sépare et plaque la matrice)"),
    ],
))
ocr.append(acte_block(
    "Systèmes d'ancrage",
    "Pour les dents très délabrées — fixent le matériau d'obturation",
    [
        ("Tenons dentinaires", "S'ancrent dans la dentine · dent peut rester <b>vivante</b>"),
        ("Tenons radiculaires", "S'ancrent dans la racine · dent obligatoirement <b>dépulpée</b>"),
    ],
))

ocr.append(Paragraph("5 · Inlay-onlay (alternative prothétique)", H2))
ocr.append(acte_block(
    "Restauration indirecte par pièce prothétique",
    "Cavités étendues — empreinte puis collage en 2e séance",
    [
        ("1re séance · préparation", "Plateau éviction (cf. plus haut)"),
        ("1re séance · empreinte", "Porte-empreinte · matériau type élastomère <b>OU</b> caméra optique numérique"),
        ("1re séance · obturation provisoire", "Cavit, eugénate…"),
        ("2e séance · scellement", "Ciment de scellement OU composite de collage"),
        ("2e séance · réglage", "Papier à articuler · pince de Miller · fraises diamantées grains fins · cupules à polir"),
    ],
))

build("fascicule-12-ocr.pdf", ocr)


# =========================================================
# FICHE 3 — Chirurgie détaillée
# =========================================================
chi = []
chi.append(header_block(
    "Plateaux Chirurgie",
    "Fascicule 12 · Actes chirurgicaux au cabinet dentaire",
))
chi.append(Spacer(1, 8))

chi.append(info_box(
    "<b>Préalables chirurgicaux :</b> lavage des mains (3 types — simple, "
    "hygiénique, chirurgical), tenue et protection, préparation de la salle, "
    "connaissance des risques, matériel stérile.",
))
chi.append(Spacer(1, 6))

chi.append(Paragraph("1 · Avulsion simple", H2))
chi.append(acte_block(
    "Plateau avulsion simple",
    "Dent mobile · dent cassée · dent de lait · dent de sagesse sur arcade · dent saine pour ODF",
    [
        ("Anesthésie", "Porte-carpule · carpule · aiguille · anesthésique de contact"),
        ("Syndesmotomie", "<b>Syndesmotome</b> · désinsertion de la gencive et partie haute du ligament"),
        ("Luxation", "<b>Élévateur</b> · mobilisation de la dent (droits = maxillaire / coudés = mandibule)"),
        ("Avulsion", "<b>Davier</b> adapté à la dent · extraction hors de son alvéole"),
        ("Nettoyage cavité", "<b>Curette de Lucas</b> ou <b>de Hemingway</b> · élimine tissu de granulation, fait saigner pour caillot"),
        ("Hémostase", "Compresse · éponge hémostatique · sutures si risque"),
    ],
))

chi.append(Paragraph("2 · Avulsion d'une dent pluriradiculée", H2))
chi.append(acte_block(
    "Séparation des racines avant avulsion",
    "Quand la pluriradiculée résiste à l'avulsion en monobloc",
    [
        ("Séparation", "Fraise Zekrya + contre-angle bague rouge"),
        ("Avulsion racine par racine", "Élévateur fin · davier racine"),
        ("Suite", "Comme avulsion simple : nettoyage + hémostase"),
    ],
))

chi.append(Paragraph("3 · Extraction avec alvéolectomie", H2))
chi.append(acte_block(
    "Plateau alvéolectomie",
    "Dent fracturée · racines résiduelles · accès difficile",
    [
        ("Anesthésie", "Plateau anesthésie"),
        ("Lambeau · incision", "<b>Bistouri</b>"),
        ("Lambeau · soulèvement", "<b>Décolleurs</b>"),
        ("Lambeau · tenue", "<b>Précelles à lambeau</b>"),
        ("Ablation table osseuse", "<b>Fraise Zekrya + CA bague rouge</b>"),
        ("Mobilisation", "Élévateur fin"),
        ("Avulsion", "Davier racine OU élévateur (mouvements de bascule)"),
        ("Sutures", "Porte-aiguille · fil + aiguille · ciseaux"),
    ],
))

chi.append(PageBreak())

chi.append(Paragraph("4 · Amputation corono-radiculaire", H2))
chi.append(acte_block(
    "Conservation d'une partie de la dent",
    "Sur pluriradiculée : on retire une racine en gardant les autres",
    [
        ("Anesthésie", "Plateau anesthésie"),
        ("Section", "Fraise Zekrya + CA bague rouge"),
        ("Avulsion de la racine ciblée", "Élévateur · davier"),
        ("Suites", "Sutures · ordonnance"),
    ],
))

chi.append(Paragraph("5 · Avulsion des dents incluses / enclavées / retenues / à l'état de germe", H2))
chi.append(acte_block(
    "Définitions",
    "Connaître la nuance entre incluse, enclavée, retenue, germe",
    [
        ("Incluse", "Dent dans l'os, recouverte d'os et de muqueuse"),
        ("Enclavée", "Émergence partielle bloquée par la dent voisine"),
        ("Retenue", "Éruption retardée par rapport à la norme"),
        ("Germe", "Dent non encore formée"),
    ],
))
chi.append(acte_block(
    "Plateau avulsion dent incluse",
    "Plus complexe — souvent dent de sagesse",
    [
        ("Anesthésie", "Plateau anesthésie"),
        ("Lambeau", "Bistouri · décolleurs · précelles à lambeau"),
        ("Ostéotomie", "Fraise Zekrya + CA bague rouge"),
        ("Section coronaire si besoin", "Fraise Zekrya"),
        ("Avulsion", "Élévateur · davier"),
        ("Sutures", "Porte-aiguille · fil + aiguille · ciseaux"),
    ],
))

chi.append(Paragraph("6 · Résection apicale", H2))
chi.append(acte_block(
    "Section de l'apex d'une dent dépulpée",
    "Échec du traitement endo · kyste apical · racine fracturée",
    [
        ("Anesthésie", "Plateau anesthésie"),
        ("Lambeau", "Bistouri · décolleurs · précelles à lambeau"),
        ("Ostéotomie", "Fraise Zekrya + CA bague rouge"),
        ("Résection", "Fraise Zekrya (section apex)"),
        ("Curetage", "Curette de Lucas"),
        ("Sutures", "Porte-aiguille · fil · ciseaux"),
    ],
))

chi.append(Paragraph("7 · Freinectomie", H2))
chi.append(acte_block(
    "Section du frein lingual ou labial",
    "Frein trop court, gênant l'élocution, l'allaitement ou la denture",
    [
        ("Anesthésie", "Plateau anesthésie locale"),
        ("Section", "Bistouri · ciseaux chirurgicaux"),
        ("Sutures", "Porte-aiguille · fil résorbable · ciseaux"),
    ],
))

chi.append(Paragraph("Rôle de l'AD en chirurgie", H2))
chi.append(info_box(
    "Préparer le plateau stérile, assurer l'aspiration chirurgicale, "
    "passer les instruments dans l'ordre du protocole, anticiper les besoins du praticien, "
    "rassurer le patient, gérer les compresses, préparer les sutures, "
    "donner les conseils post-opératoires (alimentation tiède, pas de bain de bouche J0, "
    "antalgique sur ordonnance, contrôle des saignements).",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-chirurgie.pdf", chi)


print("\nDONE -> 3 fichiers générés.")
