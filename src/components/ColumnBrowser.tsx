'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  FileType,
  Archive,
  File,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Download,
  Search,
  Trash2,
  Tag,
  X,
  Maximize2,
  ExternalLink,
  Eye,
  FileIcon,
  Edit2,
  Home,
  Star,
  FolderInput,
} from 'lucide-react';
import { useApp } from '@/lib/store-api';
import { ApiItem } from '@/lib/api';
import { getDownloadUrl, getPreviewUrl, getActiveApiUrl } from '@/lib/api';

// Hook pour détecter le mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Filtrer les fichiers/dossiers système Synology
const HIDDEN_PATTERNS = ['@eaDir', '#recycle', '.DS_Store', 'Thumbs.db', '@tmp', '#snapshot'];

function filterSystemItems(items: ApiItem[]): ApiItem[] {
  return items.filter(item => {
    const name = item.name.toLowerCase();
    return !HIDDEN_PATTERNS.some(pattern => 
      name === pattern.toLowerCase() || 
      name.startsWith(pattern.toLowerCase())
    );
  });
}

// Icônes pour les types de documents
const getDocumentIcon = (extension?: string) => {
  if (!extension) return <File className="w-4 h-4 text-gray-400" />;
  
  const ext = extension.toLowerCase();
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FileText className="w-4 h-4 text-red-500" />,
    jpg: <Image className="w-4 h-4 text-blue-500" />,
    jpeg: <Image className="w-4 h-4 text-blue-500" />,
    png: <Image className="w-4 h-4 text-blue-500" />,
    gif: <Image className="w-4 h-4 text-blue-500" />,
    webp: <Image className="w-4 h-4 text-blue-500" />,
    doc: <FileType className="w-4 h-4 text-blue-600" />,
    docx: <FileType className="w-4 h-4 text-blue-600" />,
    xls: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
    xlsx: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
    zip: <Archive className="w-4 h-4 text-amber-600" />,
    rar: <Archive className="w-4 h-4 text-amber-600" />,
  };
  
  return iconMap[ext] || <File className="w-4 h-4 text-gray-400" />;
};

// Icônes grandes pour la vue grille
const getDocumentIconLarge = (extension?: string) => {
  if (!extension) return <File className="w-12 h-12 text-gray-400" />;
  
  const ext = extension.toLowerCase();
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FileText className="w-12 h-12 text-red-500" />,
    jpg: <Image className="w-12 h-12 text-blue-500" />,
    jpeg: <Image className="w-12 h-12 text-blue-500" />,
    png: <Image className="w-12 h-12 text-blue-500" />,
    gif: <Image className="w-12 h-12 text-blue-500" />,
    webp: <Image className="w-12 h-12 text-blue-500" />,
    doc: <FileType className="w-12 h-12 text-blue-600" />,
    docx: <FileType className="w-12 h-12 text-blue-600" />,
    xls: <FileSpreadsheet className="w-12 h-12 text-green-600" />,
    xlsx: <FileSpreadsheet className="w-12 h-12 text-green-600" />,
    zip: <Archive className="w-12 h-12 text-amber-600" />,
    rar: <Archive className="w-12 h-12 text-amber-600" />,
  };
  
  return iconMap[ext] || <File className="w-12 h-12 text-gray-400" />;
};

// Composant pour un élément dans les résultats de recherche
function SearchResultItem({ item, onPreview }: { item: ApiItem; onPreview: (doc: ApiItem) => void }) {
  const { state, dispatch, actions } = useApp();
  const isFavorite = actions.isFavorite(item.id);
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDownloadUrl(item.id, state.activeUrl || undefined);
    window.open(url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        type: 'delete',
        data: { itemId: item.id, itemName: item.name, level: item.type }
      }
    });
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Sélectionner le document pour pouvoir lui attribuer des tags
    actions.selectDocument(item);
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(item.id);
    } else {
      actions.addFavorite(item);
    }
  };

  // Récupérer les couleurs des tags
  const getTagColors = () => {
    if (!item.tags || item.tags.length === 0) return [];
    return item.tags.slice(0, 3).map(tagName => {
      const tagInfo = state.availableTags.find(t => t.name === tagName);
      return { name: tagName, color: tagInfo?.color || '#3b82f6' };
    });
  };

  const tagColors = getTagColors();
  const hasMoreTags = item.tags && item.tags.length > 3;

  const handleClick = () => {
    if (item.type === 'document') {
      onPreview(item);
    }
  };

  return (
    <div 
      className="list-item group cursor-pointer hover:bg-ged-surface"
      onClick={handleClick}
    >
      {item.type === 'document' ? (
        getDocumentIcon(item.extension)
      ) : (
        <Folder className="w-4 h-4 text-ged-accent" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {/* Indicateurs de type de correspondance */}
          {item.match_type?.includes('filename') && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Titre
            </span>
          )}
          {item.match_type?.includes('content') && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Contenu
            </span>
          )}
          {/* Indicateur des étiquettes */}
          {tagColors.length > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {tagColors.map((tag) => (
                <div
                  key={tag.name}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                />
              ))}
              {hasMoreTags && (
                <span className="text-[10px] text-ged-text-muted">
                  +{item.tags!.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-xs text-ged-text-muted truncate">{item.path}</div>
      </div>
      <span className="text-xs bg-ged-surface-alt px-2 py-0.5 rounded text-ged-text-muted mr-2">
        {item.type}
      </span>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.type === 'document' && (
          <>
            <button
              onClick={handleFavorite}
              className={`p-1 rounded hover:bg-ged-surface-alt ${isFavorite ? 'text-amber-500' : 'text-ged-text-muted hover:text-amber-500'}`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleTagClick}
              className="p-1 rounded text-ged-text-muted hover:text-ged-accent hover:bg-ged-surface-alt"
              title="Étiquettes"
            >
              <Tag className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({
                  type: 'SHOW_MODAL',
                  payload: {
                    type: 'move',
                    data: { itemId: item.id, itemName: item.name }
                  }
                });
              }}
              className="p-1 rounded text-ged-text-muted hover:text-blue-500 hover:bg-blue-50"
              title="Déplacer"
            >
              <FolderInput className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 rounded text-ged-text-muted hover:text-ged-secondary hover:bg-ged-surface-alt"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={handleDelete}
          className="p-1 rounded text-ged-text-muted hover:text-red-500 hover:bg-red-50"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Composant résultat de recherche pour mobile
function MobileSearchResultItem({ item, onPreview }: { item: ApiItem; onPreview: (doc: ApiItem) => void }) {
  const { state, dispatch, actions } = useApp();
  const isFavorite = actions.isFavorite(item.id);

  const handleClick = () => {
    if (item.type === 'document') {
      onPreview(item);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(item.id);
    } else {
      actions.addFavorite(item);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDownloadUrl(item.id, state.activeUrl || undefined);
    window.open(url, '_blank');
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 bg-white active:bg-ged-surface"
      onClick={handleClick}
    >
      {item.type === 'document' ? (
        getDocumentIcon(item.extension)
      ) : (
        <Folder className="w-5 h-5 text-ged-accent flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.name}</span>
          {/* Indicateurs de type de correspondance */}
          {item.match_type?.includes('filename') && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Titre
            </span>
          )}
          {item.match_type?.includes('content') && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              Contenu
            </span>
          )}
        </div>
        <div className="text-xs text-ged-text-muted truncate">{item.path}</div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {item.type === 'document' && (
          <>
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full ${isFavorite ? 'text-amber-500' : 'text-ged-text-muted'}`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({
                  type: 'SHOW_MODAL',
                  payload: {
                    type: 'move',
                    data: { itemId: item.id, itemName: item.name }
                  }
                });
              }}
              className="p-2 rounded-full text-ged-text-muted hover:text-blue-500"
            >
              <FolderInput className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full text-ged-text-muted"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        )}
        <ChevronRight className="w-5 h-5 text-ged-border" />
      </div>
    </div>
  );
}

// Composant colonne générique
interface ColumnProps {
  title: string;
  items: ApiItem[];
  selectedId: string | null;
  onSelect: (item: ApiItem) => void;
  loading?: boolean;
  emptyMessage?: string;
  folderColor?: string;
}

function Column({
  title,
  items,
  selectedId,
  onSelect,
  loading = false,
  emptyMessage = 'Aucun élément',
  folderColor = 'text-ged-accent',
}: ColumnProps) {
  return (
    <div className="flex flex-col min-w-[180px] max-w-[220px] border-r border-ged-border bg-white flex-shrink-0">
      <div className="column-header">
        <span>{title}</span>
        <span className="text-[10px] font-normal text-ged-text-muted">
          {items.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-ged-secondary" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-ged-text-muted">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`list-item group ${selectedId === item.id ? 'selected' : ''}`}
            >
              {item.type === 'document' ? (
                getDocumentIcon(item.extension)
              ) : (
                <Folder className={`w-4 h-4 ${selectedId === item.id ? 'text-white' : folderColor}`} />
              )}
              <span className="flex-1 truncate text-sm">{item.name}</span>
              
              {/* Move Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Dispatch move modal
                  const event = new CustomEvent('open-move-modal', { 
                    detail: { itemId: item.id, itemName: item.name } 
                  });
                  window.dispatchEvent(event);
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === item.id ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-ged-text-muted hover:text-blue-500 hover:bg-blue-50'}`}
                title="Déplacer"
              >
                <FolderInput className="w-3 h-3" />
              </button>

              {item.children_count !== undefined && item.children_count > 0 && (
                <ChevronRight className={`w-3 h-3 ${selectedId === item.id ? 'text-white/70' : 'text-ged-text-muted'}`} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ColumnBrowser() {
  const { state, actions, dispatch } = useApp();
  const { selection, armoires, rayons, classeurs, dossiers, intercalaires, documents, loading, apiConnected, apiChecking, isSearchActive, searchResults, searchLoading, viewMode } = state;
  const [showPreview, setShowPreview] = useState(false);
  const isMobile = useIsMobile();
  
  // Navigation mobile : index de la colonne active (0=armoire, 1=rayon, etc.)
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);

  // Filtrer les éléments système de toutes les listes
  const filteredArmoires = filterSystemItems(armoires);
  const filteredRayons = filterSystemItems(rayons);
  const filteredClasseurs = filterSystemItems(classeurs);
  const filteredDossiers = filterSystemItems(dossiers);
  const filteredIntercalaires = filterSystemItems(intercalaires);
  const filteredDocuments = filterSystemItems(documents);
  const filteredSearchResults = filterSystemItems(searchResults);

  // État pour afficher les favoris sur mobile
  const [showMobileFavorites, setShowMobileFavorites] = useState(false);

  // Écouter l'événement pour afficher les favoris depuis le header
  useEffect(() => {
    const handleShowFavorites = () => setShowMobileFavorites(true);
    window.addEventListener('show-mobile-favorites', handleShowFavorites);
    return () => window.removeEventListener('show-mobile-favorites', handleShowFavorites);
  }, []);

  // Écouter l'événement pour ouvrir la prévisualisation d'un document (depuis sidebar favoris)
  useEffect(() => {
    const handleOpenPreview = (e: CustomEvent) => {
      setShowPreview(true);
    };
    window.addEventListener('open-document-preview', handleOpenPreview as EventListener);
    return () => window.removeEventListener('open-document-preview', handleOpenPreview as EventListener);
  }, []);

  // Écouter l'événement pour ouvrir la modale de déplacement (depuis les colonnes qui n'ont pas accès directement au dispatch)
  useEffect(() => {
    const handleOpenMoveModal = (e: CustomEvent) => {
      const { itemId, itemName } = e.detail;
      dispatch({
        type: 'SHOW_MODAL',
        payload: {
          type: 'move',
          data: { itemId, itemName }
        }
      });
    };
    window.addEventListener('open-move-modal', handleOpenMoveModal as EventListener);
    return () => window.removeEventListener('open-move-modal', handleOpenMoveModal as EventListener);
  }, []);

  // Afficher la colonne INTERCALAIRE seulement s'il y en a
  const hasIntercalaires = filteredIntercalaires.length > 0;

  // Définir les colonnes disponibles pour la navigation mobile
  const mobileColumns = [
    { id: 'armoire', title: 'ARMOIRE', color: 'text-ged-accent' },
    { id: 'rayon', title: 'RAYON', color: 'text-ged-secondary' },
    { id: 'classeur', title: 'CLASSEUR', color: 'text-ged-primary' },
    { id: 'dossier', title: 'DOSSIER', color: 'text-purple-500' },
    ...(hasIntercalaires ? [{ id: 'intercalaire', title: 'INTERCALAIRE', color: 'text-pink-500' }] : []),
    { id: 'documents', title: 'DOCUMENTS', color: 'text-gray-600' },
  ];

  // Calculer l'index max basé sur la sélection actuelle
  const getMaxColumnIndex = () => {
    if (selection.document) return mobileColumns.length - 1;
    if (hasIntercalaires && selection.intercalaire) return mobileColumns.length - 1;
    if (!hasIntercalaires && selection.dossier) return mobileColumns.length - 1;
    if (hasIntercalaires && selection.dossier) return mobileColumns.findIndex(c => c.id === 'intercalaire');
    if (selection.classeur) return 3;
    if (selection.rayon) return 2;
    if (selection.armoire) return 1;
    return 0;
  };

  // Avancer automatiquement sur mobile quand on sélectionne un élément
  useEffect(() => {
    if (isMobile) {
      const maxIndex = getMaxColumnIndex();
      if (mobileColumnIndex < maxIndex) {
        setMobileColumnIndex(maxIndex);
      }
    }
  }, [selection.armoire, selection.rayon, selection.classeur, selection.dossier, selection.intercalaire, hasIntercalaires]);

  // Ouvrir la preview quand un document est sélectionné
  const handleDocumentSelect = (doc: ApiItem) => {
    actions.selectDocument(doc);
    setShowPreview(true);
  };

  // Navigation mobile
  const goBack = () => {
    if (mobileColumnIndex > 0) {
      setMobileColumnIndex(mobileColumnIndex - 1);
    }
  };

  const goForward = () => {
    const maxIndex = getMaxColumnIndex();
    if (mobileColumnIndex < maxIndex) {
      setMobileColumnIndex(mobileColumnIndex + 1);
    }
  };

  const goHome = () => {
    setMobileColumnIndex(0);
  };

  // Afficher un message si l'API n'est pas connectée
  if (apiChecking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ged-surface-alt">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ged-secondary mx-auto mb-3" />
          <p className="text-ged-text-muted">Connexion à l'API...</p>
        </div>
      </div>
    );
  }

  if (!apiConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ged-surface-alt">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-ged-text mb-2">API non connectée</h2>
          <p className="text-ged-text-muted mb-4">
            Impossible de se connecter à l'API GED. Vérifiez que le conteneur Docker est lancé sur votre NAS.
          </p>
          <code className="block bg-ged-surface p-3 rounded text-sm text-left mb-4">
            {(typeof window !== 'undefined' && window.__ENV__?.API_URLS?.[0]) || 'http://192.168.0.100:8001'}
          </code>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Afficher les résultats de recherche
  if (isSearchActive) {
    // Version mobile des résultats de recherche
    if (isMobile) {
      return (
        <div className="flex flex-col flex-1 overflow-hidden bg-ged-surface-alt">
          {/* Header résultats */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-ged-border">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-ged-secondary" />
              <span className="font-semibold text-sm text-ged-secondary">RÉSULTATS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ged-text-muted">
                {filteredSearchResults.length} résultat(s)
              </span>
              <button
                onClick={actions.clearSearch}
                className="text-xs text-ged-secondary font-medium px-2 py-1 rounded hover:bg-ged-surface"
              >
                Effacer
              </button>
            </div>
          </div>

          {/* Liste des résultats */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {searchLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
              </div>
            ) : filteredSearchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-ged-text-muted p-8">
                <Search className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm text-center">Aucun résultat trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-ged-border/50">
                {filteredSearchResults.map((item) => (
                  <MobileSearchResultItem 
                    key={item.id} 
                    item={item} 
                    onPreview={(doc) => {
                      actions.selectDocument(doc);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer mobile */}
          <MobileFooter 
            selection={selection}
            hasIntercalaires={hasIntercalaires}
            armoires={filteredArmoires}
            documents={filteredDocuments}
          />

          {/* Preview plein écran */}
          {showPreview && selection.document && (
            <MobileDocumentPreview 
              document={selection.document} 
              onClose={() => setShowPreview(false)} 
            />
          )}
        </div>
      );
    }

    // Version desktop des résultats de recherche
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="column-header justify-between">
          <span>RÉSULTATS DE RECHERCHE</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-normal text-ged-text-muted">
              {filteredSearchResults.length} résultat(s)
            </span>
            <button
              onClick={actions.clearSearch}
              className="text-xs text-ged-secondary hover:underline"
            >
              Effacer
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {searchLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
            </div>
          ) : filteredSearchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ged-text-muted p-8">
              <Search className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm text-center">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-ged-border/50">
              {filteredSearchResults.map((item) => (
                <SearchResultItem 
                  key={item.id} 
                  item={item} 
                  onPreview={(doc) => {
                    actions.selectDocument(doc);
                    setShowPreview(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panneau de prévisualisation en overlay */}
        {showPreview && selection.document && (
          <DocumentPreview 
            document={selection.document} 
            onClose={() => setShowPreview(false)} 
          />
        )}
      </div>
    );
  }

  // =============== VERSION MOBILE ===============
  if (isMobile) {
    const currentColumn = mobileColumns[mobileColumnIndex];
    const maxIndex = getMaxColumnIndex();

    // Rendu des favoris mobile
    if (showMobileFavorites) {
      return (
        <div className="flex flex-col flex-1 overflow-hidden bg-ged-surface-alt">
          {/* Header favoris */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-ged-border">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-sm text-amber-600">FAVORIS</span>
            </div>
            <button
              onClick={() => setShowMobileFavorites(false)}
              className="text-xs text-ged-primary font-medium px-2 py-1 rounded hover:bg-ged-surface"
            >
              Retour
            </button>
          </div>

          {/* Liste des favoris */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {state.favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-ged-text-muted p-8">
                <Star className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm text-center">Aucun favori</p>
                <p className="text-xs text-center mt-2">Ajoutez des documents aux favoris<br />pour y accéder rapidement</p>
              </div>
            ) : (
              <div className="divide-y divide-ged-border/50">
                {state.favorites.map((fav) => (
                  <MobileSearchResultItem 
                    key={fav.id} 
                    item={fav} 
                    onPreview={(doc) => {
                      actions.selectDocument(doc);
                      setShowPreview(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer mobile */}
          <MobileFooter 
            selection={selection}
            hasIntercalaires={hasIntercalaires}
            armoires={filteredArmoires}
            documents={filteredDocuments}
          />

          {/* Preview plein écran */}
          {showPreview && selection.document && (
            <MobileDocumentPreview 
              document={selection.document} 
              onClose={() => setShowPreview(false)} 
            />
          )}
        </div>
      );
    }
    
    // Rendu du contenu de la colonne active
    const renderMobileColumnContent = () => {
      switch (currentColumn?.id) {
        case 'armoire':
          return (
            <MobileColumn
              items={filteredArmoires}
              selectedId={selection.armoire?.id || null}
              onSelect={(item) => { actions.selectArmoire(item); }}
              loading={loading.armoires}
              emptyMessage="Aucune armoire"
              folderColor="text-ged-accent"
            />
          );
        case 'rayon':
          return (
            <MobileColumn
              items={filteredRayons}
              selectedId={selection.rayon?.id || null}
              onSelect={(item) => { actions.selectRayon(item); }}
              loading={loading.rayons}
              emptyMessage={selection.armoire ? "Aucun rayon" : "Sélectionnez une armoire"}
              folderColor="text-ged-secondary"
            />
          );
        case 'classeur':
          return (
            <MobileColumn
              items={filteredClasseurs}
              selectedId={selection.classeur?.id || null}
              onSelect={(item) => { actions.selectClasseur(item); }}
              loading={loading.classeurs}
              emptyMessage={selection.rayon ? "Aucun classeur" : "Sélectionnez un rayon"}
              folderColor="text-ged-primary"
            />
          );
        case 'dossier':
          return (
            <MobileColumn
              items={filteredDossiers}
              selectedId={selection.dossier?.id || null}
              onSelect={(item) => { actions.selectDossier(item); }}
              loading={loading.dossiers}
              emptyMessage={selection.classeur ? "Aucun dossier" : "Sélectionnez un classeur"}
              folderColor="text-purple-500"
            />
          );
        case 'intercalaire':
          return (
            <MobileColumn
              items={filteredIntercalaires}
              selectedId={selection.intercalaire?.id || null}
              onSelect={(item) => { actions.selectIntercalaire(item); }}
              loading={loading.intercalaires}
              emptyMessage="Aucun intercalaire"
              folderColor="text-pink-500"
            />
          );
        case 'documents':
          return (
            <div className="flex-1 overflow-y-auto bg-white">
              {loading.documents ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ged-text-muted p-8">
                  <FileText className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-sm text-center">Aucun document</p>
                </div>
              ) : (
                <div className="divide-y divide-ged-border/50">
                  {filteredDocuments.map((doc) => (
                    <MobileDocumentItem 
                      key={doc.id} 
                      doc={doc} 
                      isSelected={selection.document?.id === doc.id}
                      onSelect={handleDocumentSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-ged-surface-alt">
        {/* Barre de navigation mobile */}
        <div className="flex-shrink-0 flex items-center justify-between px-2 py-2 bg-white border-b border-ged-border">
          <button 
            onClick={goBack}
            disabled={mobileColumnIndex === 0}
            className={`p-2 rounded-lg flex-shrink-0 w-10 ${mobileColumnIndex === 0 ? 'text-gray-300' : 'text-ged-primary active:bg-ged-surface'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 text-center min-w-0 px-1">
            <div className={`font-semibold text-sm ${currentColumn?.color || ''}`}>
              {currentColumn?.title}
            </div>
            {/* Breadcrumb centré avec ellipse au milieu si trop long */}
            <div className="text-xs text-ged-text-muted truncate text-center px-2">
              {(() => {
                const parts = [
                  selection.armoire?.name,
                  selection.rayon?.name,
                  selection.classeur?.name,
                  selection.dossier?.name,
                  hasIntercalaires && selection.intercalaire?.name,
                ].filter(Boolean);
                
                if (parts.length === 0) return 'Accueil';
                if (parts.length <= 3) return parts.join(' > ');
                return `${parts[0]} > ... > ${parts[parts.length - 1]}`;
              })()}
            </div>
          </div>
          
          <button 
            onClick={goForward}
            disabled={mobileColumnIndex >= maxIndex}
            className={`p-2 rounded-lg flex-shrink-0 w-10 ${mobileColumnIndex >= maxIndex ? 'text-gray-300' : 'text-ged-primary active:bg-ged-surface'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Indicateur de progression */}
        <div className="flex-shrink-0 flex gap-1 px-4 py-2 bg-white border-b border-ged-border">
          {mobileColumns.map((col, idx) => (
            <button
              key={col.id}
              onClick={() => idx <= maxIndex && setMobileColumnIndex(idx)}
              className={`flex-1 h-1 rounded-full transition-colors ${
                idx === mobileColumnIndex 
                  ? 'bg-ged-primary' 
                  : idx <= maxIndex 
                    ? 'bg-ged-border hover:bg-ged-text-muted' 
                    : 'bg-ged-surface'
              }`}
            />
          ))}
        </div>

        {/* Contenu de la colonne active - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderMobileColumnContent()}
        </div>

        {/* Footer mobile fixe */}
        <MobileFooter 
          selection={selection}
          hasIntercalaires={hasIntercalaires}
          armoires={filteredArmoires}
          documents={filteredDocuments}
        />

        {/* Preview plein écran sur mobile */}
        {showPreview && selection.document && (
          <MobileDocumentPreview 
            document={selection.document} 
            onClose={() => setShowPreview(false)} 
          />
        )}
      </div>
    );
  }

  // =============== VERSION DESKTOP ===============
  return (
    <div className="flex flex-1 overflow-hidden bg-ged-surface-alt relative">
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex min-w-max h-full">
          {/* Colonne ARMOIRE */}
          <Column
            title="ARMOIRE"
            items={filteredArmoires}
            selectedId={selection.armoire?.id || null}
            onSelect={actions.selectArmoire}
            loading={loading.armoires}
            folderColor="text-ged-accent"
          />

          {/* Colonne RAYON */}
          <Column
            title="RAYON"
            items={filteredRayons}
            selectedId={selection.rayon?.id || null}
            onSelect={actions.selectRayon}
            loading={loading.rayons}
            emptyMessage={selection.armoire ? "Aucun rayon" : "Sélectionnez une armoire"}
            folderColor="text-ged-secondary"
          />

          {/* Colonne CLASSEUR */}
          <Column
            title="CLASSEUR"
            items={filteredClasseurs}
            selectedId={selection.classeur?.id || null}
            onSelect={actions.selectClasseur}
            loading={loading.classeurs}
            emptyMessage={selection.rayon ? "Aucun classeur" : "Sélectionnez un rayon"}
            folderColor="text-ged-primary"
          />

          {/* Colonne DOSSIER */}
          <Column
            title="DOSSIER"
            items={filteredDossiers}
            selectedId={selection.dossier?.id || null}
            onSelect={actions.selectDossier}
            loading={loading.dossiers}
            emptyMessage={selection.classeur ? "Aucun dossier" : "Sélectionnez un classeur"}
            folderColor="text-purple-500"
          />

          {/* Colonne INTERCALAIRE (visible seulement s'il y en a) */}
          {hasIntercalaires && (
            <Column
              title="INTERCALAIRE"
              items={filteredIntercalaires}
              selectedId={selection.intercalaire?.id || null}
              onSelect={actions.selectIntercalaire}
              loading={loading.intercalaires}
              emptyMessage="Sélectionnez un intercalaire"
              folderColor="text-pink-500"
            />
          )}

          {/* Zone d'affichage des documents */}
          <div className="flex-1 bg-white flex flex-col min-w-[300px] flex-shrink-0">
            <div className="column-header">
              <span>DOCUMENTS</span>
              <span className="text-[10px] font-normal text-ged-text-muted">
                {filteredDocuments.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading.documents ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ged-text-muted p-8">
                  <FileText className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-sm text-center">
                    {hasIntercalaires && !selection.intercalaire
                      ? 'Sélectionnez un intercalaire'
                      : selection.dossier || selection.intercalaire
                        ? 'Aucun document'
                        : 'Sélectionnez un dossier'}
                  </p>
                </div>
              ) : (
                <DocumentsView 
                  documents={filteredDocuments} 
                  viewMode={viewMode} 
                  selectedId={selection.document?.id || null}
                  onSelect={handleDocumentSelect}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de prévisualisation en overlay */}
      {showPreview && selection.document && (
        <DocumentPreview 
          document={selection.document} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
}

// =============== COMPOSANTS MOBILES ===============

// Colonne mobile (liste d'items)
function MobileColumn({ items, selectedId, onSelect, loading, emptyMessage, folderColor }: {
  items: ApiItem[];
  selectedId: string | null;
  onSelect: (item: ApiItem) => void;
  loading: boolean;
  emptyMessage?: string;
  folderColor: string;
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-ged-secondary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-ged-text-muted p-8">
        <Folder className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-sm text-center">{emptyMessage || 'Aucun élément'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="divide-y divide-ged-border/50">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-ged-surface ${
              selectedId === item.id ? 'bg-ged-primary text-white' : 'hover:bg-ged-surface'
            }`}
          >
            <Folder className={`w-6 h-6 flex-shrink-0 ${selectedId === item.id ? 'text-white' : folderColor}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              {item.children_count !== undefined && (
                <p className={`text-xs ${selectedId === item.id ? 'text-white/70' : 'text-ged-text-muted'}`}>
                  {item.children_count} élément(s)
                </p>
              )}
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${selectedId === item.id ? 'text-white/70' : 'text-ged-text-muted'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Item document pour mobile
function MobileDocumentItem({ doc, isSelected, onSelect }: { 
  doc: ApiItem; 
  isSelected: boolean;
  onSelect: (doc: ApiItem) => void;
}) {
  const { actions, dispatch } = useApp();
  const isFavorite = actions.isFavorite(doc.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(doc.id);
    } else {
      actions.addFavorite(doc);
    }
  };

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-ged-surface cursor-pointer ${
        isSelected ? 'bg-ged-primary text-white' : ''
      }`}
    >
      {getDocumentIcon(doc.extension)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate text-sm flex-1">{doc.name}</p>
          {isFavorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
        </div>
        <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
          .{doc.extension} • {formatSize(doc.size || 0)}
        </p>
      </div>
      
      {/* Move Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          dispatch({
            type: 'SHOW_MODAL',
            payload: {
              type: 'move',
              data: { itemId: doc.id, itemName: doc.name }
            }
          });
        }}
        className={`p-2 rounded-full ${isSelected ? 'text-white/70 hover:bg-white/20' : 'text-ged-text-muted hover:bg-ged-surface'}`}
      >
        <FolderInput className="w-5 h-5" />
      </button>

      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`} />
    </div>
  );
}

// Preview document plein écran pour mobile
function MobileDocumentPreview({ document, onClose }: { document: ApiItem; onClose: () => void }) {
  const { state, dispatch, actions } = useApp();
  const downloadUrl = getDownloadUrl(document.id, state.activeUrl || undefined);
  const previewUrl = getPreviewUrl(document.id, state.activeUrl || undefined);
  const isFavorite = actions.isFavorite(document.id);

  const getPreviewType = () => {
    const ext = document.extension?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['txt', 'md', 'json', 'xml', 'csv', 'html', 'css', 'js', 'ts', 'py', 'sh'].includes(ext)) return 'text';
    return 'none';
  };

  const previewType = getPreviewType();

  const handleFavorite = () => {
    if (isFavorite) {
      actions.removeFavorite(document.id);
    } else {
      actions.addFavorite(document);
    }
  };

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-ged-primary to-ged-secondary text-white">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate text-sm flex-1">{document.name}</h3>
            {isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-white/70">
            .{document.extension} • {formatSize(document.size || 0)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'bg-amber-500' : 'bg-white/20'} active:bg-white/30`}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
          <a
            href={downloadUrl}
            download
            className="p-2 rounded-full bg-white/20 active:bg-white/30"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 active:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Zone de prévisualisation */}
      <div 
        className="flex-1 min-h-0 overflow-auto bg-black"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {previewType === 'image' && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={previewUrl} 
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {previewType === 'pdf' && (
          <object
            data={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            type="application/pdf"
            className="w-full h-full min-h-[70vh]"
            aria-label={document.name}
          >
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full min-h-[70vh] border-0"
              title={document.name}
              allowFullScreen
            />
            <div className="p-4 text-center text-white">
              <p className="mb-2">Le PDF ne peut pas être affiché ici.</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </object>
        )}

        {previewType === 'text' && (
          <iframe
            src={previewUrl}
            className="w-full h-full min-h-[70vh] bg-white border-0"
            title={document.name}
            allowFullScreen
          />
        )}

        {previewType === 'none' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
            {getDocumentIconLarge(document.extension)}
            <p className="mt-4 text-lg font-medium">{document.name}</p>
            <p className="text-white/70 mb-6">Aperçu non disponible</p>
            <a
              href={downloadUrl}
              download
              className="px-6 py-3 bg-white text-ged-primary font-medium rounded-lg active:bg-gray-100"
            >
              Télécharger
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Footer mobile simplifié
function MobileFooter({ selection, hasIntercalaires, armoires, documents }: {
  selection: any;
  hasIntercalaires: boolean;
  armoires: ApiItem[];
  documents: ApiItem[];
}) {
  const { state } = useApp();
  
  // Déterminer l'élément sélectionné le plus profond
  const getSelectedItem = () => {
    if (selection.document) return { type: 'Doc', name: selection.document.name };
    if (selection.intercalaire) return { type: 'Int', name: selection.intercalaire.name };
    if (selection.dossier) return { type: 'Dos', name: selection.dossier.name };
    if (selection.classeur) return { type: 'Cls', name: selection.classeur.name };
    if (selection.rayon) return { type: 'Ray', name: selection.rayon.name };
    if (selection.armoire) return { type: 'Arm', name: selection.armoire.name };
    return null;
  };

  const selectedItem = getSelectedItem();

  return (
    <div 
      className="flex-shrink-0 bg-white border-t border-ged-border flex items-center px-3 gap-2 text-xs"
      style={{ 
        minHeight: '44px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        paddingTop: '8px'
      }}
    >
      {/* Indicateur connexion */}
      <svg 
        className={`w-4 h-4 flex-shrink-0 ${state.apiConnected ? 'text-emerald-500' : 'text-red-500'}`}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" fill="currentColor" />
      </svg>
      
      <div className="w-px h-5 bg-ged-border flex-shrink-0" />
      
      {selectedItem ? (
        <>
          <span className="px-1.5 py-0.5 bg-ged-surface-alt rounded text-[10px] uppercase text-ged-text-muted font-medium flex-shrink-0">
            {selectedItem.type}
          </span>
          <span className="text-ged-primary font-medium truncate flex-1 min-w-0">
            {selectedItem.name}
          </span>
        </>
      ) : (
        <div className="flex items-center gap-2 text-ged-text-muted flex-1">
          <span>{armoires.length} armoires</span>
          <span>•</span>
          <span>{documents.length} docs</span>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher les documents selon le mode de vue
function DocumentsView({ documents, viewMode, selectedId, onSelect }: { 
  documents: ApiItem[]; 
  viewMode: 'list' | 'grid' | 'details';
  selectedId: string | null;
  onSelect: (doc: ApiItem) => void;
}) {
  switch (viewMode) {
    case 'grid':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
          {documents.map((doc) => (
            <DocumentGridItem key={doc.id} doc={doc} isSelected={selectedId === doc.id} onSelect={onSelect} />
          ))}
        </div>
      );
    case 'details':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ged-surface-alt border-b border-ged-border sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-ged-text-muted">Nom</th>
                <th className="text-left px-3 py-2 font-medium text-ged-text-muted w-24">Type</th>
                <th className="text-left px-3 py-2 font-medium text-ged-text-muted w-24">Taille</th>
                <th className="text-left px-3 py-2 font-medium text-ged-text-muted w-28">Modifié</th>
                <th className="text-left px-3 py-2 font-medium text-ged-text-muted w-32">Étiquettes</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ged-border/50">
              {documents.map((doc) => (
                <DocumentTableRow key={doc.id} doc={doc} isSelected={selectedId === doc.id} onSelect={onSelect} />
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'list':
    default:
      return (
        <div className="divide-y divide-ged-border/50">
          {documents.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} isSelected={selectedId === doc.id} onSelect={onSelect} />
          ))}
        </div>
      );
  }
}

// Vue Grille - Item
function DocumentGridItem({ doc, isSelected, onSelect }: { doc: ApiItem; isSelected: boolean; onSelect?: (doc: ApiItem) => void }) {
  const { state, dispatch, actions } = useApp();
  const isFavorite = actions.isFavorite(doc.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(doc.id);
    } else {
      actions.addFavorite(doc);
    }
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(doc);
    } else {
      actions.selectDocument(doc);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDownloadUrl(doc.id, state.activeUrl || undefined);
    window.open(url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: { type: 'delete', data: { itemId: doc.id, itemName: doc.name, level: 'document' } }
    });
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.selectDocument(doc);
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } });
  };

  const handleRenameGrid = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: { type: 'rename', data: { itemId: doc.id, itemName: doc.name, level: 'document' } }
    });
  };

  const getTagColors = () => {
    if (!doc.tags || doc.tags.length === 0) return [];
    return doc.tags.slice(0, 3).map(tagName => {
      const tagInfo = state.availableTags.find(t => t.name === tagName);
      return { name: tagName, color: tagInfo?.color || '#3b82f6' };
    });
  };

  const tagColors = getTagColors();

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
        isSelected 
          ? 'border-ged-primary bg-ged-primary/5' 
          : 'border-transparent hover:border-ged-border hover:bg-ged-surface'
      }`}
    >
      {/* Icône grande */}
      <div className="w-16 h-16 flex items-center justify-center mb-2">
        {getDocumentIconLarge(doc.extension)}
      </div>
      
      {/* Nom du fichier */}
      <p className="text-xs font-medium text-center truncate w-full" title={doc.name}>
        {doc.name}
      </p>
      
      {/* Taille */}
      <p className="text-[10px] text-ged-text-muted">
        {formatSize(doc.size || 0)}
      </p>

      {/* Tags */}
      {tagColors.length > 0 && (
        <div className="flex items-center gap-0.5 mt-1">
          {tagColors.map((tag) => (
            <div
              key={tag.name}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )}

      {/* Actions au survol */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleRenameGrid} className="p-1 rounded bg-white shadow hover:bg-ged-surface" title="Renommer">
          <Edit2 className="w-3 h-3 text-ged-secondary" />
        </button>
        <button
          onClick={handleFavorite}
          className={`p-1 rounded bg-white shadow hover:bg-ged-surface ${isFavorite ? 'text-amber-500' : 'text-ged-text-muted hover:text-amber-500'}`}
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button onClick={handleTagClick} className="p-1 rounded bg-white shadow hover:bg-ged-surface" title="Étiquettes">
          <Tag className="w-3 h-3 text-ged-accent" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({
              type: 'SHOW_MODAL',
              payload: {
                type: 'move',
                data: { itemId: doc.id, itemName: doc.name }
              }
            });
          }}
          className="p-1 rounded bg-white shadow hover:bg-ged-surface"
          title="Déplacer"
        >
          <FolderInput className="w-3 h-3 text-blue-500" />
        </button>
        <button onClick={handleDownload} className="p-1 rounded bg-white shadow hover:bg-ged-surface" title="Télécharger">
          <Download className="w-3 h-3 text-ged-secondary" />
        </button>
        <button onClick={handleDelete} className="p-1 rounded bg-white shadow hover:bg-red-50" title="Supprimer">
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </div>
  );
}

// Vue Tableau - Ligne
function DocumentTableRow({ doc, isSelected, onSelect }: { doc: ApiItem; isSelected: boolean; onSelect?: (doc: ApiItem) => void }) {
  const { state, dispatch, actions } = useApp();
  const isFavorite = actions.isFavorite(doc.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(doc.id);
    } else {
      actions.addFavorite(doc);
    }
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(doc);
    } else {
      actions.selectDocument(doc);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDownloadUrl(doc.id, state.activeUrl || undefined);
    window.open(url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: { type: 'delete', data: { itemId: doc.id, itemName: doc.name, level: 'document' } }
    });
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.selectDocument(doc);
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } });
  };

  const handleRenameTable = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: { type: 'rename', data: { itemId: doc.id, itemName: doc.name, level: 'document' } }
    });
  };

  const getTagColors = () => {
    if (!doc.tags || doc.tags.length === 0) return [];
    return doc.tags.slice(0, 4).map(tagName => {
      const tagInfo = state.availableTags.find(t => t.name === tagName);
      return { name: tagName, color: tagInfo?.color || '#3b82f6' };
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  const tagColors = getTagColors();

  return (
    <tr
      onClick={handleClick}
      className={`group cursor-pointer transition-colors ${
        isSelected ? 'bg-ged-primary text-white' : 'hover:bg-ged-surface'
      }`}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {getDocumentIcon(doc.extension)}
          <span className="truncate font-medium" title={doc.name}>{doc.name}</span>
        </div>
      </td>
      <td className={`px-3 py-2 uppercase text-xs ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
        {doc.extension}
      </td>
      <td className={`px-3 py-2 ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
        {formatSize(doc.size || 0)}
      </td>
      <td className={`px-3 py-2 ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
        {formatDate(doc.modified_at)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {tagColors.map((tag) => (
            <div
              key={tag.name}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
          <button onClick={handleRenameTable} className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-ged-surface-alt'}`} title="Renommer">
            <Edit2 className={`w-4 h-4 ${isSelected ? 'text-white/70' : 'text-ged-secondary'}`} />
          </button>
          <button
            onClick={handleFavorite}
            className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-ged-surface-alt'} ${isFavorite ? 'text-amber-500' : isSelected ? 'text-white/70' : 'text-ged-secondary hover:text-amber-500'}`}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleTagClick} className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-ged-surface-alt'}`} title="Étiquettes">
            <Tag className={`w-4 h-4 ${isSelected ? 'text-white/70' : 'text-ged-accent'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dispatch({
                type: 'SHOW_MODAL',
                payload: {
                  type: 'move',
                  data: { itemId: doc.id, itemName: doc.name }
                }
              });
            }}
            className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-ged-surface-alt'}`}
            title="Déplacer"
          >
            <FolderInput className={`w-4 h-4 ${isSelected ? 'text-white/70' : 'text-blue-500'}`} />
          </button>
          <button onClick={handleDownload} className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-ged-surface-alt'}`} title="Télécharger">
            <Download className={`w-4 h-4 ${isSelected ? 'text-white/70' : 'text-ged-secondary'}`} />
          </button>
          <button onClick={handleDelete} className={`p-1 rounded ${isSelected ? 'hover:bg-white/20' : 'hover:bg-red-50'}`} title="Supprimer">
            <Trash2 className={`w-4 h-4 ${isSelected ? 'text-white/70' : 'text-red-500'}`} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Composant pour un document dans la liste
function DocumentItem({ doc, isSelected, onSelect }: { doc: ApiItem; isSelected: boolean; onSelect?: (doc: ApiItem) => void }) {
  const { state, dispatch, actions } = useApp();
  const isFavorite = actions.isFavorite(doc.id);

  const handleClick = () => {
    if (onSelect) {
      onSelect(doc);
    } else {
      actions.selectDocument(doc);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getDownloadUrl(doc.id, state.activeUrl || undefined);
    window.open(url, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        type: 'delete',
        data: { itemId: doc.id, itemName: doc.name, level: 'document' }
      }
    });
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.selectDocument(doc);
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } });
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SHOW_MODAL',
      payload: {
        type: 'rename',
        data: { itemId: doc.id, itemName: doc.name, level: 'document' }
      }
    });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      actions.removeFavorite(doc.id);
    } else {
      actions.addFavorite(doc);
    }
  };

  // Récupérer les couleurs des tags
  const getTagColors = () => {
    if (!doc.tags || doc.tags.length === 0) return [];
    return doc.tags.slice(0, 3).map(tagName => {
      const tagInfo = state.availableTags.find(t => t.name === tagName);
      return { name: tagName, color: tagInfo?.color || '#3b82f6' };
    });
  };

  const tagColors = getTagColors();
  const hasMoreTags = doc.tags && doc.tags.length > 3;

  return (
    <div
      onClick={handleClick}
      className={`list-item group ${isSelected ? 'selected' : ''}`}
    >
      {getDocumentIcon(doc.extension)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{doc.name}</span>
          {/* Indicateur des étiquettes */}
          {tagColors.length > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {tagColors.map((tag, i) => (
                <div
                  key={tag.name}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                />
              ))}
              {hasMoreTags && (
                <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
                  +{doc.tags!.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-ged-text-muted'}`}>
          .{doc.extension} • {formatSize(doc.size || 0)}
        </div>
      </div>
      
      {/* Actions */}
      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
        <button
          onClick={handleRename}
          className={`p-1 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-ged-text-muted hover:text-ged-secondary hover:bg-ged-surface-alt'}`}
          title="Renommer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleFavorite}
          className={`p-1 rounded ${
            isFavorite 
              ? 'text-amber-500 hover:text-amber-600' 
              : isSelected 
                ? 'text-white/70 hover:text-amber-400' 
                : 'text-ged-text-muted hover:text-amber-500 hover:bg-amber-50'
          }`}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={handleTagClick}
          className={`p-1 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-ged-text-muted hover:text-ged-accent hover:bg-ged-surface-alt'}`}
          title="Étiquettes"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({
              type: 'SHOW_MODAL',
              payload: {
                type: 'move',
                data: { itemId: doc.id, itemName: doc.name }
              }
            });
          }}
          className={`p-1 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-ged-text-muted hover:text-blue-500 hover:bg-blue-50'}`}
          title="Déplacer"
        >
          <FolderInput className="w-4 h-4" />
        </button>
        <button
          onClick={handleDownload}
          className={`p-1 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-ged-text-muted hover:text-ged-secondary hover:bg-ged-surface-alt'}`}
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className={`p-1 rounded ${isSelected ? 'text-white/70 hover:text-white' : 'text-ged-text-muted hover:text-red-500 hover:bg-red-50'}`}
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Helper pour formater la taille
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// Composant de prévisualisation de document en overlay
function DocumentPreview({ document, onClose }: { document: ApiItem; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const downloadUrl = getDownloadUrl(document.id, state.activeUrl || undefined);
  const previewUrl = getPreviewUrl(document.id, state.activeUrl || undefined);
  
  // Déterminer le type de preview
  const getPreviewType = (ext?: string): 'image' | 'pdf' | 'text' | 'office' | 'none' => {
    if (!ext) return 'none';
    const extension = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return 'image';
    if (extension === 'pdf') return 'pdf';
    if (['txt', 'md', 'json', 'xml', 'csv', 'log', 'html', 'css', 'js', 'ts', 'py', 'sh'].includes(extension)) return 'text';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'office';
    return 'none';
  };

  const previewType = getPreviewType(document.extension);

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  const handleTagClick = () => {
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } });
  };

  const handleRename = () => {
    dispatch({ 
      type: 'SHOW_MODAL', 
      payload: { 
        type: 'rename', 
        data: { itemId: document.id, itemName: document.name, level: 'document' } 
      } 
    });
  };

  // Récupérer les couleurs des tags
  const getTagColors = () => {
    if (!document.tags || document.tags.length === 0) return [];
    return document.tags.map(tagName => {
      const tagInfo = state.availableTags.find(t => t.name === tagName);
      return { name: tagName, color: tagInfo?.color || '#3b82f6' };
    });
  };

  const tagColors = getTagColors();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Fermer avec Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 flex">
      {/* Fond semi-transparent cliquable pour fermer */}
      <div 
        className="w-1/2 bg-black/30 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Panneau de preview à droite */}
      <div className="w-1/2 bg-white flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header du panneau */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ged-border bg-gradient-to-r from-ged-primary to-ged-secondary">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              {getDocumentIconWhite(document.extension)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-white truncate" title={document.name}>
                {document.name}
              </h3>
              <p className="text-xs text-white/70">
                {document.extension?.toUpperCase()} • {formatSize(document.size || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRename}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Renommer"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleTagClick}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Étiquettes"
            >
              <Tag className="w-5 h-5" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Fermer (Échap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-hidden bg-ged-surface-alt">
          {previewType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {previewType === 'pdf' && (
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={document.name}
              />
            </object>
          )}
          
          {previewType === 'text' && (
            <iframe
              src={previewUrl}
              className="w-full h-full bg-white border-0"
              title={document.name}
            />
          )}

          {previewType === 'office' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-white rounded-xl shadow-lg">
                {getDocumentIconLarge(document.extension)}
              </div>
              <h4 className="font-medium text-ged-text mb-2">Document Office</h4>
              <p className="text-sm text-ged-text-muted mb-4 text-center">
                Les documents Office ne peuvent pas être prévisualisés directement.<br/>
                Téléchargez-le pour l'ouvrir.
              </p>
              <button onClick={handleDownload} className="btn btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </button>
            </div>
          )}
          
          {previewType === 'none' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 mb-4 flex items-center justify-center bg-white rounded-xl shadow-lg">
                {getDocumentIconLarge(document.extension)}
              </div>
              <h4 className="font-medium text-ged-text mb-2">Aperçu non disponible</h4>
              <p className="text-sm text-ged-text-muted mb-4 text-center">
                Ce type de fichier ne peut pas être prévisualisé.
              </p>
              <button onClick={handleDownload} className="btn btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>

        {/* Footer avec infos */}
        <div className="px-4 py-3 border-t border-ged-border bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-ged-text-muted">
              <span>Modifié le {formatDate(document.modified_at)}</span>
            </div>
            {tagColors.length > 0 && (
              <div className="flex items-center gap-1">
                {tagColors.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icônes blanches pour le header de la preview
const getDocumentIconWhite = (extension?: string) => {
  if (!extension) return <File className="w-5 h-5 text-white" />;
  
  const ext = extension.toLowerCase();
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FileText className="w-5 h-5 text-white" />,
    jpg: <Image className="w-5 h-5 text-white" />,
    jpeg: <Image className="w-5 h-5 text-white" />,
    png: <Image className="w-5 h-5 text-white" />,
    gif: <Image className="w-5 h-5 text-white" />,
    webp: <Image className="w-5 h-5 text-white" />,
    doc: <FileType className="w-5 h-5 text-white" />,
    docx: <FileType className="w-5 h-5 text-white" />,
    xls: <FileSpreadsheet className="w-5 h-5 text-white" />,
    xlsx: <FileSpreadsheet className="w-5 h-5 text-white" />,
    zip: <Archive className="w-5 h-5 text-white" />,
    rar: <Archive className="w-5 h-5 text-white" />,
  };
  
  return iconMap[ext] || <File className="w-5 h-5 text-white" />;
};
