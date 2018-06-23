$(document).ready(function(){

  // Detect if Script is active
  /////////////////////////////
  chrome.runtime.sendMessage({greeting: 'getMinigameTokenStatus'}, function(stopme){
  	console.log(stopme);
	if(document.location.href == "https://steamcommunity.com/login/home/?goto="){
      // Click first entry until none is left
      setTimeout(function(){
        if (stopme == 1) { 
          if ($('.names').length > 0) {
            $('.names:eq(0)').click();
          } else {
            // When finished reset queue-status
            chrome.runtime.sendMessage({greeting: 'setMinigameTokenStatusInactive'});
          }
        }
      }, 1500);
    } else if(document.location.href == "https://steamcommunity.com/"){
    	if(stopme == 1){

    		var user 	= '',
    		sessionID 	= /sessionid=(.{24})/.exec(document.cookie)[1];

			if(jQuery('#account_pulldown').text() !== ""){

				jQuery.get('https://steamcommunity.com/saliengame/gettoken', function(res){
					user = res.steamid;
					download(JSON.stringify(res, null, "\t"),user+'.txt','application/json');
				}).done(function(){
		            user = $('#account_pulldown').text();
		            chrome.runtime.sendMessage({
		              greeting: 'setSkipForLogin',
		              user: user
		            }, function(response) {
		              if (response == 1) {
		                jQuery.post('https://steamcommunity.com/login/logout/', {
		                  sessionid: sessionID
		                });

		                setTimeout(function(){
		                  location.reload();
		                }, 1000);
		              } else {
		                alert("There is a problem with your username!");
		              }
		            });
				});

			} else {
      			document.location = "https://steamcommunity.com/login/home/?goto=";
			}
    	}
    } else {
    	document.location = "https://steamcommunity.com/";
    }

  });

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