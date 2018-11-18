gDA = {

    // this class is chronologically, except for HTML-Decode
    // At first we need to try to get dates for games added, by getting the license-list
    // from accountdetails, since we can cut out a potentially huge load of games and save time

    getAccDetails: function(){
        $.ajax({
            type: 'GET',
            url: 'https://store.steampowered.com/account/licenses/?l=english', // important l=english as param, to get same date-format
            success: function(res){

                var data = $(res).find('.account_table')[0],
                    len = $(data).find("tbody  tr").length, 
                    title = '', date = '', arr = [];

                for(var i=1;i<len;i++){ // start at 1, since 0 is table-header

                    title = $(data).find('tbody  tr:eq('+(i+1)+') td:eq(1)').text().replace(/\s\s+/g, ''); // titles include whitespaces before and after - remove them
                    date = $(data).find('tbody  tr:eq('+(i+1)+') td:eq(0)').text();

                    // we need to decode the html-entities for the title several times (Steam-Fuckup)
                    // since we're only using english date-"format" we can tell moment.js which one to use
                    // turn the date-format into UNIX-Timestamp -> time gets set to 12:00:00
                    arr.push({
                        'title': gDA.htmlDecode(title,3),
                        'date': moment(date, 'DD MMMM, YYYY').format('YYYY-MM-DD hh:mm:ss')
                    });
                }

                // start to compare games with our extension-db and find matching titles
                // if titles match, add the date of purchase or license-activation to db
                gDA.getDateAdded(arr);
            }
        });
    },

    // at second we compare the list we got before with our database

    getDateAdded: function(array){
        // array to store not found appid and title
        var arr_not_found = [], sessionID = '';

        idb.getMasterRecord().done(function(user){
            idb.opendb().then(function(db){
                db.transaction('rw', 'users_games', function(){
                    db.users_games.where('steam_id').equals(user.steam_id).each(function(game){

                        // No need to loop through, if we already got an added-timestamp
                        if(typeof game.added === 'undefined' || game.added === ''){

                            var len = array.length,
                                db_title = game.game_name.toUpperCase().replace(/\s/g, ''),
                                acc_title = '',
                                alt_title = '', 
                                not_found = 1;

                            // loop through array we got from acc-details and compare titles
                            for(var i=0;i<len;i++){

                                // format the title we got from license-page of our account
                                acc_title = array[i].title.toUpperCase().replace(/\s/g, '');

                                // find matching titles and add date (added) to our db
                                // we compare them by removing white-spaces and make them upper-case
                                if(db_title == acc_title){
                                    not_found = 0; // overwrite this bit, so we can skip the next loop
                                    db.users_games.update(game.id, {added: array[i].date});
                                    break;
                                }
                            }

                            // Store-Titles and API-Titles (the ones in our db) can be slightly different
                            // but the Store-Title lets us search by appid but mostly has the same title
                            // as the one we got from acc-details
                            if(not_found == 1){
                                arr_not_found.push(game.id);
                            }
                        }

                    }).then(function(){

                        if(arr_not_found.length){

                            // Get the sessionID for Help-Page first, before we begin
                            $.ajax({
                                method: "GET",
                                url: "https://help.steampowered.com/en/",
                                success: function(res){

                                    // get sessionID from document-body
                                    var script = $(res).find('#global_header + .responsive_page_template_content > .page_body_ctn + script')[0],
                                        script = $(script).text(),
                                        sessionID = /g_sessionID\s\=\s\"(.*)\";/.exec(script)[1];

                                    // Now we can start
                                    gDA.titleNotFound(array, arr_not_found, sessionID); 
                                }
                            });

                        } else {
                            console.log('Done!');
                        }
                    });
                }).catch(function(err){
                    console.log(err);
                }).finally(function(){
                    db.close();
                });
            });
        });
    },

    // probably there will be some titles we can't find via account-details
    // and we have to hax by searching help.steampowered for those games by appid
    // why not doing it in first place? IT IS SLOW AF

    titleNotFound: function(array, arr, sessionID){

        (function next(counter, maxLoops) {

            // all database-entries should be worked on now
            if(counter++ >= maxLoops){
                console.log('Done!');
                return;
            }

            // Function with timeout to start next iteration to not spam VALVe-Servers
            // else we will get temp-banned
            idb.opendb().then(function(db){
                db.transaction('rw', 'users_games', function(){
                    db.users_games.where('id').equals(arr[counter-1]).first(function(game){

                        $.ajax({
                            method: "GET",
                            url: "https://help.steampowered.com/en/wizard/HelpWithGame/?appid="+game.app_id+"&sessionid="+sessionID+"&wizard_ajax=1",
                            success: function(res){

                                // Do not load images - else we will get problems with to much requests to one dest
                                res = res.html.replace(/<img[^>]*>/g,"");

                                // find the date and modify it for db-use
                                var date = $(res)[6],
                                    dateex = $(date).find('.account_details div:eq(2) span:eq(1)').text();

                                // some games are part of bundles and will be displayed differently
                                // somtimes the API provides games which are no longer in our lib and we need to check if
                                // the class LineItemRow exists - else we will return unix start-time
                                if(dateex == ''){
                                    dateex = $(date).find('.LineItemRow').length;
                                    dateex = (dateex !== 0) ? /\s*(.*)\s-/.exec($(date).find('.LineItemRow').text())[1] : "Jan 1, 1970";
                                }

                                console.log('Game: '+game.game_name+' Date: '+dateex+' Appid: '+game.app_id);
                                    dateex = moment(dateex, "MMMM DD, YYYY").format('YYYY-MM-DD hh:mm:ss');

                                // update game date-added
                                gDA.dateAddedToDB(game.id, dateex);

                                // start next iteration
                                // sorry, huge timeout, else chrome stalls our connections
                                setTimeout(function(){ next(counter, maxLoops); }, 5000);
                            }
                        });
                    });
                }).catch(function(err){
                    console.log(err);
                }).finally(function(){
                    db.close();
                });
            });
        })(0, arr.length);
    },

    // if we found some games via help.steampowered, we can update our 
    // database with the right timestamp

    dateAddedToDB: function(gameid, date){

        // this step needs to be seperated, since our AJAX-Calls to help.steampowered
        // can take very long and there will be conflicts with promises
        idb.opendb().then(function(db){
            db.transaction('rw', 'users_games', function(){
                db.users_games.update(gameid, {added: date});
            }).catch(function(err){
                console.log(err);
            }).finally(function(){
                db.close();
            });
        });
    },

    htmlDecode: function(string, pass){
        while(pass--){ string=jQuery('<div/>').html(string).text(); }
        return string;
    }
}

// E X E C U T E
gDA.getAccDetails();