var cntTrades = 1;

function acceptTrades(count, arr, steamid, sessionid, sid){
	setTimeout(function(){

		console.log(cntTrades+'. SteamID: '+arr[cntTrades][0]+' OfferID: '+arr[cntTrades][1]);

		if(sid.indexOf(arr[cntTrades][0]) > -1){

			console.log(chrome.i18n.getMessage("background_user_is_bot_msg"));

			$.ajax({
				url: 'https://steamcommunity.com/tradeoffer/'+arr[cntTrades][1]+'/accept',
				data: {
					sessionid: sessionid,
					serverid: 1,
					tradeofferid: arr[cntTrades][1],
					partner: arr[cntTrades][0],
					captcha: ""
				},
				method: "POST",
				crossDomain: true,
				xhrFields: { withCredentials: true },
				success: function (response) {
					console.log('Trade completed.');
				},
				error: function (xhr, ajaxOptions, thrownError) {
					console.log('Trade failed: '+xhr.responseText);
				}
			});
		} else { console.log(new Date().toLocaleString()+' | Info: '+chrome.i18n.getMessage("background_user_is_not_bot_msg")); }

		cntTrades++;
		if (cntTrades <= count){
			acceptTrades(count, arr, steamid, sessionid, sid);
		}
	}, 5000)
}

function getTradeOffers(masterid){
	$.ajax({
		method: "GET",
		url: 'http://steamcommunity.com/profiles/'+masterid+'/tradeoffers',
		success: function (response, textStatus, jqXHR) {

			// We need to filter the response to get some parameters
			var sessionIDExp = /g_sessionID = \"(.+)\";/;
			var steamIDMasterExp = /g_steamID = \"(.+)\";/;
			var steamOffersExp = /\<div class=\"tradeoffer\" id=\"tradeofferid_(\d+)\"\>/g;
			var steamIDFriendExp = /ReportTradeScam\(\s'(\d+)',/g;
			var steamIDFriendExpTest = /ReportTradeScam\(\s'(\d+)',/; // to check if offers exist
			var steamIDMaster = steamIDMasterExp.exec(response);

			if(steamIDMaster != null){
				if(steamIDMaster[1] == masterid){
					if(steamIDFriendExpTest.test(response) == true){

						// Do Stuff - insert check for bots, so only bot-trades get accepted - check by steamid
						console.log(chrome.i18n.getMessage("background_pending_trades"));

						// Create Array to temporarily save tradeoffer-data and get SessionID for Master
						var sidArr = [];
						var tradeArr = [];
						var sessionID = sessionIDExp.exec(response);
						console.log('Master SteamID: '+steamIDMaster[1]+' Master SessionID: '+sessionID[1]);

						// Save SteamID of Friend and its OfferID to Array
						var i; var num = 0;
						while (i = steamIDFriendExp.exec(response)) { num++; tradeArr[num] = [i[1], '']; }
						num = 0;
						while (i = steamOffersExp.exec(response)) { num++; tradeArr[num][1] = i[1]; }

						// Reset counter
						cntTrades = 1;

						// start the transaction and finally start accepting the trades
						idb.opendb().then(function(db){
							db.transaction("r", db.steam_users, function(user){
								user.each(function(sid){
									sidArr.push(sid.steam_id);
								}).then(function(result){
									// Start accepting trades
									acceptTrades(num, tradeArr, steamIDMaster[1], sessionID[1], sidArr);
								}).catch(function(err){
									console.log(err);
								}).finally(function(){
									db.close();
								});
							});
						});
					} else {
						console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Info: '+'%c '+chrome.i18n.getMessage("background_trades_no"), '', 'background: silver; color: blue; border-radius: 10%', '');
					}
				} else {
					// Don't do anything if master isn't logged in
					console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Info: '+'%c '+chrome.i18n.getMessage("background_trades_not_master"), '', 'background: silver; color: blue; border-radius: 10%', '');
				}
			} else {
				// Do Stuff
				console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Info: '+'%c '+chrome.i18n.getMessage("background_trades_not_master"), '', 'background: silver; color: blue; border-radius: 10%', '');
			}
		}
	});
}
