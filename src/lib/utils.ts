import { DocumentType } from '@/types';

// Formatage de la taille des fichiers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 octet';
  
  const units = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
};

// Formatage de la date
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Formatage de la date courte
export const formatDateShort = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Formatage de la date relative
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
};

// Obtenir l'icône selon le type de document
export const getDocumentIcon = (type: DocumentType): string => {
  const icons: Record<DocumentType, string> = {
    pdf: 'file-text',
    image: 'image',
    word: 'file-type',
    excel: 'table',
    text: 'file',
    archive: 'archive',
    other: 'file',
  };
  return icons[type];
};

// Obtenir la couleur selon le type de document
export const getDocumentColor = (type: DocumentType): string => {
  const colors: Record<DocumentType, string> = {
    pdf: '#ef4444',
    image: '#3b82f6',
    word: '#2563eb',
    excel: '#22c55e',
    text: '#64748b',
    archive: '#f59e0b',
    other: '#94a3b8',
  };
  return colors[type];
};

// Obtenir le label du type de document
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    pdf: 'PDF',
    image: 'Image',
    word: 'Word',
    excel: 'Excel',
    text: 'Texte',
    archive: 'Archive',
    other: 'Autre',
  };
  return labels[type];
};

// Générer un ID unique
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Tronquer le texte
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Slug pour les noms de fichiers
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Vérifier si c'est une extension d'image
export const isImageExtension = (extension: string): boolean => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
    extension.toLowerCase()
  );
};

// Vérifier si c'est une extension prévisualisable
export const isPreviewable = (extension: string): boolean => {
  return [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'pdf', 'txt', 'md', 'json', 'xml', 'html', 'css', 'js'
  ].includes(extension.toLowerCase());
};
