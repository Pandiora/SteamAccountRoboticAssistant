/*	
	This script is used to automatically log into Steam with every unlimited account
	and randomly voting for one game/dev without visiting the nominations-page itself
	(the like for Discovery Queue Script by XPaw)

	Generate below object with this script when on nominations-page

	var cat = $J('.category_nominations_ctn').map(function(){ return $J(this).data('voteid')});
	var obj = {};

	for(var i=0;i<cat.length;i++){
		var appids = $J('.category_nominations_ctn:eq('+i+') div.category_nomination')
		.map(function(e){
			return {
				appid: $J(this).data('vote-appid'),
				title: /\d+[\/|-](.*)\//.exec($J('a', this).attr('href'))[1]
	        }
		}).get();
		obj[cat[i]] = appids;
	}
	console.log(JSON.stringify(obj));

*/

// Object contains all possible to be voted games/devs (Winter 2018)
var nominations = {
	"26":[
		{"appid":578080,"title":"PLAYERUNKNOWNS_BATTLEGROUNDS"},
		{"appid":582010,"title":"MONSTER_HUNTER_WORLD"},
		{"appid":379430,"title":"Kingdom_Come_Deliverance"},
		{"appid":863550,"title":"HITMAN_2"},
		{"appid":812140,"title":"Assassins_Creed_Odyssey"}
	],
	"27":[
		{"appid":611670,"title":"The_Elder_Scrolls_V_Skyrim_VR"},
		{"appid":438100,"title":"VRChat"},
		{"appid":620980,"title":"Beat_Saber"},
		{"appid":611660,"title":"Fallout_4_VR"},
		{"appid":617830,"title":"SUPERHOT_VR"}
	],
	"28":[
		{"appid":271590,"title":"Grand_Theft_Auto_V"},
		{"appid":275850,"title":"No_Mans_Sky"},
		{"appid":238960,"title":"Path_of_Exile"},
		{"appid":570,"title":"Dota_2"},
		{"appid":413150,"title":"Stardew_Valley"}
	],
	"29":[
		{"appid":32989758,"title":"CD-PROJEKT-RED"},
		{"appid":33075774,"title":"Ubisoft"},
		{"appid":33028765,"title":"Bethesda"},
		{"appid":1541443,"title":"Rockstar-Games"},
		{"appid":32978945,"title":"Digital-Extremes-Ltd."},
		{"appid":1012195,"title":"Square-Enix"},
		{"appid":33273264,"title":"Capcom"},
		{"appid":6859167,"title":"Paradox-Interactive-Official"},
		{"appid":33042543,"title":"BANDAI-NAMCO-Entertainment"},
		{"appid":112393,"title":"Klei"}],
	"30":[
		{"appid":292030,"title":"The_Witcher_3_Wild_Hunt"},
		{"appid":264710,"title":"Subnautica"},
		{"appid":750920,"title":"Shadow_of_the_Tomb_Raider"},
		{"appid":552520,"title":"Far_Cry_5"},
		{"appid":374320,"title":"DARK_SOULS_III"}
	],
	"31":[
		{"appid":218620,"title":"PAYDAY_2"},
		{"appid":381210,"title":"Dead_by_Daylight"},
		{"appid":359550,"title":"Tom_Clancys_Rainbow_Six_Siege"},
		{"appid":730,"title":"CounterStrike_Global_Offensive"},
		{"appid":728880,"title":"Overcooked_2"}
	],
	"32":[
		{"appid":612880,"title":"Wolfenstein_II_The_New_Colossus"},
		{"appid":812140,"title":"Assassins_Creed_Odyssey"},
		{"appid":394360,"title":"Hearts_of_Iron_IV"},
		{"appid":289070,"title":"Sid_Meiers_Civilization_VI"},
		{"appid":377160,"title":"Fallout_4"}
	],
	"33":[
		{"appid":227300,"title":"Euro_Truck_Simulator_2"},
		{"appid":252950,"title":"Rocket_League"},
		{"appid":524220,"title":"NieRAutomata"},
		{"appid":427520,"title":"Factorio"},
		{"appid":244850,"title":"Space_Engineers"}
	]
};

var nom = (() => {

	var categories = () => {
		return Object.keys(nominations);
	};

	var sessionid  = () => {
		return /sessionid=(.{24})/.exec(document.cookie)[1];
	};

	var nominate = (count, retries) => {

		retries++;
		if(count++ >= categories().length){ nominateDone(); return; }

		// maybe change original object to provide info about if dev or app
		var arr = rndValFromArr(nominations[ categories()[count-1] ]);
		var id  = (categories()[count-1] != 29) ? arr.appid : 0;
		var params = {
			sessionid: sessionid(),
			voteid: categories()[count-1],
			appid: id,
			developerid: (id) ? 0 : arr.appid
		};

		jQuery.ajax({
			url: 'https://store.steampowered.com/salevote',
			type: 'POST',
			data: params,
			success: function(f){
				console.log(`${count}. Voted for ${arr.title}`, f);
				nominate(count, 0);
			},
			error: function(e){
				// retry after a delay
				if(retries < 5){
					setTimeout(function(){ nominate(count-1, retries) }, 1000);
				} else {
					console.log(`Error! Couldn't vote for ${arr.title}`);
				}
			}
		});

	};

	var nominateDone = () => {

        var user = jQuery('#account_pulldown').text();

        chrome.runtime.sendMessage({
          process: 'userSkip',
          parameters: user
        }, function(r) {
          if (r.status === 1) {

          	console.log("All possible votes are done! Logging out ...");
            jQuery.post('https://store.steampowered.com/logout/', {
            	sessionid: sessionid()
            }).done(()=>{
              document.location = 'https://store.steampowered.com/login/';
            });
          }
        });

	};

	var rndValFromArr = (arr) => {
		return arr[Math.floor(Math.random() * arr.length)];
	};

	return {
		nominate
	};

})();

jQuery(document).ready(function(){

	chrome.runtime.sendMessage({
		process: 'winterNominationBit',
		action: 'status'
	}, function(res){

		if(res.status === 0) return;

		if(document.location.href.indexOf("login") > -1){

			setTimeout(function(){
				if (jQuery('.names').length > 0) {
					jQuery('.names:eq(0)').click();
				} else {
					chrome.runtime.sendMessage({
						process: 'winterNominationBit',
						action: 'stop'
					});
				}
			}, 500);

		} else if(document.location.href.indexOf("store") > -1){

			if(jQuery('#account_pulldown').text() === ""){
				document.location = "https://store.steampowered.com/login/";
			} else {
				nom.nominate(0,0);
			}

		}
	});
});