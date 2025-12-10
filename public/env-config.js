/**
 * Configuration générée au runtime
 * Ce fichier peut être modifié après le build pour changer les URLs de l'API
 * sans avoir à recompiler l'application frontend.
 */
window.__ENV__ = {
  // Liste des URLs de l'API à tester (par ordre de priorité)
  API_URLS: [
    'http://192.168.0.100:8001',  // Réseau local
    'http://100.83.9.31:8001',     // Tailscale
  ]
};
