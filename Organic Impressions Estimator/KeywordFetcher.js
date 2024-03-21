/**
 * Recursively fetches keywords and updates the spreadsheet.
 * @param {string} url - The API endpoint URL.
 * @param {Object} options - The fetch request options.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {number} maxKeywords - The maximum number of keywords to fetch.
 * @param {boolean} rankedKeywordsOnly - Whether to fetch only ranked keywords.
 * @param {number} currentCount - The current count of fetched keywords.
 * @param {Array<Array<string|number>>} allKeywords - The array of fetched keywords.
 */
function getAllKeywords(url, options, sheet, maxKeywords, rankedKeywordsOnly, currentCount = 0, allKeywords = []) {
  if (currentCount >= maxKeywords) {
    Logger.log(`Reached the maximum number of keywords (${maxKeywords})`);
    return;
  }

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log(`API request failed with status ${response.getResponseCode()}, response: ${response.getContentText()}`);
    return;
  }


  const jsonResponse = JSON.parse(response.getContentText());
  Logger.log(`Received ${jsonResponse.data.length} keywords`);

  const minMonthlySearchVolume = getMinMonthlySearchVolume(sheet);
  Logger.log(`Minimum monthly search volume: ${minMonthlySearchVolume}`);

  let continueFetching = true;
  for (const item of jsonResponse.data) {
    if (currentCount >= maxKeywords || !continueFetching) break;

    const exactVolume = item.attributes.monthly_search_volume_exact;
    if (exactVolume === null || exactVolume < minMonthlySearchVolume) {
      Logger.log(`Encountered keyword below minimum exact search volume (${exactVolume}), stopping fetch.`);
      continueFetching = false;
      break;
    }

    const organicRank = item.attributes.organic_rank;
    const sponsoredRank = item.attributes.sponsored_rank;

    if (rankedKeywordsOnly && (organicRank === null || organicRank === 0) && (sponsoredRank === null || sponsoredRank === 0)) {
      continue; // Skip the keyword if it's not ranked and rankedKeywordsOnly is true
    }

    const keywordData = [
      item.attributes.name,
      organicRank || '',
      item.attributes.avg_competitor_organic_rank || '',
      sponsoredRank || '',
      item.attributes.avg_competitor_sponsored_rank || '',
      exactVolume,
      item.attributes.monthly_search_volume_broad || '',
    ];
    allKeywords.push(keywordData);
    currentCount++;
  }

  if (jsonResponse.links?.next && continueFetching && currentCount < maxKeywords) {
    Logger.log('Fetching next page...');
    getAllKeywords(jsonResponse.links.next, options, sheet, maxKeywords, rankedKeywordsOnly, currentCount, allKeywords);
  } else {
    if (!continueFetching) {
      Logger.log('Stopped due to encountering a keyword below the minimum exact search volume.');
    } else {
      Logger.log('No more pages to fetch or reached the maximum limit.');
    }
    updateSpreadsheet(sheet, allKeywords);
  }
}

/**
 * Updates the spreadsheet with the fetched keywords.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Google Sheet to update.
 * @param {Array<Array<string|number>>} allKeywords - The array of fetched keywords.
 */
function updateSpreadsheet(sheet, allKeywords) {
  const startRow = 7;
  const range = sheet.getRange(startRow, 4, allKeywords.length, allKeywords[0].length);
  range.setValues(allKeywords);
  Logger.log(`Total Keywords Fetched: ${allKeywords.length}`);

  const tableBorder = SpreadsheetApp.BorderStyle.SOLID;
  range.setBorder(true, true, true, true, true, true, null, tableBorder);
}