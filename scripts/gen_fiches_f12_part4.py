"""Fiche compléments (13e) du Fascicule 12 :
CFAO / Empreinte optique · DMSM / traçabilité · Chir épulis-kystes ·
Hygiène prothétique · Rôle de l'AD en prothèse.
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
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
            f"<font color='#5B6B82'><b>{indications}</b></font>", BODY))
        elements.append(Spacer(1, 3))
    rows = [[
        Paragraph("<b>Item</b>", ParagraphStyle("th", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
        Paragraph("<b>Détail</b>", ParagraphStyle("th2", fontName="Helvetica-Bold",
                  fontSize=9, textColor=colors.white, leading=11)),
    ]]
    for etape, mat in etapes_materiel:
        rows.append([Paragraph(etape, BODY), Paragraph(mat, BODY)])
    tbl = Table(rows, colWidths=[55 * mm, 115 * mm])
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
# FICHE 13 — COMPLÉMENTS
# =========================================================
c = []
c.append(header_block(
    "Compléments fascicule 12",
    "CFAO · DMSM / traçabilité · Chir épulis-grenouillettes-kystes · Hygiène prothèse · Rôle AD",
))
c.append(Spacer(1, 8))

# ---- CFAO / Empreinte optique ----
c.append(Paragraph("1 · CFAO (Conception et Fabrication Assistées par Ordinateur)", H2))
c.append(info_box(
    "<b>Principe :</b> empreinte <b>optique</b> en bouche (caméra intra-buccale) "
    "→ transmise au laboratoire via internet → conception virtuelle de la prothèse "
    "→ usinage dans un bloc de céramique ou composite (par addition ou soustraction).",
))
c.append(acte_block(
    "Les 3 méthodes",
    "Selon qui conçoit et usine la prothèse",
    [
        ("Méthode indirecte", "Empreinte optique en bouche → labo conçoit virtuellement → usine dans son bloc"),
        ("Méthode directe", "Empreinte optique + conception + usinage <b>au cabinet</b> par le praticien"),
        ("Autre", "Empreinte classique (PE + matériau) → modèle scanné → transmis au labo"),
    ],
))
c.append(acte_block(
    "Avantages / Inconvénients de l'empreinte optique",
    "À connaître pour le concours",
    [
        ("Avantages", "<b>Gain de temps</b> (~2 min) · <b>précision</b> (erreurs visibles direct) · <b>stabilité</b> (pas de déformation) · pas d'étapes chronophages (transport, coulée, cire) · <b>confort patient</b> (pas de réflexes nauséeux)"),
        ("Inconvénients", "Pas assez précis pour les bridges complets · ouverture buccale suffisante nécessaire · postérieurs difficiles · <b>coût élevé</b>"),
        ("Apports cliniques", "Orientation du modèle · ligne de finition très précise · zoom · double empreinte possible (sang dans le sulcus) · 3D · occlusion dynamique · empreinte couleur (intérêt en implanto)"),
    ],
))
c.append(acte_block(
    "Prise d'empreinte optique — protocole",
    "4 étapes",
    [
        ("1/ Préparation", "Isolation du site de la salive · séchage important"),
        ("2/ Coating", "Poudrage qui crée une microtexture pour éviter le rayonnement (pas nécessaire avec toutes les caméras)"),
        ("3/ Empreinte", "Caméra manipulée comme un stylo ou à pleine main · vue par vue ou linéaire · enregistre préparation + antagoniste + occlusion (4-10 min)"),
        ("4/ Transfert au labo", "Via internet"),
    ],
))
c.append(acte_block(
    "Usinage de la prothèse",
    "2 modes possibles",
    [
        ("Par addition", "Méthode de superposition · polymérisation des résines · fusion au laser"),
        ("Par soustraction", "Par fraisage (le plus courant — bloc céramique/composite)"),
    ],
))

c.append(PageBreak())

# ---- DMSM / Traçabilité ----
c.append(Paragraph("2 · Traçabilité des DMSM (Dispositifs Médicaux Sur Mesure)", H2))
c.append(info_box(
    "<b>Définition :</b> tout DMSM (couronne, bridge, prothèse amovible, gouttière…) "
    "doit être <b>tracé</b>. Le praticien établit une <b>fiche navette</b> qui suit "
    "le travail entre le cabinet et le laboratoire.",
    bg=colors.HexColor("#FFF7E6"), border=C_AMBER,
))
c.append(acte_block(
    "Fiche navette (à remplir par le praticien)",
    "À connaître par cœur — souvent au concours",
    [
        ("Identification praticien", "Cachet et signature du praticien · n° du praticien"),
        ("Identification patient", "<b>Identification CODÉE</b> du patient (anonymat — sexe, âge, visage)"),
        ("Identification laboratoire", "Cachet et signature du laboratoire · n° du labo"),
        ("Date de prescription", "Date d'émission de la fiche"),
        ("Nature et description du DMSM", "Type : fixe · amovible · provisoire · orthodontique · implanto-portée · autre · schéma dentaire"),
        ("Dates intermédiaires", "Dates des étapes intermédiaires de réalisation"),
        ("Date de finition et livraison", "Date de fin de réhabilitation"),
        ("Date de pose du DMSM", "Pose en bouche par le praticien"),
    ],
))
c.append(acte_block(
    "Fiche de traçabilité (établie par le prothésiste — accompagne le retour)",
    "À garder 5 ans dans le dossier du patient + un exemplaire au patient",
    [
        ("N° de lot", "Du matériau utilisé"),
        ("Origine", "Du produit"),
        ("Descriptif", "Du matériau (céramique, métal, résine…)"),
        ("Normes ISO", "Du produit"),
        ("N° CE", "Marquage CE"),
    ],
))
c.append(info_box(
    "<b>Déclaration de conformité</b> (établie aussi par le prothésiste) doit comprendre : "
    "nom et adresse du fabricant · données identifiant le dispositif · usage exclusif d'un "
    "patient déterminé · nom du professionnel de santé prescripteur · caractéristiques "
    "spécifiques · déclaration de conformité aux articles R5211-621 à R5211-23 du Code de la Santé Publique.",
))

c.append(PageBreak())

# ---- Chir épulis ----
c.append(Paragraph("3 · Chirurgie des épulis, grenouillettes et kystes", H2))
c.append(acte_block(
    "3 lésions à connaître",
    "Lésions bénignes des tissus mous",
    [
        ("Épulis", "Tumeur bénigne de la gencive (hyperplasique, granulomateuse ou fibreuse). Souvent post-irritation locale (tartre, prothèse mal adaptée, hormones grossesse)"),
        ("Grenouillette", "Kyste du plancher buccal (canal de Wharton de la glande sub-mandibulaire) — aspect bleuté translucide"),
        ("Kyste", "Cavité pathologique remplie de liquide ou de matière semi-solide (kyste apical, kyste folliculaire, kyste résiduel…)"),
    ],
))
c.append(acte_block(
    "Plateau chir épulis / grenouillette / kyste",
    "Protocole proche d'une chirurgie d'avulsion avec lambeau",
    [
        ("Anesthésie", "Plateau anesthésie locale"),
        ("Incision", "Bistouri + lame"),
        ("Décollement", "Décolleurs · précelles à lambeau"),
        ("Énucléation", "Curette de Lucas · pince Allis (préhension de la lésion) · ciseaux"),
        ("Si kyste osseux", "Fraise Zekrya + CA bague rouge (ostéotomie d'accès)"),
        ("Examen anatomopathologique", "Pot avec formol — la pièce est envoyée pour examen histologique <b>systématiquement</b>"),
        ("Hémostase", "Compresse · éponge hémostatique · sutures"),
        ("Sutures", "Porte-aiguille · fil + aiguille · ciseaux"),
    ],
))

c.append(Paragraph("4 · Hygiène prothétique — conseils au patient", H2))
c.append(acte_block(
    "Prothèse FIXE (couronnes, bridges, inlay-onlay)",
    "Hygiène quotidienne adaptée",
    [
        ("Brossage", "2-3 fois par jour avec brosse souple"),
        ("Inter-dentaire", "Fil dentaire ou brossettes inter-dentaires (taille adaptée)"),
        ("Bridges et inters", "<b>Indispensable</b> : passe-fil pour glisser sous les inters · brossettes pour piliers"),
        ("Hydropulseur", "Recommandé en complément (sous les inters, autour des piliers)"),
        ("Visites", "Contrôle 1-2x par an"),
    ],
))
c.append(acte_block(
    "Prothèse AMOVIBLE (PPA, PAC/PAT)",
    "Hygiène spécifique : prothèse + bouche",
    [
        ("Après chaque repas", "Retirer la prothèse · brosser avec brosse à prothèse + savon doux (<b>PAS de dentifrice abrasif</b>) · rincer"),
        ("Quotidiennement", "Trempage dans solution antiseptique nettoyante (1x/jour)"),
        ("Nuit", "<b>Retirer la prothèse la nuit</b> — repos des muqueuses · conservation dans un récipient avec eau"),
        ("Bouche", "Brosser la langue et les gencives · masser les zones d'appui · si dents restantes : brossage classique"),
        ("Alimentation", "Commencer mou, progresser · couper en petits morceaux"),
        ("Contrôles", "Tous les 6-12 mois (réajustement, rebasage, vérification occlusion)"),
    ],
))

c.append(PageBreak())

c.append(Paragraph("5 · Rôle de l'AD en prothèse — synthèse", H2))
c.append(acte_block(
    "Rôle général (cf. début du fascicule)",
    "À toutes les étapes",
    [
        ("Installation", "Installer le patient (position adaptée à l'acte)"),
        ("Présentation matériel", "Présenter au praticien matériel et matériaux selon la séquence opératoire"),
        ("Isolation salivaire", "Assurer l'isolation (dépend du type de prothèse et de l'étape)"),
        ("Aide opératoire", "Écarter lèvres, langue, joues"),
        ("Fin de séance", "Débarrasser le fauteuil (patient propre, sans pâte à empreinte sur le visage !)"),
        ("Sortie", "Raccompagner le patient"),
    ],
))
c.append(acte_block(
    "Étapes SPÉCIFIQUES à la prothèse",
    "À retenir pour le concours",
    [
        ("Empreintes", "<b>Rinçage, désinfection et conditionnement</b> des empreintes avant envoi au labo"),
        ("Fiche navette", "<b>Élaboration de la fiche navette</b> du laboratoire (cf. partie DMSM)"),
        ("Liaison labo", "Liaison avec le laboratoire (transmission, suivi, questions techniques)"),
        ("Livraison DMSM", "S'assurer de la livraison des DMSM avant la séance de pose"),
        ("Planification", "Planification des RDV (séances multiples souvent : empreintes, essayages, pose, équilibration)"),
    ],
))

c.append(Spacer(1, 6))
c.append(info_box(
    "<b>À retenir absolument :</b> fiche navette = identification praticien + patient codé + "
    "labo + dates · fiche traçabilité = n° lot, origine, descriptif, normes ISO, n° CE · "
    "<b>conservation 5 ans</b> + 1 exemplaire au patient · pièce chir = formol + envoi anapath.",
    bg=colors.HexColor("#E6FFFA"), border=C_GREEN,
))

build("fascicule-12-complements.pdf", c)


print("\nDONE -> fiche compléments générée.")
