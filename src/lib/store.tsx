'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  Armoire, Rayon, Classeur, Dossier, Document, 
  SelectionState, ViewMode, SortConfig, FilterConfig,
  BreadcrumbItem, GEDLevel
} from '@/types';
import { demoData } from './demo-data';

// État de l'application
interface AppState {
  // Données
  armoires: Armoire[];
  
  // Sélection actuelle
  selection: SelectionState;
  
  // Vue
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  
  // Tri et filtre
  sort: SortConfig;
  filter: FilterConfig;
  
  // UI
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    target: { item: any; level: GEDLevel } | null;
  };
  
  // Modales
  modal: {
    type: 'create' | 'rename' | 'delete' | 'upload' | 'details' | null;
    data?: any;
  };
  
  // Recherche
  searchQuery: string;
  searchResults: any[];
}

// Actions
type Action =
  | { type: 'SELECT_ARMOIRE'; payload: Armoire | null }
  | { type: 'SELECT_RAYON'; payload: Rayon | null }
  | { type: 'SELECT_CLASSEUR'; payload: Classeur | null }
  | { type: 'SELECT_DOSSIER'; payload: Dossier | null }
  | { type: 'SELECT_DOCUMENT'; payload: Document | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SORT'; payload: SortConfig }
  | { type: 'SET_FILTER'; payload: Partial<FilterConfig> }
  | { type: 'SHOW_CONTEXT_MENU'; payload: { x: number; y: number; item: any; level: GEDLevel } }
  | { type: 'HIDE_CONTEXT_MENU' }
  | { type: 'SHOW_MODAL'; payload: { type: AppState['modal']['type']; data?: any } }
  | { type: 'HIDE_MODAL' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_ARMOIRE'; payload: Armoire }
  | { type: 'ADD_RAYON'; payload: { armoireId: string; rayon: Rayon } }
  | { type: 'ADD_CLASSEUR'; payload: { rayonId: string; classeur: Classeur } }
  | { type: 'ADD_DOSSIER'; payload: { classeurId: string; dossier: Dossier } }
  | { type: 'ADD_DOCUMENT'; payload: { dossierId: string; document: Document } }
  | { type: 'DELETE_ITEM'; payload: { id: string; level: GEDLevel } }
  | { type: 'RENAME_ITEM'; payload: { id: string; level: GEDLevel; newName: string } };

// État initial
const initialState: AppState = {
  armoires: demoData,
  selection: {
    armoire: null,
    rayon: null,
    classeur: null,
    dossier: null,
    document: null,
  },
  viewMode: 'list',
  sidebarCollapsed: false,
  sort: { field: 'name', direction: 'asc' },
  filter: { search: '', types: [], tags: [] },
  contextMenu: { visible: false, x: 0, y: 0, target: null },
  modal: { type: null },
  searchQuery: '',
  searchResults: [],
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_ARMOIRE':
      return {
        ...state,
        selection: {
          armoire: action.payload,
          rayon: null,
          classeur: null,
          dossier: null,
          document: null,
        },
      };

    case 'SELECT_RAYON':
      return {
        ...state,
        selection: {
          ...state.selection,
          rayon: action.payload,
          classeur: null,
          dossier: null,
          document: null,
        },
      };

    case 'SELECT_CLASSEUR':
      return {
        ...state,
        selection: {
          ...state.selection,
          classeur: action.payload,
          dossier: null,
          document: null,
        },
      };

    case 'SELECT_DOSSIER':
      return {
        ...state,
        selection: {
          ...state.selection,
          dossier: action.payload,
          document: null,
        },
      };

    case 'SELECT_DOCUMENT':
      return {
        ...state,
        selection: {
          ...state.selection,
          document: action.payload,
        },
      };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_SORT':
      return { ...state, sort: action.payload };

    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case 'SHOW_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: {
          visible: true,
          x: action.payload.x,
          y: action.payload.y,
          target: { item: action.payload.item, level: action.payload.level },
        },
      };

    case 'HIDE_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: { ...state.contextMenu, visible: false, target: null },
      };

    case 'SHOW_MODAL':
      return {
        ...state,
        modal: { type: action.payload.type, data: action.payload.data },
      };

    case 'HIDE_MODAL':
      return { ...state, modal: { type: null } };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'ADD_ARMOIRE':
      return { ...state, armoires: [...state.armoires, action.payload] };

    case 'ADD_RAYON': {
      const armoires = state.armoires.map(a => {
        if (a.id === action.payload.armoireId) {
          return { ...a, rayons: [...a.rayons, action.payload.rayon] };
        }
        return a;
      });
      return { ...state, armoires };
    }

    case 'ADD_CLASSEUR': {
      const armoires = state.armoires.map(a => ({
        ...a,
        rayons: a.rayons.map(r => {
          if (r.id === action.payload.rayonId) {
            return { ...r, classeurs: [...r.classeurs, action.payload.classeur] };
          }
          return r;
        }),
      }));
      return { ...state, armoires };
    }

    case 'ADD_DOSSIER': {
      const armoires = state.armoires.map(a => ({
        ...a,
        rayons: a.rayons.map(r => ({
          ...r,
          classeurs: r.classeurs.map(c => {
            if (c.id === action.payload.classeurId) {
              return { ...c, dossiers: [...c.dossiers, action.payload.dossier] };
            }
            return c;
          }),
        })),
      }));
      return { ...state, armoires };
    }

    case 'ADD_DOCUMENT': {
      const armoires = state.armoires.map(a => ({
        ...a,
        rayons: a.rayons.map(r => ({
          ...r,
          classeurs: r.classeurs.map(c => ({
            ...c,
            dossiers: c.dossiers.map(d => {
              if (d.id === action.payload.dossierId) {
                return { ...d, documents: [...d.documents, action.payload.document] };
              }
              return d;
            }),
          })),
        })),
      }));
      return { ...state, armoires };
    }

    default:
      return state;
  }
}

// Contexte
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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

// Hook pour la sélection
export function useSelection() {
  const { state, dispatch } = useApp();
  
  return {
    selection: state.selection,
    selectArmoire: (armoire: Armoire | null) => 
      dispatch({ type: 'SELECT_ARMOIRE', payload: armoire }),
    selectRayon: (rayon: Rayon | null) => 
      dispatch({ type: 'SELECT_RAYON', payload: rayon }),
    selectClasseur: (classeur: Classeur | null) => 
      dispatch({ type: 'SELECT_CLASSEUR', payload: classeur }),
    selectDossier: (dossier: Dossier | null) => 
      dispatch({ type: 'SELECT_DOSSIER', payload: dossier }),
    selectDocument: (document: Document | null) => 
      dispatch({ type: 'SELECT_DOCUMENT', payload: document }),
  };
}

// Hook pour obtenir le fil d'Ariane
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
  if (selection.document) {
    breadcrumb.push({ id: selection.document.id, name: selection.document.name, level: 'document' });
  }
  
  return breadcrumb;
}
