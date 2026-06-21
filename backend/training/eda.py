import os
import pandas as pd

# Get absolute path of current file
current_dir = os.path.dirname(
    os.path.abspath(__file__)
)

# Go to backend/
project_root = os.path.abspath(
    os.path.join(
        current_dir,
        ".."
    )
)

# Dataset path
PATH = os.path.join(
    project_root,
    "data",
    "Astram_event_data.csv"
)

print("Dataset Path:")
print(PATH)

print("\nLoading dataset...\n")

df = pd.read_csv(PATH)

print("=" * 60)
print("SHAPE")
print("=" * 60)

print(df.shape)

print("\n")

print("=" * 60)
print("COLUMNS")
print("=" * 60)

for col in df.columns:
    print(col)

print("\n")

print("=" * 60)
print("MISSING VALUES")
print("=" * 60)

print(
    df.isnull()
      .sum()
      .sort_values(
          ascending=False
      )
)

print("\n")

print("=" * 60)
print("DATATYPES")
print("=" * 60)

print(df.dtypes)

print("\n")

print("=" * 60)
print("UNIQUE VALUES")
print("=" * 60)

for col in df.columns:

    print("\n")

    print(col)

    print(
        df[col]
        .nunique()
    )

print("\n")

print("=" * 60)
print("HEAD")
print("=" * 60)

print(df.head())