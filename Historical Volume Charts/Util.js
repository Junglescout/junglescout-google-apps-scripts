/**
 * Gets the request options for the API call.
 * @param {string[]} asins - The array of ASINs.
 * @returns {Object} The fetch request options.
 */
function getRequestOptions(asins) {
  return {
    method: 'post',
    headers: {
      Authorization: AUTHORIZATION_TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.junglescout.v1+json',
      'X_API_Type': 'junglescout',
    },
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      data: {
        type: 'keywords_by_asin_query',
        attributes: {
          asins,
          include_variants: true,
          min_word_count: 1,
          max_word_count: 10,
          min_organic_product_count: 1
        },
      },
    }),
  };
}

/**
 * Sets the headers and formatting in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 */
function setHeaders(sheet) {
  const headers = ['=CONCATENATE("Keywords (", COUNTA(D7:D), ")")', 'Organic Rank', 'Avg. Comp. Rank', 'Paid Rank', 'Avg. Comp. Paid Rank', 'Exact Searches', 'Broad Searches'];
  const headerRange = 'D5:J6';
  sheet.getRange(headerRange)
    .setValues([headers, headers])
    .setFontWeight('bold')
    .setBackground('#EFEFEF')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  const headerColumns = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
  headerColumns.forEach((col) => {
    const range = sheet.getRange(`${col}5:${col}6`);
    range.merge();
  });

  const dataHeaderRange = sheet.getRange('E5:J6');
  dataHeaderRange.setHorizontalAlignment('right');

  const headerBorder = SpreadsheetApp.BorderStyle.SOLID;
  sheet.getRange(headerRange).setBorder(true, true, true, true, true, true, null, headerBorder);
}

/**
 * Sets the column widths in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 */
function setColumnWidths(sheet) {
  const sheetName = sheet.getName();

  if (sheetName === 'ASINs') {
    sheet.setColumnWidth(4, 300);
    sheet.setColumnWidths(5, 6, 125);
  } else if (sheetName === 'Keyword Volume') {
    sheet.setColumnWidth(1, 300);   
    sheet.setColumnWidths(2, 25, 125);
  }
}

/**
 * Clears the specified range in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {string} range - The range to clear.
 */
function clearRange(sheet, range) {
  sheet.getRange(range)
    .clearContent()
    .setBorder(false, false, false, false, false, false)
    .setBackground(null);
}

/**
 * Gets the minimum monthly search volume from the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to read from.
 * @returns {number} The minimum monthly search volume.
 */
function getMinMonthlySearchVolume(sheet) {
  const minMonthlySearchVolume = sheet.getRange('B20').getValue();
  return typeof minMonthlySearchVolume === 'number' && minMonthlySearchVolume > 0 ? minMonthlySearchVolume : 1;
}

/**
 * Gets the "ranked keywords only" setting from the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to read from.
 * @returns {boolean} Whether to fetch only ranked keywords.
 */
function getRankedKeywordsOnly(sheet) {
  const value = sheet.getRange('B23').getValue().toString().toLowerCase();
  return value === 'yes';
}

/**
 * Gets the competitor ASINs from the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to read from.
 * @returns {string[]} The array of competitor ASINs.
 */
function getCompetitorAsins(sheet) {
  const competitorAsinsRange = sheet.getRange('B6:B14').getValues();
  return competitorAsinsRange
    .filter((row) => row[0] !== '')
    .map((row) => row[0].toString());
}

/**
 * Gets the marketplace from the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to read from.
 * @returns {string} The marketplace.
 */
function getMarketplace(sheet) {
  return sheet.getRange('B17').getValue().toString().toLowerCase();
}

/**
 * Sets the week headers in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {string} startDate - The start date of the week.
 * @param {string} endDate - The end date of the week.
 * @param {number} weekIndex - The index of the week column.
 */
function setWeekHeaders(sheet, startDate, endDate, weekIndex) {
  const colIndex = weekIndex + 2;
  sheet.getRange(1, colIndex)
    .setValue(startDate)
    .setFontWeight('bold')
    .setBackground('#EFEFEF');
  sheet.getRange(2, colIndex)
    .setValue(endDate)
    .setFontWeight('bold')
    .setBackground('#EFEFEF');
}

/**
 * Formats the search volume data in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 */
function formatSearchVolume(sheet) {
  const lastRow = sheet.getLastRow();
  const dataRange = sheet.getRange('B3:Z' + lastRow);
  dataRange.setNumberFormat('#,##0');
}

/**
 * Populates the keywords column in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {string[]} keywords - An array of keywords.
 */
function populateKeywordsColumn(sheet, keywords) {
  sheet.getRange(3, 1, keywords.length, 1).setValues(keywords.map((k) => [k]));
}

/**
 * Sets the header formatting in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 */
function setHeaderFormatting(sheet) {
  const weekColumns = sheet.getRange('B:Z');
  weekColumns.setHorizontalAlignment('right');

  sheet.getRange('A1')
    .setValue('Week Starting')
    .setFontWeight('bold')
    .setHorizontalAlignment('right')
    .setBackground('#EFEFEF');
  sheet.getRange('A2')
    .setValue('Week Ending')
    .setFontWeight('bold')
    .setHorizontalAlignment('right')
    .setBackground('#EFEFEF');

  sheet.setFrozenColumns(1);
}

/**
 * Clears the content of a spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to clear.
 */
function clearSheet(sheet) {
  sheet.clear();
}

/**
 * Gets the keywords from the "ASINs" sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The "ASINs" sheet.
 * @returns {string[]} An array of keywords.
 */
function getKeywords(sheet) {
  const keywordsRange = sheet.getRange(`D7:D${sheet.getLastRow()}`);
  const keywords = keywordsRange.getValues().flat().filter(String);
  return keywords;
}

/**
 * Gets the date range for the last specified number of days.
 * @param {number} days - The number of days to go back.
 * @returns {[Date, Date]} An array containing the start and end dates.
 */
function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
  return [startDate, endDate];
}

/**
 * Formats a date object as a string in the format 'yyyy-MM-dd'.
 * @param {Date} date - The date object to format.
 * @returns {string} The formatted date string.
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Gets the keywords for charts from the specified range in the sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to get the keywords from.
 * @param {number} startRow - The starting row number.
 * @param {number} endRow - The ending row number.
 * @returns {string[]} An array of keywords for charts.
 */
function getKeywordsForCharts(sheet, startRow, endRow) {
  const keywordsRange = sheet.getRange(`A${startRow}:A${endRow}`);
  const keywords = keywordsRange.getValues().flat().filter(String);
  return keywords;
}