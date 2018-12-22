function addMissingBadgesEntries(message){
  // post=true is used for users_badges action on frontend to fetch users badges
  // post=false is used to distribute cards to bots
  console.log(message);
  const arr = message.parameters[0];
  const post = message.parameters[1] || 0;
  var len = arr.length;

  (function next(counter, maxLoops) {

    // Finally insert missing entries
    if (counter++ >= maxLoops){
      setTimeout(()=>{
        idb.opendb().then((db)=>{
          db.transaction("rw", 'steam_badges', ()=>{
            db.steam_badges.bulkAdd(arr).then((lastKey)=> {
              if(post) self.postMessage(Object.assign(message,{
                action: 'UpdateProgress',
                message: 'Added missing entries. Done!',
                percentage: 100,
                status: 'done'
              }));
            }).catch(Dexie.BulkError, (e)=>{
              if(post) self.postMessage(Object.assign(message,{
                action: 'UpdateProgress',
                message: `Duplicates-Entrys: ${e.failures.length}`,
                percentage: 100,
                status: 'done'
              }));
            });
          }).catch((err)=>{
            console.error(err);
          }).finally(()=>{
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