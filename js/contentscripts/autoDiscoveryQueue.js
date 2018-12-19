$(document).ready(function() {

  // Detect if Script is active
  /////////////////////////////
  chrome.runtime.sendMessage({greeting: 'getDiscoveryQueueStatus'}, function(stopme){
    if(document.location.href == "https://store.steampowered.com/login/?redir=explore%2F%3Fl%3Denglish" ||
      document.location.href == "https://store.steampowered.com/login/?redir=explore%2F%3Fl%3Denglish&redir_ssl=1") {
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
    } else if (document.location.href == "https://store.steampowered.com/explore/?l=english"){
      if (stopme == 1) {

        var sessionID = /sessionid=(.{24})/.exec(document.cookie)[1];
        discQueue();
        /*jQuery.ajax({
          url: 'http://store.steampowered.com/SteamAwards/', 
          success: function(res){
            var awards = jQuery(res).find('.steamaward_castvote');
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
        });*/

        function discQueue(){

          var cards_dropped = jQuery('.discovery_queue_winter_sale_cards_header h3').text().replace(/[+-]?\b\d+\b/g,'');
          var cards_remaining = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text().replace(/[+-]?\b\d+\b/g,'');

          // cards_dropped == '' for the beginning of the sale when there is no number on cards dropped
          // ((cards_dropped%3 == 0) && (cards_remaining != '')) for day 2 and next days of sale
          // ((cards_remaining != '') && (cards_remaining >= 2)) for day 2 and next days of sale

          if(
            (jQuery('.discovery_queue_winter_sale_cards_header .subtext').text() !== 'Come back tomorrow to earn more cards by browsing your Discovery Queue!')
          ){

            var GenerateQueue = function(queueNumber) {
            console.log('Queue #' + ++queueNumber);

            jQuery.post('https://store.steampowered.com/explore/generatenewdiscoveryqueue', {
              sessionid: sessionID,
              queuetype: 0
            }).done(function(data) {
              var requests = [];

              for (var i = 0; i < data.queue.length; i++) {
                requests.push(jQuery.post('https://store.steampowered.com/app/10', {
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
          } else {
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
              } else {
                alert("There is a problem with your username!");
              }
            });
          }

        }
      }

    } else if (document.location.href == "http://store.steampowered.com/") {
      if (stopme == 1) {
        document.location = "https://store.steampowered.com/login/?redir=explore%2F%3Fl%3Denglish";
      }
    }
  });
});


// Awards
// var cards_left = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text().replace(/\D/g, '');
/*var cards_text = jQuery('.discovery_queue_winter_sale_cards_header .subtext').text();
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
/*!
 * JavaScript Cookie v2.2.0
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
  var registeredInModuleLoader;
  if (typeof define === 'function' && define.amd) {
    define(factory);
    registeredInModuleLoader = true;
  }
  if (typeof exports === 'object') {
    module.exports = factory();
    registeredInModuleLoader = true;
  }
  if (!registeredInModuleLoader) {
    var OldCookies = window.Cookies;
    var api = window.Cookies = factory();
    api.noConflict = function () {
      window.Cookies = OldCookies;
      return api;
    };
  }
}(function () {
  function extend () {
    var i = 0;
    var result = {};
    for (; i < arguments.length; i++) {
      var attributes = arguments[ i ];
      for (var key in attributes) {
        result[key] = attributes[key];
      }
    }
    return result;
  }

  function init (converter) {
    function api (key, value, attributes) {
      if (typeof document === 'undefined') {
        return;
      }

      // Write

      if (arguments.length > 1) {
        attributes = extend({
          path: '/'
        }, api.defaults, attributes);

        if (typeof attributes.expires === 'number') {
          attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
        }

        // We're using "expires" because "max-age" is not supported by IE
        attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

        try {
          var result = JSON.stringify(value);
          if (/^[\{\[]/.test(result)) {
            value = result;
          }
        } catch (e) {}

        value = converter.write ?
          converter.write(value, key) :
          encodeURIComponent(String(value))
            .replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

        key = encodeURIComponent(String(key))
          .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
          .replace(/[\(\)]/g, escape);

        var stringifiedAttributes = '';
        for (var attributeName in attributes) {
          if (!attributes[attributeName]) {
            continue;
          }
          stringifiedAttributes += '; ' + attributeName;
          if (attributes[attributeName] === true) {
            continue;
          }

          // Considers RFC 6265 section 5.2:
          // ...
          // 3.  If the remaining unparsed-attributes contains a %x3B (";")
          //     character:
          // Consume the characters of the unparsed-attributes up to,
          // not including, the first %x3B (";") character.
          // ...
          stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
        }

        return (document.cookie = key + '=' + value + stringifiedAttributes);
      }

      // Read

      var jar = {};
      var decode = function (s) {
        return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
      };
      // To prevent the for loop in the first place assign an empty array
      // in case there are no cookies at all.
      var cookies = document.cookie ? document.cookie.split('; ') : [];
      var i = 0;

      for (; i < cookies.length; i++) {
        var parts = cookies[i].split('=');
        var cookie = parts.slice(1).join('=');

        if (!this.json && cookie.charAt(0) === '"') {
          cookie = cookie.slice(1, -1);
        }

        try {
          var name = decode(parts[0]);
          cookie = (converter.read || converter)(cookie, name) ||
            decode(cookie);

          if (this.json) {
            try {
              cookie = JSON.parse(cookie);
            } catch (e) {}
          }

          jar[name] = cookie;

          if (key === name) {
            break;
          }
        } catch (e) {}
      }

      return key ? jar[key] : jar;
    }

    api.set = api;
    api.get = function (key) {
      return api.call(api, key);
    };
    api.getJSON = function (key) {
      return api.call({
        json: true
      }, key);
    };
    api.remove = function (key, attributes) {
      api(key, '', extend(attributes, {
        expires: -1
      }));
    };

    api.defaults = {};

    api.withConverter = init;

    return api;
  }

  return init(function () {});
}));