var retrycnt = 0;
async function getNotificationsTrades(){

	// the conf-token gets generated differently by matching it to the given timestamp
	// due to better results use random device-id based on DoctorMcKay's suggestions https://github.com/DoctorMcKay/node-steamcommunity/issues/27
	const tab 	= await bg.getExtensionTab(),
	user 		= await idb.getMasterRecord(),
	time 		= Math.floor(Date.now() / 1000),
	template  	= await $.get('../html/notification-market-trades-template.html');

	// generate two url's for conf and details
	const generateUrl = (user, time, tag) => {
		const url = 'https://steamcommunity.com/mobileconf/conf?';
		const keyToken = mob.getConfirmationKey(user['identity_secret'], time, tag);

		return parameters = url+[
			`p=android:${mob.generateHexString(40)}`,
			`a=${user['steam_id']}`,
			`k=${encodeURIComponent(keyToken)}`, // Must be encoded
			`t=${time}`,
			`m=android`,
			`tag=${tag}`
		].join('&');
	};

	// get the overview of to be confirmed trades/market-listings
	const fetchData = await fun.fetchData({
	    delay: 0,
	    options: { 
	        method: 'POST',
	        credentials: 'include'
	    },
	    url: generateUrl(user, time, 'conf'),
	    format: 'text'
	});		

	if(!fetchData){
		fun.consoleRgb('error', 
		'Seems like Master-Acc is not logged in', 1);
		return;
	}

	// prevent loading of images
	let data = fetchData.replace(/(<img\s)src([^>]*>)/ig, '$1data-src$2');

	// list seems to be empty or there is another error
	if ($('#mobileconf_empty', data).children().length === 2) {

		// confirmation-list is "empty" - remove data
		await browser.storage.local.set({'notifications': ''});
	    if(tab) browser.tabs.sendMessage(tab.id, {
	    	process: 'notificationsTrades',
	    	action: 'done',
	    	parameters: []
	    });

		fun.consoleRgb('info', trn("confirmation_2fa_confirm_empty"), 1);
	}

	const result = $("#mobileconf_list", data);
	let entryArr = {
		market: [],
		trades: [],
		gifts:  []
	},
	entries = $(result).find(".mobileconf_list_entry");
	entries = $(entries).toArray();

	for (i = 0; i < entries.length; i++) {
		// set up needed variables for notification-items
		const imgsrc 	= $(entries[i]).find('img').data('src'),
			imgcut 		= imgsrc.toString().slice(-7),
			dataConfID 	= $(entries[i]).data('confid'),
			data_key 	= $(entries[i]).data('key'),
			data_url    = generateUrl(user, time, 'details'),
			text1 		= $(entries[i]).find('.mobileconf_list_entry_description div:eq(0)').text(),
			text2 		= $(entries[i]).find('.mobileconf_list_entry_description div:eq(1)').text(),
			text3 		= $(entries[i]).find('.mobileconf_list_entry_description div:eq(2)').text();
			type 		= (imgcut === '32fx32f' ? "market" : "trades");

		// Use jquery-validator to replace placeholders in html-template
		entryArr[type].push($.validator.format(template, [type, dataConfID, data_key, imgsrc, text1, text2, text3, data_url]));
	}

	// store data and announce that we're finished
	await browser.storage.local.set({'notifications': entryArr});
	fun.consoleRgb('info', trn("confirmation_2fa_trades_saved"), 1);
    if(tab) browser.tabs.sendMessage(tab.id, {
    	process: 'notificationsTrades',
    	action: 'done',
    	parameters: entryArr
    });

}


async function processConfirmation(operation, items) {

	const tab 	= await bg.getExtensionTab();
	const user = await idb.getMasterRecord();

	const generateUrl = (user, time, tag, cid, ck) => {
		const url = (cid) 
		? 'https://steamcommunity.com/mobileconf/ajaxop?' 
		: 'https://steamcommunity.com/mobileconf/conf?';

		const keyToken = mob.getConfirmationKey(user.identity_secret, time, tag);

		let parameters = [
			`p=android:${mob.generateHexString(40)}`,
			`a=${user['steam_id']}`,
			`k=${encodeURIComponent(keyToken)}`, // Must be encoded
			`t=${time}`,
			`m=android`,
			`tag=${tag}`
		].join('&');

		if(cid) parameters = [`op=${tag}`,parameters,`cid=${cid}`,`ck=${ck}`].join('&');

		return url+parameters;
	};


	for(const item of items){

		const time 	  = Math.floor(Date.now() / 1000)
		const confurl = generateUrl(user, time, 'conf');
	    const opurl   = generateUrl(user, time, operation, item.cid, item.ck);

	    // We need to modify the Referer dynamically
	    mod.execModConfHeader(confurl,'start');

	    const fetchData = await fun.fetchData({
	    	url: opurl,
	    	format: 'json'
	    });
	    // don't forget to remove the listener
    	mod.execModConfHeader(confurl,'start');

	    if(!fetchData || !fetchData.success){
	    	fun.consoleRgb('error', `There was an error confirming
	    	the item with url ${opurl}`, 1)
	    	return;
	    }

	    // remove the item on frontend
		if(tab) browser.tabs.sendMessage(tab.id, {
			process: 'removeNotification',
			status: 'active', 
			parameters: {
				cid: item.cid,
				ck: item.ck
			}
		});

	}

	// stop spinner on frontend
	if(tab) browser.tabs.sendMessage(tab.id, {
		process: 'removeNotification',
		status: 'done'
	});

}
