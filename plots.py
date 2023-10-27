import plotly.express as px
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from scipy import stats

COLORS = {
    "Amy": "#fee6ce",
    "Bernadette": "#fdae6b",
    "Penny": "#e6550d",
    "Sheldon": "#2171b5",
    "Leonard": "#6bead6",
    "Howard": "#bdd7e7",
    "Raj": "#eff3ff",
    "Other": "#238b45"
}


def gaussian_smooth(x, y, sd=5):
    weights = np.array([stats.norm.pdf(x, m, sd) for m in x])
    weights = weights / weights.sum(1)
    return (weights * y).sum(1)


def stream_graph(df: pd.DataFrame, s=None, ep=None):
    counts = pd.DataFrame({'Count': df.groupby(["EpisodeID", "Character"]).size()}).reset_index()
    all_tuples = (pd.DataFrame(set(df["EpisodeID"].values), columns=["EpisodeID"])
                  .merge(pd.DataFrame(set(df["Character"].values), columns=["Character"]), how="cross"))

    joined = all_tuples.merge(counts, how="left", on=["Character", "EpisodeID"])
    joined["Count"] = joined["Count"].fillna(0)
    x = np.arange(1, 232)
    y = joined.pivot(index="Character", columns="EpisodeID", values="Count")
    #fig = px.area(joined, x="EpisodeID", y="Count", color="Character", color_discrete_map=COLORS,
    #              category_orders={"Character": ["Raj", "Howard", "Leonard", "Sheldon", "Penny", "Bernadette",
    #                                             "Amy", "Other"]})
    #fig.show()

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.stackplot(x, y, baseline="sym", colors=[COLORS[c] for c in sorted(COLORS.keys())], labels=y.index)
    ax.legend()

    plt.show()


if __name__ == "__main__":
    import data
    d = pd.read_csv("data_words.csv")
    stream_graph(d)
