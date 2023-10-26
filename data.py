import pandas as pd


def episodes():
    return pd.read_csv("episodes.csv")


def replicas():
    df = pd.read_csv("replicas.csv")

    c = df.groupby("Character").count()
    # TODO
    return df


if __name__ == "__main__":
    replicas()
