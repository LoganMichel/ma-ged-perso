'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Star,
  Clock,
  Tag,
  Bookmark,
  FileText,
  Search,
  Zap,
  Plus,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store-api';
import { getDownloadUrl } from '@/lib/api';

export default function Sidebar() {
  const { state, dispatch, actions } = useApp();
  const [scriptsExpanded, setScriptsExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);

  const handleTagClick = (tagName: string) => {
    actions.filterByTag(tagName);
  };

  const handleRecentDocuments = () => {
    setSelectedScript('recent');
    // Pour l'instant, on peut faire une recherche vide qui retourne les derniers documents
    actions.search('');
  };

  const handleSearchClick = () => {
    setSelectedScript('search');
    // Focus sur l'input de recherche dans le header
    const searchInput = document.querySelector('input[placeholder="Rechercher..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleFavoriteClick = (fav: any) => {
    actions.selectDocument(fav);
    // Émettre un événement pour ouvrir la prévisualisation
    window.dispatchEvent(new CustomEvent('open-document-preview', { detail: fav }));
  };

  const handleRemoveFavorite = (e: React.MouseEvent, favId: string) => {
    e.stopPropagation();
    actions.removeFavorite(favId);
  };

  if (state.sidebarCollapsed) {
    return (
      <aside className="sidebar w-12 bg-white border-r border-ged-border flex-col items-center py-4 gap-3 hidden md:flex">
        <button className="p-2 rounded-md text-ged-text-muted hover:text-ged-primary hover:bg-ged-surface-alt transition-colors">
          <Zap className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-md text-amber-500 hover:bg-amber-50 transition-colors">
          <Star className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-md text-ged-text-muted hover:text-ged-primary hover:bg-ged-surface-alt transition-colors">
          <Tag className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar w-56 bg-white border-r border-ged-border flex-col hidden md:flex">
      <div className="panel-header flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Scripts
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Section Actions rapides */}
        <div className="p-2">
          <button
            onClick={() => setScriptsExpanded(!scriptsExpanded)}
            className="flex items-center gap-1 w-full px-2 py-1 text-xs font-medium text-ged-text-muted uppercase tracking-wider hover:text-ged-primary transition-colors"
          >
            {scriptsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Actions rapides
          </button>

          {scriptsExpanded && (
            <div className="mt-1 space-y-0.5">
              <button
                onClick={handleSearchClick}
                className={`tree-item w-full text-left text-sm ${selectedScript === 'search' ? 'selected' : ''}`}
              >
                <Search className="w-4 h-4 text-ged-primary" />
                <span className="truncate">Recherche avancée</span>
              </button>
              <button
                onClick={handleRecentDocuments}
                className={`tree-item w-full text-left text-sm ${selectedScript === 'recent' ? 'selected' : ''}`}
              >
                <Clock className="w-4 h-4 text-ged-secondary" />
                <span className="truncate">Documents récents</span>
              </button>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t border-ged-border my-2" />

        {/* Section Favoris */}
        <div className="p-2">
          <button
            onClick={() => setFavoritesExpanded(!favoritesExpanded)}
            className="flex items-center gap-1 w-full px-2 py-1 text-xs font-medium text-ged-text-muted uppercase tracking-wider hover:text-ged-primary transition-colors"
          >
            {favoritesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Star className="w-3 h-3 text-amber-500" />
            Favoris
            {state.favorites.length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {state.favorites.length}
              </span>
            )}
          </button>

          {favoritesExpanded && (
            <div className="mt-1 space-y-0.5">
              {state.favorites.length === 0 ? (
                <div className="px-2 py-3 text-xs text-ged-text-muted text-center">
                  Aucun favori
                </div>
              ) : (
                state.favorites.map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => handleFavoriteClick(fav)}
                    className="tree-item w-full text-left text-sm group"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                    <span className="truncate flex-1">{fav.name}</span>
                    <button
                      onClick={(e) => handleRemoveFavorite(e, fav.id)}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-ged-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Retirer des favoris"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t border-ged-border my-2" />

        {/* Section Étiquettes */}
        <div className="p-2">
          <button
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className="flex items-center gap-1 w-full px-2 py-1 text-xs font-medium text-ged-text-muted uppercase tracking-wider hover:text-ged-primary transition-colors"
          >
            {tagsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Étiquettes
          </button>

          {tagsExpanded && (
            <div className="mt-1 space-y-0.5">
              {state.loading.tags ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-ged-secondary" />
                </div>
              ) : state.availableTags.length === 0 ? (
                <div className="px-2 py-3 text-xs text-ged-text-muted text-center">
                  Aucune étiquette
                </div>
              ) : (
                state.availableTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleTagClick(tag.name)}
                    className="tree-item w-full text-left text-sm justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </div>
                    <span className="text-xs bg-ged-surface-alt px-1.5 py-0.5 rounded-full text-ged-text-muted">
                      {tag.count}
                    </span>
                  </button>
                ))
              )}
              
              {/* Bouton ajouter étiquette */}
              <button 
                onClick={() => dispatch({ type: 'SHOW_MODAL', payload: { type: 'manageTags' } })}
                className="tree-item w-full text-left text-sm text-ged-text-muted hover:text-ged-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Gérer les étiquettes...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pied de page avec infos */}
      <div className="p-3 border-t border-ged-border bg-ged-surface/50">
        <div className="text-xs text-ged-text-muted space-y-1">
          <div className="flex items-center justify-between">
            <span>Connexion API</span>
            <span className={`w-2 h-2 rounded-full ${state.apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
          <div className="text-[10px] opacity-75">
            {state.apiConnected ? '/volume1/GED' : 'Déconnecté'}
          </div>
        </div>
      </div>
    </aside>
  );
}
