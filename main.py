"""
Ma GED Perso - API FastAPI
API pour la gestion électronique de documents sur Synology NAS
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
from typing import Optional, List
import base64
import json
import mimetypes
import shutil
import os

# Configuration
GED_ROOT = Path(os.environ.get("GED_ROOT", "/volume1/GED"))
METADATA_FILE = ".ged_metadata.json"

# Application FastAPI
app = FastAPI(
    title="Ma GED Perso API",
    description="API pour la gestion électronique de documents",
    version="2.0.0"
)

# CORS - Autoriser toutes les origines pour le développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODÈLES ==============

class CreateFolderRequest(BaseModel):
    name: str

class RenameRequest(BaseModel):
    new_name: str

class MoveRequest(BaseModel):
    destination_id: str

class TagRequest(BaseModel):
    name: str
    color: str = "#3b82f6"

class SetTagsRequest(BaseModel):
    tags: List[str]

# ============== HELPERS ==============

# Fichiers/dossiers à ignorer
HIDDEN_PATTERNS = ['@eaDir', '#recycle', '.DS_Store', 'Thumbs.db', '@tmp', '#snapshot', '.ged_metadata.json']

def is_hidden(name: str) -> bool:
    """Vérifie si un fichier/dossier doit être caché"""
    name_lower = name.lower()
    return any(name_lower == p.lower() or name_lower.startswith(p.lower()) for p in HIDDEN_PATTERNS)

def encode_id(path: Path) -> str:
    """Encode un chemin en ID base64"""
    relative = path.relative_to(GED_ROOT)
    return base64.b64encode(str(relative).encode('utf-8')).decode('utf-8')

def decode_id(item_id: str) -> Path:
    """Décode un ID base64 en chemin"""
    try:
        relative = base64.b64decode(item_id).decode('utf-8')
        return GED_ROOT / relative
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID invalide: {str(e)}")

def get_item_type(path: Path, depth: int = 0) -> str:
    """Détermine le type d'un élément selon sa profondeur"""
    if path.is_file():
        return "document"
    # Profondeur: 0=armoire, 1=rayon, 2=classeur, 3=dossier, 4+=intercalaire
    types = ["armoire", "rayon", "classeur", "dossier", "intercalaire"]
    return types[min(depth, len(types) - 1)]

def get_depth(path: Path) -> int:
    """Calcule la profondeur d'un chemin par rapport à GED_ROOT"""
    return len(path.relative_to(GED_ROOT).parts)

def path_to_item(path: Path, item_type: str = None) -> dict:
    """Convertit un chemin en objet item"""
    stat = path.stat()
    depth = get_depth(path)
    
    if item_type is None:
        item_type = get_item_type(path, depth - 1)
    
    item = {
        "id": encode_id(path),
        "name": path.name,
        "type": item_type,
        "path": str(path.relative_to(GED_ROOT)),
        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
    }
    
    if path.is_file():
        item["size"] = stat.st_size
        item["extension"] = path.suffix[1:] if path.suffix else None
        item["mime_type"] = mimetypes.guess_type(str(path))[0]
        # Ajouter les tags
        item["tags"] = get_item_tags_internal(encode_id(path))
    else:
        # Compter les enfants (sans les cachés)
        try:
            children = [c for c in path.iterdir() if not is_hidden(c.name)]
            item["children_count"] = len(children)
        except PermissionError:
            item["children_count"] = 0
    
    return item

# ============== MÉTADONNÉES (Tags + Favoris) ==============

def get_metadata_path() -> Path:
    """Retourne le chemin du fichier de métadonnées"""
    return GED_ROOT / METADATA_FILE

def load_metadata() -> dict:
    """Charge les métadonnées depuis le fichier JSON"""
    metadata_path = get_metadata_path()
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"tags": {}, "item_tags": {}, "favorites": []}

def save_metadata(metadata: dict) -> None:
    """Sauvegarde les métadonnées dans le fichier JSON"""
    metadata_path = get_metadata_path()
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

def get_item_tags_internal(item_id: str) -> List[str]:
    """Récupère les tags d'un élément (fonction interne)"""
    metadata = load_metadata()
    return metadata.get("item_tags", {}).get(item_id, [])

def get_favorites_from_metadata() -> List[str]:
    """Récupère la liste des IDs favoris"""
    metadata = load_metadata()
    return metadata.get('favorites', [])

def save_favorites_to_metadata(favorites: List[str]) -> None:
    """Sauvegarde la liste des IDs favoris"""
    metadata = load_metadata()
    metadata['favorites'] = favorites
    save_metadata(metadata)

# ============== ENDPOINTS HEALTH ==============

@app.get("/health")
async def health_check():
    """Vérifie l'état de l'API"""
    return {
        "status": "ok",
        "ged_root_exists": GED_ROOT.exists(),
        "ged_root": str(GED_ROOT)
    }

# ============== ENDPOINTS NAVIGATION ==============

@app.get("/api/armoires")
async def list_armoires():
    """Liste toutes les armoires (dossiers racine)"""
    if not GED_ROOT.exists():
        raise HTTPException(status_code=500, detail="Répertoire GED non trouvé")
    
    armoires = []
    for item in sorted(GED_ROOT.iterdir(), key=lambda x: x.name.lower()):
        if item.is_dir() and not is_hidden(item.name):
            armoires.append(path_to_item(item, "armoire"))
    
    return armoires

@app.get("/api/browse/{item_id:path}")
async def browse(item_id: str):
    """Liste le contenu d'un élément"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    if not path.is_dir():
        raise HTTPException(status_code=400, detail="L'élément n'est pas un dossier")
    
    items = []
    depth = get_depth(path)
    
    for item in sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
        if not is_hidden(item.name):
            items.append(path_to_item(item))
    
    return items

@app.get("/api/item/{item_id:path}")
async def get_item(item_id: str):
    """Récupère les informations d'un élément"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    return path_to_item(path)

@app.get("/api/tree")
async def get_tree(max_depth: int = Query(default=4, ge=1, le=10)):
    """Récupère l'arborescence complète"""
    def build_tree(path: Path, current_depth: int = 0) -> dict:
        node = {
            "id": encode_id(path),
            "name": path.name,
            "type": get_item_type(path, current_depth),
            "path": str(path.relative_to(GED_ROOT)),
        }
        
        if path.is_dir() and current_depth < max_depth:
            children = []
            for item in sorted(path.iterdir(), key=lambda x: x.name.lower()):
                if item.is_dir() and not is_hidden(item.name):
                    children.append(build_tree(item, current_depth + 1))
            if children:
                node["children"] = children
        
        return node
    
    tree = []
    for item in sorted(GED_ROOT.iterdir(), key=lambda x: x.name.lower()):
        if item.is_dir() and not is_hidden(item.name):
            tree.append(build_tree(item, 0))
    
    return tree

# ============== ENDPOINTS CRUD ==============

@app.post("/api/armoires")
async def create_armoire(request: CreateFolderRequest):
    """Crée une nouvelle armoire"""
    new_path = GED_ROOT / request.name
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Une armoire avec ce nom existe déjà")
    
    try:
        new_path.mkdir(parents=True)
        return path_to_item(new_path, "armoire")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur création: {str(e)}")

@app.post("/api/create/{parent_id:path}")
async def create_folder(parent_id: str, request: CreateFolderRequest):
    """Crée un nouveau dossier dans un parent"""
    parent_path = decode_id(parent_id)
    
    if not parent_path.exists():
        raise HTTPException(status_code=404, detail="Parent non trouvé")
    
    new_path = parent_path / request.name
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Un élément avec ce nom existe déjà")
    
    try:
        new_path.mkdir(parents=True)
        return path_to_item(new_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur création: {str(e)}")

@app.put("/api/rename/{item_id:path}")
async def rename_item(item_id: str, request: RenameRequest):
    """Renomme un élément"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    new_path = path.parent / request.new_name
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Un élément avec ce nom existe déjà")
    
    try:
        # Mettre à jour les tags si c'est un fichier
        if path.is_file():
            old_id = encode_id(path)
            metadata = load_metadata()
            if old_id in metadata.get("item_tags", {}):
                tags = metadata["item_tags"].pop(old_id)
                path.rename(new_path)
                new_id = encode_id(new_path)
                metadata["item_tags"][new_id] = tags
                # Mettre à jour les favoris aussi
                if old_id in metadata.get("favorites", []):
                    metadata["favorites"].remove(old_id)
                    metadata["favorites"].append(new_id)
                save_metadata(metadata)
            else:
                path.rename(new_path)
        else:
            path.rename(new_path)
        
        return path_to_item(new_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur renommage: {str(e)}")

@app.put("/api/move/{item_id:path}")
async def move_item(item_id: str, request: MoveRequest):
    """Déplace un élément"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
        
    try:
        dest_path = decode_id(request.destination_id)
    except:
        raise HTTPException(status_code=400, detail="ID de destination invalide")

    if not dest_path.exists():
        raise HTTPException(status_code=404, detail="Destination non trouvée")
        
    if not dest_path.is_dir():
         raise HTTPException(status_code=400, detail="La destination doit être un dossier")

    # Vérifier que l'on ne déplace pas dans soi-même
    if path == dest_path or path in dest_path.parents:
        raise HTTPException(status_code=400, detail="Impossible de déplacer un dossier dans lui-même")

    new_path = dest_path / path.name
    
    if new_path.exists():
         raise HTTPException(status_code=400, detail="Un élément avec ce nom existe déjà dans la destination")
         
    try:
        # Mettre à jour les tags si c'est un fichier
        if path.is_file():
            old_id = encode_id(path)
            metadata = load_metadata()
            
            # Sauvegarder les métadonnées existantes
            tags = metadata.get("item_tags", {}).get(old_id)
            is_fav = old_id in metadata.get("favorites", [])
            
            # Déplacer physiquement
            shutil.move(str(path), str(new_path))
            
            # Restaurer les métadonnées avec le nouvel ID
            if tags or is_fav:
                new_id = encode_id(new_path)
                
                # Tags
                if tags:
                    del metadata["item_tags"][old_id]
                    metadata["item_tags"][new_id] = tags
                
                # Favoris
                if is_fav:
                    metadata["favorites"].remove(old_id)
                    metadata["favorites"].append(new_id)
                
                save_metadata(metadata)
        else:
            # Pour les dossiers
            shutil.move(str(path), str(new_path))
            
        return path_to_item(new_path)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur déplacement: {str(e)}")

@app.delete("/api/delete/{item_id:path}")
async def delete_item(item_id: str):
    """Supprime un élément"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    try:
        # Supprimer les tags et favoris associés
        metadata = load_metadata()
        if item_id in metadata.get("item_tags", {}):
            del metadata["item_tags"][item_id]
        if item_id in metadata.get("favorites", []):
            metadata["favorites"].remove(item_id)
        save_metadata(metadata)
        
        if path.is_file():
            path.unlink()
        else:
            shutil.rmtree(path)
        
        return {"message": "Élément supprimé", "path": str(path.relative_to(GED_ROOT))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur suppression: {str(e)}")

# ============== ENDPOINTS UPLOAD/DOWNLOAD ==============

@app.post("/api/upload/{parent_id:path}")
async def upload_file(parent_id: str, file: UploadFile = File(...)):
    """Upload un fichier"""
    parent_path = decode_id(parent_id)
    
    if not parent_path.exists():
        raise HTTPException(status_code=404, detail="Dossier parent non trouvé")
    
    file_path = parent_path / file.filename
    
    # Gérer les doublons
    counter = 1
    original_stem = file_path.stem
    while file_path.exists():
        file_path = parent_path / f"{original_stem}_{counter}{file_path.suffix}"
        counter += 1
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        return path_to_item(file_path, "document")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur upload: {str(e)}")

@app.post("/api/upload-multiple/{parent_id:path}")
async def upload_multiple_files(parent_id: str, files: List[UploadFile] = File(...)):
    """Upload plusieurs fichiers"""
    parent_path = decode_id(parent_id)
    
    if not parent_path.exists():
        raise HTTPException(status_code=404, detail="Dossier parent non trouvé")
    
    uploaded = []
    for file in files:
        file_path = parent_path / file.filename
        
        counter = 1
        original_stem = file_path.stem
        while file_path.exists():
            file_path = parent_path / f"{original_stem}_{counter}{file_path.suffix}"
            counter += 1
        
        try:
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            uploaded.append(path_to_item(file_path, "document"))
        except Exception as e:
            continue
    
    return uploaded

@app.get("/api/download/{item_id:path}")
async def download_file(item_id: str):
    """Télécharge un fichier"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    if not path.is_file():
        raise HTTPException(status_code=400, detail="L'élément n'est pas un fichier")
    
    return FileResponse(
        path,
        filename=path.name,
        media_type=mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    )

@app.get("/api/preview/{item_id:path}")
async def preview_file(item_id: str):
    """Prévisualise un fichier (affichage inline)"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    if not path.is_file():
        raise HTTPException(status_code=400, detail="L'élément n'est pas un fichier")
    
    mime_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    
    return FileResponse(
        path,
        media_type=mime_type,
        headers={"Content-Disposition": f"inline; filename={path.name}"}
    )

# ============== ENDPOINTS RECHERCHE ==============

@app.get("/api/search")
async def search(
    q: str = Query(..., min_length=1),
    type: Optional[str] = None,
    extension: Optional[str] = None
):
    """Recherche dans la GED"""
    results = []
    query = q.lower()
    
    def search_recursive(path: Path):
        try:
            for item in path.iterdir():
                if is_hidden(item.name):
                    continue
                
                name_lower = item.name.lower()
                
                if query in name_lower:
                    item_data = path_to_item(item)
                    
                    # Filtrer par type
                    if type and item_data["type"] != type:
                        if item.is_dir():
                            search_recursive(item)
                        continue
                    
                    # Filtrer par extension
                    if extension and item_data.get("extension", "").lower() != extension.lower():
                        if item.is_dir():
                            search_recursive(item)
                        continue
                    
                    results.append(item_data)
                
                if item.is_dir():
                    search_recursive(item)
        except PermissionError:
            pass
    
    search_recursive(GED_ROOT)
    
    # Trier: dossiers d'abord, puis par nom
    results.sort(key=lambda x: (x["type"] == "document", x["name"].lower()))
    
    return results[:100]  # Limiter à 100 résultats

@app.get("/api/stats")
async def get_stats():
    """Récupère les statistiques de la GED"""
    stats = {
        "total_armoires": 0,
        "total_rayons": 0,
        "total_classeurs": 0,
        "total_dossiers": 0,
        "total_documents": 0,
        "total_size": 0,
        "extensions": {}
    }
    
    def count_recursive(path: Path, depth: int = 0):
        try:
            for item in path.iterdir():
                if is_hidden(item.name):
                    continue
                
                if item.is_file():
                    stats["total_documents"] += 1
                    stats["total_size"] += item.stat().st_size
                    ext = item.suffix[1:].lower() if item.suffix else "sans extension"
                    stats["extensions"][ext] = stats["extensions"].get(ext, 0) + 1
                else:
                    if depth == 0:
                        stats["total_armoires"] += 1
                    elif depth == 1:
                        stats["total_rayons"] += 1
                    elif depth == 2:
                        stats["total_classeurs"] += 1
                    else:
                        stats["total_dossiers"] += 1
                    count_recursive(item, depth + 1)
        except PermissionError:
            pass
    
    count_recursive(GED_ROOT)
    return stats

# ============== ENDPOINTS TAGS ==============

@app.get("/api/tags")
async def list_tags():
    """Liste toutes les étiquettes"""
    metadata = load_metadata()
    tags = metadata.get("tags", {})
    
    # Recalculer les compteurs
    item_tags = metadata.get("item_tags", {})
    tag_counts = {}
    for item_id, item_tag_list in item_tags.items():
        for tag_name in item_tag_list:
            tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1
    
    result = []
    for name, info in tags.items():
        result.append({
            "name": name,
            "color": info.get("color", "#3b82f6"),
            "count": tag_counts.get(name, 0)
        })
    
    return sorted(result, key=lambda x: x["name"].lower())

@app.post("/api/tags")
async def create_tag(request: TagRequest):
    """Crée une nouvelle étiquette"""
    metadata = load_metadata()
    
    if "tags" not in metadata:
        metadata["tags"] = {}
    
    if request.name in metadata["tags"]:
        raise HTTPException(status_code=400, detail="Cette étiquette existe déjà")
    
    metadata["tags"][request.name] = {"color": request.color}
    save_metadata(metadata)
    
    return {"name": request.name, "color": request.color, "count": 0}

@app.delete("/api/tags/{tag_name}")
async def delete_tag(tag_name: str):
    """Supprime une étiquette"""
    metadata = load_metadata()
    
    if tag_name not in metadata.get("tags", {}):
        raise HTTPException(status_code=404, detail="Étiquette non trouvée")
    
    # Supprimer l'étiquette
    del metadata["tags"][tag_name]
    
    # Retirer l'étiquette de tous les éléments
    for item_id in metadata.get("item_tags", {}):
        if tag_name in metadata["item_tags"][item_id]:
            metadata["item_tags"][item_id].remove(tag_name)
    
    save_metadata(metadata)
    return {"message": "Étiquette supprimée"}

@app.get("/api/item/{item_id:path}/tags")
async def get_item_tags(item_id: str):
    """Récupère les étiquettes d'un élément"""
    return get_item_tags_internal(item_id)

@app.put("/api/item/{item_id:path}/tags")
async def set_item_tags(item_id: str, request: SetTagsRequest):
    """Définit les étiquettes d'un élément"""
    path = decode_id(item_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    metadata = load_metadata()
    
    if "item_tags" not in metadata:
        metadata["item_tags"] = {}
    
    metadata["item_tags"][item_id] = request.tags
    save_metadata(metadata)
    
    return request.tags

@app.post("/api/item/{item_id:path}/tags/{tag_name}")
async def add_tag_to_item(item_id: str, tag_name: str):
    """Ajoute une étiquette à un élément"""
    path = decode_id(item_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    metadata = load_metadata()
    
    # Créer l'étiquette si elle n'existe pas
    if "tags" not in metadata:
        metadata["tags"] = {}
    if tag_name not in metadata["tags"]:
        metadata["tags"][tag_name] = {"color": "#3b82f6"}
    
    if "item_tags" not in metadata:
        metadata["item_tags"] = {}
    
    if item_id not in metadata["item_tags"]:
        metadata["item_tags"][item_id] = []
    
    if tag_name not in metadata["item_tags"][item_id]:
        metadata["item_tags"][item_id].append(tag_name)
    
    save_metadata(metadata)
    return {"tags": metadata["item_tags"][item_id]}

@app.delete("/api/item/{item_id:path}/tags/{tag_name}")
async def remove_tag_from_item(item_id: str, tag_name: str):
    """Retire une étiquette d'un élément"""
    metadata = load_metadata()
    
    if item_id in metadata.get("item_tags", {}):
        if tag_name in metadata["item_tags"][item_id]:
            metadata["item_tags"][item_id].remove(tag_name)
            save_metadata(metadata)
    
    return {"tags": metadata.get("item_tags", {}).get(item_id, [])}

@app.get("/api/tags/{tag_name}/items")
async def get_items_by_tag(tag_name: str):
    """Récupère tous les éléments ayant une étiquette"""
    metadata = load_metadata()
    items = []
    
    for item_id, tags in metadata.get("item_tags", {}).items():
        if tag_name in tags:
            try:
                path = decode_id(item_id)
                if path.exists():
                    items.append(path_to_item(path))
            except:
                continue
    
    return items

# ============== ENDPOINTS FAVORIS ==============

@app.get("/api/favorites")
async def get_favorites():
    """Récupère la liste des favoris avec leurs métadonnées"""
    favorite_ids = get_favorites_from_metadata()
    favorites = []
    valid_favorites = []
    
    for item_id in favorite_ids:
        try:
            path = decode_id(item_id)
            if path.exists() and path.is_file():
                valid_favorites.append(item_id)
                favorites.append(path_to_item(path))
        except Exception:
            continue
    
    # Nettoyer les favoris invalides
    if len(valid_favorites) != len(favorite_ids):
        save_favorites_to_metadata(valid_favorites)
    
    return favorites

@app.post("/api/favorites/{item_id:path}")
async def add_favorite(item_id: str):
    """Ajoute un document aux favoris"""
    path = decode_id(item_id)
    
    if not path.exists():
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    favorites = get_favorites_from_metadata()
    
    if item_id not in favorites:
        favorites.append(item_id)
        save_favorites_to_metadata(favorites)
    
    return {
        "message": "Favori ajouté",
        "favorites": await get_favorites()
    }

@app.delete("/api/favorites/{item_id:path}")
async def remove_favorite(item_id: str):
    """Retire un document des favoris"""
    favorites = get_favorites_from_metadata()
    
    if item_id in favorites:
        favorites.remove(item_id)
        save_favorites_to_metadata(favorites)
    
    return {
        "message": "Favori retiré",
        "favorites": await get_favorites()
    }

# ============== DÉMARRAGE ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
