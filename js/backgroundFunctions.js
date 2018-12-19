const bg = (() => {

	const updateCookies = async(snd, currentUser) =>{

		const cookies = await chrome.cookies.getAll({url: snd.tab.url});
		const master = await idb.getMasterRecord();
		const db = await idb.opendb();
	    const user = await db.steam_users
	    	.where('login_name')
	    	.equals(currentUser)
	    	.first();	

		let cookieExists = 0;

        return db.transaction('rw', db.steam_users, function(){

	        // ToDo: Add Bit to force storing new cookies - sara-settings
	        // Iterate all existing cookies and store their values
	        cookies.map(cookie => {

	          // Update steamMachine-Cookies for every account
	          if(cookie.name.indexOf('steamMachineAuth') >= 0){

	            const curcookiesteamid = cookie.name.replace('steamMachineAuth', '');
	            const curcookievalue = cookie.value;

	            // Update Cookies based on steamid
	            db.steam_users
	            .where('steam_id')
	            .equals(curcookiesteamid)
	            .modify({steamMachine: curcookievalue});

	            fun.consoleRgb('info',`
				SteamID64: ${curcookiesteamid}\n
				SteamMachineAuth: ${cookie.name}\n
				Message: Cookie stored in Database
	            `, 1);
	          }

	          /* 
	          	When we iterate multiple accounts it could be possible we need
	          	a cookie again - just tell loginUser to not set the cookie again
	          */
	          if(cookie.name === `steamMachineAuth${master['steam_id']}`
	          	|| cookie.name === `steamMachineAuth${user['steam_id']}`)
	          {
	          	cookieExists++;
	          }

	          /* Don´t remove master-cookie, and Cookies related to age-check
	          	 Additionally don´t remove steamLogin-Cookies when getting logged 
	          	 out due to a purchase and by deleting them we would quit the 
	          	 redirect for the purchase otherwise
	          	 Additonally don't delete current to be logged in cookie if exists
	          */
	          if([
	          	`steamMachineAuth${master['steam_id']}`,
	          	`steamMachineAuth${user['steam_id']}`,
	          	'sessionid',
	          	'lastagecheckage',
	          	'birthtime',
	          	'steamLoginSecure',
	          	'steamLogin',
	          	'stopme'
	          	].indexOf(cookie.name) == -1)
	          {

	            chrome.cookies.remove({
	            	url: snd.tab.url+cookie.path, 
	            	name: cookie.name
	            });

	            fun.consoleRgb('info',`
				${trn('login_msg_cookies_deleted_short')}
				${cookie.name}
	            `, 1);

	          }

	        });
        }).then(function(){
        	return {
        		action: 'start',
        		parameters: cookieExists
        	};
        }).catch(function(err) {
        	return {
        		action: 'stop',
        		message: err
        	};
        }).finally(function(){
          db.close();
        });

	};


	const loginUser = async(snd, msg, sendResponse) => {

		/*
			Host: store.steampowered.com
			Origin: https://store.steampowered.com
			Referrer: https://store.steampowered.com/login/
			Don't use parameters as URL-Parameters
		*/

	    const username = msg.parameters;
	    const baseurl  = /(.*\.com)\//.exec(snd.tab.url)[1];

		// always update/delete cookies
		const storeCookies = await updateCookies(snd, username);
		if(storeCookies.action === 'stop'){
			fun.consoleRgb('error', `
			An error occured while storing/deleting cookies
			${storeCookies.message}`, 1)
			sendResponse({action: 'stop'});
			return;
		}

		// call the db again - just in case cookies got set
	    const db = await idb.opendb();
	    const user = await db.steam_users
	    	.where('login_name')
	    	.equals(username)
	    	.first();		

	    // there is no cookie set, stop logging in
		if(!user['steamMachine']){
            fun.consoleRgb('error',`
			We couldn't find SteamAuth-cookie for user ${user['login_name']}
			in our database. Aborting now.
            `, 1);
            sendResponse({action: 'stop'});
            return;
		}

		// we need to set cookie before logging in - if needed
		if(storeCookies.parameters === 0){
			const setAuth = await setSteamAuthCookie(snd, {
	          name: `steamMachineAuth${user['steam_id']}`,
	          value: user['steamMachine']
	        });
	        fun.consoleRgb('info', setAuth.message, 1);
		}

		// Add a listener to change origin and referrer
		chrome.webRequest.onBeforeSendHeaders
		.addListener(modLoginHeaders, {
			urls: [ 
				"https://store.steampowered.com/login*",
				"https://steamcommunity.com/login*" 
			]
		},['requestHeaders','blocking']);

		// do all login-stuff in this function
		const login = await loginCrypto(user, baseurl);
		if(login.action !== 'done'){
			sendResponse({action: 'stop', message: login.message});
			return;
		}

		// remove the request-listener
		chrome.webRequest.onBeforeRequest.removeListener(modLoginHeaders);

		// return results
		sendResponse({action: login.action, message: login.message});
	};


	const loginCrypto = async(user, baseurl) => {

		/* 
			E X P L A N A T I O N
			- we first need to request rsa-keys to encrypt our password
			- then we ask the server to login, which will set a session cookie
			- then we tell the server our actual auth-code
			- then the server will tell us where to redirect to 
		*/
		const donotcache = new Date().getTime();
		const rsa 		 = await fun.fetchData({
			delay: 0,
			url: `${baseurl}/login/getrsakey/`,
			options: { 
				method: 'POST',
				credentials: 'include' 
			}, 
			format: 'json',
			params: { 
				username: user['login_name'], 
				donotcache: donotcache 
			}
		});

		// retrieving public-key failed
		if(!rsa.success) return {action: 'stop', message: rsa};

		// ToDo: add static-offset to spare one request
		//const time 		= await getServerTime();
		const authCode 			= generateAuthCode(user['shared_secret'], 0);
		const pubKey 			= RSA.getPublicKey(rsa.publickey_mod, rsa.publickey_exp);
		const password 			= user['login_pw'].replace(/[^\x00-\x7F]/g, ''); // remove non-ASCII chars
		const encryptedPassword = RSA.encrypt(password, pubKey);

		// send the login-request and retrieve the cookie
		const doLogin = await fun.fetchData({
			delay: 0,
			url:`${baseurl}/login/dologin/`,
			options: { 
				method: 'POST',
				credentials: 'include' 
			}, 
			format: 'json',
			params: {
			    donotcache: donotcache,
			    password: encryptedPassword,
			    username: user['login_name'],
			    twofactorcode: authCode,
			    emailauth: '',
			    loginfriendlyname: '',
			    captchagid: -1,
			    captcha_text: '',
			    emailsteamid: '',
			    rsatimestamp: rsa.timestamp,
			    remember_login: false
			}
		});

		if(!doLogin || !doLogin.login_complete || doLogin.requires_twofactor){
			return {
				action: 'stop',
				message: doLogin
			};
		}

	    // finally tell the server we got the cookie-data
	    // use format text because the response is html
	    const params = doLogin.transfer_parameters;
	    const setUrl = [
	    	"https://store.steampowered.com/login/transfer/",
	    	"https://help.steampowered.com/login/transfer",
	    	"https://steamcommunity.com/login/transfer/"
	    ];

		let transferParameters = {
			delay: 0,
			url: setUrl[0],
			options: {
				method: 'POST',
				credentials: 'include' 
			}, 
			format: 'text',
			params: {
				steamid: params.steamid,
				token_secure: params.token_secure,
				auth: params.auth,
				remember_login: false
			}
		};

		// set secure-cookies for all steam-domains
		await fun.fetchData(transferParameters)
		transferParameters.url = setUrl[1];
		await fun.fetchData(transferParameters)
		transferParameters.url = setUrl[2];
		await fun.fetchData(transferParameters)

		return {action: 'done', message: params}
	};

	const setSteamAuthCookie = (snd, authcookie) => {

	    const steamMachine 		 = msg.process.toString().split(';')[0];
	    const steamMachine_value = msg.process.toString().split(';')[1];

	    chrome.cookies.set({
	      url: snd.tab.url,
	      name: authcookie.name,
	      value: authcookie.value,
	      path: '/',
	      secure: true,
	      httpOnly: true,
	      expirationDate: (new Date().getTime()/1000) + 1000000000
	    });

	    //Debug cookies not being set
	    fun.consoleRgb('info', `
    	Cookie has been set. Name: ${steamMachine}
    	Value: ${steamMachine_value}`,0);

	    sendResponse({message: trn("login_msg_cookie_exists")});

	};


	const startWebworker = (snd, msg) => {

		msg.snd[1] = snd.tab.id;

	    worker.postMessage(msg);
	    worker.onmsg = function(e){
	      const data = e.data;
	      let ret = false;

	      if(msg.status === 'done'){
	        worker = new Worker('js/webworkers.js');
	      }
	      console.log(data);
	      // ToDo: Update all of these to spare unnecessary loops
	      chrome.windows.getAll({populate:true},function(windows){
	        windows.some(function(window){
	          window.tabs.some(function(tab){
	            console.log(tab);
	            if(tab.url.indexOf(chrome.extension.getURL('index.html')) >= 0){
	              chrome.tabs.sendMessage(tab.id, data);
	              return ret=1;
	            }
	            return ret;
	          });
	        });
	        if(!ret) console.log('Cannot find index.html! Is it opened?');
	      });
	    }
	};


	const getNamesForLogin = async(sendResponse) =>{

	    const db = await idb.opendb();
	    const names = await db.steam_users
	      .where('skip')
	      .equals(0)
	      .toArray(name=>{
	        return name.map(n => { 
	          return n['login_name']; 
	        })
	    });
	    sendResponse({parameters: names});

	};


	const setActionBits = (msg, sendResponse) => {
	    /* 
	      Handler for actions on oneclick-login or other content-scripts unrelated
	      to inventory to only execute the scripts if needed and to track progress
	      [discoveryQueueBit, addFreeLicenseBit, automatedNomination, craftCommunityBadge]
	      use "Bit" as unique identifier for starting actions from oneclick-login
	    */
	    const actions = {
	      stop:0,
	      start:1,
	      status: window[msg.process] || 0
	    };

	    // store at background-page as global vars
	    window[msg.process+'Appid'] = (msg.parameters) ? msg.parameters.appid : null;
	    window[msg.process] = actions[msg.action];


	    // return results
	    sendResponse({
	      status: window[msg.process], 
	      appid: window[msg.process+'Appid']
	    });
	};


	const setSkipForDb = async(snd, msg, sendResponse) => {

	    const db = await idb.opendb();
	    const proc = msg.process;

	    db.transaction('rw', 'steam_users', function(){

		    if(proc === 'underEightPurchasedSkip')
				db.steam_users.each(user => {
					if(!(user.purchased == 1 && user.level < 8))
					db.steam_users.update(user.id, {skip: 1});
				});

	   	    if(proc === 'nonPurchasedSkip')
				db.steam_users.where('purchased').equals(1)
				.modify(user => {
					user.skip = 1;
				});

		    if(proc === 'resetLoginSkip')
				db.steam_users.each(user => {
					db.steam_users.update(user.id, {skip: 0});
				});

		    if(proc === 'purchasedSkip')
				db.steam_users.where('purchased').equals(0)
				.modify(user => {
					user.skip = 1;
				});

		    if(proc === 'communitySkip')
				db.steam_users.where('community').aboveOrEqual(2)
				.modify(user => {
					user.skip = 1;
				});

	    }).then(function(){ 

	    	sendResponse({status: 1}); 
	    
	    }).catch(function(err){

			console.log('Setting Skip failed',err);
			sendResponse({status: 0});

	    }).finally(function(){
	      db.close();
	    });

	};	


	return {
		getNamesForLogin,
		loginUser,
		setActionBits,
		setSkipForDb,
		startWebworker
	}
})();