function createChartTab() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  let chartSheet = ss.getSheetByName("Charts");

  // If sheet does not exist create it
  if (!chartSheet) {
    const numSheets = ss.getNumSheets();
    chartSheet = ss.insertSheet("Charts", numSheets - 4);
    Logger.log(`Charts sheet created.`)
  } else {
    chartSheet.clear(); // Clear existing content
    const charts = chartSheet.getCharts(); // Clear existing charts
    for (let i = 0; i < charts.length; i++) {
      chartSheet.removeChart(charts[i]);
    }
    Logger.log(`Charts sheet found. Cleared sheet and deleted existing charts.`)
  }
}

function processChartData(sourceSheet, topKeywordCount) {
  // Fetching data
  const dataRange = sourceSheet.getDataRange();
  const data = dataRange.getValues();
  
  // Headers for the chart, including dates
  const headers = data[0].slice(1, -1); // Excludes the first keyword column and the last total column
  
  // Keywords and their totals, excluding the first row (headers) and the first and last column
  const keywordTotals = data.slice(1).map(row => ({
    keyword: toTitleCase(row[0]),
    total: row[row.length - 1],
    volumes: row.slice(1, -1) // Excludes the keyword and total columns
  }));
  
  // Sort keywords by total volume and split into top keywords and others
  keywordTotals.sort((a, b) => b.total - a.total);
  const topKeywords = keywordTotals.slice(0, topKeywordCount);
  const otherKeywords = keywordTotals.slice(topKeywordCount);
  
  // Aggregate volumes for "Others"
  const othersAggregatedVolumes = headers.map((_, index) => 
    otherKeywords.reduce((sum, current) => sum + (current.volumes[index] || 0), 0)
  );
  
  // Preparing data for chart
  let chartData = [ ['', ...topKeywords.map(k => k.keyword), 'Others'] ];
  
  headers.forEach((date, index) => {
    const row = [date];
    topKeywords.forEach(keyword => {
      row.push(keyword.volumes[index] || 0);
    });
    row.push(othersAggregatedVolumes[index]);
    chartData.push(row);
  });

  return chartData;
}

function createStackedBarChart(chartSheet, chartData) {

  // Set the chart data in the sheet
  const range = chartSheet.getRange(1, 1, chartData.length, chartData[0].length);
  range.setValues(chartData);

  // Define the range for the chart
  const chartRange = chartSheet.getRange(1, 1, chartData.length, chartData[0].length);

  // Get last row for positioning
  const lastRow = chartSheet.getLastRow();

  // Create and insert the chart
  const chart = chartSheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(chartRange)
    .setPosition(lastRow + 5, 2, 0, 0)
    .setOption('title', 'Keyword Impressions Over Time')
    .setOption('legend', {position: 'bottom'})
    .setOption('isStacked', true)
    .setOption('hAxis', {title: 'Date'})
    .setOption('vAxis', {title: 'Volume'})
    .setNumHeaders(1)
    .setOption('width', 1000)
    .setOption('height', 500)
    .setOption('series', {
      0: {color: '#4E79A7'},  // Dark Blue
      1: {color: '#F28E2B'},  // Orange
      2: {color: '#E15759'},  // Red
      3: {color: '#76B7B2'},  // Teal
      4: {color: '#59A14F'},  // Green
      5: {color: '#EDC948'},  // Yellow
      6: {color: '#B07AA1'},  // Purple
      7: {color: '#FF9DA7'},  // Pink
      8: {color: '#9C755F'},  // Brown
      9: {color: '#BAB0AC'},  // Gray
      10: {color: '#79706E'}  // Dark Gray
    })
    .build();
  
  chartSheet.insertChart(chart);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}


