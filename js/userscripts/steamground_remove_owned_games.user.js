// ==UserScript==
// @name         [steamground] - Add non-owned games to cart
// @namespace    https://github.com/Pandiora/
// @include      https://github.com/*
// @version      0.16
// @description  Add non-owned games to cart (DOES NOT WORK FOR DLC!) - YOU MUST BE LOGGED INTO STEAM - DEPENDS ON USER-ACCOUNT LOGGED INTO STEAM
// @author       Pandi
// @match        http://steamground.com/en/wholesale
// @updateURL    https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamground_remove_owned_games.user.js
// @downloadURL  https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamground_remove_owned_games.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

//
// C O N F I G
////////////////////////////////////////

/*

E X P L A N A T I O N

You can only add keys for 100 different games to your cart and this could lead
to problems, if you can't immediately activate all keys, then check again for
owned games and so forth.

There are two parameters for this, which you need to adjust:

startLoopClick: normally starts with first item, but if you want a 2nd shopping-cart,
since you don't own more than 100 games (based on shop-games), you should set this to
100 for the 2nd shopping-cart, 200 for the 3rd ... and so forth.

endLoopClick: Also depending on your shooping-cart you need to set this +101 depending
on your startLoopClick. Why +101? Because like mentioned before, you can only have
100 different items in your shopping-cart. Why 101 instead of 100? Brbl.

*/
var startLoopClick = 0,
    endLoopClick = 101;




// DON'T TOUCH THE OTHER CODE
// IF YOU DON'T KNOW WHAT YOU'RE DOING
////////////////////////////////////////
var getOwnedData = '<a id="get_owned_data" href="#" style="position: fixed; top: 40%; transform: translateY(-150%); right: calc((100% - 940px)/2 - 140px); padding: 0 5px; background-color: #333; width: 140px; text-align: center;"><span style="font-size: 14px; line-height: 17px; padding: 2px; margin: 6px 0 0 0; background: #464646;">Get owned<br>games data</span></a>',
    addNonOwned = '<a id="add_non_owned_to_cart" href="#" style="display: none; position: fixed; top: 40%; transform: translateY(-150%); right: calc((100% - 940px)/2 - 140px); padding: 0 5px; background-color: #333; width: 140px; text-align: center;"><span style="font-size: 14px; line-height: 17px; padding: 2px; margin: 6px 0 0 0; background: #464646;">Add non-owned<br>to cart</span></a>',
    already_owned_btn = '<div style="height: 100%; width: 100%; background: blue; z-index: 1; position: relative; text-align: center; line-height: 30px; font-size: 20px;">Already owned</div>',
    out_of_stock_btn = '<div style="height: 100%; width: 100%; background: #ff000c; z-index: 1; position: relative; text-align: center; line-height: 30px; font-size: 20px;">Out of Stock</div>',
    spinner = '<span style="height: 40px; width: 40px; background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDBweCcgaGVpZ2h0PSc0MHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCIgY2xhc3M9InVpbC1kZWZhdWx0Ij48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgY2xhc3M9ImJrIj48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTFzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuOTE2NjY2NjY2NjY2NjY2NnMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoNjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC44MzMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSg5MCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjc1cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxMjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC42NjY2NjY2NjY2NjY2NjY2cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxNTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41ODMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxODAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyMTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC40MTY2NjY2NjY2NjY2NjY3cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNDAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4zMzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNzAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4yNXMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoMzAwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuMTY2NjY2NjY2NjY2NjY2NjZzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMzMCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjA4MzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PC9zdmc+);"></span>';

var owned_games = [],
    game_list_store = [],
    owned_games_index = [],
    non_owned_games_cart = [];

var changed_game_titles = [
    {
        'shop': '1 Vs 1',
        'steam': 'Kick Speed : Global Operations ( KS : GO )'
    },
    {
        'shop': 'Crazy Fun - FootRock',
        'steam': 'FootRock'
    },
    {
        'shop': 'OR!',
        'steam': 'OR'
    },
    {
        'shop': 'Castle Werewolf 3D',
        'steam': 'Castle Werewolf'
    },
    {
        'shop': 'Ball of Light (Journey)',
        'steam': 'Ball of Light'
    },
    {
        'shop': 'Drop Hunt - Adventure Puzzle',
        'steam': 'Drop Hunt'
    },
    {
        'shop': 'Shake Your Money Simulator',
        'steam': 'Shake Your Money Simulator 2016'
    },
    {
        'shop': 'Spakoyno Back to the USSR 2.0',
        'steam': 'Spakoyno: Back To USSR 2.0'
    },
    {
        'shop': 'The Orb Chambers™',
        'steam': 'The Orb Chambers'
    },
    {
        'shop': 'The Last Hope: Trump vs Mafia',
        'steam': 'The Last Hope Trump vs Mafia'
    }
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

function addOwnedGamesToCart(){

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

    // set this bit to determine which games we don't own
    var owned_bit = 0;

    // Iterate through all games which are in stock
    for(var i=0, l=shop_game.length; i<l; i++){

        // needs to be reset on every step
        owned_bit = 0;

        // Check for owned games
        for(var j=0, k=owned_games.length; j<k; j++){

            // Debug Game-Titles
            //console.log('Shop-Index: '+shop_game[i].index+' Owned-Index: '+owned_games[j].title);

            // declare the titles
            var shop_title = shop_game[i].title,
                steam_title = owned_games[j].title;

            // shop-titles can be wrong - use the correct version
            for(var s=0, n=changed_game_titles.length; s<n; s++){
                if(changed_game_titles[s].shop == shop_title){
                    shop_title = changed_game_titles[s].steam;
                    break;
                }
            }

            // make all letters upper case first and remove white-spaces for better comparison
            shop_title = shop_title.toUpperCase().replace(/\s/g, '');
            steam_title = steam_title.toUpperCase().replace(/\s/g, '');

            // Check titles
            if(shop_title == steam_title){

                // Found it! add owned game to array
                owned_bit = 1;

                // Games you own (by index)
                owned_games_index.push({ 'index': shop_game[i].index });

                // Add Label for Already Owned
                jQuery('.wholesale-card:eq('+shop_game[i].index+')').append(already_owned_btn);

                break;
            }
        }

        // if we don't own the game -> add to separate array
        if(owned_bit === 0){
            non_owned_games_cart.push({
                'title': shop_game[i].title,
                'index': shop_game[i].index
            });
        }
    }

    // we're done, remove spinner
    jQuery('#get_owned_data').remove();
    // we can display add-to-cart now
    jQuery('#add_non_owned_to_cart').show();
}