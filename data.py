import pandas as pd
import numpy as np


def episodes():
    return pd.read_csv("episodes.csv")


def replicas_base():
    df = pd.read_csv("replicas.csv")

    df["Character"] = df["Character"].apply(lambda x: "Amy" if x in ["1. Amy", "2. Amy", "4. Amy"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Bernadette" if x in ["Bermadette"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Howard" if x in ["Howatd", "Past Howard"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Leonard" if x in ["Leoanard", "Past Leonard",
                                                                         "Fat Leonard"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Raj" if x in ["Rai", "Rajj", "Ra", "Fat Raj", "Past Raj"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Sheldon" if x in ["1. Sheldon", "3. Sheldon", "4. Sheldon",
                                                                         "5. Sheldon", "Sehldon", "Sgeldon",
                                                                         "Shedon", "Sheldon on laptop screen",
                                                                         "Shelldon", "Shldon", "Past Sheldon",
                                                                         "On-screen Sheldon", "Sheldon-bot"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Scene" if x in ["Scene", "Sceme", "Secne"] else x)

    df["Character"] = df["Character"].apply(lambda x: "Other" if x not in ["Amy", "Bernadette", "Howard", "Leonard",
                                                                           "Penny", "Raj", "Sheldon", "Scene"] else x)
    df["Character"] = df["Character"].apply(lambda x: np.nan if str(x) == "Scene" else x)

    return df


def replicas_words(base: pd.DataFrame):
    df = base.copy(deep=True)
    df["Word"] = df["Replica"].apply(lambda x: str(x).split())
    df.drop(columns=["Replica"], inplace=True)
    df = df.explode("Word", ignore_index=True)

    df["Word"] = df["Word"].apply(lambda x: str(x).strip(".,!?-:\"…”;"))
    df["Word"].replace("", np.nan, inplace=True)
    df.dropna(subset=["Word"])

    val = set(df["Word"].values)
    df["Word"] = df["Word"].apply(lambda x: str(x).lower() if str(x).lower() in val else x)

    mask_frequent(df)

    return df


# word list from sketchengine.eu
def mask_frequent(df, wordlist: str = "wordlist_ententen21.csv"):
    wl = set(pd.read_csv(wordlist, header=2)["Item"].values)
    df["Word"] = df["Word"].apply(lambda x: x if x not in wl else "***")


def replicas_interactions(base: pd.DataFrame):
    df = base.copy(deep=True)
    df["ReplyTo"] = df["Character"].shift(fill_value=np.nan)
    df.drop(columns=["Replica"], inplace=True)
    return df


if __name__ == "__main__":
    b = replicas_base()
    w = replicas_words(b)
    i = replicas_interactions(b)
    w.to_csv("data_words.csv", index=False)
    i.to_csv("data_interactions.csv", index=False)
