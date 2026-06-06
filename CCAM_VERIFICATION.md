# Audit codes CCAM — DentalPrep

Rapport généré automatiquement. Pour chaque code utilisé dans l'app :
- ✅ = vérifié
- ⚠️ = doute explicite (à vérifier en priorité)
- ❓ = format valide mais pas vérifié manuellement
- 🟦 = code NGAP (ancien système, pas CCAM 4+3)
- ❌ = format inhabituel (probablement faux)

**Comment vérifier** : va sur https://www.ameli.fr/medecin/exercice-liberal/facturation-remuneration/nomenclatures-codage/ccam et tape le code dans le moteur de recherche.

## ⚠️ À vérifier (11)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBFA011` | Gingivectomie à biseau interne sur un secteur de 7 dents ou plus (acte obsolète, plus codable) | 2x ([associations#18] Mme Sophie FONFEC / Dr SALAMI…) | À vérifier — gingivectomie d'un secteur |
| `HBFD032` | Exérèse partielle de la pulpe vivante d'une dent permanente immature pour apexogénèse | 2x ([modificateurs#6] Extraction 1ère molaire temp. sup. droite + pulpotomie 2e molaire temp. sup. droite + restauration 1 face 1ère molaire perm. sup. droite chez enfant 9 ans…) | À vérifier — pulpotomie sur dent temporaire (code probablement différent) |
| `HBGD021` | Avulsion de 3 troisièmes molaires retenues ou à l'état de germe | 2x ([procedures#4] Extraction de 14 dents temporaires (incisives, canines, 1ères et 2èmes molaires maxillaires et mandibulaires)…) | À vérifier — avulsion dent temporaire |
| `HBJD003` | Détartrage et polissage des dents sur 1 arcade (acte obsolète, plus codable) | 1x ([modificateurs#7] Évacuation d'un abcès parodontal sur la 2e molaire inférieure droite hors permanence des soins, le 25/12, après radio diagnostique) | À vérifier — évacuation abcès parodontal |
| `HBLD028` | — | 2x ([devis#2] Mme Anna KONDA / Dr BOA…) | À vérifier — utilisé dans un devis |
| `HBLD031` | Pose d'une prothèse amovible définitive complète unimaxillaire à plaque base résine | 7x ([actes_isoles#14] Pose d'une couronne implanto-portée sur la première molaire inférieure droite…) | À vérifier — pose d'une couronne dentoportée (varie selon matériau) |
| `HBLD034` | Pose d'une prothèse dentaire plurale transitoire (bridge transitoire) | 1x ([actes_isoles#16] Application de vernis fluoré sur les 2 arcades chez un enfant de 7 ans présentant un haut risque carieux) | À vérifier — vernis fluoré, peut être un autre code (HBLD ou HBPD ?) |
| `HBLD035` | Pose d'une prothèse amovible définitive complète bimaxillaire à plaque base résine | 2x ([actes_isoles#10] Adjonction de l'incisive centrale inférieure gauche sur une prothèse amovible partielle…) | À vérifier — adjonction sur prothèse amovible |
| `HBLD038` | — | 1x ([actes_isoles#15] Pose d'une gouttière mandibulaire de fluoration) | À vérifier — utilisé pour gouttière de fluoration |
| `HBLD090` | Pose d'une infrastructure coronoradiculaire (inlay-core) sous couronne ou pilier de bridge dentoportés | 8x ([cmu_css#3] Pose d'une couronne zircone sur la première prémolaire inférieure gauche (patient CSS)…) | À vérifier — pose couronne transitoire |
| `HBMD050` | Restauration d'une dent d'un secteur incisivocanin sur 2 faces (matériau phase plastique sans ancrage) | 3x ([actes_isoles#18] Restauration par inlay-onlay 2 faces en céramique sur la deuxième molaire inférieure gauche…) | DOUTEUX — j'utilise ce code pour 'inlay-onlay' et 'restauration avec ancrage radiculaire'. À vérifier |

## 🟦 NGAP (9)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `BDC` | EBD examen seul (NGAP) | 7x ([ebd#11] Lola / Dr DENT — 6 ans…) |  |
| `BDX` | EBD supplément examen complexe (NGAP) | 0x |  |
| `BR2` | EBD examen + 1 à 2 radios (NGAP) | 3x ([ebd#2] Ophélie / Dr DENT — 6 ans…) |  |
| `BR4` | EBD examen + 3 à 4 radios (NGAP) | 1x ([ebd#1] John ATEN / Dr PAUSE — 9 ans) |  |
| `BRP` | EBD examen + radio panoramique (NGAP) | 0x |  |
| `C` | Consultation | 0x |  |
| `CS` | Consultation spécialisée | 0x |  |
| `V` | Visite | 0x |  |
| `VS` | Visite spécialisée | 0x |  |

## ✅ Vérifié (16)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBBD001` | Scellement prophylactique des puits, sillons et fissures sur une dent | 6x ([procedures#9] Comblement prophylactique des sillons sur les premières molaires permanentes supérieures…) |  |
| `HBFD006` | Exérèse de la pulpe vivante d'une dent monoradiculée | 8x ([actes_isoles#21] Biopulpectomie de la première prémolaire supérieure droite…) |  |
| `HBFD019` | Coiffage pulpaire direct d'une dent | 1x ([actes_isoles#17] Coiffage pulpaire direct sur la première molaire supérieure gauche) |  |
| `HBGD002` | Avulsion d'une dent retenue ou incluse | 5x ([actes_isoles#13] Extraction de la dent de sagesse inférieure gauche retenue…) |  |
| `HBGD036` | Avulsion d'une dent permanente sur arcade | 11x ([actes_isoles#7] Extraction de l'incisive latérale inférieure gauche sans alvéolectomie…) |  |
| `HBGD037` | Avulsion d'une dent permanente avec alvéolectomie / séparation | 5x ([actes_isoles#8] Extraction de la deuxième molaire supérieure gauche avec séparation de racines…) |  |
| `HBJD001` | Détartrage et polissage des deux arcades (par séance) | 10x ([actes_isoles#3] Détartrage et polissage des dents en deux séances…) |  |
| `HBLD074` | Pose d'une infrastructure coronoradiculaire coulée (inlay-core) | 0x |  |
| `HBMD038` | Restauration d'une dent sur 1 face (sans ancrage radiculaire) | 7x ([actes_isoles#2] Obturation coronaire 1 face sur l'incisive centrale supérieure droite…) |  |
| `HBMD039` | Restauration d'une dent sur 2 faces (sans ancrage radiculaire) | 2x ([actes_isoles#9] Restauration 2 faces de la première molaire supérieure droite…) |  |
| `HBMD040` | Restauration d'une dent sur 3 faces (sans ancrage radiculaire) | 2x ([actes_isoles#22] Réparation d'une prothèse amovible mandibulaire en résine fracturée…) |  |
| `HBMD041` | Restauration d'une dent sur 4 faces ou plus (sans ancrage radiculaire) | 0x |  |
| `HBQK001` | Radiographie intra-buccale rétro-coronaire (bite-wing) | 0x |  |
| `HBQK002` | Radio rétro-alvéolaire (1 à 3 dents contiguës) | 26x ([actes_isoles#4] Radio diagnostique de la première molaire supérieure droite…) |  |
| `HBQK040` | Radio rétro-alvéolaire (4 à 6 dents) | 2x ([procedures#1] Radiographies rétro-alvéolaires des quatre premières molaires de chaque secteur…) |  |
| `LAQK002` | Radio panoramique dentomaxillaire | 2x ([actes_isoles#1] Radiographie panoramique dentomaxillaire…) |  |

## Statistiques

- Total codes utilisés : **36**
- 🟦 NGAP : 9
- ✅ Vérifié : 16
- ⚠️ À vérifier : 11
