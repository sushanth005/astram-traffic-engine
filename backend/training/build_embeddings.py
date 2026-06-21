import os
import sys
import numpy as np

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

from sentence_transformers import SentenceTransformer

from utils.preprocessing import preprocess


def create_event_text(row):

    return f"""

Event Type:

{row.get("event_type","Unknown")}


Event Cause:

{row.get("event_cause","Unknown")}


Description:

{row.get("description","Unknown")}


Zone:

{row.get("zone","Unknown")}


Corridor:

{row.get("corridor","Unknown")}


Junction:

{row.get("junction","Unknown")}


Police Station:

{row.get("police_station","Unknown")}


Road Closure:

{row.get("requires_road_closure",False)}

"""


def main():

    print("\nLoading Dataset...")

    df = preprocess()

    print(

        "Shape:",

        df.shape

    )

    print(

        "\nCreating EventTwin Text..."

    )

    event_texts = []

    for _, row in df.iterrows():

        text = create_event_text(

            row

        )

        event_texts.append(

            text

        )

    print(

        "Total Events:",

        len(

            event_texts

        )

    )

    print(

        "\nLoading SentenceTransformer..."

    )

    model = SentenceTransformer(

        "all-MiniLM-L6-v2"

    )

    print(

        "Loaded."

    )

    print(

        "\nGenerating Embeddings..."

    )

    embeddings = model.encode(

        event_texts,

        show_progress_bar=True,

        convert_to_numpy=True

    )

    print(

        "\nEmbedding Shape:",

        embeddings.shape

    )

    embedding_path = os.path.join(

        project_root,

        "models",

        "embeddings.npy"

    )

    np.save(

        embedding_path,

        embeddings

    )

    print(

        "\nSaved to:\n"

    )

    print(

        embedding_path

    )

    print(

        "\nDone."

    )


if __name__ == "__main__":

    main()