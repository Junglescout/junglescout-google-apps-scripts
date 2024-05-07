# Google Apps Scripts for Jungle Scout's API

## Description
Welcome to the **Google Apps Scripts for Jungle Scout's API** repository! This project houses various Google Apps Scripts designed to facilitate interactions with the Jungle Scout API directly from Google Sheets. Whether you're looking to automate data retrieval, streamline your workflow, or simply explore the capabilities of Jungle Scout's API, these scripts serve as a robust starting point.

See the [Jungle Scout API Documentation](https://developer.junglescout.com) and the [Jungle Scout Postman Collection](https://postman.junglescout.com) for more information about the Jungle Scout API.

> [!WARNING]  
> These scripts make live calls to the Jungle Scout API, which will count toward your monthly limit. Be careful when testing new functionality.

## Getting Started

### Project Structure
Each of the use cases is separated into its own folder. Those use cases would be associated with a separate Google spreadsheet.

### Prerequisites
Before diving into these scripts, ensure you have the following:

- **Jungle Scout Subscription**: You'll need a subscription to either the Jungle Scout Suite or Professional (Pro) plans to access the Jungle Scout API. Once you've used your trial credits, continuing to access the Jungle Scout API requires an API subscription plan.
- **A Google Spreadsheet**: For each script, you'll need a Google Spreadsheet relevant to your use case. Important: you'll need the Sheet ID from the spreadsheet's URL for the scripts to function correctly. You can copy the [Organic Impressions Estimator](https://docs.google.com/spreadsheets/d/1BQZPbFI2K2kI6sAEvi3sm04Tfsdl_3YCrPAinZ7SDyY) template as a starting point. 
- **A Jungle Scout API Key**: Authentication with the Jungle Scout API requires an API key. This includes the API key itself and the name associated with your API key. These details are crucial for setting up the environment variables within your Google Apps Script project.

### Setting Environment Variables in Google Scripts
1. Open your Google Spreadsheet.
2. Navigate to `Extensions > Apps Script`.
3. In the Apps Script, click on `Project Settings > Script properties`.
4. Add the following script properties with their respective values:
   - `API_KEY`: Your Jungle Scout API key.
   - `API_KEY_NAME`: The name associated with your Jungle Scout API key.
   - `TARGET_SPREADSHEET_ID`: The ID of your spreadsheet.

### Installing Your Scripts

#### Option 1: Manual Upload (Recommended for Beginners)
1. Download the script files from the appropriate folder within the repository.
2. Open the Google Apps Script editor for your spreadsheet (as described above).
3. For each file you want to use:
   - Click on `Files > + > Script`.
   - Name the file accordingly.
   - Copy and paste the content of the downloaded file into the editor.
4. Save your changes.

#### Option 2: Using `clasp` (For Automated Uploads)
[Clasp](https://github.com/google/clasp) is a tool that allows you to upload your scripts to Google Apps Script projects from the command line.  This method is more convenient, allowing you to edit files locally, but it is a bit more advanced.

When working with multiple folders in this repository, **it's essential to treat each folder as a separate Google Apps Script project**. This means you'll use `clasp` to create and manage a distinct project for the scripts within each folder.

1. Install `clasp` by running `npm install -g @google/clasp` in your terminal.
2. Login to `clasp` with `clasp login`.
3. **Enable the Google Apps Script API** for your Google account by visiting [Google Apps Script API](https://script.google.com/home/usersettings) and enabling the setting.
4. For each use case folder you intend to deploy:
   - Navigate to the specific folder you've cloned or downloaded from this repository.
   - Run `clasp create --type sheets --title "Your Use Case Title"` inside the folder. This command creates a new Google Apps Script project associated with that folder's scripts.
   - Use `clasp push` to upload the scripts to your new Google Apps Script project.

By creating a separate "clasp project" for each folder, you ensure that each set of scripts is organized and managed as its own project within Google Apps Script. This approach is particularly useful for maintaining project-specific dependencies, settings, and versions.

For comprehensive guidance on using `clasp`, consult the [`clasp` documentation](https://github.com/google/clasp).

## Organic Impressions Estimator

### Project Description
The Organic Impressions Estimator is a Google Apps Script project designed to estimate the number of organic impressions a product listing receives on Amazon based on its search rank and relevant keywords. This tool helps sellers and marketers gauge the visibility and potential traffic their products may receive.

### Usage
1. Complete the "Installing Your Scripts" section to set up the necessary files in your Google Apps Script project.
2. Copy the [Organic Impressions Estimator](https://docs.google.com/spreadsheets/d/1BQZPbFI2K2kI6sAEvi3sm04Tfsdl_3YCrPAinZ7SDyY) Google Sheet template.
3. Add your environment variables to Apps Script project settings as outlined in the [Setting Environment Variables](#setting-environment-variables-in-google-scripts) section. 
4. On the "ASINs" tab, enter your ASIN in the cell below the "Your ASIN" label. This is the primary ASIN you want to analyze. 
5. Enter additional competitor ASINs below the "Competitor ASINs" label if you want to pull in additional keywords.
6. Select the marketplace you want to analyze.
7. In the cell below the "Minimum 30D Exact Vol." label, set the minimum 30-day exact search volume. This is the minimum volume threshold for keywords you want to save.
8. In the cell below the "Ranked Keywords Only" label, select whether or not you only want to save keywords that your ASIN is organically ranking for.
9. Assign scripts to each of the buttons in the "ASINs" tab. Click the button, select the 3-dot menu, select "Assign script", and add the following function name.
   * Test Keyword Filters &rarr; `fetchKeywords`
   * Get Ranks &rarr; `getRanksAndPopulateRankByDay`
   * Get Historical Volume &rarr; `fetchHistoricalSearchVolumesV2`
   * Estimate Impressions &rarr; `calculateOrganicImpressions`
   * Create Chart &rarr; `populateImpressionsChart`
10. Run "Test Keyword Filters" to see what keywords will be retrieved from the API and saved to your sheet.
11. Run "Get Ranks" to pull ranking data for your ASIN, which will populate the "Raw Rank Data" and "Rank by Day" tabs. 
   * It is suggested that you set this up on a daily schedule to run automatically. [This section](#automating-your-scripts-with-time-based-triggers) outlines the steps to do this.
12. Run "Get Historical Volume" to pull historical search volumes and populate the "Keyword Volume" tab.
   * Set this up to run on a recurring basis. Consider checking multiple times per week to ensure you have the most recent keyword volumes available.
13. Allow a week or so to collect ranking and search volume data that covers the same time period. This overlapping data is necessary to estimate organic impressions. Once you have this overlap, run "Estimate Impressions" to calculate the estimated organic impressions in the "Organic Impressions" sheet.
14. Run "Create Chart" to populate the "Charts" tab with a chart of the estimated impressions for your product's most important keywords.

## Historical Volume Charts

### Project Description
The Historical Volume Charts project allows users to generate historical sales volume charts for the top keywords associated with specific ASINs directly within a Google Spreadsheet. This tool provides valuable insights into product performance over time, enabling sellers to make data-driven decisions.

### Usage
1. Complete the "Installing Your Scripts" section to set up the necessary files in your Google Apps Script project.
2. Open the [Historical Volume Charts](https://docs.google.com/spreadsheets/d/17JBbXSH4rwhspOmQqyNrhYXRqRmxkgXZSiIP-90JSC4) Google Sheet template.
3. Add your environment variables to Apps Script project settings as outlined in the [Setting Environment Variables](#setting-environment-variables-in-google-scripts) section. 
4. On the "ASINs" tab, enter your ASIN in the cell below the "Your ASIN" label. This is the primary ASIN you want to analyze. 
5. Enter additional competitor ASINs below the "Competitor ASINs" label if you want to pull in additional keywords.
6. Select the marketplace you want to analyze.
7. In the cell below the "Minimum 30D Exact Vol." label, set the minimum 30-day exact search volume. This is the minimum volume threshold for keywords you want to save.
8. In the cell below the "Ranked Keywords Only" label, select whether or not you only want to save keywords that your ASIN is organically ranking for.
9. Assign scripts to each of the buttons in the "ASINs" tab. Click the button, select the 3-dot menu, select "Assign script", and add the following function name.
   * Get Keywords &rarr; `fetchKeywords`
   * Get History &rarr; `fetchHistoricalSearchVolumes`
   * Generate Charts &rarr; `createCharts`
10. Run "Get Kewyords" to fetch the keywords from Jungle Scout and populate the table in the "ASINs" tab.
11. Run "Get History" to pull historical search volumes and populate the "Keyword Volume" tab.
   * You can set this up to run on a schedule. [This section](#automating-your-scripts-with-time-based-triggers) outlines the steps to do this.
14. Run "Generate Charts" to populate the "Charts" tab with historical search volume charts for your top keywords.


## Automating Your Scripts with Time-Based Triggers

Google Apps Script provides a powerful feature called **Triggers** which allows you to run functions automatically based on certain conditions, including time intervals. This is especially useful if you want to automate repetitive tasks like pulling ranking data from Jungle Scout and saving it to your Google Sheet on a daily basis.

### Setting Up a Time-Based Trigger

Follow these steps to set up a recurring job for your script:

1. **Open the Apps Script Project**: Navigate to your Google Spreadsheet, go to **Extensions > Apps Script** to open the project containing the script you wish to automate.
2. **Access Triggers**: In the Apps Script editor, find and click on the clock icon in the left sidebar to open the **Triggers** page.
3. **Add a Trigger**: Click on the `+ Add Trigger` button at the bottom right corner of the page.
4. **Configure the Trigger**:
    - **Choose which function to run**: Select the function you want to automate from the dropdown menu.
    - **Choose which deployment should run**: Typically, you'll select `Head` for scripts still in development.
    - **Select event source**: Choose `Time-driven` to set up a recurring trigger.
    - **Select type of time based trigger**: Pick the interval that suits your need. For daily updates, you'll select `Day timer` and then specify the time of day you want the script to run.
5. **Save**: After configuring your trigger, click `Save`.

Now, your selected function will automatically run at the intervals you specified, pulling data into your Google Sheet without any manual intervention needed.

### Notes and Best Practices

- **API Call Limits**: Remember that automated calls to the Jungle Scout API will count against your monthly limit. Plan your triggers accordingly to avoid unexpected quota exceedances.
- **Testing**: It's a good idea to manually test your script to ensure it behaves as expected before automating it with triggers.
- **Monitoring**: You can monitor the execution of scheduled functions and check for any errors by going to the **Executions** tab in the Apps Script editor.

By leveraging time-based triggers, you can automate your data collection process, ensuring your Google Sheet always has the latest information from Jungle Scout without needing to manually run scripts.

## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. More details on how to contribute will be provided soon.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## FAQs
Here are a few common questions and answers to get you started:

**Q: Will using these scripts affect my API call limit with Jungle Scout?**  
A: Yes, these scripts make live calls to the Jungle Scout API. Each call counts against your monthly limit. Please use them accordingly.

**Q: Can I contribute to this project if I'm not a developer?**  
A: Absolutely! While contributions to the code are welcome, we also appreciate documentation improvements, bug reports, and use case suggestions.

**Q: Who do I contact if I have questions or need support?**  
A: For now, please open an issue in this repository if you find a bug. For support with Jungle Scout's API, please contact Jungle Scout at [support\@junglescout.com](mailto:support@junglescout.com?subject=API%20Question).

## Additional Information
Please use these projects at your own risk. These scripts interact with the Jungle Scout API in real time, consuming your available call limit. Always test scripts in a controlled environment before applying them to critical operations.