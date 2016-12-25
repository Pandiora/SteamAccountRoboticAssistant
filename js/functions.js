/*************************************************

MUTATION OBSERVER FOR MULTILANGUAGE

Because security-concerns blabla we need to
add mutlilang-text when DOM is updated/modified
(we can´t use placeholders inside html)
Now using Mutation Observer for better performance

*************************************************/
$(document).on("ready", function() {
	$('[data-i18n]').each(function() {
		var datavalue = $(this).data('i18n');
		$(this).prepend(chrome.i18n.getMessage(datavalue));
	});

	// Listen for added elements and iterate over nodelist
	// only update added elements!
	var target = document.querySelector('#main');

	var observer = new MutationObserver(function(mutation) {
		for (var m of mutation) {
			$(m.addedNodes).each(function(value, index) {

				var nodes = $(index).find('[data-i18n]');
				$(nodes).each(function() {
					var datavalue = $(this).data('i18n');
					$(this).prepend(chrome.i18n.getMessage(datavalue));
				});

			});
		}
	});

	var config = { attributes: true, childList: true, subtree: true, characterData: true };
	observer.observe(target, config);
});

/*************************************************

NOTIFICATIONS-AREA

Fill notifications with content and integrate
functions for easily confirming trades'n'stuff

*************************************************/
$(document).on('ready', function(){

	// Click-Event for notifications
	////////////////////////////////
	$('#top-notifications').on('click', function(event){
		$('html').one('click',function(eve) {
			if(eve.target.id != '#top-notifications'){
				// Show active menu-button and notifications if it was clicked
				if($('#notifications-container').is(":visible")){
					$('#top-notifications').toggleClass("active-notification");
					$('#notifications-container').toggleClass("notifications-visible");
				}
			}
		});

		$(this).toggleClass("active-notification");
		$('#notifications-container').toggleClass("notifications-visible");

		event.stopPropagation();

	}).children().click(function(e){
		return false;
	});

	// Toggle display of action-buttons when clicking notification-item
	///////////////////////////////////////////////////////////////////
	$('#notifications-scroller').on('click', '.notifications-item-container', function(event){

		var clicked = $(event.target).attr('class');
		// Avoid confirmation-buttons trigger more events - use regex for the lulz
		if(clicked.match(/nia-ok|nia-br/)){
			return false;
		} else {
			$(this).children('.notifications-item-actions-wrapper').stop().slideToggle(100);
		}

	});

	// Toggle display of different notifications-items defined by classes
	// and also toggle display of additional action-buttons for xy all
	/////////////////////////////////////////////////////////////////////
	$('.notifications-menu-items span').on('click', function(event){

		var clicked = $(event.target).parent().attr('id');

		if($(event.target).parent().hasClass('notifications-menu-active')){
			return false; // just avoid useless rerendering
		} else {

			// Set background of menu-item to active
			$('.notifications-menu-items').removeClass('notifications-menu-active');
			$(event.target).parent().addClass('notifications-menu-active');

			// Show additional buttons for accepting/declining all items
			if(clicked.match(/market|trades|gifts/)){ // again regex for the lulz
				if($('#toolbar-actions-wrapper').is(':hidden')){
					$('#toolbar-actions-wrapper').stop().slideToggle(200);
				}
			} else {
				if($('#toolbar-actions-wrapper').is(':visible')){
					$('#toolbar-actions-wrapper').stop().slideToggle(200);
				}
			}

			// Show notifications-items that match the clicked menu-item
			// Add a background to scroller-container if there are no items for this menu-item
			if($('.'+clicked).length > 0){
				$('#notifications-scroller').removeClass('no-notification-items');
				$('.notifications-item-container:not(.'+clicked+')').hide();
				$('.'+clicked).show();
			} else {
				$('#notifications-scroller').addClass('no-notification-items');
				$('.notifications-item-container:not(.'+clicked+')').hide();
			}
		}
	});

	// Handle click-Event for bulk-actions
	// Only for Market and Trades
	$('#notifications-toolbar').on('click', '.notifications-toolbar-actions', function(){

		var i;
		var elemArr = [];
		var clicked_menu = $('.notifications-menu-items.notifications-menu-active').attr('id').substr('5');
		var clicked_action = $(this).attr('class').split(' ').pop();
		var action_text = (clicked_action == 'confirm' ? chrome.i18n.getMessage("index_confirm_all") : chrome.i18n.getMessage("index_decline_all"));

		// Only use bulk-actions on market and trades here
		if(clicked_menu == 'market' || clicked_menu == 'trades'){

			// Get all visible elements of this group
			elemArr = $('.notifications-item-container:visible');
			var len = elemArr.length;

			// Only iterate if there are elements
			if(typeof len !== 'undefined' && len > 0){

				// Last Warning
				createDialog("info", capitalizeFirstLetter(clicked_action)+" all "+capitalizeFirstLetter(clicked_menu)+"-Items", action_text, 2);

				// Only start if okay was cliked
				$("#okai").on("click", function() {

					var items = [];

					if($(this).attr("id") == "okai"){
						for(i=0; i<len; i++){
							items.push({cid: $(elemArr[i]).data('confid'), ck: $(elemArr[i]).data('key')});
						}
						sendConfirmation(items, clicked_action);
					}
				});
			} else {
				console.log(chrome.i18n.getMessage("index_confirm_no_items"));
			}
		}
	});

	// Handle click-Event for item action-buttons
	// Only for Market and Trades
	$('#notifications-scroller').on('click', '.noti-market .notifications-item-actions, .noti-trades .notifications-item-actions', function(){
		var clicked_action = $(this).attr('class').split(' ').pop();
		var confid = $(this).parents('.notifications-item-container').data('confid');
		var datakey = $(this).parents('.notifications-item-container').data('key');
		var items = [];

		items.push({cid: confid, ck: datakey});

		// Last Warning
		createDialog("info", chrome.i18n.getMessage("index_confirm_one_item_head"), chrome.i18n.getMessage("index_confirm_one_item"), 2);

		// Only start if okay was cliked
		$("#okai").on("click", function() {
			if($(this).attr("id") == "okai"){
				sendConfirmation(items, clicked_action);
			}
		});
	});

	// Get Notifications additionally on Reload
	addNotificationsTrades();

});

function sendConfirmation(items, action){

	// Determine if entry has to be accepted or declined
	if(action == 'confirm' || action == 'nia-ok'){
		chrome.runtime.sendMessage({greeting: 'acceptConfirmation', items:items},function(response){
			console.log(response);
		});
	} else if(action == 'decline' || action == 'nia-br'){
		chrome.runtime.sendMessage({greeting: 'declineConfirmation', items:items},function(response){
			console.log(response);
		});
	}

}

/*************************************************

Chrome Background-Page Listeners

Receive all messages to execute functions which
needs to be executed periodically. Check for
sender.id and if url-key isn´t set to determine
if this request comes from bg-script. otherwise
we will receive disconnected port-error due to
multiple onMessage-Listeners.

*************************************************/
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	if(sender.id == chrome.runtime.id && !("url" in sender)){
		if(message.greeting == "notifications-trades"){

			addNotificationsTrades();

		} else if(message.greeting == "update-progress"){

			updateProgress(message.percent, message.message);

		} else if(message.greeting == "remove-notification"){

			// Remove the latest removed item when it was succesfully confirmed
			$('.notifications-item-container[data-confid="'+message.cid+'"][data-key="'+message.ck+'"]').fadeOut(400, function(){
				$(this).remove();
				updateNotificationCnt();
			});

		} else {
			console.log(chrome.i18n.getMessage("index_listener_malformed")+message.greeting);
		}
		sendResponse(chrome.i18n.getMessage("index_listener_message_received")+message.greeting);
	}
});

function addNotificationsTrades(){
	// Get the array of notifications from local storage, click the
	// active menu-button again to reload the list of notification-items
	// and update the notification-count
	chrome.storage.local.get(['notifications-trades'], function (local){
		$('.noti-market, .noti-trades').remove();
		$('#notifications-scroller').append(local['notifications-trades']);

		// Only show items for active menu / Fix for reload-problem
		var active_menu = $('.notifications-menu-active').attr('id');
		$('.notifications-item-container:not(.'+active_menu+')').hide();
		$('.'+active_menu).show();

		updateNotificationCnt();
	});

}

function updateNotificationCnt(){

	// A little helper to update the msg-count after elements
	// been added or removed
	$('#top-notifications').attr('data-content', $('.notifications-item-container').length);
	$('#noti-market').attr('data-content', $('.noti-market').length);
	$('#noti-trades').attr('data-content', $('.noti-trades').length);
	$('#noti-gifts').attr('data-content', $('.noti-gifts').length);
	$('#noti-news').attr('data-content', $('.noti-news').length);

}

/*************************************************

MAIN-AREA

Includes every task and function calls which
happens after ready-state.

*************************************************/
$(document).ready(function(){

	// Change startsite after reload if urlhash is set
	$(function(){
		if(window.location.hash) {
			$(window.location.hash).click();
		} else {
			$('#overview').addClass('top-item-active');
		}

		chrome.storage.sync.get(['steamid', 'api_key'], function(items) {
			if($.isEmptyObject(items['steamid']) || $.isEmptyObject(items['api_key'])){
				$('#settings').click(); // Minimum config isn´t there > go to settings
				$('[name="currency"] + .settings-radio-button > div > div').click(); // Set EUR as Standard-Currency
				//$('[name="json_host"]').val(json_host); // Set Standard-JSON-Host
				//var dataObj = {}; dataObj['json_host'] = json_host; setStorage(dataObj);
				showModal('Hint', chrome.i18n.getMessage("index_first_time"),1);
			}
		});
	});

	// Logic for menu - hide/show content on click and add
	// active-class to clicked menu-item or dropdown-item
	// ... and change url-hash
	$('.top-items:not(".top-dropdown")').on('click', function(){

		var idname = $(this).attr('id');
		$('.content').hide();
		$('.top-items').removeClass('top-item-active');

		if($(this).hasClass('dropdown-item')){
			$(this).closest('.top-dropdown').addClass('top-item-active');
		} else {
			$(this).addClass('top-item-active');
		}

		$('#'+idname+'-content').show();
		document.location.hash = idname;

	});

});



// Show Loading-Animation if AJAX is active
$(document).on({
	ajaxStart: function() { $('#main').append('<div id="loading"><div id="steam"><div id="bar"></div></div></div>'); },
	ajaxStop: function() { $('#loading').remove(); }
});
// Function for showing a custom modal
function showModal(title, text, buttoncount){

	var buttons = '';

	if(buttoncount < 2){
		buttons = "<span id='okay'>Okay</span>";
	} else {
		buttons = "<span id='okay'>Okay</span><span id='abort'>Abbrechen</div>";
	}

	$('#main').append("<div id='modal'><div id='modal-title'>"+title+"</div><div id='modal-text'>"+text+"</div>"+buttons+"</div>");

	// Remove modal if clicked on button
	// TODO: If needed implement logic for Abort
	$('#okay, #abort').on('click', function(){ $('#modal').remove(); });
}


/***********************All Stuff for Serials-Content********************************

All Stuff for Serials-Content

************************************************************************************/
$(document).ready(function(){

	$('#serials').on('click', function(){
		if($('#serials-control-panel').length <= 0){
			$.get('../html/serials-controls-template.html ', function(data) {

				$('#serials-content').append(data);
				// only load if theres no content when menu-button is clicked
				if($('.serials-row').length <= 0){
					//getSerials();
				}
			});
		} else {
			$('#booster-content').show();
		}
	});

});
/*function getSerials(){

	chrome.storage.sync.get(['php_file', 'token2', 'currency'], function(synced){
	if(typeof synced['php_file'] != 'undefined'){ // only execute if php-file-path is set
		chrome.storage.local.get(['booster_data'], function (local){

		var cc = ''; // We need to fix the EUR to EUR-Conversion here
		if(synced['currency'] == 'EUR'){ cc = 'USD'; } else { cc = synced['currency']; }
		$.get('https://www.google.com/finance/converter?a=1&from=EUR&to='+cc,function(exchange){
			$.getJSON(synced['php_file']+'?nametoken='+synced['token2'], function(database){
				$.get('../html/serials-template.html', function(response){

			// Currency-Crap
			var ex_rate, cy = '';
			if(synced['currency'] == 'USD'){ ex_rate = $(exchange).find('.bld').html().replace(/[^0-9\.]/g, ''); cy = '$'; } else { ex_rate = 1; cy = '€'; }
			var booster_data = $.parseJSON(local['booster_data']);
			var booster_arr = Object.keys(booster_data).map(function(k) { return booster_data[k]['appid']; });
			var booster_len = booster_arr.length;
			var j = 0, card_drops = 0, card_sum = 0, card_sum_drops = 0;

			for(var i = 0; i < database.length; i++){
				if(typeof database[i].appid != 'undefined'){

					j = getAppidIndex(booster_arr, database[i].appid);

					if(j != -1){
						card_sum = booster_data[j]['cards'] == 16 ? 15 : booster_data[j]['cards'];
						card_drops = parseInt(2*Math.round((booster_data[j]['cards']/2)/2)) || 0;
						card_sum_drops = calcTax(card_drops*booster_data[j]['lowest_price_sell'], ex_rate, true).toFixed(2)+cy;
						$('#serials-content').append(eval(response));
					} else {
						$('#serials-content').append(eval(response));
					}
				}
			}
		});
			});
		});
	});
	}
});
}*/
// a little helper for getSerials() to get the correct index of booster_data
function getAppidIndex(arr, appid){
	for(var i=0;i < arr.length;i++){
		if(appid == arr[i]){
			return i;
		}
	}
	return -1;
}


/***********************All Stuff for Accounts-Content********************************

All Stuff for Accounts-Content

************************************************************************************/
$(document).ready(function(){

	// Set up own datafield for Datetime


});


$('head').append('<script class="Refresh-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon refresh" style="background-size: 14px;margin-right: 5px;" /></script>');
$('head').append('<script class="ExportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon export-json" /></script>');
$('head').append('<script class="ImportJSON-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon import-json" /><input type="file" accept=".json" style="display:none;"></script>');
$('head').append('<script class="ClearTable-Button" type="text/x-jsrender"><a class="e-toolbaricons e-icon clear-table" /></script>');
$('head').append('<script class="GetDataOfOwnedGames" type="text/x-jsrender"><a class="e-toolbaricons e-icon owned-games" /></script>');
$('head').append('<script class="GetBadgesAndLevel" type="text/x-jsrender"><a class="e-toolbaricons e-icon owned-badges" /></script>');

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
			],

			actionBegin: "actionBegin",
			actionComplete: "actionComplete",
		});
	});
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
	var gridObj = $("#acontent, #gcontent").data("ejGrid");
	if (gridObj !== undefined){
		switch (args.value) {
			case "actionBegin": gridObj.option(args.value, "actionBegin"); break;
			case "actionComplete": gridObj.option(args.value, "actionComplete"); break;
		}
	}
	else gridObj.option(args.value, '');
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

	}
}

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

function createDialog(type, title, content, btncnt){

	var btn_list = "";

	// Set up buttons for inserting them into dialog
	if(btncnt == 1){ btn_list = '<td style="width:100%; float:left;"><button id="cancel">'+chrome.i18n.getMessage("inventory_okay_btn")+'</button></td>'; }
	else if(btncnt == 2){	btn_list = '<td style="width:100%; float:left;"><button id="okai">'+chrome.i18n.getMessage("inventory_okay_btn")+'</button><button id="cancel">'+chrome.i18n.getMessage("inventory_cancel_btn")+'</button></td>'; }

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

function updateProgress(percent, message){
	var percentage = Math.round(percent);

	$('#progress-bar span').css('width', percentage+'%');
	$('#progress-bar span').attr('data-value', percentage);

	if(message){
		$('#progress-bar + div').text(message);
	}

}


/***********************All Stuff for Overview-Content*******************************

All Stuff for Overview-Content

************************************************************************************/
$(document).ready(function(){

	// Show Overview-Container and get content
	////////////////////////////////////////
	/*$('#overview').on('click', function(){
		if($('#overview-content').html() === ''){
			$('#overview-content').show();
			getProfileWidget(1200, true);
		}
	});*/

	// Load the needed data for Master-Profile on Start
	// theres no database needed for this

	$('#overview').on('click', function(){
		if(['#overview',''].indexOf(document.location.hash) > -1 && $('#profile-widget').length == 0){
			$('#overview-content').show();
			getProfileWidget(1200, true);
		}
	});

	if(['#overview',''].indexOf(document.location.hash) > -1 && $('#profile-widget').length == 0){
		$('#overview-content').show();
		getProfileWidget(1200, true);
	}

	// Reload Profile-Widget OnClick
	$(document).on('click', '#refresh-profile-widget', function(){
		$('#profile-widget').remove();
		getProfileWidget(1200, false);
	});

	// Reload Database-Widget OnClick
	$(document).on('click', '#refresh-database-widget', function(){
		$('#database-widget').remove();
		getDatabaseWidget(1200);
	});

});
function getProfileWidget(timer, init){

	chrome.storage.sync.get(['steamid', 'api_key', 'currency'], function(synced){
	chrome.storage.local.get(['booster_data', 'appids'], function (local){


		$.getJSON('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+synced['api_key']+'&steamids='+synced['steamid']+'&format=json', function(profile){
		$.getJSON(profile['response']['players'][0]['profileurl']+'inventory/json/753/6', function(inventory){

			$.get('../html/overview-profile-widget.html', function(response){

				// Currency-Crap
				/*var ex_rate, cy = '';
				if(synced['currency'] == 'USD'){ ex_rate = $(exchange).find('.bld').html().replace(/[^0-9\.]/g, ''); cy = '$'; } else { ex_rate = 1; cy = '€'; }
				*/
				var ex_rate = 1, cy = '€', cc = '€';
				var decimal_factor = 2 === 0 ? 1 : Math.pow(10, 2);
				var booster_data = $.parseJSON(local['booster_data']);
				var card_profit_sum = 0, card_sum = 0, j = 0, card_drops = 0, card_value = 0;

				// Append Widget-Template
				$('#overview-content').prepend(eval(response));

				// Fill Games/DLC´s
				// 
				if(local['appids'] !== undefined) $('#db_own_games').animateNumber({ number: local['appids'].length}, timer);
				//TODO FIX $('#db_own_games').animateNumber({ number: local['appids'].length}, timer);

				// Get Data for further informations
				for(var i = 0; i < booster_data.length; i++){
					if($.inArray(booster_data[i]['appid'], local['appids']) !== -1){
						card_drops = parseInt(2*Math.round((booster_data[i]['cards']/2)/2)) || 0;
						card_value = parseFloat(booster_data[i]['lowest_price_sell']) || 0;
						card_sum += parseInt(card_drops) || 0;
						card_profit_sum += card_drops * card_value;
						++j;
						//console.log('Card-Drops: '+card_drops+'\nValue: '+card_value);
					}
				}

				// Fill Card-Drops
				$('#db_own_card_drops').animateNumber({ number: card_sum}, timer);

				// Fill Card-Profit
				$('#db_own_card_profit').animateNumber({ number: calcTax(card_profit_sum,ex_rate, true) * decimal_factor,numberStep: function(now,tween){
					var floored_number=Math.floor(now)/decimal_factor,target=$(tween.elem);
					if(2>0){floored_number=floored_number.toFixed(2);floored_number=floored_number.toString().replace('.', ',');}
					target.text(floored_number+cy);}},timer);

				// Fill STC-Games
				$('#db_own_stc_games').animateNumber({ number: j}, timer);

				// Count CS:GO-Cards by classid
				// Anarchist,Balkan,FBI,IDF,SWAT
				var inv = JSON.stringify(inventory);
				var count = (((inv.match(/149757868/g) || []).length)-6)+
				(((inv.match(/149748025/g) || []).length)-6)+
				(((inv.match(/149754772/g) || []).length)-6)+
				(((inv.match(/149750877/g) || []).length)-6)+
				(((inv.match(/149750036/g) || []).length)-6);

				// Fill owned CS:GO-Cards
				$('#db_own_cs_cards').animateNumber({ number: count}, timer);

				// start next widget if this function was called the first time
				if(init === true){
					getDatabaseWidget(timer);
				}
			});
		});
		});


		 /*var cc = ''; // We need to fix the EUR to EUR-Conversion here
		if(synced['currency'] == 'EUR'){ cc = 'USD'; } else { cc = synced['currency']; }
		$.get('https://www.google.com/finance/converter?a=1&from=EUR&to='+cc,function(exchange){*/
	});
	});
}
function getDatabaseWidget(timer){
/*
	chrome.storage.sync.get(['php_file', 'token1', 'currency'], function(synced){
	if(typeof synced['php_file'] != 'undefined'){ // only execute if php-file-path is set
		chrome.storage.local.get(['booster_data'], function (local){

		var cc = ''; // We need to fix the EUR to EUR-Conversion here
		if(synced['currency'] == 'EUR'){ cc = 'USD'; } else { cc = synced['currency']; }
		$.get('https://www.google.com/finance/converter?a=1&from=EUR&to='+cc,function(exchange){
			$.getJSON(synced['php_file']+'?nametoken='+synced['token1'], function(database){
				$.get('../html/overview-database-widget.html', function(response){

			// Currency-Crap
			var ex_rate, cy = '';
			if(synced['currency'] == 'USD'){ ex_rate = $(exchange).find('.bld').html().replace(/[^0-9\.]/g, ''); cy = '$'; } else { ex_rate = 1; cy = '€'; }
			var percent_number_step = $.animateNumber.numberStepFactories.append('%');
			var decimal_factor = 2 === 0 ? 1 : Math.pow(10, 2);
			var appid_list = $.parseJSON(('["'+database[1]['appid_list'][0]+'"]'));
			var games_list = $.parseJSON(('["'+database[1]['gamecount_list'][0]+'"]'));
			var booster_data = $.parseJSON(local['booster_data']);
			var booster_arr = Object.keys(booster_data).map(function(k) { return booster_data[k]['appid']; });
			var booster_len = booster_arr.length;
			var card_sum = 0, card_drops = 0, card_drops_sum = 0, x = 0;

			// Calculate Card-Drops and Card-Profit by lowest card-sell-price
			// only for those accounts where keys are activated for and build sum
			// so yes, this will only work for listed games
			// TODO: Integrate a button to read actual account-data for owned games
			for(var i = 0; i < appid_list.length; i++){
				for(var j = 0; j < booster_len; j++){
					if(booster_arr[j] === appid_list[i]){
						++x;
						card_drops = parseInt(2*Math.round((booster_data[j]['cards']/2)/2)) || 0;
						card_sum += card_drops*booster_data[j]['lowest_price_sell']*games_list[i];
						card_drops_sum += card_drops*games_list[i];


						
						console.log(x+'. '+'Gametitle: '+booster_data[j]['title']+
						'\nAppid: '+appid_list[i]+
						'\nCards: '+booster_data[j]['cards']+
						'\nCalculated Drops: '+card_drops+
						'\nGame-Count: '+games_list[i]+
						'\nCard-Price: '+booster_data[j]['lowest_price_sell']);
						
					}
				}
			}

			// Append Content
			$('#overview-content:eq(0)').after().append(response);
			$('.accounts-number').text(database[1].accounts_total);

			// Fill and animate circle for used keys
			$('#circle-serials').circleProgress({value: '0.'+database[1].percentage,size: $('#circle-serials').width(),animation: {duration: timer},fill: {gradient:["#12B2FF"]}});
			$('#circle-number').animateNumber({ number:database[1].percentage,numberStep: percent_number_step},timer);

			// Fill database-keys (all accounts)
			$('#db_keys').animateNumber({ number: database[1].keys_total}, timer);

			// Fill games owned by all accounts
			$('#db_accounts_games').animateNumber({ number: database[1].games_total}, timer);

			// Fill all levels
			$('#db_all_levels').animateNumber({ number: database[1].level_total}, timer);

			// Fill highest level
			$('#db_highest_level').animateNumber({ number: database[1].level_highest}, timer);

			// Fill Card-Profit for DB-Accounts
			$('#db_card_profit').animateNumber({ number: calcTax(card_sum,ex_rate, true) * decimal_factor,numberStep: function(now,tween){
				var floored_number=Math.floor(now)/decimal_factor,target=$(tween.elem);
				if(2>0){floored_number=floored_number.toFixed(2);floored_number=floored_number.toString().replace('.', ',');}
				target.text(floored_number+cy);}},timer);

			// Fill Card-Count
			$('#db_card_drops').animateNumber({ number: card_drops_sum}, timer);

		});
			});
		});
	});
	}
	});
*/
}
/***********************All Stuff for Settings-Content*******************************

All Stuff for Settings-Content and Storage

************************************************************************************/
$(document).ready(function(){

	$('#settings').on('click', function(){
		if($('#settings-content').html() === ''){
			$.get('../html/settings-template.html', function(response){
				$('#settings-content').append(response);

				// Set Input-Fields if already stored
				$('.settings-row-input').each(function(){
					getStorage($(this).attr('name'));
				});

				// Set Radio-Buttons if already stored
				$('.settings-row-label').each(function(){
					var attr = $(this).attr("name");
					if(attr){
						getStorage(attr);
					}
				});

				// Set Switch-Buttons if already stored
				$('.onoffswitch-checkbox').each(function(){
					getStorage($(this).attr('name'));
				});
			});
		}
	});

	// JS for Settings-Formular
	///////////////////////////

	// Check only one "radio-button"
	$(document).on('click', '.inner-circle', function(){
		$('.inner-circle').removeClass('inner-circle-active');
		$(this).addClass('inner-circle-active');
	});

	// Save data for inputs
	// everytime input ends (only save data if input changed)
	$(document)
	.on('focus', '.settings-row-input', function(){ $(this).data('originalValue', this.value); })
	.on('blur', '.settings-row-input', function(){

		var original = $(this).data('originalValue');

		if($(this).val() !== '' && original !== this.value){
			var elem = $(this).attr('name');
			var value = $(this).val();
			var dataObj = {};
			dataObj[elem] = value;
			setStorage(dataObj);
		}
	});

	// Save Data for radio-buttons
	$(document).on('click', '.inner-circle:not(".inner-circle-active")', function(){
		var elem = $(this).parent().parent().prevAll('.settings-row-label').attr('name');
		var value = $(this).parent().parent().next().text();
		var dataObj = {};
		dataObj[elem] = value;
		setStorage(dataObj);
	});

	// Save Data for switches
	$(document).on('click', '.onoffswitch-checkbox', function(){
		var dataObj = {};
		var name = $(this).attr('name');

		if($(this).is(':checked')){
			dataObj[name] = true;
			setStorage(dataObj);
		} else {
			dataObj[name] = false;
			setStorage(dataObj);
		}
	});

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

});
function setStorage(value){
	chrome.storage.sync.set(value,function() {
		var result = '';
		if (chrome.extension.lastError) { result = "<div id='save-state-red'>"+chrome.i18n.getMessage("inventory_input_saved_err")+"</div>"; }
		else { result = "<div id='save-state-green'>"+chrome.i18n.getMessage("inventory_input_saved")+"</div>"; }

		$(result)
		.appendTo('#main')
		.fadeIn(200,function() {
			$(this)
			.delay(1500)
			.fadeOut(500, function(){
				$(this).remove();
			});
		});
	});
}
function clearStorage(){
	$('input[name], label[name], div[name]').each(function(){

		var attr = $(this).attr('name');

		chrome.storage.sync.remove(attr, function() {
			console.log('deleted');
		});
	});
}
function checkStorage(value){
	chrome.storage.sync.get(value, function(items) {
		console.log(items[value]);
	});
}
function showStorage(){
	chrome.storage.sync.get(null, function(items) {
		var allKeys = Object.keys(items);
		console.log(allKeys);
	});
}
function getStorage(value){
	chrome.storage.sync.get([value], function(obj){
		if($('[name="'+value+'"]').attr('class') == 'settings-row-label'){
			$('.settings-radio-text:contains("'+obj[value]+'")').prev().children().children().addClass('inner-circle-active');
		} else if($('[name="'+value+'"]').attr('class') == 'onoffswitch-checkbox') {
			$('.onoffswitch-checkbox[name="'+value+'"]').prop('checked', obj[value]);
		} else {
			$('.settings-row-input[name="'+value+'"]').val(obj[value]);
		}
	});
}
// Function to remove double-quotes from imported data to make checkboxes work
function stripquotes(a) {
	if (a.charAt(0) === '"' && a.charAt(a.length-1) === '"') {
		return a.substr(1, a.length-2);
	}
	return a;
}
/***********************All Stuff for Booster-Content*******************************

All Stuff for Booster-Content

************************************************************************************/
$(document).ready(function(){

	// Add Booster-Container and get content
	////////////////////////////////////////
	$('#booster').on('click', function(){
		if($('#booster-control-panel').length <= 0){
			$.get('../html/booster-content.html ', function(data) {

				$('#booster-content').append(data);
				// only load if theres no content when menu-button is clicked
				if($('.booster-row').length <= 0){
					getBoosters(25);
				}
			});
		} else {
			$('#booster-content').show();
		}
	});

	// Logic for booster-control
	// getBoosterData if filter or entry-count changes (except taxes [this is a toggle])
	$(document).on('click', '.booster-control-button:not(".games-active, .taxes-active, .entrys-active")', function(){

		var curele = $(this).attr('class').split(' ').pop();
		$('.'+curele+'-active').removeClass(curele+'-active');
		$(this).addClass(curele+'-active');

		var rownumber = '', filter = '';

		if(curele == 'taxes'){
			rownumber = $('.entrys-active').data('value');
			filter = $('.games-active').data('filter');
		} else if (curele == 'entrys'){
			rownumber = $(this).data('value');
			filter = $('.games-active').data('filter');
		} else if (curele == 'games'){
			rownumber = $('.entrys-active').data('value');
			filter = $(this).data('filter');
		}

		$('.booster-row').remove();
		getBoosters(rownumber, filter);
	});

	// Additional click-event to "toggle" taxes
	$(document).on('click', '.taxes-active', function(){
		$(this).removeClass('taxes-active');
		var rownumber = $('.entrys-active').data('value');
		var filter = $('.games-active').data('filter');
		$('.booster-row').remove();
		getBoosters(rownumber, filter);
	});


});
function getBoosters(loop, filter) {

	/*******************
	Do dat Storage-Shit
	*******************/
	chrome.storage.sync.get(['steamid', 'api_key', 'currency'], function(synced){
	chrome.storage.local.get(['booster_data', 'appids'], function (local){


		$.getJSON('http://steamcommunity.com/market/itemordershistogram?country=DE&language=german&currency=3&item_nameid=26463978',function(price){

			// be stupid - use eval :> to fill variables in html-template
			$.get('../html/booster-template.html', function(response){

				// Parse Booster-Data
				var data = $.parseJSON(local['booster_data']);
				// Get currency exchange
				var ex_rate = 1, cy = ' €', cc = '€';


				j = 0;

				for (i = 1; i <= loop; ++i) {
					if(filter == 'me' || typeof filter == 'undefined'){

						if(local['appids'] !== undefined){
							if($.inArray(data[i]['appid'], local['appids']) !== -1){
								++j;
								var diffMins = calcDate(data[i]['updated']);
								$('#booster-content').append(eval(response));

							} else { ++loop; }
						} else {

								++j;
								var diffMins = calcDate(data[i]['updated']);
								$('#booster-content').append(eval(response));
							
						}

					} else {

						++j;
						var diffMins = calcDate(data[i]['updated']);
						$('#booster-content').append(eval(response));

					}
				}
			});
		});

		/*

		var cc = ''; // We need to fix the EUR to EUR-Conversion here
		if(synced['currency'] == 'EUR'){ cc = 'USD'; } else { cc = synced['currency']; }
		$.get('https://www.google.com/finance/converter?a=1&from=EUR&to='+cc,function(exchange){

		*/

	});
	});
}
function calcTax(number, currency_ratio, foreign){
	var value = number;
	if($('.taxes-active')[0]){ value = (((value/1.15)*100)/100); }
	else if(foreign == true){ value = (((value/1.15)*100)/100); }
	value = (value*currency_ratio);
	return value;
}
function calcDate(date){
	var n = new Date();
	var t = date.split(/[- :]/);
	var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
	var diffMins = Math.abs(Math.round((d.getTime() - n.getTime())/60000));
	return diffMins;
}
function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
