// send trade for steam sale cards by appid (summer-sale 2018 = 876740) to a partner
// 76561198048432253 - cards
// first code to be executed is the following, which should return assetids of completes sets only
g_ActiveInventory.LoadCompleteInventory().done(function(){

	function checkTags(arr,str,prop){var len=arr.length,res=0;for(var i=0;i<len;i++){if(arr[i][prop]===str)res=1}return res}
	function checkCardCount(game){var arr=[],res=0,oarr=Object.keys(game),len=oarr.length;for(var i=0;i<len;i++){arr.push(game[oarr[i]].length)}res=Math.min(...arr);return res}
	function spliceObjArr(obj,cnt){var arr=Object.keys(obj),len=arr.length;for(var i=0;i<len;i++){obj[arr[i]].splice(cnt)}return obj}
	function concatArrays(obj){var arr=Object.keys(obj),ar2=[],len=arr.length;for(var i=0;i<len;i++){ar2.push.apply(ar2,obj[arr[i]])}return JSON.stringify(ar2)}

	var pages     = g_ActiveInventory.m_rgPages,
		len       = pages.length,
		childNode = '',
		appid 	  = 876740,
		obj   	  = {};

	for(var i=0;i<len;i++){

		for(var b=0;b<25;b++){
			if(pages[i][0].childNodes[b].rgItem === undefined) continue;
			childNode = pages[i][0].childNodes[b].rgItem;
			if(childNode.description.tradable !== 1) continue; // only use tradable cards
			// ToDo: additional check for in-trade items needed
			if(childNode.description.market_fee_app !== appid) continue; // match appid (should be appid for specific sale cards)
			if(!checkTags(childNode.description.tags,"item_class_2","internal_name")) continue; // only cards
			if(!checkTags(childNode.description.tags,"cardborder_0","internal_name")) continue; // only normal cards

			var cname = childNode.description.name.replace(/[^A-Z0-9]/ig, "_"),
				asset = childNode.assetid;

			if(obj.hasOwnProperty(cname)){
				obj[cname].push(asset);
			} else {
				obj[cname] = [asset];
			}
		}
	}

	// ToDo: additional check for complete set needed

	var setCount = checkCardCount(obj);
	console.log("There is "+setCount+" set for appid "+appid);

	if(setCount > 0){
		console.log("Reduce arrays to "+setCount+" card");
		spliced = spliceObjArr(obj, setCount);
		console.log("Concatenate all arrays into one");
		concat = concatArrays(obj);
		console.log(concat); // this is a string with all to be send appids, which should appear last in console -> copy it
    }
});


// execute on background-page since headers will be rewritten
// assets is the array we retrieved before
var assets = <replace here>; // place you string with asset id here
var len = assets.length,
	partnersteamid = '', // define the steamid you want to send the trade to between quotes
	sessionid = '', // execute g_sessionID in your console (inventory) and place string here between quotes
	gemassetid = ''; // your partner must've gems (non-sacked) -> find out his assetid for those and place it here between quote
					 // could be i.e. 7914821819 - only one gem is needed

var json = {
  "newversion": true,
  "version": 6,
  "me": { "assets": [],"currency": [],"ready": false },
    "them":{
        "assets":[
            {"appid":"753","contextid":"6","amount":1,"assetid": gemassetid}
        ],
        "currency":[],
        "ready":false
    }
};

// Generate JSON for all cards
for(var i=0;i<len;i++){
  json['me']['assets'].push({
    "appid": "753",
    "contextid": "6",
    "amount": 1,
    "assetid": assets[i]
  });
}

// Finally send our trade
$.ajax({
  url: 'https://steamcommunity.com/tradeoffer/new/send',
  type: 'POST',
  data: {
    'sessionid': sessionid,
    'serverid': '1',
    'partner': partnersteamid,
    'tradeoffermessage': '',
    'json_tradeoffer': JSON.stringify(json),
    'captcha': '',
    'trade_offer_create_params': {}
  },
  success: function(data){
	console.log(data);
  }
});