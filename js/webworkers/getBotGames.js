async function getBotGames(message){

  const users = await idb.opendb().then((db)=>{
    return db.steam_users.toArray().then((users)=>{
      return users;
    });
  });

  const master    = $.grep(users, (e)=>{ return e.type == 'Master'; }),
        apikey    = master[0]['apikey'],
        msteamid  = master[0]['steam_id'],
        usercnt   = users.length,
        created   = fun.dateToIso(); // current date
  let   apparr    = [];

  /*****************************************

      M A I N  F U N C T I O N

  *****************************************/
  for(let [index, user] of users.entries()){

    const username  = user.username,
          steam_id  = user.steam_id;
    let   appidarr  = [];

    // Get data of owned games for this user via steam-api
    const appids = await fun.fetchData({
      params: { key: apikey, steamid: user.steam_id, include_appinfo: 1, format: 'json'},
      url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
      format: 'json',
    });

    // We need to check for existence of the key if the ajax-request fails
    appidarr = appids.response.games || [];

    // Update Progress
    self.postMessage(Object.assign(message,{
      action: 'UpdateProgress',
      message: `Get Bot Games (${index+1}/${usercnt})`,
      percentage: (99/usercnt)*index,
    }));

    /***********************************************************************************
       Check for last run here, update the frontend with final progress and
       add the sum of all previous appids, which werent master to db ToDo: remove check Master
    ***********************************************************************************/

    if(msteamid !== steam_id){
      apparr = apparr.concat(buildAppArr(username, created, appidarr, steam_id));

      if(index === usercnt-1){
        idb.bulkAdd('users_games', apparr);
        self.postMessage(Object.assign(message,{
          action: 'UpdateProgress',
          message: `Action completed. Entries added to database.`,
          percentage: 100,
          status: 'done'
        }));
        return;    
      }
      continue;
    }

    /***********************************************************************************
       On Master-Accounts get more detailed data (only first Master-Account is targeted)
       since multiple Master-Accounts are not supported
    ***********************************************************************************/
    const compared  = await compareArray(steam_id);
    const session   = await stm.getSession('support', steam_id);
    let   results   = [];

    if(compared.length > 0){ // only if there are entries in db
      let build     = fun.objKeysToArr(appidarr, 'appid');
          build     = fun.symDiff(build, compared);
          appidarr  = fun.wipeObjByKeyVal(appidarr, build, 'appid');
    }

    // no user logged in or no session + no appids to iterate
    // this can happen even if one is logged in on Steam -> relogin
    if(!session || appidarr.length<=0){
      fun.consoleRgb('warn', `Your account isn't logged in on support site
      or there are no more games to get detailed timestamps for. Aborting
      getting data for Master.`, 1); continue; 
    }

    // turn each iterateValue into object
    const promises = fun.fetchChain({
      iterateValues: { appid: appidarr.map(item =>{ return item.appid }) },
      fetchOptions: {
        params: { sessionid: session, wizard_ajax: 1 },
        url: 'https://help.steampowered.com/en/wizard/HelpWithGame/en/',
        format: 'json'
      }
    });

    // Retrieve and insert data for Master
    for(const [i, item] of promises.entries()){

      const result  = await fun.fetchData(item);
      let   time    = (item) ? convResTime(result.html) : fun.dateToIso();
      let   dbArr   = buildAppArr(username, time, [{
        appid: item.params.appid,
        name: /t\s-\s(.*)/.exec(result.title)[1],
      }], steam_id);

      // Update Progress
      self.postMessage(Object.assign(message,{
        action: 'UpdateProgress',
        message: `Get Master Games (${i+1}/${promises.length})`,
        percentage: (100/promises.length)*i,
      }));

      idb.bulkAdd('users_games', dbArr);
      results.push(result);
    }

    // check if all entries got resolved/rejected - maybe ToDo
    if(results && results.length !== appidarr.length) console.log("Array mismatch");

  }



  function convResTime(response){

      // we can't use find in webworker => use regex to find times of games being added 
      const reg1 = /wlight_text">([a-zA-Z]{3}.{2,9})<.span/g, 
            reg2 = /span>([a-zA-z]{3}.{5,12})&nbsp/g;

      let html = response;
          html = (html.match(reg1) && html.match(reg1)[1]) ? reg1.exec(html.match(reg1)[1])[1] : reg2.exec(html.match(reg2)[0])[1],
          html = html.replace("&nbsp;-", ""),
          html = (html.length <= 6) ? (html+", "+(new Date()).getFullYear().toString()) : html,
          html = html+' GMT', // fix 1 day offset
          html = fun.dateToIso(html);

      return html;
  }



  function compareArray(steamid){
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