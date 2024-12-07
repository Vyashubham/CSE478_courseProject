function createGenderGapChart(containerId, dataUrl) {
    const margin = { top: 40, right: 200, bottom: 50, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
  
    const container = d3.select(containerId);
    const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip");
  
    d3.csv(dataUrl).then(data => {
      // Filter and clean data
      data = data.filter(d => +d.Year >= 2000 && +d.Year <= 2023);
      data.forEach(d => {
        d.Year = +d.Year;
        ["Combined total net enrolment rate, primary, female",
         "Combined total net enrolment rate, primary, male",
         "Total net enrolment rate, lower secondary, female (%)",
         "Total net enrolment rate, lower secondary, male (%)",
         "Total net enrolment rate, upper secondary, female (%)",
         "Total net enrolment rate, upper secondary, male (%)",
         "Combined gross enrolment ratio for tertiary education, female",
         "Combined gross enrolment ratio for tertiary education, male"].forEach(key => {
          d[key] = parseFloat(d[key]) || null;
        });
      });
  
      // Scales
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);
  
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
  
      const colorScale = d3.scaleOrdinal()
        .domain(["Girls in Primary", "Boys in Primary", "Girls in Lower Secondary", "Boys in Lower Secondary", "Girls in Upper Secondary", "Boys in Upper Secondary", "Girls in Tertiary", "Boys in Tertiary"])
        .range(["orange", "blue", "pink", "green", "purple", "brown", "red", "teal"]);
  
      const lines = [
        { key: "Combined total net enrolment rate, primary, female", name: "Girls in Primary" },
        { key: "Combined total net enrolment rate, primary, male", name: "Boys in Primary" },
        { key: "Total net enrolment rate, lower secondary, female (%)", name: "Girls in Lower Secondary" },
        { key: "Total net enrolment rate, lower secondary, male (%)", name: "Boys in Lower Secondary" },
        { key: "Total net enrolment rate, upper secondary, female (%)", name: "Girls in Upper Secondary" },
        { key: "Total net enrolment rate, upper secondary, male (%)", name: "Boys in Upper Secondary" },
        { key: "Combined gross enrolment ratio for tertiary education, female", name: "Girls in Tertiary" },
        { key: "Combined gross enrolment ratio for tertiary education, male", name: "Boys in Tertiary" }
      ];
  
      // Axes
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
        .attr("class", "axis-label");
  
      svg.append("g")
        .call(d3.axisLeft(yScale))
        .attr("class", "axis-label");
  
      // Lines
      lines.forEach(line => {
        const validData = data.filter(d => d[line.key] !== null);
        svg.append("path")
          .datum(validData)
          .attr("d", d3.line()
            .x(d => xScale(d.Year))
            .y(d => yScale(d[line.key]))
          )
          .attr("class", "line")
          .attr("stroke", colorScale(line.name))
          .on("mousemove", function(event) {
            const [x, y] = d3.pointer(event);
            const year = Math.round(xScale.invert(x));
            const rate = Math.round(yScale.invert(y));
            tooltip
              .style("display", "block")
              .style("top", `${event.pageY + 10}px`)
              .style("left", `${event.pageX + 10}px`)
              .html(`<strong>${line.name}</strong><br>Year: ${year}<br>Rate: ${rate}%`);
          })
          .on("mouseout", () => tooltip.style("display", "none"));
      });
  
      // Legend
      const legend = svg.selectAll(".legend")
        .data(lines)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 20}, ${i * 20})`)
        .on("click", function(event, d) {
          const line = svg.selectAll(".line").filter(l => l.name === d.name);
          if (!line.empty()) {
            const isHidden = line.classed("hidden");
            line.classed("hidden", !isHidden);
          }
        });
  
      legend.append("rect")
        .attr("x", 0)
        .attr("y", -10)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => colorScale(d.name));
  
      legend.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .text(d => d.name);
    }).catch(err => console.error("Error loading data:", err));
  }
  
  // Initialize the chart
  createGenderGapChart("#gender-gap-chart", "data/gender-gap-education-levels.csv");
  