// Imports

// CONFIG
/////////////////
// Set up worker
var worker = new Worker('js/webworkers.js');
// Bits for automated Stuff
var        community_badge =  0,
           stop_disc_queue =  0,
              stop_sticker =  0,
   license_bulk_activation =  0,
        license_bulk_appid = '',
    stop_get_market_prices =  0,
        stop_listing_items =  0,
      stop_auto_nomination =  0,
     auto_nomination_appid =  0,
     stop_minigame_token   =  0;

// Get actual inventory-link and store it into variable
var inventoryLink; (async()=>{ inventoryLink = await stm.getInventory()})();

// MAIN
/////////////////

// Trigger events when Extension is installed
chrome.runtime.onInstalled.addListener((details) => {

  // Set up alarms / cronjob-like tasks
  // ToDo: Alarm has to be set over 60s on release
  //chrome.alarms.create('booster-json',  { delayInMinutes: 0.02, periodInMinutes: 15.00 });
  //chrome.alarms.create('owned-games',   { delayInMinutes: 0.04, periodInMinutes: 60.00 });
  chrome.alarms.create('pending-trades',{ delayInMinutes: 15.06, periodInMinutes:  15.06 });
  // the higher delay is needed due to stalled connections
  chrome.alarms.create('notific-trades',{ delayInMinutes: 15.10, periodInMinutes: 15.10 });

  // Check for Alarms/Cronjobs
  chrome.alarms.onAlarm.addListener(function(alarm){
    //if(alarm.name == 'booster-json')  { getBoosterJSON();         } else
    //if(alarm.name == 'owned-games')   { getGameJSON();            } else
    if(alarm.name == 'notific-trades'){ getNotificationsTrades(); } else
    if(alarm.name == 'pending-trades'){
      idb.getMasterRecord().done(function(master){
        getTradeOffers(master['steam_id']);
      });
    } else { console.log('Task for this alarm isn´t set.'); }
  });

});


chrome.runtime.onMessage.addListener((msg,snd,sendResponse)=>{

  // Debug
  // console.log('bg-page msg-listener was called');

  // We wanna login with smurf-Account and have to delete all cookies, except
  // Session-Cookie and Master-steamMachine-Cookie to avoid an Error when
  // Header-Size gets to big, because chrome is saving _all_ steamMachine-Cookies
  // of all your Steam-Accounts / we´re saving new cookies on every login-attempt
  // also don´t delete Cookies related to your age/birth so you don´t have to confirm
  // the age-check over and over again
  ///////////////////////////////////////////////////////////////////////////////////

  if(msg.target && msg.target[0] == 'webworker'){
    console.log(msg);
    bg.startWebworker(snd, msg);
    return true;

  } else if(msg.process && msg.process.substr(-3) === "Bit"){

    bg.setActionBits(msg, sendResponse);
    return false;

  } else if(msg.process && msg.process.substr(-4) === "Skip"){

    bg.setSkipForDb(snd, msg, sendResponse);
    return true;

  } else if(msg.process && msg.process === 'getNamesForLogin'){

    bg.getNamesForLogin(sendResponse);
    return true;

  } else if(msg.process && msg.process === 'loginUser'){

    bg.loginUser(snd, msg, sendResponse);
    return true;

  } else if(msg.process && msg.process == 'acceptConfirmation'){

    processConfirmation('allow', msg.items);
    return true;

  } else if(msg.process && msg.process == 'declineConfirmation'){

    processConfirmation('cancel', msg.items);
    return true;

  } else if(msg.process && msg.process == 'sendActiveInventory'){

    sendResponse(trn("background_item_was_accepted"));
    return false;

  } else if(msg.process && msg.process == 'getItemMarketPrices'){

    // ToDo: Update functions
    getItemMarketPrices(snd, msg, sendResponse);
    return true;

  } else if(msg.process && msg.process == 'createMarketListingOrders'){

    // ToDo: Update functions
    createMarketListing(snd, msg);
    // must return false or we get port errors
    return true;

  } else if(msg.process && msg.process == 'gimmeMasterSteamID'){

    idb.getMasterRecord().then(function(user){
      sendResponse(user.steam_id);
    });
    return true;

  } else if(msg.process && msg.process == "sendAllCardsToBot"){ 

    // ToDo: alter to use process
    sendAllCardsToBot(snd, msg.ast_ids,msg.cur_user, msg.ssid);
    return true;

  } else if(msg.process && msg.process == 'stopListingMarketItems'){

    // ToDo: implement this one elsewhere
    stop_listing_items = 1;
    return false;

  } else if(msg.process && msg.process == 'stopGetMarketPrices'){

    // ToDo: implement this one elsewhere    
    stop_get_market_prices = 1;
    return false;

  } else {
    // This Listener don´t know what to do with this msg
    console.log(trn("background_missing_listener_function"), msg);
    return false;
  }
  // shut up - https://github.com/mozilla/webextension-polyfill/issues/130  
  return true;
});

chrome.browserAction.onClicked.addListener(function(tab){
  chrome.tabs.create({
    url: chrome.extension.getURL('index.html')
  });
});
// pinned style

/*chrome.tabs.create({
  url: chrome.extension.getURL('index.html')
  ,
  pinned: true
});*/

//
