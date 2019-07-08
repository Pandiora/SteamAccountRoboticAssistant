var sessionID = /sessionid=(.{24})/.exec(document.cookie)[1];

$(document).ready(()=>{ start(); });

async function start(){

  const res = await browser.runtime.sendMessage({
    action: 'status',
    process: 'LicenseBulkActivationBit'
  });

  if(res.status === 0) return;

  if(document.location.href == "https://store.steampowered.com/login/?redir=app%2F"+res.appid+"%2F") {
    // Click first entry until none is left
    setTimeout(function(){
      if ($('.names').length > 0) {
        $('.names:eq(0)').click();
      } else {
        // When finished reset queue-status or list of names couldn't get loaded
        browser.runtime.sendMessage({
          action: 'stop',
          process: 'LicenseBulkActivationBit'
        });
      }
    }, 1500);
  } else if(document.location.href.indexOf("http://store.steampowered.com/app/"+res.appid+"/") !== -1){
    if(jQuery('#account_pulldown').text() !== ""){
      if($('.already_in_library')[0]){
        // User already owns this game >> set skip for this user and log out
        var user = $('#account_pulldown').text();
        const response = browser.runtime.sendMessage({
          process: 'setSkipForLogin',
          parameters: user
        });
        
        if (response === 1) {
          $.post('https://store.steampowered.com/logout/', {
            sessionid: sessionID
          });
          document.location.href = "https://store.steampowered.com/login/?redir=app%2F"+res.appid+"%2F";
        }
      } else {
        $('#game_area_purchase').find('.btnv6_green_white_innerfade')[0].click();
      }
    } else {
      // Sometimes the logout is to fast and the script could get stuck - go to login-page
      document.location.href = "https://store.steampowered.com/login/?redir=app%2F"+res.appid+"%2F";
    }
  } else if(document.location.href == "http://store.steampowered.com/checkout/addfreelicense/"){
    // Alright we added the free license - set skip-flag for this user and log out
    var user = $('#account_pulldown').text();
    const response = browser.runtime.sendMessage({
      process: 'setSkipForLogin',
      parameters: user
    });

    if (response === 1) {
      $.post('https://store.steampowered.com/logout/', {
        sessionid: sessionID
      }).done(function(){
        document.location.href = "https://store.steampowered.com/login/?redir=app%2F"+res.appid+"%2F";
      });
    }
  }

}

