/**
 * Fetches historical search volume data for a keyword.
 * @param {string} keyword - The keyword to fetch historical data for.
 * @param {string} marketplace - The marketplace (e.g., 'us', 'ca', 'uk').
 * @param {string} startDate - The start date in the format 'yyyy-MM-dd'.
 * @param {string} endDate - The end date in the format 'yyyy-MM-dd'.
 * @returns {Object[]} An array of historical search volume data.
 */
function getHistoricalDataForKeyword(keyword, marketplace, startDate, endDate) {
  const apiUrl = 'https://developer.junglescout.com/api/keywords/historical_search_volume';
  const params = `?keyword=${encodeURIComponent(keyword)}&marketplace=${marketplace}&start_date=${startDate}&end_date=${endDate}`;
  const fullUrl = apiUrl + params;
  const options = {
    method: 'GET',
    headers: {
      Authorization: AUTHORIZATION_TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.junglescout.v1+json',
      'X_API_Type': 'junglescout',
    },
    muteHttpExceptions: true,
  };

  try {
    Logger.log(`Fetching historical search volumes for keyword: ${keyword}`);
    const response = UrlFetchApp.fetch(fullUrl, options);
    const data = JSON.parse(response.getContentText());
    return data.data || [];
  } catch (error) {
    Logger.log(`Error fetching historical data for keyword: ${keyword} - ${error.toString()}`);
    return [];
  }
}

/**
 * Populates the historical search volume data in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {Object[]} historicalData - The historical search volume data.
 * @param {number} index - The index of the keyword in the keywords array.
 */
function populateHistoricalData(sheet, historicalData, index) {
  historicalData.reverse().forEach((data, weekIndex) => {
    if (index === 0) {
      setWeekHeaders(sheet, data.attributes.estimate_start_date, data.attributes.estimate_end_date, weekIndex);
    }
    const rowIndex = index + 3;
    const colIndex = weekIndex + 2;
    sheet.getRange(rowIndex, colIndex).setValue(data.attributes.estimated_exact_search_volume);
  });
}