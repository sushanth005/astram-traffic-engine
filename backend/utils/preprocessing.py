import os
import re
import pandas as pd
import numpy as np


# ==========================================
# TEXT CLEANING
# ==========================================

def clean_text(text):

    if not isinstance(text, str):

        return ""

    text = text.lower()

    text = re.sub(

        r'[^a-zA-Z\s]',

        '',

        text

    )

    text = re.sub(

        r'\s+',

        ' ',

        text

    ).strip()

    return text


# ==========================================
# NORMALIZE INPUT FEATURES
# ==========================================

def normalize_features(data_dict):

    cleaned_dict = {}

    for key, val in data_dict.items():

        if isinstance(val, str):

            cleaned_dict[key] = clean_text(val)

        else:

            cleaned_dict[key] = val

    return cleaned_dict


# ==========================================
# LOAD DATASET
# ==========================================

def load_dataset():

    current_dir = os.path.dirname(

        os.path.abspath(__file__)

    )

    project_root = os.path.abspath(

        os.path.join(

            current_dir,

            ".."

        )

    )

    dataset_path = os.path.join(

        project_root,

        "data",

        "Astram_event_data.csv"

    )

    print("\nLoading dataset:")

    print(dataset_path)

    df = pd.read_csv(

        dataset_path

    )

    print(

        "\nDataset Loaded Successfully"

    )

    print(

        "Shape:",

        df.shape

    )

    return df


# ==========================================
# PARSE DATETIME
# ==========================================

def parse_datetime_columns(df):

    df = df.copy()

    datetime_cols = [

        "start_datetime",

        "end_datetime",

        "created_date",

        "modified_datetime",

        "resolved_datetime",

        "closed_datetime"

    ]

    for col in datetime_cols:

        if col in df.columns:

            df[col] = pd.to_datetime(

                df[col],

                errors="coerce"

            )

    return df


# ==========================================
# HANDLE MISSING VALUES
# ==========================================

def fill_missing_values(df):

    df = df.copy()

    cat_cols = df.select_dtypes(

        include="object"

    ).columns

    for col in cat_cols:

        df[col] = (

            df[col]

            .fillna("Unknown")

            .astype(str)

            .str.strip()

        )

    num_cols = df.select_dtypes(

        include=np.number

    ).columns

    for col in num_cols:

        df[col] = (

            df[col]

            .fillna(

                df[col].median()

            )

        )

    return df


# ==========================================
# MAIN PREPROCESS FUNCTION
# ==========================================

def preprocess():

    df = load_dataset()

    df = parse_datetime_columns(

        df

    )

    df = fill_missing_values(

        df

    )

    return df