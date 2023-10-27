import pandas as pd


def episodes():
    return pd.read_csv("episodes.csv")


def replicas_base():
    df = pd.read_csv("replicas.csv")

    df["Character"] = df["Character"].apply(lambda x: "Amy" if x in ["1. Amy", "2. Amy", "4. Amy"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Bernadette" if x in ["Bermadette"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Howard" if x in ["Howatd"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Leonard" if x in ["Leoanard"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Raj" if x in ["Rai", "Rajj", "Ra"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Sheldon" if x in ["1. Sheldon", "3. Sheldon", "4. Sheldon",
                                                                         "5. Sheldon", "Sehldon", "Sgeldon",
                                                                         "Shedon", "Sheldon on laptop screen",
                                                                         "Shelldon", "Shldon"] else x)
    df["Character"] = df["Character"].apply(lambda x: "Scene" if x in ["Sceme", "Secne"] else x)

    df["Character"] = df["Character"].apply(lambda x: "Other" if x not in ["Amy", "Bernadette", "Howard", "Leonard",
                                                                           "Penny", "Raj", "Sheldon", "Scene"] else x)

    return df


def replicas_words(base: pd.DataFrame):
    df = base.copy(deep=True)
    df["Word"] = df["Replica"].apply(lambda x: str(x).split())
    df.drop(columns=["Replica"], inplace=True)
    df = df.explode("Word", ignore_index=True)
    df["Word"] = df["Word"].apply(lambda x: str(x).strip(".,!?-:\"…"))
    val = set(df["Word"].values)
    df["Word"] = df["Word"].apply(lambda x: x.lower() if x.lower() in val else x)
    # TODO mask the most common words
    return df


def replicas_interactions(base: pd.DataFrame):
    # pass a copy here
    # TODO
    pass


if __name__ == "__main__":
    b = replicas_base()
    w = replicas_words(b)
    g = w.groupby("Word").count()
    pass
