const cellSize = 15;
const rows = 32;
const cols = 64;

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
                     .domain([0, 100]);
// Predefined list of available JSON files
const availableFiles = [
    "data_json/1.json", "data_json/2.json", "data_json/3.json",
    "data_json/4.json", "data_json/5.json", "data_json/6.json",
    "data_json/7.json", "data_json/8.json", "data_json/9.json",
    "data_json/10.json", "data_json/11.json", "data_json/12.json",
    "data_json/13.json", "data_json/14.json", "data_json/15.json",
    "data_json/16.json", "data_json/17.json"
];

let frames = [];
let currentFile = "data_json/1.json"; // default

const svg = d3.select("#heatmap")
              .append("svg")
              .attr("width", cols * cellSize)
              .attr("height", rows * cellSize);

// Populate file selector
const selector = d3.select("#fileSelector");
selector.selectAll("option")
    .data(availableFiles)
    .enter()
    .append("option")
    .text(d => d.split('/')[1])  // only show 1.json, 2.json
    .attr("value", d => d);

// Load initial file
loadFrames(currentFile);

// Update when file selected
selector.on("change", function() {
    currentFile = this.value;
    loadFrames(currentFile);
});

// Frame slider
d3.select("#frameSlider").on("input", function() {
    const frameIndex = +this.value;
    drawFrame(frameIndex);
    d3.select("#frameNumber").text(frameIndex);
});

function loadFrames(fileName) {
    d3.json(fileName).then(function(data) {
        frames = data;
        d3.select("#frameSlider").attr("max", frames.length - 1).property("value", 0);
        drawFrame(0);
        d3.select("#frameNumber").text(0);
    });
}

function drawFrame(frameIndex) {
    const frame = frames[frameIndex];

    const flatData = frame.flat();

    const cells = svg.selectAll("rect")
                     .data(flatData);

    cells.join("rect")
        .attr("x", (d, i) => Math.floor(i / rows) * cellSize)
        .attr("y", (d, i) => (i % rows) * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", d => colorScale(d))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
            d3.select("#postureLabel").text(`Pressure: ${d.toFixed(1)} | Posture: Supine (Demo)`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", null);
            d3.select("#postureLabel").text("Posture: Supine (Demo)");
        });
}