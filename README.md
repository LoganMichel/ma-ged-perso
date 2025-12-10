# Ma GED - Gestion Électronique de Documents

Application de Gestion Électronique de Documents personnelle, développée avec Next.js et Tailwind CSS, optimisée pour un déploiement sur **Synology NAS** via **Web Station**.

## 🌟 Fonctionnalités

- **Navigation hiérarchique** : Structure Armoire → Rayon → Classeur → Dossier → Document
- **Interface style Novaxel** : 4 colonnes de navigation avec sélection en cascade
- **Gestion des documents** : Import, téléchargement, visualisation
- **Scripts et favoris** : Accès rapide aux actions fréquentes
- **Recherche** : Recherche globale dans les documents
- **Responsive** : Adapté aux différentes tailles d'écran

## 🏗️ Architecture

```
ARMOIRE (ex: Banques, Assurances, Impôts...)
  └── RAYON (ex: Compte courant, Épargne...)
       └── CLASSEUR (ex: Relevés, Contrats...)
            └── DOSSIER (ex: 2024, 2023...)
                 └── DOCUMENT (fichiers PDF, images, etc.)
```

## 📦 Prérequis

### Sur votre NAS Synology

1. **Web Station** installé via le Centre de paquets
2. **Node.js** (optionnel, pour le mode serveur)
3. Un **dossier partagé** nommé `GED` pour stocker les documents

## 🚀 Déploiement sur Synology Web Station

### Option 1 : Mode Statique (Recommandé)

Cette méthode génère des fichiers HTML/CSS/JS statiques, idéale pour Web Station.

#### Étape 1 : Compiler l'application

```bash
# Sur votre machine de développement
npm install
npm run build
```

Cela génère un dossier `out/` contenant l'application statique.

#### Étape 2 : Copier sur le NAS

1. Connectez-vous à votre NAS via File Station ou SMB
2. Créez un dossier dans `/volume1/web/ged` (ou un autre emplacement web)
3. Copiez tout le contenu du dossier `out/` vers `/volume1/web/ged`

```bash
# Via SCP (exemple)
scp -r out/* user@nas-ip:/volume1/web/ged/
```

#### Étape 3 : Configurer Web Station

1. Ouvrez **Web Station** sur votre NAS
2. Allez dans **Portail web** > **Créer**
3. Configurez :
   - **Type** : Basé sur un nom ou Basé sur un port
   - **Nom d'hôte** : `ged.local` ou port `8080`
   - **Racine du document** : `/volume1/web/ged`
   - **Serveur HTTP** : Nginx ou Apache
4. Cliquez sur **Créer**

#### Étape 4 : Configuration Nginx (si utilisé)

Créez une règle de réécriture pour le routage SPA :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Option 2 : Mode Serveur Node.js (Avancé)

Pour utiliser les fonctionnalités serveur de Next.js.

#### Étape 1 : Modifier next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Retirer output: 'export' pour le mode serveur
};
module.exports = nextConfig;
```

#### Étape 2 : Installer sur le NAS

```bash
# SSH sur le NAS
ssh user@nas-ip

# Créer le dossier
mkdir -p /volume1/docker/ged-avalon
cd /volume1/docker/ged-avalon

# Copier les fichiers (ou git clone)
# npm install
# npm run build
# npm start
```

#### Étape 3 : Utiliser Docker (recommandé pour Node.js)

Créez un `docker-compose.yml` :

```yaml
version: "3.8"
services:
  ged-avalon:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /volume1/GED:/app/storage
    restart: unless-stopped
```

## 📁 Configuration du stockage

### Connexion au volume GED

L'application est conçue pour stocker les documents dans `/volume1/GED` sur votre NAS.

#### Via SMB (recommandé)

1. Dans DSM, allez dans **Panneau de configuration** > **Dossier partagé**
2. Créez un dossier `GED` si non existant
3. Activez le partage SMB dans **Services de fichiers**

#### Structure recommandée

```
/volume1/GED/
  ├── Assurances/
  │   ├── Habitation/
  │   └── Auto/
  ├── Banques/
  │   ├── Compte_courant/
  │   └── Epargne/
  ├── Employeurs/
  ├── Factures/
  └── ...
```

## 🔧 Personnalisation

### Modifier les catégories par défaut

Éditez `src/lib/demo-data.ts` pour personnaliser :

- Les armoires (catégories principales)
- Les rayons, classeurs, dossiers
- Les données de démonstration

### Thème et couleurs

Les couleurs sont définies dans `tailwind.config.ts` :

```typescript
colors: {
  'ged': {
    'primary': '#1e3a5f',      // Bleu profond
    'secondary': '#3d7ea6',    // Bleu moyen
    'accent': '#f59e0b',       // Orange/Ambre
    // ...
  }
}
```

## 🔌 API Backend (À développer)

Pour une utilisation en production avec stockage réel, vous devrez développer une API backend. Voici les endpoints suggérés :

```
GET    /api/armoires              # Liste des armoires
GET    /api/browse/{id}           # Contenu d'un dossier
GET    /api/item/{id}             # Détails d'un élément
GET    /api/tree                  # Arborescence complète (pour déplacement)
POST   /api/armoires              # Créer une armoire
POST   /api/create/{parent_id}    # Créer un dossier
PUT    /api/rename/{id}           # Renommer un élément
PUT    /api/move/{id}             # Déplacer un élément
DELETE /api/delete/{id}           # Supprimer un élément
POST   /api/upload/{parent_id}    # Upload de document
GET    /api/download/{id}         # Télécharger un document
GET    /api/preview/{id}          # Prévisualiser un document
GET    /api/search?q=             # Recherche globale
GET    /api/tags                  # Gestion des étiquettes
GET    /api/favorites             # Gestion des favoris
```

### Exemple avec PHP (pour Web Station)

```php
<?php
// api/documents/upload.php
header('Content-Type: application/json');

$targetDir = '/volume1/GED/';
$file = $_FILES['document'];

$targetPath = $targetDir . basename($file['name']);

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(['success' => true, 'path' => $targetPath]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Upload failed']);
}
```

## 📱 Accès mobile

L'application est responsive et accessible depuis :

- Navigateur web sur smartphone/tablette
- Application DS file de Synology (pour les fichiers bruts)

## 🔒 Sécurité

Recommandations :

1. Activez HTTPS via Let's Encrypt dans DSM
2. Configurez un reverse proxy si nécessaire
3. Limitez l'accès réseau au NAS
4. Utilisez l'authentification Synology si disponible

## 🐛 Dépannage

### L'application ne se charge pas

1. Vérifiez que Web Station est actif
2. Contrôlez les permissions du dossier web
3. Vérifiez les logs Nginx/Apache

### Les fichiers ne s'affichent pas

1. Vérifiez les permissions du dossier GED
2. Contrôlez la configuration CORS si API externe

### Erreur 404 sur les routes

Ajoutez la configuration de réécriture d'URL (voir section Nginx).

## 📝 Licence

MIT License - Libre d'utilisation et de modification.

## 🙏 Crédits

- Inspiré par [Novaxel](https://www.novaxel.fr/)
- Développé avec [Next.js](https://nextjs.org/) et [Tailwind CSS](https://tailwindcss.com/)
- Icônes par [Lucide](https://lucide.dev/)

---

Développé avec ❤️ pour une gestion documentaire efficace
