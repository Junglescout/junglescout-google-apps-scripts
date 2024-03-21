/**
 * Fetches ranking data from the Jungle Scout API and saves it to the "Raw Rank Data" sheet.
 * Also updates the "Rank by Day" sheet with the latest keywords and ranks.
 * @param {string} url - The API endpoint URL.
 * @param {Object} options - The fetch request options.
 * @param {string} primaryAsin - The primary ASIN.
 * @param {string[]} competitorAsins - The array of competitor ASINs.
 * @param {boolean} rankedKeywordsOnly - Whether to fetch only ranked keywords.
 * @param {number} minMonthlySearchVolume - The minimum monthly search volume.
 */
function getAllRankingData(url, options, primaryAsin, competitorAsins, rankedKeywordsOnly, minMonthlySearchVolume, newRankingData) {
  Logger.log(`minMonthlySearchVolume: ${minMonthlySearchVolume}`);

  const asins = [primaryAsin, ...competitorAsins];
  options.payload = JSON.stringify({
    data: {
      type: 'keywords_by_asin_query',
      attributes: {
        asins,
        include_variants: true,
        min_word_count: 1,
        max_word_count: 10,
        min_organic_product_count: 1,
        sort: '-monthly_search_volume_exact',
      },
    },
  });

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log(`API request failed with status ${response.getResponseCode()}, response: ${response.getContentText()}`);
    return;
  }

  const jsonResponse = JSON.parse(response.getContentText());
  Logger.log(`Received ${jsonResponse.data.length} keywords`);

  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const rankingSheet = ss.getSheetByName('Raw Rank Data');
  const existingData = rankingSheet.getDataRange().getValues();

  let continueFetching = true;

  for (const item of jsonResponse.data) {
    if (!continueFetching) break;

    const keyword = item.attributes.name;
    const updatedAt = new Date(item.attributes.updated_at);
    
    // Skip keywords below the minimum search volume
    const exactVolume = item.attributes.monthly_search_volume_exact;
    if (exactVolume < minMonthlySearchVolume) {
      Logger.log(`Encountered keyword "${keyword}" below minimum exact search volume (${exactVolume}), stopping fetch.`);
      continueFetching = false;
      break;
    }

    // Skip the keyword if it's not ranked and rankedKeywordsOnly is true
    const organicRank = item.attributes.organic_rank;
    const sponsoredRank = item.attributes.sponsored_rank;
    if (rankedKeywordsOnly && (organicRank === null || organicRank === 0) && (sponsoredRank === null || sponsoredRank === 0)) {
      continue; 
    }  
    
    // Format updatedAt to a date string (YYYY-MM-DD)
    const formattedUpdatedAt = updatedAt.toISOString().split('T')[0];
    Logger.log(`formattedUpdatedAt: ${formattedUpdatedAt}`);
    
    
    // Filter rows for the current keyword
    const keywordRows = existingData.filter(row => row[1] === keyword);
    
    // Find the row with the most recent date
    let mostRecentDate = null;
    let formattedMostRecentDate = null;
    for (const row of keywordRows) {
        const existingDate = new Date(row[2]);
        const formattedExistingDate = existingDate.toISOString().split('T')[0];
        Logger.log(`formattedExistingDate: ${formattedExistingDate}`);
        if (!mostRecentDate || existingDate > mostRecentDate) {
            mostRecentDate = existingDate;
            formattedMostRecentDate = formattedExistingDate;
        }
    }

    Logger.log(`formattedMostRecentDate: ${formattedMostRecentDate}`);

    // Compare formatted date strings
    if (!formattedMostRecentDate || formattedUpdatedAt > formattedMostRecentDate) {
      // Check if formattedUpdatedAt is within the last 90 days
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const updatedAtDate = new Date(formattedUpdatedAt);
      
      if (updatedAtDate >= sevenDaysAgo) {
        const rowData = [
          primaryAsin,
          keyword,
          formattedUpdatedAt,
          organicRank > 0 ? organicRank : '',
          sponsoredRank > 0 ? sponsoredRank : '',
          item.attributes.overall_rank,
          item.attributes.ppc_bid_exact,
          item.attributes.ppc_bid_broad,
          item.attributes.monthly_search_volume_exact
        ];

        Logger.log(`rowData: ${rowData}`);

        // Add competitor organic ranks to the rowData
        competitorAsins.forEach(competitorAsin => {
          const competitorRank = item.attributes.competitor_organic_rank.find(rank => rank.asin === competitorAsin);
          rowData.push(competitorRank ? (competitorRank.organic_rank > 0 ? competitorRank.organic_rank : '') : '');
        });
        Logger.log(`rowData with competitors: ${rowData}`);

        newRankingData.push(rowData);
        Logger.log(`newRankingData: ${newRankingData}`);
        Logger.log(`Saved data for ASIN: ${primaryAsin}, Keyword: ${keyword}, Organic Rank: ${organicRank}, Sponsored Rank: ${sponsoredRank}`);
      } else {
        Logger.log(`Skipped keyword "${keyword}" with formattedUpdatedAt: ${formattedUpdatedAt} (not within the last 90 days)`);
      }
    }
  }

  if (jsonResponse.links?.next && continueFetching) {
    Logger.log('Fetching next page...');
    getAllRankingData(jsonResponse.links.next, options, primaryAsin, competitorAsins, rankedKeywordsOnly, minMonthlySearchVolume, newRankingData);
  } else {
    if (!continueFetching) {
      Logger.log('Stopped fetching due to encountering a keyword below the minimum exact search volume.');
    } else {
      Logger.log('No more pages to fetch.');
    }
    Logger.log(`newRankingData: ${newRankingData}`);
    Logger.log(`competitorAsins: ${competitorAsins}`);
    updateRankingSheet(newRankingData, competitorAsins); // Update the "Raw Rank Data" sheet
    updateRankByDaySheet(newRankingData); // Update the "Rank by Day" sheet
  }
}

/**
 * Updates the "Raw Rank Data" sheet with the fetched ranking data.
 * @param {Array<Array<string|number>>} newRankingData - The array of new ranking data.
 * @param {string[]} competitorAsins - The array of competitor ASINs.
 */
function updateRankingSheet(newRankingData, competitorAsins) {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const rankingSheet = ss.getSheetByName('Raw Rank Data');

  Logger.log(`newRankingData: ${newRankingData}`);

  if (newRankingData.length > 0) {
    const existingHeaders = rankingSheet.getRange(1, 1, 1, rankingSheet.getLastColumn()).getValues()[0];
    const newHeaders = ['ASIN', 'Keyword', 'Date', 'Organic Rank', 'Sponsored Rank', 'Overall Rank', 'Exact Bid', 'Broad Bid', '30-Day Volume'];

    competitorAsins.forEach(competitorAsin => {
      if (!existingHeaders.includes(competitorAsin)) {
        newHeaders.push(competitorAsin);
      }
    });

    if (newHeaders.length > existingHeaders.length) {
      rankingSheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders])
        .setFontWeight('bold')
        .setBackground('#EFEFEF');
      rankingSheet.setFrozenRows(1);
    }

    rankingSheet.getRange(rankingSheet.getLastRow() + 1, 1, newRankingData.length, newRankingData[0].length).setValues(newRankingData);
    
    // Format columns G and H as currency
    const currencyRange = rankingSheet.getRange(2, 7, rankingSheet.getLastRow() - 1, 2);
    currencyRange.setNumberFormat("$#,##0.00");

    // Format column I as a number with thousands comma and no decimal
    const numberRange = rankingSheet.getRange(2, 9, rankingSheet.getLastRow() - 1, 1);
    numberRange.setNumberFormat("#,##0");

    Logger.log(`Saved ${newRankingData.length} rows of ranking data to the sheet.`);
  } else {
    Logger.log('No new ranking data to save.');
  }
}

/**
 * Updates the "Rank by Day" sheet with the latest keywords and ranks.
 * @param {Array<Array<string|number>>} newRankingData - The array of new ranking data.
 */
function updateRankByDaySheet(newRankingData) {
  const ss = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const rankByDaySheet = ss.getSheetByName('Rank by Day');

  // Get the existing data and headers from the "Rank by Day" sheet
  const existingData = rankByDaySheet.getDataRange().getValues();
  let existingHeaders = existingData[0];

  // If the sheet is empty, create a new header row with "Keyword" as the first column
  if (existingHeaders.length === 0) {
    existingHeaders = ["Keyword"];
  }

  // Format existing header dates to 'YYYY-MM-DD' format
  existingHeaders = existingHeaders.map(header => {
    if (header instanceof Date) {
      return header.toISOString().split('T')[0];
    }
    return header;
  });

  // Get all unique dates from newRankingData where organicRank is not null or 0
  const uniqueDates = [...new Set(newRankingData
    .filter(row => row[3] != null && row[3] != 0)
    .map(row => row[2]))].sort();

  // Add new date columns if necessary
  for (const date of uniqueDates) {
    const formattedDate = date;
    Logger.log(`Checking date: ${formattedDate}`);
    if (!existingHeaders.includes(formattedDate)) {
      Logger.log(`Adding new date column: ${formattedDate}`);
      existingHeaders.push(formattedDate);
    } else {
      Logger.log(`Date column already exists: ${formattedDate}`);
    }
  }

  // Update the headers in the sheet if new columns were added
  if (existingHeaders.length > rankByDaySheet.getLastColumn()) {
    rankByDaySheet.getRange(1, 1, 1, existingHeaders.length).setValues([existingHeaders]).setFontWeight('bold');
  }

  // Create a map of existing keywords and their row numbers
  const keywordMap = new Map();
  for (let i = 1; i < existingData.length; i++) {
    const keyword = existingData[i][0];
    if (keyword) {
      keywordMap.set(keyword, i + 1);
    }
  }

  // Update the ranks for each keyword
  newRankingData.forEach(row => {
    const [asin, keyword, formattedUpdatedAt, organicRank] = row;

    // Skip keywords with null organic rank
    if (organicRank == null || organicRank == 0) {
      Logger.log(`Skipping keyword "${keyword}" with null organic rank on ${formattedUpdatedAt}`);
      return;
    }

    // Find the column index for the current date
    const dateColumnIndex = existingHeaders.findIndex(header => header === formattedUpdatedAt);

    if (dateColumnIndex !== -1) {
      if (keywordMap.has(keyword)) {
        // Update the rank for the existing keyword
        const rowNumber = keywordMap.get(keyword);
        rankByDaySheet.getRange(rowNumber, dateColumnIndex + 1).setValue(organicRank);
        Logger.log(`Updated rank for keyword "${keyword}" on ${formattedUpdatedAt}`);
      } else {
        // Add a new row for the keyword
        const newRow = new Array(existingHeaders.length).fill('');
        newRow[0] = keyword;
        newRow[dateColumnIndex] = organicRank;
        rankByDaySheet.appendRow(newRow);
        keywordMap.set(keyword, rankByDaySheet.getLastRow());
        Logger.log(`Added new keyword "${keyword}" with rank ${organicRank} on ${formattedUpdatedAt}`);
      }
    } else {
      Logger.log(`Date column not found for ${formattedUpdatedAt}`);
    }
  });
}