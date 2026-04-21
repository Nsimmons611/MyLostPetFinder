from __future__ import annotations

from functools import lru_cache
from pathlib import Path

try:
    import torch
    import torch.nn.functional as F
    from torchvision import models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None

from PIL import Image


@lru_cache(maxsize=1)
def _get_feature_extractor():
    """
    Load a lightweight ImageNet-pretrained model once and reuse it.

    ResNet18 is small enough for local development while still producing
    meaningful image embeddings for a school-project prototype.
    """
    if not TORCH_AVAILABLE:
        raise RuntimeError(
            "PyTorch is not installed. Image matching requires: "
            "pip install torch torchvision"
        )
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    feature_extractor = torch.nn.Sequential(*list(model.children())[:-1])
    feature_extractor.eval()
    return feature_extractor, weights.transforms()


def _get_photo_path(instance) -> Path | None:
    """Return a local image path for a LostPet or Sighting object."""
    if instance is None:
        return None

    if hasattr(instance, "pet"):
        pet = getattr(instance, "pet", None)
        photo = getattr(pet, "photo", None) if pet else None
    else:
        photo = getattr(instance, "photo", None)

    if not photo:
        return None

    try:
        path = Path(photo.path)
    except (AttributeError, NotImplementedError, ValueError):
        return None

    return path if path.exists() else None


@lru_cache(maxsize=256)
def _extract_features(image_path: str, modified_time: float) -> torch.Tensor:
    """
    Convert an image into a normalized feature vector.

    The modified_time argument is included so cached features refresh if the
    underlying file changes.
    """
    feature_extractor, preprocess = _get_feature_extractor()

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        input_tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        features = feature_extractor(input_tensor).flatten()

    return F.normalize(features, p=2, dim=0)


def _similarity_to_score(similarity: float) -> float:
    """
    Convert cosine similarity from [-1, 1] to a user-facing score in [0, 1].

    The frontend already formats this as a percentage by multiplying by 100.
    For example, 0.82 becomes 82%.
    """
    score = (similarity + 1.0) / 2.0
    return max(0.0, min(1.0, score))


def match(lost_pet, sighting) -> float:
    """
    Return a similarity score between 0.0 and 1.0 for ranking candidate matches.

    Rules:
    - If the lost pet has no linked registered pet or no linked pet photo, return 0.0
    - If the sighting has no photo, return 0.0
    - Otherwise, compare ImageNet-pretrained embeddings with cosine similarity
    """
    lost_pet_path = _get_photo_path(lost_pet)
    sighting_path = _get_photo_path(sighting)

    if not lost_pet_path or not sighting_path:
        return 0.0

    try:
        lost_pet_features = _extract_features(
            str(lost_pet_path),
            lost_pet_path.stat().st_mtime,
        )
        sighting_features = _extract_features(
            str(sighting_path),
            sighting_path.stat().st_mtime,
        )
        similarity = F.cosine_similarity(
            lost_pet_features.unsqueeze(0),
            sighting_features.unsqueeze(0),
        ).item()
        return _similarity_to_score(similarity)
    except Exception:
        # Matching should never take down the ranking endpoint; a failed
        # comparison simply becomes a non-match for now.
        return 0.0
