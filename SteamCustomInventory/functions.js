var entrycount = 25;
var user_items = {};

$(document).ready(function(){

	// temporarily overwrite about-page for testing


	// Param
	// #1: items
	// #2: items/page
	sara.createPageNodes(500, entrycount);

    $.ajax({
      type: 'GET',
      url: 'http://steamcommunity.com/inventory/76561198042551040/753/6?l=german&count=100',
      success: function(res){
      	console.log(res);
      }
    });

	//document.querySelectorAll('.sara_item_wrapper')[0].style.display = 'inline-block';

	// Disable selection to avoid pages being scrolled to wrong positions
	$('#sara_wrapper').on('mousedown', function(){ return false; });

	// Scroll with Pagination-Buttons
	$('.paginate.left, .paginate.right').on('click', sara.scrollPages);

	// Scroll with Mousewheel
	$('#sara_inventory').on('mousewheel', sara.scrollPages);

	// Item-Selection
	$('#sara_inventory').on('click', '.sara_item', sara.singleSelection);
	$('#sara_inventory').on('click', '.sara_item', sara.multiSelection);

	// Trigger Multi-Select
	$('#multi_select').on('click', sara.multiSelect);

});

sara = {

	createPageNodes: function(num, cnt){
  
		// Maximum Pages
		num = Math.ceil(num/cnt)*cnt;

		// Update Pages-Counter
		sara.updatePagesCounter(1, (num/cnt));

		// Define Variables
		var itemcontainer = document.createElement('div'),
    			 fragment = document.createDocumentFragment();
		itemcontainer.className = 'sara_item it'+cnt;
	    
	    // Create Item-Nodes
	    var row = Math.pow(cnt, 0.5), // use math.pow to get the number of entrys for one row
			  x = num/row, 			  // number of row-"packets"
	   		  i = 0;

	   	// Iteration of row-"packets"
		for(var j=0; j<x; j++){

			i = (Math.floor(j/row)*(cnt-row))+j, r = row;

			while(r--){
				itemcontainer.textContent = i+1;
				fragment.appendChild(itemcontainer.cloneNode(true));
				i+=row;
			}

		}
		// Add elements to page
		document.getElementById("sara_inventory").appendChild(fragment);

		// Update displayed Nodes
		sara.updateNodeDisplay(0, entrycount);

	},

	scrollPages: function(e){

		// Stop bubbling
		e.preventDefault();
        e.stopPropagation();

		// Return if animation is in progress
	    if($('#sara_inventory:animated').length) return false;

	    // Define Variables
		var clicked = e.target.className.split(' ')[1] || '',
			  start = parseInt($('#pagination span:eq(0)').attr('data-counter')),
				end = parseInt($('#pagination span:eq(2)').attr('data-counter')),
				 sL = $('#sara_inventory').scrollLeft(),
				  a = b = c = d = 0;

	    // Add Support for Mousewheel
	    if(e.type == 'mousewheel') clicked = (e.originalEvent.wheelDelta/120 > 0) ? 'left' : 'right';

		// Calculate Scroll
		if(clicked == "left"  &&  start > 1) a = start-1, b = sL-500, c = start-1;
		if(clicked == "right" &&  start<end) a = start  , b = sL+500, c = start+1;
		if(a == 0) return false; // avoid scrolling to non-existent pages

		// Update Pagination-Counters
		sara.updatePagesCounter(c, end);	
		// Update displayed Nodes
		sara.updateNodeDisplay(a, entrycount);

		// Animate Scroll
		$('#sara_inventory').animate({ 
		    scrollLeft: b,
		    duration: 100
		}, function(){
			// can be removed, just leave it here if we need an approach for
			// better performance due to to much repainting
	    	// $('.sara_item_wrapper:eq('+d+')').css('display', 'none');
		});

	},

	updatePagesCounter: function(start, end){

		// Since it seems to be impossible to deactivate the last arrow 
		// with CSS only we need some JS to do this
		if(start == end) $('.paginate.right').attr('data-disabled', 1);
		if(start != end) $('.paginate.right').attr('data-disabled', 0);
		// Finally Update the Pagination-Counters
		$('#pagination span:eq(0)').attr('data-counter', start),
		$('#pagination span:eq(2)').attr('data-counter', end);

	},

	updateNodeDisplay: function(site, cnt){
		console.log("nodes updated")
		// Display nodes of next page
		for(var i=0;i<cnt;i++){
			$(".sara_item:eq("+((site*cnt)+i)+")").show(); 
		}

	},

	singleSelection: function(e){

		if(!$(e.currentTarget).hasClass('selection')){
			$('.sara_item').removeClass('selection');
			$(e.currentTarget).addClass('selection');
		}

	},

	multiSelection: function(e){

		// Don't use multi-select if it isn't activated
		if($('#multi_select').attr('data-multi-on') == 0) return;
		var target = e.currentTarget;

		if(e.shiftKey){

		} else if(e.ctrlKey){

		} else {
			$(target).not('.disabled').toggleClass('multi_selection');
		}

	},

	multiSelect: function(e){

		var x = $(e.currentTarget).attr('data-multi-on');

		// If we deactivate multi-select deselect all items
		if(x == 1) $('.sara_item').removeClass('multi_selection');

		// toggle state of multi-select
		$(e.currentTarget).attr('data-multi-on', 1-x);

	}

}