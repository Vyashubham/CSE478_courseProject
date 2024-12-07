// Module: Constants
const uniqueWidth = 1400,
    uniqueHeight = 500;

// Module: SVG Container
function createSVGContainer(containerId) {
    return d3.select(containerId)
        .append("svg")
        .attr("width", uniqueWidth)
        .attr("height", uniqueHeight);
}

// Module: Tooltip
function createTooltip() {
    return d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("font-size", "12px");
}

// Module: Color Scale
function createColorScale(domain, scheme) {
    return d3.scaleQuantize(domain, scheme);
}

// Module: Legend
function createLegend(svg, colorScale, title) {
    const legend = svg.append("g")
        .attr("transform", `translate(${uniqueWidth - 500}, 50)`);

    // Legend background
    legend.append("rect")
        .attr("x", -10)
        .attr("y", -20)
        .attr("width", 180)
        .attr("height", colorScale.range().length * 30 + 40)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("rx", 5)
        .attr("ry", 5);

    // Legend title
    legend.append("text")
        .attr("y", -5)
        .attr("x", 10)
        .style("text-anchor", "start")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .text(title);

    // Legend entries
    const categories = colorScale.range().map(d => colorScale.invertExtent(d));
    categories.forEach((d, i) => {
        legend.append("rect")
            .attr("x", 10)
            .attr("y", i * 30)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorScale(d[0]))
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .delay(i * 200)
            .style("opacity", 1);

        legend.append("text")
            .attr("x", 35)
            .attr("y", i * 30 + 13)
            .style("font-size", "12px")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .delay(i * 200)
            .style("opacity", 1)
            .text(`${Math.round(d[0] * 100)}% - ${Math.round(d[1] * 100)}%`);
    });
}

// Module: Choropleth Map
function drawChoroplethMap(containerId, dataUrl, csvUrl, colorDomain, colorScheme, legendTitle) {
    const projection = d3.geoNaturalEarth1().scale(160).translate([uniqueWidth / 4, uniqueHeight / 2]);
    const path = d3.geoPath().projection(projection);
    const colorScale = createColorScale(colorDomain, colorScheme);

    Promise.all([
        d3.json(dataUrl),
        d3.csv(csvUrl)
    ]).then(([world, literacyData]) => {
        const literacyMap = new Map(literacyData.map(d => [d.Country, +d['Literacy Rate']]));

        const svg = createSVGContainer(containerId);
        const tooltip = createTooltip();

        // Draw countries
        svg.append("g").selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .join("path")
            .attr("fill", d => {
                const countryName = d.properties.name;
                const literacyRate = literacyMap.get(countryName) || 0;
                return colorScale(literacyRate);
            })
            .attr("d", path)
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .on("end", function() {
                d3.select(this)
                    .attr("transform", "scale(1.2)")
                    .transition()
                    .duration(500)
                    .attr("transform", "scale(1)");
            });

        // Add interactions
        svg.selectAll("path")
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

        // Add legend
        createLegend(svg, colorScale, legendTitle);
    }).catch(error => console.error("Error loading data:", error));
}

// Initialize the map
drawChoroplethMap(
    "#choropleth-map",
    "https://unpkg.com/world-atlas@2/countries-50m.json",
    "../../data/LiteracyRate.csv", 
    [0, 1],
    d3.schemeBlues[9],
    "Literacy Rate (%)"
);
