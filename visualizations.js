// Common dimensions
const width = 960, height = 500;

// Helper function for creating legends
function createLegend(svg, colorScale, title) {
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, 30)`);

    legend.append("text")
        .attr("y", -10)
        .attr("x", -10)
        .style("text-anchor", "end")
        .text(title);

    const categories = colorScale.range().map(d => colorScale.invertExtent(d));
    categories.forEach((d, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorScale(d[0]));

        legend.append("text")
            .attr("x", 25)
            .attr("y", i * 20 + 9)
            .attr("dy", "0.35em")
            .text(`${Math.round(d[0])} - ${Math.round(d[1])}`);
    });
}

// Choropleth Map: Global Literacy Rates
function drawChoroplethMap() {
    const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
    const colorScale = d3.scaleQuantize([0, 100], d3.schemeYlGnBu[9]); // Changed to YlGnBu for higher contrast and darker colors

    Promise.all([
        d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json"),
        d3.csv("data/LiteracyRate.csv")
    ]).then(([world, literacyData]) => {
        const literacyMap = new Map(literacyData.map(d => [d.Country, +d['Literacy Rate'] || 0]));
        const svg = d3.select("#choropleth-map").append("svg").attr("width", width).attr("height", height);

        svg.append("g").selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .join("path")
            .attr("fill", d => colorScale(literacyMap.get(d.properties.name) || 0))
            .attr("d", path)
            .append("title")
            .text(d => `${d.properties.name}: ${literacyMap.get(d.properties.name) || "N/A"}%`);

        createLegend(svg, colorScale, "Literacy Rate (%)");
    });
}



// Scatterplot: Education Spending vs. Literacy Rates
function drawBubbleChart() {
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const widthBubble = 960 - margin.left - margin.right;
    const heightBubble = 500 - margin.top - margin.bottom;
    const svg = d3.select("#scatterplot").append("svg")
        .attr("width", widthBubble + margin.left + margin.right)
        .attr("height", heightBubble + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/Global_Education.csv").then(data => {
        data.forEach(d => {
            d.spending = +d['Education Spending Per Capita'] || 0;
            d.literacy = +d['Literacy Rate'] || 0;
            d.population = +d['Population'] || 1; // Use Population or another variable to size bubbles
        });

        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.spending) * 1.1]).range([0, widthBubble]);
        const y = d3.scaleLinear().domain([0, 100]).range([heightBubble, 0]);
        const radiusScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.population)]).range([2, 20]);

        svg.append("g").selectAll("circle").data(data).join("circle")
            .attr("cx", d => x(d.spending))
            .attr("cy", d => y(d.literacy))
            .attr("r", d => radiusScale(d.population))
            .attr("fill", "steelblue")
            .attr("opacity", 0.7);

        svg.append("g").call(d3.axisBottom(x)).attr("transform", `translate(0,${heightBubble})`).append("text")
            .attr("x", widthBubble / 2).attr("y", 40).attr("fill", "black")
            .text("Education Spending Per Capita");

        svg.append("g").call(d3.axisLeft(y)).append("text")
            .attr("x", -heightBubble / 2).attr("y", -40).attr("transform", "rotate(-90)").attr("fill", "black")
            .text("Literacy Rate (%)");
    });
}

// Grouped Bar Chart: Gender-Based Enrollment Rates
function drawStackedBarChart() {
    const margin = { top: 20, right: 30, bottom: 120, left: 60 };
    const widthBar = 960 - margin.left - margin.right;
    const heightBar = 500 - margin.top - margin.bottom;

    const svg = d3.select("#grouped-bar-chart").append("svg")
        .attr("width", widthBar + margin.left + margin.right)
        .attr("height", heightBar + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/EDUCATION_ATTAINMENT.csv").then(data => {
        // Data preparation
        const top10Data = data.slice(0, 10);
        const keys = ["Male Enrollment Rate", "Female Enrollment Rate"];

        // X scale for countries
        const x = d3.scaleBand()
            .domain(top10Data.map(d => d['Countries and areas']))
            .range([0, widthBar])
            .padding(0.1);

        // Y scale for enrollment rate (stacked up to max 100%)
        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([heightBar, 0]);

        // Color scale for categories
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(["#1f77b4", "#ff7f0e"]);

        // Stack the data
        const stackedData = d3.stack()
            .keys(keys)
            .value((d, key) => +d[key] || 0)(top10Data);

        // Append rectangles
        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .join("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data['Countries and areas']))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        // X axis with rotated labels
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${heightBar})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Y axis with percentage format
        svg.append("g")
            .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"));

        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${widthBar - 100}, 0)`);

        legend.selectAll("rect")
            .data(keys)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color);

        legend.selectAll("text")
            .data(keys)
            .enter().append("text")
            .attr("x", 25)
            .attr("y", (d, i) => i * 20 + 9)
            .attr("dy", "0.35em")
            .text(d => d);
    });
}


// Draw all visualizations
drawChoroplethMap();
drawBubbleChart();
drawStackedBarChart()
