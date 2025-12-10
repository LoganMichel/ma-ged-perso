'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { ApiItem, TreeNode, ApiStats } from './api';

// Hook pour charger les armoires
export function useArmoires() {
  const [armoires, setArmoires] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getArmoires();
      setArmoires(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { armoires, loading, error, refresh };
}

// Hook pour naviguer dans un dossier
export function useBrowse(itemId: string | null) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browse = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.browse(id);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de navigation');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId) {
      browse(itemId);
    } else {
      setItems([]);
    }
  }, [itemId, browse]);

  return { items, loading, error, refresh: () => itemId && browse(itemId) };
}

// Hook pour l'arborescence complète
export function useTree(maxDepth = 4) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTree(maxDepth);
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [maxDepth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tree, loading, error, refresh };
}

// Hook pour les statistiques
export function useStats() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(err => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

// Hook pour la recherche
export function useSearch() {
  const [results, setResults] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: { type?: string; extension?: string }) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.search(query, options);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}

// Hook pour les opérations CRUD
export function useGedOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArmoire = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      return await api.createArmoire(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de création');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (parentId: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      return await api.createFolder(parentId, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de création');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (parentId: string, file: File) => {
    try {
      setLoading(true);
      setError(null);
      return await api.uploadDocument(parentId, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'upload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (parentId: string, files: File[]) => {
    try {
      setLoading(true);
      setError(null);
      return await api.uploadMultipleDocuments(parentId, files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'upload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rename = useCallback(async (itemId: string, newName: string) => {
    try {
      setLoading(true);
      setError(null);
      return await api.renameItem(itemId, newName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de renommage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await api.deleteItem(itemId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDownloadUrl = useCallback((itemId: string) => {
    return api.getDownloadUrl(itemId);
  }, []);

  return {
    loading,
    error,
    createArmoire,
    createFolder,
    uploadDocument,
    uploadMultiple,
    rename,
    remove,
    getDownloadUrl,
  };
}

// Hook pour vérifier la connexion à l'API
export function useApiHealth() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      setChecking(true);
      await api.checkHealth();
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    // Vérifier toutes les 30 secondes
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  return { connected, checking, check };
}
