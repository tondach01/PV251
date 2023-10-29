import plotly.express as px
import plotly.graph_objects as po
import plotly.subplots as ps
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

    def negate_women_counts(row):
        row["Count"] = -row["Count"] if row["Character"] in ["Amy", "Bernadette", "Penny", "Other"] else row["Count"]
        return row

    joined = joined.apply(negate_women_counts, axis=1)
    bar = px.bar(joined, x="EpisodeID", y="Count", color="Character", color_discrete_map=COLORS,
                 category_orders={"Character": ["Sheldon", "Leonard", "Howard", "Raj", "Other", "Penny", "Bernadette",
                                                "Amy"]})

    men = joined.loc[joined["Character"].isin(["Sheldon", "Leonard", "Howard", "Raj"])]

    women = joined.loc[joined["Character"].isin(["Penny", "Bernadette", "Amy", "Other"])]

    # TODO bar.add_layout_image for episode and season
    for i, x in enumerate([0, 17, 40, 63, 87, 111, 135, 159, 183, 207]):
        bar.add_vline(x=x, annotation={"text": f"Season{i+1}"}, opacity=0.3)
    bar.show()


if __name__ == "__main__":
    import data
    d = pd.read_csv("data_words.csv")
    stream_graph(d)
