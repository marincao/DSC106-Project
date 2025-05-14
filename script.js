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
let brushEnabled = false; // Track brush state

const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

const heatmapGroup = svg.append("g");

// Add toggle button to HTML controls
d3.select("#brushToggle").on("click", toggleBrush);

// Initialize file selector
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

function toggleBrush() {
    brushEnabled = !brushEnabled;
    d3.select("#brushToggle").text(brushEnabled ? "Disable Brush" : "Enable Brush");
    
    // Clear all brush strokes when disabling brush mode
    if (!brushEnabled) {
        heatmapGroup.selectAll("rect").attr("stroke", null);
        d3.select("#brushInfo").text("Cells Selected: 0 cells, Avg Pressure: 0.0");
    }
    
    // Redraw the current frame
    drawFrame(d3.select("#frameSlider").property("value"));
}

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

    // Clear previous brush
    svg.selectAll(".brush").remove();

    // Create tooltip
    const tooltip = d3.select("#tooltip");

    // Update cells
    const cells = heatmapGroup.selectAll("rect")
        .data(flatData);

    cells.join("rect")
        .attr("x", (d, i) => Math.floor(i / rows) * cellSize)
        .attr("y", (d, i) => (i % rows) * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", d => colorScale(d))
        .on("mouseover", function(event, d) {
            if (!brushEnabled) {
                d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
                
                // Show tooltip near cursor
                tooltip.classed("hidden", false)
                    .html(`Pressure: ${d.toFixed(1)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            }
        })
        .on("mousemove", function(event, d) {
            if (!brushEnabled) {
                // Move tooltip with cursor
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 10) + "px");
            }
        })
        .on("mouseout", function() {
            if (!brushEnabled) {
                d3.select(this).attr("stroke", null);
                tooltip.classed("hidden", true);
            }
        });

    // Initialize brush if enabled
    if (brushEnabled) {
        const brush = d3.brush()
            .extent([[0, 0], [svgWidth, svgHeight]])
            .on("start brush end", brushed);

        svg.append("g")
            .attr("class", "brush")
            .call(brush);
    }
}

function brushed(event) {
    if (!brushEnabled) return;

    const selection = event.selection;
    
    if (!selection) {
        d3.select("#brushInfo").text("Cells Selected: 0 cells, Avg Pressure: 0.0");
        heatmapGroup.selectAll("rect").attr("stroke", null);
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
                rect.attr("stroke", "blue").attr("stroke-width", 0.5);
                brushedCount += 1;
                totalPressure += +d;
            } else {
                rect.attr("stroke", null);
            }
        });

    const avgPressure = brushedCount > 0 ? (totalPressure / brushedCount).toFixed(2) : 0;
    d3.select("#brushInfo").text(`Cells Selected: ${brushedCount}, Avg Pressure: ${avgPressure}`);
}

function drawFixedLegend() {
    const legendWidth = 300;
    const legendHeight = 15;
  
    const svg = d3.select("#legend")
      .append("svg")
      .attr("width", legendWidth + 50)
      .attr("height", 40);
  
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("x2", "100%");
  
    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(d * 100));
  
    svg.append("rect")
      .attr("x", 25).attr("y", 10)
      .attr("width", legendWidth).attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");
  
    const scale = d3.scaleLinear().domain([0, 100]).range([25, 25 + legendWidth]);
  
    const axis = d3.axisBottom(scale)
        .tickValues([0, 20, 40, 60, 80, 100])
        .tickFormat(d => d.toFixed(0));

    svg.append("g")
      .attr("transform", `translate(0, ${10 + legendHeight})`)
      .call(axis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#444");
  }
drawFixedLegend();