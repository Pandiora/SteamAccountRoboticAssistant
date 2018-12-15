// Function for handling and processing all requests to indexedDB
idb = {

	opendb: function(database, verno, scheme){

		var deferred 	= $.Deferred(),
			defaultdb 	= 'steamdb',
			db 			= (database) ? new Dexie(database) : new Dexie(defaultdb);

		if(db.name === defaultdb){
			db.version(4).stores({
				steam_users: "++id,&login_name,login_pw,username,email,&steam_id,type,level,csgo,community,active,verified,purchased,group,friend,public,skip,created,&uuid,&steamMachine,apikey,revocation_code,shared_secret,identity_secret,device_id",
				users_games: "++id,username,&[steam_id+app_id],steam_id,app_id,[app_id+game_name],game_name,product_key,created,added",
				users_badges:"++id,username,&[steam_id+app_id],steam_id,app_id,[app_id+game_name],game_name,max_lvl,cur_lvl,crafted,created",
				steam_badges:"++id,&[app_id+game_name],app_id,game_name,cards_total,max_lvl,created",
				sara_settings: "++id,&keyname,description,val1,val2,val3,val4,val5,val6,val7,val8,val9,val10"
			});
		} else if(verno && scheme){
			db.version(verno).stores(scheme);
		}

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

	update: function(table){

	},


	bulkAdd: (table, array)=>{

		var deferred = $.Deferred();

	    idb.opendb().then((db)=>{
	      db.transaction('rw', db[table], function*(){
	        db[table].bulkAdd(array)
	        .then((lastKey)=>{
	        	deferred.resolve(lastKey);
	        })
	        .catch(Dexie.BulkError, (e)=>{
	        	console.log(e);
	        });
	      }).catch((err)=>{
	        console.error (err.length);
	      }).finally(()=>{
	        db.close();
	      });
	    });

	    return deferred.promise();
	},

	fillGrid: function(table){

		var deferred = $.Deferred();

		idb.opendb().then(function(db){
			db.transaction("r", db[table], function(link){
				db[table].toArray().then(function(data){
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

	refreshIndices: (database)=>{

		var deferred = $.Deferred();
		const databases = [database, database+'_temp'];

		// Loop 2 times - move database forth and back
		(function next(cnt, max){
			if(cnt++ >= max){
				deferred.resolve();
				return;
	        }

			// ! turns 1 into 0 and vice-versa
			// + turns boolean into integer
			var sdb = new Dexie(databases[cnt-1]),
				ddb = new Dexie(databases[+!(cnt-1)]);

	        sdb.open().then(()=>{

				// Clone scheme
	            const schema = sdb.tables.reduce((result,table)=>{
	              result[table.name] = (
					[table.schema.primKey]
	                .concat(table.schema.indexes)
	                .map(indexSpec => indexSpec.src)
					).toString();
	              return result;
	            }, {});
				ddb.version(sdb.verno).stores(schema);

				// Clone Data and delete source-database
	            return sdb.tables.reduce(
	              (result, table) => result
	                .then(() => table.toArray())
	                .then(rows => ddb.table(table.name).bulkAdd(rows) ),
	              Promise.resolve()		
	            )
				.then((x)=>{ sdb.delete(); ddb.close(); next(cnt,max); })

			})

		})(0, databases.length);

		return deferred.promise()
	},

	clearTable: (table, database)=>{

		var deferred = $.Deferred();

		idb.opendb().then(function(db){
			db[table].clear().then(function(){

				if(database){
					idb.refreshIndices(database).then(()=>{
						deferred.resolve();
					});
				} else {
					deferred.resolve();
				}
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

		return deferred.promise();
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

	},

	settingsProvider: function(){

		var deferred = $.Deferred();

		idb.opendb().then(function(db){
		    db.transaction('r', 'sara_settings', function(){
		    	db.sara_settings.toArray().then(function(arr){
		    		deferred.resolve(arr);
		    	});
		    }).catch(function(err){
		        console.log(err);
		    }).finally(function(){
		        db.close();
		    });			
		});

		return deferred.promise();			

	},

	getMasterGamesWidget: function(count, scale){

		var startTime = performance.now();

		// Set our language to chrome-locale
	   	moment.locale(navigator.language);

	   	// set time-formats and such based on scale (days, months, years)
	   	var cvn = {
	   		'day': ['DD.MMMM','YYYY-MM-DD','10'],
	   		'month': ['MMMM \'YY','YYYY-MM','7'],
	   		'year': ['YYYY','YYYY','4']
	   	};

	    var deferred = $.Deferred(),
	    	startdat = moment();
	    	     obj = { 'label': [], 'count': [] }, 
	    	     arr = [];

	  	// Generate list of [scale] first
	    for(var i=count; i--;){
	        arr.push({ 
	        	'label': moment(startdat).subtract(i, scale).format(cvn[scale][0]),
	        	'dbdate': moment(startdat).subtract(i, scale).format(cvn[scale][1]),
	        	'count': 0
	        });
	    }

		idb.getMasterRecord().done(function(user){
		  idb.opendb().then(function(db){
			db.transaction('r', 'users_games', function(){
				db.users_games.where('steam_id').equals(user.steam_id).toArray(function(date){

					date.map(item => {
						// Find dates which are part of the past xx [scale] - search by [scale][2]
						var d = item.added  || item.created,
							d = d.substr(0, cvn[scale][2]);
						for(var j=count; j--;){ if(arr[j].dbdate == d) arr[j].count += 1; }
					});

		        }).then(function(){
		        	console.log(performance.now()-startTime);
		        	// For better handling, write arrays into obj for frontend
		        	for(var k=0, l=count; k<l;k++){
		        		obj.label.push(arr[k].label);
		        		obj.count.push(arr[k].count);
		        	}

					// Add 1 extra [scale] to avoid bugged tooltip
					obj.label.push(moment(startdat).add(1, scale).format(cvn[scale][0]));

					deferred.resolve(obj);
		        });
		    }).catch(function(err){
		    	console.log(err);
		    }).finally(function(){
		    	db.close();
		    	console.log(performance.now()-startTime);
		    });
		  });
		});

		return deferred.promise();

	},

	getAccountLevelsWidget: function(){

		var deferred = $.Deferred();
		var obj  = {}, arr, activated, color;

		idb.opendb().then(function(db){
		    db.transaction('r', 'steam_users', function(){
		        db.steam_users.each(function(user){

					activated = user.purchased;
					color = randomColor({luminosity: 'dark', count: 1});

					if(!obj[user.level]){
						obj[user.level] = {
							'labels': 'Level '+user.level,
							'data': activated,
							'backgroundColor': color
					        /*'value': 1,
					        'color': color,
					        'highlight': color,
					        'label': 'Level '+user.level,
							'activated': activated*/
		                };
		            } else {
		            	obj[user.level]['data'] += activated;
						/*obj[user.level]['value'] += 1,
						obj[user.level]['activated'] += activated;*/
		            }

		        }).then(function(){

					arr = {
						data: [],
						labels: [],
						backgroundColor: []
					};

					for(key in obj){
						arr.data.push(obj[key].data);
						arr.labels.push(obj[key].labels);
						arr.backgroundColor.push(obj[key].backgroundColor.toString());
		            }			

					deferred.resolve(arr);
		        });
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