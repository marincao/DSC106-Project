const cellSize = 15;
const rows = 32;
const cols = 64;
const svgWidth = cols * cellSize;
const svgHeight = rows * cellSize;

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
                     .domain([0, 100]);

const availableFiles = [
    "data_json/1.json", "data_json/2.json", "data_json/3.json",
    "data_json/4.json", "data_json/5.json", "data_json/6.json",
    "data_json/7.json", "data_json/8.json", "data_json/9.json",
    "data_json/10.json", "data_json/11.json", "data_json/12.json",
    "data_json/13.json", "data_json/14.json", "data_json/15.json",
    "data_json/16.json", "data_json/17.json"
];

const postureMap = {
    "1.json": "Supine",
    "2.json": "Right",
    "3.json": "Left",
    "4.json": "Right: 1 Wedge Body-roll",
    "5.json": "Right: 2 Wedges Body-roll",
    "6.json": "Left: 1 Wedge Body-roll",
    "7.json": "Left: 2 Wedges Body-roll",
    "8.json": "Supine",
    "9.json": "Supine",
    "10.json": "Supine",
    "11.json": "Supine",
    "12.json": "Supine",
    "13.json": "Right Fetus",
    "14.json": "Left Fetus",
    "15.json": "Supine: 30 Bed Inclination",
    "16.json": "Supine: 45 Bed Inclination",
    "17.json": "Supine: 60 Bed Inclination"
};

let frames = [];
let currentFile = "data_json/1.json"; // default

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

const heatmapGroup = svg.append("g")


const selector = d3.select("#fileSelector");
selector.selectAll("option")
    .data(availableFiles)
    .enter()
    .append("option")
    .text(d => d.split('/')[1])
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

        // Extract posture name and display
        const posture = postureMap[fileName.split("/").pop()] || "Unknown";
        d3.select("#postureLabel").text(`Posture: ${posture}`);
    });
}

function drawFrame(frameIndex) {
    const frame = frames[frameIndex];

    const flatData = frame.flat();

    const cells = heatmapGroup.selectAll("rect")
                    .attr('class', 'cells')
                    .data(flatData);

    cells.join("rect")
        .attr("x", (d, i) => Math.floor(i / rows) * cellSize)
        .attr("y", (d, i) => (i % rows) * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", d => colorScale(d))
        .on("mouseover", function(event, d) {
            console.log("Hovered pressure:", d);  // should appear in dev console
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
            d3.select("#postureLabel").text(`Pressure: ${d.toFixed(1)} | Posture: ${currentPosture}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", null);
            d3.select("#postureLabel").text("Posture: Supine (Demo)");
        });
    
    createBrushSelector(svg);
}

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [cols * cellSize, rows * cellSize]])
    .extent([[0, 0], [svgWidth, svgHeight]])
    .on("zoom", (event) => {
        heatmapGroup.attr("transform", event.transform);
    });

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.cells, .overlay ~ *').raise();
  // The zoom functionality
  svg.call(zoom);
  
  // Function to handle brush events
  function brushed(event) {
    const selection = event.selection;
    
    if (!selection) {
        return;
    }
    
    const [[x0, y0], [x1, y1]] = selection;
    let brushedCount = 0;
    let totalPressure = 0;

    heatmapGroup.selectAll("rect")
        .each(function(d) {
            const rect = d3.select(this);
            const x = +rect.attr("x");
            const y = +rect.attr("y");

            const isBrushed = x >= x0 && x <= x1 && y >= y0 && y <= y1;

            if (isBrushed) {
                rect
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.3);
                brushedCount += 1;
                totalPressure += +d;
            } else {
                rect
                    .attr("stroke", null)
                    .attr("stroke-width", null);
            }
        });

    const avgPressure = brushedCount > 0 ? (totalPressure / brushedCount).toFixed(2) : 0;

    // Show on the website
    d3.select("#brushInfo")
        .text(`Cells Selected: ${brushedCount} cells, Avg Pressure: ${avgPressure}`);

    // console.log(`Brushed cells: ${brushedCount}, Avg Pressure: ${avgPressure}`);

    //brushGroup.call(brush.move, null);
}
}

