// We need to declare schemes for displaying the database-frontend
// and some additional classes for custom actions
$('head').append(`
	<script class="Refresh-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon refresh" style="background-size: 14px;margin-right: 5px;" /></script>
	<script class="ExportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon export-json" /></script>
	<script class="ImportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon import-json" /><input type="file" accept=".json" style="display:none;"></script>
	<script class="ClearTable-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon clear-table" /></script>
	<script class="GetDataOfOwnedGames" type="text/x-jsrender"><a class="e-toolbaricons e-icon owned-games" /></script>
	<script class="GetBadgesAndLevel" type="text/x-jsrender"><a class="e-toolbaricons e-icon owned-badges" /></script>
	<script class="GetBadgesForUser" type="text/x-jsrender"><a class="e-toolbaricons e-icon users-badges" /></script>
	<script class="GetAllGamesWithBadges" type="text/x-jsrender"><a class="e-toolbaricons e-icon steam-badges" /></script>
`);

$(function(){
	idb.fillGrid('steam_users').done(function(data){
		$('#acontent').ejGrid({
			dataSource: ej.DataManager(data),
			allowPaging: true,
			allowSorting: true,
			allowScrolling : false,

			enableTouch:false,

			pageSettings: {
				pageSize: 50
			},

			editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
			toolbarSettings: {
				showToolbar: true,
				customToolbarItems: [
					{ templateID: ".Refresh-Button" },
					{ templateID: ".ExportJSON-Button" },
					{ templateID: ".ImportJSON-Button" },
					{ templateID: ".ClearTable-Button" },
					{ templateID: ".GetBadgesAndLevel"}
				],
				toolbarItems: ["add","edit","delete","update","cancel","search"]
			},
			toolbarClick: "onToolBarClick",

			columns: [
				{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
				{ field: "type", headerText: chrome.i18n.getMessage("index_table_typ"), width: 100, editType: ej.Grid.EditingType.Dropdown, dataSource: [{"text" : "Smurf", "value" : "Smurf"}, {"text" : "Master", "value" : "Master"}], validationRules: { required: true }  },
				{ field: "login_name", headerText: chrome.i18n.getMessage("index_table_login_name"), width: 150, validationRules: { required: true }  },
				{ field: "login_pw",
					headerText: chrome.i18n.getMessage("index_table_login_pw"),
					width: 150,
					validationRules: { required: true },
					cssClass: "passwordColumn",
					editTemplate: {
						create: function (){ return '<input>'; },
						read: function (args) { return args.ejMaskEdit("get_UnstrippedValue"); },
						write: function (args) {
							args.element.ejMaskEdit({
								value: args.rowdata["login_pw"]
							});
						}
					}
				},
				{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
				{ field: "email", headerText: chrome.i18n.getMessage("index_table_email"), width: 250 },
				{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
				{ field: "level", headerText: chrome.i18n.getMessage("index_table_lvl"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
				{ field: "active", headerText: chrome.i18n.getMessage("index_table_act"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "verified", headerText: chrome.i18n.getMessage("index_table_verified"), width: 85, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "csgo", headerText: chrome.i18n.getMessage("index_table_csgo"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 5] } },
				{ field: "community", headerText: chrome.i18n.getMessage("index_table_com"), width: 100, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 5] } },
				{ field: "purchased", headerText: chrome.i18n.getMessage("index_table_purchased"), textAlign: ej.TextAlign.Center, width: 100, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "group", headerText: chrome.i18n.getMessage("index_table_group"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "friend", headerText: chrome.i18n.getMessage("index_table_friend"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "public", headerText: chrome.i18n.getMessage("index_table_public"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "skip", headerText: chrome.i18n.getMessage("index_table_skip"), width: 75, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Boolean, type: ej.Grid.EditingType.Boolean },
				{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
				{ field: "steamMachine", headerText: chrome.i18n.getMessage("index_table_cookie"), width: 320 },
				{ field: "apikey", headerText: chrome.i18n.getMessage("index_table_api"), width: 260 },
				{ field: "revocation_code", headerText: chrome.i18n.getMessage("index_table_rcode"), width: 85, validationRules: { minlength: 6, maxlength: 6 } },
				{ field: "shared_secret", headerText: chrome.i18n.getMessage("index_table_shared"), width: 250 },
				{ field: "identity_secret", headerText: chrome.i18n.getMessage("index_table_identity"), width: 250 },
				{ field: "device_id", headerText: chrome.i18n.getMessage("index_table_device"), width: 400 },
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
		});
	});
});

$(function(){
	idb.fillGrid('users_games').done(function(data){
		$('#gcontent').ejGrid({
			dataSource: ej.DataManager(data),
			allowPaging: true,
			pageSettings: {
				pageSize: 100
			},
			allowSorting: true,
			allowScrolling : false,
			allowGrouping: true,
			allowResizeToFit : true,
			groupSettings: {
				/*groupedColumns: ["username"],*/
				showDropArea: false,
				enableDropAreaAutoSizing: false,
				showToggleButton: true,
				showGroupedColumn: true
			},
			enableTouch:false,
			editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
			toolbarSettings: {
				showToolbar: true,
				customToolbarItems: [
				{ templateID: ".Refresh-Button" },
				{ templateID: ".ExportJSON-Button" },
				{ templateID: ".ImportJSON-Button" },
				{ templateID: ".ClearTable-Button" },
				{ templateID: ".GetDataOfOwnedGames" }
				],
				toolbarItems: ["add","edit","delete","update","cancel","search"]
			},
			toolbarClick: "onToolBarClick",

			columns: [
				{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
				{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
				{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
				{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
				{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
				{ field: "product_key", headerText: chrome.i18n.getMessage("index_table_product_key"), width: 150 },
				{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
				{ field: "added", headerText: chrome.i18n.getMessage("index_table_added"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
			endEdit: "endEdit",
			create: "create"
		});
	});
});

$(function(){
	idb.fillGrid('users_badges').done(function(data){
		$('#ucontent').ejGrid({
			dataSource: ej.DataManager(data),
			allowPaging: true,
			pageSettings: {
				pageSize: 100
			},
			allowSorting: true,
			allowScrolling : false,
			allowGrouping: true,
			allowResizeToFit : true,
			groupSettings: {
				/*groupedColumns: ["username"],*/
				showDropArea: false,
				enableDropAreaAutoSizing: false,
				showToggleButton: true,
				showGroupedColumn: true
			},
			enableTouch:false,
			editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
			toolbarSettings: {
				showToolbar: true,
				customToolbarItems: [
					{ templateID: ".Refresh-Button" },
					{ templateID: ".ExportJSON-Button" },
					{ templateID: ".ImportJSON-Button" },
					{ templateID: ".ClearTable-Button" },
					{ templateID: ".GetBadgesForUser" }
				],
				toolbarItems: ["add","edit","delete","update","cancel","search"]
			},
			toolbarClick: "onToolBarClick",

			columns: [
				{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
				{ field: "username", headerText: chrome.i18n.getMessage("index_table_username"), width: 150 },
				{ field: "steam_id", headerText: chrome.i18n.getMessage("index_table_steamid"), width: 150, validationRules: { required: true, range: [70000000000000000, 79999999999999999] }  },
				{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
				{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
				{ field: "max_lvl", headerText: chrome.i18n.getMessage("index_table_maxlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
				{ field: "cur_lvl", headerText: chrome.i18n.getMessage("index_table_curlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },				
				{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
				{ field: "crafted", headerText: chrome.i18n.getMessage("index_table_crafted"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
			endEdit: "endEdit",
			create: "create"
		});
	});
});

$(function(){
	idb.fillGrid('steam_badges').done(function(data){
		$('#bcontent').ejGrid({
			dataSource: ej.DataManager(data),
			allowPaging: true,
			pageSettings: {
				pageSize: 100
			},
			allowSorting: true,
			allowScrolling : false,
			allowGrouping: true,
			allowResizeToFit : true,
			groupSettings: {
				/*groupedColumns: ["username"],*/
				showDropArea: false,
				enableDropAreaAutoSizing: false,
				showToggleButton: true,
				showGroupedColumn: true
			},
			enableTouch:false,
			editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
			toolbarSettings: {
				showToolbar: true,
				customToolbarItems: [
					{ templateID: ".Refresh-Button" },
					{ templateID: ".ExportJSON-Button" },
					{ templateID: ".ImportJSON-Button" },
					{ templateID: ".ClearTable-Button" },
					{ templateID: ".GetAllGamesWithBadges" }
				],
				toolbarItems: ["add","edit","delete","update","cancel","search"]
			},
			toolbarClick: "onToolBarClick",

			columns: [
				{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
				{ field: "app_id", headerText: chrome.i18n.getMessage("index_table_appid"), width: 150 },
				{ field: "game_name", headerText: chrome.i18n.getMessage("index_table_game"), width: 150 },
				{ field: "cards_total", headerText: chrome.i18n.getMessage("index_table_cards"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
				{ field: "max_lvl", headerText: chrome.i18n.getMessage("index_table_maxlevel"), width: 150, textAlign: ej.TextAlign.Center, editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 0 }, validationRules: { range: [0, 10000] } },
				{ field: "created", headerText: chrome.i18n.getMessage("index_table_created"), format: "{0:yyyy-dd-MM HH:mm:ss}", width: 150, editType: ej.Grid.EditingType.DateTimePicker, validationRules: { required: true } },
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
			endEdit: "endEdit",
			create: "create"
		});
	});
});

$(function(){
	idb.fillGrid('sara_settings').done(function(data){
		$('#scontent').ejGrid({
			dataSource: ej.DataManager(data),
			allowPaging: true,
			pageSettings: {
				pageSize: 100
			},
			allowSorting: true,
			allowScrolling : false,
			allowGrouping: true,
			allowResizeToFit : true,
			groupSettings: {
				/*groupedColumns: ["username"],*/
				showDropArea: false,
				enableDropAreaAutoSizing: false,
				showToggleButton: true,
				showGroupedColumn: true
			},
			enableTouch:false,
			editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true },
			toolbarSettings: {
				showToolbar: true,
				customToolbarItems: [
					{ templateID: ".Refresh-Button" },
					{ templateID: ".ExportJSON-Button" },
					{ templateID: ".ImportJSON-Button" },
					{ templateID: ".ClearTable-Button" }
				],
				toolbarItems: ["add","edit","delete","update","cancel","search"]
			},
			toolbarClick: "onToolBarClick",

			columns: [
				{ field: "id", headerText: chrome.i18n.getMessage("index_table_id"), width: 50, isPrimaryKey: true, validationRules: { required: true, number: true } },
				{ field: "keyname", headerText: chrome.i18n.getMessage("index_table_keyname"), width: 150 },
				{ field: "val1", headerText: "val1", width: 150 },
				{ field: "val2", headerText: "val2", width: 150 },
				{ field: "description", headerText: chrome.i18n.getMessage("index_table_desc"), width: 550 },
				{ field: "val3", headerText: "val3", width: 150 },
				{ field: "val4", headerText: "val4", width: 150 },
				{ field: "val5", headerText: "val5", width: 150 },
				{ field: "val6", headerText: "val6", width: 150 },
				{ field: "val7", headerText: "val7", width: 150 },
				{ field: "val8", headerText: "val8", width: 150 },
				{ field: "val9", headerText: "val9", width: 150 },
				{ field: "val10", headerText: "val10", width: 150 },
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
			endEdit: "endEdit",
			create: "create"
		});
	});
});

$(document).ready(function(){

	$(document).on('change', '#accounts-json', function(){
		file = $('#accounts-json')[0].files[0];
		fr = new FileReader();
		fr.readAsText(file);

		fr.onloadend = function(e) {

			var accounts = $.parseJSON(fr.result);
			console.log(accounts);
			var db = new Dexie('steamdb');
			db.version(1).stores({steam_users: "++id,&login_name,login_pw,username,email,&steam_id,type,level,csgo,active,verified,purchased,group,friend,public,created,&uuid,&steamMachine,apikey,revocation_code,shared_secret,identity_secret"});
			db.open();

			db.delete().then(function(){ // we will delete the users database on every import
				db.transaction("rw", db.steam_users, function(){
					for(var i=0;i<accounts.length;i++){
						if((typeof accounts[i] !== undefined) && (accounts[i] !== null) && (accounts[i] !== '')){
							db.steam_users.add({
								login_name: accounts[i].login_name,
								login_pw: accounts[i].login_pw,
								username: accounts[i].username,
								email: accounts[i].email,
								steam_id: accounts[i].steam_id,
								type: accounts[i].type,
								level: accounts[i].level,
								csgo: stripquotes(accounts[i].csgo),
								active: stripquotes(accounts[i].active),
								verified: stripquotes(accounts[i].verified),
								purchased: stripquotes(accounts[i].purchased),
								created: accounts[i].created,
								group: stripquotes(accounts[i].group),
								friend: stripquotes(accounts[i].friend),
								public: stripquotes(accounts[i].public),
								uuid: accounts[i].uuid,
								steamMachine: accounts[i].steamMachine,
								apikey: accounts[i].apikey,
								revocation_code: accounts[i].revocation_code,
								shared_secret: accounts[i].shared_secret,
								identity_secret: accounts[i].identity_secret
							});
						}
					}
				}).then(function(){
					console.log('import done');
				}).catch(function (error) { console.error(error); });
			});
		};
	});

	$(document).on('change', '.import-json + input', function(){
		var table = $(this).closest('.e-grid').data('table');
		file = $(this)[0].files[0];
		fr = new FileReader();
		fr.readAsText(file);
		fr.onloadend = function(e) {
			var data = $.parseJSON(fr.result);
			idb.importJSON(data, table);
		};
	});
	// Set up own datafield for Datetime


});

// Fix the Scrollbar-Crap with built-in (browser) scrollbar-feature
// the Syncfusion-Scrollbar has weird bugs, bad performance
// and makes resizing problematic > just use ::webkit
// and scroll the gridheader with its content
$('#acontent .e-gridcontent').waitUntilExists(function(){
	$(this).scroll(function() {
		$('#acontent .e-gridheader').scrollLeft($(this).scrollLeft());
	});
});
function actionBegin(args) { window.userScrollLeft = $('#acontent .e-gridcontent').scrollLeft(); }
function actionComplete(args) { $('#acontent .e-gridcontent').scrollLeft(window.userScrollLeft); }

/*
Syncfusion decided to update all rows when not working with batch-editing
The problem here is that you can´t enter the edit-mode in a column that you can´t
reach by scrolling (hidden area). Then if you enter this area the scrollbar jumps
to the left-side (0px) and you have to scroll to the column again. We fix this by
listening for the action-Events and pinning the scrollbar when the action completes.
For some reason its so fast you can´t see any scrolling effect.
*/
function evtpropscheckedevent(args) {
	var gridObj = $("[id$='content']").data("ejGrid");
	if (gridObj !== undefined){
		switch (args.value) {
			case "actionBegin": gridObj.option(args.value, "actionBegin"); break;
			case "actionComplete": gridObj.option(args.value, "actionComplete"); break;
			default: console.log("here");
		}
	}
	else gridObj.option(args.value, '');
}

function saveDB(value){
	console.log(value);
}

function onToolBarClick(sender, args) {

	var action = $(sender.target).attr('class').split(' ').pop();
	var grid_id = ($(sender.target).parent().attr('id') !== undefined) ? $(sender.target).parent().attr('id').split('_')[0] : '';
	var datatable = $('#'+grid_id).data('table');

	if(action == 'refresh'){

		var grid = $('#'+grid_id).ejGrid('instance');
		idb.fillGrid(datatable).done(function(data){
			grid.dataSource(data);
		});

	} else if(action == 'export-json'){

		idb.exportJSON(datatable);

	} else if(action == 'import-json'){

		createDialog("warning", "Import '"+datatable+"'", chrome.i18n.getMessage("index_table_import1")+datatable+chrome.i18n.getMessage("index_table_import2"), 2);
		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				$(sender.target).next().trigger('click');
			}
		});

	} else if(action == 'clear-table'){

		createDialog("warning", chrome.i18n.getMessage("index_table_clear_table"), chrome.i18n.getMessage("index_table_clear_table_msg"), 2);

		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				idb.clearTable(datatable);
			}
		});

	} else if(action == 'owned-games'){

		createDialog("info", chrome.i18n.getMessage("index_table_get_owend_games"), chrome.i18n.getMessage("index_table_get_owend_games_msg"), 2);

		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				setTimeout(function(){
					// Show progress
					createDialog("info", chrome.i18n.getMessage("index_table_get_owend_games_progress"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
					// Add loading-Indicator
					$('.owned-games').addClass('og-active');
					// Start the worker via background-script
					chrome.runtime.sendMessage({greeting: 'getDataOfOwnedGames'},function(response){
						if(response == 'done'){
							// remove loading-Indicator
							$('.owned-games').removeClass('og-active');
							// Close Dialog which holds the progress-bar
							// wait 5s so the user can read the last message
							setTimeout(function(){
								$("#dialog").ejDialog("close");
							}, 5000);
							// Reload table
							var grid = $('#'+grid_id).ejGrid('instance');
							idb.fillGrid(datatable).done(function(data){
								grid.dataSource(data);
							});
						}
					});
				}, 500);
			}
		});

	} else if(action == 'owned-badges'){

		createDialog("info", chrome.i18n.getMessage("index_table_get_owend_badges"), chrome.i18n.getMessage("index_table_get_owend_badges_msg"), 2);

		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				setTimeout(function(){
					// Show progress
					createDialog("info", chrome.i18n.getMessage("index_table_owend_badges_progress"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
					// Add loading-Indicator
					$('.owned-badges').addClass('og-active');
					// Start the worker via background-script
					chrome.runtime.sendMessage({greeting: 'getDataOfOwnedBadges'},function(response){
						if(response == 'done'){
							// remove loading-Indicator
							$('.owned-badges').removeClass('og-active');
							// Close Dialog which holds the progress-bar
							// wait 5s so the user can read the last message
							setTimeout(function(){
								$("#dialog").ejDialog("close");
							}, 5000);
							// Reload table
							var grid = $('#'+grid_id).ejGrid('instance');
							idb.fillGrid(datatable).done(function(data){
								grid.dataSource(data);
							});
						}
					});
				}, 500);
			}
		});

	} else if(action == 'users-badges'){

		createDialog("info", chrome.i18n.getMessage("index_table_get_user_badges"), chrome.i18n.getMessage("index_table_get_owend_badges_msg"), 2);
		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				setTimeout(function(){
					// Show progress
					createDialog("info", chrome.i18n.getMessage("index_table_owend_badges_progress"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
					// Add loading-Indicator
					$('.users-badges').addClass('og-active');
					// Start the worker via background-script
					chrome.runtime.sendMessage({greeting: 'getDataOfUsersBadges'},function(response){
						if(response == 'done'){
							// remove loading-Indicator
							$('.users-badges').removeClass('og-active');
							// Close Dialog which holds the progress-bar
							// wait 5s so the user can read the last message
							setTimeout(function(){
								$("#dialog").ejDialog("close");
							}, 5000);
							// Reload table
							var grid = $('#'+grid_id).ejGrid('instance');
							idb.fillGrid(datatable).done(function(data){
								grid.dataSource(data);
							});
						}
					});
				}, 500);
			}
		});

	} else if(action == 'steam-badges'){

		createDialog("info", chrome.i18n.getMessage("index_table_get_steam_badges"), chrome.i18n.getMessage("index_table_get_owend_badges_msg"), 2);
		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				setTimeout(function(){
					// Show progress
					createDialog("info", chrome.i18n.getMessage("index_table_owend_badges_progress"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
					// Add loading-Indicator
					$('.steam-badges').addClass('og-active');
					// Start the worker via background-script
					chrome.runtime.sendMessage({greeting: 'getDataOfSteamBadges'},function(response){
						if(response == 'done'){
							// remove loading-Indicator
							$('.steam-badges').removeClass('og-active');
							// Close Dialog which holds the progress-bar
							// wait 5s so the user can read the last message
							setTimeout(function(){
								$("#dialog").ejDialog("close");
							}, 5000);
							// Reload table
							var grid = $('#'+grid_id).ejGrid('instance');
							idb.fillGrid(datatable).done(function(data){
								grid.dataSource(data);
							});
						}
					});
				}, 500);
			}
		});

	}
}