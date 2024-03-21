# Google Apps Scripts for Jungle Scout's API

## Description
Welcome to the **Google Apps Scripts for Jungle Scout's API** repository! This project houses various Google Apps Scripts designed to facilitate interactions with the Jungle Scout API directly from Google Sheets. Whether you're looking to automate data retrieval, streamline your workflow, or simply explore the capabilities of Jungle Scout's API, these scripts serve as a robust starting point.

See the [Jungle Scout API Documentation](https://developer.junglescout.com) and the [Jungle Scout Postman Collection](https://postman.junglescout.com) for more information about the Jungle Scout API.

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
2. Navigate to **Extensions > Apps Script**.
3. In the Apps Script, click on **Project Settings > Script properties**.
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

## Usage
These scripts are designed to interact with the Jungle Scout API and populate Google Sheets with the data you need. Here's how to get started with a basic script:
1. Ensure you have met all the prerequisites.
2. Copy the appropriate template file. 
   - [Organic Impression Calculator](https://docs.google.com/spreadsheets/d/1BQZPbFI2K2kI6sAEvi3sm04Tfsdl_3YCrPAinZ7SDyY)
   - [Historical Volume Charts](https://docs.google.com/spreadsheets/d/17JBbXSH4rwhspOmQqyNrhYXRqRmxkgXZSiIP-90JSC4)
3. Follow the installation steps to set up your script.
4. Customize the script parameters to suit your specific needs, such as adjusting API endpoints or data processing functions.
5. Run the script and watch as your Google Sheet gets populated with data from the Jungle Scout API.

Remember, these scripts make live calls to the Jungle Scout API, which will count against your monthly limit. Be careful when testing new functionality.

## Automating Your Scripts with Time-Based Triggers

Google Apps Script provides a powerful feature called **Triggers** which allows you to run functions automatically based on certain conditions, including time intervals. This is especially useful if you want to automate repetitive tasks like pulling ranking data from Jungle Scout and saving it to your Google Sheet on a daily basis.

### Setting Up a Time-Based Trigger

Follow these steps to set up a recurring job for your script:

1. **Open the Apps Script Project**: Navigate to your Google Spreadsheet, go to **Extensions > Apps Script** to open the project containing the script you wish to automate.
2. **Access Triggers**: In the Apps Script editor, find and click on the clock icon in the left sidebar to open the **Triggers** page.
3. **Add a Trigger**: Click on the "+ Add Trigger" button at the bottom right corner of the page.
4. **Configure the Trigger**:
    - **Choose which function to run**: Select the function you want to automate from the dropdown menu.
    - **Choose which deployment should run**: Typically, you'll select "Head" for scripts still in development.
    - **Select event source**: Choose "Time-driven" to set up a recurring trigger.
    - **Select type of time based trigger**: Pick the interval that suits your need. For daily updates, you might select "Day timer" and then specify the time of day you want the script to run.
5. **Save**: After configuring your trigger, click "Save".

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
A: For now, please open an issue in this repository for any questions or support needs. This section will be updated with more contact options soon.

## Additional Information
Please use these projects at your own risk. These scripts interact with the Jungle Scout API in real time, consuming your available call limit. Always test scripts in a controlled environment before applying them to critical operations.