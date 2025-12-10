'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as api from './api';
import { ApiItem, TagInfo } from './api';

// Types
export type ViewMode = 'list' | 'grid' | 'details';
export type GEDLevel = 'armoire' | 'rayon' | 'classeur' | 'dossier' | 'intercalaire' | 'document';

export interface SelectionState {
  armoire: ApiItem | null;
  rayon: ApiItem | null;
  classeur: ApiItem | null;
  dossier: ApiItem | null;
  intercalaire: ApiItem | null;
  document: ApiItem | null;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  level: GEDLevel;
}

// État de l'application
interface AppState {
  // Connexion API
  apiConnected: boolean;
  apiChecking: boolean;
  activeUrl: string | null;
  
  // Données
  armoires: ApiItem[];
  rayons: ApiItem[];
  classeurs: ApiItem[];
  dossiers: ApiItem[];
  intercalaires: ApiItem[];
  documents: ApiItem[];
  
  // Favoris
  favorites: ApiItem[];
  
  // Étiquettes
  availableTags: TagInfo[];
  selectedItemTags: string[];
  
  // Chargement
  loading: {
    armoires: boolean;
    rayons: boolean;
    classeurs: boolean;
    dossiers: boolean;
    intercalaires: boolean;
    documents: boolean;
    tags: boolean;
  };
  
  // Sélection actuelle
  selection: SelectionState;
  
  // Vue
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  
  // Recherche
  searchQuery: string;
  searchResults: ApiItem[];
  searchLoading: boolean;
  isSearchActive: boolean;
  
  // UI
  modal: {
    type: 'create' | 'rename' | 'delete' | 'move' | 'upload' | 'details' | 'tags' | 'manageTags' | null;
    data?: any;
  };
  
  // Erreurs
  error: string | null;
}

// Actions
type Action =
  | { type: 'SET_API_STATUS'; payload: { connected: boolean; checking: boolean; activeUrl?: string | null } }
  | { type: 'SET_ARMOIRES'; payload: ApiItem[] }
  | { type: 'SET_RAYONS'; payload: ApiItem[] }
  | { type: 'SET_CLASSEURS'; payload: ApiItem[] }
  | { type: 'SET_DOSSIERS'; payload: ApiItem[] }
  | { type: 'SET_INTERCALAIRES'; payload: ApiItem[] }
  | { type: 'SET_DOCUMENTS'; payload: ApiItem[] }
  | { type: 'SET_AVAILABLE_TAGS'; payload: TagInfo[] }
  | { type: 'SET_SELECTED_ITEM_TAGS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SELECT_ARMOIRE'; payload: ApiItem | null }
  | { type: 'SELECT_RAYON'; payload: ApiItem | null }
  | { type: 'SELECT_CLASSEUR'; payload: ApiItem | null }
  | { type: 'SELECT_DOSSIER'; payload: ApiItem | null }
  | { type: 'SELECT_INTERCALAIRE'; payload: ApiItem | null }
  | { type: 'SELECT_DOCUMENT'; payload: ApiItem | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: ApiItem[] }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_ACTIVE'; payload: boolean }
  | { type: 'SHOW_MODAL'; payload: { type: AppState['modal']['type']; data?: any } }
  | { type: 'HIDE_MODAL' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_FAVORITE'; payload: ApiItem }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'SET_FAVORITES'; payload: ApiItem[] };

// État initial
const initialState: AppState = {
  apiConnected: false,
  apiChecking: true,
  activeUrl: null,
  armoires: [],
  rayons: [],
  classeurs: [],
  dossiers: [],
  intercalaires: [],
  documents: [],
  favorites: [],
  availableTags: [],
  selectedItemTags: [],
  loading: {
    armoires: true,
    rayons: false,
    classeurs: false,
    dossiers: false,
    intercalaires: false,
    documents: false,
    tags: false,
  },
  selection: {
    armoire: null,
    rayon: null,
    classeur: null,
    dossier: null,
    intercalaire: null,
    document: null,
  },
  viewMode: 'list',
  sidebarCollapsed: false,
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  isSearchActive: false,
  modal: { type: null },
  error: null,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_API_STATUS':
      return { 
        ...state, 
        apiConnected: action.payload.connected, 
        apiChecking: action.payload.checking,
        activeUrl: action.payload.activeUrl || state.activeUrl
      };
      
    case 'SET_ARMOIRES':
      return { ...state, armoires: action.payload };
      
    case 'SET_RAYONS':
      return { ...state, rayons: action.payload };
      
    case 'SET_CLASSEURS':
      return { ...state, classeurs: action.payload };
      
    case 'SET_DOSSIERS':
      return { ...state, dossiers: action.payload };
      
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
      
    case 'SET_AVAILABLE_TAGS':
      return { ...state, availableTags: action.payload };
      
    case 'SET_SELECTED_ITEM_TAGS':
      return { ...state, selectedItemTags: action.payload };
      
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } };

    case 'SELECT_ARMOIRE':
      return {
        ...state,
        selection: {
          armoire: action.payload,
          rayon: null,
          classeur: null,
          dossier: null,
          intercalaire: null,
          document: null,
        },
        rayons: [],
        classeurs: [],
        dossiers: [],
        intercalaires: [],
        documents: [],
        selectedItemTags: [],
        isSearchActive: false,
        searchQuery: '',
        searchResults: [],
      };

    case 'SELECT_RAYON':
      return {
        ...state,
        selection: {
          ...state.selection,
          rayon: action.payload,
          classeur: null,
          dossier: null,
          intercalaire: null,
          document: null,
        },
        classeurs: [],
        dossiers: [],
        intercalaires: [],
        documents: [],
        selectedItemTags: [],
      };

    case 'SELECT_CLASSEUR':
      return {
        ...state,
        selection: {
          ...state.selection,
          classeur: action.payload,
          dossier: null,
          intercalaire: null,
          document: null,
        },
        dossiers: [],
        intercalaires: [],
        documents: [],
        selectedItemTags: [],
      };

    case 'SELECT_DOSSIER':
      return {
        ...state,
        selection: {
          ...state.selection,
          dossier: action.payload,
          intercalaire: null,
          document: null,
        },
        intercalaires: [],
        documents: [],
        selectedItemTags: [],
      };

    case 'SET_INTERCALAIRES':
      return { ...state, intercalaires: action.payload };

    case 'SELECT_INTERCALAIRE':
      return {
        ...state,
        selection: {
          ...state.selection,
          intercalaire: action.payload,
          document: null,
        },
        documents: [],
        selectedItemTags: [],
      };

    case 'SELECT_DOCUMENT':
      return {
        ...state,
        selection: { ...state.selection, document: action.payload },
      };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
      
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
      
    case 'SET_SEARCH_LOADING':
      return { ...state, searchLoading: action.payload };
      
    case 'SET_SEARCH_ACTIVE':
      return { ...state, isSearchActive: action.payload };

    case 'SHOW_MODAL':
      return { ...state, modal: { type: action.payload.type, data: action.payload.data } };

    case 'HIDE_MODAL':
      return { ...state, modal: { type: null } };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ADD_FAVORITE':
      // Éviter les doublons
      if (state.favorites.some(f => f.id === action.payload.id)) {
        return state;
      }
      return { ...state, favorites: [...state.favorites, action.payload] };

    case 'REMOVE_FAVORITE':
      return { ...state, favorites: state.favorites.filter(f => f.id !== action.payload) };

    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };

    default:
      return state;
  }
}

// Contexte
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  actions: {
    loadArmoires: () => Promise<void>;
    selectArmoire: (item: ApiItem | null) => Promise<void>;
    selectRayon: (item: ApiItem | null) => Promise<void>;
    selectClasseur: (item: ApiItem | null) => Promise<void>;
    selectDossier: (item: ApiItem | null) => Promise<void>;
    selectIntercalaire: (item: ApiItem | null) => Promise<void>;
    selectDocument: (item: ApiItem | null) => Promise<void>;
    createItem: (parentId: string | null, name: string, level: GEDLevel) => Promise<void>;
    moveItem: (itemId: string, destinationId: string) => Promise<void>;
    getTree: () => Promise<api.TreeNode[]>;
    uploadFiles: (parentId: string, files: File[]) => Promise<void>;
    deleteItem: (itemId: string, level: GEDLevel) => Promise<void>;
    renameItem: (itemId: string, newName: string, level?: GEDLevel) => Promise<void>;
    search: (query: string) => Promise<void>;
    clearSearch: () => void;
    refresh: () => Promise<void>;
    // Tags
    loadTags: () => Promise<void>;
    createTag: (name: string, color: string) => Promise<void>;
    deleteTag: (tagName: string) => Promise<void>;
    loadItemTags: (itemId: string) => Promise<void>;
    addTagToItem: (itemId: string, tagName: string) => Promise<void>;
    removeTagFromItem: (itemId: string, tagName: string) => Promise<void>;
    filterByTag: (tagName: string) => Promise<void>;
    // Favoris
    addFavorite: (item: ApiItem) => void;
    removeFavorite: (itemId: string) => void;
    isFavorite: (itemId: string) => boolean;
  };
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Charger les favoris depuis l'API au démarrage
  const loadFavorites = async () => {
    try {
      const favorites = await api.getFavorites();
      dispatch({ type: 'SET_FAVORITES', payload: favorites });
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      // Fallback sur localStorage si l'API échoue
      try {
        const savedFavorites = localStorage.getItem('ged-favorites');
        if (savedFavorites) {
          dispatch({ type: 'SET_FAVORITES', payload: JSON.parse(savedFavorites) });
        }
      } catch {}
    }
  };

  // Vérifier la connexion API au démarrage
  useEffect(() => {
    const checkApi = async () => {
      try {
        await api.checkHealth();
        const activeUrl = api.getActiveApiUrl();
        dispatch({ type: 'SET_API_STATUS', payload: { connected: true, checking: false, activeUrl } });
      } catch {
        dispatch({ type: 'SET_API_STATUS', payload: { connected: false, checking: false, activeUrl: null } });
      }
    };
    checkApi();
  }, []);

  // Actions
  const loadArmoires = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'armoires', value: true } });
    try {
      const data = await api.getArmoires();
      dispatch({ type: 'SET_ARMOIRES', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les armoires' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'armoires', value: false } });
    }
  };

  const loadTags = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'tags', value: true } });
    try {
      const data = await api.getTags();
      dispatch({ type: 'SET_AVAILABLE_TAGS', payload: data });
    } catch (err) {
      console.error('Erreur chargement tags:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'tags', value: false } });
    }
  };

  const selectArmoire = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_ARMOIRE', payload: item });
    if (item) {
      dispatch({ type: 'SET_LOADING', payload: { key: 'rayons', value: true } });
      try {
        const data = await api.browse(item.id);
        dispatch({ type: 'SET_RAYONS', payload: data });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les rayons' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'rayons', value: false } });
      }
    }
  };

  const selectRayon = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_RAYON', payload: item });
    if (item) {
      dispatch({ type: 'SET_LOADING', payload: { key: 'classeurs', value: true } });
      try {
        const data = await api.browse(item.id);
        dispatch({ type: 'SET_CLASSEURS', payload: data });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les classeurs' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'classeurs', value: false } });
      }
    }
  };

  const selectClasseur = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_CLASSEUR', payload: item });
    if (item) {
      dispatch({ type: 'SET_LOADING', payload: { key: 'dossiers', value: true } });
      try {
        const data = await api.browse(item.id);
        dispatch({ type: 'SET_DOSSIERS', payload: data });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les dossiers' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'dossiers', value: false } });
      }
    }
  };

  const selectDossier = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_DOSSIER', payload: item });
    if (item) {
      dispatch({ type: 'SET_LOADING', payload: { key: 'intercalaires', value: true } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'documents', value: true } });
      try {
        const data = await api.browse(item.id);
        // Séparer les sous-dossiers (intercalaires) des fichiers (documents)
        const intercalaires = data.filter((d: ApiItem) => !d.extension && d.type !== 'document');
        const documents = data.filter((d: ApiItem) => d.extension || d.type === 'document');
        
        dispatch({ type: 'SET_INTERCALAIRES', payload: intercalaires });
        
        // Si pas d'intercalaires, afficher directement les documents
        // Sinon, vider les documents (ils seront chargés quand on sélectionne un intercalaire)
        if (intercalaires.length === 0) {
          dispatch({ type: 'SET_DOCUMENTS', payload: documents });
        } else {
          dispatch({ type: 'SET_DOCUMENTS', payload: [] });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger le contenu' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'intercalaires', value: false } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'documents', value: false } });
      }
    }
  };

  const selectIntercalaire = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_INTERCALAIRE', payload: item });
    if (item) {
      dispatch({ type: 'SET_LOADING', payload: { key: 'documents', value: true } });
      try {
        const data = await api.browse(item.id);
        dispatch({ type: 'SET_DOCUMENTS', payload: data });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les documents' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: 'documents', value: false } });
      }
    } else {
      dispatch({ type: 'SET_DOCUMENTS', payload: [] });
    }
  };

  const selectDocument = async (item: ApiItem | null) => {
    dispatch({ type: 'SELECT_DOCUMENT', payload: item });
    if (item) {
      // Charger les tags du document
      try {
        const tags = await api.getItemTags(item.id);
        dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: tags });
      } catch {
        dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: [] });
      }
    } else {
      dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: [] });
    }
  };

  const createItem = async (parentId: string | null, name: string, level: GEDLevel) => {
    try {
      if (level === 'armoire') {
        await api.createArmoire(name);
        await loadArmoires();
      } else if (parentId) {
        await api.createFolder(parentId, name);
        // Rafraîchir le niveau approprié
        if (level === 'rayon' && state.selection.armoire) {
          await selectArmoire(state.selection.armoire);
        } else if (level === 'classeur' && state.selection.rayon) {
          await selectRayon(state.selection.rayon);
        } else if (level === 'dossier' && state.selection.classeur) {
          await selectClasseur(state.selection.classeur);
        } else if (level === 'intercalaire' && state.selection.dossier) {
          await selectDossier(state.selection.dossier);
        }
      }
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de création' });
      throw err;
    }
  };

  const uploadFiles = async (parentId: string, files: File[]) => {
    try {
      await api.uploadMultipleDocuments(parentId, files);
      // Rafraîchir les documents
      if (state.selection.intercalaire) {
        await selectIntercalaire(state.selection.intercalaire);
      } else if (state.selection.dossier) {
        await selectDossier(state.selection.dossier);
      }
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur d\'upload' });
      throw err;
    }
  };

  const deleteItem = async (itemId: string, level: GEDLevel) => {
    try {
      await api.deleteItem(itemId);
      
      // Retirer des favoris si c'est un document
      if (level === 'document') {
        dispatch({ type: 'REMOVE_FAVORITE', payload: itemId });
      }
      
      // Rafraîchir les tags (le compteur a pu changer)
      await loadTags();
      
      // Rafraîchir selon le niveau
      if (level === 'armoire') {
        await loadArmoires();
        dispatch({ type: 'SELECT_ARMOIRE', payload: null });
      } else if (level === 'rayon' && state.selection.armoire) {
        await selectArmoire(state.selection.armoire);
      } else if (level === 'classeur' && state.selection.rayon) {
        await selectRayon(state.selection.rayon);
      } else if (level === 'dossier' && state.selection.classeur) {
        await selectClasseur(state.selection.classeur);
      } else if (level === 'intercalaire' && state.selection.dossier) {
        await selectDossier(state.selection.dossier);
        dispatch({ type: 'SELECT_INTERCALAIRE', payload: null });
      } else if (level === 'document') {
        if (state.selection.intercalaire) {
          await selectIntercalaire(state.selection.intercalaire);
        } else if (state.selection.dossier) {
          await selectDossier(state.selection.dossier);
        }
        dispatch({ type: 'SELECT_DOCUMENT', payload: null });
      }
      
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de suppression' });
      throw err;
    }
  };

  const renameItem = async (itemId: string, newName: string, level?: GEDLevel) => {
    try {
      await api.renameItem(itemId, newName);
      await refresh();
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de renommage' });
      throw err;
    }
  };

  const moveItem = async (itemId: string, destinationId: string) => {
    try {
      await api.moveItem(itemId, destinationId);
      await refresh();
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de déplacement' });
      throw err;
    }
  };

  const getTree = async () => {
    try {
      return await api.getTree();
    } catch (err) {
      console.error("Erreur getTree", err);
      return [];
    }
  };

  const search = async (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    
    if (query.length < 2) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      dispatch({ type: 'SET_SEARCH_ACTIVE', payload: false });
      return;
    }
    
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    dispatch({ type: 'SET_SEARCH_ACTIVE', payload: true });
    
    try {
      const results = await api.search(query);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de recherche' });
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  };

  const clearSearch = () => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    dispatch({ type: 'SET_SEARCH_ACTIVE', payload: false });
  };

  const refresh = async () => {
    await loadArmoires();
    await loadTags();
    if (state.selection.armoire) {
      const armoireData = await api.browse(state.selection.armoire.id);
      dispatch({ type: 'SET_RAYONS', payload: armoireData });
    }
    if (state.selection.rayon) {
      const rayonData = await api.browse(state.selection.rayon.id);
      dispatch({ type: 'SET_CLASSEURS', payload: rayonData });
    }
    if (state.selection.classeur) {
      const classeurData = await api.browse(state.selection.classeur.id);
      dispatch({ type: 'SET_DOSSIERS', payload: classeurData });
    }
    if (state.selection.dossier) {
      const dossierData = await api.browse(state.selection.dossier.id);
      // Séparer les sous-dossiers (intercalaires) des fichiers (documents)
      const intercalaires = dossierData.filter((d: ApiItem) => !d.extension && d.type !== 'document');
      const documents = dossierData.filter((d: ApiItem) => d.extension || d.type === 'document');
      
      dispatch({ type: 'SET_INTERCALAIRES', payload: intercalaires });
      
      // Si un intercalaire est sélectionné, charger ses documents
      if (state.selection.intercalaire) {
        const intercalaireData = await api.browse(state.selection.intercalaire.id);
        dispatch({ type: 'SET_DOCUMENTS', payload: intercalaireData });
      } else if (intercalaires.length === 0) {
        // Si pas d'intercalaires, afficher directement les documents
        dispatch({ type: 'SET_DOCUMENTS', payload: documents });
      } else {
        // Sinon, vider les documents
        dispatch({ type: 'SET_DOCUMENTS', payload: [] });
      }
    }
  };

  // Actions Tags
  const createTag = async (name: string, color: string) => {
    try {
      await api.createTag(name, color);
      await loadTags();
      dispatch({ type: 'HIDE_MODAL' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de création' });
      throw err;
    }
  };

  const deleteTag = async (tagName: string) => {
    try {
      await api.deleteTag(tagName);
      await loadTags();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur de suppression' });
      throw err;
    }
  };

  const loadItemTags = async (itemId: string) => {
    try {
      const tags = await api.getItemTags(itemId);
      dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: tags });
    } catch {
      dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: [] });
    }
  };

  const addTagToItem = async (itemId: string, tagName: string) => {
    try {
      const result = await api.addTagToItem(itemId, tagName);
      dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: result.tags });
      await loadTags(); // Mettre à jour les compteurs
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  };

  const removeTagFromItem = async (itemId: string, tagName: string) => {
    try {
      const result = await api.removeTagFromItem(itemId, tagName);
      dispatch({ type: 'SET_SELECTED_ITEM_TAGS', payload: result.tags });
      await loadTags(); // Mettre à jour les compteurs
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Erreur' });
      throw err;
    }
  };

  const filterByTag = async (tagName: string) => {
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    dispatch({ type: 'SET_SEARCH_ACTIVE', payload: true });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: `tag:${tagName}` });
    
    try {
      const results = await api.getItemsByTag(tagName);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de filtrage' });
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  };

  // Favoris (avec synchronisation API)
  const addFavorite = async (item: ApiItem) => {
    // Optimistic update
    dispatch({ type: 'ADD_FAVORITE', payload: item });
    try {
      await api.addFavorite(item.id);
    } catch (err) {
      console.error('Erreur ajout favori:', err);
      // Rollback en cas d'erreur
      dispatch({ type: 'REMOVE_FAVORITE', payload: item.id });
    }
  };

  const removeFavorite = async (itemId: string) => {
    // Garder l'ancien état pour rollback
    const oldFavorites = state.favorites;
    // Optimistic update
    dispatch({ type: 'REMOVE_FAVORITE', payload: itemId });
    try {
      await api.removeFavorite(itemId);
    } catch (err) {
      console.error('Erreur suppression favori:', err);
      // Rollback en cas d'erreur
      dispatch({ type: 'SET_FAVORITES', payload: oldFavorites });
    }
  };

  const isFavorite = (itemId: string): boolean => {
    return state.favorites.some(f => f.id === itemId);
  };

  // Charger les armoires, tags et favoris au démarrage si l'API est connectée
  useEffect(() => {
    if (state.apiConnected) {
      loadArmoires();
      loadTags();
      loadFavorites();
    }
  }, [state.apiConnected]);

  const actions = {
    loadArmoires,
    selectArmoire,
    selectRayon,
    selectClasseur,
    selectDossier,
    selectIntercalaire,
    selectDocument,
    createItem,
    moveItem,
    getTree,
    uploadFiles,
    deleteItem,
    renameItem,
    search,
    clearSearch,
    refresh,
    loadTags,
    createTag,
    deleteTag,
    loadItemTags,
    addTagToItem,
    removeTagFromItem,
    filterByTag,
    addFavorite,
    removeFavorite,
    isFavorite,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook personnalisé
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Hook pour le fil d'Ariane
export function useBreadcrumb(): BreadcrumbItem[] {
  const { state } = useApp();
  const { selection } = state;
  
  const breadcrumb: BreadcrumbItem[] = [];
  
  if (selection.armoire) {
    breadcrumb.push({ id: selection.armoire.id, name: selection.armoire.name, level: 'armoire' });
  }
  if (selection.rayon) {
    breadcrumb.push({ id: selection.rayon.id, name: selection.rayon.name, level: 'rayon' });
  }
  if (selection.classeur) {
    breadcrumb.push({ id: selection.classeur.id, name: selection.classeur.name, level: 'classeur' });
  }
  if (selection.dossier) {
    breadcrumb.push({ id: selection.dossier.id, name: selection.dossier.name, level: 'dossier' });
  }
  if (selection.intercalaire) {
    breadcrumb.push({ id: selection.intercalaire.id, name: selection.intercalaire.name, level: 'intercalaire' });
  }
  if (selection.document) {
    breadcrumb.push({ id: selection.document.id, name: selection.document.name, level: 'document' });
  }
  
  return breadcrumb;
}
