/**
 * Jungle Scout API Key
 */
const scriptProperties = PropertiesService.getScriptProperties();
const API_KEY = scriptProperties.getProperty('API_KEY');
const API_KEY_NAME = scriptProperties.getProperty('API_KEY_NAME');
const AUTHORIZATION_TOKEN = `${API_KEY_NAME}:${API_KEY}`; // Build proper token format

/**
 * Google Sheets Spreadsheet ID
 */
const TARGET_SPREADSHEET_ID = scriptProperties.getProperty('TARGET_SPREADSHEET_ID');

/**
 * Fetches keywords from the Jungle Scout API and updates the spreadsheet.
 */
function fetchKeywords() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = ss.getSheetByName('ASINs');
  if (!sheet) return;

  const keywordsRange = 'D7:D';
  const existingData = sheet.getRange(keywordsRange).getValues();

  if (existingData.some(row => row[0] !== '')) {
    const response = Browser.msgBox('Warning', 'Fetching keywords will overwrite existing data in the range D7:D. Do you want to proceed?', Browser.Buttons.OK_CANCEL);
    if (response === 'cancel') {
      Logger.log('Keyword fetching aborted by the user.');
      return;
    }
  }

  const marketplace = getMarketplace(sheet);
  const maxKeywords = 2000;
  Logger.log(`Marketplace: ${marketplace}, Max keywords to fetch: ${maxKeywords}`);

  const primaryAsin = sheet.getRange('B3').getValue().toString();
  const competitorAsins = getCompetitorAsins(sheet);
  const asins = [primaryAsin, ...competitorAsins];

  const dataRange = 'D5:J';
  clearRange(sheet, dataRange);

  Logger.log(`Setting column widths and headers`)
  setHeaders(sheet);
  setColumnWidths(sheet);

  const rankedKeywordsOnly = getRankedKeywordsOnly(sheet);
  Logger.log(`Fetching only ranked keywords: ${rankedKeywordsOnly}`);

  const baseUrl = 'https://developer.junglescout.com/api/keywords/keywords_by_asin_query';
  const initialUrl = `${baseUrl}?marketplace=${marketplace}&sort=-monthly_search_volume_exact&page[size]=100`;
  const options = getRequestOptions(asins);

  getAllKeywords(initialUrl, options, sheet, maxKeywords, rankedKeywordsOnly);
}

/**
 * Fetches keywords and ranks for ASINs and updates the spreadsheet.
 */
function fetchRankingData() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const asinsSheet = ss.getSheetByName('ASINs');
  if (!asinsSheet) return;
  
  const primaryAsin = asinsSheet.getRange('B3').getValue().toString();
  const competitorAsins = getCompetitorAsins(asinsSheet);
  const marketplace = getMarketplace(asinsSheet);
  const rankedKeywordsOnly = getRankedKeywordsOnly(asinsSheet);
  Logger.log(`Fetching only ranked keywords: ${rankedKeywordsOnly}`);
  const minMonthlySearchVolume = getMinMonthlySearchVolume(asinsSheet);
  Logger.log(`Minimum monthly search volume: ${minMonthlySearchVolume}`);
  
  const options = getRequestOptions([primaryAsin, ...competitorAsins]);
  const baseUrl = 'https://developer.junglescout.com/api/keywords/keywords_by_asin_query';
  const initialUrl = `${baseUrl}?marketplace=${marketplace}&sort=-monthly_search_volume_exact&page[size]=100`;
  const newRankingData = []; // Initialize newRankingData here
  
  getAllRankingData(initialUrl, options, primaryAsin, competitorAsins, rankedKeywordsOnly, minMonthlySearchVolume, newRankingData);
}

/**
 * Fetches historical search volumes for keywords and updates the spreadsheet.
 */
function fetchHistoricalSearchVolumesV2() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Rank by Day');
  const asinsSheet = ss.getSheetByName('ASINs');

  // Check if 'Rank by Day' sheet exists
  if (!sheet) {
    Logger.log('Rank by Day sheet not found');
    return;
  }

  const marketplace = getMarketplace(asinsSheet);
  Logger.log(`Starting historical volume process for marketplace: ${marketplace}`);

  // Prepare the target sheet for keyword volume
  let keywordVolumeSheet = ss.getSheetByName('Keyword Volume');
  if (!keywordVolumeSheet) {
    const numSheets = ss.getNumSheets();
    keywordVolumeSheet = ss.insertSheet('Keyword Volume', numSheets - 2);
    Logger.log(`Keyword Volume sheet created.`);
    
    // Freeze the first column
    keywordVolumeSheet.setFrozenColumns(1);

    // Freeze the first two rows
    keywordVolumeSheet.setFrozenRows(2);
    
    // Set the background color of the first two rows to '#EFEFEF'
    keywordVolumeSheet.getRange(1, 1, 2, keywordVolumeSheet.getMaxColumns()).setBackground('#EFEFEF');
  }

  // Initialize weeks to add as 0
  let diffWeeks = 0;

  // Step 1: Get keywords from "Rank by Day"
  const rankByDayKeywords = getRankByDayKeywords(sheet);

  // Step 2: Separate keywords into new and existing
  const [newKeywords, existingKeywordsToUpdate] = separateKeywords(rankByDayKeywords, keywordVolumeSheet)
  Logger.log(`Found ${newKeywords} new keywords.`);
  Logger.log(`Found ${existingKeywordsToUpdate} existing keywords in the Keyword Volume sheet.`);

  // Define the date range for fetching data
  const [startDate, endDate] = getDateRange(120);
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  Logger.log(`Setting request dates to ${formattedStartDate} and ${formattedEndDate}`);
  
  // Step 3: Check the latest date for historical search volume data
  const sampleKeyword = rankByDayKeywords[0] ? rankByDayKeywords[0] : "garlic press";
  const sampleData = getHistoricalDataForKeyword(sampleKeyword, marketplace, formattedStartDate, formattedEndDate);

  // Step 4: Compare the API date versus existing 'Keyword Volume' dates
  const existingEndDateValue = keywordVolumeSheet.getRange('B2').getDisplayValue();
  let existingEndDate = existingEndDateValue ? new Date(existingEndDateValue) : null;
  let formattedExistingEndDate = existingEndDate ? existingEndDate.toISOString().split('T')[0] : null;
  Logger.log(`End date of existing Keyword Volume data: ${formattedExistingEndDate}`);

  let apiRecentEndDate = null;
  if (sampleData && sampleData.length > 0) {
    // Sort the sampleData by estimate_end_date in descending order and take the first item
    const sortedData = sampleData.sort((a, b) => new Date(b.attributes.estimate_end_date) - new Date(a.attributes.estimate_end_date));
    apiRecentEndDate = sortedData[0].attributes.estimate_end_date;
    Logger.log(`Jungle Scout's most recent volume data: ${apiRecentEndDate}`);
  } else {
    Logger.log("No API data available to determine the most recent estimate_end_date.");
  }

  // Step 5: Add columns and headers if needed
  if (!formattedExistingEndDate) {
    Logger.log(`No existing dates. Adding date headers.`)
    updateWeekHeadersWithSampleData(sampleData, keywordVolumeSheet);
  } else if (formattedExistingEndDate < apiRecentEndDate) {
    Logger.log(`The API has newer data available. Calculating columns to add.`);
  
    const apiRecentEndDateObj = new Date(apiRecentEndDate);
    const formattedExistingEndDateObj = new Date(formattedExistingEndDate);
    const diffMilliseconds = apiRecentEndDateObj - formattedExistingEndDateObj;
    diffWeeks = Math.ceil(diffMilliseconds / (7 * 24 * 60 * 60 * 1000));
    Logger.log(`Inserting ${diffWeeks} new columns.`);
  
    keywordVolumeSheet.insertColumnsBefore(2, diffWeeks);
  
    // Call the function to update headers for the newly added columns based on the most recent weeks
    updateWeekHeadersWithSampleData(sampleData, keywordVolumeSheet, diffWeeks);
  } else {
    Logger.log(`No need to add columns. Newer Jungle Scout data isn't available.`)
  }

  // Step 6: Fetch data for existing keywords if newer data is available
  if (diffWeeks > 0 && existingKeywordsToUpdate.length > 0) {
    Logger.log(`Fetching and trimming historical search volume data for ${existingKeywordsToUpdate.length} existing keywords.`);
    const trimmedExistingKeywordData = fetchAndOptionallyTrimHistoricalData(existingKeywordsToUpdate, marketplace, formattedExistingEndDate, formattedEndDate, diffWeeks);

  // Step 7: Populate fetched data for existing keywords
    Logger.log('Updating spreadsheet with historical data for existing keywords.');
    updateSheetWithHistoricalData(keywordVolumeSheet, trimmedExistingKeywordData, 3); // Existing keywords start at row 3
  }

  // Step 8: Fetch data for new keywords if newer data is available
  if  (newKeywords.length > 0) {
    Logger.log(`Fetching historical search volume data for ${newKeywords.length} keywords.`)
    const fullNewKeywordData = fetchAndOptionallyTrimHistoricalData(newKeywords, marketplace, formattedStartDate, formattedEndDate); // Fetch full data for new keywords
    Logger.log('Historical search volume data for new keywords retrieved successfully.');

    // Populate the keywords column for new keywords
    populateKeywordsColumn(keywordVolumeSheet, newKeywords)

  // Step 9: Populate fetched data for new keywords
    const lastExistingRow = existingKeywordsToUpdate.length + 3;
    Logger.log(`Updating spreadsheet with full historical data for new keywords starting from row ${lastExistingRow}.`);
    
    updateSheetWithHistoricalData(keywordVolumeSheet, fullNewKeywordData, lastExistingRow); // New keywords start at lastExistingRow
  }

  // Format the headers
  setHeaderFormatting(keywordVolumeSheet);

  // Format the rest of the Keyword Volumn sheet
  setColumnWidths(keywordVolumeSheet);
  const lastColumn = keywordVolumeSheet.getLastColumn();
  const lastRow = keywordVolumeSheet.getLastRow();
  const dataRange = keywordVolumeSheet.getRange(3, 2, lastRow - 2, lastColumn - 1);
  dataRange.setNumberFormat('#,##0');

  Logger.log(`This is the end.`)
}

/**
 * Calculates and populates the 'Organic Impressions' sheet with estimated organic impressions based on keyword ranks and search volumes.
 * Fetches data from the 'Rank by Day' and 'Keyword Volume' sheets, performs calculations to estimate daily organic impressions, and updates the 'Organic Impressions' sheet accordingly.
 */

function calculateOrganicImpressions() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const rankByDaySheet = ss.getSheetByName('Rank by Day');
  const keywordVolumeSheet = ss.getSheetByName('Keyword Volume');

  let organicImpressionsSheet = ss.getSheetByName('Organic Impressions');
  if (!organicImpressionsSheet) {
    organicImpressionsSheet = ss.insertSheet('Organic Impressions', ss.getSheets().length);
    Logger.log(`Organic Impressions sheet created.`);
  }

  // Clear existing data in 'Organic Impressions'
  organicImpressionsSheet.clear();
  Logger.log('Cleared existing data in Organic Impressions sheet.');

  // Fetch data from sheets
  const data = fetchDataFromSheets(rankByDaySheet, keywordVolumeSheet);
  Logger.log('Fetched data from Rank by Day and Keyword Volume sheets');

  // Get the most recent Keyword Volume date
  const mostRecentEndDate = getMostRecentEndDate(data.volumeEndDates);
  Logger.log(`Most Recent End Date: ${mostRecentEndDate}`);

  const filteredDates = data.dates.filter(date => {
    const formattedDate = safeDateFormat(date);
    return formattedDate && formattedDate <= mostRecentEndDate;
  });

  // Set up headers in 'Organic Impressions' sheet
  const headers = ['Keywords/Dates', ...filteredDates, 'Total']; // Include 'Keywords/Dates' as the first header
  organicImpressionsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Set the number format for the date headers to "YYYY-MM-DD"
  const dateHeaderRange = organicImpressionsSheet.getRange(1, 2, 1, headers.length);
  dateHeaderRange.setNumberFormat("yyyy-mm-dd");
  
  // Set up keywords in the first column
  const keywordsRange = organicImpressionsSheet.getRange(2, 1, data.keywords.length, 1);
  keywordsRange.setValues(data.keywords.map(keyword => [keyword]));

  // Call the function to calculate and populate the Organic Impressions sheet
  calculateAndPopulateOrganicImpressions(data, organicImpressionsSheet, filteredDates);

  // Format the rest of the Keyword Volumn sheet
  setColumnWidths(organicImpressionsSheet);
  const lastColumn = organicImpressionsSheet.getLastColumn();
  const lastRow = organicImpressionsSheet.getLastRow();
  const dataRange = organicImpressionsSheet.getRange(2, 2, lastRow - 1, lastColumn);
  Logger.log(`dataRange: ${dataRange}`)
  dataRange.setNumberFormat('#,##0');

  // Format the headers
  organicImpressionsSheet.getRange(1, 1, 1, lastColumn)
        .setFontWeight('bold')
        .setBackground('#EFEFEF');
}

function populateImpressionsChart() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sourceSheet = ss.getSheetByName('Organic Impressions');

  // Create the charts tab if it doesn't exist & clear if it does
  createChartTab();
  const chartSheet = ss.getSheetByName("Charts");

  // Get the charts data for the top 6 keywords and the aggregate of the others
  const topKeywordCount = 6
  const chartData = processChartData(sourceSheet, topKeywordCount);

  createStackedBarChart(chartSheet, chartData);

  // Format the impression data
  const lastColumn = chartSheet.getLastColumn();
  const lastRow = chartSheet.getLastRow();
  const dataRange = chartSheet.getRange(2, 2, lastRow, lastColumn);
  dataRange.setNumberFormat('#,##0');

  // Format column widths
  chartSheet.setColumnWidths(2,lastRow, 175);

  // Format the headers
  chartSheet.getRange(1, 1, 1, lastColumn)
        .setFontWeight('bold')
        .setBackground('#EFEFEF');
}