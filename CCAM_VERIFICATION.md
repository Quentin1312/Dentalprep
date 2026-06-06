# Audit codes CCAM — DentalPrep

Rapport généré automatiquement. Pour chaque code utilisé dans l'app :
- ✅ = vérifié
- ⚠️ = doute explicite (à vérifier en priorité)
- ❓ = format valide mais pas vérifié manuellement
- 🟦 = code NGAP (ancien système, pas CCAM 4+3)
- ❌ = format inhabituel (probablement faux)

**Comment vérifier** : va sur https://www.ameli.fr/medecin/exercice-liberal/facturation-remuneration/nomenclatures-codage/ccam et tape le code dans le moteur de recherche.

## ⚠️ À vérifier (7)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBFD032` | Exérèse partielle de la pulpe vivante d'une dent permanente immature pour apexogénèse | 2x ([modificateurs#6] Extraction 1ère molaire temp. sup. droite + pulpotomie 2e molaire temp. sup. droite + restauration 1 face 1ère molaire perm. sup. droite chez enfant 9 ans…) | À vérifier — pulpotomie sur dent temporaire (code probablement différent) |
| `HBGD021` | Avulsion de 3 troisièmes molaires retenues ou à l'état de germe | 1x ([modificateurs#6] Extraction 1ère molaire temp. sup. droite + pulpotomie 2e molaire temp. sup. droite + restauration 1 face 1ère molaire perm. sup. droite chez enfant 9 ans) | À vérifier — avulsion dent temporaire |
| `HBLD031` | Pose d'une prothèse amovible définitive complète unimaxillaire à plaque base résine | 0x | À vérifier — pose d'une couronne dentoportée (varie selon matériau) |
| `HBLD035` | Pose d'une prothèse amovible définitive complète bimaxillaire à plaque base résine | 0x | À vérifier — adjonction sur prothèse amovible |
| `HBLD038` | Pose d'une couronne dentaire dentoportée en alliage non précieux | 0x | À vérifier — utilisé pour gouttière de fluoration |
| `HBLD090` | Pose d'une infrastructure coronoradiculaire [Inlay core] sous une couronne ou un pilier de bridge dentoportés sans reste à charge | 0x | À vérifier — pose couronne transitoire |
| `HBMD050` | Restauration d’une dent d’un secteur incisivocanin sur 2 faces par matériau inséré en phase plastique sans ancrage radiculaire | 5x ([modificateurs#1] Restauration de l'angle mésial des incisives centrales supérieures (droite et gauche) chez un enfant de 11 ans…) | DOUTEUX — j'utilise ce code pour 'inlay-onlay' et 'restauration avec ancrage radiculaire'. À vérifier |

## ❓ Format CCAM valide — non vérifié manuellement (61)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBBD004` | Comblement [Scellement] prophylactique des puits, sillons et fissures sur 4 dents | 0x |  |
| `HBBD005` | Comblement [Scellement] prophylactique des puits, sillons et fissures sur 1 dent | 6x ([procedures#9] Comblement prophylactique des sillons sur les premières molaires permanentes supérieures…) |  |
| `HBBD006` | Comblement [Scellement] prophylactique des puits, sillons et fissures sur 2 dents | 0x |  |
| `HBBD007` | Comblement [Scellement] prophylactique des puits, sillons et fissures sur 3 dents | 0x |  |
| `HBFA006` | Gingivectomie sur un secteur de 1 à 3 dents | 2x ([associations#18] Mme Sophie FONFEC / Dr SALAMI…) |  |
| `HBFA007` | Gingivectomie sur un secteur de 4 à 6 dents | 0x |  |
| `HBFA008` | Gingivectomie  sur un secteur de 7 dents ou plus | 0x |  |
| `HBFD008` | Exérèse de la pulpe vivante d’une molaire permanente | 5x ([actes_isoles#17] Coiffage pulpaire direct sur la première molaire supérieure gauche…) |  |
| `HBFD017` | Exérèse de la pulpe vivante d’une incisive ou d’une canine temporaire | 0x |  |
| `HBFD021` | Exérèse de la pulpe vivante d’une première prémolaire maxillaire | 1x ([actes_isoles#21] Biopulpectomie de la première prémolaire supérieure droite) |  |
| `HBFD033` | Exérèse de la pulpe vivante d’une incisive ou d’une canine permanente | 3x ([gestes_compl#1] Biopulpectomie de la canine supérieure gauche avec radios pré et post-opératoires…) |  |
| `HBFD035` | Exérèse de la pulpe vivante d’une prémolaire autre que la première prémolaire maxillaire | 0x |  |
| `HBGD004` | Avulsion d'1 troisième molaire mandibulaire retenue ou à l'état de germe | 4x ([actes_isoles#13] Extraction de la dent de sagesse inférieure gauche retenue…) |  |
| `HBGD014` | Avulsion d'1 canine permanente retenue ou à l'état de germe | 0x |  |
| `HBGD018` | Avulsion d'1 troisième molaire maxillaire retenue ou à l'état de germe | 0x |  |
| `HBGD022` | Avulsion d'1 dent permanente sur arcade avec alvéolectomie | 5x ([actes_isoles#11] Extraction de la deuxième prémolaire inférieure droite avec alvéolectomie…) |  |
| `HBGD028` | Avulsion d'1 incisive permanente retenue ou à l'état de germe | 0x |  |
| `HBGD035` | Avulsion d'1 dent temporaire sur arcade | 1x ([procedures#4] Extraction de 14 dents temporaires (incisives, canines, 1ères et 2èmes molaires maxillaires et mandibulaires)) |  |
| `HBGD042` | Avulsion d’1 dent temporaire retenue, incluse ou réincluse | 0x |  |
| `HBGD047` | Avulsion d'1 première ou d'1 deuxième molaire permanente retenue ou à l'état de germe | 0x |  |
| `HBGD459` | Avulsion d'1 prémolaire retenue ou à l'état de germe | 0x |  |
| `HBJA003` | Assainissement parodontal [détartrage-surfaçage radiculaire] [DSR] sur 1 sextant | 0x |  |
| `HBJA171` | Assainissement parodontal [détartrage-surfaçage radiculaire] [DSR] sur 2 sextants | 0x |  |
| `HBJB001` | Évacuation d'abcès parodontal | 1x ([modificateurs#7] Évacuation d'un abcès parodontal sur la 2e molaire inférieure droite hors permanence des soins, le 25/12, après radio diagnostique) |  |
| `HBLD004` | Application topique intrabuccale de fluorures | 0x |  |
| `HBLD033` | Pose d'une prothèse plurale [bridge] comportant 2 piliers d'ancrage métalliques et 1 élément intermédiaire métallique | 0x |  |
| `HBLD045` | Application de vernis fluoré sur les deux arcades dentaires | 2x ([actes_isoles#16] Application de vernis fluoré sur les 2 arcades chez un enfant de 7 ans présentant un haut risque carieux…) |  |
| `HBLD073` | Pose d'une couronne dentaire dentoportée céramique-monolithique zircone sur une molaire | 0x |  |
| `HBLD158` | Pose d'une couronne dentaire dentoportée céramique monolithique  autre que zircone sur une deuxième prémolaire ou une molaire | 0x |  |
| `HBLD227` | Pose d'une prothèse plurale [bridge] comportant 2 piliers d'ancrage céramométalliques et 1 élément intermédiaire céramométallique pour le remplacement d'une dent autre qu'une incisive | 0x |  |
| `HBLD318` | Pose d'une couronne dentaire dentoportée en alliage précieux 
Avec ou sans recouvrement céramique | 0x |  |
| `HBLD350` | Pose d'une couronne dentaire dentoportée céramique-monolithique zircone sur une dent autre qu’une molaire | 1x ([cmu_css#3] Pose d'une couronne zircone sur la première prémolaire inférieure gauche (patient CSS)) |  |
| `HBLD403` | Pose d'une couronne dentaire dentoportée céramocéramique | 0x |  |
| `HBLD418` | Pose d'une couronne dentaire implantoportée | 1x ([actes_isoles#14] Pose d'une couronne implanto-portée sur la première molaire inférieure droite) |  |
| `HBLD486` | Pose d'une couronne dentaire transitoire pour une couronne dentoportée à tarif libre | 8x ([cmu_css#2] Pose d'une couronne céramo-métal sur la première molaire supérieure gauche (patient CSS)…) |  |
| `HBLD490` | Pose d'une couronne dentaire transitoire pour couronne dentoportée sans reste à charge | 0x |  |
| `HBLD491` | Pose d'une couronne dentaire dentoportée céramométallique sur une deuxième prémolaire | 0x |  |
| `HBLD610` | Pose d'une couronne dentaire transitoire unitaire sur implant ou sur pilier de bridge dento-porté ou implantoporté | 0x |  |
| `HBLD634` | Pose d'une couronne dentaire dentoportée céramométallique sur une incisive, une canine ou une première prémolaire | 4x ([devis#2] Mme Anna KONDA / Dr BOA…) |  |
| `HBLD680` | Pose d'une couronne dentaire dentoportée céramique monolithique autre que zircone sur une incisive, une canine ou une première prémolaire | 0x |  |
| `HBLD734` | Pose d'une couronne dentaire dentoportée céramométallique sur une molaire | 1x ([cmu_css#2] Pose d'une couronne céramo-métal sur la première molaire supérieure gauche (patient CSS)) |  |
| `HBMD017` | Adjonction ou changement d'1 élément d'une prothèse dentaire amovible | 2x ([actes_isoles#10] Adjonction de l'incisive centrale inférieure gauche sur une prothèse amovible partielle…) |  |
| `HBMD020` | Réparation d'une prothèse dentaire amovible en résine sans renfort métallique, fêlée ou fracturée | 0x |  |
| `HBMD042` | Restauration d'une dent par matériau inséré en phase plastique avec ancrage radiculaire | 1x ([actes_isoles#20] Restauration de la première molaire supérieure droite avec ancrage radiculaire) |  |
| `HBMD044` | Restauration d'une dent d’un secteur incisivocanin sur 1 angle par matériau inséré en phase plastique, sans ancrage radiculaire | 0x |  |
| `HBMD047` | Restauration d'une dent d’un secteur incisivocanin sur 2 angles par matériau inséré en phase plastique, sans ancrage radiculaire | 0x |  |
| `HBMD049` | Restauration d’une dent d’un secteur prémolomolaire sur 2 faces par matériau inséré en phase plastique sans ancrage radiculaire | 4x ([actes_isoles#9] Restauration 2 faces de la première molaire supérieure droite…) |  |
| `HBMD053` | Restauration d’une dent d’un secteur prémolomolaire sur 1 face par matériau inséré en phase plastique, sans ancrage radiculaire | 1x ([modificateurs#6] Extraction 1ère molaire temp. sup. droite + pulpotomie 2e molaire temp. sup. droite + restauration 1 face 1ère molaire perm. sup. droite chez enfant 9 ans) |  |
| `HBMD054` | Restauration d’une dent d’un secteur incisivocanin sur 3 faces ou plus par matériau inséré en phase plastique sans ancrage radiculaire | 0x |  |
| `HBMD058` | Restauration d’une dent d’un secteur incisivocanin sur 1 face par matériau inséré en phase plastique, sans ancrage radiculaire | 1x ([actes_isoles#2] Obturation coronaire 1 face sur l'incisive centrale supérieure droite) |  |
| `HBMD322` | Adjonction ou changement de 3 éléments d'une prothèse dentaire amovible | 0x |  |
| `HBMD351` | Restauration d’une dent sur 2 faces ou plus par matériau incrusté [inlay-onlay] composite ou en alliage non précieux | 1x ([actes_isoles#19] Restauration par inlay-onlay 2 faces en métal sur la première molaire inférieure droite) |  |
| `HBMD356` | Réparation d'une prothèse dentaire amovible en résine avec renfort métallique, fêlée ou fracturée | 0x |  |
| `HBMD460` | Restauration d’une dent sur 2 faces ou plus par matériau incrusté [inlay-onlay] céramique ou en alliage précieux | 1x ([actes_isoles#18] Restauration par inlay-onlay 2 faces en céramique sur la deuxième molaire inférieure gauche) |  |
| `HBQK191` | Radiographies intrabuccales rétroalvéolaires et/ou rétrocoronaires de 2 secteurs distincts de 1 à 3 dents contigües | 0x |  |
| `HBQK331` | Radiographies intrabuccales rétroalvéolaires et/ou rétrocoronaires de 3 secteurs distincts de 1 à 3 dents contigües | 0x |  |
| `HBQK389` | Radiographie intrabuccale rétroalvéolaire et/ou rétrocoronaire d'un secteur de 1 à 3 dents contigües | 26x ([actes_isoles#4] Radio diagnostique de la première molaire supérieure droite…) |  |
| `HBQK428` | Radiographies intrabuccales rétroalvéolaires et/ou rétrocoronaires de 5 secteurs distincts de 1 à 3 dents contigües | 0x |  |
| `HBQK443` | Radiographies intrabuccales rétroalvéolaires et/ou rétrocoronaires de 4 secteurs distincts de 1 à 3 dents contigües | 2x ([procedures#1] Radiographies rétro-alvéolaires des quatre premières molaires de chaque secteur…) |  |
| `HBQK480` | Radiographies intrabuccales rétroalvéolaires et/ou rétrocoronaires de 6 secteurs distincts de 1 à 3 dents contigües | 0x |  |
| `LAQK027` | Radiographie volumique par faisceau conique [cone beam computerized tomography, CBCT] du maxillaire, de la mandibule et/ou d’arcade dentaire | 0x |  |

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

## ✅ Vérifié (7)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBFD006` | Exérèse de la pulpe camérale [Biopulpotomie] d'une dent temporaire | 0x |  |
| `HBFD019` | Exérèse de la pulpe vivante d’une molaire temporaire | 0x |  |
| `HBGD036` | Avulsion d'1 dent permanente sur arcade sans alvéolectomie | 12x ([actes_isoles#7] Extraction de l'incisive latérale inférieure gauche sans alvéolectomie…) |  |
| `HBJD001` | Détartrage et polissage des dents | 10x ([actes_isoles#3] Détartrage et polissage des dents en deux séances…) |  |
| `HBMD038` | Restauration d’une dent d’un secteur prémolomolaire sur 3 faces ou plus par matériau inséré en phase plastique sans ancrage radiculaire | 0x |  |
| `HBQK001` | Radiographie pelvibuccale [occlusale] | 0x |  |
| `HBQK002` | Radiographie panoramique dentomaxillaire | 2x ([actes_isoles#1] Radiographie panoramique dentomaxillaire…) |  |

## Statistiques

- Total codes utilisés : **84**
- 🟦 NGAP : 9
- ❓ Format CCAM valide — non vérifié manuellement : 61
- ✅ Vérifié : 7
- ⚠️ À vérifier : 7
