// ==UserScript==
// @name         [steamground] - Add non-owned games to cart
// @namespace    https://github.com/Pandiora/
// @include      https://github.com/*
// @version      0.15
// @description  Add non-owned games to cart (DOES NOT WORK FOR DLC!) - YOU MUST BE LOGGED INTO STEAM - DEPENDS ON USER-ACCOUNT LOGGED INTO STEAM
// @author       Pandi
// @match        http://steamground.com/en/wholesale
// @updateURL    https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamground_remove_owned_games.user.js
// @downloadURL  https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamground_remove_owned_games.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var getOwnedData = '<a id="get_owned_data" href="#" style="position: fixed; top: 40%; transform: translateY(-260%); right: calc((100% - 940px)/2 - 140px); padding: 0 5px; background-color: #333; width: 140px; text-align: center;"><span style="font-size: 14px; line-height: 17px; padding: 2px; margin: 6px 0 0 0; background: #464646;">Get owned<br>games data</span></a>',
    addNonOwned = '<a id="add_non_owned_to_cart" href="#" style="position: fixed; top: 40%; transform: translateY(-150%); right: calc((100% - 940px)/2 - 140px); padding: 0 5px; background-color: #333; width: 140px; text-align: center;"><span style="font-size: 14px; line-height: 17px; padding: 2px; margin: 6px 0 0 0; background: #464646;">Add non-owned<br>to cart</span></a>',
    already_owned_btn = '<div style="height: 100%; width: 100%; background: blue; z-index: 1; position: relative; text-align: center; line-height: 30px; font-size: 20px;">Already owned</div>',
    out_of_stock_btn = '<div style="height: 100%; width: 100%; background: #ff000c; z-index: 1; position: relative; text-align: center; line-height: 30px; font-size: 20px;">Out of Stock</div>',
    spinner = '<span style="height: 40px; width: 40px; background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDBweCcgaGVpZ2h0PSc0MHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCIgY2xhc3M9InVpbC1kZWZhdWx0Ij48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgY2xhc3M9ImJrIj48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTFzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuOTE2NjY2NjY2NjY2NjY2NnMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoNjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC44MzMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSg5MCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjc1cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxMjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC42NjY2NjY2NjY2NjY2NjY2cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxNTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41ODMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxODAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyMTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC40MTY2NjY2NjY2NjY2NjY3cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNDAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4zMzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNzAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4yNXMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoMzAwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuMTY2NjY2NjY2NjY2NjY2NjZzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMzMCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjA4MzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PC9zdmc+);"></span>';

var owned_games = [],
    game_list_store = [],
    owned_games_index = [],
    non_owned_games_cart = [];

var startLoopClick = 0, // should be set to 100 if we need a second shopping-cart in case we need to add more than 100 items
    endLoopClick = 101; // must be set to 101 or 201 or 301 (101 for 1st shopping-cart, 201 for 2nd shopping-cart and so on)

var changed_game_titles = [
    { 'old': '1 Vs 1', 'new': 'Kick Speed : Global Operations ( KS : GO )' },
    { 'old': 'Crazy Fun - FootRock', 'new': 'FootRock'},
    { 'old': 'OR!', 'new': 'OR'},
    { 'old': 'Castle Werewolf 3D', 'new': 'Castle Werewolf'},
    { 'old': 'Ball of Light (Journey)', 'new': 'Ball of Light'},
    { 'old': 'Drop Hunt - Adventure Puzzle', 'new': 'Drop Hunt'},
    { 'old': 'Shake Your Money Simulator', 'new': 'Shake Your Money Simulator 2016' },
    { 'old': 'Spakoyno Back to the USSR 2.0', 'new': 'Spakoyno: Back to the USSR 2.0' }
];

jQuery(document).ready(function(){

    // Add buttons
    jQuery('.inner__tabs-controls').append(getOwnedData);
    jQuery('.inner__tabs-controls').append(addNonOwned);

    // When clicked get data for owned games
    jQuery(document).on('click', '#get_owned_data', function(){
        jQuery('#get_owned_data span').remove();
        jQuery('#get_owned_data').append(spinner);
        getOwnedGamesData();
    });

    // When clicked add non-owned games to cart
    jQuery(document).on('click', '#add_non_owned_to_cart', function(){
        addOwnedGamesToCart();
    });

});

function iterateOwnedGames(i){
    for(var j=0, k=owned_games_index.length; j<k; j++){
        if(typeof game_list_store[i] !== 'undefined' && typeof owned_games_index[j] !== 'undefined'){
            if(game_list_store[i].index == owned_games_index[j].index){
                // remove owned games from helper-array
                non_owned_games_cart.splice(i, 1);
                return;
            }
        }
    }
}

function addOwnedGamesToCart(){

    // Just a helper to remove already owned games
    non_owned_games_cart = game_list_store;

    // count backwards to not fuck up indices
    for (var i = game_list_store.length; i >= 0; i--) {
        // iterate through already-owned-games (based on store-games)
        iterateOwnedGames(i);
    }

    console.log("There are "+non_owned_games_cart.length+" games you don't own.");

    // Show Spinner while working
    jQuery('#add_non_owned_to_cart span').remove();
    jQuery('#add_non_owned_to_cart').append(spinner);

    // We need a delayed for-loop since the pages API is badly coded
    (function next(counter, maxLoops) {

        // all items should be selected now
        if(counter++ >= maxLoops || counter >= endLoopClick){
            // we're done, remove spinner
            jQuery('#add_non_owned_to_cart').remove();
            return;
        }

        // Click function with timeout to start next iteration
        function processClicks(){
            jQuery('.wholesale-card:eq('+(non_owned_games_cart[non_owned_games_cart.length-counter].index)+') a').click();
            setTimeout(function(){ next(counter, maxLoops); }, 1000);
        }

        // Execute Click
        processClicks();

    })(startLoopClick, non_owned_games_cart.length);
}

function getOwnedGamesData(){

    var len = jQuery('.wholesale-card').length, arr = [];

    // Iterate through all displayed game-"cards"
    while(len--){

        // If not out-of-stock add to array
        if(jQuery('.wholesale-card:eq('+len+') .wholesale-card_price').text().replace(/\s/g, '') != 'outofstock'){
            game_list_store.push({
                'index': len,
                'title': jQuery('.wholesale-card:eq('+len+') .wholesale-card_title').text()
            });
        } else {
            // If out of stock add label for Out of Stock
            jQuery('.wholesale-card:eq('+len+')').append(out_of_stock_btn);
        }
    }

    // Get owned games from Steam (my automatically gets users logged in profile)
    GM_xmlhttpRequest({
        method: "GET",
        url: 'http://steamcommunity.com/my/games/?tab=all',
        onload: function(response){

            var data = jQuery(response.responseText).find('#global_header + script + div > script')[0].innerHTML;
            data = JSON.parse(data.match(/\srgGames\s=\s(.*);\s*var/)[1]);

            // Gamelist
            //console.log(data);

            for(var i=0, l=data.length; i<l; i++){
                owned_games.push({
                    'title': data[i].name,
                    'appid': data[i].appid
                });
            }
            labelOwnedGames(game_list_store, owned_games);
        }
    });
}

function labelOwnedGames(shop_game, owned_games){

    // Iterate through all games which are in stock
    for(var i=0, l=shop_game.length; i<l; i++){

        // Check for owned games
        for(var j=0, k=owned_games.length; j<k; j++){

            var shp_title = shop_game[i].title,
                stm_title = owned_games[j].title;

            for(var s=0, n=changed_game_titles.length; s<n; s++){
                if(changed_game_titles[s].old == shp_title){
                    shp_title = changed_game_titles[s].new;
                }
            }

            var shop_title = shp_title.toUpperCase().replace(/\s/g, ''),
                steam_title = stm_title.toUpperCase().replace(/\s/g, ''),
                shop_length = shop_title.length,
                steam_length = steam_title.length;

            // Check title, make all letters upper case first and remove white-spaces for better comparison
            if((shop_title == steam_title)){

                // Games you own (by index)
                owned_games_index.push({
                    'title': shp_title,
                    'index': shop_game[i].index
                });

                // Add Label for Already Owned
                jQuery('.wholesale-card:eq('+shop_game[i].index+')').append(already_owned_btn);
            }
        }
    }

    // we're done, remove spinner
    jQuery('#get_owned_data').remove();
}