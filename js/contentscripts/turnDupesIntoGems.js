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
    var nodes = inventory.map(page => { console.log(page); return Array.from(page[0]["m_$Page"][0].childNodes); });
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