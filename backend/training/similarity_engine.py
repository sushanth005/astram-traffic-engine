import os
import sys
import joblib
import numpy as np

from sklearn.neighbors import NearestNeighbors


# ==========================================
# PATH FIX
# ==========================================

current_dir = os.path.dirname(
    os.path.abspath(__file__)
)

project_root = os.path.abspath(
    os.path.join(
        current_dir,
        ".."
    )
)

sys.path.append(project_root)


# ==========================================
# LOAD EMBEDDINGS
# ==========================================

embedding_path = os.path.join(

    project_root,

    "models",

    "embeddings.npy"

)

print("\nLoading embeddings...")

embeddings = np.load(

    embedding_path

)

print(

    "Embedding Shape:",

    embeddings.shape

)


# ==========================================
# BUILD NEAREST NEIGHBORS
# ==========================================

print(

    "\nBuilding Similarity Engine..."

)

model = NearestNeighbors(

    n_neighbors=10,

    metric="cosine",

    algorithm="brute"

)

model.fit(

    embeddings

)

print(

    "Similarity Engine Built."

)


# ==========================================
# SAVE MODEL
# ==========================================

model_path = os.path.join(

    project_root,

    "models",

    "similarity_engine.pkl"

)

joblib.dump(

    model,

    model_path

)

print(

    "\nSaved to:\n"

)

print(

    model_path

)

print(

    "\nDone."

)