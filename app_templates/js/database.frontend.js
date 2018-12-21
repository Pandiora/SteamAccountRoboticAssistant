// We need to declare schemes for displaying the database-frontend
// and some additional classes for custom actions
$('head').append(`
	<script class="Refresh-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon refresh" style="background-size: 14px;margin-right: 5px;" /></script>
	<script class="ExportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon export-json" /></script>
	<script class="ImportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon import-json" /><input type="file" accept=".json" style="display:none;"></script>
	<script class="ClearTable-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon clear-table" /></script>
	<script class="getBotGames" type="text/x-jsrender"><a class="e-toolbaricons e-icon getBotGames" /></script>
	<script class="getBotBadges" type="text/x-jsrender"><a class="e-toolbaricons e-icon getBotBadges" /></script>
	<script class="getUsersBadges" type="text/x-jsrender"><a class="e-toolbaricons e-icon getUsersBadges" /></script>
	<script class="getSteamBadges" type="text/x-jsrender"><a class="e-toolbaricons e-icon getSteamBadges" /></script>
`);

function loadDatabaseContent(eid){

	// Load Database-Schemes for frontend
	$.get('app_templates/js/database.column.scheme.js', function(res){

		// we need to eval the strings, else we couldn't read arrays
		buildTemplate(eval(res)[eid], eval(res)[eid+'_toolbar_btn']);

	});

	// use the schemes stored in a separate file to generate table-looks based on the table-name
	// values listed here are probably static and can be reused
	function buildTemplate(columns, custom_buttons){
		var html_template = `
			<link rel='stylesheet' href='app_templates/css/db.content.css'/>
			<script type='text/javascript' src='plugins/globalize/jquery.globalize.min.js'></script>
			<script type='text/javascript' src='plugins/validate/jquery.validate.min.js'></script>
			<script type='text/javascript' src='plugins/validate/jquery.validate.unobtrusive.min.js'></script>
			<script type='text/javascript' src='plugins/render/jsrender.min.js'></script>
			<!-- directly add styles, to avoid flashing containers when async loading -->
			<div class='content' style='background-color: #212121; height: calc(100vh - 50px); padding: 0;'>
				<div id='db_frontend_content' data-table='${eid}' style='background-color: #212121; height: calc(100vh - 183px);'>
					<script type='text/javascript'>
						idb.fillGrid('${eid}').done(function(data){
							$('#db_frontend_content').ejGrid({
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
									customToolbarItems: ${custom_buttons},
									toolbarItems: ['add','edit','delete','update','cancel','search']
								},
								toolbarClick: 'onToolBarClick',

								columns: ${columns},

								actionBegin: "actionBegin",
								actionComplete: "actionComplete",
								endEdit: "endEdit",
								create: "create"
							});
						});
						scrollHeaders(); // fix the scroll-bug
					</script>
				</div>
			</div>
			<div id='dialog'></div>
		`;

		// load the generated string into content-container
		$('.content-wrapper').html('').append(html_template);
	}
}

function createDialog(type, title, content, btncnt){

	var btn_list = "";

	// Set up buttons for inserting them into dialog
	if(btncnt == 1){ btn_list = '<td style="width:100%; float:left;"><button id="cancel">'+trn("inventory_okay_btn")+'</button></td>'; }
	else if(btncnt == 2){	btn_list = '<td style="width:100%; float:left;"><button id="okai">'+trn("inventory_okay_btn")+'</button><button id="cancel">'+trn("inventory_cancel_btn")+'</button></td>'; }

	// Set up Modal parameters
	$("#dialog").ejDialog({
		title: title,
		allowDraggable: false,
		enableResize: false,
		faviconCSS: type
	});

	// Fill Modal with content
	$("#dialog").ejDialog("setContent", '<td>'+content+'</td>'+btn_list);

	// Open Modal
	$("#dialog").ejDialog("open");

	// Wait for action / button-click
	$("#okai, #cancel, #dialog_closebutton").on("click", function() {

		// Close Modal on button-clicks
		$("#dialog").ejDialog("close");

	});

}

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
	// ToDo: Set up own datafield for Datetime


});

// Fix the Scrollbar-Crap with built-in (browser) scrollbar-feature
// the Syncfusion-Scrollbar has weird bugs, bad performance
// and makes resizing problematic > just use ::webkit
// and scroll the gridheader with its content
function scrollHeaders(){
	fun.waitForEl('#db_frontend_content .e-gridcontent', 10, function(that){
		$(that).scroll(function() {
			$('#db_frontend_content .e-gridheader').scrollLeft($(that).scrollLeft());
		});
	});
}
function actionBegin(args) { window.userScrollLeft = $('#db_frontend_content .e-gridcontent').scrollLeft(); }
function actionComplete(args) { $('#db_frontend_content .e-gridcontent').scrollLeft(window.userScrollLeft); }

/*
Syncfusion decided to update all rows when not working with batch-editing
The problem here is that you can´t enter the edit-mode in a column that you can´t
reach by scrolling (hidden area). Then if you enter this area the scrollbar jumps
to the left-side (0px) and you have to scroll to the column again. We fix this by
listening for the action-Events and pinning the scrollbar when the action completes.
For some reason its so fast you can´t see any scrolling take effect.
*/
function evtpropscheckedevent(args) {
	var gridObj = $("#db_frontend_content").data("ejGrid");
	if (gridObj !== undefined){
		switch (args.value) {
			case "actionBegin": gridObj.option(args.value, "actionBegin"); break;
			case "actionComplete": gridObj.option(args.value, "actionComplete"); break;
			default: console.log("unknown action");
		}
	}
	else gridObj.option(args.value, '');
}

function saveDB(value){
	console.log(value);
}

function onToolBarClick(sender, args) {

	var datatable 	= $('#db_frontend_content').data('table'),
		action 		= $(sender.target).attr('class').split(' ').pop(),
		grid 		= $('#db_frontend_content').ejGrid('instance');

	switch(true){
		case (action === 'refresh'):

			idb.fillGrid(datatable).then(function(data){ grid.dataSource(data); });
			break;

		case (action === 'export-json'):

			idb.exportJSON(datatable);
			break;

		case (action === 'import-json'):

			createDialog("warning", "Import '"+datatable+"'", trn("index_table_import1")+datatable+trn("index_table_import2"), 2);
			$("#okai").on("click", function() {
				if($(this).attr("id") == "okai"){
					$(sender.target).next().trigger('click');
				}
			});
			break;

		case (action === 'clear-table'):

			createDialog("warning", trn("index_table_clear_table"), trn("index_table_clear_table_msg"), 2);

			$("#okai").on("click", function() {
				if($(this).attr("id") == "okai"){
					idb.clearTable(datatable).then(()=>{
						// refresh content after deletion
						// fillGrid 2nd paramaeter for refreshing indices not used currently
						idb.fillGrid(datatable).then((data)=>{;
							grid.dataSource(data);
						});
					});
				}
			});
			break;

		case /get/.test(action):

			// match ['getBotGames', 'getBotBadges','getSteamBadges', 'getUsersBadges']
			// action acts as container/string for to be executed functions
			// as strings for css/local and as process-name
			createDialog("info", trn("index_table_"+action), trn("index_table_get_"+action+"_msg"), 2);
			$("#okai").on("click", function() {
				if($(this).attr("id") == "okai"){
					setTimeout(function(){
						// Show progress
						createDialog("info", trn("index_table_"+action+"_progress"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
						// Add loading-Indicator
						$('.'+action).addClass('og-active');
						// Start the worker via background-script
						chrome.runtime.sendMessage({
							action: 'start',
		                    status: 'activate',
		                    sender: ['index',''],
		                    target: ['webworker',''],
		                    process: action,
		                    message: '',
		                    percentage: 0,
		                    parameters: []
						});
					}, 500);
				}
			});
			break;

		default: console.log(`Action ${action} is not implemented (yet)`);
	}
}