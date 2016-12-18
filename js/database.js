// Function for handling and processing all requests to indexedDB
idb = {

	opendb: function(){

		var deferred = $.Deferred();

		db = new Dexie('steamdb');
		db.version(1).stores({
			steam_users: "++id,&login_name,login_pw,username,email,&steam_id,type,level,csgo,community,active,verified,purchased,group,friend,public,skip,created,&uuid,&steamMachine,apikey,revocation_code,shared_secret,identity_secret,device_id",
			users_games: "++id,username,&[steam_id+app_id],steam_id, app_id, [app_id+game_name], game_name, product_key,created"
		});

		db.on('blocked', function () {
			console.log(chrome.i18n.getMessage("background_idb_db_blocked"));
		});

		db.open().then(function(){
			deferred.resolve(db);
		}).catch(function(){
			deferred.reject(db);
		});

		return deferred.promise();

	},
	fillGrid: function(table){

		var deferred = $.Deferred();

		idb.opendb().then(function(db){
			db.transaction("r", db[table], function(link){
				link.toArray().then(function(data){
					deferred.resolve(data);
				}).catch(function(err){
					console.log(err);
				}).finally(function(){
					db.close();
				});
			});
		});

		return deferred.promise();

	},
	importJSON: function(dat, table){

		// We return the chosen table from the data-attribute of the clicked items
		// because this variable is in fact a string and we want to use it as a
		// method-name just write it as db[table] instead of db.[table]

		// We need a loading-Indicator
		$('#main').append('<div id="loading"><div id="steam"><div id="bar"></div></div></div>');

		idb.opendb().then(function(db) {
		  db.transaction("rw", db[table], function() {
		    for (var i = 0; i < dat.length; i++) {
		      if ((typeof dat[i] !== 'undefined') && dat[i]) {
		        db[table].put(dat[i]);
		      }
		    }
		  }).then(function(){

				// Refresh Content after data is imported
				var gridid = $('.e-grid').data('table', table).attr('id');
				var grid = $('#'+gridid).ejGrid('instance');
				idb.fillGrid(table).done(function(data){
					grid.dataSource(data);
				});

		  }).catch(function(err) {
		    console.log(err);
		  }).finally(function() {
		  	db.close();
				// We´re done, remove the loading-Indicator
				$('#loading').remove();
		  })
		});

	},
	exportJSON: function(table){

		// We return the chosen table from the data-attribute of the clicked items
		// because this variable is in fact a string and we want to use it as a
		// method-name just write it as db[table] instead of db.[table]

		createDialog("Info", "Export '"+table+"'", chrome.i18n.getMessage("background_idb_export_json"), 2);
		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){

				// We need a loading-Indicator
				$('#main').append('<div id="loading"><div id="steam"><div id="bar"></div></div></div>');

				idb.opendb().then(function(db) {
					db.transaction("r", db[table], function() {
						db[table].toArray().then(function(a){

							// We download the result as file including the current time
							// JSON.stringify(a, null, "\t") outputs a nice formatted string with tabs
							// Use to localeString to get time in a nice format and replace the string with regex
							download(JSON.stringify(a, null, "\t"),table+'-'+new Date().toLocaleString().replace(/\.|:|,|\s/g,'-')+'.json','application/json');

						});
					}).then(function(){
					}).catch(function(err) {
						console.log(err);
					}).finally(function() {
						db.close();
						// We´re done, remove the loading-Indicator
						$('#loading').remove();
					})
				});
			}
		});

	},
	clearTable: function(table){

		idb.opendb().then(function(db){

			db[table].clear().then(function() {

				// Refresh Content after table was cleared
				// get ID of grid which uses this table dynamically
				var gridid = $('.e-grid').data('table', table).attr('id');
				var grid = $('#'+gridid).ejGrid('instance');
				idb.fillGrid(table).then(function(data){
					grid.dataSource(data);
				});

			}).catch(function(err) {
				console.log(err);
			}).finally(function() {
				db.close();
			});

		});
	},
	getMasterRecord: function(){

		var deferred = $.Deferred();

		idb.opendb().then(function(db){
			db.steam_users.where('type').equals('Master').first(function(user){
				deferred.resolve(user);
			}).catch(function(err){
				console.log(err);
			}).finally(function(){
				db.close();
			});
		});

		return deferred.promise();

	}

}

function download(content, filename, contentType)
{
    if(!contentType) contentType = 'application/octet-stream';
	    var a = document.createElement('a');
	    var blob = new Blob([content], {'type':contentType});
	    a.href = window.URL.createObjectURL(blob);
	    a.download = filename;
	    a.click();
}
