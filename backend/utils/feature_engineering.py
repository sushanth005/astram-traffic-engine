import numpy as np
import pandas as pd


def create_event_dna(df):

    df = df.copy()

    print("\nCreating Event DNA...")

    # =====================================
    # TEMPORAL FEATURES
    # =====================================

    if "start_datetime" in df.columns:

        df["hour"] = (
            df["start_datetime"]
            .dt.hour
        )

        df["minute"] = (
            df["start_datetime"]
            .dt.minute
        )

        df["dayofweek"] = (
            df["start_datetime"]
            .dt.dayofweek
        )

        df["month"] = (
            df["start_datetime"]
            .dt.month
        )

        df["weekend"] = (
            df["dayofweek"] >= 5
        ).astype(int)

    else:

        df["hour"] = 0
        df["minute"] = 0
        df["dayofweek"] = 0
        df["month"] = 0
        df["weekend"] = 0


    # =====================================
    # PEAK HOURS
    # =====================================

    df["is_morning_peak"] = (

        df["hour"]

        .between(

            7,

            10

        )

    ).astype(int)


    df["is_evening_peak"] = (

        df["hour"]

        .between(

            17,

            20

        )

    ).astype(int)


    df["is_night"] = (

        (

            (df["hour"] <= 5)

            |

            (df["hour"] >= 22)

        )

    ).astype(int)


    # =====================================
    # CYCLIC TIME ENCODING
    # =====================================

    df["sin_hour"] = np.sin(

        2

        *

        np.pi

        *

        df["hour"]

        /

        24

    )


    df["cos_hour"] = np.cos(

        2

        *

        np.pi

        *

        df["hour"]

        /

        24

    )


    df["sin_day"] = np.sin(

        2

        *

        np.pi

        *

        df["dayofweek"]

        /

        7

    )


    df["cos_day"] = np.cos(

        2

        *

        np.pi

        *

        df["dayofweek"]

        /

        7

    )


    # =====================================
    # EVENT DURATION
    # =====================================

    if (

        "start_datetime" in df.columns

        and

        "end_datetime" in df.columns

    ):

        duration = (

            df["end_datetime"]

            -

            df["start_datetime"]

        )


        df["event_duration_minutes"] = (

            duration

            .dt.total_seconds()

            /

            60

        )


        df["event_duration_minutes"] = (

            df["event_duration_minutes"]

            .fillna(0)

        )

    else:

        df["event_duration_minutes"] = 0


    # =====================================
    # EVENT DENSITY FEATURES
    # =====================================

    if "zone" in df.columns:

        zone_density = (

            df

            .groupby("zone")

            .size()

            .to_dict()

        )

        df["zone_event_density"] = (

            df["zone"]

            .map(

                zone_density

            )

        )

    else:

        df["zone_event_density"] = 0


    if "corridor" in df.columns:

        corridor_density = (

            df

            .groupby("corridor")

            .size()

            .to_dict()

        )

        df["corridor_event_density"] = (

            df["corridor"]

            .map(

                corridor_density

            )

        )

    else:

        df["corridor_event_density"] = 0


    if "police_station" in df.columns:

        ps_density = (

            df

            .groupby(

                "police_station"

            )

            .size()

            .to_dict()

        )

        df["police_station_density"] = (

            df["police_station"]

            .map(

                ps_density

            )

        )

    else:

        df["police_station_density"] = 0


    # =====================================
    # GEO FEATURES
    # =====================================

    if (

        "latitude" in df.columns

        and

        "longitude" in df.columns

    ):

        df["lat_lon_product"] = (

            df["latitude"]

            *

            df["longitude"]

        )


        df["distance_from_origin"] = np.sqrt(

            df["latitude"]**2

            +

            df["longitude"]**2

        )

    else:

        df["lat_lon_product"] = 0

        df["distance_from_origin"] = 0


    # =====================================
    # ROAD CLOSURE
    # =====================================

    if "requires_road_closure" in df.columns:

        df["requires_road_closure"] = (

            df["requires_road_closure"]

            .astype(int)

        )

    else:

        df["requires_road_closure"] = 0


    # =====================================
    # EVENT DNA SCORE
    # =====================================

    df["event_dna_score"] = (

        2

        *

        df["is_morning_peak"]

        +

        2

        *

        df["is_evening_peak"]

        +

        1

        *

        df["requires_road_closure"]

        +

        0.002

        *

        df["event_duration_minutes"]

    )


    print(

        "Event DNA Created."

    )

    print(

        "Shape:",

        df.shape

    )

    return df