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