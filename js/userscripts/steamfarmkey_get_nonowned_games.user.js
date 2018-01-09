// ==UserScript==
// @name         [steamfarmkey] - Get non-owned games
// @namespace    https://github.com/Pandiora/
// @include      https://github.com/*
// @version      0.31
// @description  Get non-owned steam-games for currently logged in steam-user
// @author       Pandi
// @match        http://steamfarmkey.ru/*
// @updateURL    https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamfarmkey_get_nonowned_games.user.js
// @downloadURL  https://github.com/Pandiora/SteamAccountRoboticAssistant/raw/master/js/userscripts/steamfarmkey_get_nonowned_games.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var exclude_dlc  = 1, // 1 means exclude dlc
    max_price = 10, // select all games below this price (RUB)
    dlc_category = '1186', // dlc-category class-ID (tr-element before the tr.goods)
    exclude_cat = [], // more categories to be excluded
    override_id = '', // for overriding the standard steam-id (currently logged in user), can be the custom-url (only the custom part of it) or SteamID(64) [expecting the custom-url to be not just numeric lel]
    changed_game_titles = [
        {
            'shop': 'Liveza Death of the Earth',
            'steam': 'Liveza: Death of the Earth'
        }
    ],
//
//
//
//
//
//
//
//
//
//
//
// DO NOT TOUCH - NO CHANGE NEEDED HERE
//////////////////////////////////////////////////////////////////////////////////////////
    results = [],
    getOwnedData = '<div id="ownedGames" style="position:fixed;top:40%;left:10%;height:113px;width:377px;padding:5px;border:5px black;background:#333;color: #fff;"><div style="float: left; width: 200px"><label><input id="dlc_checked" type="checkbox" style="display: inline-block;" '+((exclude_dlc === 1) ? 'checked' : '')+'/> No DLC (Cat-ID): <input id="dlc_id" type="text" value="'+dlc_category+'" style="background: #333;" /></label><label>Max Price (RUB): <input id="max_price" type="text" value="'+max_price+'" style="background: #333;" /></label></div><div style="float: right; width: 150px"><button id="start_meh" style="margin: 5px 5px 0 0;background: #333;color: #fff;">Get Data of Owned Games</button></div><div id="close_me" style="top: 81%;left: 43%;position: relative;font-size: 20px;cursor: pointer;">x</div></div>',
    spinner = '<span id="spinner" style="display: block;height: 75px; width: 75px; background-repeat: no-repeat; background-position: center center; background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNDBweCcgaGVpZ2h0PSc0MHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCIgY2xhc3M9InVpbC1kZWZhdWx0Ij48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgY2xhc3M9ImJrIj48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTFzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuOTE2NjY2NjY2NjY2NjY2NnMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoNjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC44MzMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSg5MCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjc1cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxMjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC42NjY2NjY2NjY2NjY2NjY2cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxNTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41ODMzMzMzMzMzMzMzMzM0cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgxODAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC41cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyMTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC40MTY2NjY2NjY2NjY2NjY3cycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNDAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4zMzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PHJlY3QgIHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjMDBiMmZmJyB0cmFuc2Zvcm09J3JvdGF0ZSgyNzAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPiAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0nb3BhY2l0eScgZnJvbT0nMScgdG89JzAnIGR1cj0nMXMnIGJlZ2luPSctMC4yNXMnIHJlcGVhdENvdW50PSdpbmRlZmluaXRlJy8+PC9yZWN0PjxyZWN0ICB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzAwYjJmZicgdHJhbnNmb3JtPSdyb3RhdGUoMzAwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4gIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9J29wYWNpdHknIGZyb209JzEnIHRvPScwJyBkdXI9JzFzJyBiZWdpbj0nLTAuMTY2NjY2NjY2NjY2NjY2NjZzJyByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPjwvcmVjdD48cmVjdCAgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyMwMGIyZmYnIHRyYW5zZm9ybT0ncm90YXRlKDMzMCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+ICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSdvcGFjaXR5JyBmcm9tPScxJyB0bz0nMCcgZHVyPScxcycgYmVnaW49Jy0wLjA4MzMzMzMzMzMzMzMzMzMzcycgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz48L3JlY3Q+PC9zdmc+);"></span>';

jQuery(document).ready(function(){

    // Add buttons
    jQuery('.selected-classifieds').append(getOwnedData);

    // find categories
    jQuery(document).on('click', '#start_meh', function(){
        jQuery('#start_meh').remove();
        jQuery('#ownedGames div:nth-child(2)').append(spinner);

        // Set chosen values
        exclude_dlc = jQuery('#dlc_checked').prop('checked');
        if(exclude_dlc == 1) exclude_cat.push(jQuery('#dlc_id').val());
        max_price = jQuery('#max_price').val();

        // Start
        getCategories(exclude_cat);
    });

    jQuery(document).on('click', '#results', function(){
        var csv = getGameNames(results);
        download(csv, 'games.csv', 'octet-stream');
    });

    jQuery(document).on('click', '#close_me', function(){
        jQuery('#ownedGames').remove();
    });

});


function getCategories(exclude_cat){
    var len = jQuery('tbody:eq(0) tr[class*="cat_"]').length,
        cat_id = '', arr = [];

    for(var i=0; i<len; i++){
        cat_id = jQuery('tbody:eq(0) tr[class*="cat_"]:eq('+i+')').attr('class').split(' ')[1].replace('cat_', '');

        if(jQuery.inArray(cat_id, exclude_cat)){
            arr.push(cat_id);
        }
    }

    console.log(len+' categories '+arr.length+' added and '+exclude_cat.length+' excluded');
    getGoods(arr);
}

function getGoods(categories){
    var goods_len = 0,
        goods_name = '',
        goods_price = '',
        goods_obj = {},
        len = categories.length,
        arr = [];

    for(var i=0; i<len; i++){
        goods_len = jQuery('.cat_'+categories[i]).nextUntil('tr.cat_tr', 'tr.goods').length;

        if(goods_len > 0){
            goods_obj = jQuery('.cat_'+categories[i]).nextUntil('tr.cat_tr', 'tr.goods');

            for(var j=0; j<goods_len;j++){
                goods_name = goods_obj.eq(j).find('td a').text();
                goods_price = parseFloat(goods_obj.eq(j).find('td:nth-child(3)').text());

                if(goods_price < max_price){ // only select below set max-price

                    arr.push({
                        title: goods_name,
                        price: goods_price
                    });
                }
            }
        }
    }

    getOwnedGamesData(arr);
}

function getOwnedGamesData(shopGames){

    var owned_games = [];
    var steam_url = 'my';

    if(override_id.length > 0) steam_url = (!isNaN(parseFloat(override_id)) && isFinite(override_id)) ? 'profiles/'+override_id : 'id/'+override_id;

    // Get owned games from Steam (my automatically gets users logged in profile)
    GM_xmlhttpRequest({
        method: "GET",
        url: 'http://steamcommunity.com/'+steam_url+'/games/?tab=all',
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

            compareGames(shopGames, owned_games);
        }
    });
}

function compareGames(shopGames, ownedGames){

    // set this bit to determine which games we don't own
    var owned_bit = 0, non_owned_games = [], prices_sum = 0;

    // Iterate through all games which are in stock
    for(var i=0, l=shopGames.length; i<l; i++){

        // needs to be reset on every step
        owned_bit = 0;

        // Check for owned games
        for(var j=0, k=ownedGames.length; j<k; j++){

            // Debug Game-Titles
            //console.log('Shop-Index: '+shop_game[i].index+' Owned-Index: '+owned_games[j].title);

            // declare the titles
            var shop_title = shopGames[i].title,
                steam_title = ownedGames[j].title;

            // shop-titles can be wrong - use the correct version
            for(var o=0, p=changed_game_titles.length; o<p; o++){
                if(changed_game_titles[o].shop === shop_title){
                    shop_title = changed_game_titles[o].steam;
                    break;
                }
            }

            // make all letters upper case first and remove white-spaces for better comparison
            shop_title = shop_title.toUpperCase().replace(/\s/g, '');
            steam_title = steam_title.toUpperCase().replace(/\s/g, '');

            // Check titles
            if(shop_title === steam_title){
                // Found it! add owned game to array
                owned_bit = 1;
                // We can stop this iteration
                break;
            }
        }

        // if we don't own the game -> add to separate array
        if(owned_bit === 0){

            // hightlight the columns for non-owned games
            // :contains wasn't exact enough -> use own function (https://stackoverflow.com/questions/15364298/select-element-by-exact-match-of-its-content)
            $('a:textEquals("'+shopGames[i].title+'")').parent().parent().css({'background-color': 'green','color': 'white'});
            $('a:textEquals("'+shopGames[i].title+'")').css({'background-color': 'green','color': 'white'});

            non_owned_games.push({
                'title': shopGames[i].title,
                'price': shopGames[i].price
            });
        }
    }

    for(var s=0, m=non_owned_games.length; s<m; s++){
        prices_sum += non_owned_games[s].price;
    }

    var appendme = '<div style="display: inline-block;">Non-Owned Games: '+non_owned_games.length+'</div><div>Price Sum: '+Math.round(prices_sum)+'</div><button id="results" style="margin: 5px 5px 0 0;background: #333;color: #fff;">Download Results</button>';
    jQuery('#spinner').remove();
    jQuery('#ownedGames div:nth-child(2)').append(appendme);

    results = non_owned_games;
}

function getGameNames(results){
    var str = '';

    for(var i=0, l=results.length; i<l;i++){
        str += (results[i].title+',');
    }

    str = str.substring(0, str.length - 1);
    return str;
}

$.expr[':'].textEquals = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().match("^" + arg + "$");
    };
});

function download(content, filename, contentType)
{
    if(!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], {'type':contentType});
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
}