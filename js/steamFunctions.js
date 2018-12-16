const stm = (() => {

    const getSession = async(site, steamid) => {

    	// Returns session token of chosen site
        // supported sites are:
        // [community, store, support]
        // returns 0 if account is not logged in
        // returns 0 if steamid doesn't matches (if arg exists)
        let result;

        const reg_ = {
        	sessionid: /g_sessionID\s=\s"(.*)";/g,
	    	community: /mID\s=\s"(\d+)"/g,
        	support: /steamid\s=\s'(\d+)'/g,
        	store: /tID\s=\s(\d+);/g
        };
        const url_ = {
        	community: 'https://steamcommunity.com/',
        	support:'https://help.steampowered.com/',
        	store: 'https://store.steampowered.com/'
        };

        result = await fun.fetchData({url: url_[site], format: 'text'}, {});
        reg_['sessionid'] = reg_['sessionid'].exec(result); 
        reg_['sessionid'] = (reg_['sessionid']) ? reg_['sessionid'][1] : null;

        if(steamid){

        	// check if steamid is there 
        	// check if it is steamid3 (and convert)
        	// check if steamid matches

        	result = reg_[site].exec(result);
        	result = (result) ? result[1] : null;
        	result = (result && result.length === 8) ? id3(result) : result;
        	result = (steamid === result) ? reg_['sessionid'] : null;
        
        } else {
            result = reg_['sessionid'];
        }

        return result;
    };


    const id3 = (steamid) => {

    	// convert steamid from/to steamid64
    	// stolen and altered from reddit:
    	// https://www.reddit.com/r/Steam/comments/3yoduu/converting_steamid3_to_older_steamid/?st=jabmvb84&sh=29e0634f
		let y,z,result;
		steamid = steamid.toString();

		if(steamid.length === 8){
	    	if ((steamid % 2) === 0){ y = 0; z = (steamid/2); } 
			else { y = 1; z = ((steamid-1)/2); }
			result = "7656119"+((z*2)+(7960265728+y));
	    } else {
			result = steamid.substring(3);
			result = result-61197960265728;
	    }
		return result;
    };


	return {
		getSession
	};
})();
