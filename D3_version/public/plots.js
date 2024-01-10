import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; //import D3

// change order of rendered objects
d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
          this.parentNode.insertBefore(this, firstChild);
      }
  });
};


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
var tooltip;

//selection
var season = 0;
var episode = 0;
var indexFrom;
var indexTo;
var seasonStarts = [0, 17, 40, 63, 87, 111, 135, 159, 183, 207, 231];
var character = "Sheldon";
var allCharacters = ["Amy", "Bernadette", "Penny", "Other", "Howard", "Leonard", "Raj", "Sheldon"];
var interactionCounts;
var interactionCharacter;
var wordChoice;
var wordChoiceCount;
var streamScaleX;
var seasonLength;

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
Promise.all([
    d3.csv("./public/data/data_ep_counts.csv"),
    d3.csv("./public/data/data_interactions.csv"),
    d3.csv("./public/data/data_ep_words.csv"),
    d3.csv("./public/data/episodes.csv")
]).then(function(files) {
  episodeCountsData = files[0]
  interactionsData = files[1]
  wordCountsData = files[2]
  episodeData = files[3]
    
  //load map and initialise the views
  init();

  // data visualization
  visualization();
})



/*----------------------
INITIALIZE VISUALIZATION
----------------------*/
function init() {
  //d3 canvases for svg elements
  stream = d3.select("#streamgraph").append("svg");

  episodeSelection = d3.select("#episode_select")
    .on("change", function(opt){
      episode = +d3.select("#episode_select").node().value;

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
          .attr("height", stream.node().getBoundingClientRect().height)
          .style("fill", "black")
          .style("opacity", .35)
          .style("stroke", "black")

      d3.select(".select_ptr").moveToBack()

      atoms()
      wcloud()
    })

  seasonSelection = d3.select("#season_select")
    .on("change", function(opt){
      season = +d3.select("#season_select").node().value;
      d3.selectAll(".episode_opt").remove();

      if(season == 0){
        episodeSelection.attr("disabled", "true")
        stream.select(".select_ptr").remove()
      }else{
        episodeSelection.attr("disabled", null);
        
        seasonLength = seasonStarts[season] - seasonStarts[season - 1]

        episodeSelection.append("option")
          .attr("class", "episode_opt")
          .attr("value", 0)
          .attr("selected", "true")
          .text("All episodes")

        for(let i = 1; i <= seasonLength; i++){
          episodeSelection.append("option")
            .attr("class", "episode_opt")
            .attr("value", i)
            .text("Episode " + i + " - " + getEpisodeName(i))
        }

        var xPos = streamScaleX(1 * seasonStarts[season - 1]);
        var ptrWidth = streamScaleX(1) - streamScaleX(0);
        d3.select(".select_ptr").remove();
        stream.append("rect")
          .attr("class", "select_ptr")
          .attr("x", xPos - (ptrWidth/2))
          .attr("y", 0)
          .attr("width", seasonLength * ptrWidth)
          .attr("height", stream.node().getBoundingClientRect().height)
          .style("fill", "black")
          .style("opacity", .35)
          .style("stroke", "black")

        d3.select(".select_ptr").moveToBack()
      }

      atoms()
      wcloud()
    })

  interactions = d3.select("#interactions").append("svg");

  wordCloud = d3.select("#wordcloud").append("svg");

  d3.select("#streamgraph").append("div")
    .attr("class", "tooltip")
    .attr("id", "stream-tooltip")
    .style("position", "absolute")
    .style("opacity", 0);

  d3.select("#interactions").append("div")
    .attr("class", "tooltip")
    .attr("id", "interactions-tooltip")
    .style("position", "absolute")
    .style("opacity", 0);

  d3.select("#wordcloud").append("div")
    .attr("class", "tooltip")
    .attr("id", "wordcloud-tooltip")
    .style("position", "absolute")
    .style("opacity", 0);

}


/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {
  streamgraph();
  atoms();
  wcloud();
}

function streamgraph(){
  var rect = stream.node().getBoundingClientRect(),
    width = rect.width,
    height = rect.height;

  // List of groups = header of the csv files
  var keys = new Set(["Other", "Penny", "Amy", "Bernadette",
  "Sheldon", "Leonard", "Howard", "Raj"]);

  streamScaleX = d3.scaleLinear()
    .domain([ 0, 231 ])
    .range([ 0, width ]);

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

  var mouseover = function(d) {
    tooltip = d3.select("#stream-tooltip")
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
      .html(i.key + ": click to select the character");
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
        atoms()
        wcloud()
      })
}

function atoms(){
  var rect = interactions.node().getBoundingClientRect(),
    width = rect.width,
    height = rect.height;

  var mousemove = function(d,i) {
    tooltip
      .style("top", (d.pageY - 10)+"px")
      .style("left",(d.pageX + 5)+"px")
      .html(character + " to " + interactionCharacter + ":<br> " 
        + d3.sum(interactionCounts[interactionCharacter]) + " interactions");
  }
  var mouseleave = function(d) {
    tooltip
      .style("opacity", 0);
    d3.selectAll(".atom")
      .style("opacity", 1);
    }

  d3.selectAll(".atom").remove();
  d3.selectAll(".atom-label").remove();
  d3.selectAll(".atom-edge").remove();
  d3.selectAll(".atom-heartbeat").remove();

  var centerX = width / 2;
  var centerY = height / 2;
  var radius = d3.min([centerX, centerY]) / 4;

  interactions.append("circle")
    .attr("class", "atom")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", radius)
    .style("fill", colorScale[character])
  
  interactions.append("text")
    .attr("class", "atom-label")
    .attr("x", centerX)
    .attr("y", centerY)
    .text(character)

  var rotation = 0;
  var edgeLength = radius;
  interactionCounts = countInteractions();
  var interactionScale = d3.scaleLinear()
    .domain([0, maxInteractions(interactionCounts) + 1])
    .range([0, radius]);

  for(let i = 0; i < allCharacters.length; i++){
    if(allCharacters[i] == character){
      continue
    }

    var dx = Math.sin(rotation) * (2* radius + edgeLength);
    var dy = Math.cos(rotation) * (2* radius + edgeLength);

    interactions.append("circle")
      .attr("class", "atom")
      .attr("cx", centerX + dx)
      .attr("cy", centerY + dy)
      .attr("r", radius)
      .style("fill", colorScale[allCharacters[i]])
      .on("mouseover", function(d) {
        interactionCharacter = allCharacters[i]
        tooltip = d3.select("#interactions-tooltip")
        tooltip
          .style("opacity", .9)
        d3.selectAll(".atom")
          .style("opacity", .2)
        d3.select(this)
          .style("opacity", 1)
      })
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("click", function(d, j) {
        tooltip
          .style("opacity", 0);
        character = allCharacters[i]
        atoms()
        wcloud()
      })
  
    interactions.append("text")
      .attr("class", "atom-label")
      .attr("x", centerX + dx)
      .attr("y", centerY + dy)
      .text(allCharacters[i])

    var xStart = centerX + Math.sin(rotation) * radius;
    var yStart = centerY + Math.cos(rotation) * radius;
    var xEnd = centerX + Math.sin(rotation) * (edgeLength + radius);
    var yEnd = centerY + Math.cos(rotation) * (edgeLength + radius);

    interactions.append("line")
      .attr("class", "atom-edge")
      .attr("x1", xStart)
      .attr("y1", yStart)
      .attr("x2", xEnd)
      .attr("y2", yEnd)

    var xFrom = xStart;
    var yFrom = yStart;
    var xLeftPrev = xStart;
    var yLeftPrev = yStart;
    var xRightPrev = xStart;
    var yRightPrev = yStart;

    var characterInteractions = interactionCounts[allCharacters[i]];

    for(let j = 0; j < interactionCounts[allCharacters[i]].length; j++){
      xFrom += Math.sin(rotation) * edgeLength / (characterInteractions.length + 1)
      yFrom += Math.cos(rotation) * edgeLength / (characterInteractions.length + 1)

      var scaled = (interactionScale(characterInteractions[j]) / 2);

      var xLeft = scaled * Math.sin(rotation + Math.PI / 2);
      var yLeft = scaled * Math.cos(rotation + Math.PI / 2);
      var xRight = scaled * Math.sin(rotation - Math.PI / 2);
      var yRight = scaled * Math.cos(rotation - Math.PI / 2);

      var x1 = xFrom + xLeft;
      var y1 = yFrom + yLeft;
      var x2 = xFrom + xRight;
      var y2 = yFrom + yRight;

      interactions.append("path")
        .attr("class", "atom-heartbeat")
        .attr("d", "M" + xLeftPrev + "," + yLeftPrev + " L" + x1 + "," + y1 + " L" + x2 + "," + y2 + " L" + xRightPrev + "," + yRightPrev +" Z")
        .style("fill", colorScale[allCharacters[i]])

      xLeftPrev = x1;
      yLeftPrev = y1;
      xRightPrev = x2;
      yRightPrev = y2;
    }    

    interactions.append("path")
        .attr("class", "atom-heartbeat")
        .attr("d", "M" + xLeftPrev + "," + yLeftPrev + " L" + xEnd + "," + yEnd + " L" + xRightPrev + "," + yRightPrev +" Z")
        .style("fill", colorScale[allCharacters[i]])

    rotation += 2* Math.PI / 7;
  }
}

function countInteractions(){
  var groupSeasons = false;
  var interactionCounts = {}

  indexRange();

  if(season == 0){
    groupSeasons = true;
  }

  for(let i = 0; i < allCharacters.length; i++){
    if(allCharacters[i] == character){
      continue;
    }
    if(groupSeasons){
      interactionCounts[allCharacters[i]] = Array(10).fill(0);
    } else {
      interactionCounts[allCharacters[i]] = Array(indexTo-indexFrom).fill(0);
    } 
  }

  for(let i = 0; i < interactionsData.length; i++){
    var index = interactionsData[i]["EpisodeID"];
    if(index < indexFrom || index >= indexTo){
      continue;
    }
    if(interactionsData[i]["Character"] != character){
      continue;
    }

    var replyTo = interactionsData[i]["ReplyTo"];
    if(replyTo == character){
      continue;
    }

    if(groupSeasons){
      interactionCounts[replyTo][idToSeason(index) - 1] += 1;
    } else {
      interactionCounts[replyTo][index-indexFrom] += 1;
    }
  }
  return interactionCounts;
}

function idToSeason(episodeID){
  var s = 0;
  for(let i = 0; i < seasonStarts.length; i++){
    if(episodeID < seasonStarts[i]){
      return s;
    }
    s++;
  }
  return s;
}

function maxInteractions(counts){
  var most = 0;

  for(let key in counts){
    var arrMax = d3.max(counts[key]);
    most = d3.max([most, arrMax]);
  }

  return most;
}

function topWords(){
  indexRange();

  return topTen(countWords())
}

function indexRange(){
  if(season == 0){
    indexFrom = 0;
    indexTo = 231;
  } else if(episode == 0){
    indexFrom = seasonStarts[season-1];
    indexTo = seasonStarts[season];
  } else {
    indexFrom = seasonStarts[season-1] + episode - 1;
    indexTo = indexFrom + 1
  }
}

function countWords(){
  var counts = new Map();

  for(let i = 0; i < wordCountsData.length; i++){
    var record = wordCountsData[i];
    if(+record["EpisodeID"] < indexFrom || +record["EpisodeID"] >= indexTo || record["Character"] != character || record["Word"] == ""){
      continue;
    }
    if(!(counts.has(record["Word"]))){
      counts.set(record["Word"], 0)
    }
    counts.set(record["Word"], counts.get(record["Word"]) + +record["Count"])
  }

  return counts
}

function topTen(words){
  var lowest = 0;
  var topTen = Array(10).fill({"word": "", "count": 0})

  for(let [word, count] of words.entries()){

    if(count < lowest){
      continue;
    }

    var smallest = count;
    var smallestIndex = -1;
    var secondSmallest = Infinity;

    for(let i = 0; i < topTen.length;i++){
      if(topTen[i]["count"] <= smallest){
        secondSmallest = smallest;
        smallestIndex = i;
        smallest = topTen[i]["count"];
      } else if(topTen[i]["count"] < secondSmallest){
        secondSmallest = topTen[i]["count"];
      }
    }

    topTen[smallestIndex] = {"word": word, "count": count};
    lowest = d3.min([secondSmallest, count]);
  }

  return topTen;
}

function wcloud(){
  d3.selectAll(".cloud-word").remove()
  var words = topWords();

  textPosition(words)
}

function textPosition(words){
  var rect = wordCloud.node().getBoundingClientRect(),
    width = rect.width,
    height = rect.height;

  let xCenter = height / 2
  let yCenter = width / 2

  if(words[0]["count"] == 0){
    wordCloud.append("text")
      .attr("class", "cloud-word")
      .attr("font-size", 10)
      .attr("x", xCenter)
      .attr("y", yCenter)
      .attr("text-anchor", "middle")
      .text(character+" did not say a word in this period!")

      return
  }

  sortByCount(words);

  let wordScale = d3.scaleLinear()
  .domain([ Math.log(words[9]["count"]), Math.log(words[0]["count"]) ])
  .range([ 0.2, 1 ]);
  let font = fontSize(words, height, wordScale);

  let x = xCenter;
  let y = 0;

  for(let i=0; i<words.length; i++){
    
    let size = Math.floor(font*wordScale(Math.log(words[i]["count"])));
    y += size + 1

    wordCloud.append("text")
      .attr("class", "cloud-word")
      .attr("font-size", Math.floor(font*wordScale(Math.log(words[i]["count"]))))
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .text(words[i]["word"])
      .on("mouseover", function(d){
        wordChoice = words[i]["word"];
        wordChoiceCount = words[i]["count"];
        tooltip = d3.select("#wordcloud-tooltip");
        tooltip
          .style("opacity", .9)
        d3.selectAll(".cloud-word")
          .style("opacity", .2)
        d3.select(this)
          .style("opacity", 1)
      })
      .on("mousemove", function(d,i) {
        tooltip
          .style("top", (d.pageY - 10)+"px")
          .style("left",(d.pageX + 5)+"px")
          .html("'"+wordChoice+"': "+wordChoiceCount+" times");
      })
      .on("mouseleave", function(d) {
        tooltip
          .style("opacity", 0);
        d3.selectAll(".cloud-word")
          .style("opacity", 1);
      })
  }
}

function sortByCount(words){
  words.sort(function(a,b){return b["count"] - a["count"]})
}

function fontSize(words, height, scale){
  let sum = 1;
  for(let record of words){
    sum += scale(Math.log(record["count"]));
  }
  return height/sum
}

function getEpisodeName(ep){
  return episodeData[seasonStarts[season-1] + ep - 1]["EpisodeName"]
}