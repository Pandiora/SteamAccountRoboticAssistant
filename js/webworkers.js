// Fix to use jQuery within webworkers: http://stackoverflow.com/questions/10491448/how-to-access-jquery-in-html-5-web-worker
// Webworker-Basics: http://www.html5rocks.com/de/tutorials/workers/basics/
var document = self.document = {parentNode: null, nodeType: 9, toString: function() {return "FakeDocument"}};
var window = self.window = self;
var fakeElement = Object.create(document);
fakeElement.nodeType = 1;
fakeElement.toString=function() {return "FakeElement"};
fakeElement.parentNode = fakeElement.firstChild = fakeElement.lastChild = fakeElement;
fakeElement.ownerDocument = document;
document.head = document.body = fakeElement;
document.ownerDocument = document.documentElement = document;
document.getElementById = document.createElement = function() {return fakeElement;};
document.createDocumentFragment = function() {return this;};
document.getElementsByTagName = document.getElementsByClassName = function() {return [fakeElement];};
document.getAttribute = document.setAttribute = document.removeChild = document.addEventListener = document.removeEventListener = function() {return null;};
document.cloneNode = document.appendChild = function() {return this;};
document.appendChild = function(child) {return child;};


// Load Dependencies
importScripts('jquery-2.1.4.min.js', 'Dexie.min.js', 'database.js');

// Run function based on the message the worker receives
self.onmessage = function(msg){
  if(msg.data == 'getBotGames'){
    //console.log(msg.data);
    getBotGames();
  } else if(msg.data == 'getBotBadges'){
    //console.log(msg.data);
    getBotBadges();
  }
};




function getBotGames(){

  idb.opendb().then(function(db){
    db.transaction("r", db.steam_users, function(){
      db.steam_users.toArray().then(function(users){

        var master_api_key = $.grep(users, function(e){ return e.type == 'Master'; });
        var usercnt = users.length;
        var usermsg = chrome.i18n.getMessage("webworker_getting_bot_games");
        var apparr = [];
        master_api_key = master_api_key[0]['apikey'];

        // We need a delayed loop to not spam the steam-servers
        (function next(counter, maxLoops) {

          // Finally start to insert data into table and stop iteration
          // due to our timeouts we can´t implement this step into this transaction
          if (counter++ >= maxLoops){
            setTimeout(function(){
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: chrome.i18n.getMessage("webworker_idb_insert_games")});
              processUser(apparr);
            }, 100);
            return;
          }

          // Update our Progressbar (frontend)

          self.postMessage({msg: 'UpdateProgress', percentage: ((99/maxLoops)*counter), message: (usermsg+'('+counter+'/'+maxLoops+')')});

          // Get data of owned games for this user via steam-api
          $.get('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key='+master_api_key+'&steamid='+users[counter-1].steam_id+'&include_appinfo=1&format=json',function(appids){
            var username = users[counter-1].username;
            var steam_id = users[counter-1].steam_id;
            var created = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: 12-24-2016 13:25:34

            // We need to check for existence of the key if the ajax-request fails for some reason
            if(appids.response.hasOwnProperty('games')){
              var appidarr = appids.response['games'];
            } else {
              console.log(chrome.i18n.getMessage("webworker_bot_games_cant_find"));
              var appidarr = [];
            }

            // Push an entry into our array for every appid of this user
            if(appidarr.length){
              for(i=0; i<appidarr.length; i++){
                apparr.push({username: username, created: created, app_id: appidarr[i]['appid'], game_name: appidarr[i]['name'],steam_id: steam_id});
              }
            }

            // Call this function again until all data for all accounts were retrieved
            // Add a timeout to not spam the Steam-Servers
            // Todo: Maybe add retry if Steam-Servers aren´t available - else add error-handling
            setTimeout(function(){ next(counter, maxLoops) }, 1000);
          });

        })(0, usercnt);
      });
    }).catch(function(err){
      console.log(err);
    }).finally(function(){
      db.close();
      //console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Appids for all users added to "users_games"', '', 'background: silver; color: green; border-radius: 10%', '');
    });
  });

  function processUser(apparr){

    idb.opendb().then(function(db){
      db.transaction('rw', db.users_games, function*(){
        db.users_games.bulkAdd(apparr).then(function(lastKey) {
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: chrome.i18n.getMessage("webworker_bot_games_done")});
        }).catch(Dexie.BulkError, function(e){
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: chrome.i18n.getMessage("webworker_bot_games_done_dupes")+e.failures.length});
        });
      }).catch(function(err){
        console.error (err.length);
      }).finally(function(){
        self.postMessage({msg: 'OwnedGamesDone'});
        self.close();
        db.close();
      });
    });
  }
}

function getBotBadges(){

  idb.opendb().then(function(db){
    db.transaction("r", db.steam_users, function(){
      db.steam_users.toArray().then(function(users){

        var master_api_key = $.grep(users, function(e){ return e.type == 'Master'; });
        var usercnt = users.length;
        var usermsg = chrome.i18n.getMessage("webworker_getting_bot_games");
        var userarr = {
          steamid: [],
          csgo: [],
          com: [],
          lvl: []
        };

        // We need a delayed loop to not spam the steam-servers
        (function next(counter, maxLoops) {

          // Finally start to insert data into table and stop iteration
          // due to our timeouts we can´t implement this step into this transaction
          if (counter++ >= maxLoops){
            setTimeout(function(){
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: chrome.i18n.getMessage("webworker_idb_insert_games")});
              //console.log(userarr);
              processUser(userarr);
            }, 100);
            return;
          }

          // Update our Progressbar (frontend)
          self.postMessage({msg: 'UpdateProgress', percentage: ((99/maxLoops)*counter), message: (usermsg+'('+counter+'/'+maxLoops+')')});
          // Push current user to array
          userarr.steamid.push(users[counter-1].steam_id);

          // Set Badges to 0 so if the badge doesn't exist we update the User with Level 0 for this Badge
          var csgo_badge = 0;
          var community_badge = 0;

          // Get data of owned games for this user via steam-api
          $.get('http://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+master_api_key[0]['apikey']+'&steamid='+users[counter-1].steam_id+'&format=json', function(data){

            $.each(data['response']['badges'], function(key,val){
              if(val['badgeid'] == 1 && val['appid'] == 730){
                // CSGO's appid is 730 - avoid getting multiple results
                //console.log('CSGO-Badge: '+val['level']);
                csgo_badge = val['level'];
              } else if(val['badgeid'] == 2 && !val.hasOwnProperty('appid')){
                // Community-Badge doesn't has an appid - avoid getting multiple results
                //console.log('Community-Badge: '+val['level']);
                community_badge = val['level'];
              }
            });

            // Push data for this user to array
            userarr.csgo.push(csgo_badge);
            userarr.com.push(community_badge);
            userarr.lvl.push(data['response']['player_level']);

            // Call this function again until all data for all accounts were retrieved
            // Add a timeout to not spam the Steam-Servers
            // Todo: Maybe add retry if Steam-Servers aren´t available - else add error-handling
            setTimeout(function(){ next(counter, maxLoops) }, 1000);
          });

        })(0, usercnt);
      });
    }).catch(function(err){
      console.log(err);
    }).finally(function(){
      db.close();
      //console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Appids for all users added to "users_games"', '', 'background: silver; color: green; border-radius: 10%', '');
    });
  });

  function processUser(userarr){
    idb.opendb().then(function(db){
      db.transaction('rw', db.steam_users, function(){
        for(var i=0; i<userarr.steamid.length;i++){
          //console.log('SteamID: '+userarr.steamid[i]+' Level: '+userarr.lvl[i]+' CSGO: '+userarr.csgo[i]+' Community: '+userarr.com[i]);
          db.steam_users.where('steam_id').equals(userarr.steamid[i]).modify({
            level: userarr.lvl[i],
            csgo: userarr.csgo[i],
            community: userarr.com[i]
          });
        }
      }).then(function(){
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: chrome.i18n.getMessage("webworker_bot_games_done")});
      }).catch(function(err){
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: chrome.i18n.getMessage("webworker_getting_badges_error")+err});
      }).finally(function(){
        self.postMessage({msg: 'OwnedBadgesDone'});
        self.close();
        db.close();
      });
    });
  }
}
