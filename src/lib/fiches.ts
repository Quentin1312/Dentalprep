// Fiches de révision PDF téléchargeables, mappées par numéro de fascicule.
// Les PDFs sont stockés dans `public/fiches/`.
//
// Pour ajouter une fiche : déposer le PDF dans public/fiches/ puis ajouter
// une entrée ci-dessous. La feature dans /library détecte automatiquement
// les fascicules qui ont des fiches.

export type Fiche = {
  /** Titre court affiché dans la liste. */
  title: string
  /** Sous-titre (ex. "Mémo récap" ou nom de la section). */
  subtitle?: string
  /** Chemin relatif depuis /public — sera servi en statique par Next. */
  file: string
  /** Tag couleur optionnel : 'memo' (récap), 'detail' (fiche détaillée). */
  kind?: 'memo' | 'detail'
}

export const FICHES_BY_FASCICULE: Record<number, Fiche[]> = {
  12: [
    {
      title: 'Mémo plateaux',
      subtitle: 'Tous les plateaux du fascicule en récap',
      file: '/fiches/fascicule-12-memo-plateaux.pdf',
      kind: 'memo',
    },
    {
      title: 'Plateaux OCR',
      subtitle: 'Odontologie conservatrice restauratrice',
      file: '/fiches/fascicule-12-ocr.pdf',
      kind: 'detail',
    },
    {
      title: 'OCE — Endodontie',
      subtitle: 'Pulpotomie, biopulpectomie, traitement canalaire, retraitement',
      file: '/fiches/fascicule-12-oce-endodontie.pdf',
      kind: 'detail',
    },
    {
      title: 'Préalables chirurgicaux',
      subtitle: 'Lavage des mains (3 types), tenue, salle, matériel commun',
      file: '/fiches/fascicule-12-prealables-chirurgicaux.pdf',
      kind: 'detail',
    },
    {
      title: 'Plateaux Chirurgie',
      subtitle: 'Avulsions, alvéolectomie, résection apicale, freinectomie',
      file: '/fiches/fascicule-12-chirurgie.pdf',
      kind: 'detail',
    },
    {
      title: 'Pédodontie',
      subtitle: 'Psychologie, accueil, apexogénèse, apexification',
      file: '/fiches/fascicule-12-pedodontie.pdf',
      kind: 'detail',
    },
    {
      title: 'Implantologie',
      subtitle: 'Acte chirurgical + acte prothétique (transfert, empreinte)',
      file: '/fiches/fascicule-12-implantologie.pdf',
      kind: 'detail',
    },
    {
      title: 'Parodontologie',
      subtitle: 'Examen, curetage/surfaçage, chirurgie d’assainissement',
      file: '/fiches/fascicule-12-parodontologie.pdf',
      kind: 'detail',
    },
    {
      title: 'Traumatologie',
      subtitle: 'Fractures, intrusion, expulsion, conseils TEA',
      file: '/fiches/fascicule-12-traumatologie.pdf',
      kind: 'detail',
    },
    {
      title: 'Prothèse conjointe',
      subtitle: 'Inlay-onlay, facettes, couronnes, bridges',
      file: '/fiches/fascicule-12-prothese-conjointe.pdf',
      kind: 'detail',
    },
    {
      title: 'Prothèse adjointe',
      subtitle: 'PPA, PAC/PAT, étapes fauteuil/laboratoire',
      file: '/fiches/fascicule-12-prothese-adjointe.pdf',
      kind: 'detail',
    },
    {
      title: 'Orthopédie Dento-Faciale (ODF)',
      subtitle: 'Classes d’Angle, traitements préventif/interceptif/actif, contention',
      file: '/fiches/fascicule-12-odf.pdf',
      kind: 'detail',
    },
    {
      title: 'Compléments',
      subtitle: 'CFAO, DMSM/traçabilité, épulis-kystes, hygiène prothèse, rôle AD',
      file: '/fiches/fascicule-12-complements.pdf',
      kind: 'detail',
    },
  ],
}

export function fichesForFascicule(n: number): Fiche[] {
  return FICHES_BY_FASCICULE[n] ?? []
}
