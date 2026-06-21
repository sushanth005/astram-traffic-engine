import os
import sys
import numpy as np
import faiss
import joblib


# =====================================
# PATH FIX
# =====================================

current_dir = os.path.dirname(
    os.path.abspath(__file__)
)

project_root = os.path.abspath(
    os.path.join(
        current_dir,
        ".."
    )
)

sys.path.append(
    project_root
)


# =====================================
# LOAD EMBEDDINGS
# =====================================

embedding_path = os.path.join(

    project_root,

    "models",

    "embeddings.npy"

)

print(

    "\nLoading embeddings..."

)

embeddings = np.load(

    embedding_path

)

print(

    "Embedding Shape:",

    embeddings.shape

)


# =====================================
# CREATE FAISS INDEX
# =====================================

dimension = embeddings.shape[1]

index = faiss.IndexFlatL2(

    dimension

)

index.add(

    embeddings

)

print(

    "\nFAISS Index Created"

)

print(

    "Total Events Indexed:",

    index.ntotal

)


# =====================================
# SAVE INDEX
# =====================================

index_path = os.path.join(

    project_root,

    "models",

    "similarity.index"

)

faiss.write_index(

    index,

    index_path

)

print(

    "\nSaved to:"

)

print(

    index_path

)

print(

    "\nDone."

)