// send trade for steam sale cards by appid (summer-sale 2018 = 876740) to a partner
// send trade for steam sale cards by appid (winter-sale 2018 = 991980) to a partner
// 765611980-48432253 - cards
// first code to be executed is the following, which should return assetids of completes sets only
getSaleCards(991980); // REPLACE APPID BY SALE-APPID
async function getSaleCards(appid){
    await g_ActiveInventory.LoadCompleteInventory();
    var checkTags =(a,s,p)=>{var l=a.length,r=0;for(var i=0;i<l;i++){if(a[i][p]===s){r=1;break;}}return r};
    var fullCnt =(o)=>{return Object.keys(o).reduce((r, i)=>{var l=o[i].length;return (l<r)?r=l:r},1e6)};
    var fullSets =(o,c)=>{return Object.keys(o).map(i=>{o[i].length=c;return o[i];})};
    var inventory = window.g_ActiveInventory.m_rgPages;
    var nodes = inventory.map(page => { return Array.from(page[0].childNodes) });
    var childs = nodes.flat(1).reduce((r, child) => {
        if(child.rgItem
        && child.rgItem.contextid == 6
        && child.rgItem.appid == 753
        && child.rgItem.description.market_fee_app == appid
        && checkTags(child.rgItem.description.tags,"item_class_2","internal_name")
        && checkTags(child.rgItem.description.tags,"cardborder_0","internal_name"))
        {
            var cname = child.rgItem.description.name.replace(/[^A-Z0-9]/ig, "_");
            if(r.hasOwnProperty(cname)){ r[cname].push(child.rgItem.assetid);
            } else { r[cname] = [child.rgItem.assetid];}
        }
        return r;
    }, {});
    console.log('Check all card-data: ',childs);
	var cnt = fullCnt(childs), full = fullSets(childs, cnt);
    console.log('Complete Sets Count: '+cnt);
	console.log('Complete Sets: ', full);
	console.log('String to be copied: ', JSON.stringify(full.flat(1)));
};

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