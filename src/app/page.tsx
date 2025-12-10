'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ColumnBrowser from '@/components/ColumnBrowser';
import StatusBar from '@/components/StatusBar';
import Modal from '@/components/Modal';

export default function Home() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header avec toolbar */}
      <Header />

      {/* Zone principale */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar gauche (Scripts) */}
        <Sidebar />

        {/* Zone centrale avec colonnes Novaxel */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ColumnBrowser />
        </main>
      </div>

      {/* Barre de statut - desktop uniquement */}
      <StatusBar />

      {/* Modales */}
      <Modal />
    </div>
  );
}
