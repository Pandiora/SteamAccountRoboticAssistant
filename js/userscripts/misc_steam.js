// Check all games under filters in inventory (while open)
var num = $J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container input').length;
while(num--){
	console.log(num);
	$J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+num+') input').trigger('click');
}

// for filtering the same filters (games) again, just create an array of the checkbox-values of the before
// used filters first, then reload page and iterate over them
var len = $J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container input').length, arr = [];
while(len--){
	arr.push($J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+len+') input').prop('checked'));
}
console.log("Array:"+arr);

var arr = [true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,false,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], len = arr.length;

while(len--){
	if(arr[len])
	$J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+len+') input').trigger('click');	
}

// scroll through inventory
(function next(counter, maxLoops) {

    if(counter++ >= maxLoops){
       	console.log('Done!');
        return;
    }

	setTimeout(function(){ InventoryNextPage(); next(counter, maxLoops); }, 200)

})(0, 15);

// Bulk Booster Unpack
var pagesLen 	= g_ActiveInventory.m_rgPages.length,
	sessionID	= g_sessionID,
	userURL		= /com\/(.*)\/inventory\//.exec(location.href)[1],
	childLen 	= 0, 
	arr 		= [], 
	desc 		= '';

function getBoosterData(){

	// First iterate all pages (there can be ones with items not loaded)
	for(var i=0;i<pagesLen;i++){
		childLen = g_ActiveInventory.m_rgPages[i][0].childNodes.length;

		// Second: iterate all childs of the specific page and get Boosters by type
		for(var j=0;j<childLen;j++){
			item = g_ActiveInventory.m_rgPages[i][0].childNodes[j].rgItem || 0;
			
			// should break if item doesn't have any data and isn't loaded yet
			if(typeof item.description === 'undefined') break;
			desc = item.description.type;

			// If it's a booster add it to our array
			if(desc === "Booster-Pack"){
				arr.push({
					'appid': item.description.market_fee_app,
					'itemid': item.assetid
				});
			}
		}
	}

	// We got our Booster-Data, lets unpack them
	console.log('Got Data for '+arr.length+' Booster-Packs. Unpack them now ...');
	BulkBoosterUnpack();
}

function BulkBoosterUnpack(){

	(function next(counter, maxLoops) {

	    if(counter++ >= maxLoops){
	       	console.log('Done! All Boosters should be unpacked now. Reloading the page ...');
	       	setTimeout(function(){ location.reload(); }, 3000);
	        return;
	    }

        jQuery.ajax({
            method: 'POST',
            url: 'https://steamcommunity.com/'+userURL+'/ajaxunpackbooster/',
            data: {
      			'appid': arr[counter-1].appid,
				'communityitemid': arr[counter-1].itemid,
				'sessionid': sessionID    	
            },
            success: function(){
                setTimeout(function(){ next(counter, maxLoops); }, 100);
            },
            error: function(){
                setTimeout(function(){ next(counter, maxLoops); }, 100);           	
            }
        });

	})(0, arr.length);
}

getBoosterData();

// Select games with probably most cards (arr) for trading with bots (crafiting badges on em for SS)
var container = jQuery(".econ_tag_filter_category div:contains('Spiel'):eq(0)").parent().find(".econ_tag_filter_container"), 
	len = container.length,
	arr = ["AX:EL", "Kingdom: Classic"];

jQuery(".econ_tag_filter_category div:contains('Gegenstandstyp'):eq(0)").parent().find(".econ_tag_filter_label:contains('Sammelkarte')").prev().trigger("click");
jQuery(".econ_tag_filter_category div:contains('Kartenrahmen'):eq(0)").parent().find(".econ_tag_filter_label:contains('Normal')").prev().trigger("click"); 

for(var i=0; i<len; i++){
	if(arr.indexOf(jQuery(container[i]).find("label").text().match(/(.*).\(\d*\)/)[1]) !== -1){
		jQuery(container[i]).find("input").trigger("click");
    }
}

// check foreign inventory for tradable
var pag = 1,
	inv = g_ActiveInventory.m_rgPages[pag][0],
    arr = [];

for(var i=0;i<25;i++){
	if(inv.childNodes[i].rgItem === undefined) break;
	arr.push(inv.childNodes[i].rgItem.description.tradable);
}

console.log(arr);


// check for added licenses for specific date (date-string style can be different depending on your language)
async function checkLicenses(date){
	const result = await fun.fetchData({url: 'https://store.steampowered.com/account/licenses/'});
    let licenses = '';
	$(result).find('tr td.license_date_col').map((index,item) => { 
        if(jQuery(item).text() === date){
            licenses += `
Count: ${index+1}
Added: ${jQuery(item).text().replace(/\s+/g, ' ')}
Title: ${jQuery(item).next().text().replace(/\s+/g, ' ')}\n
			`;
        }
    })
	console.log(licenses);
}
checkLicenses("15. Dez. 2018");