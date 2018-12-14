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
importScripts('/plugins/jQuery/jquery-2.2.3.min.js', '/plugins/Dexie/Dexie.min.js', 'database.js', 'globalFunctions.js');

// Run function based on the message the worker receives
self.onmessage = (msg)=>{
  if (typeof self[msg.data.process] === "function"){
    self[msg.data.process](msg.data);
  } else {
    console.log("Unknown webworker called with name "+msg.data.process);
  }
}

async function getBotGames(message){

  const users = await idb.opendb().then((db)=>{
    db.transaction("r", db.steam_users, ()=>{
      db.steam_users.toArray().then((users)=>{
        return users;
      });
    }).catch((err)=>{
      console.log(err);
    }).finally(()=>{
      db.close();
      //console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Appids for all users added to "users_games"', '', 'background: silver; color: green; border-radius: 10%', '');
    });
  });

  var master_entry    = $.grep(users, (e)=>{ return e.type == 'Master'; }),
      master_api_key  = master_entry[0]['apikey'],
      master_steamid  = master_entry[0]['steam_id'],
      usermsg         = 'Getting Bot-Games',
      usercnt         = users.length,
      apparr          = [];

  // We need a delayed loop to not spam the steam-servers
  (async function next(counter, maxLoops){

    // Finally start to insert data into table and stop iteration
    // due to our timeouts we can´t implement this step into this transaction
    if (counter++ >= maxLoops){
      setTimeout(()=>{
        self.postMessage({
          msg: 'UpdateProgress', 
          percentage: 99, 
          message: 'Insert games into database.'
        });
        idb.bulkAdd('users_games', apparr);
      }, 100);

      return;
    }

    // Update our Progressbar (frontend)
    self.postMessage({
      msg: 'UpdateProgress', 
      percentage: ((99/maxLoops)*counter), 
      message: (usermsg+'('+counter+'/'+maxLoops+')')
    });

    // Get data of owned games for this user via steam-api
    const confGames = {
        iterateValues: { appid: appidarr },
        fetchOptions: {
          params: { key: master_api_key,steamid: users[counter-1].steam_id,include_appinfo: 1,format: 'json'},
          url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
          format: 'json'
        }
    }
    const appids = await fun.fetchData(confGames);


    var username  = users[counter-1].username,
        steam_id  = users[counter-1].steam_id,
        created   = fun.dateToIso(), // current date
        appidarr  = [];

    // We need to check for existence of the key if the ajax-request fails for some reason
    appidarr = (appids.response.hasOwnProperty('games')) ? appids.response['games'] : [];

    // On Master-Accounts get more detailed data (only first Master-Account is targeted)
    // since multiple Master-Accounts are not supported - there is a 0 one could change ;)
    if(master_steamid !== steam_id){
      // add created objects to existing array of user-games
      Array.prototype.push.apply(apparr, buildAppArr(username, created, appidarr, steam_id) );
      setTimeout(()=>{ next(counter, maxLoops) }, 1000);
    }

    // spare unnecessary loops and match on already existing entries
    const compared = await compareArray(db, steam_id);
    let build = fun.objKeysToArr(appidarr, 'appid');
        build = fun.symDiff(appidarr, compared);
     appidarr = fun.wipeObjByKeyVal(build, appidarr, 'appid');
    const session = await fun.getSession('support');

    // seems like there is no active session / user is not logged in
    if(!session) setTimeout(()=>{ next(counter, maxLoops); break; }, 1000);

    const confTimes = {
        iterateValues: { appid: appidarr },
        fetchOptions: {
          params: { sessionid: session, wizard_ajax: 1 },
          url: 'https://help.steampowered.com/en/wizard/HelpWithGame/',
          format: 'json'
        }
    }

    const promises = fun.fetchChain(confTimes);
    let timestamp,dbArr,result,results;

    for(const item of promises){
      result = await fun.fetchData(item);

      time  = (item) ? convResTime(result.html) : fun.dateToIso(),
      dbArr = buildAppArr(username, time, item.params.appid, steam_id);
      idb.bulkAdd('users_games', dbArr);

      console.log(result);
      results.push(result);
    }

    // check if all entries got resolved/rejected
    if(results.length !== appidarr.length){
      console.log("Array mismatch");
    } else { setTimeout(()=>{ next(counter, maxLoops) }, 1000); }
        
  })(0, usercnt);



  function convResTime(reponse){

      // we can't use find in webworker => use regex to find times of games being added 
      var reg1 = /wlight_text">([a-zA-Z]{3}.{2,9})<.span/g, 
          reg2 = /span>([a-zA-z]{3}.{5,12})&nbsp/g,
          html = response;
          html = (html.match(reg1) && html.match(reg1)[1]) ? reg1.exec(html.match(reg1)[1])[1] : reg2.exec(html.match(reg2)[0])[1],
          html = html.replace("&nbsp;-", ""),
          html = (html.length < 6) ? (html+", "+(new Date()).getFullYear().toString()) : html,
          html = html+' GMT', // fix 1 day offset
          html = fun.dateToIso(html);

      return html;
  }



  function compareArray(db, steamid){
    var deferred = $.Deferred();
    var arr = [];
    idb.opendb().then((db)=>{
    db.transaction('r', db.users_games, ()=>{
      db.users_games.where('steam_id').equals(steamid).each((res)=>{
        if(res.app_id) arr.push(res.app_id);
      }).then((s)=>{
        deferred.resolve(arr);
      });
    });
    });
    return deferred.promise();
  }



  function buildAppArr(username, added, appidarr, steam_id){
    console.log(appidarr);
    var arr     = [],
        created = fun.dateToIso();

    // Push an entry into our array for every appid of this user
    // make sure to use the same timestamp everytime or detailed timestamp if user-account is Master
    if(appidarr.length){
      for(i=0; i<appidarr.length; i++){
        arr.push({
          username: username, 
          created: created,
          added: ((Array.isArray(added)) ? added[i] : added),
          app_id: appidarr[i]['appid'], 
          game_name: appidarr[i]['name'],
          steam_id: steam_id
        });
      }
    }
    return arr;
  }
}

function getUsersBadges(){

  var master_api_key = '',
      usercnt        = 0,
      usermsg        = 'Getting Users Badges',
      userarr        = [],
      badgesarr      = [],
      created        = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: 12-24-2016 13:25:34

  idb.opendb().then((db)=>{
    db.transaction("r", ['steam_users'], ()=>{
      db.steam_users.toArray().then((users)=>{

        // first we need to get all users and master-apikey
        master_api_key = $.grep(users, (e)=>{ return e.type == 'Master'; }),
        master_api_key = master_api_key[0]['apikey'],
        userarr        = users,
        usercnt        = users.length;

      }).then(()=>{
        
        // now get the data for every user from steam and compare it to our games in database
        // We need a delayed loop to not spam the steam-servers
        (function next(counter, maxLoops) {

          // Finally start to insert data into table and stop iteration
          // due to our timeouts we can´t implement this step into this transaction
          if (counter++ >= maxLoops){
            setTimeout(()=>{
              self.postMessage({msg: 'UpdateProgress', percentage: 98, message: 'Insert games into database.'});
              processUser(badgesarr);
            }, 100);
            return;
          }

          // Update our Progressbar (frontend)
          self.postMessage({msg: 'UpdateProgress', percentage: ((98/maxLoops)*counter), message: (usermsg+'('+counter+'/'+maxLoops+')')});

          // Get data of owned games for this user via steam-api
          $.get('https://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+master_api_key+'&steamid='+userarr[counter-1].steam_id+'&format=json', (res)=>{
 
            var username  = userarr[counter-1].username,
                steam_id  = userarr[counter-1].steam_id,
                timestamp = '',
                obj       = res.response.badges,
                len       = obj.length;

            for(var i=0;i<len;i++){
              if(obj[i].appid === undefined) continue; // no sale-badges or steam-badges pls
              if(obj[i].border_color === 1) continue; // no foils pls
              timestamp = new Date(obj[i].completion_time*1000).toISOString().slice(0, 19).replace('T', ' ');

              badgesarr.push({
                username: username,
                steam_id: steam_id,
                app_id: obj[i].appid,
                game_name: '',
                max_lvl: '',
                cur_lvl: obj[i].level,
                crafted: timestamp,
                created: created
              });
            }                        

            // Call this function again until all data for all accounts were retrieved
            // Add a timeout to not spam the Steam-Servers
            // Todo: Maybe add retry if Steam-Servers aren´t available - else add error-handling
            setTimeout(()=>{ next(counter, maxLoops) }, 1000);
          });

        })(0, usercnt);        

      });
    }).catch((err)=>{
      console.log(err);
    }).finally(()=>{
      db.close();
    });
  });

  function processUser(arr){

    var len   = arr.length,
        sbarr = [],
        ubarr = [];

    idb.opendb().then((db)=>{
      db.transaction("rw", ['steam_badges', 'users_badges'], ()=>{
        db.steam_badges.each((steam_badges)=>{

          // at first we need to fill the missing values of the array
          for(var i=0;i<len;i++){
            if(steam_badges.app_id == arr[i].app_id){
              arr[i]['game_name'] = steam_badges.game_name;
              arr[i]['max_lvl'] = steam_badges.max_lvl;
              break;
            }
          }

          // we also need to save appids to a seperate array for later use
          sbarr.push(parseInt(steam_badges.app_id)); // important parse for later comparison

        }).then(()=>{

          db.users_badges.bulkAdd(arr).then((lastKey)=> {
            self.postMessage({msg: 'UpdateProgress', percentage: 99, message: 'Search for missing entries'});
          }).catch(Dexie.BulkError, (e)=>{
            self.postMessage({msg: 'UpdateProgress', percentage: 99, message: 'Duplicate-Entrys: '+e.failures.length});
          });

        }).then(()=>{

          var created = new Date().toISOString().slice(0, 19).replace('T', ' ');

          db.users_badges.each((u)=>{

            // if steam-badges is missing this app-id, add object for later use
            // this way we will ensure even missing games are added to the database (steam-badges)
            if(sbarr.indexOf(parseInt(u.app_id)) == -1){
              ubarr.push({
                app_id: u.app_id, 
                game_name: '',
                cards_total: 0,
                max_lvl: 0,
                created: created
              });
            }

          }).then(()=>{

            // if we found missing entries process them else finish
            if(ubarr.length > 0){
              self.postMessage({msg: 'UpdateProgress', percentage: 99, message: ubarr.length+' entries missing - adding them ...'});
              addMissingBadgesEntries(ubarr, true);
            } else {
              self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'No missing entries found - Done!'});           
            }

          });
        });
      }).catch((err)=>{
        console.error(err);
      }).finally(()=>{
        if(ubarr.length < 1){
          self.postMessage({msg: 'UsersBadgesDone'});
          self.close();
        }
        db.close();
      });
    });
  }
}


function addMissingBadgesEntries(obj){
  // post=true is used for users_badges action on frontend to fetch users badges
  // post=false is used to distribute cards to bots
  console.log(obj);
  const arr = obj.parameters[0];
  const post = obj.parameters[1] || 0;
  var len = arr.length;

  (function next(counter, maxLoops) {

    // Finally insert missing entries
    if (counter++ >= maxLoops){
      setTimeout(()=>{
        idb.opendb().then((db)=>{
          db.transaction("rw", 'steam_badges', ()=>{
            db.steam_badges.bulkAdd(arr).then((lastKey)=> {
              if(post) self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Added missing entries. Done!'});
            }).catch(Dexie.BulkError, (e)=>{
              if(post) self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Duplicates-Entrys: '+e.failures.length});
            });
          }).catch((err)=>{
            console.error(err);
          }).finally(()=>{
            post ? self.postMessage({msg: 'UsersBadgesDone'}) : self.postMessage({msg: 'SteamBadgesDone'});
            self.close();
            db.close();
          });
        });
      }, 100);
      return;
    }

    // get card-count and game-name for missing games and update the array of missing games with them
    jQuery.get("https://steamcommunity.com/my/gamecards/"+arr[counter-1].app_id, (res)=>{
      arr[counter-1].cards_total = res.match(/img\sclass\="gamecard/g).length,
      arr[counter-1].game_name = (/\/\d+\/"><span\sclass\="profile_small_header_location">(.*)<\/span/).exec(res)[1];
      setTimeout(()=>{ next(counter, maxLoops) }, 100);
    });
  })(0, len);
}

function getSteamBadges(){

  // array with all games having trading-cards
  var arr = [],
  created = fun.dateToIso(); // current datetime

  // announce process-start
  self.postMessage({msg: 'UpdateProgress', percentage: 0, message: 'Fetching Data ...'});

  // temporarily there is no good alternative, without using external APIs for retrieving all games with
  // cards from steam and the total cards needed to craft a badge for chosen games
  $.ajax({
    type: 'GET',
    url: 'https://cdn.steam.tools/data/set_data.json',
    success: (res)=>{

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
          max_lvl: 0, // the API doesn't provide this value
          created: created
        });
      }

      self.postMessage({msg: 'UpdateProgress', percentage: 50, message: 'Inserting into Database ...'});
    },
    error: (err)=>{
      console.log("Can't get data from steam.tools"+err);
    }

  }).done(()=>{

    idb.opendb().then((db)=>{
      db.transaction('rw', db.steam_badges, function*(){
        db.steam_badges.bulkAdd(arr).then((lastKey)=> {
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Process finished'});
        }).catch(Dexie.BulkError, (e)=>{
          self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Duplicates-Entrys: '+e.failures.length});
        });
      }).catch((err)=>{
        console.log(err);
        console.error(err.length);
      }).finally(()=>{
        self.postMessage({msg: 'SteamBadgesDone'});
        self.close();
        db.close();
      });
    });

  });
}

function getBotBadges(){

  idb.opendb().then((db)=>{
    db.transaction("r", db.steam_users, ()=>{
      db.steam_users.toArray().then((users)=>{

        var master_api_key = $.grep(users, (e)=>{ return e.type == 'Master'; });
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
            setTimeout(()=>{
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
          $.get('http://api.steampowered.com/IPlayerService/GetBadges/v1/?key='+master_api_key[0]['apikey']+'&steamid='+users[counter-1].steam_id+'&format=json', (data)=>{

            $.each(data['response']['badges'], (key,val)=>{
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
            setTimeout(()=>{ next(counter, maxLoops) }, 1000);
          });

        })(0, usercnt);
      });
    }).catch((err)=>{
      console.log(err);
    }).finally(()=>{
      db.close();
      //console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Update: '+'%c Appids for all users added to "users_games"', '', 'background: silver; color: green; border-radius: 10%', '');
    });
  });

  function processUser(userarr){
    idb.opendb().then((db)=>{
      db.transaction('rw', db.steam_users, ()=>{
        for(var i=0; i<userarr.steamid.length;i++){
          //console.log('SteamID: '+userarr.steamid[i]+' Level: '+userarr.lvl[i]+' CSGO: '+userarr.csgo[i]+' Community: '+userarr.com[i]);
          db.steam_users.where('steam_id').equals(userarr.steamid[i]).modify({
            level: userarr.lvl[i],
            csgo: userarr.csgo[i],
            community: userarr.com[i]
          });
        }
      }).then(()=>{
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Process finished'});
      }).catch((err)=>{
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Error while getting badges'+err});
      }).finally(()=>{
        self.postMessage({msg: 'OwnedBadgesDone'});
        self.close();
        db.close();
      });
    });
  }
}
