async function getDupesIntoGems(message){

	let items = [], msg = message.parameters[0];
	const sessionid = message.parameters[1];
	const inventoryLink = await stm.getInventory();

	// concat objects into array
	Object.keys(msg).map(i => {
		Object.keys(msg[i]).map(f => {
            items.push(msg[i][f]);
        });
    });

	// Get Goo-Amount for each item
	for(let [index, item] of items.entries()){

	    // Update Progress
	    self.postMessage(Object.assign(message,{
	      action: 'UpdateProgress',
	      message: `Get Gem-amount (${index+1}/${items.length})`,
	      percentage: (50/items.length)*index,
	      parameters: []
	    }));

	    // Get goo-value
	    const goos = await fun.fetchData({
	      params: { sessionid: sessionid, appid: item.appid, assetid: item.assetid[0], contextid: 6},
	      url: `${inventoryLink}ajaxgetgoovalue/`,
	      format: 'json'
	    });

	    if(!goos.goo_value){
		    fun.consoleRgb('error', `
	    	Seems like we couldn't get the right gem amount.
	    	Removing the item with the following data:
	    	Name: ${item.name}
	    	Type: ${item.type}
	    	Appid: ${item.appid}
	    	Item-Type: ${item.itype}
	    	First Assetid: ${item.assetid[0]}
	    	Goo-Value: ${JSON.stringify(goos)}
	    	`, 1);
	    	items.splice(index, 1);
	    	continue;
	    }

	    // Store Gem-Amount into Array
	    item.goos = goos.goo_value;
	}

	// create one object for every assetid
	const arr = [];
	items.map(o => {
		// make sure we get > 0 goos
		if(o.goos == 0) return;
		o['assetid'].map(a => {
			arr.push({
                appid: o.appid,
                assetid: a,
                type: o.type,
                goos: o.goos
            });
        });
    });

    // turn items into gems
	for(let [index, item] of arr.entries()){

	    // Update Progress
	    self.postMessage(Object.assign(message,{
	      action: 'UpdateProgress',
	      message: `Get Gem-amount (${index+1}/${arr.length})`,
	      percentage: ((49/arr.length)*index)+50,
	      parameters: []
	    }));

	    // Get goo-value
	    const fetch = await fun.fetchData({
	      params: { 
	      	sessionid: sessionid, 
	      	appid: item.appid, 
	      	assetid: item.assetid, 
	      	contextid: 6,
	      	goo_value_expected: item.goos
	      },
	      url: `${inventoryLink}ajaxgrindintogoo/`,
	      format: 'json',
	      options: { method: "POST" }
	    });

	    if(!fetch || !fetch.success){
		    fun.consoleRgb('error', `
	    	Couldn't turn item into gems due to Steam
	    	throwing errors. (it wasn't me) The server
	    	responded with: ${JSON.stringify(fetch)}
	    	`, 1);
	    }
	}

    // We should be done - final update
    self.postMessage(Object.assign(message,{
      action: 'UpdateProgress',
      status: 'done',
      message: 'We are done!',
      percentage: 100,
      parameters: []
    }));

}
