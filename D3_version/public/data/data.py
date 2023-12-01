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
    df.dropna(subset=["Character"], inplace=True)

    df["Word"] = df["Replica"].apply(lambda x: str(x).split())
    df.drop(columns=["Replica"], inplace=True)
    df = df.explode("Word", ignore_index=True)

    df["Word"] = df["Word"].apply(lambda x: str(x).strip(".,!?-:\"…”;"))
    df["Word"].replace("", np.nan, inplace=True)
    df.dropna(subset=["Word"], inplace=True)

    val = set(df["Word"].values)
    df["Word"] = df["Word"].apply(lambda x: str(x).lower() if str(x).lower() in val else x)

    mask_frequent(df)

    by_episode = pd.DataFrame({'Count': df.groupby(["EpisodeID", "Character"]).size()}).reset_index()
    by_ep_word = pd.DataFrame({'Count': df.groupby(["EpisodeID", "Character", "Word"]).size()}).reset_index()
    all_tuples = (pd.DataFrame(set(df["EpisodeID"].values), columns=["EpisodeID"])
                  .merge(pd.DataFrame(set(df["Character"].values), columns=["Character"]), how="cross"))

    episode_counts = all_tuples.merge(by_episode, how="left", on=["Character", "EpisodeID"])
    episode_counts["Count"].fillna(0, inplace=True)

    ep_word_counts = all_tuples.merge(by_ep_word, how="left", on=["Character", "EpisodeID"])
    ep_word_counts["Count"].fillna(0, inplace=True)
    index = ep_word_counts.loc[ep_word_counts["Word"] == "***"].index
    ep_word_counts.drop(index=index, inplace=True)

    def prepare_for_stacking(row):
        row["Count"] = -row["Count"] if row["Character"] in ["Amy", "Bernadette", "Penny", "Other"] else row["Count"]
        row["Count"] += 0.1 if row["Count"] == 0 and row["Character"] == "Raj" \
            else (-0.1 if row["Count"] == 0 and row["Character"] in ["Amy", "Bernadette", "Penny", "Other"] else 0)
        return row

    episode_counts = episode_counts.apply(prepare_for_stacking, axis=1)

    return episode_counts, ep_word_counts


# word list from sketchengine.eu
def mask_frequent(df, wordlist: str = "wordlist_ententen21.csv"):
    wl = set(pd.read_csv(wordlist, header=2)["Item"].values)
    df["Word"] = df["Word"].apply(lambda x: x if x not in wl else "***")


def replicas_interactions(base: pd.DataFrame):
    df = base.copy(deep=True)
    df["ReplyTo"] = df["Character"].shift(fill_value=np.nan)
    df.drop(columns=["Replica"], inplace=True)
    df.dropna(how="any", inplace=True)
    return df


if __name__ == "__main__":
    b = replicas_base()
    e, w = replicas_words(b)
    i = replicas_interactions(b)
    w.to_csv("data_ep_words.csv", index=False)
    e.to_csv("data_ep_counts.csv", index=False)
    i.to_csv("data_interactions.csv", index=False)
