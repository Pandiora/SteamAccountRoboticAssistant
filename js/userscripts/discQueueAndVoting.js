// ==UserScript==
// @name         Steam Auto-Discovery-Queue + Voting
// @namespace    http://steam.com
// @version      0.1
// @description  First vote for every available award randomly and then iterate over discovery-queue until no cards are left.
// @author       Pandi
// @match        http://store.steampowered.com/
// @match        http://store.steampowered.com/explore/
// @updateURL    https://raw.githubusercontent.com/Mottie/js//master/github-code-colors.user.js
// @downloadURL  https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if(location.href == 'http://store.steampowered.com/'){

        jQuery('#global_action_menu').append('\
        <div class="header_installsteam_btn header_installsteam_btn_gray "> \
        <div class="header_installsteam_btn_leftcap" \
        style="background-image: url(\'http://store.akamai.steamstatic.com/public/images/v6/search_icon_btn_over.png\'); \
        background-size: 13px; background-repeat: no-repeat; background-position: center center;"></div> \
        <a class="header_installsteam_btn_content" href="http://store.steampowered.com/explore/#auto-queue">Start Disc-Queue</a></div> \
       ');

    } else if(location.href == 'http://store.steampowered.com/explore/#auto-queue'){

        // Actual script to iterate discovery-queue and vote for all available awards
        var sessionID = /sessionid=(.{24})/.exec(document.cookie)[1];

        jQuery.ajax({
            url: 'http://store.steampowered.com/SteamAwards/',
            success: function(res){
                console.log(res);
                var awards = jQuery(res).find('.steamaward_castvote');
                var arr = [];

                (function next(counter, maxLoops) {

                    // all votes should be send now
                    if(counter++ >= maxLoops){
                        discQueue();
                        return;
                    }

                    var scnt = 0;
                    function processAjax(){
                        scnt++;
                        if(scnt <= 5){

                            var voteid = jQuery(awards[counter-1]).find('.vote_nominations').data('voteid');
                            jQuery(awards[counter-1]).find('.vote_nomination').map(function(){
                                arr.push(jQuery(this).data('vote-appid'));
                            });

                            jQuery.ajax({
                                url: 'http://store.steampowered.com/salevote',
                                type: 'POST',
                                data: {
                                    sessionid: sessionID,
                                    voteid: voteid,
                                    appid: arr[Math.floor(Math.random()*arr.length)]
                                },
                                success: function(response){
                                    console.log(response);
                                    scnt = 0; arr = [];
                                    setTimeout(function(){ next(counter, maxLoops); }, 300);
                                },
                                error: function(){
                                    // probably some timeout - try again
                                    setTimeout(function(){ processAjax(); }, 3000);
                                }
                            });

                        } else {
                            // to much retries
                            scnt = 0;
                            setTimeout(function(){ next(counter, maxLoops); }, 300);
                        }
                    }

                    // Autostart on first iteration
                    if(scnt <= 1) processAjax();

                })(0, awards.length);

            }
        });

        function discQueue(){
            var cards_left = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text().replace(/\D/g, '');
            var cards_text = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text();
            var cards_text_compare = "Sie können heute noch eine weitere Karte erhalten, indem Sie Ihre Entdeckungsliste erkunden.";
            if ((cards_left > 0 && cards_left !== '') || (cards_text == cards_text_compare)) {
                var GenerateQueue = function(queueNumber) {
                    console.log('Queue #' + ++queueNumber);

                    jQuery.post('http://store.steampowered.com/explore/generatenewdiscoveryqueue', {
                        sessionid: sessionID,
                        queuetype: 0
                    }).done(function(data) {
                        var requests = [];

                        for (var i = 0; i < data.queue.length; i++) {
                            requests.push(jQuery.post('http://store.steampowered.com/app/10', {
                                appid_to_clear_from_queue: data.queue[i],
                                sessionid: sessionID
                            }));
                        }

                        jQuery.when.apply(jQuery, requests).done(function() {
                            if (queueNumber < 3) {
                                GenerateQueue(queueNumber);
                            } else {
                                location.href = 'http://store.steampowered.com/explore/#auto-queue-done';
                            }
                        });
                    }).fail(function() {
                        setTimeout(function() {
                            GenerateQueue(0);
                        }, 1000);
                    });
                };
                setTimeout(function() {
                    GenerateQueue(0);
                }, 1000);

                setTimeout(function() {
                    location.reload();
                }, 10000);
            } else {
                console.log('Already done or error.');
            }
        }
    } else {
      // ignore other sites
    }
})();