'use client';

import React from 'react';
import { useApp, useBreadcrumb } from '@/lib/store-api';
import { getActiveApiUrl } from '@/lib/api';
import { ChevronRight, HardDrive, FileText, Folder, Wifi, WifiOff, Clock, Database } from 'lucide-react';

// Helper pour formater la taille
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

// Helper pour formater la date
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function StatusBar() {
  const { state } = useApp();
  const breadcrumb = useBreadcrumb();
  
  const { selection, armoires, documents, apiConnected } = state;

  // Informations sur l'élément sélectionné
  const getSelectionInfo = () => {
    if (selection.document) {
      return {
        type: 'Document',
        name: selection.document.name,
        size: formatFileSize(selection.document.size || 0),
        date: formatDate(selection.document.modified_at),
      };
    }
    if (selection.intercalaire) {
      return {
        type: 'Intercalaire',
        name: selection.intercalaire.name,
        count: selection.intercalaire.children_count || 0,
        unit: 'doc',
        date: formatDate(selection.intercalaire.modified_at),
      };
    }
    if (selection.dossier) {
      return {
        type: 'Dossier',
        name: selection.dossier.name,
        count: selection.dossier.children_count || 0,
        unit: 'élément',
        date: formatDate(selection.dossier.modified_at),
      };
    }
    if (selection.classeur) {
      return {
        type: 'Classeur',
        name: selection.classeur.name,
        count: selection.classeur.children_count || 0,
        unit: 'dossier',
        date: formatDate(selection.classeur.modified_at),
      };
    }
    if (selection.rayon) {
      return {
        type: 'Rayon',
        name: selection.rayon.name,
        count: selection.rayon.children_count || 0,
        unit: 'classeur',
        date: formatDate(selection.rayon.modified_at),
      };
    }
    if (selection.armoire) {
      return {
        type: 'Armoire',
        name: selection.armoire.name,
        count: selection.armoire.children_count || 0,
        unit: 'rayon',
        date: formatDate(selection.armoire.modified_at),
      };
    }
    return null;
  };

  const selectionInfo = getSelectionInfo();

  return (
    <footer className="hidden md:flex h-8 bg-white border-t border-ged-border text-xs items-center px-3 gap-3">
      {/* Indicateur de connexion API */}
      <div 
        className="flex items-center gap-1.5" 
        title={apiConnected ? `Connecté: ${getActiveApiUrl()}` : 'Non connecté'}
      >
        {apiConnected ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-500" />
        )}
      </div>

      {/* Séparateur */}
      <div className="w-px h-4 bg-ged-border" />

      {/* Fil d'Ariane simplifié */}
      <div className="flex items-center gap-1 min-w-0 flex-shrink">
        {breadcrumb.length > 0 ? (
          <>
            {breadcrumb.length > 2 && (
              <>
                <span className="text-ged-text-muted">...</span>
                <ChevronRight className="w-3 h-3 text-ged-border flex-shrink-0" />
              </>
            )}
            {breadcrumb.slice(-2).map((item, index, arr) => (
              <React.Fragment key={item.id}>
                {index > 0 && <ChevronRight className="w-3 h-3 text-ged-border flex-shrink-0" />}
                <span 
                  className={`truncate max-w-[100px] ${
                    index === arr.length - 1 
                      ? 'text-ged-primary font-medium' 
                      : 'text-ged-text-muted'
                  }`}
                >
                  {item.name}
                </span>
              </React.Fragment>
            ))}
          </>
        ) : (
          <span className="text-ged-text-muted">Accueil</span>
        )}
      </div>

      {/* Séparateur flexible */}
      <div className="flex-1" />

      {/* Info sélection */}
      {selectionInfo ? (
        <div className="flex items-center gap-3 text-ged-text">
          {/* Type et nom */}
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-ged-surface-alt rounded text-[10px] uppercase tracking-wide text-ged-text-muted">
              {selectionInfo.type}
            </span>
            <span className="text-ged-primary font-medium truncate max-w-[150px]">
              {selectionInfo.name}
            </span>
          </div>
          
          {/* Taille ou nombre */}
          {'size' in selectionInfo ? (
            <div className="flex items-center gap-1 text-ged-text-muted">
              <Database className="w-3 h-3" />
              <span>{selectionInfo.size}</span>
            </div>
          ) : 'count' in selectionInfo ? (
            <span className="text-ged-text-muted">
              {selectionInfo.count} {selectionInfo.unit}{selectionInfo.count > 1 ? 's' : ''}
            </span>
          ) : null}
          
          {/* Date */}
          <div className="hidden sm:flex items-center gap-1 text-ged-text-muted">
            <Clock className="w-3 h-3" />
            <span>{selectionInfo.date}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-ged-text-muted">
          <div className="flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-ged-accent" />
            <span>{armoires.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-ged-secondary" />
            <span>{documents.length}</span>
          </div>
        </div>
      )}
    </footer>
  );
}
