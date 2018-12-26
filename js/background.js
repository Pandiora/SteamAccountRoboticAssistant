// CONFIG
/////////////////
// Set up worker
var worker = new Worker('js/webworkers.js');

// Get actual inventory-link and store it into variable
var inventoryLink; (async()=>{ inventoryLink = await stm.getInventory()})();

// MAIN
/////////////////

// Trigger events when Extension is installed
browser.runtime.onInstalled.addListener((details) => {

  // Set up alarms / cronjob-like tasks
  // ToDo: Alarm has to be set over 60s on release
  //browser.alarms.create('booster-json',  { delayInMinutes: 0.02, periodInMinutes: 15.00 });
  //browser.alarms.create('owned-games',   { delayInMinutes: 0.04, periodInMinutes: 60.00 });
  browser.alarms.create('pending-trades',{ delayInMinutes: 15.06, periodInMinutes:  15.06 });
  // the higher delay is needed due to stalled connections
  browser.alarms.create('notific-trades',{ delayInMinutes: 15.10, periodInMinutes: 15.10 });

  // Check for Alarms/Cronjobs
  browser.alarms.onAlarm.addListener(function(alarm){
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


browser.runtime.onMessage.addListener((msg,snd,sendResponse)=>{

  // Debug
  // console.log('bg-page msg-listener was called');

  // We wanna login with smurf-Account and have to delete all cookies, except
  // Session-Cookie and Master-steamMachine-Cookie to avoid an Error when
  // Header-Size gets to big, because browser.is saving _all_ steamMachine-Cookies
  // of all your Steam-Accounts / we´re saving new cookies on every login-attempt
  // also don´t delete Cookies related to your age/birth so you don´t have to confirm
  // the age-check over and over again
  ///////////////////////////////////////////////////////////////////////////////////

  if(msg.target && msg.target[0] == 'webworker'){

    bg.startWebworker(snd, msg);
    return false;

  } else if(msg.process.substr(-3) === "Bit"){

    return bg.setActionBits(msg);

  } else if(msg.process.substr(-4) === "Skip"){

    return bg.setSkipForDb(snd, msg, sendResponse);

  } else if(msg.process === 'getNamesForLogin'){

    return bg.getNamesForLogin(sendResponse);

  } else if(msg.process === 'loginUser'){

    return bg.loginUser(snd, msg);

  } else if(msg.process == 'processConfirmation'){

    processConfirmation(msg.parameters[0], msg.parameters[1]);
    return true;

  } else if(msg.process == 'reloadNotifications'){

    getNotificationsTrades();
    return false;

  } else if(msg.process == 'sendActiveInventory'){

    return trn("background_item_was_accepted");

  } else if(msg.process == 'getItemMarketPrices'){

    // ToDo: Update functions
    getItemMarketPrices(snd, msg, sendResponse);
    return true;

  } else if(msg.process == 'createMarketListingOrders'){

    // ToDo: Update functions
    createMarketListing(snd, msg);
    // must return false or we get port errors
    return true;

  } else if(msg.process == 'gimmeMasterSteamID'){

    return bg.getMasterSteamId();

  } else if(msg.process == "sendAllCardsToBot"){ 

    // ToDo: alter to use process
    sendAllCardsToBot(snd, msg.ast_ids,msg.cur_user, msg.ssid);
    return true;

  } else {
    // This Listener don´t know what to do with this msg
    console.log(trn("background_missing_listener_function"), msg);
    return false;
  }
});

browser.browserAction.onClicked.addListener(function(tab){
  browser.tabs.create({
    url: browser.extension.getURL('index.html')
  });
});
// pinned style

/*browser.tabs.create({
  url: browser.extension.getURL('index.html')
  ,
  pinned: true
});*/

//
