// Types pour la structure hiérarchique Novaxel
// ARMOIRE > RAYON > CLASSEUR > DOSSIER > Document

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  extension: string;
  size: number; // en octets
  createdAt: Date;
  modifiedAt: Date;
  author?: string;
  tags: string[];
  path: string; // chemin physique sur le NAS
  metadata?: Record<string, string>;
}

export type DocumentType = 
  | 'pdf' 
  | 'image' 
  | 'word' 
  | 'excel' 
  | 'text' 
  | 'archive' 
  | 'other';

export interface Dossier {
  id: string;
  name: string;
  parentId: string; // ID du classeur parent
  documents: Document[];
  createdAt: Date;
  modifiedAt: Date;
  color?: string;
}

export interface Classeur {
  id: string;
  name: string;
  parentId: string; // ID du rayon parent
  dossiers: Dossier[];
  createdAt: Date;
  modifiedAt: Date;
  icon?: string;
}

export interface Rayon {
  id: string;
  name: string;
  parentId: string; // ID de l'armoire parente
  classeurs: Classeur[];
  createdAt: Date;
  modifiedAt: Date;
}

export interface Armoire {
  id: string;
  name: string;
  rayons: Rayon[];
  createdAt: Date;
  modifiedAt: Date;
  icon?: string;
  color?: string;
}

// Type union pour tous les éléments navigables
export type GEDItem = Armoire | Rayon | Classeur | Dossier | Document;

// Type pour identifier le niveau dans la hiérarchie
export type GEDLevel = 'armoire' | 'rayon' | 'classeur' | 'dossier' | 'document';

// État de sélection
export interface SelectionState {
  armoire: Armoire | null;
  rayon: Rayon | null;
  classeur: Classeur | null;
  dossier: Dossier | null;
  document: Document | null;
}

// Breadcrumb item
export interface BreadcrumbItem {
  id: string;
  name: string;
  level: GEDLevel;
}

// Configuration de l'application
export interface AppConfig {
  nasPath: string; // ex: /volume1/GED
  connectionType: 'smb' | 'nfs' | 'webdav';
  autoSave: boolean;
  thumbnailsEnabled: boolean;
}

// Actions contextuelles
export interface ContextAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  action: () => void;
}

// Résultat de recherche
export interface SearchResult {
  item: GEDItem;
  level: GEDLevel;
  path: BreadcrumbItem[];
  score: number;
}

// Statistiques
export interface GEDStats {
  totalArmoires: number;
  totalRayons: number;
  totalClasseurs: number;
  totalDossiers: number;
  totalDocuments: number;
  totalSize: number; // en octets
  lastModified: Date;
}

// Vue (pour le panneau de droite)
export type ViewMode = 'list' | 'grid' | 'details';

// Tri
export interface SortConfig {
  field: 'name' | 'date' | 'size' | 'type';
  direction: 'asc' | 'desc';
}

// Filtre
export interface FilterConfig {
  search: string;
  types: DocumentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags: string[];
}
