var g_sessionID = /sessionid=(.{24})/.exec(document.cookie)[1],
	viewProfileURL = "http://steamcommunity.com/id/el_pandi",
    store_sessionID = "", username = "",
    profild = (document.location.href.indexOf('profile') > -1) ? 'profiles' : 'id';

if(document.location.href.indexOf('profile') > -1){
	username = /profiles\/(.*)\/stickers/.exec(document.location.href);
	username = (username !== null) ? username[1] : '';
} else {
	username = /id\/(.*)\/stickers/.exec(document.location.href);
	username = (username !== null) ? username[1] : '';
}

// at first we should get our Store SessionID
getStoreSessionID();

$(document).ready(function(){

	// Detect if Script is active
	/////////////////////////////
	chrome.runtime.sendMessage({greeting: 'getStickerStatus'}, function(stopme){

		if(document.location.href == "https://steamcommunity.com/login/home/?goto=id/my/stickers/") {
		  // Click first entry until none is left
		  setTimeout(function(){
		    if (stopme == 1) { 
		      if ($('.names').length > 0) {
		        $('.names:eq(0)').click();
		      } else {
		        // When finished reset queue-status
		        chrome.runtime.sendMessage({greeting: 'setStickerInactive'});
		      }
		    }
		  }, 1500);
		} else if (
			(/^http:\/\/steamcommunity\.com\/id\/.*\/stickers[\/]{0,1}$/.test(document.location.href)) ||
			(/^http:\/\/steamcommunity\.com\/profiles\/.*\/stickers[\/]{0,1}$/.test(document.location.href))
		){
			if (stopme == 1) {
				// redirect to english page
				document.location = "http://steamcommunity.com/"+profild+"/"+username+"/stickers/?l=english";
			}

		} else if( 
			(/^http:\/\/steamcommunity\.com\/id\/.*\/stickers\/\?l=english$/.test(document.location.href)) ||
			(/^http:\/\/steamcommunity\.com\/profiles\/.*\/stickers\/\?l=english$/.test(document.location.href))
		){

			if (stopme == 1) {
				var len = $('#tasks_remaining_container .task h2').length, task = [];

				// getting all uncompleted tasks
				for(var i=0;i<len;i++){ 
					task.push($('#tasks_remaining_container .task h2').eq(i).text()) 
				}

				// iterate through uncompleted tasks
			    (function next(counter, maxLoops) {

			        // all items should be selected now
			        if(counter++ >= maxLoops){
			            // we're done, remove spinner
			            console.log('All tasks should be completed now');
			            if(len > 3){
			            	location.reload();
			            } else {
			            	openBoosters();
			            }
			            return;
			        }

			        // execute task-completion
					completeTasks(task[counter-1], counter);
			        // timeout to start next iteration
			        setTimeout(function(){ next(counter, maxLoops); }, 1000);

			    })(0, len);
			}

		} else if(document.location.href == 'https://steamcommunity.com/login/home/'){
			if (stopme == 1) {
				document.location = "https://steamcommunity.com/login/home/?goto=id/my/stickers/";
			}
    	}
	});
});

function openBoosters(){

	var len = jQuery('.sticker_item img[src="http://community.edgecast.steamstatic.com/public/images/promo/summer2017/stickers_group.png"]').length;

	if(len == 1){
		// iterate through booster-opening
	    (function next(counter, maxLoops) {

	        // execute booster-opening
			jQuery.ajax({
			  url: 'http://steamcommunity.com/'+profild+'/'+username+'/stickersopen/',
			  type: 'POST',
			  success: function(res){
			  	if(res.stickers.length == 0){
			  		console.log('All Boosters should be opened now.');
			  		location.reload();
			  		return;
			  	}
			  	console.log('Opened Booster-Pack #'+counter);
				// timeout to start next iteration
				setTimeout(function(){ next(counter, maxLoops); }, 100);
			  }
			});
	    })(0, 1000);
	} else {
		placeStickers();
	}
}

function placeStickers(){

	// first check if all pages have all stickers
	var len = jQuery('#scene_selector .item div').length, bit = 1, grp;
	for(var i=0;i<len;i++){
		grp = jQuery('#scene_selector .item div').eq(i).text().match(/(\d+)/g);
		bit = ((grp[0] === grp[1]) && (bit === 1)) ? 1 : 0;
	}

	if(bit == 1){
		console.log('lets add stickers');

		// First we need to create some Objects which include a lot of parameters
		var scenes = [], str = '', g = 0, l=0;

		for(key in stickers){

			l = stickers[key].length, str = '';

			// generate parameters for every sticker for this page
			for(var i=0;i<l;i++){
				str += '\
					"scene_data['+i+'][id]": "'+stickers[key][i]+'", \
					"scene_data['+i+'][x]": 0, \
					"scene_data['+i+'][y]": 0, \
					"scene_data['+i+'][sx]": 1, \
					"scene_data['+i+'][sy]": 1, \
					"scene_data['+i+'][r]": 0, \
					"scene_data['+i+'][z]": false, ';
		    }

		    // we need to add 3 more parameters
			str += '"sceneid": '+g+', "sessionid": "'+g_sessionID+'", "active": 0';
			// finally we need those to parse as JSON
			str = '{'+str+'}';
			// push to array we use later
			scenes.push(JSON.parse(str));
			// count up to correctly set the sceneid on next iteration
			g++;
		}

		// Now we can "save" every page
		// Pictures will be pinned to x:0 y:0
		(function next(counter, maxLoops) {

		    // all pages should be saved now
		    if(counter++ >= maxLoops){
		        LogMeOut();
		        return;
		    }

		    // execute page-completion
			jQuery.ajax({
			  url: 'http://steamcommunity.com/'+profild+'/'+username+'/stickerssave/',
			  type: 'POST',
			  data: scenes[counter-1],
			  success: function(res){

				jQuery.ajax({
					url: 'http://steamcommunity.com/'+profild+'/'+username+'/stickerscomplete/',
					type: 'POST',
					data: { scene: (counter-1) },
					success: function(res){
						// timeout to start next iteration
						setTimeout(function(){ next(counter, maxLoops); }, 1000);
					},
					error: function(res){
						console.log('Error: '+res);
						// timeout to start next iteration
						setTimeout(function(){ next(counter, maxLoops); }, 1000);						
					}
				});
			  }
			});
		})(0, 15);

	} else {
		console.log('sorry you do not own all stickers');
		LogMeOut();
		// TODO: add logout here
	}
}

function getStoreSessionID(){
	jQuery.get('http://store.steampowered.com/', function(res){
		store_sessionID = /g_sessionID\s=\s\"(.*)\";/g.exec(res);
		store_sessionID = (store_sessionID !== null) ? store_sessionID[1] : '';
	});
}

function LogMeOut(){
	var user = jQuery('#account_pulldown').text();
	chrome.runtime.sendMessage({
		greeting: 'setSkipForLogin',
		user: user
	}, function(response) {
		if (response == 1) {
			jQuery.ajax({
				url: 'https://steamcommunity.com/login/logout/',
				type: 'POST',
				data: { 'sessionid': g_sessionID },
				success: function(){

				}
			});

			setTimeout(function(){
			  location.reload();
			}, 1000);
		}
	});
}

function completeTasks(task, i){

	console.log(i+". Complete Task: "+task+" now.");

	switch(task)
	{
		case "Play a game from your library":
			console.log('We can not do this task within browser.');
		break;

		case "Add to your wishlist":
			jQuery.ajax({
			  url: 'http://store.steampowered.com/api/addtowishlist',
			  type: 'POST',
			  data: {
			    'sessionid': store_sessionID,
			    'appid': '557400'
			  },
			  success: function(res){
				console.log('Result game added: '+res.success);
			  }
			});
		break;

		case "Review your Preferences":
			jQuery.get('http://store.steampowered.com/account/preferences/', function(){
				console.log("Account preferences should be visited now");
			});
		break;

		case "Earn an Achievement":
			console.log('We can not do this task within browser.');
		break;

		case "Visit the Broadcasts page":
			jQuery.get('http://steamcommunity.com/apps/allcontenthome?l=english&browsefilter=trend&appHubSubSection=13', function(){
				console.log("Broadcasts page should be visited now");
			});
		break;

		case "Mark a Review as Helpful ... or not":
			// randomly vote up or down (specific review)
			jQuery.ajax({
			  url: 'http://store.steampowered.com//userreviews/rate/32283049',
			  type: 'POST',
			  data: {
			  	'rateup': (Math.round(Math.random()*1)),
			    'sessionid': store_sessionID
			  },
			  success: function(res){
				console.log('Result for Review-Rating: '+res.success);
			  }
			});
		break;

		case "Follow a Curator":
			jQuery.ajax({
			  url: 'http://store.steampowered.com/curators/ajaxfollow',
			  type: 'POST',
			  data: {
			    'sessionid': store_sessionID,
			    'clanid': '4771848',
				'follow': 1
			  },
			  success: function(res){
				console.log('Result follow curator: '+res.success);
			  }
			});		
		break;

		case "View a Profile":
			jQuery.get(viewProfileURL, function(){
				console.log("Friends Profile should be visited now");
			});
		break;

		case "Explore popular tags":
			jQuery.get("http://store.steampowered.com/tag/browse", function(){
				console.log("Popular tags should be visited now");
			});
		break;

		case "Mark something Not Interested":
			jQuery.ajax({
			  url: 'http://store.steampowered.com/recommended/ignorerecommendation/',
			  type: 'POST',
			  data: {
				'sessionid': store_sessionID,
				'appid': '557400',
				'snr': '1_5_9'
			  },
			  success: function(res){
				console.log('Result not interested: '+res.success);
			  }
			});	
		break;

		case "Browse the Videos on Steam":
			jQuery.get('http://store.steampowered.com/videos', function(){
				console.log("Steam Videos should be visited now");
			});
		break;

		case "Visit your screenshot library":			
			jQuery.get('http://steamcommunity.com/'+profild+'/'+username+'/screenshots', function(){
				console.log("Screenshots page should be visited now. Not sure if this is working ...");
			});
		break;

		case "Personalize your Steam Community Profile":
			jQuery.get('http://steamcommunity.com/'+profild+'/'+username+'/edit', function(){
				console.log("Profile edit page should be visited now.");
			});
		break;

		case "Customize your Discovery Queue":
			console.log('seems to be broken - leave it alone');
		break;

		case "Explore your Discovery Queue":
			console.log('This should be part of daily script-execution yo.');
		break;

		case "View your Friend Activity page":
			jQuery.get('http://steamcommunity.com/'+profild+'/'+username+'/home/', function(){
				console.log("The activity-feed should be visited now.");
			});
		break;
	}
}
