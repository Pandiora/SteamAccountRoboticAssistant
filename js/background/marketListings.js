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

function getItemMarketPrices(){
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
}




function createMarketListing(){
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
}