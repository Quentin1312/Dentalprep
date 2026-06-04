# Audit codes CCAM — DentalPrep

Rapport généré automatiquement. Pour chaque code utilisé dans l'app :
- ✅ = vérifié
- ⚠️ = doute explicite (à vérifier en priorité)
- ❓ = format valide mais pas vérifié manuellement
- 🟦 = code NGAP (ancien système, pas CCAM 4+3)
- ❌ = format inhabituel (probablement faux)

**Comment vérifier** : va sur https://www.ameli.fr/medecin/exercice-liberal/facturation-remuneration/nomenclatures-codage/ccam et tape le code dans le moteur de recherche.

## ⚠️ À vérifier (17)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBBD002` | Scellement prophylactique des sillons (par dent) | 6x ([procedures#3] Comblement des sillons des quatre premières molaires permanentes…) | À vérifier — possible variante de HBBD001 (scellement sillons) |
| `HBFA011` | Gingivectomie d'un secteur (1 à 3 dents) | 2x ([associations#18] Mme Sophie FONFEC / Dr SALAMI…) | À vérifier — gingivectomie |
| `HBFD021` | Coiffage pulpaire direct | 1x ([actes_isoles#17] Coiffage pulpaire direct sur la première molaire supérieure gauche) | À vérifier — coiffage pulpaire direct |
| `HBFD031` | Pulpectomie / exérèse contenu canalaire monoradiculée | 8x ([actes_isoles#21] Biopulpectomie de la première prémolaire supérieure droite…) | À vérifier — pulpectomie / exérèse contenu canalaire 1 canal |
| `HBFD032` | Pulpotomie sur dent temporaire | 2x ([modificateurs#3] Biopulpectomie 1ère molaire perm. sup. droite + pulpotomie 2e molaire temp. sup. droite chez un enfant de 10 ans…) | À vérifier — pulpotomie sur dent temporaire |
| `HBGD019` | Avulsion d'une dent retenue (sagesse incluse) | 5x ([actes_isoles#13] Extraction de la dent de sagesse inférieure gauche retenue…) | À vérifier — avulsion dent retenue / sagesse |
| `HBGD021` | Avulsion d'une dent temporaire | 2x ([procedures#4] Extraction de 14 dents temporaires (incisives, canines, 1ères et 2èmes molaires maxillaires et mandibulaires)…) | À vérifier — avulsion dent temporaire |
| `HBJD003` | Évacuation d'un abcès parodontal | 1x ([modificateurs#7] Évacuation d'un abcès parodontal sur la 2e molaire inférieure droite hors permanence des soins, le 25/12, après radio diagnostique) | À vérifier — évacuation abcès parodontal |
| `HBLD031` | Pose d'une couronne (céramométal / implanto-portée) | 7x ([actes_isoles#14] Pose d'une couronne implanto-portée sur la première molaire inférieure droite…) | À vérifier — pose d'une couronne (les libellés CCAM distinguent céramo-métal / zircone / métal — peut-être codes différents) |
| `HBLD034` | Application topique de fluorures (vernis fluoré) | 1x ([actes_isoles#16] Application de vernis fluoré sur les 2 arcades chez un enfant de 7 ans présentant un haut risque carieux) | À vérifier — vernis fluoré, peut être un autre code (HBLD ou HBPD ?) |
| `HBLD035` | Adjonction sur prothèse amovible (dent ou crochet) | 2x ([actes_isoles#10] Adjonction de l'incisive centrale inférieure gauche sur une prothèse amovible partielle…) | À vérifier — adjonction sur prothèse amovible (peut-être HBLD via HBPD ?) |
| `HBLD036` | Pose d'un inlay-core | 4x ([cmu_css#1] Pose d'une couronne céramo-métal sur l'incisive supérieure latérale droite (patient CSS)…) | À vérifier — pose inlay-core |
| `HBLD080` | Réparation d'une prothèse amovible en résine fracturée | 0x | À vérifier — réparation prothèse amovible résine |
| `HBLD090` | Pose d'une couronne transitoire | 4x ([cmu_css#1] Pose d'une couronne céramo-métal sur l'incisive supérieure latérale droite (patient CSS)…) | À vérifier — pose couronne transitoire |
| `HBMD050` | Restauration avec ancrage radiculaire / inlay-onlay | 3x ([actes_isoles#18] Restauration par inlay-onlay 2 faces en céramique sur la deuxième molaire inférieure gauche…) | DOUTEUX — j'utilise ce code pour 'inlay-onlay' et 'restauration avec ancrage radiculaire'. À vérifier, possibles HBMD074, HBLD073 selon matériau |
| `HBQK001` | Radio rétro-coronaire (bite-wing) | 0x | À vérifier — j'avais marqué 'bite-wing' mais le code exact peut différer |
| `HBQK010` | Examen bucco-dentaire de prévention (EBD) | 11x ([ebd#11] Lola / Dr DENT — 6 ans…) | À vérifier — code pour EBD (examen bucco-dentaire de prévention) |

## ❓ Format CCAM valide — non vérifié manuellement (2)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBLD028` | — | 2x ([devis#2] Mme Anna KONDA / Dr BOA…) |  |
| `HBLD038` | — | 1x ([actes_isoles#15] Pose d'une gouttière mandibulaire de fluoration) |  |

## 🟦 NGAP (9)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `BDC` | EBD examen seul (NGAP) | 0x |  |
| `BDX` | EBD supplément examen complexe (NGAP) | 0x |  |
| `BR2` | EBD examen + 1 à 2 radios (NGAP) | 0x |  |
| `BR4` | EBD examen + 3 à 4 radios (NGAP) | 0x |  |
| `BRP` | EBD examen + radio panoramique (NGAP) | 0x |  |
| `C` | Consultation | 0x |  |
| `CS` | Consultation spécialisée | 0x |  |
| `V` | Visite | 0x |  |
| `VS` | Visite spécialisée | 0x |  |

## ✅ Vérifié (10)

| Code | Libellé stocké | Usage | Note |
|------|----------------|-------|------|
| `HBGD036` | Avulsion d'une dent permanente sur arcade | 11x ([actes_isoles#7] Extraction de l'incisive latérale inférieure gauche sans alvéolectomie…) |  |
| `HBGD037` | Avulsion d'une dent permanente avec alvéolectomie / séparation | 5x ([actes_isoles#8] Extraction de la deuxième molaire supérieure gauche avec séparation de racines…) |  |
| `HBJD001` | Détartrage et polissage des deux arcades (par séance) | 10x ([actes_isoles#3] Détartrage et polissage des dents en deux séances…) |  |
| `HBMD038` | Restauration d'une dent sur 1 face (sans ancrage radiculaire) | 7x ([actes_isoles#2] Obturation coronaire 1 face sur l'incisive centrale supérieure droite…) |  |
| `HBMD039` | Restauration d'une dent sur 2 faces (sans ancrage radiculaire) | 2x ([actes_isoles#9] Restauration 2 faces de la première molaire supérieure droite…) |  |
| `HBMD040` | Restauration d'une dent sur 3 faces (sans ancrage radiculaire) | 2x ([actes_isoles#22] Réparation d'une prothèse amovible mandibulaire en résine fracturée…) |  |
| `HBMD041` | Restauration d'une dent sur 4 faces ou plus (sans ancrage radiculaire) | 0x |  |
| `HBQK002` | Radio rétro-alvéolaire (1 à 3 dents contiguës) | 26x ([actes_isoles#4] Radio diagnostique de la première molaire supérieure droite…) |  |
| `HBQK040` | Radio rétro-alvéolaire (4 à 6 dents) | 2x ([procedures#1] Radiographies rétro-alvéolaires des quatre premières molaires de chaque secteur…) |  |
| `LAQK002` | Radio panoramique dentomaxillaire | 2x ([actes_isoles#1] Radiographie panoramique dentomaxillaire…) |  |

## Statistiques

- Total codes utilisés : **38**
- 🟦 NGAP : 9
- ⚠️ À vérifier : 17
- ✅ Vérifié : 10
- ❓ Format CCAM valide — non vérifié manuellement : 2
