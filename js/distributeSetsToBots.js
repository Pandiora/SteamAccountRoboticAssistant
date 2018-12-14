function sendAllCardsToBot(sender, obj, current_user, sessionid){

  // just for debugging purposes
  var startGameCount = Object.keys(obj).length,
      gamesNotFound  = [],
      notEnoughCards = [],
      temporaryObject = obj;

  chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 15, message: "Check owned badges" });

  idb.opendb().then(function(db){
    db.transaction("r", ['steam_badges'], function(){
      db.steam_badges.toArray().then(function(steam_badges){

        var arr = Object.keys(obj),
            len = arr.length;

        for(var i=0;i<len;i++){

          var userappid = [arr[i]][0],
              cardsLen  = Object.keys(obj[userappid]).length,
              ccount    = 0,
              found     = 0,
              slen      = steam_badges.length,
              created   = new Date().toISOString().slice(0, 19).replace('T', ' ');

          for(var j=0;j<slen;j++){

            // some games are not in our database (like banned ones)
            if(parseInt(steam_badges[j].app_id) === parseInt(userappid)){
              // set found-bit so we don't execute functions twice
              found = 1;

              if(steam_badges[j].cards_total != cardsLen){

                //console.log("Appid: "+userappid+", Game: "+steam_badges[j].game_name+" does not have enough cards for full a set");
                // remove when there are not enough different cards for one game
                notEnoughCards.push(userappid);
                delete obj[userappid];
                break;

              } else {

                // we can only use full sets
                ccount = checkCardCount(obj[userappid]);
                if(ccount == 0) break; // break if card-count are equal

                var kees = Object.keys(obj[userappid]),
                    klen = kees.length,
                    plen = 0;

                // remove items from card-arrays so only full sets will be left
                for(var y=0;y<klen;y++){
                  // find out how much items needs to be removed on per-array basis
                  plen = Math.abs(obj[userappid][kees[y]].length-ccount);
                  if(plen > 0) obj[userappid][kees[y]].splice(-plen); // dafuq
                }
                
                break;
              }
            }
          }

          // don't process games if they are not in database, since we can't know if they provide a full set
          if(found == 0){
            gamesNotFound.push({
                app_id: arr[i], 
                game_name: '',
                cards_total: 0,
                max_lvl: 0,
                created: created
            });
            delete obj[userappid];
          }
        }
      }).then(function(){

        console.log(gamesNotFound);

        if(gamesNotFound.length > 0){
          chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 15, message: "Get missing data" });
          // we need to find missing information for badges
          worker.postMessage({
            action: 'start',
            status: 'active',
            sender: [],
            target: 'webworker',
            process: 'addMissingBadgesEntries',
            message: '',
            percentage: '0',
            parameters: [gamesNotFound],
          });

          worker.onmessage = function(e){
            var data = e.data;
            if(data.msg == 'SteamBadgesDone'){
              worker = new Worker('js/webworkers.js');
              sendAllCardsToBot(sender, temporaryObject, current_user, sessionid);
            }
          }

        } else {
          chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 20, message: "Build full sets complete" });
          console.log("Games on start: "+startGameCount+" Games on end: "+Object.keys(obj).length+"\nWe couln't find "+gamesNotFound.length+" games in database. Skip them.\n"+notEnoughCards.length+" games doesn't have enough cards for a full set.");
          processUsers(sender, obj, sessionid);
        }

      });
    }).catch(function(err){
      console.log(err);
    }).finally(function(){
      // stop blocking the database
      db.close();
    });
  });

  function processUsers(sender, obj, sessionid){

    idb.opendb().then(function(db){
      chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 25, message: "Join users badges ..." });
      joinUsersWithBadges(db).then(function(bots){
          chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 30, message: "Map users to available sets ..." });
        // bots is now available here
        // console.log(bots)
        var abots = Object.keys(bots),
            tempBots = bots,
            blen = abots.length,
            alen = botappid = botcurlvl = objappid = 0;

        for(var i=0;i<blen;i++){

          var abots = Object.keys(bots),
              aobj  = Object.keys(obj),
              alen  = bots[abots[i]].owned_appid.length,
              olen  = aobj.length,
              diff  = [];

          /*console.log("Owned Appids:");
          console.log(bots[abots[i]]['owned_appid']);
          console.log("Card-Sets Appids:");
          console.log(aobj);*/

          // find out which games each user owns
          for(var y=0;y<alen;y++){
            botappid = bots[abots[i]]['owned_appid'][y].toString(),
            botcurlvl = bots[abots[i]]['owned_level'][y].toString();            
            for(var z=0;z<olen;z++){
              objappid = aobj[z].toString();
              // only add games as already owned if we reached max-level
              if((botappid === objappid) && (botcurlvl !== 5)){
                diff.push(botappid);
                break;
              }
            }
          }

          // now reduce the array to unowned games
          diff = aobj.filter( function(el){return !diff.includes(el);});
          var dlen = diff.length;

          if(dlen === 0){
            // nothing to do, user owns all cards we have card-sets for
            //console.log(bots[abots[i]]['persona']+" already owns all the "+(olen+dlen)+" games we have card-sets for.");
          } else {
            console.log(bots[abots[i]]['persona']+" is missing "+dlen+" games we have card-sets for.");

            for(var d=0;d<dlen;d++){
              // remove User if there are no more sets left and continue to next iteration
              /*if(removeUsers == 1){
                removeUsers = 0;
                delete tempBots[abots[i]];
                continue;
              }*/

              var diffCurAppid = diff[d],
                  diffpullCoun = (tempBots[abots[i]]['owned_appid'][diffCurAppid]) ? 5-tempBots[abots[i]]['owned_level'][ tempBots[abots[i]]['owned_appid'][diffCurAppid].indexOf() ] : 5,
                  currBotAsset = tempBots[abots[i]]['assets'],
                  currBotSApps = tempBots[abots[i]]['send_appid'],
                  currenObject = obj[diffCurAppid],
                  currObjCards = Object.keys(currenObject),
                  cardsetMCard = currenObject[currObjCards[0]].length,
                  cardsToAttac = Math.min(...[diffpullCoun,cardsetMCard]),
                  toBeeSpliced = [],
                  cslen = currObjCards.length;

              //console.log("We want "+diffpullCoun+" full sets and we can deliver "+cardsetMCard+" sets of Appid "+diffCurAppid+" for the user "+tempBots[abots[i]]['persona']);

              for(var l=0;l<cslen;l++){
                // remove the last values by needed sets from array for all cards of this specific set
                toBeeSpliced = currenObject[currObjCards[l]].splice(-cardsToAttac,cardsToAttac);
                // add the asset-ids of the cards to the assets of the specific bot
                currBotAsset.push.apply(currBotAsset,toBeeSpliced);
              }
              // add the appid for added set to the specific bots array of to be send appids
              currBotSApps.push(diffCurAppid);              
              // remove appids if there are no more card-sets (we should have spliced em before)
              if(diffpullCoun >= cardsetMCard) delete obj[diffCurAppid];
              // start to remove users from bots-array since there are no more card-sets
              //if(Object.keys(obj).length === 0) removeUsers = 1;
            }
          }
        }

        // finally prepare our array and send cards to bots
        chrome.tabs.sendMessage(sender.tab.id,{ msg: 'UpdateProgress', percentage: 35, message: "Prepare to send trades ..." });
        var cleaned = cleanDelArr(tempBots);

        sendTrades(sender, tempBots, sessionid, 35);
      })
    });
  }

  function joinUsersWithBadges(db){

    var bots = [], all = Dexie.Promise.all, deferred = $.Deferred();

    db.transaction("r", ['steam_users', 'users_badges'], function(){
      db.steam_users.where('purchased').equals(1).each(function(users){
        if(current_user !== users.steam_id) bots.push({
          steam_id: users.steam_id,
          persona: users.login_name,
          owned_appid: [],
          owned_level: [],
          send_appid: [],
          assets: []
        });
      }).then(function(){
        all(bots.map(function (user){
          var obj = {0:[],1:[]};
          return db.users_badges
                .where('steam_id')
                .equals(user.steam_id)
                .each(function(res){ obj[0].push(res.app_id); obj[1].push(res.cur_lvl); })
                .then(function(){ return obj; });
        })).then(function(usersBadges){
          bots.forEach(function (user, i) {
              user.owned_appid = usersBadges[i][0];
              user.owned_level = usersBadges[i][1];
          });
          deferred.resolve(bots); // finally return our object with users and their badges
        });
      });
    }).catch(function(err){
      console.log(err);
    }).finally(function(){
      db.close();
    });

    return deferred.promise();
  }

  function cleanDelArr(arr){
    var len = arr.length,
        tar = arr;

    // at first delete arrays with empty asset-arrays
    for(var i=0;i<len;i++){
      if(arr[i].assets.length <= 0) delete tar[i];
    }
    // now clean up all undefined objects
    for (var j = 0; j < tar.length; j++) {
      if (tar[j] == undefined) {         
        tar.splice(j, 1);
        j--;
      }
    }
    return tar;
  }

  function checkCardCount(game){

    var arr   = [],
        res   = 0,
        oarr  = Object.keys(game),
        len   = oarr.length;

    // count cards and push results to array
    for(var i=0;i<len;i++){
      arr.push(game[oarr[i]].length);
    }

    // if lengths are different pick lowest one
    res = Math.min(...arr);
    return res;
  }
}