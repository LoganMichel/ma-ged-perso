'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  RefreshCw,
  Settings,
  HelpCircle,
  LayoutGrid,
  List,
  TableProperties,
  ChevronDown,
  FolderPlus,
  FilePlus,
  X,
  Loader2,
  Tag,
  Trash2,
  Star,
} from 'lucide-react';
import { useApp } from '@/lib/store-api';
import { ViewMode } from '@/lib/store-api';
import { getDownloadUrl } from '@/lib/api';

export default function Header() {
  const { state, dispatch, actions } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      actions.search(searchInput);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    actions.clearSearch();
  };

  const handleCreateNew = (type: 'armoire' | 'rayon' | 'classeur' | 'dossier' | 'intercalaire') => {
    setShowCreateMenu(false);
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'create', data: { itemType: type } } });
  };

  const handleDownload = () => {
    if (state.selection.document) {
      const url = getDownloadUrl(state.selection.document.id);
      window.open(url, '_blank');
    }
  };

  const handleDelete = () => {
    const { selection } = state;
    let itemToDelete = null;
    let level = '';

    if (selection.document) {
      itemToDelete = selection.document;
      level = 'document';
    } else if (selection.intercalaire) {
      itemToDelete = selection.intercalaire;
      level = 'intercalaire';
    } else if (selection.dossier) {
      itemToDelete = selection.dossier;
      level = 'dossier';
    } else if (selection.classeur) {
      itemToDelete = selection.classeur;
      level = 'classeur';
    } else if (selection.rayon) {
      itemToDelete = selection.rayon;
      level = 'rayon';
    } else if (selection.armoire) {
      itemToDelete = selection.armoire;
      level = 'armoire';
    }

    if (itemToDelete) {
      dispatch({
        type: 'SHOW_MODAL',
        payload: {
          type: 'delete',
          data: { itemId: itemToDelete.id, itemName: itemToDelete.name, level }
        }
      });
    }
  };

  const canCreate = (type: string) => {
    switch (type) {
      case 'armoire': return true;
      case 'rayon': return !!state.selection.armoire;
      case 'classeur': return !!state.selection.rayon;
      case 'dossier': return !!state.selection.classeur;
      case 'intercalaire': return !!state.selection.dossier;
      default: return false;
    }
  };

  // Peut uploader si on a un intercalaire sélectionné, OU un dossier sélectionné sans intercalaires
  const hasIntercalaires = state.intercalaires && state.intercalaires.length > 0;
  const canUpload = !!(
    state.selection.intercalaire || 
    (state.selection.dossier && !hasIntercalaires)
  );

  const hasSelection = !!(
    state.selection.document ||
    state.selection.intercalaire ||
    state.selection.dossier ||
    state.selection.classeur ||
    state.selection.rayon ||
    state.selection.armoire
  );

  return (
    <header className="bg-white border-b border-ged-border">
      {/* Barre de titre */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-gradient-to-r from-ged-primary to-ged-secondary">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-ged-blanc.png" 
              alt="GED" 
              className="w-7 h-7 md:w-8 md:h-8"
            />
            <h1 className="text-white font-display font-bold text-lg md:text-xl tracking-tight">
              <span className="hidden sm:inline">Ma GED</span>
              <span className="sm:hidden">GED</span>
              <span className="font-light opacity-80 hidden sm:inline"> Perso</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => dispatch({ type: 'SHOW_MODAL', payload: { type: 'manageTags' } })}
            className="p-1.5 md:p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Gérer les étiquettes"
          >
            <Tag className="w-5 h-5" />
          </button>
          {/* Bouton Favoris - visible sur mobile uniquement */}
          <button 
            onClick={() => {
              // Émettre un événement custom pour afficher les favoris sur mobile
              window.dispatchEvent(new CustomEvent('show-mobile-favorites'));
            }}
            className="p-1.5 md:p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors md:hidden relative"
            title="Favoris"
          >
            <Star className="w-5 h-5" />
            {state.favorites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {state.favorites.length}
              </span>
            )}
          </button>
          <button className="p-1.5 md:p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors hidden md:block">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-1.5 md:p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors hidden md:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="toolbar flex-col md:flex-row">
        {/* Ligne 1 : Actions principales */}
        <div className="flex items-center gap-1 w-full md:w-auto">
          <div className="relative" ref={createMenuRef}>
            <button 
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="btn btn-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            {/* Menu déroulant */}
            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-dropdown border border-ged-border py-1 min-w-[180px] z-50 animate-fade-in">
                <button 
                  onClick={() => handleCreateNew('armoire')}
                  className="context-menu-item w-full text-left"
                >
                  <FolderPlus className="w-4 h-4 text-ged-accent" />
                  Nouvelle armoire
                </button>
                <button 
                  onClick={() => handleCreateNew('rayon')}
                  className={`context-menu-item w-full text-left ${!canCreate('rayon') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canCreate('rayon')}
                >
                  <FolderPlus className="w-4 h-4 text-ged-secondary" />
                  Nouveau rayon
                </button>
                <button 
                  onClick={() => handleCreateNew('classeur')}
                  className={`context-menu-item w-full text-left ${!canCreate('classeur') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canCreate('classeur')}
                >
                  <FolderPlus className="w-4 h-4 text-ged-primary" />
                  Nouveau classeur
                </button>
                <button 
                  onClick={() => handleCreateNew('dossier')}
                  className={`context-menu-item w-full text-left ${!canCreate('dossier') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canCreate('dossier')}
                >
                  <FolderPlus className="w-4 h-4 text-purple-500" />
                  Nouveau dossier
                </button>
                <button 
                  onClick={() => handleCreateNew('intercalaire')}
                  className={`context-menu-item w-full text-left ${!canCreate('intercalaire') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canCreate('intercalaire')}
                >
                  <FolderPlus className="w-4 h-4 text-pink-500" />
                  Nouvel intercalaire
                </button>
                <div className="context-menu-separator" />
                <button 
                  onClick={() => {
                    setShowCreateMenu(false);
                    dispatch({ type: 'SHOW_MODAL', payload: { type: 'upload' } });
                  }}
                  className={`context-menu-item w-full text-left ${!canUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canUpload}
                >
                  <FilePlus className="w-4 h-4 text-green-500" />
                  Ajouter un document
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-ged-border mx-2" />

          <button 
            className="toolbar-btn"
            onClick={() => dispatch({ type: 'SHOW_MODAL', payload: { type: 'upload' } })}
            title="Importer des fichiers"
            disabled={!canUpload}
          >
            <Upload className="w-5 h-5" />
          </button>

          <button 
            className="toolbar-btn"
            title="Télécharger"
            disabled={!state.selection.document}
            onClick={handleDownload}
          >
            <Download className="w-5 h-5" />
          </button>

          <button 
            className={`toolbar-btn ${hasSelection ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : ''}`}
            title="Supprimer"
            disabled={!hasSelection}
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-ged-border mx-2" />

          <button 
            className="toolbar-btn"
            title="Actualiser"
            onClick={actions.refresh}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {/* Espace flexible sur desktop */}
          <div className="hidden md:block flex-1" />
        </div>

        {/* Ligne 2 : Recherche (pleine largeur sur mobile) */}
        <div className="w-full md:hidden mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ged-text-muted" />
            <input
              type="text"
              placeholder="Rechercher dans la GED..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`input pl-9 pr-10 py-2.5 w-full text-base ${state.isSearchActive ? 'ring-2 ring-ged-secondary border-ged-secondary' : ''}`}
            />
            {state.searchLoading && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-ged-secondary animate-spin" />
            )}
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ged-text-muted hover:text-ged-text p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Options de vue - desktop uniquement */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ged-text-muted" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`input pl-9 pr-10 py-1.5 w-72 text-sm ${state.isSearchActive ? 'ring-2 ring-ged-secondary border-ged-secondary' : ''}`}
            />
            {state.searchLoading && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-ged-secondary animate-spin" />
            )}
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ged-text-muted hover:text-ged-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-ged-border" />

          <div className="flex items-center gap-1 bg-ged-surface-alt rounded-md p-0.5">
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                state.viewMode === 'list' 
                  ? 'bg-white shadow-sm text-ged-primary' 
                  : 'text-ged-text-muted hover:text-ged-text'
              }`}
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${
                state.viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-ged-primary' 
                  : 'text-ged-text-muted hover:text-ged-text'
              }`}
              title="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('details')}
              className={`p-1.5 rounded transition-colors ${
                state.viewMode === 'details' 
                  ? 'bg-white shadow-sm text-ged-primary' 
                  : 'text-ged-text-muted hover:text-ged-text'
              }`}
              title="Vue détaillée"
            >
              <TableProperties className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
