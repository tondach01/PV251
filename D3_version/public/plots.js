import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; //import D3

//variable containing reference to data
var episodeCountsData;
var wordCountsData;
var interactionsData;
var episodeData;

//D3.js canvases
var seasonSelection;
var episodeSelection;
var stream;
var interactions;
var wordCloud;

//scaling
var width = d3.select("#streamgraph").node().clientWidth;
var height = d3.select("#streamgraph").node().clientHeight;
var streamScaleX;

//episode selection
var season = 0;
var episode = 0;
var seasonStarts = [0, 17, 40, 63, 87, 111, 135, 159, 183, 207, 231];
var character;

//colors
var colorScale = {
  "Amy": "#fecc5c",
  "Bernadette": "#fd8d3c",
  "Penny": "#f03b20",
  "Sheldon": "#045a8d",
  "Leonard": "#2b8cbe",
  "Howard": "#bdc9e1",
  "Raj": "#74a9cf",
  "Other": "#238b45"
};

//Loading data from CSV
d3.csv("./data/data_ep_counts.csv", function(d) {
  return {
    EpisodeID: +d["EpisodeID"],
    Character: d["Character"],
    Count: +d["Count"]
  }
})
  .then(function(csvData) {
    episodeCountsData = csvData;
    streamScaleX = d3.scaleLinear()
      .domain([ 0, 231 ])
      .range([ 0, width ]);
  });

d3.csv("./data/data_ep_words.csv", function(d) {
  return {
    EpisodeID: +d["EpisodeID"],
    Character: d["Character"],
    Word: d["Word"],
    Count: +d["Count"]
  }
})
  .then(function(csvData) {
    wordCountsData = csvData;
  });

d3.csv("./data/data_interactions.csv", function(d) {
  return {
    EpisodeID: +d["EpisodeID"],
    Character: d["Character"],
    ReplyTo: d["ReplyTo"]
  }
})
  .then(function(csvData) {
    interactionsData = csvData;
  });

d3.csv("./data/episodes.csv", function(d) {
  return {
    EpisodeID: +d["ID"],
    Season: +d["Series"],
    EpisodeNo: +d["EpisodeNumber"],
    EpisodeName: d["EpisodeName"]
  }
})
  .then(function(csvData) {
    //store loaded data in global variable
    episodeData = csvData;

    //load map and initialise the views
    init();

    // data visualization
    visualization();
  });

/*----------------------
INITIALIZE VISUALIZATION
----------------------*/
function init() {
  //d3 canvases for svg elements
  stream = d3.select("#streamgraph").append("svg")
    .attr("width", d3.select("#streamgraph").node().clientWidth)
    .attr("height", d3.select("#streamgraph").node().clientHeight);

  episodeSelection = d3.select("#episode_select")
    .on("change", function(opt){
      episode = d3.select("#episode_select").node().value;

      var xPos;
      var selectionWidth;
      var ptrWidth = streamScaleX(1) - streamScaleX(0);
      d3.select(".select_ptr").remove();

      if(episode == 0){
        xPos = streamScaleX(1 * seasonStarts[season - 1]);
        selectionWidth = seasonLength * ptrWidth;
      }else{
        xPos = streamScaleX(1 * seasonStarts[season - 1] + 1 * episode - 1);
        selectionWidth = ptrWidth;
      }

      stream.append("rect")
          .attr("class", "select_ptr")
          .attr("x", xPos - (ptrWidth/2))
          .attr("y", 0)
          .attr("width", selectionWidth)
          .attr("height", height)
          .style("fill", "black")
          .style("opacity", .35)
          .style("stroke", "black")

      console.log(episode);
    })

  seasonSelection = d3.select("#season_select")
    .on("change", function(opt){
      season = d3.select("#season_select").node().value;
      d3.selectAll(".episode_opt").remove();

      if(season == 0){
        episodeSelection.attr("disabled", "true")
        stream.select(".select_ptr").remove()
      }else{
        episodeSelection.attr("disabled", null);
        
        var seasonLength = seasonStarts[season] - seasonStarts[season - 1]

        episodeSelection.append("option")
          .attr("class", "episode_opt")
          .attr("value", 0)
          .attr("selected", "true")
          .text("All episodes")

        for(let i = 1; i <= seasonLength; i++){
          episodeSelection.append("option")
            .attr("class", "episode_opt")
            .attr("value", i)
            .text("Episode " + i)
        }

        var xPos = streamScaleX(1 * seasonStarts[season - 1]);
        var ptrWidth = streamScaleX(1) - streamScaleX(0);
        d3.select(".select_ptr").remove();
        stream.append("rect")
          .attr("class", "select_ptr")
          .attr("x", xPos - (ptrWidth/2))
          .attr("y", 0)
          .attr("width", seasonLength * ptrWidth)
          .attr("height", height)
          .style("fill", "black")
          .style("opacity", .35)
          .style("stroke", "black")
      }
      console.log(season);
    })

  interactions = d3.select("#interactions").append("svg")
    .attr("width", d3.select("#interactions").node().clientWidth)
    .attr("height", d3.select("#interactions").node().clientHeight);

  wordCloud = d3.select("#wordcloud").append("svg")
    .attr("width", d3.select("#wordcloud").node().clientWidth)
    .attr("height", d3.select("#wordcloud").node().clientHeight);

}


/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {
  streamgraph();
}

function streamgraph(){

  // List of groups = header of the csv files
  var keys = new Set(["Other", "Penny", "Amy", "Bernadette",
  "Sheldon", "Leonard", "Howard", "Raj"]);

  //stack the data
  var stackedData = d3.stack()
    .offset(d3.stackOffsetDiverging)
    .keys(keys)
    .value(([, group], key) => group.get(key).Count)
    (d3.index(episodeCountsData, d => d.EpisodeID, d => d.Character))    

  var maxArea = 0;
  var minArea = 0;
  for(let c = 0; c < stackedData.length; c++){
    for(let i = 0; i < stackedData[c].length; i++){
      if(stackedData[c][i][0] < minArea){
        minArea = stackedData[c][i][0];
      }
      if(stackedData[c][i][1] < minArea){
        minArea = stackedData[c][i][1];
      }
      if(stackedData[c][i][0] > maxArea){
        maxArea = stackedData[c][i][0];
      }
      if(stackedData[c][i][1] > maxArea){
        maxArea = stackedData[c][i][1];
      }
    }
  }

  var y = d3.scaleLinear()
    .domain([minArea, maxArea])
    .range([ height, 0 ]);


  // create a tooltip
  var tooltip = d3.select("#streamgraph").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0);

  // Three function that change the tooltip
  var mouseover = function(d) {
    tooltip
      .style("opacity", .9)
    d3.selectAll(".myArea")
      .style("opacity", .2)
    d3.select(this)
      .style("opacity", 1)
  }
  var mousemove = function(d,i) {
    tooltip
      .style("top", (d.pageY - 10)+"px")
      .style("left",(d.pageX + 5)+"px")
      .html(i.key + "<br>Click to choose this character");
  }
  var mouseleave = function(d) {
    tooltip
      .style("opacity", 0);
    d3.selectAll(".myArea")
      .style("opacity", 1);
    }

  // Area generator
  var area = d3.area()
    .x(function(d) { return streamScaleX(d.data[0]); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // Show the areas
  stream
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
      .attr("class", "myArea")
      .style("fill", function(d) { return colorScale[d.key]; })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("click", function(d, i) {
        character = i.key
        console.log(character)
      })
}