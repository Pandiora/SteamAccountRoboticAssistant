function getBotBadges(message){

  idb.opendb().then((db)=>{
    db.transaction("r", db.steam_users, ()=>{
      db.steam_users.toArray().then((users)=>{

        var master_api_key = $.grep(users, (e)=>{ return e.type == 'Master'; });
        var usercnt = users.length;
        var usermsg = 'Getting Bot-Badges';
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
              self.postMessage(Object.assign(message,{
                action: 'UpdateProgress',
                message: 'Add Badges to Database',
                percentage: 99,
                status: 'done'
              }));
              //console.log(userarr);
              processUser(userarr);
            }, 100);
            return;
          }

          // Update our Progressbar (frontend)
          self.postMessage({
            action: 'UpdateProgress', 
            percentage: ((99/maxLoops)*counter), 
            message: (usermsg+'('+counter+'/'+maxLoops+')')
          });
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
        self.postMessage({
          action: 'UpdateProgress', 
          percentage: 100, 
          message: 'Process finished'
        });
      }).catch((err)=>{
        self.postMessage({
          action: 'UpdateProgress', 
          percentage: 100, 
          message: 'Error while getting badges'+err
        });
        self.postMessage({msg: 'UpdateProgress', percentage: 100, message: 'Error while getting badges'+err});
      }).finally(()=>{
        self.close();
        db.close();
      });
    });
  }
}