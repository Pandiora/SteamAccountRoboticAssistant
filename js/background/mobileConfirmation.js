var retrycnt = 0;
function getNotificationsTrades(){

	retrycnt++;
	var tags = 'conf';
	// to avoid to much connections to steam-service we have to limit the numbers of retries
	if (retrycnt <= 5){
		idb.getMasterRecord().done(function(user){
			// to generate the confirmation-key we need the actual server-time
			$.when(getServerTime()).done(function(time){
				// we need the identity-secret to generate the confirmation key
				$.when(getConfirmationKey(user['identity_secret'], time, tags)).done(function(key) {
					// We have to load this template before we replace the placeholders, otherwise we would load
					// it in every loop-iteration which is a waste of ressources - so this is used laaaater
					$.get('../html/notification-market-trades-template.html', function(template) {

						// parameters
						//var p = "p="+user['device_id']+"&";
						// due to better results use random device-id based on doctorMcKays suggestions
						// https://github.com/DoctorMcKay/node-steamcommunity/issues/27
						var p = "p=android:" + generateHexString(40) + "&";
						var a = "a=" + user['steam_id'] + "&";
						var k = "k=" + encodeURIComponent(key) + "&"; // Must be encoded
						var t = "t=" + time + "&";
						var m = "m=" + "android" + "&";
						var tag = "tag=" + tags;
						var all = p + a + k + t + m + tag;

						// Send request to Steam-Servers, to get the list of trades that need to be confirmed
						$.ajax({
							url: "https://steamcommunity.com/mobileconf/conf?" + all,
							method: "POST",
							timeout: 10000,
							beforeSend: function(xhr) {
								xhr.setRequestHeader("X-Requested-With", "com.valvesoftware.android.steam.community");
							},
							success: function(data) {

								// prevent image-loading - replace src with data-src
								data = data.replace(/(<img\s)src([^>]*>)/ig, '$1data-src$2');

								// Check if confirmation-key is wrong
								if (data.indexOf('mobileconf_empty') <= 0) {
									var entryArr = [];
									var result = $("#mobileconf_list", data);
									var entrys = $(result).find(".mobileconf_list_entry");
									entrys = $(entrys).toArray();

									if (entrys.length > 0) {
										for (i = 0; i < entrys.length; i++) {

											// set up needed variables for notification-items
											var imgsrc = $(entrys[i]).find('img').data('src');
											var imgcut = imgsrc.toString().slice(-7);
											var dataConfID = $(entrys[i]).data('confid');
											var data_key = $(entrys[i]).data('key');
											var text1 = $(entrys[i]).find('.mobileconf_list_entry_description div:eq(0)').text();
											var text2 = $(entrys[i]).find('.mobileconf_list_entry_description div:eq(1)').text();
											var text3 = $(entrys[i]).find('.mobileconf_list_entry_description div:eq(2)').text();
											var type = (imgcut == '32fx32f' ? "noti-market" : "noti-trades");

											// Use jquery-validator to replace placeholders in html-template
											entryArr += $.validator.format(template, [type, dataConfID, data_key, imgsrc, text1, text2, text3]);

											// for Debugging-Purposes
											//console.log((i+1)+'. '+type+'\nName: '+text1+'\nDescription: '+text2+'\nTime: '+text3+'\nConfirmation-ID: '+dataConfID+' Confirmation-Key: '+data_key);
										}
									}

									// Finally we collected all needed information and save them to localStorage
									chrome.storage.local.set({
										'notifications-trades': entryArr
									}, function(result) {
										console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Update: ' + '%c '+chrome.i18n.getMessage("confirmation_2fa_trades_saved"), '', 'background: silver; color: green; border-radius: 10%', '');
									});

									// Send data to frontend, append elements and execute notification-count
									// Specify the content-tab so this message won´t get send to bg-listener
									chrome.windows.getAll({
										populate: true
									}, function(windows) {
										windows.forEach(function(window) {
											window.tabs.forEach(function(tab) {
												if (tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0) {
													chrome.tabs.sendMessage(tab.id, {
														greeting: "notifications-trades"
													}, function(response) {
														console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Info: ' + ('%c ' + response), '', 'background: silver; color: blue; border-radius: 10%', '');
													});
												}
											});
										});
									});
									// Reset retrycount - we´re done here
									retrycnt = 0

								} else if ($('#mobileconf_empty', data).children().length == 2) {
									// confirmation-list is "empty" - remove data from local-storage
									// and update notification-counter
									chrome.storage.local.set({
										'notifications-trades': ''
									}, function(result) {
										chrome.windows.getAll({
											populate: true
										}, function(windows) {
											windows.forEach(function(window) {
												window.tabs.forEach(function(tab) {
													if (tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0) {
														chrome.tabs.sendMessage(tab.id, {
															greeting: "notifications-trades"
														}, function(response) {
															console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Info: ' + '%c '+chrome.i18n.getMessage("confirmation_2fa_confirm_empty"), '', 'background: silver; color: blue; border-radius: 10%', '');
														});
													}
												});
											});
										});
									});
									// Reset retrycount - we´re done here
									retrycnt = 0

								} else {
									// Sometimes the request is malformed - execute retries
									console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Error: ' + '%c '+chrome.i18n.getMessage("background_error_steam_not_available"), '', 'background: silver; color: red; border-radius: 10%', '');
									setTimeout(function() {
										getNotificationsTrades();
									}, 5000);
									// Reset retrycount - we´re done here
									retrycnt = 0
								}
							},
							error: function(xhr, textStatus, errorThrown){
								// retry-limit should be reached
								retrycnt++;
								if (xhr.status == 503) {
									// Sometimes Steam-Servers are temporarily unavailable - execute retries
									console.log(chrome.i18n.getMessage("confirmation_2fa_wrong_key_time")+xhr.status);
									setTimeout(function() {
										getNotificationsTrades();
									}, 5000);
								} else if (xhr.state() == 'rejected') {
									// lets do retrys here too
									setTimeout(function() {
										getNotificationsTrades();
									}, 1000);
									// We can´t catch redirects with js, so we just check for reject
									console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Warning: ' + '%c '+chrome.i18n.getMessage("background_error_master_or_stalled"), '', 'background: silver; color: yellow; border-radius: 10%', '');
								} else {
									console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Error: ' + ('%c '+chrome.i18n.getMessage("background_error_missing_market_noti")+ xhr.status), '', 'background: silver; color: red; border-radius: 10%', '');
								}
							}
						});
					});
				});
			});
		});
	} else {

		console.log(('%c' + new Date().toLocaleString() + ' | ') + '%c Error: ' + '%c '+chrome.i18n.getMessage("background_error_srsly"), '', 'background: silver; color: red; border-radius: 10%', '');
		// Reset retrycount
		retrycnt = 0;
	}
}



var conf_link = '';
function processConfirmation(operation, items) {

	var cnt = items.length;

	// We need a delayed loop to not spam the steam-servers
	///////////////////////////////////////////////////////////
	(function next(counter, maxLoops) {

		if (counter++ >= maxLoops) {
			return;
		}

		idb.getMasterRecord().done(function(user){
			// to generate the confirmation-key we need the actual server-time
			$.when(getServerTime()).done(function(time) {
				// we need the identity-secret to generate the confirmation key
				$.when(getConfirmationKey(user['identity_secret'], time, operation)).done(function(key) {
					// we need a separate confirmation-key for the referer (conf)
					$.when(getConfirmationKey(user['identity_secret'], time, 'conf')).done(function(cnf) {

						// Generate Referer-Link
						var conf1 = "p=android:" + generateHexString(40) + "&";
						var conf2 = "a=" + user['steam_id'] + "&";
						var conf3 = "k=" + encodeURIComponent(cnf) + "&"; // Must be encoded
						var conf4 = "t=" + time + "&";
						var conf5 = "m=" + "android" + "&";
						var conf6 = "tag=conf";
						conf_link = "https://steamcommunity.com/mobileconf/conf?" + conf1 + conf2 + conf3 + conf4 + conf5 + conf6;

						// Add Referer to RequestHeaders
						chrome.webRequest.onBeforeSendHeaders.addListener(modConfirmationHeaders, {
							urls: ["https://steamcommunity.com/mobileconf/ajaxop?*"]
						}, ['requestHeaders', 'blocking']);

						// Parameters
						var op = "op=" + operation + "&";
						var p = "p=android:" + generateHexString(40) + "&";
						var a = "a=" + user['steam_id'] + "&";
						var k = "k=" + encodeURIComponent(key) + "&"; // Must be encoded
						var t = "t=" + time + "&";
						var m = "m=" + "android" + "&";
						var tag = "tag=" + operation + "&";
						var cid = "cid=" + items[counter - 1].cid + "&";
						var ck = "ck=" + items[counter - 1].ck;
						var all = op + p + a + k + t + m + tag + cid + ck;

						var rcnt = 0;

						function processAjaxConfirmation() {
							rcnt++;
							if (rcnt <= 5){
								// Send request to Steam-Servers, to get the list of trades that need to be confirmed
								$.ajax({
									url: "https://steamcommunity.com/mobileconf/ajaxop?" + all,
									timeout: 10000,
									beforeSend: function(xhr) {
										xhr.setRequestHeader("X-Requested-With", "com.valvesoftware.android.steam.community");
									},
									success: function(data) {

										// Remove the latest removed item when it was succesfully confirmed
										if (data.success == true) {
											chrome.windows.getAll({
												populate: true
											}, function(windows) {
												windows.forEach(function(window) {
													window.tabs.forEach(function(tab) {
														if (tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0) {
															chrome.tabs.sendMessage(tab.id, {
																greeting: "remove-notification",
																cid: items[counter - 1].cid,
																ck: items[counter - 1].ck
															}, function(response) {
																//console.log(('%c'+new Date().toLocaleString()+' | ')+'%c Info: '+('%c '+response), '', 'background: silver; color: blue; border-radius: 10%', '');
															});
														}
													});
												});
											});

											// Remove the Listener for this specific AJAX-Request
											chrome.webRequest.onBeforeRequest.removeListener(modConfirmationHeaders);

											// Reset retry-counter to avoid errors
											rcnt = 0;

											// Start next iteration
											setTimeout(function() {
												next(counter, maxLoops)
											}, 10);
										} else {
											rcnt++;

											// Yeah very funny Valve ...
											setTimeout(function() {
												processAjaxConfirmation();
											}, 1000);
										}
									},
									error: function(xhr, textStatus, errorThrown) {
										rcnt++;
										if (xhr.status == 503 || xhr.status == 502) {

											// Sometimes Steam-Servers are temporarily unavailable - execute retries
											console.log(chrome.i18n.getMessage("background_error_steam_not_available")+ xhr.status);
											setTimeout(function() {
												processAjaxConfirmation();
											}, 1000);

										} else {

											console.log(chrome.i18n.getMessage("background_error_steam_server"));
											// In case other errors occur just start next iteration
											setTimeout(function() {
												next(counter, maxLoops)
											}, 10);
										}
									}
								});
							} else {
								rcnt = 0;
								console.log('Trade-Confirmation failed - reason unknown');
								// Start next iteration
								setTimeout(function(){
									next(counter, maxLoops);
								}, 10);
							}
						}

						// Only start if this is the first iteration
						// OnError will start the function by itself
						if (rcnt <= 1) {
							processAjaxConfirmation();
						}
					});
				});
			});
		});
	})(0, cnt);
}


// Generate Hashes for device-id (needed for 2fa)
function generateHexString(length) {
	var ret = "";
	while (ret.length < length) {
		ret += Math.random().toString(16).substring(2);
	}
	return ret.substring(0, length);
}