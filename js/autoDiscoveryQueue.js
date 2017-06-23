var sessionID = /sessionid=(.{24})/.exec(document.cookie)[1];

$(document).ready(function() {

  // Detect if Script is active
  /////////////////////////////
  chrome.runtime.sendMessage({greeting: 'getDiscoveryQueueStatus'}, function(stopme){
    if(document.location.href == "https://store.steampowered.com/login/?redir=explore%2F") {
      // Click first entry until none is left
      setTimeout(function(){
        if (stopme == 1) { 
          if ($('.names').length > 0) {
            $('.names:eq(0)').click();
          } else {
            // When finished reset queue-status
            chrome.runtime.sendMessage({greeting: 'setDiscoveryQueueStatusInactive'});
          }
        }
      }, 1500);
    } else if (document.location.href == "http://store.steampowered.com/explore/") {
      if (stopme == 1) {

        var cards_dropped = jQuery('.discovery_queue_winter_sale_cards_header h3').text().replace(/\D/g,'');

        function discQueue(){

          if (cards_dropped == '') {

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
                  location.reload();
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


          } else if(typeof cards_dropped == 'undefined'){
            chrome.runtime.sendMessage({greeting: 'setDiscoveryQueueStatusInactive'});
            alert('There was an error getting the left card-drops. Deactivating Discovery-Queue now!');
          } else if(cards_dropped >= 2){
            var user = $('#account_pulldown').text();
            chrome.runtime.sendMessage({
              greeting: 'setSkipForLogin',
              user: user
            }, function(response) {
              if (response == 1) {
                jQuery.post('https://store.steampowered.com/logout/', {
                  sessionid: sessionID
                });

                setTimeout(function(){
                  location.reload();
                }, 1000);
              }
            });
          }

        }

        // Execute
        discQueue();       

      }

    } else if (document.location.href == "http://store.steampowered.com/") {
      if (stopme == 1) {
        document.location = "https://store.steampowered.com/login/?redir=explore%2F";
      }
    }
  });
});


// Awards
/*var cards_left = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text().replace(/\D/g, '');
var cards_text = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text();
var cards_text_compare = "Sie können heute noch eine weitere Karte erhalten, indem Sie Ihre Entdeckungsliste erkunden.";
               jQuery('.discovery_queue_winter_sale_cards_header h3').text().replace(/\D/g,'');
jQuery.ajax({
  url: 'http://store.steampowered.com/SteamAwards/', 
  success: function(res){
    var awards = jQuery(res).find('.steamaward_castvote_writein');
    var arr = [];

  (function next(counter, maxLoops) {

    // all votes should be send now
    if(counter++ >= maxLoops){
      console.log("Voted! Iterating over Discovery-Queue now.");
      discQueue();
      return;
    }

    var scnt = 0;
    function processAjax(){
      scnt++;
      if(scnt <= 5){

        voteid = jQuery(awards[counter-1]).find('.vote_nominations').data('voteid');
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
            setTimeout(function(){ next(counter, maxLoops) }, 300);
          },
          error: function(xhr, textStatus, errorThrown){
            if(xhr.status == 403){
              setTimeout(function(){ next(counter, maxLoops) }, 300);
            } else {
              // probably some timeout - try again
              setTimeout(function(){ processAjax(); }, 3000);
            }
          }
        });

      } else {
        // to much retries
        scnt = 0; 
        setTimeout(function(){ next(counter, maxLoops) }, 300);  
      }
    }

    // Autostart on first iteration
    if(scnt <= 1) processAjax();

  })(0, awards.length);

  }
});

function discQueue(){

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
          location.reload();
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


  } else if(typeof cards_left == 'undefined'){
    chrome.runtime.sendMessage({greeting: 'setDiscoveryQueueStatusInactive'});
    alert('There was an error getting the left card-drops. Deactivating Discovery-Queue now!');
  } else if(cards_left == ''){
    var user = $('#account_pulldown').text();
    chrome.runtime.sendMessage({
      greeting: 'setSkipForLogin',
      user: user
    }, function(response) {
      if (response == 1) {
        jQuery.post('https://store.steampowered.com/logout/', {
          sessionid: sessionID
        });
        location.reload();
      }
    });
  }

}*/