const coz = (() =>{

	const sessionid  = () => {
		return /sessionid=(.{24})/.exec(document.cookie)[1];
	};



	const getDoorNum = () => {

		let startTime 	= 1545328800000,
			endTime 	= 1546538400000,
			currentTime = new Date().getTime(),
			diffTime	= (currentTime-startTime),
			diffDays	= parseInt(diffTime/86400000)+1; 

		if(currentTime > endTime) diffDays = 14;

		return openDoors(0,diffDays, 0);
	};



	const getIsoLocalTime = () => {

		const tzoffset = (new Date()).getTimezoneOffset()*60000,
		localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);

		return localISOTime;
	};



	const openDoors = (count, max, retries) => {

		if(!max){ getDoorNum(); return; }

		retries++;
		if(count++ >= max){ doorsDone(); return; }

		const params = {
			sessionid: sessionid(),
			door_index: (count-1),
			t: getIsoLocalTime(),
			open_door: true
		};

		jQuery.ajax({
			url: 'https://store.steampowered.com/promotion/opencottagedoorajax',
			type: 'POST',
			data: params,
			success: function(f){
				console.log(`Kicked in door ${count}`, f);
				openDoors(count, max, 0);
			},
			error: function(e){
				// either already voted or door can't be opened (yet)
				if(e.responseText === 'null'){
					openDoors(count, max, 0);
					console.log(`Error! Door ${count} kicked back`);
					return;
				}
				// retry after a delay
				if(retries < 5){
					setTimeout(function(){ openDoors(count-1, max, retries) }, 1000);
				} else {
					console.log(`Error! Door ${count} kicked back`);
				}
			}
		});
	};



	var doorsDone = () => {

        const user = jQuery('#account_pulldown').text();

        chrome.runtime.sendMessage({
          process: 'userSkip',
          parameters: user
        }, function(r) {
          if (r.status === 1) {

          	console.log("All closed doors are opened! Logging out ...");
            jQuery.post('https://store.steampowered.com/logout/', {
            	sessionid: sessionid()
            }).done(()=>{
              document.location = 'https://store.steampowered.com/login/';
            });
          }
        });

	};



	return {
		openDoors
	}

})();

jQuery(document).ready(function(){

	chrome.runtime.sendMessage({
		process: 'cozyCottageBit',
		action: 'status'
	}, function(res){

		if(res.status === 0) return;

		if(document.location.href.indexOf("login") > -1){

			setTimeout(function(){
				if (jQuery('.names').length > 0) {
					jQuery('.names:eq(0)').click();
				} else {
					chrome.runtime.sendMessage({
						process: 'cozyCottageBit',
						action: 'stop'
					});
				}
			}, 500);

		} else if(document.location.href.indexOf("store") > -1){

			if(jQuery('#account_pulldown').text() === ""){
				document.location = "https://store.steampowered.com/login/";
			} else {
				coz.openDoors();
			}

		}
	});
});