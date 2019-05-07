turnDupesIntoGems(2, 7);
function turnDupesIntoGems(keepCnt, types){
	
	/* 
	Item-Types

	3 - Wallpaper
	4 - Emoticon
	10 - Items from events (spring-cleaning, ...)
	*/
	var itemReg, result, sum=0;
	switch(types){
        case 1: itemReg = "3"; result = {'3': {}}; break;
		case 2: itemReg = "4"; result = {'4': {}}; break;
		case 4: itemReg = "10"; result = {'10': {}}; break;
        case 3: itemReg = "3|4"; result = {'3': {}, '4': {}}; break;
        case 5: itemReg = "3|10"; result = {'3': {}, '10': {}}; break;
        case 6: itemReg = "4|10"; result = {'4': {}, '10': {}}; break;
        case 7: itemReg = "3|4|10"; result = {'3': {}, '4': {}, '10': {}}; break;
        default: alert('This type is not set');
    }

	var itemTypes = new RegExp("item_class_("+itemReg+")");
    var inventory = window.g_ActiveInventory.m_rgPages;
    var nodes = inventory.map(page => { return Array.from(page[0].childNodes) });
    var childs = nodes.flat(1).reduce((r, child) => {
        if(child.rgItem
        && child.rgItem.contextid == 6
        && child.rgItem.appid == 753
        && child.rgItem.description
        && child.rgItem.description.tags)

        // find item_class (background, emoticon, ...)
        child.rgItem.description.tags.find(o => { 
            if(!o.internal_name.match(itemTypes)) return;

            // find item-type
            var rg = child.rgItem;
            var instance = o.internal_name.replace(/\D+/g, '');
			var findLink = rg.description.owner_actions;
			var itype = 0;
            Object.keys(findLink).find(l => {
                if(findLink[l].link.indexOf('GetGooValue') < 1) return;
                itype = /(\d+),\s\d\s\)/.exec(findLink[l].link)[1];
                return false;
            });

            // set object by classid and push assetid's to it
			// use appid of market-hashname - since event-items are
			// using different appids for market_fee_app and hashname
            if(r[instance].hasOwnProperty(rg.classid)){
                r[instance][rg.classid]['assetid'].push(rg.assetid);
            } else {
                r[instance][rg.classid] = {
                    appid: /(\d+)-/.exec(rg.description.market_hash_name)[1],
                    name: rg.description.name,
                    assetid: [rg.assetid],
                    type: o.localized_tag_name,
                    itype: itype,
                    goos: 0
                };
            }
        })
        return r;
    }, result);

	// remove all matches with just 1 item left and keep x items
	Object.keys(childs).map(i => {
		Object.keys(childs[i]).map(f => {
			var asset = childs[i][f]['assetid'];
			if(asset.length <= keepCnt || asset.length <= 1){
				delete childs[i][f];
            } else {
				childs[i][f]['assetid'] = asset.slice(0,-keepCnt);
				sum += (asset.length-keepCnt);
			}
        });
	});
	console.log(`Total of ${sum} items`);
    console.log(childs);

	var obj = [];
	Object.keys(childs).map(i => {
		Object.keys(childs[i]).map(f => {
            obj.push(childs[i][f]);
        });
    });
	console.log(`There are ${obj.length} different items.`);
	console.log(obj);

	var arr = [];
	obj.map(o => {
		o['assetid'].map(a => {
			arr.push({
                appid: o.appid,
                assetid: a,
                type: o.type,
                goos: o.goos
            });
        });
    });
	console.log(arr);
}




Request URL: https://steamcommunity.com/auction/ajaxgetgoovalueforitemtype/?appid=638070&item_type=20&border_color=0
Request Method: GET
Status Code: 200 OK (from disk cache)
Remote Address: 104.74.108.205:443
Referrer Policy: no-referrer-when-downgrade
Cache-Control: public,max-age=300
Content-Length: 30
Content-Security-Policy: default-src blob: data: https: 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://steamcommunity-a.akamaihd.net/ https://api.steampowered.com/ https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/ *.google-analytics.com https://www.google.com https://www.gstatic.com https://apis.google.com; object-src 'none'; connect-src 'self' https://api.steampowered.com/ https://store.steampowered.com/ wss://community.steam-api.com/websocket/ *.google-analytics.com http://127.0.0.1:27060 ws://127.0.0.1:27060; frame-src 'self' steam: https://store.steampowered.com/ https://www.youtube.com https://www.google.com https://sketchfab.com https://player.vimeo.com;
Content-Type: application/json; charset=utf-8
Date: Mon, 31 Dec 2018 20:09:17 GMT
Expires: Mon, 31 Dec 2018 20:14:17 GMT
Last-Modified: Mon, 31 Dec 2018 20:05:00 GMT
Server: nginx
X-Frame-Options: SAMEORIGIN
Provisional headers are shown
Accept: */*
Referer: https://steamcommunity.com/id/el_pandi/inventory/
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36
X-Requested-With: XMLHttpRequest
appid: 638070
item_type: 20
border_color: 0


POST
https://steamcommunity.com/id/el_pandi/ajaxgrindintogoo/?
sessionid=0c57f6aab919214c518753bb&
appid=638070&
assetid=9441816060&
contextid=6&
goo_value_expected=80

request.postData.params


sessionid=0c57f6aab919214c518753bb
appid=846470
assetid=8247776932
contextid=6&
goo_value_expected=1000
846470
8247776932

$J.get('https://steamcommunity.com/my/ajaxgetgoovalue/?sessionid=0c57f6aab919214c518753bb&appid=457140&assetid=8243719644&contextid=6', f => {
	console.log(f);
=>
goo_value: "10"
item_appid: 457140
item_type: 2
strHTML: "<div>Mining Hat ist 10 Edelsteine wert. Möchten Sie diesen Gegenstand in Edelsteine umwandeln? Dies kann nicht rückgängig gemacht werden.</div>"
strTitle: "Mining Hat in Edelsteine umwandeln?"

});