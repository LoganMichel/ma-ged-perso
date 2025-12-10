'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, FolderPlus, AlertTriangle, FileText, Info, Loader2, Tag, Plus, Trash2, Check, Edit2, Search } from 'lucide-react';
import { useApp } from '@/lib/store-api';

export default function Modal() {
  const { state, dispatch } = useApp();
  const { modal } = state;

  if (!modal.type) return null;

  const handleClose = () => {
    dispatch({ type: 'HIDE_MODAL' });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {modal.type === 'create' && <CreateModal onClose={handleClose} data={modal.data} />}
        {modal.type === 'rename' && <RenameModal onClose={handleClose} data={modal.data} />}
        {modal.type === 'upload' && <UploadModal onClose={handleClose} />}
        {modal.type === 'delete' && <DeleteModal onClose={handleClose} data={modal.data} />}
        {modal.type === 'move' && <MoveModal onClose={handleClose} data={modal.data} />}
        {modal.type === 'details' && <DetailsModal onClose={handleClose} />}
        {modal.type === 'tags' && <TagsModal onClose={handleClose} />}
        {modal.type === 'manageTags' && <ManageTagsModal onClose={handleClose} />}
      </div>
    </div>
  );
}

function CreateModal({ onClose, data }: { onClose: () => void; data?: any }) {
  const { state, actions } = useApp();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemType = data?.itemType || 'dossier';
  const labels: Record<string, string> = { armoire: 'armoire', rayon: 'rayon', classeur: 'classeur', dossier: 'dossier', intercalaire: 'intercalaire' };

  const getParentId = (): string | null => {
    switch (itemType) {
      case 'rayon': return state.selection.armoire?.id || null;
      case 'classeur': return state.selection.rayon?.id || null;
      case 'dossier': return state.selection.classeur?.id || null;
      case 'intercalaire': return state.selection.dossier?.id || null;
      default: return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await actions.createItem(getParentId(), name.trim(), itemType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-secondary/10 rounded-lg"><FolderPlus className="w-5 h-5 text-ged-secondary" /></div>
          <h2 className="font-display font-semibold text-lg">Créer un(e) {labels[itemType]}</h2>
        </div>
        <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"><AlertTriangle className="w-4 h-4" /><span>{error}</span></div>}
        <div>
          <label className="block text-sm font-medium text-ged-text mb-1.5">Nom</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Nom de l'${labels[itemType]}`} className="input" autoFocus disabled={loading} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}</button>
        </div>
      </form>
    </>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [filesWithNames, setFilesWithNames] = useState<{ file: File; customName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files).map(file => ({
      file,
      customName: file.name.replace(/\.[^/.]+$/, '') // Nom sans extension
    }));
    setFilesWithNames(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        customName: file.name.replace(/\.[^/.]+$/, '') // Nom sans extension
      }));
      setFilesWithNames(prev => [...prev, ...newFiles]);
    }
  };

  const handleNameChange = (index: number, newName: string) => {
    setFilesWithNames(prev => prev.map((item, i) => 
      i === index ? { ...item, customName: newName } : item
    ));
  };

  const getExtension = (filename: string) => {
    const match = filename.match(/\.([^/.]+)$/);
    return match ? match[1] : '';
  };

  // Le parent pour l'upload : intercalaire si présent, sinon dossier (si pas d'intercalaires)
  const hasIntercalaires = state.intercalaires && state.intercalaires.length > 0;
  const uploadParent = state.selection.intercalaire || (!hasIntercalaires ? state.selection.dossier : null);
  const canUpload = !!uploadParent;

  const handleUpload = async () => {
    if (!uploadParent || filesWithNames.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Créer des fichiers renommés si nécessaire
      const filesToUpload = filesWithNames.map(({ file, customName }) => {
        const ext = getExtension(file.name);
        const newName = `${customName}.${ext}`;
        if (newName !== file.name) {
          // Créer un nouveau fichier avec le nom personnalisé
          return new File([file], newName, { type: file.type });
        }
        return file;
      });
      await actions.uploadFiles(uploadParent.id, filesToUpload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFilesWithNames(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-accent/10 rounded-lg"><Upload className="w-5 h-5 text-ged-accent" /></div>
          <h2 className="font-display font-semibold text-lg">Importer des documents</h2>
        </div>
        <button onClick={onClose} className="btn-icon" disabled={loading}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        {!canUpload && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {hasIntercalaires 
                ? 'Sélectionnez un intercalaire pour importer'
                : 'Sélectionnez un dossier pour importer'}
            </span>
          </div>
        )}
        {canUpload && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <Info className="w-4 h-4" />
            <span>
              Import dans : <strong>{uploadParent?.name}</strong>
            </span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertTriangle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        
        <div 
          className={`drop-zone ${isDragging ? 'active' : ''} ${!canUpload || loading ? 'opacity-50 pointer-events-none' : ''}`} 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
          onDragLeave={() => setIsDragging(false)} 
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <Upload className="w-12 h-12 text-ged-text-muted" />
            <div>
              <p className="font-medium">Glissez-déposez vos fichiers</p>
              <p className="text-sm text-ged-text-muted mt-1">
                ou <label className="text-ged-secondary cursor-pointer hover:underline">
                  parcourez
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} disabled={!canUpload || loading} />
                </label>
              </p>
            </div>
          </div>
        </div>

        {filesWithNames.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{filesWithNames.length} fichier(s) - Modifiez les noms si nécessaire</p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filesWithNames.map((item, i) => {
                const ext = getExtension(item.file.name);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 bg-ged-surface rounded-lg">
                    <FileText className="w-4 h-4 text-ged-text-muted flex-shrink-0" />
                    <input
                      type="text"
                      value={item.customName}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-ged-border rounded focus:outline-none focus:ring-2 focus:ring-ged-secondary focus:border-transparent"
                      disabled={loading}
                    />
                    <span className="text-xs text-ged-text-muted flex-shrink-0">.{ext}</span>
                    <button 
                      onClick={() => removeFile(i)} 
                      className="text-ged-text-muted hover:text-red-500 flex-shrink-0"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Annuler</button>
          <button 
            onClick={handleUpload} 
            className="btn btn-primary" 
            disabled={filesWithNames.length === 0 || !canUpload || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Importer'}
          </button>
        </div>
      </div>
    </>
  );
}

function RenameModal({ onClose, data }: { onClose: () => void; data?: any }) {
  const { actions } = useApp();
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentName = data?.itemName || '';
  const itemId = data?.itemId || '';
  const level = data?.level || 'document';
  const isDocument = level === 'document';

  // Extraire le nom sans extension pour les documents
  const getNameWithoutExtension = (name: string) => {
    if (!isDocument) return name;
    return name.replace(/\.[^/.]+$/, '');
  };

  const getExtension = (name: string) => {
    const match = name.match(/\.([^/.]+)$/);
    return match ? match[1] : '';
  };

  useEffect(() => {
    setNewName(getNameWithoutExtension(currentName));
  }, [currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !itemId) return;

    setLoading(true);
    setError(null);

    try {
      // Pour les documents, réajouter l'extension
      const finalName = isDocument ? `${newName.trim()}.${getExtension(currentName)}` : newName.trim();
      await actions.renameItem(itemId, finalName, level);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renommage');
      setLoading(false);
    }
  };

  const extension = isDocument ? getExtension(currentName) : null;

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-secondary/10 rounded-lg">
            <FileText className="w-5 h-5 text-ged-secondary" />
          </div>
          <h2 className="font-display font-semibold text-lg">Renommer</h2>
        </div>
        <button onClick={onClose} className="btn-icon" disabled={loading}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertTriangle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Nom actuel</label>
          <p className="text-sm text-ged-text-muted bg-ged-surface px-3 py-2 rounded-lg">{currentName}</p>
        </div>

        <div>
          <label htmlFor="newName" className="block text-sm font-medium mb-2">Nouveau nom</label>
          <div className="flex items-center gap-2">
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input flex-1"
              placeholder="Entrez le nouveau nom"
              autoFocus
              disabled={loading}
            />
            {extension && (
              <span className="text-sm text-ged-text-muted">.{extension}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!newName.trim() || newName.trim() === getNameWithoutExtension(currentName) || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Renommer'}
          </button>
        </div>
      </form>
    </>
  );
}

function DeleteModal({ onClose, data }: { onClose: () => void; data?: any }) {
  const { actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!data?.itemId || !data?.level) return;
    setLoading(true);
    setError(null);
    try {
      await actions.deleteItem(data.itemId, data.level);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <h2 className="font-display font-semibold text-lg">Confirmer la suppression</h2>
        </div>
        <button onClick={onClose} className="btn-icon" disabled={loading}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"><AlertTriangle className="w-4 h-4" /><span>{error}</span></div>}
        <p>Supprimer <strong>{data?.itemName}</strong> ? {data?.level !== 'document' && 'Tous les éléments contenus seront supprimés.'}<br/><span className="text-red-600 text-sm">Action irréversible.</span></p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Annuler</button>
          <button onClick={handleDelete} className="btn bg-red-600 text-white hover:bg-red-700" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}</button>
        </div>
      </div>
    </>
  );
}

function MoveModal({ onClose, data }: { onClose: () => void; data?: any }) {
  const { actions, state } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  
  // Arborescence simplifiée pour le déplacement
  const [tree, setTree] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);

  const [query, setQuery] = useState('');

  // Charger l'arborescence pour la sélection
  useEffect(() => {
    async function loadTree() {
      try {
        const fullTree = await actions.getTree();
        setTree(fullTree);
      } catch (err) {
        console.error("Erreur chargement arbre", err);
      } finally {
        setLoadingTree(false);
      }
    }
    loadTree();
  }, [actions]);

  // Filtrer l'arbre
  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree;

    const filterNodes = (nodes: any[]): any[] => {
      return nodes.reduce((acc, node) => {
        const matches = node.name.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        
        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };

    return filterNodes(tree);
  }, [tree, query]);

  const handleMove = async () => {
    if (!data?.itemId || !targetId) return;
    setLoading(true);
    setError(null);
    try {
      await actions.moveItem(data.itemId, targetId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du déplacement');
      setLoading(false);
    }
  };

  // Composant récursif pour afficher l'arbre
  const TreeItem = ({ node, level = 0 }: { node: any, level?: number }) => {
    // Ne pas permettre de déplacer un dossier dans lui-même ou ses enfants
    const isSelfOrChild = data?.itemId === node.id; // Simplification, idéalement vérifier toute la descendance
    // Ne pas permettre de sélectionner le dossier courant comme destination
    // const isCurrentParent = ... 
    
    // Si on filtre, on affiche toujours les items (pas d'indentation stricte, ou max level ?)
    // En fait l'indentation aide à comprendre la hiérarchie même filtrée.

    const isValidTarget = !isSelfOrChild && ['armoire', 'rayon', 'classeur', 'dossier', 'intercalaire'].includes(node.type);
    
    // Si c'est un document, on ne l'affiche pas comme cible potentielle
    if (node.type === 'document') return null;

    return (
      <>
        <div 
          className={`flex items-center gap-2 p-2 rounded cursor-pointer ${targetId === node.id ? 'bg-ged-primary text-white' : 'hover:bg-ged-surface'}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => isValidTarget && setTargetId(node.id)}
        >
          {targetId === node.id && <Check className="w-4 h-4" />}
          <div className="w-4 h-4 rounded-full bg-current opacity-20" /> {/* Placeholder icon */}
          <span className={`text-sm ${!isValidTarget ? 'opacity-50' : ''}`}>{node.name}</span>
        </div>
        {node.children && node.children.map((child: any) => (
          <TreeItem key={child.id} node={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><FolderPlus className="w-5 h-5 text-blue-600" /></div>
          <h2 className="font-display font-semibold text-lg">Déplacer {data?.itemName}</h2>
        </div>
        <button onClick={onClose} className="btn-icon" disabled={loading}><X className="w-5 h-5" /></button>
      </div>
      
      <div className="p-4 flex flex-col h-[500px]">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4"><AlertTriangle className="w-4 h-4" /><span>{error}</span></div>}
        
        <p className="mb-2 text-sm font-medium">Sélectionnez la destination :</p>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un dossier..."
            className="w-full pl-9 pr-3 py-2 border border-ged-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ged-primary/20 focus:border-ged-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-ged-border rounded-lg p-2">
          {loadingTree ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ged-text-muted">
              <p className="text-sm">Aucun dossier trouvé</p>
            </div>
          ) : (
            filteredTree.map(node => <TreeItem key={node.id} node={node} />)
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Annuler</button>
          <button 
            onClick={handleMove} 
            className="btn btn-primary" 
            disabled={!targetId || loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Déplacer'}
          </button>
        </div>
      </div>
    </>
  );
}

function DetailsModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const doc = state.selection.document;
  if (!doc) return null;
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; } };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-secondary/10 rounded-lg"><Info className="w-5 h-5 text-ged-secondary" /></div>
          <h2 className="font-display font-semibold text-lg">Détails</h2>
        </div>
        <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-ged-text-muted mb-1">Nom</p><p className="font-medium">{doc.name}</p></div>
          <div><p className="text-ged-text-muted mb-1">Extension</p><p className="font-medium">.{doc.extension}</p></div>
          <div><p className="text-ged-text-muted mb-1">Taille</p><p className="font-medium">{((doc.size || 0) / 1024).toFixed(1)} Ko</p></div>
          <div><p className="text-ged-text-muted mb-1">Modifié</p><p className="font-medium">{formatDate(doc.modified_at)}</p></div>
          <div className="col-span-2"><p className="text-ged-text-muted mb-1">Chemin</p><p className="font-mono text-xs bg-ged-surface-alt p-2 rounded">{doc.path}</p></div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2"><p className="text-ged-text-muted">Étiquettes</p><button onClick={() => dispatch({ type: 'SHOW_MODAL', payload: { type: 'tags' } })} className="text-xs text-ged-secondary hover:underline">Modifier</button></div>
            <div className="flex flex-wrap gap-1">{state.selectedItemTags.length > 0 ? state.selectedItemTags.map((tag) => { const t = state.availableTags.find(x => x.name === tag); return <span key={tag} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: t?.color || '#3b82f6' }}>{tag}</span>; }) : <span className="text-ged-text-muted text-xs">Aucune</span>}</div>
          </div>
        </div>
        <div className="flex justify-end pt-2"><button onClick={onClose} className="btn btn-secondary">Fermer</button></div>
      </div>
    </>
  );
}

function TagsModal({ onClose }: { onClose: () => void }) {
  const { state, actions, dispatch } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [docTags, setDocTags] = useState<string[]>([]);
  const doc = state.selection.document;

  // Charger les tags du document à l'ouverture
  useEffect(() => {
    if (doc) {
      // Utiliser les tags du document s'ils existent déjà
      if (doc.tags && doc.tags.length > 0) {
        setDocTags(doc.tags);
        setInitialLoading(false);
      } else {
        // Sinon charger depuis l'API
        actions.loadItemTags(doc.id).then(() => {
          setDocTags(state.selectedItemTags);
          setInitialLoading(false);
        });
      }
    }
  }, [doc]);

  // Synchroniser avec le state global
  useEffect(() => {
    setDocTags(state.selectedItemTags);
  }, [state.selectedItemTags]);

  if (!doc) return null;

  const handleToggle = async (tagName: string) => {
    setLoading(tagName);
    try {
      if (docTags.includes(tagName)) {
        await actions.removeTagFromItem(doc.id, tagName);
        setDocTags(prev => prev.filter(t => t !== tagName));
      } else {
        await actions.addTagToItem(doc.id, tagName);
        setDocTags(prev => [...prev, tagName]);
      }
    } finally { 
      setLoading(null); 
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-accent/10 rounded-lg"><Tag className="w-5 h-5 text-ged-accent" /></div>
          <h2 className="font-display font-semibold text-lg">Étiquettes</h2>
        </div>
        <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-ged-text-muted truncate">Document : <span className="font-medium text-ged-text">{doc.name}</span></p>
        
        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-ged-secondary" />
          </div>
        ) : state.availableTags.length === 0 ? (
          <div className="text-center py-8 text-ged-text-muted">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune étiquette disponible</p>
            <p className="text-sm mt-1">Créez des étiquettes depuis le menu "Gérer les étiquettes"</p>
          </div>
        ) : (
          <div className="space-y-2">{state.availableTags.map((tag) => { 
            const sel = docTags.includes(tag.name); 
            const ld = loading === tag.name; 
            return (
              <button key={tag.name} onClick={() => handleToggle(tag.name)} disabled={ld} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${sel ? 'border-ged-secondary bg-ged-secondary/5' : 'border-ged-border hover:border-ged-secondary/50'}`}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="flex-1 text-left font-medium">{tag.name}</span>
                {ld ? <Loader2 className="w-4 h-4 animate-spin" /> : sel ? <Check className="w-4 h-4 text-ged-secondary" /> : null}
              </button>
            ); 
          })}</div>
        )}
        <div className="flex justify-end pt-2"><button onClick={onClose} className="btn btn-secondary">Fermer</button></div>
      </div>
    </>
  );
}

function ManageTagsModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);
  const [delLoading, setDelLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = ['#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try { await actions.createTag(name.trim(), color); setName(''); } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); } finally { setLoading(false); }
  };

  const handleDelete = async (tagName: string) => {
    setDelLoading(tagName);
    try { await actions.deleteTag(tagName); } finally { setDelLoading(null); }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-ged-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ged-accent/10 rounded-lg"><Tag className="w-5 h-5 text-ged-accent" /></div>
          <h2 className="font-display font-semibold text-lg">Gérer les étiquettes</h2>
        </div>
        <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-4 space-y-4">
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"><AlertTriangle className="w-4 h-4" /><span>{error}</span></div>}
          <div className="flex gap-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'étiquette" className="input flex-1" disabled={loading} />
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}</button>
          </div>
          <div className="flex flex-wrap gap-2">{colors.map((c) => <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ged-primary' : ''}`} style={{ backgroundColor: c }} />)}</div>
        </form>
        <div className="border-t border-ged-border pt-4">
          <h3 className="text-sm font-medium text-ged-text-muted mb-3">Existantes</h3>
          {state.availableTags.length === 0 ? <p className="text-center py-4 text-ged-text-muted text-sm">Aucune</p> : (
            <div className="space-y-2 max-h-60 overflow-y-auto">{state.availableTags.map((tag) => (
              <div key={tag.name} className="flex items-center gap-3 p-2 rounded-lg bg-ged-surface">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="flex-1 font-medium">{tag.name}</span>
                <span className="text-xs text-ged-text-muted bg-white px-2 py-0.5 rounded-full">{tag.count}</span>
                <button onClick={() => handleDelete(tag.name)} disabled={delLoading === tag.name} className="p-1 text-ged-text-muted hover:text-red-500">{delLoading === tag.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
              </div>
            ))}</div>
          )}
        </div>
        <div className="flex justify-end pt-2"><button onClick={onClose} className="btn btn-secondary">Fermer</button></div>
      </div>
    </>
  );
}
