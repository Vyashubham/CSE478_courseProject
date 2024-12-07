// Global variables and configuration
const margin = { top: 70, right: 150, bottom: 70, left: 100 };
const width = 800;
const height = 600;

// Scales and axes (initialized later)
let xScale, yScale;
let scaleType = "linear";

// Data variables
let data;

// D3 selections
let svg, plotArea, tooltip, circles;
let xAxisGroup, yAxisGroup;
let colorScale;

// HTML elements
let scaleTypeSelect, xMaxSlider, xMaxValueSpan;

// Initialization: load data and then draw the chart
loadData().then((loadedData) => {
    data = loadedData;
    initChart();
    drawChart();
    addEventListeners();
});

/**
 * Load and prepare data
 */
async function loadData() {
    const [educationData, literacyData] = await Promise.all([
        d3.csv("data/Global_Education.csv"), // Adjust path as needed
        d3.csv("data/LiteracyRate.csv")
    ]);

    const countryNameCorrections = {
        "United States": "United States of America",
        "Russia": "Russia"
    };

    // Create a map of Literacy Rates by country
    const literacyMap = new Map();
    literacyData.forEach(d => {
        let country = d.Country.trim();
        if (countryNameCorrections[country]) {
            country = countryNameCorrections[country];
        }
        literacyMap.set(country, +d['Literacy Rate'] * 100); // Convert to percentage
    });

    // Process and merge data
    const mergedData = educationData.map(d => {
        const country = d['Countries and areas'].trim();
        return {
            Country: country,
            Gross_Primary_Education_Enrollment: +d.Gross_Primary_Education_Enrollment || null,
            Birth_Rate: +d.Birth_Rate || null,
            Unemployment_Rate: +d.Unemployment_Rate || null,
            Literacy_Rate: literacyMap.get(country) || null
        };
    }).filter(d =>
        d.Gross_Primary_Education_Enrollment !== null &&
        d.Literacy_Rate !== null &&
        d.Birth_Rate !== null
    );

    return mergedData;
}

/**
 * Initialize the chart area, scales, and SVG elements
 */
function initChart() {
    // Create SVG container
    svg = d3.select("#scatterplot")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .style("max-width", "100%")
    .style("height", "auto");
    plotArea = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up initial scales (linear as default)
    const xDomain = d3.extent(data, d => d.Gross_Primary_Education_Enrollment);
    const yDomain = d3.extent(data, d => d.Literacy_Rate);
    xScale = d3.scaleLinear().domain(xDomain).nice().range([0, width]);
    yScale = d3.scaleLinear().domain(yDomain).nice().range([height, 0]);

    // Color Scale: Birth Rate
    colorScale = d3.scaleSequential()
        .domain(d3.extent(data, d => d.Birth_Rate))
        .interpolator(d3.interpolatePlasma);

    // Axes groups
    xAxisGroup = plotArea.append("g")
        .attr("transform", `translate(0,${height})`);

    yAxisGroup = plotArea.append("g");

    // Tooltip
    tooltip = d3.select("#scatterplot").append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");

    // Chart Title
    svg.append("text")
        .attr("x", (width + margin.left + margin.right) / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Gross Primary Education Enrollment vs. Literacy Rate");

    // X-axis Label
    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Gross Primary Education Enrollment (%)");

    // Y-axis Label
    svg.append("text")
        .attr("transform", `translate(${margin.left - 60}, ${margin.top + height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Literacy Rate (%)");

    // Draw legend
    drawLegend();

    // Initially draw axes
    drawAxes();
}

/**
 * Draw the scatterplot circles
 */
function drawChart() {
    // Plot data points
    circles = plotArea.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.Gross_Primary_Education_Enrollment))
        .attr("cy", d => yScale(d.Literacy_Rate))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.Birth_Rate))
        .attr("opacity", 0.8)
        .on("mouseover", onMouseOverCircle)
        .on("mousemove", onMouseMoveCircle)
        .on("mouseout", onMouseOutCircle);
}

/**
 * Draw the axes based on the current scales
 */
function drawAxes() {
    const xAxis = (scaleType === "log") 
        ? d3.axisBottom(xScale).tickFormat(d3.format(".1f"))
        : d3.axisBottom(xScale);

    xAxisGroup.transition()
        .duration(1000)
        .call(xAxis);

    const yAxis = d3.axisLeft(yScale);
    yAxisGroup.call(yAxis);
}

/**
 * Draw the legend for the birth rate color scale
 */
function drawLegend() {
    const legendHeight = 200;
    const legendWidth = 20;
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left +80}, ${margin.top + (height - legendHeight) / 2})`);

    // Define gradient for legend
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

    linearGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .enter().append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(colorScale.domain()[0] + d * (colorScale.domain()[1] - colorScale.domain()[0])));

    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    // Legend scale
    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendHeight]);

    // Legend axis
    const legendAxis = d3.axisRight(legendScale)
        .ticks(6)
        .tickFormat(d3.format(".2f"));

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    // Legend Label
    legend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .text("Birth Rate");
}

/**
 * Add event listeners for the scale type dropdown and the xMax slider
 */
function addEventListeners() {
    scaleTypeSelect = document.getElementById("scaleType");
    xMaxSlider = document.getElementById("xMax");
    xMaxValueSpan = document.getElementById("xMaxValue");

    scaleTypeSelect.addEventListener("change", () => {
        scaleType = scaleTypeSelect.value;
        updateScales();
        updateChart();
    });

    xMaxSlider.addEventListener("input", () => {
        xMaxValueSpan.textContent = xMaxSlider.value;
        updateScales();
        updateChart();
    });
}

/**
 * Update the scales based on the current selection of scale type and slider values
 */
function updateScales() {
    const maxValue = +xMaxSlider.value;
    const originalExtent = d3.extent(data, d => d.Gross_Primary_Education_Enrollment);
    const updatedDomain = [originalExtent[0], maxValue];

    if (scaleType === "linear") {
        xScale = d3.scaleLinear().domain(updatedDomain).nice().range([0, width]);
    } else if (scaleType === "log") {
        // Ensure domain is strictly positive for log scale
        const safeDomain = updatedDomain[0] <= 0 ? [1, updatedDomain[1]] : updatedDomain;
        xScale = d3.scaleLog().domain(safeDomain).range([0, width]);
    }
}

/**
 * Update the chart (axes and circles) to reflect changes in the scale
 */
function updateChart() {
    drawAxes();

    // Transition circles to new positions
    circles.transition()
        .duration(1000)
        .attr("cx", d => xScale(d.Gross_Primary_Education_Enrollment));
}

/**
 * Mouse event handlers for tooltips
 */
function onMouseOverCircle(event, d) {
    d3.select(this)
        .transition().duration(200)
        .attr("r", 10);

    tooltip.style("visibility", "visible")
        .html(`<b>Country:</b> ${d.Country}<br>
               <b>Enrollment:</b> ${d.Gross_Primary_Education_Enrollment}%<br>
               <b>Literacy Rate:</b> ${d.Literacy_Rate.toFixed(2)}%<br>
               <b>Birth Rate:</b> ${d.Birth_Rate}`);
}

function onMouseMoveCircle(event) {
    tooltip.style("top", `${event.pageY - 10}px`)
           .style("left", `${event.pageX + 10}px`);
}

function onMouseOutCircle() {
    d3.select(this)
        .transition().duration(200)
        .attr("r", 6);
    tooltip.style("visibility", "hidden");
}