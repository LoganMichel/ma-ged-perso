/**
 * Service API pour communiquer avec Ma GED API
 */

// Déclaration globale pour la config runtime
declare global {
  interface Window {
    __ENV__?: {
      API_URLS?: string[];
    };
  }
}

// Configuration par défaut - URLs possibles pour l'API
// Ces valeurs sont utilisées si aucun fichier config n'est chargé
const FALLBACK_API_URLS = [
  'http://192.168.1.100:8000',
  'http://localhost:8000',
];

// Clé localStorage pour les URLs personnalisées
const STORAGE_KEY = 'ged-api-urls';

/**
 * Récupère les URLs configurées
 * Priorité : 
 * 1. LocalStorage (si défini par l'utilisateur)
 * 2. Configuration Runtime (window.__ENV__)
 * 3. Fallback hardcodé
 */
export function getConfiguredUrls(): string[] {
  if (typeof window === 'undefined') return FALLBACK_API_URLS;
  
  // 1. LocalStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const urls = JSON.parse(saved);
      if (Array.isArray(urls) && urls.length > 0) {
        return urls;
      }
    }
  } catch {}
  
  // 2. Runtime Config
  if (window.__ENV__?.API_URLS && Array.isArray(window.__ENV__.API_URLS) && window.__ENV__.API_URLS.length > 0) {
    return window.__ENV__.API_URLS;
  }
  
  // 3. Fallback
  return FALLBACK_API_URLS;
}

/**
 * Sauvegarde les URLs personnalisées
 */
export function setConfiguredUrls(urls: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
    // Réinitialiser l'URL active pour forcer une nouvelle détection
    activeApiUrl = null;
  } catch {}
}

/**
 * Réinitialise les URLs aux valeurs par défaut
 */
export function resetConfiguredUrls(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    activeApiUrl = null;
  } catch {}
}

// URL active (sera déterminée automatiquement)
let activeApiUrl: string | null = null;

/**
 * Détermine l'URL de l'API à utiliser en testant les connexions
 */
async function detectApiUrl(): Promise<string> {
  // Si déjà détectée, la retourner
  if (activeApiUrl) {
    return activeApiUrl;
  }

  const urls = getConfiguredUrls();

  // Tester chaque URL
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout 2s
      
      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`API détectée sur: ${url}`);
        activeApiUrl = url;
        return url;
      }
    } catch (err) {
      console.log(`API non disponible sur: ${url}`);
    }
  }

  // Fallback sur la première URL si aucune ne répond
  console.warn('Aucune API détectée, utilisation de l\'URL par défaut');
  activeApiUrl = urls[0];
  return activeApiUrl;
}

/**
 * Réinitialise l'URL détectée (utile si le réseau change)
 */
export function resetApiUrl(): void {
  activeApiUrl = null;
}

/**
 * Retourne l'URL active actuelle
 */
export function getActiveApiUrl(): string | null {
  return activeApiUrl;
}

// Types
export interface ApiItem {
  id: string;
  name: string;
  type: 'armoire' | 'rayon' | 'classeur' | 'dossier' | 'intercalaire' | 'document';
  path: string;
  created_at: string;
  modified_at: string;
  size?: number;
  extension?: string;
  mime_type?: string;
  children_count?: number;
  tags?: string[];  // Étiquettes du fichier
  has_intercalaires?: boolean;  // Pour les dossiers: indique si contient des intercalaires
}

export interface TreeNode {
  id: string;
  name: string;
  type: string;
  path: string;
  children?: TreeNode[];
}

export interface ApiStats {
  total_armoires: number;
  total_rayons: number;
  total_classeurs: number;
  total_dossiers: number;
  total_documents: number;
  total_size: number;
  extensions: Record<string, number>;
}

// Helpers
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = await detectApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erreur inconnue' }));
    throw new Error(error.detail || `Erreur ${response.status}`);
  }

  return response.json();
}

async function fetchApiWithFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const baseUrl = await detectApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erreur inconnue' }));
    throw new Error(error.detail || `Erreur ${response.status}`);
  }

  return response.json();
}

// ============== API FUNCTIONS ==============

/**
 * Vérifie la santé de l'API (et détecte l'URL active)
 */
export async function checkHealth(): Promise<{ status: string; ged_root_exists: boolean }> {
  const baseUrl = await detectApiUrl();
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    throw new Error('API non disponible');
  }
  return response.json();
}

/**
 * Récupère l'arborescence complète
 */
export async function getTree(maxDepth = 4): Promise<TreeNode[]> {
  return fetchApi(`/api/tree?max_depth=${maxDepth}`);
}

/**
 * Liste toutes les armoires
 */
export async function getArmoires(): Promise<ApiItem[]> {
  return fetchApi('/api/armoires');
}

/**
 * Liste le contenu d'un élément
 */
export async function browse(itemId: string): Promise<ApiItem[]> {
  return fetchApi(`/api/browse/${encodeURIComponent(itemId)}`);
}

/**
 * Récupère les informations d'un élément
 */
export async function getItem(itemId: string): Promise<ApiItem> {
  return fetchApi(`/api/item/${encodeURIComponent(itemId)}`);
}

/**
 * Crée une nouvelle armoire
 */
export async function createArmoire(name: string): Promise<ApiItem> {
  return fetchApi('/api/armoires', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Crée un nouveau dossier dans un parent
 */
export async function createFolder(parentId: string, name: string): Promise<ApiItem> {
  return fetchApi(`/api/create/${encodeURIComponent(parentId)}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Upload un document
 */
export async function uploadDocument(parentId: string, file: File): Promise<ApiItem> {
  const formData = new FormData();
  formData.append('file', file);
  return fetchApiWithFormData(`/api/upload/${encodeURIComponent(parentId)}`, formData);
}

/**
 * Upload plusieurs documents
 */
export async function uploadMultipleDocuments(parentId: string, files: File[]): Promise<ApiItem[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  return fetchApiWithFormData(`/api/upload-multiple/${encodeURIComponent(parentId)}`, formData);
}

/**
 * Télécharge un document - retourne l'URL de téléchargement
 */
export function getDownloadUrl(itemId: string, baseUrl?: string): string {
  // Utiliser l'URL fournie, l'URL active ou la première par défaut
  const rootUrl = baseUrl || activeApiUrl || getConfiguredUrls()[0];
  return `${rootUrl}/api/download/${encodeURIComponent(itemId)}`;
}

/**
 * Génère l'URL de prévisualisation d'un document (affichage inline)
 */
export function getPreviewUrl(itemId: string, baseUrl?: string): string {
  // Utiliser l'URL fournie, l'URL active ou la première par défaut
  const rootUrl = baseUrl || activeApiUrl || getConfiguredUrls()[0];
  return `${rootUrl}/api/preview/${encodeURIComponent(itemId)}`;
}

/**
 * Renomme un élément
 */
export async function renameItem(itemId: string, newName: string): Promise<ApiItem> {
  return fetchApi(`/api/rename/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify({ new_name: newName }),
  });
}

/**
 * Supprime un élément
 */
export async function deleteItem(itemId: string): Promise<{ message: string; path: string }> {
  return fetchApi(`/api/delete/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

/**
 * Déplace un élément
 */
export async function moveItem(itemId: string, destinationId: string): Promise<ApiItem> {
  return fetchApi(`/api/move/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify({ destination_id: destinationId }),
  });
}

/**
 * Recherche dans la GED
 */
export async function search(
  query: string,
  options?: { type?: string; extension?: string }
): Promise<ApiItem[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.type) params.append('type', options.type);
  if (options?.extension) params.append('extension', options.extension);
  
  return fetchApi(`/api/search?${params.toString()}`);
}

/**
 * Récupère les statistiques
 */
export async function getStats(): Promise<ApiStats> {
  return fetchApi('/api/stats');
}

// ============== ÉTIQUETTES (TAGS) ==============

export interface TagInfo {
  name: string;
  color: string;
  count: number;
}

/**
 * Liste toutes les étiquettes disponibles
 */
export async function getTags(): Promise<TagInfo[]> {
  return fetchApi('/api/tags');
}

/**
 * Crée une nouvelle étiquette
 */
export async function createTag(name: string, color: string = '#3b82f6'): Promise<TagInfo> {
  return fetchApi('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

/**
 * Supprime une étiquette
 */
export async function deleteTag(tagName: string): Promise<{ message: string }> {
  return fetchApi(`/api/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
}

/**
 * Récupère les étiquettes d'un élément
 */
export async function getItemTags(itemId: string): Promise<string[]> {
  return fetchApi(`/api/item/${encodeURIComponent(itemId)}/tags`);
}

/**
 * Définit les étiquettes d'un élément
 */
export async function setItemTags(itemId: string, tags: string[]): Promise<string[]> {
  return fetchApi(`/api/item/${encodeURIComponent(itemId)}/tags`, {
    method: 'PUT',
    body: JSON.stringify({ tags }),
  });
}

/**
 * Ajoute une étiquette à un élément
 */
export async function addTagToItem(itemId: string, tagName: string): Promise<{ tags: string[] }> {
  return fetchApi(`/api/item/${encodeURIComponent(itemId)}/tags/${encodeURIComponent(tagName)}`, {
    method: 'POST',
  });
}

/**
 * Retire une étiquette d'un élément
 */
export async function removeTagFromItem(itemId: string, tagName: string): Promise<{ tags: string[] }> {
  return fetchApi(`/api/item/${encodeURIComponent(itemId)}/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
}

/**
 * Récupère tous les éléments ayant une étiquette
 */
export async function getItemsByTag(tagName: string): Promise<ApiItem[]> {
  return fetchApi(`/api/tags/${encodeURIComponent(tagName)}/items`);
}

// ============== FAVORIS ==============

/**
 * Récupère la liste des favoris
 */
export async function getFavorites(): Promise<ApiItem[]> {
  return fetchApi('/api/favorites');
}

/**
 * Ajoute un document aux favoris
 */
export async function addFavorite(itemId: string): Promise<{ message: string; favorites: ApiItem[] }> {
  return fetchApi(`/api/favorites/${encodeURIComponent(itemId)}`, {
    method: 'POST',
  });
}

/**
 * Retire un document des favoris
 */
export async function removeFavorite(itemId: string): Promise<{ message: string; favorites: ApiItem[] }> {
  return fetchApi(`/api/favorites/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

// ============== EXPORT CONFIG ==============

export const apiConfig = {
  get urls() { return getConfiguredUrls(); },
  getActiveUrl: getActiveApiUrl,
  reset: resetApiUrl,
};
