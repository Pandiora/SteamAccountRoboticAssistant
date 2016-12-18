<img src="./images/icon-48x48.png" alt="SteamAccountRoboticAssistantr" width="auto" height="30">  SARA • Steam Account Robotic Assistant
===================

Chrome-Extension for enhancing and automating your Steam-Experience with focus on managing multiple Steam-Accounts. SARA may have the same features as other Chrome-Extensions for Steam but uses other approaches. This said, SARA isn't a copy of any other Project and was created from scratch.

This extension is pretty much Alpha-State, so you have to expect bugs and missing features. 
The use of this extension is on your own risk and I'm not responsible for any damage that 
it might cause, but I'm trying my best to avoid such cases.

So lets begin with the more interesting part:

# Features
- 2FA-Implementation to confirm market-listings/trades and also generating Login-Tokens
- Database to store your Accounts/Product-Keys/Games/Cookies and more
- Booster-Profit-Calculator to find the most profitable Booster you can craft
- Reliable Bulk-Sell from your inventory including Multi-Select
- Multi-Language Support (if your language isn't there -> _locales) feel free to translate it
- different Scripts which can craft the Community-Badge to Level 2 in Bulk in example

# To be added Features
- Removal of API-Key, SteamID, Currency in the settings, since we can get this Data from our IndexedDB
- Final Implementation of editable Tables and a new Database-Store for Product Keys
- Also for above one an Overview for Product-Keys additionally to the Syncfusion-Grid
- Add encryption to Database-Stores (the Database can be accessed by this extension only but add it should be added anyway to make this extension more secure)
- Add Bulk-Removal and Search for Steam-Market
- Add option for synchronizing your settings and (encrypted) Databases with your Google-Account -> can only be done with Release on Chrome Web-Store (you should backup your data anyway from time to time)

# Installation

You have to download/clone this repo, put the folder somewhere you can easily access it again
and then go into your chrome-settings > Extensions > click "Load unpacked Extension" and add
this extension. When everything went fine you should see a new icon in your chrome-menu.
If you click this Icon a new page opens and ask you to put in your SteamID, API-Key, select
currency and if you want to activate some features. You don't need more at this step.

# Known Bugs

- Buttons in your Inventory will only show up if you change the URL and reload (URL has to be specific appid)
- some Scripts like getting your Community-Badge or iterating over Discovery-Queue can break due to wrong URL after logout (you will have to set your skips [if needed] then again and restart the process until the action completely finishes)
- Edits on the Frontend-Grids for your Databases doesn't apply changes
- You need an API to use the Booster-Calculator which I don't want to provide currently due to to much to be expected load and also because the server has to be set up to limit requests
- there is more stuff to be fixed for sure

[logo]: https://raw.githubusercontent.com/Pandiora/SteamAccountRoboticAssistant/master/images/icon-48x48.png "SteamAccountRoboticAssistant"
