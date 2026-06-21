import os
import sys

import pandas as pd
import numpy as np

from sklearn.cluster import DBSCAN

# ======================================
# PATH FIX
# ======================================

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

from utils.preprocessing import preprocess

from utils.feature_engineering import (
    create_event_dna
)


def main():

    print("\nLoading dataset...")

    df = preprocess()

    df = create_event_dna(df)

    print(

        "\nDataset Shape:",

        df.shape

    )

    # =====================================
    # LATITUDE LONGITUDE
    # =====================================

    geo_df = df[

        [

            "latitude",

            "longitude"

        ]

    ].copy()

    geo_df = geo_df.dropna()

    X = geo_df.values

    print(

        "\nRunning DBSCAN..."

    )

    model = DBSCAN(

        eps=0.005,

        min_samples=10

    )

    clusters = model.fit_predict(

        X

    )

    geo_df["cluster"] = clusters

    print(

        "\nClusters Found:",

        len(

            np.unique(

                clusters

            )

        )

    )

    print(

        "\nCluster Distribution:\n"

    )

    print(

        geo_df["cluster"]

        .value_counts()

    )

    # =====================================
    # SAVE
    # =====================================

    output_path = os.path.join(

        project_root,

        "models",

        "hotspots.csv"

    )

    geo_df.to_csv(

        output_path,

        index=False

    )

    print(

        "\nSaved to:\n"

    )

    print(

        output_path

    )

    print(

        "\nDone."

    )


if __name__ == "__main__":

    main()