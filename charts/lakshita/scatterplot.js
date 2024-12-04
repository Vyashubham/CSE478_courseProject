// Load and merge the data
Promise.all([
    d3.csv("../../data/Global_Education.csv"), // Correct relative path for Global_Education.csv
    d3.csv("../../data/LiteracyRate.csv") // Correct relative path for LiteracyRate.csv
]).then(([educationData, literacyData]) => {
    // Country name corrections (if needed)
    const countryNameCorrections = {
        "United States": "United States of America",
        "Russia": "Russia", // Ensure country names match
        // Add more mappings as needed
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
    const data = educationData.map(d => {
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

    // Set dimensions and margins
    const width = 800;
    const height = 600;
    const margin = { top: 70, right: 150, bottom: 70, left: 100 };

    // Create SVG container
    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const plotArea = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale: Gross Primary Education Enrollment
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Gross_Primary_Education_Enrollment)).nice()
        .range([0, width]);

    // Y Scale: Literacy Rate
    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Literacy_Rate)).nice()
        .range([height, 0]);

    // Color Scale: Birth Rate
    const colorScale = d3.scaleSequential()
        .domain(d3.extent(data, d => d.Birth_Rate))
        .interpolator(d3.interpolatePlasma);

    // X-axis
    plotArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    // Y-axis
    plotArea.append("g")
        .call(d3.axisLeft(yScale));

    // Tooltip for interactivity
    const tooltip = d3.select("#scatterplot").append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");

    // Plot data points
    plotArea.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.Gross_Primary_Education_Enrollment))
        .attr("cy", d => yScale(d.Literacy_Rate))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.Birth_Rate))
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`<b>Country:</b> ${d.Country}<br>
                       <b>Enrollment:</b> ${d.Gross_Primary_Education_Enrollment}%<br>
                       <b>Literacy Rate:</b> ${d.Literacy_Rate.toFixed(2)}%<br>
                       <b>Birth Rate:</b> ${d.Birth_Rate}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("top", `${event.pageY - 10}px`)
                   .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });

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

    // Legend dimensions
    const legendHeight = 200;
    const legendWidth = 20;

    // Append legend group
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 40}, ${margin.top + (height - legendHeight) / 2})`);

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
});