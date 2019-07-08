$(document).ready(function(){

  // Only try to execute code on badge-pages
  if(location.href.indexOf('/badges') != -1){
    var xp = $('a[href$="/badges/2"]+div .badge_info_description div:nth-child(2), .badge_row.depressed .badge_info_description div:nth-child(2)');
        xp = (xp.length > 0) ? xp.text() : 201;
    var empty_badge = $('a[href$="/badges/2"]+div .badge_empty, .badge_row.depressed .badge_empty').length;

    // Only execute if we don't already have Community-Badge Level 2
    // Level 3 seems to be 'impossible' to craft automatically due to linked YT-Account is mandatory
    if(parseInt(xp) < 200 || empty_badge >= 1){

      $('a[href$="/badges/2"]+div .badge_title_row, .badge_row.depressed .badge_title_row')
      .append('<div class="btn_green_white_innerfade craft_community_badge" style=" \
      top: -36px; margin-left: -200px;position: relative;float: right; \
      height: 20px;line-height: 20px;padding: 5px;z-index: 100; \
      ">Auto-Craft Community-Badge</div>');

      $('.maincontent').on('click', '.craft_community_badge', function(){
        var quests = $('.badge_task img[src*="off.png"], .badge_progress_task img[src*="off.png"]');
        var quest;

        // Add additional check to make sure there are solvable quests
        if(quests.length >= 1){

          // Set Bit for Community-Badge
          chrome.runtime.sendMessage({action:'start', process: 'craftCommunityBadgeBit'});

          // Set Agecheck-Cookies for Steam-Store YO
          $.ajax({
            url: 'http://store.steampowered.com/app/335300/',
            type: 'POST',
            data: {
              'snr': '1_agecheck_agecheck__age-gate',
              'ageDay': 8,
              'ageMonth': 'August',
              'ageYear': 1988
            },
            success: function(data){
              console.log('Agecheck-Cookies set');

              // Prepare Data - get SessionID for Shop
              $.get('http://store.steampowered.com', function(data){
                chrome.runtime.sendMessage({greeting: 'gimmeMasterSteamID'},function(response){

                //
                // P A R A M E T E R S
                //
                var community_sessionID = /sessionid=(.{24})/.exec(document.cookie)[1];
                var store_sessionID = /sessionID\s\=\s\"(.*)\"/.exec(data)[1];
                var steamid_master = response;
                var steamid = $('.submenu_username:eq(0) a:eq(0)').attr('href').replace(/\D/g,'');
                var steam_name = capitalizeFirstLetter($('#account_pulldown').text());

                  // Next-Loop start
                  ///////////////////////////////////////////////////////////////
                  (function next(i, maxLoops){
                    // All quests are done - hopefully
                    if (i++ >= maxLoops){
                      console.log('Iterated all quests now.');
                      // Unset Bit for Community-Badge
                      chrome.runtime.sendMessage({action:'stop', process: 'craftCommunityBadgeBit'});
                      // reload page ...
                      location.reload();
                      // quit loop ... not needed anymore
                      return;
                    }

                    // Q U E S T S  -  S T A R T
                    ///////////////////////////////////////////////////////////////////////////
                    quest = /community\/(.*)_off\.png/.exec($(quests.get(i-1)).attr('src'))[1];
                    switch(quest)
                    {
                      case "ViewBroadcast":
                        // Get link for first available Broadcast
                        $.get('http://steamcommunity.com/apps/allcontenthome?l=german&browsefilter=trend&appHubSubSection=13', function(data){
                          var stream = $(data).find('.Broadcast_Card:eq(0) a:eq(0)').attr('href');
                          var token = '8504119598979520553';
                          var bid = 0;
                          var link = 'http://steamcommunity.com/broadcast/getbroadcastmpd/?steamid=';

                          // Get Stream to unlock this achievement and done
                          $.get(link+stream.replace(/\D/g,'')+'&broadcastid='+bid+'&viewertoken='+token, function(dat){
                            console.log('This quest: '+quest+' Response: '+dat);
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          });
                        });
                      break;

                      case "UseDiscoveryQueue":
                        // First get our discovery-queue link
                        $.get('http://store.steampowered.com/', function(data){
                          var list = /\.attr\(\'href\'\,\s\'(.*)\s\)/.exec(data)[1];
                          // Now check for our next entry and how much iterations we need
                          $.get(list, function(dat){
                            var ele = $(dat).find('#next_in_queue_form');
                            var nxt = $(ele).attr('action').replace(/\D/g,'');
                            var cle = $(ele).children('input[name="appid_to_clear_from_queue"]').attr('value');
                            var snr = $(ele).children('input[name="snr"]').attr('value');
                            var lft = $(dat).find('.queue_sub_text').text().replace(/\D/g,'');
                            //console.log('SessionID: '+sid+'\nOld Appid: '+cle+'\nNew Appid: '+nxt+'\nSNR: '+snr+'\nLeft Entrys: '+lft);

                            (function iterate(j, hLoops){
                              if (j++ >= hLoops){
                                console.log('This quest: '+quest+' Response: Should be done :>');
                                setTimeout(function(){ next(i, maxLoops) }, 1);
                                return;
                              }

                              // check again for next-url (should be empty if list is empty)
                              nxt = (nxt == '0') ? 'http://store.steampowered.com/explore/next/0/' : 'http://store.steampowered.com/app/'+nxt;

                              // Posting this data will give us the data for the next page
                              // This way we just have to update the needed values
                              $.ajax({
                                url: nxt,
                                type: 'POST',
                                data: {'sessionid': store_sessionID,'appid_to_clear_from_queue': cle,'snr': snr},
                                success: function(da){
                                  ele = $(da).find('#next_in_queue_form');
                                  if($(ele).attr('action') !== undefined){
                                    nxt = $(ele).attr('action').replace(/\D/g,'');
                                  } else {
                                    console.log('This quest: '+quest+' Response: Should be done :>');
                                    setTimeout(function(){ next(i, maxLoops) }, 1);
                                    return;
                                  }
                                  cle = $(ele).children('input[name="appid_to_clear_from_queue"]').attr('value');
                                  snr = $(ele).children('input[name="snr"]').attr('value');

                                  //console.log('SessionID: '+sid+'\nOld Appid: '+cle+'\nNew Appid: '+nxt+'\nSNR: '+snr+'\nLeft Entrys: '+j);
                                  setTimeout(function(){ iterate(j, hLoops) }, 1);
                                },
                                error: function(){
                                  setTimeout(function(){ next(i, maxLoops) }, 1);
                                }
                              });
                            })(0, lft+1);

                          });
                        });
                      break;

                      case "AddItemToWishlist":
                        // we add the game (Portal 2) to our Wishlist
                        $.ajax({
                          url: 'http://store.steampowered.com/api/addtowishlist',
                          type: 'POST',
                          data: {'sessionid': store_sessionID,'appid': '620'},
                          success: function(data){
                            console.log('This quest: '+quest+' Response: '+data);
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          }
                        });
                      break;

                      case "RecommendGame":
                        // Send private Review (Friends only) for Particula
                        $.ajax({
                          url: 'http://store.steampowered.com/friends/recommendgame',
                          type: 'POST',
                          data: {
                            'appid': '343360',
                            'steamworksappid': '343360',
                            'comment': 'bad game',
                            'rated_up': true,
                            'is_public': false,
                            'language': 'german',
                            'received_compensation': 0,
                            'sessionid': store_sessionID
                          },
                          success: function(dat){
                            console.log('This quest: '+quest+' Response: '+dat);
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          }
                        });
                      break;

                      // don't want to implement
                      /*case "PostScreenshot":
                      console.log(quest);
                      setTimeout(function(){ next(i, maxLoops) }, 1);
                      break;*/

                      case "SubscribeToWorkshopItem":
                        // Random Portal Workshop
                        $.ajax({
                          url: 'http://steamcommunity.com/sharedfiles/subscribe',
                          type: 'POST',
                          data: {'id': 701635641, 'appid': 620, 'sessionid': community_sessionID },
                          success: function(data){
                            if(data['success'] == 1){
                              $.ajax({
                                url: 'http://steamcommunity.com/sharedfiles/unsubscribe',
                                type: 'POST',
                                data: {'id': 701635641, 'appid': 620, 'sessionid': community_sessionID },
                                success: function(data){
                                  console.log('This quest: '+quest+' Response: '+data);
                                  setTimeout(function(){ next(i, maxLoops) }, 1);
                                },
                                error: function(){
                                  setTimeout(function(){ next(i, maxLoops) }, 1);
                                }
                              });
                            }
                          }
                        });
                      break;

                      case "VoteOnGreenlight":
                        $.get('http://steamcommunity.com/greenlight/', function(data){
                          var item_id = $(data).find('.workshopItem:eq(0) a:eq(0)').attr('href').replace(/\D/g,'');
                          $.ajax({
                            url: 'http://steamcommunity.com/sharedfiles/voteup',
                            type: 'POST',
                            data: {'id': item_id,'sessionid': community_sessionID},
                            success: function(data){
                              console.log('This quest: '+quest+' Response: '+data);
                              setTimeout(function(){ next(i, maxLoops) }, 1);
                            }
                          });
                        });
                      break;

                      case "SetupCommunityRealName":
                        $.ajax({
                          url: 'http://steamcommunity.com/profiles/'+steamid+'/edit',
                          type: 'POST',
                          data: {
                            'sessionID': community_sessionID,
                            'type': 'profileSave',
                            'weblink_1_title': '',
                            'weblink_1_url': '',
                            'weblink_2_title': '',
                            'weblink_2_url': '',
                            'weblink_3_title': '',
                            'weblink_3_url': '',
                            'personaName': steam_name,
                            'real_name': steam_name,
                            'country': '',
                            'state': '',
                            'city': '',
                            'customURL': '',
                            'summary': 'Keine Informationen angegeben.',
                            'favorite_badge_badgeid': '',
                            'favorite_badge_communityitemid': '',
                            'primary_group_steamid': 0,
                            'profile_showcase[]': 0,
                            'rgShowcaseConfig[4][6][notes]': '',
                            'profile_showcase_style_5': 0,
                            'rgShowcaseConfig[5][0][badgeid]': '',
                            'rgShowcaseConfig[5][0][appid]': '',
                            'rgShowcaseConfig[5][0][border_color]': '',
                            'rgShowcaseConfig[5][1][badgeid]': '',
                            'rgShowcaseConfig[5][1][appid]': '',
                            'rgShowcaseConfig[5][1][border_color]': '',
                            'rgShowcaseConfig[5][2][badgeid]': '',
                            'rgShowcaseConfig[5][2][appid]': '',
                            'rgShowcaseConfig[5][2][border_color]': '',
                            'rgShowcaseConfig[5][3][badgeid]': '',
                            'rgShowcaseConfig[5][3][appid]': '',
                            'rgShowcaseConfig[5][3][border_color]': '',
                            'rgShowcaseConfig[5][4][badgeid]': '',
                            'rgShowcaseConfig[5][4][appid]': '',
                            'rgShowcaseConfig[5][4][border_color]': '',
                            'rgShowcaseConfig[5][5][badgeid]': '',
                            'rgShowcaseConfig[5][5][appid]': '',
                            'rgShowcaseConfig[5][5][border_color]': '',
                            'rgShowcaseConfig[6][0][appid]': '',
                            'rgShowcaseConfig[8][0][title]': '',
                            'rgShowcaseConfig[8][0][notes]': '',
                            'rgShowcaseConfig[9][0][accountid]': '',
                            'rgShowcaseConfig[10][0][appid]': '',
                            'rgShowcaseConfig[11][0][appid]': '',
                            'rgShowcaseConfig[11][0][publishedfileid]': '',
                            'rgShowcaseConfig[15][0][appid]': '',
                            'rgShowcaseConfig[15][0][publishedfileid]': '',
                            'rgShowcaseConfig[17][0][appid]': '',
                            'rgShowcaseConfig[17][0][title]': '',
                            'rgShowcaseConfig[17][1][appid]': '',
                            'rgShowcaseConfig[17][1][title]': '',
                            'rgShowcaseConfig[17][2][appid]': '',
                            'rgShowcaseConfig[17][2][title]': '',
                            'rgShowcaseConfig[17][3][appid]': '',
                            'rgShowcaseConfig[17][3][title]': '',
                            'rgShowcaseConfig[17][4][appid]': '',
                            'rgShowcaseConfig[17][4][title]': '',
                            'rgShowcaseConfig[17][5][appid]': '',
                            'rgShowcaseConfig[17][5][title]': '',
                            'rgShowcaseConfig[17][6][appid]': '',
                            'rgShowcaseConfig[17][6][title]': ''
                          },
                          success: function(dat){
                            console.log('This quest: '+quest+' Response: Should be doen :>');
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          }
                        });
                      break;

                      case "PostCommentOnFriendsPage":
                        // Just post to Steam-Masters Profile
                        $.ajax({
                          url: 'http://steamcommunity.com/comment/Profile/post/'+steamid_master+'/-1/',
                          type: 'POST',
                          data: {
                            'comment': '+rep :steamhappy:',
                            'count': '6',
                            'sessionid' : community_sessionID
                          },
                          success: function(data){
                            console.log('This quest: '+quest+' Response: '+data);
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          }
                        });
                      break;

                      case "RateUpContentInActivityFeed":
                        var time = Math.round(new Date().getTime()/1000); // seconds

                        // We can't make sure there will be a matching entry, so we create our own on top
                        // add Locale Datetime to our message because we can't post the same message several times
                        $.ajax({
                          url: 'http://steamcommunity.com/profiles/'+steamid+'/ajaxpostuserstatus/',
                          type: 'POST',
                          data: {
                            sessionid: community_sessionID,
                            status_text: 'YOLOOOO :steamhappy:'+new Date().toLocaleString().replace(/\.|:|,|\s/g,'-'),
                            appid: '0'
                          },
                          success: function(){
                            // Every activity has its own id - we need to extract it first
                            $.get('http://steamcommunity.com/profiles/'+steamid+'/ajaxgetusernews/?start='+time, function(data){
                              var activity_id = /_(\d*)_0'\)/.exec($(data['blotter_html']).find('.blotter_control_container:eq(0) a:eq(0)').attr('onclick'))[1];
                              var voteid = $(data['blotter_html']).find('.blotter_control_container:eq(0) a:eq(0)').attr('onclick').replace(/\D/g,'');
                              // Prepare to upvote
                              $.ajax({
                                url: 'http://steamcommunity.com/actions/LogFriendActivityUpvote',
                                type: 'POST',
                                data: {'sessionID': community_sessionID},
                                success: function(){
                                  // Upvote your own entry now
                                  $.ajax({
                                    url: 'http://steamcommunity.com/comment/UserStatusPublished/voteup/'+steamid+'/'+activity_id+'/',
                                    type: 'POST',
                                    data: {
                                      'vote': 1,
                                      'count': 6,
                                      'sessionid': community_sessionID,
                                      'newestfirstpagination': true
                                    },
                                    success: function(dat){
                                      console.log('This quest: '+quest+' Response: '+dat);
                                      setTimeout(function(){ next(i, maxLoops) }, 1);
                                    }
                                  });
                                }
                              });
                            });
                          }
                        });
                      break;

                      case "PostStatusToFriends":
                        $.ajax({
                          url: 'http://steamcommunity.com/profiles/'+steamid+'/ajaxpostuserstatus/',
                          type: 'POST',
                          data: {
                            sessionid: community_sessionID,
                            status_text: 'YOLOOOO :steamhappy:',
                            appid: '0'
                          },
                          success: function(data){
                            console.log('This quest: '+quest+' Response: '+data);
                            setTimeout(function(){ next(i, maxLoops) }, 1);
                          }
                        });
                      break;

                      case "PostCommentOnFriendsScreenshot":
                        $.get('http://steamcommunity.com/profiles/'+steamid_master+'/screenshots/', function(data){
                          var link_id = $(data).find('.imageWallRow:eq(1) a:eq(0)').attr('href').replace(/\D/g,'');
                          $.ajax({
                            url: 'http://steamcommunity.com/comment/PublishedFile_Public/post/'+steamid_master +'/'+link_id+'/',
                            type: 'POST',
                            data: {
                              'comment': 'Goil',
                              'count': 5,
                              'sessionid': community_sessionID,
                              'extended_data': {
                                "contributors": [steamid_master, steamid_master],
                                "appid":0,
                                "sharedfile":{
                                  "m_parentsDetails":null,
                                  "m_parentBundlesDetails":null,
                                  "m_bundledChildren":[],
                                  "m_ownedBundledItems":[]
                                }
                              }
                            },
                            success: function(dat){
                              console.log('This quest: '+quest+' Response: Should be done :>');
                              setTimeout(function(){ next(i, maxLoops) }, 1);
                            }
                          });
                        });
                      break;

                      case "UseEmoticonInChat":
                        var win = window.open("https://steamcommunity.com//chat/");
                        var timer = setInterval(function() {
                            if (win.closed){
                                clearInterval(timer);
                                console.log('This quest: '+quest+' Response: Should be done :>');
                                setTimeout(function(){ next(i, maxLoops) }, 1);
                            }
                        }, 500);
                      break;

                      case "SearchInDiscussions":
                        // Easy - just add search-param (Portal) to our request
                        $.get('http://steamcommunity.com/discussions/forum/search/?q=portal', function(data){
                          console.log('This quest: '+quest+' Response: Should be done :>');
                          setTimeout(function(){ next(i, maxLoops) }, 1);
                        });
                      break;

                      default:
                          setTimeout(function(){ next(i, maxLoops) }, 1);
                    }
                    ///////////////////////////////////////////////////////////////////////////
                    // Q U E S T S  -  E N D
                  })(0, quests.length);
                  ///////////////////////////////////////////////////////////////
                  // Next-Loop end
                });
              });
            }
          });

        } else {
          console.log('WTF. Looks like there are no solvable quests.');
        }
      });

    } else {
      console.log('We can only craft Community-Badge Level 2.');
    }
  }
});

// all Stuff related to quests which need another tab to complete
$(document).ready(function(){
  chrome.runtime.sendMessage({action:'status', process: 'craftCommunityBadgeBit'},function(r){
    if(r.status === 1){
      var loc = location.href;

      if(loc == "https://steamcommunity.com//chat/"){
        // We could read the content from first chat-page to send commands via AJAX
        // but im to lazy TODO
        chrome.runtime.sendMessage({greeting: 'gimmeMasterSteamID'},function(response){
          var master_partner_id = response.substring(3) - 61197960265728
          $('.friendslist_group_friends .friendslist_entry[data-miniprofile="'+master_partner_id+'"]').click();

          setTimeout(function(){
            $('textarea').val(':steamhappy:');
            $('button[type="submit"]').click();
            setTimeout(function(){
              window.close();
            }, 1000);
          }, 2000);
        });
      }

    }
  });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
