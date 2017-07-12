var cents = 8,
    len = jQuery('.market_listing_cancel_button a').length,
    js = '', iid = '', lid = '',  price = 0, sid = g_sessionID;

(function next(counter, maxLoops) {

    if(counter++ >= maxLoops){
       	console.log('Done!');
        return;
    }

    // Get price of current item and the id
    price = jQuery('.market_listing_cancel_button a').eq(counter-1).parent().parent().prev().prev().prev(),
	price = jQuery('span span span span:eq(0)', price).text().replace(/\s/g, '').replace(',','.'),
    price = parseFloat(price.replace(/[^0-9\.]+/g.exec(price)[0], ''))*100,
    iid = /g',\s'(\w+)/.exec(jQuery('.market_listing_cancel_button a').eq(counter-1).attr('href'))[1];

    // Check if price is in our range
    if(price >= cents){

        // Remove item by sending post-request
        jQuery.ajax({
            method: 'POST',
            url: 'http://steamcommunity.com/market/removelisting/'+iid+'?sessionid='+sid,
            success: function(){
                setTimeout(function(){ next(counter, maxLoops); }, 100);
            }
        });
    } else {
        setTimeout(function(){ next(counter, maxLoops); }, 10);
    }
})(0, len);