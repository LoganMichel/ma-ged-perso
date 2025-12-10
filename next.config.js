/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pour le déploiement sur Web Station en mode statique
  output: 'export',
  
  // Désactiver l'optimisation des images pour l'export statique
  images: {
    unoptimized: true,
  },
  
  // Base path si vous déployez dans un sous-dossier
  // basePath: '/ged',
  
  // Trailing slash pour la compatibilité avec les serveurs web statiques
  trailingSlash: true,
}

module.exports = nextConfig
