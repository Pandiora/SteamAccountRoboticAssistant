// Fix for warnings about sync requests (we are loading scripts inside html-templates)
$.ajaxPrefilter(function( options, original_Options, jqXHR ){ options.async = true; });


$(document).ready(function(){

	// generate Database menu entries
	idb.opendb().then(function(db){
		var tables = Object.keys(db._allTables),
			tblstr = '';

		for(var i=0;i<tables.length;i++){ tblstr += '<li><a href="#db'+tables[i]+'" data-table="'+tables[i]+'">'+tables[i]+'</a></li>'; }
		$('#loadDbContent').append(tblstr);
	});

	// Events for Content-Loading + Menu
	var hash = window.location.hash;
		hash = (hash == '') ? loadContent($('.sidebar-menu li a').get(0)) : loadContent($('a[href="'+hash+'"]'));

	$(window).on('hashchange', function(){ console.log('hashchange'); loadContent($('a[href="'+window.location.hash+'"]')); });		
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
		id 			= (treeView) ? $('a', menuElem).attr('href') : $(that).attr('href');

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
	window.location.hash = id;

	// Load Content
	$('.content-wrapper').html('').load('/app_templates/'+id.substr(1)+'.html');

}