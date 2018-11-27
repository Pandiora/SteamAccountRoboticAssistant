// Fix for warnings about sync requests (we are loading scripts inside html-templates)
$.ajaxPrefilter(function( options, original_Options, jqXHR ){ options.async = true; });

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
	var target = document.querySelector('.wrapper');

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

// Add Listeners for communication with background-page
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

$(document).ready(function(){

	// Sidebar-Toggle - use AdminLTE framework
	toggleSidebar();

	// generate Database menu entries
	idb.opendb().then(function(db){
		var tables = Object.keys(db._allTables),
			tblstr = '';

		for(var i=0;i<tables.length;i++){ tblstr += '<li><a href="#db'+tables[i]+'" data-table="'+tables[i]+'">'+tables[i]+'</a></li>'; }
		$('#loadDbContent').append(tblstr);

		// Events for Content-Loading + Menu
		var hash = window.location.hash;
		(hash === '') ? loadContent($('.sidebar-menu li a').get(0)) : loadContent($('a[href="'+hash+'"]')[0]);	
	});

	$(window).on('hashchange', function(){ loadContent($('a[href="'+window.location.hash+'"]')[0]); });
	$('.sidebar-menu li a, .treeview-menu li a').on('click', function(){ loadContent(this); });

});

function loadContent(that){

	// Don't reload content - especially on hashchange which happens inside this function too
	if($(that).parent().is('.active')) return;

	// Get values to find out which menu-item was clicked
	var parent 		= $(that).parent().get(0),
		menuElem	= $('ul li:eq(0)', parent),
		treeView 	= $(parent).is('.treeview') || false,
		treeIndex	= $(that).closest('.sidebar-menu > li').index(),
		allMenus	= '.sidebar-menu li, .treeview-menu li',
		eid 		= (treeView) ? $('a', menuElem).attr('href') : $(that).attr('href');

	// Toggle active-class on menus
	if(treeView){
		$(allMenus).removeClass('active');
		$(parent).add(menuElem).addClass('active');
	}
	else if(!treeView){
		$(allMenus).add('.sidebar-menu > li:not(:eq('+treeIndex+'))').removeClass('active');
		$(parent).add(menuElem).add('.sidebar-menu > li:eq('+treeIndex+')').addClass('active');
	}

	// Toggle hashchange
	window.location.hash = eid;
	eid = eid.substr(1); // remove #

	// Load Content depending if it uses unique db string or not - remove leading db for function-call
	(/db/.test(eid)) ? loadDatabaseContent(eid.substr(2)) : $('.content-wrapper').html('').load('/app_templates/'+eid+'.html');

}

function toggleSidebar(){

	// Ripped from https://github.com/almasaeed2010/AdminLTE/issues/896

	var $body = $('body');
	// On click, capture state and save it in localStorage
	$($.AdminLTE.options.sidebarToggleSelector).click(function () {
		localStorage.setItem('sidebar', $body.hasClass('sidebar-collapse') ? 1 : 0);
	});

	// On ready, read the set state and collapse if needed
	if (localStorage.getItem('sidebar') === '0') {
		$body.addClass('disable-animations sidebar-collapse');
		requestAnimationFrame(function () {
	  	$body.removeClass('disable-animations');
		});
	}
}

function updateProgress(percent, message){
	var percentage = Math.round(percent);

	$('#progress-bar span').css('width', percentage+'%');
	$('#progress-bar span').attr('data-value', percentage);

	if(message){
		$('#progress-bar + div').text(message);
	}

}