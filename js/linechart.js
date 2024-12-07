document.addEventListener("DOMContentLoaded", () => {
    const chartMargins = { top: 40, right: 40, bottom: 50, left: 50 };
    const chartWidth = 800 - chartMargins.left - chartMargins.right;
    const chartHeight = 400 - chartMargins.top - chartMargins.bottom;
  
    const svgContainer = d3
      .select("#line-chart")
      .attr("width", chartWidth + chartMargins.left + chartMargins.right)
      .attr("height", chartHeight + chartMargins.top + chartMargins.bottom)
      .append("g")
      .attr("transform", `translate(${chartMargins.left},${chartMargins.top})`);
  
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip");
  
    const parseDataset = (data) =>
      data
        .filter((d) => d.Year && d["Combined gross enrolment ratio for tertiary education, female"])
        .map((d) => ({
          year: +d.Year,
          femaleRatio: +d["Combined gross enrolment ratio for tertiary education, female"],
        }));
  
    const drawAxes = (svg, xScale, yScale, height) => {
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  
      svg.append("g").call(d3.axisLeft(yScale));
    };
  
    const drawLine = (svg, data, xScale, yScale) => {
      const linePathGenerator = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.femaleRatio));
  
      svg.append("path")
        .datum(data)
        .attr("d", linePathGenerator)
        .attr("class", "line-path")
        .on("mousemove", (event) => {
          const [mouseX, mouseY] = d3.pointer(event);
          const closestData = data.reduce((a, b) =>
            Math.abs(xScale(a.year) - mouseX) < Math.abs(xScale(b.year) - mouseX) ? a : b
          );
          tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .html(`<strong>Year:</strong> ${closestData.year}<br><strong>Ratio:</strong> ${closestData.femaleRatio.toFixed(2)}%`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));
    };
  
    const loadDataAndRenderChart = async () => {
      const rawData = await d3.csv("data.csv");
      const parsedData = parseDataset(rawData);
  
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(parsedData, (d) => d.year))
        .range([0, chartWidth]);
  
      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(parsedData, (d) => d.femaleRatio)])
        .range([chartHeight, 0]);
  
      drawAxes(svgContainer, xScale, yScale, chartHeight);
      drawLine(svgContainer, parsedData, xScale, yScale);
    };
  
    loadDataAndRenderChart();
  });
  