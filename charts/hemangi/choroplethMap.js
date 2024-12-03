// Updated SVG Dimensions
const width = 1400, // Increased width to make space for the legend
      height = 500;

// Helper function to create legends
function createLegend(svg, colorScale, title) {
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 500}, 50)`); // Position the legend on the right side

    // Add a background rectangle for better visibility
    legend.append("rect")
        .attr("x", -10)
        .attr("y", -20)
        .attr("width", 180)
        .attr("height", colorScale.range().length * 30 + 40)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("rx", 5) // Rounded corners
        .attr("ry", 5);

    // Add legend title
    legend.append("text")
        .attr("y", -5)
        .attr("x", 10)
        .style("text-anchor", "start")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .text(title);

    const categories = colorScale.range().map(d => colorScale.invertExtent(d));
    categories.forEach((d, i) => {
        // Add color swatches
        legend.append("rect")
            .attr("x", 10)
            .attr("y", i * 30)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorScale(d[0]));

        // Add category labels
        legend.append("text")
            .attr("x", 35)
            .attr("y", i * 30 + 13)
            .style("font-size", "12px")
            .text(`${Math.round(d[0] * 100)}% - ${Math.round(d[1] * 100)}%`);
    });
}

// Choropleth Map Function
function drawChoroplethMap() {
    const projection = d3.geoNaturalEarth1().scale(160).translate([width / 4, height / 2]); // Shift map to the left
    const path = d3.geoPath().projection(projection);
    const colorScale = d3.scaleQuantize([0, 1], d3.schemeBlues[9]);

    Promise.all([
        d3.json("https://unpkg.com/world-atlas@2/countries-50m.json"),
        d3.csv("../../data/LiteracyRate.csv") // Using the same data import
    ]).then(([world, literacyData]) => {
        // Create a mapping from country names to literacy rates
        const literacyMap = new Map(literacyData.map(d => [d.Country, +d['Literacy Rate']]));

        // Create the SVG container
        const svg = d3.select("#choropleth-map").append("svg")
            .attr("width", width)
            .attr("height", height);

        // Create a tooltip div but keep it hidden initially
        const tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

        // Add countries to the map
        svg.append("g").selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .join("path")
            .attr("fill", d => {
                const countryName = d.properties.name;
                const literacyRate = literacyMap.get(countryName) || 0;
                return colorScale(literacyRate);
            })
            .attr("d", path)
            .on("mouseover", function(event, d) {
                const countryName = d.properties.name;
                const literacyRate = literacyMap.get(countryName);
                tooltip.style("visibility", "visible")
                    .html(literacyRate !== undefined
                        ? `<strong>${countryName}</strong><br/>Literacy Rate: ${(literacyRate * 100).toFixed(2)}%`
                        : `<strong>${countryName}</strong><br/>No Data`);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY + 15) + "px")
                    .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        // Add the legend
        createLegend(svg, colorScale, "Literacy Rate (%)");
    }).catch(error => console.error("Error loading data:", error));
}

// Draw the map
drawChoroplethMap();