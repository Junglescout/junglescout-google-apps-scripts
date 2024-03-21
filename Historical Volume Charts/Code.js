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

  const marketplace = getMarketplace(sheet);
  const maxKeywords = 2000;
  Logger.log(`Marketplace: ${marketplace}, Max keywords to fetch: ${maxKeywords}`);

  const primaryAsin = sheet.getRange('B3').getValue().toString();
  const competitorAsins = getCompetitorAsins(sheet);
  const asins = [primaryAsin, ...competitorAsins];

  const dataRange = 'D5:J';
  clearRange(sheet, dataRange);

  setHeaders(sheet);
  setColumnWidths(sheet);

  const rankedKeywordsOnly = getRankedKeywordsOnly(sheet);
  Logger.log(`Fetching only ranked keywords: ${rankedKeywordsOnly}`);

  const baseUrl = 'https://developer.junglescout.com/api/keywords/keywords_by_asin_query';
  const initialUrl = `${baseUrl}?marketplace=${marketplace}&page[size]=100`;
  const options = getRequestOptions(asins);

  getAllKeywords(initialUrl, options, sheet, maxKeywords, rankedKeywordsOnly);
}

/**
 * Fetches historical search volumes for keywords and updates the spreadsheet.
 */
function fetchHistoricalSearchVolumes() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = ss.getSheetByName('ASINs');
  
  if (!sheet) {
    Logger.log('ASINs sheet not found');
    return;
  }
  
  const marketplace = getMarketplace(sheet);
  Logger.log(`Fetching historical search volumes for marketplace: ${marketplace}`);
  
  let targetSheet = ss.getSheetByName('Keyword Volume');
  
  if (!targetSheet) {
    targetSheet = ss.insertSheet('Keyword Volume', 1);
    Logger.log('Keyword Volume sheet created.');
  }
  
  clearSheet(targetSheet);
  setColumnWidths(targetSheet);
  setHeaderFormatting(targetSheet);
  
  const [startDate, endDate] = getDateRange(365);
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  Logger.log(`Fetching data between ${formattedStartDate} and ${formattedEndDate}`);
  
  const keywords = getKeywords(sheet);
  populateKeywordsColumn(targetSheet, keywords);
  
  Logger.log(`Fetching historical data for ${keywords.length} keywords`);
  
  keywords.forEach((keyword, index) => {
    if (keyword) {
      const historicalData = getHistoricalDataForKeyword(keyword, marketplace, formattedStartDate, formattedEndDate);
      if (historicalData.length > 0) {
        populateHistoricalData(targetSheet, historicalData, index);
      } else {
        Logger.log(`No historical data found for keyword: ${keyword}`);
      }
    }
  });
  
  formatSearchVolume(targetSheet);
  
  Logger.log('Historical search volumes fetched and updated in the spreadsheet.');
}

/**
 * Creates the "Charts" sheet and generates line charts for the first 20 keywords.
 */
function createCharts() {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const keywordVolumeSheet = ss.getSheetByName('Keyword Volume');
  
  if (!keywordVolumeSheet) {
    Logger.log('Keyword Volume sheet not found');
    return;
  }
  
  let chartsSheet = ss.getSheetByName('Charts');
  
  if (!chartsSheet) {
    chartsSheet = ss.insertSheet('Charts', ss.getNumSheets());
    Logger.log('Charts sheet created.');
  } else {
    chartsSheet.clear(); // Clear existing content
    const charts = chartsSheet.getCharts();
    for (let i = 0; i < charts.length; i++) {
      chartsSheet.removeChart(charts[i]);
    }
    Logger.log('Existing content cleared.');
  }
  
  const chartWidth = 298;
  const chartHeight = 180;
  const chartsPerRow = 4;
  const keywords = getKeywordsForCharts(keywordVolumeSheet, 3, 22);
  
  Logger.log(`Found ${keywords.length} keywords for charts`);
  
  keywords.forEach((keyword, index) => {
    if (keyword) {
      const rowIndex = index + 3;
      Logger.log(`Creating chart for keyword: ${keyword}`);
      const chartTitle = toTitleCase(keyword);
      const chartRow = Math.floor(index / chartsPerRow) * 9 + 2;
      const chartCol = (index % chartsPerRow) * 3 + 1;
      createLineChart(chartsSheet, keywordVolumeSheet, chartTitle, rowIndex, chartRow, chartCol, chartWidth, chartHeight);
    }
  });
}