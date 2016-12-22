// CONFIG
/////////////////
// Set up worker
var worker = new Worker('js/webworkers.js');
// Bits for automated Stuff
var         community_badge =  0;
var         stop_disc_queue =  0;
var license_bulk_activation =  0;
var      license_bulk_appid = '';
var  stop_get_market_prices =  0;
var      stop_listing_items =  0;

// Get actual inventory-link and store it into variable
var inventoryLink; getInventoryLink();

// MAIN
/////////////////

// Trigger events when Extension is installed
chrome.runtime.onInstalled.addListener(function(details){

  // Set up alarms / cronjob-like tasks
  // ToDo: Alarm has to be set over 60s on release
  chrome.alarms.create('booster-json',  { delayInMinutes: 0.02, periodInMinutes: 15.00 });
  chrome.alarms.create('owned-games',   { delayInMinutes: 0.04, periodInMinutes: 60.00 });
  chrome.alarms.create('pending-trades',{ delayInMinutes: 0.06, periodInMinutes:  5.06 });
  // the higher delay is needed due to stalled connections
  chrome.alarms.create('notific-trades',{ delayInMinutes: 0.25, periodInMinutes:  5.25 });

  // Check for Alarms/Cronjobs
  chrome.alarms.onAlarm.addListener(function(alarm){
    if(alarm.name == 'booster-json')  { getBoosterJSON();         } else
    if(alarm.name == 'owned-games')   { getGameJSON();            } else
    if(alarm.name == 'notific-trades'){ getNotificationsTrades(); } else
    if(alarm.name == 'pending-trades'){
      idb.getMasterRecord().done(function(masterSteamID){
        getTradeOffers(masterSteamID['steam_id']);
      });
    } else { console.log('Task for this alarm isn´t set.'); }
  });

});

// Retrieve json-data for booster-packs every 15 minutes
function getBoosterJSON(){
  chrome.storage.sync.get(['json_host'], function(obj){
    $.get(obj['json_host']+'?ver='+new Date().getTime(), function(response){
      var data = JSON.stringify(response);
      chrome.storage.local.set({'booster_data':data}, function (result) {
        console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Booster-Data', '', 'background: silver; color: green; border-radius: 10%', '');
      });
    });
  });
}

// Retrieve data of owned games every 60 minutes
function getGameJSON(){
  idb.getMasterRecord().done(function(user){
    $.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key='+user['apikey']+'&steamid='+user['steam_id']+'&format=json',function(appids){
      // Put all appids of owned games into an array
      var appid_index = [];
      $(appids.response['games']).each(function(index){ appid_index.push(JSON.stringify(appids.response['games'][index].appid)); });

      // And store array in local database
      chrome.storage.local.set({'appids': appid_index}, function (result) {
        console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Appid-Data', '', 'background: silver; color: green; border-radius: 10%', '');
      });
    });
  });
}

var bulk_gid = '';
function addGameGiftDB(username, sid, appid, gamename, created){
  idb.opendb().then(function(db){
      db.transaction('rw', 'users_games', function(){
        db.users_games.add({
          username: username,
          steam_id: sid,
          app_id: appid,
          game_name: gamename,
          created: created
        });
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
  });
}

function processBulkGifts(arr, sender){

  idb.getMasterRecord().done(function(master){

    // Determine how long we need to iterate prioritized by users who don't own this game already
    var cnt = ((arr.user.length - arr.idarr.length) <= 0 ? arr.user.length : arr.idarr.length);
    var giftSessionID = '';

    // We need a delayed loop to not spam the steam-servers
    ///////////////////////////////////////////////////////////
    (function next(counter, maxLoops) {

      // Last Run defined here
      // Update progressbar one last time and close the dialog
      // after timeout (defined at frontend)
      //////////////////////////////////////////////////////////

      if (counter++ >= maxLoops){
        setTimeout(function(){
          chrome.tabs.sendMessage(sender,{
            msg: 'UpdateProgress',
            percentage: 100,
            message: chrome.i18n.getMessage("background_progress_gifts")+' ('+maxLoops+'/'+maxLoops+')'
          });
        }, 100);
        return;
      }

      // Update the progressbar at frontend
      /////////////////////////////////////////////////////////

      chrome.tabs.sendMessage(sender,{
        msg: 'UpdateProgress',
        percentage: ((99/maxLoops)*counter),
        message: chrome.i18n.getMessage("background_progress_gifts")+' ('+counter+'/'+maxLoops+')'
      });

      // Send the gift to bot
      // ----------------------------------------------------------------
      // Conversion of SteamID64 to SteamID3 for GifteeAccountID included
      // MySQL-like generation of Datetime included (toISOString)
      // Finally send the gift, check for success-codes to determine if
      // the gift was send succesfully and if so, add an entry to the db
      // for the current user and every game which is included in gift
      ///////////////////////////////////////////////////////////////////
      
      if(master['steam_id'] !== arr.user[counter-1].steam_id){

        // we need to declare the gid outside of this function
        // so we can use it in our webrequest-listener
        bulk_gid = arr.idarr[counter-1];
        chrome.webRequest.onBeforeSendHeaders.addListener(modGiftBulkHeaders, {urls: [ "https://store.steampowered.com/checkout/sendgiftsubmit/*" ]},['requestHeaders','blocking']);

        $.ajax({
          type: 'POST',
          url: 'https://store.steampowered.com/checkout/sendgift/'+arr.idarr[counter-1],
          success: function(res){

            $.ajax({
              type: 'POST',
              url: 'https://store.steampowered.com/checkout/sendgiftsubmit/',
              data: {
                'GifteeAccountID': (arr.user[counter-1].steam_id.substring(3) - 61197960265728),
                'GifteeEmail': '',
                'GifteeName': arr.user[counter-1].username,
                'GiftMessage': 'Gift-Bulk '+arr.idarr[counter-1],
                'GiftSentiment': 'XOXOXO',
                'GiftSignature': 'Master',
                'ScheduledSendOnDate': 0,
                'GiftGID': arr.idarr[counter-1],
                'SessionID': /g_sessionID\s=\s\"(.*)\";/g.exec(res)[1]
              },
              success: function(msg){

                if(msg.success == 1){

                  // If the gift was send succesfully, add entry/s to db
                  //////////////////////////////////////////////////////
                  for(i=0;i<arr.appid.length;i++){
                    addGameGiftDB(arr.user[counter-1].username, arr.user[counter-1].steam_id, arr.appid[i], arr.title[i], (new Date().toISOString().slice(0, 19).replace('T', ' ')));
                  }

                } else if(msg.success == 42){
                  console.log(chrome.i18n.getMessage("background_bulk_gift_error1"));
                } else if(msg.success == 15){
                  console.log(chrome.i18n.getMessage("background_bulk_gift_error2"));
                } else if(msg.success == 8){
                  console.log(chrome.i18n.getMessage("background_bulk_gift_error3"));
                }

              },
              error: function(err){
                console.log('Error: '+err);

                // Start next iteration
                setTimeout(function(){ next(counter, maxLoops) }, 1000);

              }
            }).done(function(){

              // Remove the Listener for this specific AJAX-Request
              chrome.webRequest.onBeforeRequest.removeListener(modGiftBulkHeaders);

              // Start next iteration
              setTimeout(function(){ next(counter, maxLoops) }, 1000);

            });
          }
        });
      } else {
        // Start next iteration if master tries to gift himself
        setTimeout(function(){ next(counter, maxLoops) }, 1000);
      }
    })(0, cnt);
  });
}

function getInventoryLink(){

  // some requests need the correct inventory-link and since we're modifying
  // the headers for market-listing steam would throw an error if we won't set
  // the right origin-url

  $.ajax({
    url: 'https://steamcommunity.com/my/inventory/',
    success: function(data){
      inventoryLink = $($(data).find('.playerAvatar + a')[0]).attr('href');
    },
    error: function(){

      // ensure the variable is set - selling single items will display an error but succeed
      inventoryLink = 'https://steamcommunity.com';

    }
  });
}

function sendCsgoCardsBulk(sender, users, cards, sessionid){

  // Classids of CS:GO-Cards
  var Anarchist = 149757868,
         Balkan = 149748025,
           Swat = 149750036,
            Fbi = 149754772,
            Idf = 149750877;

  // Get the minimum tradeable cards
  var min = cmin = Math.min.apply(Math,
    [
      cards[Anarchist].length,
      cards[Balkan].length,
      cards[Fbi].length,
      cards[Idf].length,
      cards[Swat].length
    ]
  );

  // Declare one counter for iterations and one for inside-loop
  var cnt = 0, ccnt = 0;

  //console.log(users.length+' Users which need more levels');

  // Calc the max iterations based on number of CS:GO-Cards
  // We assume 1 of each card (5 cards) for one badge-level
  //console.log('Min: '+min);
  for(var i=0;0<min;i++){
    //console.log('cnt: '+cnt+' i: '+i);
    // If we have more CS:GO-Cards then accounts which
    // need a specific amount of cards we have to exit the loop earlier
    if(i in users){
      // Even if we can't send cards for 5 levels/badges
      // send the rest of the cards to the bot to craft 1-4 badges
      if(min<parseInt(8-(users[i].level+(2-users[i].com)+users[i].csgo+1)) && min > 0){
        i++;
      }
      min = min-parseInt(8-(users[i].level+(2-users[i].com)+users[i].csgo+1));
      cnt = i+1;
    } else {
      break;
    }
  }

  // In case the available amount and the needed amount = 0, set min to user-count
  min = min == 0 ? users.length : min;

  // Calc the max iterations based on users which need cards
  // and the number of tradeable CS:GO-Cards
  cnt = Math.min.apply(Math,[users.length,min]);
  //console.log(cnt+' maximum iterations');

  // We need a delayed loop to not spam the steam-servers
  ///////////////////////////////////////////////////////////
  (function next(counter, maxLoops){

    // Last Run defined here
    // Update progressbar one last time and close the dialog
    // after timeout (defined at frontend)
    //////////////////////////////////////////////////////////
    if (counter++ >= maxLoops){
      // Finally start to confirm cards
      processMarketListings();

      // Tell frontend we're done
      setTimeout(function(){
        chrome.tabs.sendMessage(sender,{
          msg: 'UpdateProgress',
          percentage: 100,
          message: chrome.i18n.getMessage("background_progress_csgo_cards_finished")
        });
      }, 100);
      return;
    }

    // Update the progressbar at frontend
    chrome.tabs.sendMessage(sender,{
      msg: 'UpdateProgress',
      percentage: ((99/maxLoops)*counter),
      message: chrome.i18n.getMessage("background_progress_csgo_cards_sending")+' ('+counter+'/'+maxLoops+')'
    });

    // Get the right amount of cards we need or which are left
    var cdata = [];
    var len = Math.min.apply(Math,[(cmin-ccnt),parseInt(8-(users[counter-1].level+(2-users[counter-1].com)+users[counter-1].csgo+1))]);
    //console.log('Name: '+users[counter-1].loginname+' Level: '+users[counter-1].level+' Community: '+users[counter-1].com+' CSGO: '+users[counter-1].csgo+' User gets '+(len*5)+' cards');
    for(var i=0;i<len;i++){
      cdata.push(cards[Anarchist][ccnt],cards[Balkan][ccnt],cards[Fbi][ccnt],cards[Idf][ccnt],cards[Swat][ccnt]);
      ccnt = ccnt+1;
    }

    // Prepare the important json-part related to tradeoffer-id's
    var json = {
      "newversion": true,
      "version": 4,
      "me": { "assets": [],"currency": [],"ready": false },
      "them": { "assets": [],"currency": [],"ready": false }
    };

    // Generate JSON for all cards
    for(var i=0;i<cdata.length;i++){
      json['me']['assets'].push({
        "appid": 753,
        "contextid": "6",
        "amount": 1,
        "assetid": cdata[i]
      });
    }

    // Finally send our trade
    $.ajax({
      url: 'https://steamcommunity.com/tradeoffer/new/send',
      type: 'POST',
      data: {
        'sessionid': sessionid,
        'serverid': '1',
        'partner': users[counter-1].steamid,
        'tradeoffermessage': '',
        'json_tradeoffer': JSON.stringify(json),
        'captcha': '',
        'trade_offer_create_params': {}
      },
      success: function(data){
        if (data.hasOwnProperty('tradeofferid')) {
          // Debug
          console.log(counter+'. User: '+users[counter-1].loginname+'\nLevel: '+users[counter-1].level+'\nCSGO-Level: '+users[counter].csgo+'\nCards send: '+cdata.length);
          // Set user in DB to csgo-level 5 to avoid sending cards again
          idb.opendb().then(function(db){
            db.transaction("rw", db.steam_users, function () {
              db.steam_users.where("login_name").equals(users[counter-1].loginname).modify({csgo: 5});
            }).then(function(){
              // alright, start next iteration
              setTimeout(function(){ next(counter, maxLoops) }, 10000);
            }).catch(function(err){
              console.log(err);
            });
          });
        } else {
          console.log(data);
        }
      }
    });
  })(0, cnt);
}


function processMarketListings(){
  // Only execute if the user set this ON in settings
  var value = 'confirmation';
  chrome.storage.sync.get([value], function(obj){
    if(obj[value] !== undefined){
      if(obj[value] === true){
         // first get the list of items which need to be confirmed
        getNotificationsTrades();
        // currently we have no callback - so just use a dirty timeout
        setTimeout(function(){
          // get array of confirmations and execute confirmations
          chrome.storage.local.get('notifications-trades', function(result){
            var result = $.parseHTML(result['notifications-trades']);
            var items = [];
            for(var i=0;i<result.length;i++){
              if($(result[i]).html() !== undefined){
                if($(result[i]).hasClass('noti-market')){
                  items.push({
                    cid: $(result[i]).data('confid'), 
                    ck: $(result[i]).data('key')
                  });
                }
              }
            }
            // finally confirm every item
            processConfirmation('allow', items);
          });
        }, 15000);       
      }
    }
  });
}

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){

  // Debug
  // console.log('bg-page message-listener was called');

  // We wanna login with smurf-Account and have to delete all cookies, except
  // Session-Cookie and Master-steamMachine-Cookie to avoid an Error when
  // Header-Size gets to big, because chrome is saving _all_ steamMachine-Cookies
  // of all your Steam-Accounts / we´re saving new cookies on every login-attempt
  // also don´t delete Cookies related to your age/birth so you don´t have to confirm
  // the age-check over and over again
  ///////////////////////////////////////////////////////////////////////////////////

  if(message.greeting == 'deleteCookies'){

    // Save Cookies to Database
    chrome.cookies.getAll({url: sender.tab.url},function (cookies){
      // Read Data for Master from IDB
      idb.opendb().then(function(db){
        // We need to wrap all database-stuff in a transaction
        db.transaction('rw', db.steam_users, function(){
          // We need to know the MasterID so we won´t delete his Cookie
          db.steam_users.where('type').equals('Master').first(function(master){

            // Iterate all existing cookies and save their values
            for(var i=0; i<cookies.length;i++) {

              // Update steamMachine-Cookies for every account
              if(cookies[i].name.indexOf('steamMachineAuth') >= 0){

                var curcookiesteamid = cookies[i].name.replace('steamMachineAuth', '');
                var curcookievalue = cookies[i].value;

                // Update Cookies based on steamid
                db.steam_users
                .where('steam_id')
                .equals(curcookiesteamid)
                .modify({steamMachine: curcookievalue});

                console.log('SteamID64: '+curcookiesteamid+'\nSteamMachineAuth: '+cookies[i].name+'\nMessage: '+message);
              }

              // Don´t remove master-cookie, and Cookies related to age-check
              // Additionally don´t remove steamLogin-Cookies when getting logged out due
              // to a purchase and by deleting them we would quit the redirect for the purchase otherwise
              if(['steamMachineAuth'+master['steam_id'],'sessionid','lastagecheckage','birthtime','steamLoginSecure','steamLogin', 'stopme'].indexOf(cookies) == -1){
                chrome.cookies.remove({url: sender.tab.url + cookies[i].path, name: cookies[i].name});
                console.log(chrome.i18n.getMessage("login_msg_cookies_deleted_short")+cookies[i].name);
              }
            }
          });
        }).then(function(){
          sendResponse({farewell: chrome.i18n.getMessage("login_msg_cookies_deleted")});
        }).catch(function(err) {
          console.log(err);
        }).finally(function(){
          db.close();
        });
      });
    });
    // important - otherwise sendResponse throws an error
    return true;
  } else if(message.greeting.indexOf('steamMachineAuth') >= 0){

    var steamMachine = message.greeting.toString().split(';')[0];
    var steamMachine_value = message.greeting.toString().split(';')[1];

    chrome.cookies.set({
      url: sender.tab.url,
      name: steamMachine,
      value: steamMachine_value,
      path: '/',
      secure: true,
      httpOnly: true,
      expirationDate: (new Date().getTime()/1000) + 1000000000
    });

    //Debug cookies not being set
    //console.log('Cookie has been set. Name: '+steamMachine+' Value: '+steamMachine_value);

    sendResponse({farewell: chrome.i18n.getMessage("login_msg_cookie_exists")});
    // important - otherwise sendResponse throws an error
    return false;

  } else if(message.greeting == 'getNamesForLogin'){

    var names = [];
    idb.opendb().then(function(db){
      // wrap into transaction for better error-handling
      db.transaction("r", db.steam_users, function(){
        db.steam_users.where('skip').equals(0).each(function(name){
          names.push(name['login_name']);
        });
      }).then(function(){
        sendResponse({names});
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        // stop blocking the database
        db.close();
      });
    });
    // important - otherwise sendResponse throws an error
    return true;

  } else if(message.greeting.indexOf('getUserDataFor') >= 0){

    var username = message.greeting;
    username = username.replace('getUserDataFor', ''); // replace to get the username
    var userdata = [];

    idb.opendb().then(function(db){
      db.steam_users.where('login_name').equals(username).first(function(user){
        // just return an array with all needed data
        userdata.push({
          steamid: user['steam_id'],
          steamMachine: user['steamMachine'],
          pw: user['login_pw'],
          secret: user['shared_secret']
        });
      }).then(function(){
          sendResponse(userdata);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        // stop blocking the database
        db.close();
      });
    });
    // important - otherwise sendResponse throws an error
    return true;
  } else if(message.greeting == 'acceptConfirmation'){

    processConfirmation('allow', message.items);
    return true;

  } else if(message.greeting == 'declineConfirmation'){

    processConfirmation('cancel', message.items);
    return true;

  } else if(message.greeting == 'sendActiveInventory'){

    sendResponse(chrome.i18n.getMessage("background_item_was_accepted"));
    return false;

  } else if(message.greeting == 'getDataOfOwnedGames'){

    worker.postMessage('getBotGames');
    worker.onmessage = function(e){
      var data = e.data;
      if(data.msg == 'OwnedGamesDone'){
        worker = new Worker('js/webworkers.js');
        sendResponse('done');
      } else if(data.msg == 'UpdateProgress'){
        chrome.windows.getAll({populate:true},function(windows){
          windows.forEach(function(window){
            window.tabs.forEach(function(tab){
              if(tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0){
                chrome.tabs.sendMessage(tab.id,{
                  greeting: "update-progress",
                  percent: data.percentage,
                  message: data.message
                }, function(response){
                  //console.log();
                });
              }
            });
          });
        });
      }
    }
    return true;

  } else if(message.greeting == 'getDataOfOwnedBadges'){

    worker.postMessage('getBotBadges');
    worker.onmessage = function(e){
      var data = e.data;
      if(data.msg == 'OwnedBadgesDone'){
        worker = new Worker('js/webworkers.js');
        sendResponse('done');
      } else if(data.msg == 'UpdateProgress'){
        chrome.windows.getAll({populate:true},function(windows){
          windows.forEach(function(window){
            window.tabs.forEach(function(tab){
              if(tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0){
                chrome.tabs.sendMessage(tab.id,{
                  greeting: "update-progress",
                  percent: data.percentage,
                  message: data.message
                }, function(response){
                  //console.log();
                });
              }
            });
          });
        });
      }
    }
    return true;

  } else if(message.greeting == 'sendGiftsBulk'){

    // Dexie has problems with searching by numbers which could be a string or plane number
    // this problem only occurs on non-subs (packages)
    // We just save the appid as number and string to the appid-array and avoid further problems this way
    var appidorigin = message.gifts.appid;

    if(appidorigin.length > 0){

      var appidhelper = appidorigin.map(Number);
      appidhelper.push(...appidorigin);

      // Create new Array holding all needed data
      var u = [], summary = [];
      summary = {
        user: [],
        appid: appidhelper,
        idarr: message.gifts.idarr,
        title: message.gifts.title,
        link: message.gifts.link,
        sid: message.gifts.sid
      };

      idb.opendb().then(function(db){
        db.transaction('rw', ['steam_users', 'users_games'], function(){
          db.users_games.where('app_id').anyOf(summary.appid).each(f => {
            // Only add a user one time to this array if he owns 1 of the game/s
            // This prevents us from sending subs including one of the games
            if(u.indexOf(f.steam_id) === -1) u.push(f.steam_id);
          }).then(function(){
            // Now only add users which does not own the game/s to our summary
            db.steam_users.where('steam_id').noneOf(u).each(j => {
              summary.user.push({steam_id: j.steam_id, username: j.username});
            });
          });
        }).then(function(){

          // We have all the data we need - start processing
          sendResponse(chrome.i18n.getMessage("background_start_sending_gifts_msg"));

          // Only send gifts if bots does not already own it
          if(summary.user.length <= 0){
            chrome.tabs.sendMessage(sender.tab.id,{
              msg: 'UpdateProgress',
              percentage: 100,
              message: chrome.i18n.getMessage("background_gifts_bulk_already_owned")
            });
          } else {
            processBulkGifts(summary, sender.tab.id);
          }

        }).catch(function(err){
          console.log(err);
        }).finally(function(){
          db.close();
        });
      });

    } else {
      chrome.tabs.sendMessage(sender.tab.id,{
        msg: 'UpdateProgress',
        percentage: 100,
        message: chrome.i18n.getMessage("background_gifts_bulk_appids_wrong")
      });
    }
    return true;

  } else if(message.greeting == 'sendCsgoCardsBulk'){

    var users = [];

    idb.opendb().then(function(db){
      db.transaction('r', 'steam_users', function(){
        db.steam_users.each(f => {
          if(f.csgo < 5 && f.level < 8 && f.purchased == 1)
          users.push({
            'steamid': f.steam_id,
            'loginname': f.login_name,
            'level': f.level,
            'csgo': f.csgo,
            'com': f.community
          });
        });
      }).then(function(){
        // Make sure there are bots which need the CS:GO-Badge
        if(users.length > 0){
          sendCsgoCardsBulk(sender.tab.id, users, message.cards, message.sessionid);
        } else {
          chrome.tabs.sendMessage(sender.tab.id,{
            msg: 'UpdateProgress',
            percentage: 100,
            message: chrome.i18n.getMessage("background_csgo_bulk_already_badge")
          });
        }
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });
    return true;

  } else if(message.greeting == 'getItemMarketPrices'){

    stop_get_market_prices = 0;
    var cards = message.cards;
    // we need this array based on cards-Array to concatenate same items by classid
    var cardsObj = [];
    // cardsArr will just help at finding the right positions in cardsObj
    var cardsArr = [];

    for(i=0;i<cards.length;i++){
      if(cards[i].classid in cardsObj){
        // assetid already exists, just count up the amount
        cardsObj[[cards[i].classid]].amount += 1;
      } else {
        // add new entry to array
        cardsObj[[cards[i].classid]] = {
          'appid': cards[i].appid,
          'hash': cards[i].market_hash_name,
          'classid': cards[i].classid,
          'amount': 1
        };
        // Use an array as helper to determine Object-Positions and length
        cardsArr.push(cards[i].classid);
      }
    }

    // Since we're using it heavily put it into a function
    // Remove objects with no price from array
    function removeClassID(classid){
      for(var i = cards.length; i--;){
        if(cards[i].classid === classid)
        cards.splice(i, 1);
      }
    }

    (function next(counter, maxLoops) {
      // all cards should be iterated now, return cards-array to front-page
      if(counter++ >= maxLoops){
        sendResponse({
          success: true,
          cards: cards
        });
        return;
      }
      // user stopped the process
      if(stop_get_market_prices == 0){

        var rcnt = 0; // retry-counter
        function processAjax(){
          rcnt++;
          if(rcnt <= 5){

            // Get Page for specific item and extract the nameid from it
            var a = 'http://steamcommunity.com/market/listings/';
            var b = cardsObj[[cardsArr[counter-1]]].appid+'/';
            var c = encodeURIComponent(cardsObj[[cardsArr[counter-1]]].hash);

            // Retrieve Market-Price
            $.ajax({
              url: a+b+c,
              success: function(data){

                var nameid = $(data).find('#market_buy_commodity_popup + script:eq(0)')[0].innerHTML;
                nameid = /Market_LoadOrderSpread\(\s(\d*)\s\)\;/.exec(nameid);

                if(nameid !== null){
                  // Construct URL and get lowest_sell_order by nameid
                  var d = 'http://steamcommunity.com/market/itemordershistogram';
                  var e = '?country='+message.country;
                  var f = '&language='+message.language;
                  var g = '&currency='+message.eCurrency;
                  var h = '&item_nameid='+nameid[1]+'&two_factor=0';

                  var scnt = 0; // retry-counter
                  function processAjaxNameID(){
                    scnt++;
                    if(scnt <= 5){
                      $.ajax({
                        url: d+e+f+g+h,
                        success: function(dat){
                          if(dat.success == true){
                            if(dat.lowest_sell_order !== null){

                              var price = dat.lowest_sell_order/100;

                              // Update the progressbar at frontend
                              chrome.tabs.sendMessage(sender.tab.id,{
                                msg: 'UpdateProgress',
                                percentage: ((99/maxLoops)*counter),
                                price_add: price,
                                amount: cardsObj[[cardsArr[counter-1]]].amount
                              });

                              // Update Array
                              for(i=0;i<cards.length;i++){
                                if(cards[i].classid === cardsObj[[cardsArr[counter-1]]].classid)
                                cards[i].price = price;
                              }

                              // Reset both retry-counter
                              rcnt = 0, scnt = 0;

                              // Start next iteration
                              setTimeout(function(){ next(counter, maxLoops) }, 10);

                            } else {

                              // Our last chance to get the price
                              var uri = 'http://steamcommunity.com/market/priceoverview/';
                              var i = '?country='+message.country;
                              var j = '&currency='+message.eCurrency;
                              var k = '&appid='+cardsObj[[cardsArr[counter-1]]].appid;
                              var l = '&market_hash_name='+encodeURIComponent(cardsObj[[cardsArr[counter-1]]].hash);

                              $.ajax({
                                url: uri+i+j+k+l, 
                                success: function(dathash){
                                  if(dathash.success){
                                    if(dathash.lowest_price !== null){

                                      // Convert to number but leave the decimals there
                                      dathash = dathash.lowest_price.replace(/[^0-9\.\,]+/g,"").replace(',','.');

                                      // Update the progressbar at frontend
                                      chrome.tabs.sendMessage(sender.tab.id,{
                                        msg: 'UpdateProgress',
                                        percentage: ((99/maxLoops)*counter),
                                        price_add: price,
                                        amount: cardsObj[[cardsArr[counter-1]]].amount
                                      });

                                      // Update Array
                                      for(i=0;i<cards.length;i++){
                                        if(cards[i].classid === cardsObj[[cardsArr[counter-1]]].classid)
                                        cards[i].price = price;
                                      }

                                      // Reset both retry-counter
                                      rcnt = 0, scnt = 0;

                                      // Start next iteration
                                      // we need to be careful so we have to set this timeout much higher
                                      setTimeout(function(){ next(counter, maxLoops) }, 5000);

                                    } else {
                                      // remove from array, since price is null
                                      removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                                      // Start next iteration
                                      // we need to be careful so we have to set this timeout much higher
                                      setTimeout(function(){ next(counter, maxLoops) }, 5000);
                                    }
                                  } else {
                                    // remove from array, since price is null
                                    removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                                    // Start next iteration
                                    // we need to be careful so we have to set this timeout much higher
                                    setTimeout(function(){ next(counter, maxLoops) }, 5000);
                                  }
                                },
                                error: function(xhr, textStatus, errorThrown){
                                  if(xhr.status == 503 || xhr.status == 502){
                                    // Sometimes Steam-Servers are temporarily unavailable - execute retries
                                    console.log(chrome.i18n.getMessage("background_error_steam_not_available")+xhr.status);
                                    setTimeout(function(){ processAjaxNameID(); }, scnt*5000);
                                  } else if(xhr.status == 429){
                                    // process needs to get aborted / Rate-Limit reached!
                                    stop_get_market_prices = 1;
                                    // remove from array
                                    removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                                    // too many attempts
                                    console.log(chrome.i18n.getMessage("background_error_too_many_attempts")+xhr.status);
                                    setTimeout(function(){ next(counter, maxLoops) }, 1000);
                                  } else if(xhr.status == 401){
                                    // process needs to get aborted -> user not logged in
                                    stop_get_market_prices = 1;
                                    console.log(chrome.i18n.getMessage("background_error_not_logged_in")+xhr.status);
                                    setTimeout(function(){ next(counter, maxLoops) }, 1000);
                                  }  else {
                                    // aaand remove from array too
                                    removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                                    // In case other errors occur just start next iteration
                                    console.log(chrome.i18n.getMessage("background_error_steam_server")+xhr.status);
                                    setTimeout(function(){ next(counter, maxLoops) }, 1000);
                                  }
                                }
                              });
                            }
                          } else {
                            // Yeah very funny Valve ... start process again
                            setTimeout(function(){ processAjaxNameID(); }, 1000);
                          }
                        },
                        error: function(xhr, textStatus, errorThrown) {
                          if(xhr.status == 503 || xhr.status == 502){
                            // Sometimes Steam-Servers are temporarily unavailable - execute retries
                            console.log(chrome.i18n.getMessage("background_error_steam_not_available")+xhr.status);
                            setTimeout(function(){ processAjaxNameID(); }, scnt*5000);
                          } else if(xhr.status == 429){
                            // process needs to get aborted / Rate-Limit reached!
                            stop_get_market_prices = 1;
                            // remove from array
                            removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                            // too many attempts
                            console.log(chrome.i18n.getMessage("background_error_too_many_attempts")+xhr.status);
                            setTimeout(function(){ next(counter, maxLoops) }, 1000);
                          } else if(xhr.status == 401){
                            // process needs to get aborted -> user not logged in
                            stop_get_market_prices = 1;
                            console.log(chrome.i18n.getMessage("background_error_not_logged_in")+xhr.status);
                            setTimeout(function(){ next(counter, maxLoops) }, 1000);
                          }  else {
                            // aaand remove from array too
                            removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                            // In case other errors occur just start next iteration
                            console.log(chrome.i18n.getMessage("background_error_steam_server")+xhr.status);
                            setTimeout(function(){ next(counter, maxLoops) }, 1000);
                          }
                        }
                      });
                    } else {
                      // remove from array since there were to much retrys
                      removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                      // Start next iteration if max retrys are reached
                      setTimeout(function(){ next(counter, maxLoops) }, 100);
                      scnt = 0;                    
                    }
                  }

                  // Only start if this is the first iteration
                  // OnError will start the function by itself
                  if(scnt <= 1) processAjaxNameID();

                } else {
                  // Remove from array due to missing nameid
                  removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                  // go further with next item
                  setTimeout(function(){ next(counter, maxLoops) }, 100);
                }
              },
              error: function(xhr, textStatus, errorThrown) {
                if(xhr.status == 503 || xhr.status == 502){
                  // Sometimes Steam-Servers are temporarily unavailable - execute retries
                  //console.log('Error: SteamService not available. '+xhr.status);
                  setTimeout(function(){ processAjax(); }, rcnt*5000);
                } else if(xhr.status == 429){
                  // process needs to get aborted / Rate-Limit reached!
                  stop_get_market_prices = 1;
                  // Remove from array since we couldn't get the market-price for this item
                  removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                  // too many attempts
                  console.log(chrome.i18n.getMessage("background_error_too_many_attempts")+xhr.status);
                  setTimeout(function(){ next(counter, maxLoops) }, 1000);
                } else if(xhr.status == 401){
                  // process needs to get aborted -> user not logged in
                  stop_get_market_prices = 1;
                  console.log(chrome.i18n.getMessage("background_error_not_logged_in")+xhr.status);
                  setTimeout(function(){ next(counter, maxLoops) }, 1000);
                } else {
                  // aaaand remove it from array here too
                  removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
                  // In case other errors occur just start next iteration
                  console.log(chrome.i18n.getMessage("background_error_steam_server")+xhr.status);
                  setTimeout(function(){ next(counter, maxLoops) }, 1000);
                }
              }
            });
          } else {
            // Remove from array since we couldn't get the market-price for this item
            removeClassID(cardsObj[[cardsArr[counter-1]]].classid);
            // Start next iteration if max retrys are reached
            setTimeout(function(){ next(counter, maxLoops) }, 1000);
            rcnt = 0;
          }
        }

        // Only start if this is the first iteration
        // OnError will start the function by itself
        if(rcnt <= 1) processAjax();

      } else {
        chrome.tabs.sendMessage(sender.tab.id,{
          msg: 'UpdateProgress',
          percentage: 100,
          message: chrome.i18n.getMessage("background_bulksell_user_stopped"),
          error: true
        });
        console.log(chrome.i18n.getMessage("background_bulksell_user_stopped_msg"));
      }
    })(0, cardsArr.length);

    return true;

  } else if(message.greeting == 'createMarketListingOrders'){

    // if the process was stopped by user, we should reset our bit
    stop_listing_items = 0;
    var cards = message.cards;
    var loops = cards.length;


    (function next(counter, maxLoops){

      if(counter++ >= maxLoops){
        // Start confirmation-process for market-items
        processMarketListings();
        // Tell the user we're done now and processing the confirmations in background
        setTimeout(function(){
            chrome.tabs.sendMessage(sender.tab.id,{
              msg: 'UpdateProgress',
              percentage: 100,
              message: chrome.i18n.getMessage("background_bulksell_listing_msg")
            });
            // SendResponse to close dialog/reload page etc.
            sendResponse({ success: true });
        }, 10000);

        return;
      }

      var rcnt = 0; // retry-counter
      function processAjax(){
        rcnt++;
        if(rcnt <= 5){
          $.ajax({
            url: 'https://steamcommunity.com/market/sellitem/',
            type: 'POST',
            data: {
              sessionid: message.sessionid,
              appid: cards[counter-1].appid,
              contextid: cards[counter-1].contextid,
              assetid: cards[counter-1].assetid,
              amount: cards[counter-1].amount,
              price: cards[counter-1].price
            },
            timeout: 10000,
            success: function(data){
              if(data.success === true){

                // Update the progressbar at frontend
                chrome.tabs.sendMessage(sender.tab.id,{
                  msg: 'UpdateProgress',
                  percentage: ((99/maxLoops)*counter),
                  message: chrome.i18n.getMessage("background_bulksell_listing")+' ('+counter+'/'+maxLoops+')'
                });

                // Reset retry-counter
                rcnt = 0;

                // Confirm items every 240 steps we could do up to 250 confirmations, 
                // but just leave some space to other confirmations like trades and so on
                if(((Math.ceil((counter-1)/200.0)*200)/(counter-1)) == 1){
                  // Tell the user we're retrieving trades
                  chrome.tabs.sendMessage(sender.tab.id,{
                    msg: 'UpdateProgress',
                    percentage: ((99/maxLoops)*counter),
                    message: chrome.i18n.getMessage("background_bulksell_confirmation_bg")
                  });
                  // Start confirmation-process for market-items
                  processMarketListings();
                  // execute our function anyway
                  setTimeout(function(){ next(counter, maxLoops) }, 5000);

                } else {
                  // start next iteration
                  setTimeout(function(){ next(counter, maxLoops); }, 500);
                }
              } else {
                // Reset retry-counter
                rcnt = 0;
                // Probably this item was already sold or we have some other problem
                // start next iteration
                setTimeout(function(){ processAjax(); }, (Math.round(Math.random()*(5-3)+3)*1000));
              }
            },
            error: function(xhr, textStatus, errorThrown) {
              if(xhr.status == 503){
                // Sometimes Steam-Servers are temporarily unavailable - execute retries
                console.log(chrome.i18n.getMessage("background_error_steam_not_available")+xhr.status);
                setTimeout(function(){ processAjax(); }, rcnt*5000);
              } else if(xhr.status == 502){
                // Probably this means the item is already on sell & not confirmed yet
                if(xhr.responseText.success == false){
                  //console.log('error kek BAD GATEWAY');
                  // start next iteration
                  setTimeout(function(){ next(counter, maxLoops); }, 500);
                } else {
                   // Sometimes Steam-Servers are temporarily unavailable - execute retries
                  console.log(chrome.i18n.getMessage("background_error_steam_not_available")+xhr.status);
                  setTimeout(function(){ processAjax(); }, rcnt*5000);                 
                }
              } else if(xhr.status == 429){
                // process needs to get aborted / Rate-Limit reached!
                stop_listing_items = 1;
                console.log(chrome.i18n.getMessage("background_error_too_many_attempts")+xhr.status);
                setTimeout(function(){ next(counter, maxLoops) }, 100);
              } else if(xhr.status == 401){
                // process needs to get aborted -> user not logged in or 
                stop_get_market_prices = 1;
                console.log(chrome.i18n.getMessage("background_error_not_logged_in")+xhr.status);
                setTimeout(function(){ next(counter, maxLoops) }, 100);
              }  else {
                // In case other errors occur just start next iteration
                console.log(chrome.i18n.getMessage("background_error_steam_server")+xhr.status);
                setTimeout(function(){ next(counter, maxLoops) }, 5000);
              }
            }
          });
        } else {
          // Start next iteration if max retrys are reached
          setTimeout(function(){ next(counter, maxLoops) }, 100);
          rcnt = 0;                    
        }
      }

      // Only start if this is the first iteration
      // OnError will start the function by itself
      if(rcnt <= 1) processAjax();   
    })(0, loops);

    return true;

  } else if(message.greeting == 'stopListingMarketItems'){
    stop_listing_items = 1;
    return false;
  } else if(message.greeting == 'stopGetMarketPrices'){
    stop_get_market_prices = 1;
    return false;
  } else if(message.greeting == 'activateCommunityBadge'){
    community_badge = 1;
    return false;
  } else if(message.greeting == 'deactivateCommunityBadge'){
    community_badge = 0;
    return false;
  } else if(message.greeting == 'statusCommunityBadge'){
    sendResponse(community_badge);
    return false;
  } else if(message.greeting == 'gimmeMasterSteamID'){
    idb.getMasterRecord().then(function(user){
      sendResponse(user.steam_id);
    });
    return true;
  } else if(message.greeting == "reset_skip_login"){

    idb.opendb().then(function(db){
      db.transaction('rw', 'steam_users', function(){
        db.steam_users.each(user => {
          db.steam_users.update(user.id, {skip: 0});
        });
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;
  } else if(message.greeting == "reset_community_skip"){

    idb.opendb().then(function(db){
      db.steam_users.where('community').aboveOrEqual(2).modify(function(user){
        user.skip = 1;
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;
  } else if(message.greeting == "setSkipForLogin"){

    idb.opendb().then(function(db){
      db.transaction('rw', 'steam_users', function(){
        db.steam_users.each(user => {
          if(user.login_name == capitalizeFirstLetter(message.user) || user.login_name == message.user)
          db.steam_users.update(user.id, {skip: 1});
        });
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;
  } else if(message.greeting == "set_purchased_skip"){

    idb.opendb().then(function(db){
      db.steam_users.where('purchased').equals(0).modify(function(user){
        user.skip = 1;
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;

  } else if(message.greeting == "set_non_purchased_skip"){

    idb.opendb().then(function(db){
      db.steam_users.where('purchased').equals(1).modify(function(user){
        user.skip = 1;
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;

  } else if(message.greeting == "set_under_eight_purchased_skip"){

    idb.opendb().then(function(db){
      db.transaction('rw', 'steam_users', function(){
        db.steam_users.each(user => {
          if(!(user.purchased == 1 && user.level < 8))
          db.steam_users.update(user.id, {skip: 1});
        });
      }).then(function(){
        sendResponse(1);
      }).catch(function(err){
        console.log(err);
      }).finally(function(){
        db.close();
      });
    });

    return true;

  } else if(message.greeting == "getDiscoveryQueueStatus"){
    sendResponse(stop_disc_queue);
  } else if(message.greeting == "setDiscoveryQueueStatusInactive"){
    stop_disc_queue = 0;
  } else if(message.greeting == "setDiscoveryQueueStatusActive"){
    stop_disc_queue = 1;
    sendResponse(1);
  } else if(message.greeting == "getLicenseBulkActivationStatus"){
    sendResponse({status: license_bulk_activation, appid: license_bulk_appid});
  } else if(message.greeting == "setLicenseBulkActivationInactive"){
    license_bulk_activation = 0;
  } else if(message.greeting == "setLicenseBulkActivationActive"){
    license_bulk_activation = 1;
    license_bulk_appid = message.appid;
    sendResponse(1);
  } else {
    // This Listener don´t know what to do with this message
    console.log(chrome.i18n.getMessage("background_missing_listener_function")+message.greeting);
    return false;
  }
  return true;
});

chrome.browserAction.onClicked.addListener(function(tab){
  chrome.tabs.create({
    url: chrome.extension.getURL('index.html')
  });
});
// pinned style
chrome.tabs.create({
  url: chrome.extension.getURL('index.html')
  /*,
  pinned: true*/
});

//
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
