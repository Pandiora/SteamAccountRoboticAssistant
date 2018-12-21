function getSteamBadges(message){

  // array with all games having trading-cards
  var arr = [],
  created = fun.dateToIso(); // current datetime

  // announce process-start
  self.postMessage(Object.assign(message,{
    action: 'UpdateProgress',
    message: 'Fetching Data ...',
    percentage: 0
  }));

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

      self.postMessage(Object.assign(message,{
        action: 'UpdateProgress',
        message: 'Inserting into Database ...',
        percentage: 50
      }));
    },
    error: (err)=>{
      self.postMessage(Object.assign(message,{
        action: 'UpdateProgress',
        message: "Can't get data from steam.tools"+err,
        percentage: 100,
        status: 'done'
      }));
    }

  }).done(()=>{

    idb.opendb().then((db)=>{
      db.transaction('rw', db.steam_badges, function*(){
        db.steam_badges.bulkAdd(arr).then((lastKey)=> {
          self.postMessage(Object.assign(message,{
            action: 'UpdateProgress',
            message: 'Process finished',
            percentage: 100,
            status: 'done'
          }));
        }).catch(Dexie.BulkError, (e)=>{
          self.postMessage(Object.assign(message,{
            action: 'UpdateProgress',
            message: `Duplicates-Entrys: ${e.failures.length}`,
            percentage: 100,
            status: 'done'
          }));
        });
      }).catch((err)=>{
        console.log(err);
        console.error(err.length);
      }).finally(()=>{
        self.close();
        db.close();
      });
    });

  });
}