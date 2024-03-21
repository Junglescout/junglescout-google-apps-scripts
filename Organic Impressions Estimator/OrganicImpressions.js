/**
 * Retrieves keyword rankings and volume data from the 'Rank by Day' and 'Keyword Volume' sheets.
 * The function fetches keywords from the 'Rank by Day' sheet along with their daily ranks and dates.
 * It also fetches the start and end dates for each week and the corresponding search volumes from the 'Keyword Volume' sheet.
 * This consolidated data is essential for calculating organic impressions.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} rankByDaySheet - The 'Rank by Day' Google Sheet from which to fetch keyword rankings and dates.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} keywordVolumeSheet - The 'Keyword Volume' Google Sheet from which to fetch weekly volume data.
 * @returns {Object} An object containing arrays of keywords, dates, daily ranks, weekly volume start and end dates, and weekly volumes.
 */

function fetchDataFromSheets(rankByDaySheet, keywordVolumeSheet) {
  // Fetch keywords from 'Rank by Day'
  const keywords = rankByDaySheet.getRange('A2:A' + rankByDaySheet.getLastRow()).getValues().flat().filter(String);
  
  // Fetch dates from 'Rank by Day'
  const dates = rankByDaySheet.getRange('B1:1' + rankByDaySheet.getLastColumn()).getValues()[0];
  
  // Fetch daily ranks from 'Rank by Day'
  const dailyRanks = rankByDaySheet.getRange('B2:' + rankByDaySheet.getLastColumn() + rankByDaySheet.getLastRow()).getValues();
  
  // Fetch weekly volume data from 'Keyword Volume'
  const volumeStartDates = keywordVolumeSheet.getRange('B1:1' + keywordVolumeSheet.getLastColumn()).getValues()[0];
  const volumeEndDates = keywordVolumeSheet.getRange('B2:2' + keywordVolumeSheet.getLastColumn()).getValues()[0];
  const weeklyVolumes = keywordVolumeSheet.getRange('B3:' + keywordVolumeSheet.getLastColumn() + keywordVolumeSheet.getLastRow()).getValues();
  
  return {
    keywords,
    dates,
    dailyRanks,
    volumeStartDates,
    volumeEndDates,
    weeklyVolumes
  };
}

function calculateAndPopulateOrganicImpressions(data, organicImpressionsSheet, filteredDates) {
    const impressions = []; // To store calculated impressions for each keyword and date
    
    // Assuming formattedVolumeStartDates and formattedVolumeEndDates are correctly prepared as before

    data.keywords.forEach((keyword, keywordIndex) => {
        const keywordImpressions = [keyword]; // Start with the keyword

        // Iterate over filteredDates instead of all dates
        filteredDates.forEach((date) => {
            const dateIndex = data.dates.indexOf(date); // Find the index of the date in the original dates array
            if (dateIndex === -1) {
                keywordImpressions.push(""); // Push empty string if the date is not found (should not happen as we're using filtered dates)
                return;
            }

            // Proceed with existing logic to find volumeWeekIndex and calculate impression
            const formattedDate = safeDateFormat(date);
            const rank = data.dailyRanks[keywordIndex][dateIndex] || 'No Rank'; // Default to 'No Rank' if empty
            const multiplier = getRankMultiplier(parseInt(rank));
            const volumeWeekIndex = data.volumeStartDates.findIndex((startDate, index) =>
                safeDateFormat(startDate) <= formattedDate && safeDateFormat(data.volumeEndDates[index]) >= formattedDate);

            if (volumeWeekIndex !== -1) {
                const volume = data.weeklyVolumes[keywordIndex][volumeWeekIndex] || 0; // Default to 0 if not found
                const dailyImpression = Math.round((volume / 7) * multiplier);
                keywordImpressions.push(dailyImpression || ""); // Push the calculated impression or an empty string if not applicable
            } else {
                keywordImpressions.push(0); // Reflect no data with 0 for consistency with your setup
            }
        });

        keywordImpressions.push("");
        impressions.push(keywordImpressions);
    });

    // Populate the 'Organic Impressions' sheet
    if (impressions.length > 0 && impressions[0].length > 0) {
        const range = organicImpressionsSheet.getRange(2, 1, impressions.length, impressions[0].length);
        range.setValues(impressions);

        // Now set the 'Total' formula for each row
        for (let row = 2; row <= impressions.length + 1; row++) { // Start from row 2 to skip the header row
            const formulaCell = organicImpressionsSheet.getRange(row, impressions[0].length);
            const formula = `=SUM(B${row}:${String.fromCharCode(65 + impressions[0].length - 2)}${row})`;
            formulaCell.setFormula(formula);
        }
    }
}


/**
 * Adjust these multipliers as you see fit. These are made up and vary significantly by subcategory.
 * Determines the rank multiplier based on the given rank.
 * @param {number} rank - The rank of the keyword.
 * @returns {number} The multiplier corresponding to the rank range.
 */
function getRankMultiplier(rank) {
  if (rank == 1) return 0.8;
  if (rank == 2) return 0.7;
  if (rank >= 3 && rank <= 6) return 0.6;
  if (rank == 7) return 0.4;
  if (rank >= 8 && rank <= 10) return 0.3;
  if (rank >= 11 && rank <= 13) return 0.09;
  if (rank >= 14 && rank <= 18) return 0.07;
  if (rank >= 19 && rank <= 23) return 0.05;
  if (rank >= 24 && rank <= 28) return 0.03;
  if (rank >= 29 && rank <= 33) return 0.01;
  if (rank >= 34 && rank <= 38) return 0.007;
  if (rank >= 39 && rank <= 43) return 0.005;
  if (rank >= 44 && rank <= 48) return 0.003;
  if (rank >= 49 && rank <= 100) return 0.001;
  return 0; // Assuming no multiplier for ranks outside the specified ranges
}

// Helper function to safely format dates and handle invalid inputs
function safeDateFormat(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) { // Check if the date is invalid
    return null; // Return null or some default value for invalid dates
  }
  return date.toISOString().split('T')[0];
}


function getMostRecentEndDate(volumeEndDates) {
    const formattedDates = volumeEndDates.map(dateStr => safeDateFormat(dateStr)).filter(date => date !== null);
    
    if (formattedDates.length === 0) {
        Logger.log("No valid end dates found.");
        return null;
    }

    // Find the most recent date from the valid, formatted dates
    const mostRecentEndDate = formattedDates.reduce((latest, current) => new Date(latest) > new Date(current) ? latest : current);

    return mostRecentEndDate; // This should be in the format (YYYY-MM-DD)
}



