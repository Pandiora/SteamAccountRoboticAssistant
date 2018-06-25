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
importScripts('/plugins/jQuery/jquery-2.2.3.min.js', '/plugins/Dexie/Dexie.min.js', 'database.js');

// Run function based on the message the worker receives
self.onmessage = function(msg){
  if(msg.data == 'getBotGames'){
    //console.log(msg.data);
    getBotGames();
  } else if(msg.data == 'getBotBadges'){
    //console.log(msg.data);
    getBotBadges();
  } else if(msg.data == 'getSteamBadges'){
    //console.log(msg.data);
    getSteamBadges();
  } else if(msg.data == 'getUsersBadges'){
    //console.log(msg.data);
    getUsersBadges();
  }
};




function getBotGames(){

  idb.opendb().then(function(db){
    db.transaction("r", db.steam_users, function(){
      db.steam_users.toArray().then(function(users){

        var master_api_key = $.grep(users, function(e){ return e.type == 'Master'; });
        var usercnt = users.length;
        var usermsg = 'Getting Bot-Games';
        var apparr = [];
        master_api_key = master_api_key[0]['apikey'];

        // We need a delayed loop to not spam the steam-servers
        (function next(counter, maxLoops) {

          // Finally start to insert data into table and stop iteration
          // due to our timeouts we can´t implement this step into this transaction
          if (counter++ >= maxLoops){
            setTimeout(function(){
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: 'Insert games into database.'});
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
              console.log('Cannot find bot-games');
              var appidarr = [];
            }

            // Push an entry into our array for every appid of this user
            if(appidarr.length){
              for(i=0; i<appidarr.length; i++){
                apparr.push({
                  username: username, 
                  created: created, 
                  app_id: appidarr[i]['appid'], 
                  game_name: appidarr[i]['name'],
                  steam_id: steam_id
                });
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
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Process finished'});
        }).catch(Dexie.BulkError, function(e){
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Duplicates-Entrys: '+e.failures.length});
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

function getUsersBadges(){

  var master_api_key = '',
      usercnt        = 0,
      usermsg        = 'Getting Users Badges',
      userarr        = [],
      badgesarr      = [],
      created        = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: 12-24-2016 13:25:34

  idb.opendb().then(function(db){
    db.transaction("r", ['steam_users','steam_badges', 'users_badges'], function(){
      db.steam_users.toArray().then(function(user){

        // first we need to get all users and master-apikey
        master_api_key = $.grep(users, function(e){ return e.type == 'Master'; }),
        master_api_key = master_api_key[0]['apikey'],
        userarr        = users,
        usercnt        = users.length;

      }).then(function(){
        
        // now get the data for every user from steam and compare it to our games in database
        // We need a delayed loop to not spam the steam-servers
        (function next(counter, maxLoops) {

          // Finally start to insert data into table and stop iteration
          // due to our timeouts we can´t implement this step into this transaction
          if (counter++ >= maxLoops){
            setTimeout(function(){
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: 'Insert games into database.'});
              processUser(apparr);
            }, 100);
            return;
          }

          // Update our Progressbar (frontend)
          self.postMessage({msg: 'UpdateProgress', percentage: ((99/maxLoops)*counter), message: (usermsg+'('+counter+'/'+maxLoops+')')});

          // Get data of owned games for this user via steam-api
          $.get('https://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+master_api_key+'&steamid='+users[counter-1].steam_id+'&format=json', function(res){
 
            var username  = users[counter-1].username,
                steam_id  = users[counter-1].steam_id,
                timestamp = '',
                obj       = res.response.badges,
                len       = obj.length;

            for(var i=0;i<len;i++){
              if(obj[i].appid === undefined) continue;
              if(obj[i].border_color === 1) continue; // no foils pls
              timestamp = new Date(obj[i].completion_time*1000).toISOString().slice(0, 19).replace('T', ' ');

              badgesarr.push({
                username: '',
                steam_id: '',
                app_id: obj[i].appid,
                game_name: '',
                max_lvl: '',
                cur_lvl: obj[i].level,
                crafted: timestamp,
                created: ''
                  });
              }                        

            // Call this function again until all data for all accounts were retrieved
            // Add a timeout to not spam the Steam-Servers
            // Todo: Maybe add retry if Steam-Servers aren´t available - else add error-handling
            setTimeout(function(){ next(counter, maxLoops) }, 1000);
          });

        })(0, usercnt);        

      }).then(function(){

      });
    }).catch(function(err){
      console.log(err);
    }).finally(function(){
      db.close();
    });
  });



}

function getSteamBadges(){

  // array with all games having trading-cards
  var arr = [],
  created = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // announce process-start
  self.postMessage({msg: 'UpdateProgress', percentage: 0, message: 'Fetching Data ...'});

  // temporarily there is no good alternative, without using external APIs for retrieving all games with
  // cards from steam and the total cards needed to craft a badge for chosen games
  $.ajax({
    type: 'GET',
    url: 'http://cdn.steam.tools/data/set_data.json',
    success: function(res){

      var obj = Object.keys(res.sets),
      len = obj.length,
      app = '';

      // object-keys must match the database-keys so we can easily use bulkadd
      for(var i=0;i<len;i++){
        app = res.sets[obj[i]];
        arr.push({
          app_id: app.appid, 
          game_name: app.game, 
          cards_total: app.true_count,
          max_lvl: app.bgs_count,
          created: created
        });
      }

      self.postMessage({msg: 'UpdateProgress', percentage: 50, message: 'Inserting into Database ...'});
    },
    error: function(err){
      console.log("Can't get data from steam.tools"+err);
    }

  }).done(function(){

    idb.opendb().then(function(db){
      db.transaction('rw', db.steam_badges, function*(){
        db.steam_badges.bulkAdd(arr).then(function(lastKey) {
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Process finished'});
        }).catch(Dexie.BulkError, function(e){
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Duplicates-Entrys: '+e.failures.length});
        });
      }).catch(function(err){
        console.log(err);
        console.error(err.length);
      }).finally(function(){
        self.postMessage({msg: 'SteamBadgesDone'});
        self.close();
        db.close();
      });
    });

  });
}

function getUsersBadges(){



}

function getBotBadges(){

  idb.opendb().then(function(db){
    db.transaction("r", db.steam_users, function(){
      db.steam_users.toArray().then(function(users){

        var master_api_key = $.grep(users, function(e){ return e.type == 'Master'; });
        var usercnt = users.length;
        var usermsg = 'Getting Bot-Games';
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
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: 'Add games to Database'});
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
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Process finished'});
      }).catch(function(err){
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Error while getting badges'+err});
      }).finally(function(){
        self.postMessage({msg: 'OwnedBadgesDone'});
        self.close();
        db.close();
      });
    });
  }
}
