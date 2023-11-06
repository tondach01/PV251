import plotly.express as px
import pandas as pd

COLORS = {
    "Amy": "#fecc5c",
    "Bernadette": "#fd8d3c",
    "Penny": "#f03b20",
    "Sheldon": "#045a8d",
    "Leonard": "#2b8cbe",
    "Howard": "#74a9cf",
    "Raj": "#bdc9e1",
    "Other": "#238b45"
}

SEASONS = [0, 17, 40, 63, 87, 111, 135, 159, 183, 207, 231]


def stream_graph(df: pd.DataFrame, s=0, ep=0):
    bar = px.bar(df, x="EpisodeID", y="Count", color="Character", color_discrete_map=COLORS,
                 category_orders={"Character": ["Sheldon", "Leonard", "Howard", "Raj", "Other", "Penny", "Bernadette",
                                                "Amy"]})
    bar.update_layout({"plot_bgcolor": "#ffffff", "showlegend": False, "bargap": 0})
    bar.update_yaxes(visible=False)
    bar.update_xaxes(visible=False)

    for i, x in enumerate(SEASONS[:-1]):
        bar.add_vline(x=x-0.5, annotation={"text": f"Season{i+1}"}, opacity=0.2)

    if s != 0:
        ep_index = SEASONS[s - 1] + (ep - 1)
        if ep != 0:
            ep_height = sum(
                [df.loc[(df["Character"] == x) & (df["EpisodeID"] == ep_index), ["Count"]].values[0][0]
                 for x in ["Sheldon", "Leonard", "Howard", "Raj"]]
            )
            ep_depth = sum(
                [df.loc[(df["Character"] == x) & (df["EpisodeID"] == ep_index), ["Count"]].values[0][0]
                 for x in ["Other", "Penny", "Bernadette", "Amy"]]
            )
            bar.add_shape({"fillcolor": "#de2d26", "opacity": 0.9, "type": "path", "line": {"color": "#de2d26"},
                           "path": f"M {ep_index - 1} {ep_height + 500} H {ep_index + 1} "
                                   f"L {ep_index} {ep_height + 250} Z"})
            bar.add_shape({"fillcolor": "#de2d26", "opacity": 0.9, "type": "path", "line": {"color": "#de2d26"},
                           "path": f"M {ep_index - 1} {ep_depth - 500} H {ep_index + 1} "
                                   f"L {ep_index} {ep_depth - 250} Z"})
        else:
            ep_height = max(
                [sum([df.loc[(df["Character"] == x) & (df["EpisodeID"] == i), ["Count"]].values[0][0]
                 for x in ["Sheldon", "Leonard", "Howard", "Raj"]]) for i in range(SEASONS[s - 1], SEASONS[s])]
            )
            ep_depth = min(
                [sum([df.loc[(df["Character"] == x) & (df["EpisodeID"] == i), ["Count"]].values[0][0]
                      for x in ["Other", "Penny", "Bernadette", "Amy"]]) for i in range(SEASONS[s - 1], SEASONS[s])]
            )
            bar.add_shape({"fillcolor": "#de2d26", "opacity": 0.9, "type": "path", "line": {"color": "#de2d26"},
                           "path": f"M {SEASONS[s - 1] - 0.5} {ep_height + 100} H {SEASONS[s] - 0.5} "
                                   f"V {ep_height + 10} H {SEASONS[s] - 1.5} V {ep_height + 50} "
                                   f"H {SEASONS[s - 1] + 0.5} V {ep_height + 10} H {SEASONS[s - 1] - 0.5} Z"})
            bar.add_shape({"fillcolor": "#de2d26", "opacity": 0.9, "type": "path", "line": {"color": "#de2d26"},
                           "path": f"M {SEASONS[s - 1] - 0.5} {ep_depth - 100} H {SEASONS[s] - 0.5} V {ep_depth - 10} "
                                   f"H {SEASONS[s] - 1.5} V {ep_depth - 50} H {SEASONS[s - 1] + 0.5} "
                                   f"V {ep_depth - 10} H {SEASONS[s - 1] - 0.5} Z"})
    bar.show()


if __name__ == "__main__":
    d = pd.read_csv("data_words.csv")
    stream_graph(d, s=2)
