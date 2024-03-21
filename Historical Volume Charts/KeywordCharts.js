/**
 * Creates a line chart and inserts it into the specified sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} chartsSheet - The sheet to insert the chart into.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} dataSheet - The sheet containing the chart data.
 * @param {string} chartTitle - The title of the chart.
 * @param {number} dataRowIndex - The row index of the data in the data sheet.
 * @param {number} chartRow - The row position of the chart.
 * @param {number} chartCol - The column position of the chart.
 * @param {number} chartWidth - The width of the chart.
 * @param {number} chartHeight - The height of the chart.
 */
function createLineChart(chartsSheet, dataSheet, chartTitle, dataRowIndex, chartRow, chartCol, chartWidth, chartHeight) {
  const headerRange = dataSheet.getRange(2, 2, 1, dataSheet.getLastColumn() - 1);
  const dataRange = dataSheet.getRange(dataRowIndex, 2, 1, dataSheet.getLastColumn() - 1);

  Logger.log('Header Range:');
  Logger.log(headerRange.getA1Notation());
  Logger.log('Header Values:');
  Logger.log(headerRange.getValues());

  Logger.log('Data Range:');
  Logger.log(dataRange.getA1Notation());
  Logger.log('Data Values:');
  Logger.log(dataRange.getValues());

  const titleCaseChartTitle = toTitleCase(chartTitle);

  const chart = chartsSheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(headerRange)
    .addRange(dataRange)
    .setMergeStrategy(Charts.ChartMergeStrategy.MERGE_ROWS)
    .setTransposeRowsAndColumns(true)
    .setPosition(chartRow, chartCol, 0, 0)
    .setOption('title', titleCaseChartTitle)
    .setOption('titleTextStyle', {
      fontSize: 12
    })
    .setOption('width', chartWidth)
    .setOption('height', chartHeight)
    .setOption('colors', ['#F57706'])
    .setOption('legend.position', 'none')
    .setOption('series', {
      0: {
        targetAxisIndex: 0
      }
    })
    .setOption('vAxes', {
      0: {
        title: 'Search Volume',
        titleTextStyle: {
          fontSize: 10
        },
        textStyle: {
          fontSize: 6
        }
      }
    })
    .setOption('hAxis', {
      title: 'Week Ending',
      slantedText: true,
      slantedTextAngle: 30,
      titleTextStyle: {
        fontSize: 10
      },
      textStyle: {
        fontSize: 8
      }
    })
    .build();

  chartsSheet.insertChart(chart);

  Logger.log('Chart:');
  Logger.log(chart);
}

/**
 * Converts a string to title case.
 * @param {string} str - The string to convert.
 * @returns {string} The string in title case.
 */
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}