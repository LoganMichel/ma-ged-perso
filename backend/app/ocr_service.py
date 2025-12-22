"""
OCR Service pour Ma GED Perso
Extraction de texte depuis PDFs et images avec Tesseract OCR
"""

import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import fitz  # PyMuPDF
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple
import logging

# Configuration
OCR_LANGUAGE = "fra+eng"  # Français + Anglais
SUPPORTED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'}
SUPPORTED_PDF_EXTENSIONS = {'.pdf'}
MAX_PDF_PAGES = 50  # Limite pour performance
MIN_TEXT_LENGTH = 100  # Seuil pour considérer qu'un PDF contient du texte natif

logger = logging.getLogger(__name__)


def extract_text_from_image(image_path: Path) -> Tuple[str, str]:
    """
    Extrait le texte d'une image avec Tesseract OCR.

    Args:
        image_path: Chemin vers l'image

    Returns:
        Tuple (texte_extrait, methode)
    """
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang=OCR_LANGUAGE)
        image.close()
        return text.strip(), "tesseract"
    except Exception as e:
        logger.error(f"OCR échoué pour l'image {image_path}: {e}")
        raise


def extract_text_from_pdf(pdf_path: Path) -> Tuple[str, str, int]:
    """
    Extrait le texte d'un PDF.
    Essaie d'abord l'extraction native (PyMuPDF), sinon utilise l'OCR.

    Args:
        pdf_path: Chemin vers le PDF

    Returns:
        Tuple (texte_extrait, methode, nombre_pages)
    """
    try:
        # Essayer l'extraction native avec PyMuPDF
        doc = fitz.open(pdf_path)
        page_count = len(doc)

        native_text = ""
        for page in doc:
            native_text += page.get_text()

        doc.close()

        # Si l'extraction native a donné du texte substantiel, l'utiliser
        if len(native_text.strip()) > MIN_TEXT_LENGTH:
            return native_text.strip(), "pymupdf", page_count

        # Sinon, c'est un PDF scanné, utiliser l'OCR
        logger.info(f"PDF {pdf_path.name} semble scanné, utilisation de l'OCR")

        # Convertir les pages PDF en images
        images = convert_from_path(
            pdf_path,
            dpi=300,
            last_page=min(page_count, MAX_PDF_PAGES)
        )

        ocr_text = ""
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image, lang=OCR_LANGUAGE)
            ocr_text += f"\n--- Page {i + 1} ---\n{page_text}"
            image.close()

        # Libérer la mémoire
        del images

        return ocr_text.strip(), "tesseract", page_count

    except Exception as e:
        logger.error(f"Extraction de texte échouée pour {pdf_path}: {e}")
        raise


def extract_text(file_path: Path) -> Optional[dict]:
    """
    Point d'entrée principal : extrait le texte d'un fichier selon son type.

    Args:
        file_path: Chemin vers le fichier

    Returns:
        Dictionnaire avec les résultats d'extraction, ou None si non supporté
    """
    suffix = file_path.suffix.lower()

    result = {
        "extracted_at": datetime.now().isoformat(),
        "language": OCR_LANGUAGE,
    }

    try:
        if suffix in SUPPORTED_IMAGE_EXTENSIONS:
            text, method = extract_text_from_image(file_path)
            result["text"] = text
            result["method"] = method
            result["page_count"] = 1

        elif suffix in SUPPORTED_PDF_EXTENSIONS:
            text, method, page_count = extract_text_from_pdf(file_path)
            result["text"] = text
            result["method"] = method
            result["page_count"] = page_count

        else:
            return None  # Type de fichier non supporté

        return result

    except Exception as e:
        logger.error(f"Extraction échouée pour {file_path}: {e}")
        return None


def is_ocr_supported(file_path: Path) -> bool:
    """
    Vérifie si le type de fichier supporte l'extraction OCR.

    Args:
        file_path: Chemin vers le fichier

    Returns:
        True si le fichier peut être traité par OCR
    """
    suffix = file_path.suffix.lower()
    return suffix in SUPPORTED_IMAGE_EXTENSIONS or suffix in SUPPORTED_PDF_EXTENSIONS
