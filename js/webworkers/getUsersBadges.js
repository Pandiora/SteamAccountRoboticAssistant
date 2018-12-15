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