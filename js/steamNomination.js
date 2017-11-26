// D E S C R I P T I O N
//
// review_text	- 	will be the different text written in your game-reviews,
//					(use your own!)
// review_apps	-	should be one or more games which ALL(!) of your bots own,
//					so you can write a review for (they should have trading-cards,
//					since this would increase the chance, that you already "played"
//					the game with ASF)
// write_in_text-	change this too, since those are the categorys send to VALVe
//					for the "choose your own category"-thingy
// vote_appids	-	you should also change these to your prefered games
//					(must (!) include one game all accounts own)
// You'll get additional 25XP by playing a game you voted for. (maybe use ASF huh)
/////////////////////////////////////////////////////////////////////////////////

var steam_awards = {
	"review_text": [
		"Just wanted to add my review due to voting for Steam Nominations. =)",
		"Nice game",
		"Bad game",
		"Review for Nomination purposes needed",
		"Just wanted to leave a review"
	],
	"review_apps": [
		"218620"	// PAYDAY 2
	],
	"write_in_txt": [
		"Half-Life 3 confirmed", 
		"Left back speechless", 
		"Showing us the future",
		"GabeN did nothing wrong",
		"Only 5 minutes more",
		"I <3 you",
		"Left me breathless",
		"I want another one!",
		"Seriously, NO DLC?!"
	],
	"vote_appids": [
		"411300", 	// ELEX
		"271590", 	// GTA V
		"292030", 	// Witcher 3
		"255710", 	// Cities: Skylines
		"39510", 	// Gothic 2
		"220", 		// Half-Life 2
		"594570", 	// Warhammer II
		"243470", 	// Watch_Dogs
		"582160",	// AC: Origins
		"365590",	// The Division
		"413150",	// Stardew Valley
		"210970",	// The Witness
		"218620"	// PAYDAY 2
	]
};

awards = {

	checkNominations: function(steam_awards, res_appid){

		var nomination_cnt	= jQuery(".nomination_row:not(.has_nomination)").length,
			nomination_max	= jQuery('.nomination_row').length,
			awards_obj		= JSON.parse(JSON.stringify(steam_awards)); // clone obj for for index-purposes

		// Already nominated
		if(nomination_cnt === 0){

			console.log("Already nominated for all awards");

			var lvl4_act 	= jQuery(".badge_preview.level_4.inactive").length,
				single_game = (jQuery(".badge_tasks .nominate_check_ctn:eq(0) div").attr("class") === "nominate_missing") ? 0 : 1,
				multi_game 	= (jQuery(".badge_tasks .nominate_check_ctn:eq(1) div").attr("class") === "nominate_missing") ? 0 : 1,
				play_game 	= (jQuery(".badge_tasks .nominate_check_ctn:eq(2) div").attr("class") === "nominate_missing") ? 0 : 1,
				review_game = (jQuery(".badge_tasks .nominate_check_ctn:eq(3) div").attr("class") === "nominate_missing") ? 0 : 1,
				badge_url	= jQuery(".submenuitem:contains('Badges'):eq(0)").attr("href"),
				add_plus	= (play_game === 1) ? 1 : 0;
				task_sum	= single_game+multi_game+play_game+review_game;

			// Check if user-account is limited
			jQuery.get(badge_url, function(data){

				var limited = jQuery(data).find(".limitedUserBadge").length;
				console.log("Account is limited: "+limited);

				if((limited == 1 && task_sum >= (2+add_plus)) || (limited == 0 && task_sum >= (3+add_plus))){

		            var user = jQuery('#account_pulldown').text();
		            chrome.runtime.sendMessage({
		              greeting: 'setSkipForLogin',
		              user: user
		            }, function(response) {
		              if (response == 1) {

		              	console.log("All possible tasks are done!");
		                jQuery.post('https://store.steampowered.com/logout/', {
		                  sessionid: awards.getStoreSession()
		                });

		                setTimeout(function(){
		                  location.reload();
		                }, 1000);
		              }
		            });

				} else {

					console.log("Review is missing, creating one.");

					var	appID 		= (res_appid !== "") ? res_appid : awards.rndValFromArr(awards_obj.review_apps),
						review_text = awards.rndValFromArr(awards_obj.review_text),
						sessionID 	= awards.getStoreSession(),
						rating		= Math.random() >= 0.5;

					jQuery.post("http://store.steampowered.com/friends/recommendgame", {
						'appid': appID,
						'steamworksappid': appID,
						'comment': review_text,
						'rated_up': rating,
						'is_public': false,
						'language': 'english',
						'received_compensation': 0,
						'sessionid': sessionID
					}).done(function(data){
						console.log("Review added!");
						document.location.reload();
					});

				}
			});

		} else if(nomination_cnt > 0){

			// Send Nominations
			console.log("Build array, start nominating ...");
			awards.nominating(steam_awards, awards_obj, nomination_max, awards.getStoreSession());

		}
	},

	nominating: function(steam_awards, awards_obj, count, sessionID){

		if(count > 0){

			var	appid 	= awards.rndValFromArr(awards_obj.vote_appids),
				app_idx = awards_obj.vote_appids.indexOf(appid),
				awd_txt = awards.rndValFromArr(awards_obj.awards),
				awd_idx = awards_obj.awards.indexOf(awd_txt),
				awd_idx2= steam_awards.awards.indexOf(awd_txt),
				postObj = { 
					"sessionid": sessionID,
					"appid": appid,
					"categoryid": (awd_idx2+1)
				};

			// Additional name/parameter needed for last category
			if(awd_txt === "The “Write-In” Award") postObj["write-in"] = awards.rndValFromArr(awards_obj.write_in_txt);

			// Send constructed Nomination-Request
			jQuery.post('http://store.steampowered.com/promotion/nominategame', postObj).done(function(data){

				console.log("Nominated: "+awd_txt+" CategoryID: "+awd_idx2+" AppID: "+appid);				
				count--;

				// Remove values from arrays
				awards_obj.vote_appids.splice(app_idx, 1);
				awards_obj.awards.splice(awd_idx, 1);

				// Start next iteration
				awards.nominating(steam_awards, awards_obj, count, sessionID);

			});

		} else {
			console.log("All nominations should be applied now.");
			document.location.reload();
		}
	},

	buildAwardsArr: function(steam_awards){

		var len = jQuery(".category_title").length, arr = [];

		for(var i=0;i<len;i++){ 
			arr.push(awards.removeWhitespaces(jQuery(".category_title").eq(i).text())); 
		}

		steam_awards.awards = arr;
		return steam_awards;
	},

	getStoreSession: function(){
		var sid = /sessionid=(.{24})/.exec(document.cookie)[1];
		return sid;
	},

	rndValFromArr: function(arr){
		return arr[Math.floor(Math.random() * arr.length)];
	},

	removeWhitespaces: function(str){
		return str.replace(/(^\s+|\s+$)/g,'');
	}

}

jQuery(document).ready(function(){

	chrome.runtime.sendMessage({greeting: 'getAutoNominationStatus'}, function(res){

		if(document.location.href === "http://store.steampowered.com/SteamAwardNominations/?l=english"){

			if(jQuery('#account_pulldown').text() === ""){
				document.location = "https://store.steampowered.com//login/?redir=SteamAwardNominations%2F%3Fl%3Denglish";
			} else {
				if (res.status === 1) awards.checkNominations(awards.buildAwardsArr(steam_awards), res.appid);
			}

		} else if(document.location.href === "https://store.steampowered.com//login/?redir=SteamAwardNominations%2F%3Fl%3Denglish"){

	      setTimeout(function(){
	        if (res.status === 1) { 
	          if (jQuery('.names').length > 0) {
	            jQuery('.names:eq(0)').click();
	          } else {
	            // When finished reset queue-status
	            chrome.runtime.sendMessage({greeting: 'setAutoNominationInactive'});
	          }
	        }
	      }, 1500);

		} else if(document.location.href === "http://store.steampowered.com/"){

	      if (res.status === 1) {
	        document.location = "https://store.steampowered.com//login/?redir=SteamAwardNominations%2F%3Fl%3Denglish";
	      }

		}

	});
});