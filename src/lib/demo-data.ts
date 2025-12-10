import { Armoire, Document, Dossier, Classeur, Rayon, DocumentType } from '@/types';

// Helper pour générer des IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper pour créer un document
const createDocument = (
  name: string, 
  extension: string, 
  size: number,
  tags: string[] = []
): Document => ({
  id: generateId(),
  name,
  type: getDocumentType(extension),
  extension,
  size,
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  modifiedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  author: ['Jean Dupont', 'Marie Martin', 'Pierre Durand', 'Sophie Lefebvre'][Math.floor(Math.random() * 4)],
  tags,
  path: `/volume1/GED/${name}.${extension}`,
});

const getDocumentType = (extension: string): DocumentType => {
  const types: Record<string, DocumentType> = {
    'pdf': 'pdf',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'doc': 'word',
    'docx': 'word',
    'xls': 'excel',
    'xlsx': 'excel',
    'txt': 'text',
    'zip': 'archive',
    'rar': 'archive',
  };
  return types[extension.toLowerCase()] || 'other';
};

// Données de démonstration inspirées de Novaxel
export const demoData: Armoire[] = [
  {
    id: 'armoire-1',
    name: 'Assurances',
    icon: 'shield',
    color: '#3b82f6',
    createdAt: new Date('2020-01-15'),
    modifiedAt: new Date('2024-06-20'),
    rayons: [
      {
        id: 'rayon-1-1',
        name: 'Habitation',
        parentId: 'armoire-1',
        createdAt: new Date('2020-01-15'),
        modifiedAt: new Date('2024-03-10'),
        classeurs: [
          {
            id: 'classeur-1-1-1',
            name: 'Contrat principal',
            parentId: 'rayon-1-1',
            createdAt: new Date('2020-01-15'),
            modifiedAt: new Date('2024-01-05'),
            dossiers: [
              {
                id: 'dossier-1',
                name: '2024',
                parentId: 'classeur-1-1-1',
                createdAt: new Date('2024-01-01'),
                modifiedAt: new Date('2024-06-15'),
                documents: [
                  createDocument('Contrat_habitation_2024', 'pdf', 245000, ['contrat', 'assurance']),
                  createDocument('Attestation_assurance', 'pdf', 125000, ['attestation']),
                  createDocument('Echéancier_2024', 'xlsx', 45000, ['finance']),
                ],
              },
              {
                id: 'dossier-2',
                name: '2023',
                parentId: 'classeur-1-1-1',
                createdAt: new Date('2023-01-01'),
                modifiedAt: new Date('2023-12-31'),
                documents: [
                  createDocument('Contrat_habitation_2023', 'pdf', 240000, ['contrat', 'assurance']),
                  createDocument('Quittance_annuelle_2023', 'pdf', 85000, ['quittance']),
                ],
              },
            ],
          },
          {
            id: 'classeur-1-1-2',
            name: 'Sinistres',
            parentId: 'rayon-1-1',
            createdAt: new Date('2021-06-10'),
            modifiedAt: new Date('2024-02-20'),
            dossiers: [
              {
                id: 'dossier-3',
                name: 'Dégât des eaux 2023',
                parentId: 'classeur-1-1-2',
                createdAt: new Date('2023-11-15'),
                modifiedAt: new Date('2024-02-20'),
                documents: [
                  createDocument('Declaration_sinistre', 'pdf', 350000, ['sinistre']),
                  createDocument('Photos_degats', 'jpg', 2500000, ['photo', 'sinistre']),
                  createDocument('Devis_reparation', 'pdf', 180000, ['devis']),
                  createDocument('Rapport_expert', 'pdf', 520000, ['expert']),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'rayon-1-2',
        name: 'Auto',
        parentId: 'armoire-1',
        createdAt: new Date('2020-03-20'),
        modifiedAt: new Date('2024-05-15'),
        classeurs: [
          {
            id: 'classeur-1-2-1',
            name: 'Véhicule principal',
            parentId: 'rayon-1-2',
            createdAt: new Date('2020-03-20'),
            modifiedAt: new Date('2024-05-15'),
            dossiers: [
              {
                id: 'dossier-4',
                name: 'Contrats',
                parentId: 'classeur-1-2-1',
                createdAt: new Date('2020-03-20'),
                modifiedAt: new Date('2024-05-15'),
                documents: [
                  createDocument('Contrat_auto_2024', 'pdf', 320000, ['contrat', 'auto']),
                  createDocument('Carte_verte', 'pdf', 95000, ['carte verte']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-2',
    name: 'Banques',
    icon: 'landmark',
    color: '#10b981',
    createdAt: new Date('2019-06-01'),
    modifiedAt: new Date('2024-06-25'),
    rayons: [
      {
        id: 'rayon-2-1',
        name: 'Compte courant',
        parentId: 'armoire-2',
        createdAt: new Date('2019-06-01'),
        modifiedAt: new Date('2024-06-25'),
        classeurs: [
          {
            id: 'classeur-2-1-1',
            name: 'Relevés',
            parentId: 'rayon-2-1',
            createdAt: new Date('2019-06-01'),
            modifiedAt: new Date('2024-06-25'),
            dossiers: [
              {
                id: 'dossier-5',
                name: '2024',
                parentId: 'classeur-2-1-1',
                createdAt: new Date('2024-01-01'),
                modifiedAt: new Date('2024-06-25'),
                documents: [
                  createDocument('Releve_janvier_2024', 'pdf', 125000, ['relevé', 'banque']),
                  createDocument('Releve_fevrier_2024', 'pdf', 128000, ['relevé', 'banque']),
                  createDocument('Releve_mars_2024', 'pdf', 132000, ['relevé', 'banque']),
                  createDocument('Releve_avril_2024', 'pdf', 118000, ['relevé', 'banque']),
                  createDocument('Releve_mai_2024', 'pdf', 145000, ['relevé', 'banque']),
                  createDocument('Releve_juin_2024', 'pdf', 138000, ['relevé', 'banque']),
                ],
              },
              {
                id: 'dossier-6',
                name: '2023',
                parentId: 'classeur-2-1-1',
                createdAt: new Date('2023-01-01'),
                modifiedAt: new Date('2023-12-31'),
                documents: [
                  createDocument('Releves_annuels_2023', 'pdf', 1850000, ['relevé', 'banque', 'annuel']),
                ],
              },
            ],
          },
          {
            id: 'classeur-2-1-2',
            name: 'Contrat',
            parentId: 'rayon-2-1',
            createdAt: new Date('2019-06-01'),
            modifiedAt: new Date('2022-09-15'),
            dossiers: [
              {
                id: 'dossier-7',
                name: 'Convention de compte',
                parentId: 'classeur-2-1-2',
                createdAt: new Date('2019-06-01'),
                modifiedAt: new Date('2022-09-15'),
                documents: [
                  createDocument('Convention_compte', 'pdf', 450000, ['contrat', 'banque']),
                  createDocument('Conditions_generales', 'pdf', 820000, ['conditions']),
                  createDocument('RIB', 'pdf', 45000, ['rib']),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'rayon-2-2',
        name: 'Épargne',
        parentId: 'armoire-2',
        createdAt: new Date('2020-01-15'),
        modifiedAt: new Date('2024-04-10'),
        classeurs: [
          {
            id: 'classeur-2-2-1',
            name: 'Livret A',
            parentId: 'rayon-2-2',
            createdAt: new Date('2020-01-15'),
            modifiedAt: new Date('2024-04-10'),
            dossiers: [
              {
                id: 'dossier-8',
                name: 'Relevés',
                parentId: 'classeur-2-2-1',
                createdAt: new Date('2020-01-15'),
                modifiedAt: new Date('2024-04-10'),
                documents: [
                  createDocument('Releve_LivretA_2024_T1', 'pdf', 85000, ['épargne', 'livret']),
                ],
              },
            ],
          },
          {
            id: 'classeur-2-2-2',
            name: 'PEL',
            parentId: 'rayon-2-2',
            createdAt: new Date('2018-03-20'),
            modifiedAt: new Date('2024-01-15'),
            dossiers: [
              {
                id: 'dossier-9',
                name: 'Contrat',
                parentId: 'classeur-2-2-2',
                createdAt: new Date('2018-03-20'),
                modifiedAt: new Date('2018-03-20'),
                documents: [
                  createDocument('Contrat_PEL', 'pdf', 380000, ['contrat', 'épargne', 'pel']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-3',
    name: 'Employeurs',
    icon: 'briefcase',
    color: '#8b5cf6',
    createdAt: new Date('2018-09-01'),
    modifiedAt: new Date('2024-06-30'),
    rayons: [
      {
        id: 'rayon-3-1',
        name: 'Entreprise actuelle',
        parentId: 'armoire-3',
        createdAt: new Date('2022-01-15'),
        modifiedAt: new Date('2024-06-30'),
        classeurs: [
          {
            id: 'classeur-3-1-1',
            name: 'Contrat de travail',
            parentId: 'rayon-3-1',
            createdAt: new Date('2022-01-15'),
            modifiedAt: new Date('2022-01-15'),
            dossiers: [
              {
                id: 'dossier-10',
                name: 'Documents',
                parentId: 'classeur-3-1-1',
                createdAt: new Date('2022-01-15'),
                modifiedAt: new Date('2022-01-15'),
                documents: [
                  createDocument('Contrat_travail_CDI', 'pdf', 285000, ['contrat', 'travail']),
                  createDocument('Avenant_teletravail', 'pdf', 125000, ['avenant', 'télétravail']),
                ],
              },
            ],
          },
          {
            id: 'classeur-3-1-2',
            name: 'Bulletins de paie',
            parentId: 'rayon-3-1',
            createdAt: new Date('2022-01-31'),
            modifiedAt: new Date('2024-06-30'),
            dossiers: [
              {
                id: 'dossier-11',
                name: '2024',
                parentId: 'classeur-3-1-2',
                createdAt: new Date('2024-01-31'),
                modifiedAt: new Date('2024-06-30'),
                documents: [
                  createDocument('Bulletin_paie_janvier_2024', 'pdf', 95000, ['paie', 'bulletin']),
                  createDocument('Bulletin_paie_fevrier_2024', 'pdf', 96000, ['paie', 'bulletin']),
                  createDocument('Bulletin_paie_mars_2024', 'pdf', 94000, ['paie', 'bulletin']),
                  createDocument('Bulletin_paie_avril_2024', 'pdf', 98000, ['paie', 'bulletin']),
                  createDocument('Bulletin_paie_mai_2024', 'pdf', 97000, ['paie', 'bulletin']),
                  createDocument('Bulletin_paie_juin_2024', 'pdf', 99000, ['paie', 'bulletin']),
                ],
              },
              {
                id: 'dossier-12',
                name: '2023',
                parentId: 'classeur-3-1-2',
                createdAt: new Date('2023-01-31'),
                modifiedAt: new Date('2023-12-31'),
                documents: [
                  createDocument('Bulletins_paie_2023', 'pdf', 1150000, ['paie', 'bulletin', 'annuel']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-4',
    name: 'État civil',
    icon: 'user',
    color: '#ec4899',
    createdAt: new Date('2015-01-01'),
    modifiedAt: new Date('2024-02-14'),
    rayons: [
      {
        id: 'rayon-4-1',
        name: 'Identité',
        parentId: 'armoire-4',
        createdAt: new Date('2015-01-01'),
        modifiedAt: new Date('2024-02-14'),
        classeurs: [
          {
            id: 'classeur-4-1-1',
            name: 'Pièces d\'identité',
            parentId: 'rayon-4-1',
            createdAt: new Date('2015-01-01'),
            modifiedAt: new Date('2024-02-14'),
            dossiers: [
              {
                id: 'dossier-13',
                name: 'En cours',
                parentId: 'classeur-4-1-1',
                createdAt: new Date('2019-05-20'),
                modifiedAt: new Date('2024-02-14'),
                documents: [
                  createDocument('CNI_recto', 'jpg', 850000, ['identité', 'cni']),
                  createDocument('CNI_verso', 'jpg', 780000, ['identité', 'cni']),
                  createDocument('Passeport_scan', 'pdf', 1250000, ['identité', 'passeport']),
                ],
              },
            ],
          },
          {
            id: 'classeur-4-1-2',
            name: 'Actes d\'état civil',
            parentId: 'rayon-4-1',
            createdAt: new Date('2015-01-01'),
            modifiedAt: new Date('2020-06-15'),
            dossiers: [
              {
                id: 'dossier-14',
                name: 'Actes',
                parentId: 'classeur-4-1-2',
                createdAt: new Date('2015-01-01'),
                modifiedAt: new Date('2020-06-15'),
                documents: [
                  createDocument('Acte_naissance', 'pdf', 185000, ['acte', 'naissance']),
                  createDocument('Livret_famille', 'pdf', 2450000, ['livret', 'famille']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-5',
    name: 'Factures',
    icon: 'receipt',
    color: '#f59e0b',
    createdAt: new Date('2020-01-01'),
    modifiedAt: new Date('2024-06-28'),
    rayons: [
      {
        id: 'rayon-5-1',
        name: 'Énergie',
        parentId: 'armoire-5',
        createdAt: new Date('2020-01-01'),
        modifiedAt: new Date('2024-06-28'),
        classeurs: [
          {
            id: 'classeur-5-1-1',
            name: 'Électricité',
            parentId: 'rayon-5-1',
            createdAt: new Date('2020-01-01'),
            modifiedAt: new Date('2024-06-28'),
            dossiers: [
              {
                id: 'dossier-15',
                name: '2024',
                parentId: 'classeur-5-1-1',
                createdAt: new Date('2024-01-15'),
                modifiedAt: new Date('2024-06-28'),
                documents: [
                  createDocument('Facture_EDF_janvier_2024', 'pdf', 125000, ['facture', 'énergie']),
                  createDocument('Facture_EDF_mars_2024', 'pdf', 128000, ['facture', 'énergie']),
                  createDocument('Facture_EDF_mai_2024', 'pdf', 118000, ['facture', 'énergie']),
                ],
              },
            ],
          },
          {
            id: 'classeur-5-1-2',
            name: 'Gaz',
            parentId: 'rayon-5-1',
            createdAt: new Date('2020-03-01'),
            modifiedAt: new Date('2024-05-15'),
            dossiers: [
              {
                id: 'dossier-16',
                name: '2024',
                parentId: 'classeur-5-1-2',
                createdAt: new Date('2024-02-10'),
                modifiedAt: new Date('2024-05-15'),
                documents: [
                  createDocument('Facture_Engie_fevrier_2024', 'pdf', 98000, ['facture', 'gaz']),
                  createDocument('Facture_Engie_avril_2024', 'pdf', 85000, ['facture', 'gaz']),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'rayon-5-2',
        name: 'Télécom',
        parentId: 'armoire-5',
        createdAt: new Date('2020-01-01'),
        modifiedAt: new Date('2024-06-20'),
        classeurs: [
          {
            id: 'classeur-5-2-1',
            name: 'Internet',
            parentId: 'rayon-5-2',
            createdAt: new Date('2020-01-01'),
            modifiedAt: new Date('2024-06-20'),
            dossiers: [
              {
                id: 'dossier-17',
                name: '2024',
                parentId: 'classeur-5-2-1',
                createdAt: new Date('2024-01-05'),
                modifiedAt: new Date('2024-06-20'),
                documents: [
                  createDocument('Facture_Free_janvier_2024', 'pdf', 75000, ['facture', 'internet']),
                  createDocument('Facture_Free_fevrier_2024', 'pdf', 76000, ['facture', 'internet']),
                  createDocument('Facture_Free_mars_2024', 'pdf', 74000, ['facture', 'internet']),
                ],
              },
            ],
          },
          {
            id: 'classeur-5-2-2',
            name: 'Mobile',
            parentId: 'rayon-5-2',
            createdAt: new Date('2020-01-01'),
            modifiedAt: new Date('2024-06-18'),
            dossiers: [
              {
                id: 'dossier-18',
                name: '2024',
                parentId: 'classeur-5-2-2',
                createdAt: new Date('2024-01-08'),
                modifiedAt: new Date('2024-06-18'),
                documents: [
                  createDocument('Facture_mobile_janvier_2024', 'pdf', 65000, ['facture', 'mobile']),
                  createDocument('Facture_mobile_fevrier_2024', 'pdf', 68000, ['facture', 'mobile']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-6',
    name: 'Habitation',
    icon: 'home',
    color: '#06b6d4',
    createdAt: new Date('2019-09-01'),
    modifiedAt: new Date('2024-03-15'),
    rayons: [
      {
        id: 'rayon-6-1',
        name: 'Location actuelle',
        parentId: 'armoire-6',
        createdAt: new Date('2021-07-01'),
        modifiedAt: new Date('2024-03-15'),
        classeurs: [
          {
            id: 'classeur-6-1-1',
            name: 'Bail',
            parentId: 'rayon-6-1',
            createdAt: new Date('2021-07-01'),
            modifiedAt: new Date('2021-07-01'),
            dossiers: [
              {
                id: 'dossier-19',
                name: 'Contrat',
                parentId: 'classeur-6-1-1',
                createdAt: new Date('2021-07-01'),
                modifiedAt: new Date('2021-07-01'),
                documents: [
                  createDocument('Bail_location', 'pdf', 485000, ['bail', 'location']),
                  createDocument('Etat_des_lieux_entree', 'pdf', 1850000, ['état des lieux']),
                  createDocument('Attestation_assurance_habitation', 'pdf', 125000, ['assurance']),
                ],
              },
            ],
          },
          {
            id: 'classeur-6-1-2',
            name: 'Quittances',
            parentId: 'rayon-6-1',
            createdAt: new Date('2021-08-01'),
            modifiedAt: new Date('2024-03-15'),
            dossiers: [
              {
                id: 'dossier-20',
                name: '2024',
                parentId: 'classeur-6-1-2',
                createdAt: new Date('2024-01-05'),
                modifiedAt: new Date('2024-03-15'),
                documents: [
                  createDocument('Quittance_janvier_2024', 'pdf', 85000, ['quittance', 'loyer']),
                  createDocument('Quittance_fevrier_2024', 'pdf', 85000, ['quittance', 'loyer']),
                  createDocument('Quittance_mars_2024', 'pdf', 85000, ['quittance', 'loyer']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-7',
    name: 'Impôts',
    icon: 'calculator',
    color: '#ef4444',
    createdAt: new Date('2018-01-01'),
    modifiedAt: new Date('2024-05-31'),
    rayons: [
      {
        id: 'rayon-7-1',
        name: 'Impôt sur le revenu',
        parentId: 'armoire-7',
        createdAt: new Date('2018-01-01'),
        modifiedAt: new Date('2024-05-31'),
        classeurs: [
          {
            id: 'classeur-7-1-1',
            name: 'Déclarations',
            parentId: 'rayon-7-1',
            createdAt: new Date('2018-04-01'),
            modifiedAt: new Date('2024-05-31'),
            dossiers: [
              {
                id: 'dossier-21',
                name: '2024 (revenus 2023)',
                parentId: 'classeur-7-1-1',
                createdAt: new Date('2024-04-10'),
                modifiedAt: new Date('2024-05-31'),
                documents: [
                  createDocument('Declaration_revenus_2023', 'pdf', 285000, ['impôt', 'déclaration']),
                  createDocument('Avis_imposition_2024', 'pdf', 165000, ['impôt', 'avis']),
                ],
              },
              {
                id: 'dossier-22',
                name: '2023 (revenus 2022)',
                parentId: 'classeur-7-1-1',
                createdAt: new Date('2023-04-12'),
                modifiedAt: new Date('2023-08-15'),
                documents: [
                  createDocument('Declaration_revenus_2022', 'pdf', 275000, ['impôt', 'déclaration']),
                  createDocument('Avis_imposition_2023', 'pdf', 158000, ['impôt', 'avis']),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'rayon-7-2',
        name: 'Taxe foncière',
        parentId: 'armoire-7',
        createdAt: new Date('2019-10-01'),
        modifiedAt: new Date('2023-10-15'),
        classeurs: [
          {
            id: 'classeur-7-2-1',
            name: 'Avis',
            parentId: 'rayon-7-2',
            createdAt: new Date('2019-10-01'),
            modifiedAt: new Date('2023-10-15'),
            dossiers: [
              {
                id: 'dossier-23',
                name: 'Historique',
                parentId: 'classeur-7-2-1',
                createdAt: new Date('2019-10-01'),
                modifiedAt: new Date('2023-10-15'),
                documents: [
                  createDocument('Taxe_fonciere_2023', 'pdf', 145000, ['taxe', 'foncière']),
                  createDocument('Taxe_fonciere_2022', 'pdf', 142000, ['taxe', 'foncière']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'armoire-8',
    name: 'Santé',
    icon: 'heart-pulse',
    color: '#22c55e',
    createdAt: new Date('2017-01-01'),
    modifiedAt: new Date('2024-06-10'),
    rayons: [
      {
        id: 'rayon-8-1',
        name: 'Mutuelle',
        parentId: 'armoire-8',
        createdAt: new Date('2017-01-01'),
        modifiedAt: new Date('2024-02-28'),
        classeurs: [
          {
            id: 'classeur-8-1-1',
            name: 'Contrat',
            parentId: 'rayon-8-1',
            createdAt: new Date('2022-01-01'),
            modifiedAt: new Date('2024-01-15'),
            dossiers: [
              {
                id: 'dossier-24',
                name: 'Documents',
                parentId: 'classeur-8-1-1',
                createdAt: new Date('2022-01-01'),
                modifiedAt: new Date('2024-01-15'),
                documents: [
                  createDocument('Contrat_mutuelle', 'pdf', 385000, ['mutuelle', 'contrat']),
                  createDocument('Carte_mutuelle', 'pdf', 95000, ['mutuelle', 'carte']),
                  createDocument('Tableau_garanties', 'pdf', 245000, ['mutuelle', 'garanties']),
                ],
              },
            ],
          },
          {
            id: 'classeur-8-1-2',
            name: 'Remboursements',
            parentId: 'rayon-8-1',
            createdAt: new Date('2022-02-01'),
            modifiedAt: new Date('2024-02-28'),
            dossiers: [
              {
                id: 'dossier-25',
                name: '2024',
                parentId: 'classeur-8-1-2',
                createdAt: new Date('2024-01-20'),
                modifiedAt: new Date('2024-02-28'),
                documents: [
                  createDocument('Releve_prestations_janvier_2024', 'pdf', 125000, ['remboursement']),
                  createDocument('Releve_prestations_fevrier_2024', 'pdf', 118000, ['remboursement']),
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'rayon-8-2',
        name: 'Médecins',
        parentId: 'armoire-8',
        createdAt: new Date('2017-01-01'),
        modifiedAt: new Date('2024-06-10'),
        classeurs: [
          {
            id: 'classeur-8-2-1',
            name: 'Consultations',
            parentId: 'rayon-8-2',
            createdAt: new Date('2020-01-01'),
            modifiedAt: new Date('2024-06-10'),
            dossiers: [
              {
                id: 'dossier-26',
                name: 'Généraliste',
                parentId: 'classeur-8-2-1',
                createdAt: new Date('2020-01-15'),
                modifiedAt: new Date('2024-06-10'),
                documents: [
                  createDocument('Ordonnance_2024_06', 'pdf', 85000, ['ordonnance', 'médecin']),
                  createDocument('Resultat_analyse_sang', 'pdf', 245000, ['analyse', 'sang']),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Export des statistiques
export const getStats = () => {
  let totalDocuments = 0;
  let totalSize = 0;
  let totalDossiers = 0;
  let totalClasseurs = 0;
  let totalRayons = 0;

  demoData.forEach(armoire => {
    armoire.rayons.forEach(rayon => {
      totalRayons++;
      rayon.classeurs.forEach(classeur => {
        totalClasseurs++;
        classeur.dossiers.forEach(dossier => {
          totalDossiers++;
          dossier.documents.forEach(doc => {
            totalDocuments++;
            totalSize += doc.size;
          });
        });
      });
    });
  });

  return {
    totalArmoires: demoData.length,
    totalRayons,
    totalClasseurs,
    totalDossiers,
    totalDocuments,
    totalSize,
    lastModified: new Date(),
  };
};
