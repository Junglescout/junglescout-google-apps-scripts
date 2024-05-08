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
    const response = UrlFetchApp.fetch(fullUrl, options);
    const data = JSON.parse(response.getContentText());
    // Ensure that this function returns an array, even when no data is found
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    Logger.log(`Error fetching historical data for keyword: ${keyword} - ${error.toString()}`);
    return []; // Return an empty array in case of error
  }
}


/**
 * Checks the keywords in Rank by Day and Keyword Volume sheets, then splits into 2 groups
 * @param {rankByDayKeywords} - 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} keywordVolumeSheet - The Google Sheet to check for existing keywords.
 */
function separateKeywords(rankByDayKeywords, keywordVolumeSheet) {
  const lastRow = keywordVolumeSheet.getLastRow();

  if (lastRow < 3) {
    // If the sheet has less than 3 rows (header rows), assume all keywords are new
    return [rankByDayKeywords, []];
  }

  const existingKeywordsRange = keywordVolumeSheet.getRange("A3:A" + lastRow);
  const existingKeywords = existingKeywordsRange.getValues().flat().filter(String);

  const newKeywords = rankByDayKeywords.filter(keyword => !existingKeywords.includes(keyword));
  const existingKeywordsToUpdate = rankByDayKeywords.filter(keyword => existingKeywords.includes(keyword));

  return [newKeywords, existingKeywordsToUpdate];
}

/**
 * Updates the Google Sheet with historical data. If diffWeeks is provided, it updates only for the specified number of most recent weeks. Otherwise, it updates for all weeks.
 * @param {Object[]} sampleData - The historical search volume data.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} keywordVolumeSheet - The Google Sheet to update.
 * @param {number} [diffWeeks=null] - Optional. The number of most recent weeks to update. If not provided, updates for all weeks.
 */
function updateWeekHeadersWithSampleData(sampleData, keywordVolumeSheet, diffWeeks) {
  if (sampleData.length === 0) {
    Logger.log('No data to update headers');
    return;
  }

  // Ensure data is in reverse chronological order to start with the newest.
  sampleData.sort((a, b) => new Date(b.attributes.estimate_end_date) - new Date(a.attributes.estimate_end_date));

  // If diffWeeks is specified, use it to determine the slice of sampleData to process; otherwise, process all.
  const processedData = diffWeeks ? sampleData.slice(0, diffWeeks) : sampleData;

  // Always start from the second column (Column B) for headers.
  let startingColumnIndex = 0;

  processedData.forEach((data, index) => {
    const { estimate_start_date, estimate_end_date } = data.attributes;
    // Set week headers starting from column B, accounting for each week.
    setWeekHeaders(keywordVolumeSheet, estimate_start_date, estimate_end_date, startingColumnIndex + index);
  });
}


/**
 * Fetches historical search volume data for keywords and optionally trims the data to only include the most recent weeks.
 * If diffWeeks is not provided or is 0, no trimming occurs, and all fetched data is returned.
 * @param {string[]} existingKeywordsToUpdate - The keywords for which to fetch historical data.
 * @param {string} marketplace - The marketplace (e.g., 'us', 'ca', 'uk') for the search volume data.
 * @param {string} startDate - The start date in the format 'yyyy-MM-dd' for fetching historical data.
 * @param {string} endDate - The end date in the format 'yyyy-MM-dd' for fetching historical data.
 * @param {number} [diffWeeks=null] - Optional. The number of most recent weeks of data to retain for each keyword. If not provided, all data is retained.
 * @returns {Object[]} An array of objects, each containing a keyword and its array of historical search volume data, trimmed as specified.
 */
function fetchAndOptionallyTrimHistoricalData(existingKeywordsToUpdate, marketplace, startDate, endDate, diffWeeks = null) {
  let dataForKeywords = [];

  Logger.log(`Starting to fetch data for ${existingKeywordsToUpdate.length} keywords.`);

  existingKeywordsToUpdate.forEach(keyword => {
    Logger.log(`Fetching historical data for keyword: ${keyword}`);
    
    let historicalData = getHistoricalDataForKeyword(keyword, marketplace, startDate, endDate);
    Logger.log(`Fetched ${historicalData.length} weeks of data for keyword: ${keyword}.`);
    
    if (diffWeeks > 0) {
      // Sort the data in reverse chronological order to ensure the most recent weeks are first
      historicalData.sort((a, b) => new Date(b.attributes.estimate_end_date) - new Date(a.attributes.estimate_start_date));
      
      // Trim the data to keep only the most recent 'diffWeeks' weeks
      let trimmedData = historicalData.slice(0, diffWeeks);
      trimmedData.reverse();

      dataForKeywords.push({ keyword: keyword, data: trimmedData });

      Logger.log(`Data for keyword: ${keyword} trimmed to the most recent ${diffWeeks} weeks.`);
    } else {
      // No trimming, add all fetched data
      dataForKeywords.push({ keyword: keyword, data: historicalData });
      Logger.log(`Data for keyword: ${keyword} added without trimming.`);
    }
  });

  Logger.log(`Completed fetching and optionally trimming data for all keywords.`);
  
  return dataForKeywords;
}

/**
 * Updates the spreadsheet with historical search volume data for a list of keywords, starting from a specified row.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {Object[]} keywordDataArray - Array of keyword data objects, each containing the keyword and its historical search data.
 * @param {number} startRow - The row in the sheet from which to start populating the historical data.
 */
function updateSheetWithHistoricalData(sheet, keywordDataArray, startRow) {
  keywordDataArray.forEach((keywordData, index) => {
    const rowIndex = startRow + index; // Calculate the row index for each keyword based on the starting row and the loop index
    Logger.log(`Populating data for '${keywordData.keyword}' at row ${rowIndex}`);
    populateHistoricalData(sheet, keywordData.data, rowIndex - 3); // Adjust the index parameter for populateHistoricalData as needed
  });
}

/**
 * Populates the keywords column in the spreadsheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {string[]} keywords - An array of keywords.
 */
function populateKeywordsColumn(sheet, keywords) {
  // Find the last row with content
  var lastRow = sheet.getLastRow();
  
  // Start adding data from the next row
  var startRow = lastRow + 1;
  
  // Set the values for keywords starting from the row below the last row with content
  // Check if there are any keywords to add to prevent errors when keywords array is empty
  if (keywords.length > 0) {
    sheet.getRange(startRow, 1, keywords.length, 1).setValues(keywords.map((k) => [k]));
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
    const rowIndex = index + 3;
    const colIndex = weekIndex + 2;
    sheet.getRange(rowIndex, colIndex).setValue(data.attributes.estimated_exact_search_volume);
  });
}
