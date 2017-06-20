// Some Variables needs to be set on script-load to use them in our events
var multi_selection_bit = 0;
var selectedItem, selectedPage, GiftData, walletInfo;
var STCardsData = [];
var steamID = /g_steamID\s\=\s"(.*)"\;/.exec($('#global_header + script')[0].innerHTML)[1];
var AoE = ['GiftData', 'CSGOCardsData', 'STCardsData', 'WalletInfo']; // Array of Events

/************************************************

MUTATION OBSERVER FOR MULTILANGUAGE

Because security-concerns blabla we need to
add mutlilang-text when DOM is updated/modified
(we can´t use placeholders inside html)
Now using Mutation Observer for better performance

*************************************************/
$(document).on("ready", function(){
  // Replace placeholders on load
  for(i=0;i < $('[data-i18n]').length;i++){
    var datavalue = $('[data-i18n]:eq('+i+')').data('i18n');
    $('[data-i18n]:eq('+i+')').prepend(chrome.i18n.getMessage(datavalue));
  }

  // Listen for added elements and iterate over nodelist
  // only update added elements!
  var target = document.querySelector('body');

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

//
// C U S T O M
// E V E N T - L I S T E N E R
//
addListenerMulti(document, AoE, function(d){

  if(d.type == 'GiftData'){

    GiftData = d.detail;
    //console.log(GiftData);
    $('#gift-titles').empty();
    $('#gift-titles').append('<option value=""></value>');
    for(key in GiftData){
      $('#gift-titles').append('<option value="'+key+'">'+key+' ('+GiftData[key].idarr.length+')</value>');
    }

  } else if(d.type == 'CSGOCardsData'){

    var cards = d.detail;
    var min = Math.min.apply(Math,[cards[149757868].length,cards[149748025].length,cards[149754772].length,cards[149750877].length,cards[149750036].length]);
    var sessionid = /sessionid=(.{24})/.exec(document.cookie)[1];

    // We need to make sure, that we have at least one set of cards to craft 1 badge - else stop
    if(min < 1){
      updateProgress(100, chrome.i18n.getMessage("inventory_msg_not_enough_csgo"));
    } else {
      // We got the card-data - give the user some information
      updateProgress(1, chrome.i18n.getMessage("inventory_msg_sending_trades"));
      // Send the card-data to background-page
      chrome.runtime.sendMessage({greeting: 'sendCsgoCardsBulk', cards: cards, sessionid: sessionid},function(response){
        //console.log(response);
      });
    }

  } else if(d.type == 'STCardsData'){

    var cards = d.detail;
    var selected_cards = [];
    var sessionid = /sessionid=(.{24})/.exec(document.cookie)[1];

    // Only use items we selected and push them into a new array
    for(i=0;i<cards.length;i++){
      if(STCardsData.indexOf(cards[i].assetid) > -1){
        selected_cards.push({
          assetid: cards[i].assetid,
          classid: cards[i].classid,
          market_hash_name: cards[i].market_hash_name,
          market_fee: cards[i].market_fee,
          amount: 1,
          appid: 753,
          contextid: 6,
          price: ''
        })
      }
    }

    $('#marketable-count').waitUntilExists(function(){
      $('#marketable-count span').text(' ('+selected_cards.length+')');
    });

    chrome.runtime.sendMessage({
      greeting: 'getItemMarketPrices', 
      cards: selected_cards, 
      sessionid: sessionid,
      country: walletInfo[0].countryCode,
      eCurrency: walletInfo[0].eCurrencyCode,
      language: walletInfo[0].language
    },function(response){
      if(response.success){
        // update item count, since there could be less cards now
        $('#marketable-count span').text(' ('+response.cards.length+')');
        // we don't need the bar anymore
        $('#progress-bar, #getting-prices-head').hide();
        // now we can enable start-button
        $('#yoyo').attr('disabled', false);

        if($('#auto-list').is(':checked')){
          $("#dialog_wrapper").hide();
          listItemsBulk(response.cards);
        } else {
          $("#yoyo").one("click", function(){
            listItemsBulk(response.cards);
          });     
        }
      }
    });

  } else if(d.type == 'WalletInfo'){
    walletInfo = d.detail;
  }
});

// the needed data isn´t available from the beginning
// so we have to wait until the first element exists
var doneWallet = setInterval(function() {
  if($('a.inventory_item_link:eq(0)').length) {
    clearInterval(doneWallet);
    injectScriptWalletInfo();
  }
}, 10);

// Add Dialog-Wrapper to body so we can use it later
$('body').append("\
  <div id='dialog_wrapper'> \
    <div id='dialog_title'> \
      <div id='dialog_close_btn'></div> \
      <div id='dialog_icon'></div> \
      <div id='dialog_title_txt'></div> \
    </div> \
    <div id='dialog_content'></div> \
  </div> \
");

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  if(sender.id == chrome.runtime.id && !("url" in sender)){
    if(message.msg == "UpdateProgress"){
      if(message["price_add"] === undefined) message["price_add"] = 0;
      if(message["amount"] === undefined) message["amount"] = 0;
      if(message["error"] !== undefined){
        if(message["error"] === true){
          $("#dialog_wrapper").hide();
          createDialog("error", chrome.i18n.getMessage("inventory_dialog_error_process_aborted"), message.message, 0);
        } else {
          updateProgress(message.percentage, message.message, message.price_add, message.amount);
        }
      } else {
        updateProgress(message.percentage, message.message, message.price_add, message.amount);
      }
  	}
	}
});

function updateProgress(percent, message, price_add, amount){

	var percentage = Math.round(percent);

	$('#progress-bar span').css('width', percentage+'%');
	$('#progress-bar span').attr('data-value', percentage);
  if($('#item-prices-sum').length){
    var item_sum = parseFloat($('#item-prices-sum').text().replace(/[^0-9\.\,]+/g,"").replace(",","."));
    item_sum += (price_add*amount);
    $('#item-prices-sum').data('value', item_sum);
    item_sum = item_sum.toLocaleString(undefined, {minimumFractionDigits: 2});
    $('#item-prices-sum').text(item_sum.toString()+" "+walletInfo[0].currencySymbol);
  }

	if(message){
		$('#progress-bar + div').text(message);
	}

  if(percentage == 100){
    if($('#yoyo').attr('disabled')){
      setTimeout(function(){
        $("#dialog_wrapper").hide();
      }, 3000);
    } else {
      $('#yoyo').attr('disabled', false);
    }
  }
}

$(window).on('hashchange', function(){

  // Toggle buttons based on hashes
  // --------------------------------------------
  var hash = window.location.hash.substring(1);
  var selected_hash = $('#contextselect_activecontext div').length > 0 ? $('#contextselect_activecontext div').attr('id').replace('context_option_', '') : '';

  if(((hash && selected_hash) == '753_1') 
  || (hash == '' && selected_hash == '753_1')
  || (hash == '753' && selected_hash == '')
  || (hash == '753' && selected_hash == '753_1')){
    // Toggle our custom-buttons
    $('#multi_items').css('visibility', 'hidden');
    $('#bot_gifts').css('visibility', 'visible');
    // Needed for changing from community to gifts (dropdown)
    $('#inventory_'+steamID+'_753_1 .inventory_item_link:eq(0)').waitUntilExists(function(){
      injectScriptGifts();
    });
  }   
  else if(((hash && selected_hash) == '753_0') 
  || (hash == '' && selected_hash == '753_0')
  || (hash == '753' && selected_hash == '753_0')
  || (hash && selected_hash) == '753_6'){
    // Toggle our custom-buttons
    $('#bot_gifts').css('visibility', 'hidden');
    $('#multi_items').css('visibility', 'visible');
  }

});


$(document).ready(function(){

    // Add Dropdown for Bulk-Gifting
  $('.inventory_links').append(' \
    <div id="bot_gifts"> \
      <div class="btn_darkblue_white_innerfade" id="gifts-bots" data-i18n="inventory_send_gifts_bots"></div> \
      <div class="btn_darkblue_white_innerfade" id="gifts-master" data-i18n="inventory_send_gifts_master"></div> \
      <select id="gift-titles"></select> \
    </div> \
  ');
    // Add Buttons for Listing
  $('.inventory_filters').after('\
    <a class="btn_small btn_green_white_innerfade" id="multi_items" style="margin-left: 12px;"> \
      <span data-i18n="inventory_select_multiple_items"></span> \
    </a> \
    <a class="btn_small btn_green_white_innerfade" id="multi_sell_items" style="margin-left: 12px;"> \
      <span><span id="item_count">0</span><span data-i18n="inventory_multi_items_sell"><span></span> \
    </a> \
  ');

  // Append buttons and functions based on hashes
  // --------------------------------------------
  var hash = window.location.hash.substring(1);
  var selected_hash = $('#contextselect_activecontext div').length != '' ? $('#contextselect_activecontext div').attr('id').replace('context_option_', '') : '';

  if(((hash && selected_hash) == '753_1') 
  || (hash == '' && selected_hash == '753_1')
  || (hash == '' && selected_hash == '')
  || (hash == '753' && selected_hash == '')
  || (hash == '753' && selected_hash == '753_1')){
    $('#bot_gifts').css('visibility', 'visible');
    // wait for inventory to get loaded
    $('#inventory_'+steamID+'_753_1 .inventory_item_link:eq(0)').waitUntilExists(function(){
      injectScriptGifts();
    });
  }   
  else if(((hash && selected_hash) == '753_0') 
  || (hash == '' && selected_hash == '753_0')
  || (hash == '753' && selected_hash == '753_0')
  || (hash && selected_hash) == '753_6'){
    $('#multi_items').css('visibility', 'visible');
  }

  // Send gifts to bots
  $('#bot_gifts #gifts-bots').on('click', function(event){
    giftsClickHandler();
  });

  // Send gifts to master
  $('#bot_gifts #gifts-master').on('click', function(event){
    giftsBulkMaster();
  });

  // If dropdown changes display matching items
  $('#gift-titles').on('change', function(){
    // input the search-string into filter and trigger a search
    $('#filter_control').val($(this).val());
    $('#filter_control').focus().blur();
    // Items need some time to display/slide-in > use timeout
    setTimeout(function(){
      $('.itemHolder:visible:eq(0) div a')[0].click();
    }, 10);
  });

  // Rewrite Button-State and selection-bit on click
  $('#multi_items span').on('click', function(event){
    if(multi_selection_bit == 0){
      $(this).text(chrome.i18n.getMessage("inventory_cancel_btn"));
      multi_selection_bit = 1;
      $('#multi_sell_items').css('visibility', 'visible');
    } else {
      $(this).text(chrome.i18n.getMessage("inventory_select_multiple_items"));
      multi_selection_bit = 0;
      $('.itemHolder').removeClass('multi-select');
      $('#multi_sell_items').css('visibility', 'hidden');
      // Must be reset to 0 since cancelling the action deselects all items
      $('#item_count').text('0');
    }
  });


  // Start Selection of multiple items if activated 
  $(document).on('click', '.itemHolder:not(.disabled) div', function(e){
    multiSelection($(this), e);
  });

  // Handle Bulk-Sell
  $('#multi_sell_items span').on('click', function(){

    // Since we're about to sell we can start getting prices now and push them into previously created array
    $('.multi-select div a').map(function(){ STCardsData.push($(this).attr('href').split('_')[2]); });

    // Get selected items again
    var selected_count = $('.multi-select').length;

    // Get our data from pages JS-Scope
    injectScriptSTCards();

    createDialog("info", chrome.i18n.getMessage("inventory_sell_items_overview"), " \
      <div class='modal-fifty'> \
        <label data-i18n='inventory_flex_price'></label><span data-currency='"+walletInfo[0].currencySymbol+"'><input id='flex-price' type='number' step='0.01' value='0.00' /></span>\
      </div> \
      <div class='modal-fifty'> \
        <label data-i18n='inventory_item_cnt'></label><span id='marketable-count'>"+selected_count+"<span></span></span>\
      </div> \
      <div class='modal-fifty'> \
        <label data-i18n='inventory_stat_price'></label><span data-currency='"+walletInfo[0].currencySymbol+"'><input id='stat-price' type='number' min='0' step='0.01' value='0.00' data-value='0.00' /></span>\
      </div> \
      <div class='modal-fifty'> \
        <label data-i18n='inventory_total'></label><span id='item-prices-sum'>0,00</span>\
      </div> \
      <div id='getting-prices-head' class='modal-fifty'> \
        <span style='text-align:left;padding: 10px 0 0 0;' data-i18n='inventory_get_item_prices'></span>\
      </div> \
      <div id='progress-bar' style='float:left;'><span style='width: 0%' data-value='0'></span></div><div></div> \
      <div class='modal-hundred'> \
        <label><input id='auto-list' type='checkbox'><span data-i18n='inventory_start_auto'></span></label> \
      </div> \
    ", 2);

    $('#yoyo').attr('disabled', 'disabled');
    // give the user the possibility to stop the background-process
    $("#nope, #dialog_close_btn").one("click", function(){
      // we need a timeout to wait for the WebAPI - quick and dirty error-handling for users who are clicking to fast
      setTimeout(function(){
        chrome.runtime.sendMessage({greeting: 'stopGetMarketPrices'});
      }, 500);
    });

    $("#stat-price, #flex-price").on("keyup input", function() {
      bulkSellCalc($(this), stat_price, flex_price);
    });

  });

  // Append Button for sending cards to bots (Bulk) for CS:GO
  $('#tabcontent_inventory').on('click', '.inventory_item_link', function(){
    var item_desc1 = $('#iteminfo0 .item_desc_game_info div:contains("Counter-Strike: Global Offensive")');
    var item_desc2 = $('#iteminfo1 .item_desc_game_info div:contains("Counter-Strike: Global Offensive")');
    var button = '<a class="btn_small btn_green_white_innerfade send_cards_bulk" style="margin-bottom: 10px;"><span data-i18n="inventory_send_cards_to_bots"></span></a>';

    if($(item_desc1).parent().parent().children('.send_cards_bulk').length < 1){
      $(item_desc1).parent().after(button);
    }
    if($(item_desc2).parent().parent().children('.send_cards_bulk').length < 1){
      $(item_desc2).parent().after(button);
    }
  });

  $('#tabcontent_inventory').on('click', '.send_cards_bulk', function(){

      createDialog("info", chrome.i18n.getMessage("inventory_send_cards_to_bots"), chrome.i18n.getMessage("inventory_send_cards_to_bots_dialog"), 2);

      $("#yoyo").one("click", function(){
        // we need a timeout to wait for the WebAPI - quick and dirty error-handling for users who are clicking to fast
        setTimeout(function(){
          createDialog("info", chrome.i18n.getMessage("inventory_send_cards_to_bots_proc"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
          // Inject the script to get available CS:GO-Cards
          injectScriptCsgoCards();
        }, 500);
      });
  });
});


function listItemsBulk(cards){

  var flex_price_state = $('#flex-price').prop('disabled');
  var stat_price_state = $('#stat-price').prop('disabled');
  var flex_price = parseFloat($('#flex-price').val().replace(',','.'));
  var stat_price = parseFloat($('#stat-price').val().replace(',','.'));
  var sessionid = /sessionid=(.{24})/.exec(document.cookie)[1];

  // use flex-price for calculation
  if(flex_price_state === false && stat_price_state === true){
    for(i=0;i<cards.length;i++){
      cards[i].price = calcSteamTax(cards[i].price+flex_price, cards[i].itemFee);
    }
  // use stat-price for calculation
  } else if(flex_price_state === true && stat_price_state === false){
    for(i=0;i<cards.length;i++){
      cards[i].price = calcSteamTax(stat_price, cards[i].market_fee);
    }
  } else {
    // since both inputs are activated, price-change will be 0, just calc taxes
    for(i=0;i<cards.length;i++){
      cards[i].price = calcSteamTax(cards[i].price, cards[i].market_fee);
    }
  }

  // everything should be done now, we can start to list items
  createDialog("info", chrome.i18n.getMessage("inventory_dialog_msg_create_confirm"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);

  // abort the process when user clicks close-button
  $('#nope').one('click', function(){
    setTimeout(function(){
      chrome.runtime.sendMessage({greeting: 'stopListingMarketItems'});
    }, 500);
  });

  chrome.runtime.sendMessage({
    greeting: 'createMarketListingOrders', 
    cards: cards, 
    sessionid: sessionid,
    country: walletInfo[0].countryCode,
    eCurrency: walletInfo[0].eCurrencyCode,
    language: walletInfo[0].language
  },function(response){
    if(response.success){
      location.reload();
    }
  });

}


var stat_price = 0.00, flex_price = 0.00;
function bulkSellCalc(that, stat_price, flex_price){

  var ele = that.get(0).id;
  var value = parseFloat(that.val().replace(',','.'));
  var sum = parseFloat($('#item-prices-sum').text().replace(',','.'));
  var item_cnt = parseInt($('#marketable-count span').text().replace(/\(|\)/g, ''));

  if(ele == 'flex-price'){
    value != 0 ? $('#stat-price').attr('disabled', 'disabled') : $('#stat-price').attr('disabled', false);
    sum += item_cnt*(Math.round((value-flex_price)*100, 2)/100);
    flex_price = value;
  } else {
    value != 0 ? $('#flex-price').attr('disabled', 'disabled') : $('#flex-price').attr('disabled', false);
    if(value == 0){
      var oldprice = $('#item-prices-sum').data('value').toLocaleString(undefined, {minimumFractionDigits: 2});
      $('#item-prices-sum').text(oldprice.toString()+" "+walletInfo[0].currencySymbol);
      return;
    }
    sum = item_cnt*value;
    stat_price = value;
  }

  sum = sum.toLocaleString(undefined, {minimumFractionDigits: 2});
  $('#item-prices-sum').text(sum.toString()+" "+walletInfo[0].currencySymbol);
}

function giftsBulkMaster(){

  // since we can't send the complete object for gifts to background
  // just send the needed data

  var giftssum = {
    idarr: [],
    sid: ''
  };

  for(var key in GiftData){
    if(GiftData.hasOwnProperty(key)){
      giftssum.idarr.push.apply(giftssum.idarr, GiftData[key].idarr);
      giftssum.sid = GiftData[key].sid;
    }
  }

  createDialog("warn", chrome.i18n.getMessage("inventory_send_gifts_master_dialog"), chrome.i18n.getMessage("inventory_confirm_master_gifting"), 2);

  $("#yoyo").one("click", function(){
    // we need a timeout to wait for the WebAPI - quick and dirty error-handling for users who are clicking to fast
    setTimeout(function(){
      //console.log('OK was clicked so we can proceed further.');
      chrome.runtime.sendMessage({greeting: 'sendGiftsBulkMaster', gifts: giftssum });
    }, 500);
    createDialog("info", chrome.i18n.getMessage("inventory_send_gifts_to_master_proc"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
  });

}

function giftsClickHandler(){
  var title = $('#gift-titles').val();
  if(title != ''){

    // Temporary fix to be able to gift a bundle (sub) to bots which own one of the 4 games
    // Todo: maybe implement something to exclude one or more appid's from getting  compared to database
    /*if($.inArray('407230', GiftData[[title]].appid)){
      GiftData[[title]].appid.splice(GiftData[[title]].appid.indexOf('407230'),1);
    }*/

    console.log(GiftData[[title]]);

    createDialog("warn", chrome.i18n.getMessage("inventory_send_gifts_to_bots"), chrome.i18n.getMessage("inventory_confirm_bulk_gifting"), 2);

    $("#yoyo").one("click", function(){
      // we need a timeout to wait for the WebAPI - quick and dirty error-handling for users who are clicking to fast
      setTimeout(function(){
        //console.log('OK was clicked so we can proceed further.');
        chrome.runtime.sendMessage({greeting: 'sendGiftsBulk', gifts: GiftData[[title]]},function(response){
          console.log(response);
        });
      }, 500);
      createDialog("info", chrome.i18n.getMessage("inventory_send_gifts_to_bots_proc"), "<div id='progress-bar'><span style='width: 0%' data-value='0'></span></div><div></div>", 0);
    });

  } else {
    alert(chrome.i18n.getMessage("inventory_alert_no_gift"));
  }
}


function multiSelection(that, e){
  if(multi_selection_bit == 1){
    if(e.shiftKey){
      /**
       * Items can be part of different pages, each page has 25 ".itemHolder"
       * Detection of previous/next selection and based on this selecting items
      **/
      if($('.multi-select').length){

        that.parent().not('.disabled').addClass('multi-select');

        var currentItem = that.parent().not('.disabled').index(); // last clicked
        var currentPage = that.parent().not('.disabled').parent().index(); // last clicked
        var pageCounter = Math.abs(selectedPage-currentPage); // difference positive

        // Debug
        console.log("CurrentItem: "+currentItem+" CurrentPage: "+currentPage+" SelectedItem: "+selectedItem+" SelectedPage: "+selectedPage+" PageCounter: "+pageCounter);

        // Loop through all selected pages
        for(i=0; i<=pageCounter;i++){

          // We can't use the item-index for counting, when filters are used
          var len = $('.inventory_page:eq('+(i+1)+') .itemHolder').length, arr = [];

          while(len--){
            if($('.inventory_page:eq('+(i+1)+') .itemHolder').eq(len).css('display') != 'none'){
              arr.push($('.inventory_page:eq('+(i+1)+') .itemHolder').eq(len).index()); 
            }
          }

          // Different complete iterations based on selecting-direction
          if(currentPage > selectedPage){ genSelect(selectedPage, currentPage, currentItem, selectedItem, i, arr); } else 
          if(currentPage < selectedPage){ genSelect(currentPage, selectedPage, selectedItem, currentItem, i, arr); } else 
          if(currentPage===selectedPage){
            if(currentItem < selectedItem){

              // Remove all items from array which are BEFORE the selected Item
              arr.splice(0, arr.indexOf(selectedItem));
              for(j=0; j < (selectedItem-currentItem); j++){
                $('.inventory_page:eq('+(currentPage+i+1)+') .itemHolder:eq('+arr[j]+')').addClass('multi-select');
              }

            } else if(currentItem > selectedItem){

              // Remove all items from array which are AFTER the selected Item
              arr.splice(0, arr.indexOf(currentItem));
              for(j=0; j < (currentItem-selectedItem); j++){
                $('.inventory_page:eq('+(currentPage+i+1)+') .itemHolder:eq('+arr[j]+')').addClass('multi-select');
              }
            }
          }
        }
      }
    } else if(e.ctrlKey){
      // Detect similiar items by image-source
      /*var select_by_image = that.children('img').attr('src');
      // Avoid items being not unselectable
      // ToDo: Find out if this works for all items
      if($('.multi-select div img[src="'+select_by_image+'"]').length){
        $('img[src="'+select_by_image+'"]')
        .parent().parent()
        .removeClass('multi-select');
      } else {
        $('img[src="'+select_by_image+'"]')
        .parent().parent()
        .addClass('multi-select');            
      }*/
    } else {
      that.parent().not('.disabled').toggleClass('multi-select');
    }

    // Update the Item-Count for Item-Selling 
    $('#item_count').text($('.multi-select').length);

    // Set this Element as starting-point for multi-selection
    selectedItem = that.parent().not('.disabled').index();
    selectedPage = that.parent().not('.disabled').parent().index();

  }
}

function genSelect(selectedPage, currentPage, currentItem, selectedItem, i, arr){
  // used to select items on current page (shift+clicked)
  // and first page (first focused element)
  // this logic is turned around when selecting backwards

  if((selectedPage+i) === selectedPage){

    // Remove all items from array which are BEFORE the selected Item
    arr.splice(-1*(24-arr.indexOf(selectedItem)),(24-arr.indexOf(selectedItem)));

    for(j=0;j<arr.length;j++){
      $('.inventory_page:eq('+(i+1)+') .itemHolder').eq(arr[j]).addClass('multi-select');
    }

  } else if((selectedPage+i) === currentPage) {

    // Remove all items from array which are AFTER the current Item
    arr.splice(0,arr.indexOf(currentItem));

    for(j=0;j<arr.length; j++){
      $('.inventory_page:eq('+(i+1)+') .itemHolder').eq(arr[j]).addClass('multi-select');
    }

  } else {

    // If at least 3 pages are selected we can select all items on pages between
    // i.e. page 1 and page 3 - so select 25 items on page 2
    for(j=0;j<25;j++){
      $('.inventory_page:eq('+(i+1)+') .itemHolder').eq(arr[j]).addClass('multi-select');           
    }

  }
}

function createDialog(type, title, content, btncnt){

	var btn_list = "";

	// Set up buttons for inserting them into dialog
	if(btncnt == 1){
  	btn_list = '<div id="dialog_buttons"><button id="nope" data-i18n="inventory_cancel_btn"></button></div>';
  } else if(btncnt == 2){
    btn_list = '<div id="dialog_buttons"><button id="yoyo" data-i18n="inventory_okay_btn"></button><button id="nope" data-i18n="inventory_cancel_btn"></button></div>';
  }

	// Fill Modal with content
  $("#dialog_icon").removeClass();
  $("#dialog_icon").addClass("dialog_"+type);
  $("#dialog_title_txt").text(title);
	$("#dialog_content").html(content+btn_list);
	$("#dialog_wrapper").show();

	// Wait for action / button-click
	$("#yoyo, #nope, #dialog_close_btn").on("click", function(){
    //console.log('clicked');
		$("#dialog_wrapper").hide();
	});

}

// We need a separate function to listen to multiple events at once
function addListenerMulti(el, s, fn) {
  s.forEach(e => el.addEventListener(e, fn, false));
}

function injectScriptWalletInfo(){

  var actualCode = '(' + function() {

    var wallet = [], currencyCode = '', currencySymbol = '';

    // We need to determine currency based on eCurrencyCode
    for(i in g_rgCurrencyData){
      if(g_rgCurrencyData[i].eCurrencyCode == g_rgWalletInfo.wallet_currency){
        currencyCode = g_rgCurrencyData[i].strCode;
        currencySymbol = g_rgCurrencyData[i].strSymbol;
        break;
      }
    }

    // Valve wants dem fees
    wallet.push({
      currencySymbol: currencySymbol,
      currencyCode: currencyCode,
      eCurrencyCode: g_rgWalletInfo.wallet_currency,
      countryCode: g_rgWalletInfo.wallet_country,
      language: g_strLanguage,
      steamFee: g_rgWalletInfo.wallet_fee_percent,
      baseFee: g_rgWalletInfo.wallet_fee_base,
      devFee: g_rgWalletInfo.wallet_publisher_fee_percent_default,
      minFee: g_rgWalletInfo.wallet_fee_minimum,
      fee: g_rgWalletInfo.wallet_fee
    });

    // Just pass an Event including a customized dataset of gifts not already gifted
    var evt=document.createEvent("CustomEvent");
    evt.initCustomEvent("WalletInfo", true, true, wallet);
    document.dispatchEvent(evt);

  } + ')();';

  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);

}

function injectScriptSTCards(){

  var actualCode = '(' + function() {

    var inventory = window.g_ActiveInventory.m_rgPages;
    var devFee = g_rgWalletInfo.wallet_publisher_fee_percent_default;
    var cards = [];
    var market_fee;

    // Iterate all inventory-pages
    for(var i=0; i<inventory.length;i++){
      // Iterate the max 25 items each page can hold
      for(var j=0; j<inventory[i][0].childNodes.length;j++){
        // Only get community-items
        // ToDo: Add other items which are not 753_6
        // Also check that rgItem isn't undefined due to pages not being loaded
        if(inventory[i][0].childNodes[j].rgItem !== undefined){
          if(inventory[i][0].childNodes[j].rgItem.contextid == 6 
          && inventory[i][0].childNodes[j].rgItem.appid == 753
          && inventory[i][0].childNodes[j].rgItem.description.marketable == 1){
            // check for item-based fee
            if(inventory[i][0].childNodes[j].rgItem.description.hasOwnProperty("market_fee")){
              market_fee = inventory[i][0].childNodes[j].rgItem.description.market_fee;
            } else {
              market_fee = devFee;
            }

            cards.push({
              assetid: inventory[i][0].childNodes[j].rgItem.assetid, 
              classid: inventory[i][0].childNodes[j].rgItem.classid,
              market_hash_name: inventory[i][0].childNodes[j].rgItem.description.market_hash_name,
              market_fee: market_fee
            });
          }
        }
      }
    }

    // Just pass an Event including a customized dataset of gifts not already gifted
    var evt=document.createEvent("CustomEvent");
    evt.initCustomEvent("STCardsData", true, true, cards);
    document.dispatchEvent(evt);

  } + ')();';

  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);

}

function injectScriptCsgoCards(){

  var actualCode = '(' + function() {

    // Following classid's represent CS:GO-TradingCards
    var cards = { 149757868: [],149748025: [],149754772: [],149750877: [],149750036: [] };
    var pagelist = window.g_ActiveInventory.m_rgPages;
    var classid = '',itemid = '', tradable = '',intrade = '';

    // Iterate all inventory-pages
    for(var i=0; i<pagelist.length;i++){
      // Iterate the max 25 items each page can hold
      for(var j=0; j<pagelist[i][0].childNodes.length;j++){
        if(pagelist[i][0].childNodes[j].rgItem !== undefined){
          classid = pagelist[i][0].childNodes[j].rgItem.classid;
          itemid = pagelist[i][0].childNodes[j].rgItem.assetid; // ToDo check if this is right
          tradable = pagelist[i][0].childNodes[j].rgItem.description.tradable;
          // Use Regex to find out if this item is already in trade
          intrade = ( /item-in-trade/.exec(pagelist[i][0].childNodes[j].innerHTML) ? 1 : 0);

          // Use Regex to extract all CS:GO-Cards
          if(/^(149757868|149748025|149754772|149750877|149750036)$/.exec(classid)){
            // Only make use of Cards which are tradable and not used in another trade
            if(intrade == 0 && tradable == 1){
              // Finally push each cards into matching object-keys array
              cards[classid].push(itemid);
            }
          }
        }
      }
    }

    // Just pass an Event including a customized dataset of gifts not already gifted
    var evt=document.createEvent("CustomEvent");
    evt.initCustomEvent("CSGOCardsData", true, true, cards);
    document.dispatchEvent(evt);

  } + ')();';

  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);

}

function injectScriptGifts(){

  // Stackoverflow to the rescue: http://stackoverflow.com/questions/9515704/building-a-chrome-extension-inject-code-in-a-page-using-a-content-script/9517879#9517879
  // Wrapping the code inside of an anonymous function makes editing easier YO
  var actualCode = '(' + function() {

    var arr = [];
    var items = g_ActiveInventory.m_rgItemElements;
    var description, assetid, appid;
    var regextitle = /\/\d+\/">(.*?)<\/a>/g;
    var regexappid = /\/app\/(\d*)\/\"/g;
    var regappid = /app\/(\d+)\//;
    var z;

    for(i=0;i<items.length; i++){
      // if rgItem is undefined it is probably pending
      if(items[i] !== undefined && items[i][0].rgItem !== undefined){

        description = items[i][0].rgItem.description;
        assetid = items[i][0].rgItem.assetid;


        if(description.actions !== undefined){
          if(description.owner_descriptions === undefined || description.owner_descriptions.length < 3){
            if(description.name in arr){
              // gamename already exists, so only push the gift-id to array
              arr[[description.name]].idarr.push(assetid);

            } else {

              if(description.actions[0].link.indexOf('sub') > 0){

                // For subid´s we need to iterate the item-description
                arr[[description.name]] = {
                  title: [], 
                  appid: [], 
                  idarr:[assetid], 
                  link: description.actions[0].link, 
                  sid: g_sessionID
                };

                // Fill title and appids via regex from description-text
                while (z = regextitle.exec(description.descriptions[0].value)){ arr[[description.name]].title.push(z[1]); }             
                while (z = regexappid.exec(description.descriptions[0].value)){ arr[[description.name]].appid.push(z[1]); }

              } else {

                // For normal appids just push title and appid to array
                appid = (description.actions[0].link).match(regappid)[1];

                // Create object with arrays
                arr[[description.name]] = {
                  title: [], 
                  appid: [], 
                  idarr:[assetid], 
                  link: description.actions[0].link, 
                  sid: g_sessionID
                };

                // Now put title and appid into our created arrays
                arr[[description.name]].title.push(description.name);
                arr[[description.name]].appid.push(appid);

              }

            }
          } else {
            // Already gifted games get excluded
            // theres no separate error-handling needed though
            // console.log('Game was already gifted.');
          }

        } else {
          // this is probably a guest-pass -> ignore it
        }
      }
    }

    // Just pass an Event including a customized dataset of gifts not already gifted
    var evt=document.createEvent("CustomEvent");
    evt.initCustomEvent("GiftData", true, true, arr);
    document.dispatchEvent(evt);

  } + ')();';

  // Appending and removing the content immediately
  // executes the code in memory and for some reason
  // window-variables are accessable this way
  var script = document.createElement('script');
  script.textContent = actualCode;
  (document.head||document.documentElement).appendChild(script);
  script.remove();

}

function calcSteamTax(strAmount, itemFee){
  // parse Float-Number as Integer
  var flAmount = parseFloat(strAmount)*100;
  var nAmount = Math.floor(isNaN(flAmount) ? 0 : flAmount+0.000001);
  nAmount = Math.max(nAmount, 0);

  var item_fee = itemFee; // this.m_item.description.market_fee <- normally not existent and this way undefined
  var wallet_fee = walletInfo[0].devFee; // g_rgWalletInfo['wallet_publisher_fee_percent_default'] <- float as string !important
  var wallet_fee2 = walletInfo[0].fee; // g_rgWalletInfo['wallet_fee']
  var wallet_fee3 = walletInfo[0].baseFee;//  g_rgWalletInfo['wallet_fee_base']
  var wallet_fee4 = walletInfo[0].steamFee; // g_rgWalletInfo['wallet_fee_percent'] <- float as string !important
  var wallet_fee5 = walletInfo[0].minFee; // g_rgWalletInfo['wallet_fee_minimum']
  var publisherFee = typeof item_fee != 'undefined' ? item_fee : wallet_fee;
  var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
  nAmount = nAmount - feeInfo.fees;

  function CalculateFeeAmount(amount, publisherFee){
    publisherFee = (typeof publisherFee == 'undefined') ? 0 : publisherFee;
    var iterations = 0;
    var EAOWFRBOP = parseInt((amount-parseInt(wallet_fee3))/(parseFloat(wallet_fee3)+parseFloat(publisherFee)+1)); // 6
    var bEverUndershot = false;
    var fees = CATSFDRA(EAOWFRBOP, publisherFee);
    while(fees.amount != amount && iterations < 10){
      if(fees.amount > amount){
        if(bEverUndershot){
          fees = CATSFDRA(EAOWFRBOP-1, publisherFee);
          fees.steam_fee += (amount-fees.amount);
          fees.fees += (amount-fees.amount);
          fees.amount = amount;
          break;
        } else {
          EAOWFRBOP--;
        }
      } else {
        bEverUndershot = true;
        EAOWFRBOP++;
      }
      fees = CATSFDRA(EAOWFRBOP, publisherFee);
      iterations++;
    }
    return fees;
  }

  function CATSFDRA(receivedAmount, publisherFee){
    if ( !wallet_fee2 ){
      return receivedAmount;
    }
    publisherFee = (typeof publisherFee == 'undefined') ? 0 : publisherFee;
    var nSteamFee = parseInt(Math.floor(Math.max(receivedAmount*parseFloat(wallet_fee4),wallet_fee5) + parseInt(wallet_fee3)));
    var nPublisherFee = parseInt(Math.floor(publisherFee > 0 ? Math.max(receivedAmount*publisherFee,1) : 0));
    var nAmountToSend = receivedAmount + nSteamFee + nPublisherFee;

    return {
      steam_fee: nSteamFee,
      publisher_fee: nPublisherFee,
      fees: nSteamFee + nPublisherFee,
      amount: parseInt(nAmountToSend)
    };
  }
  // Finally getting the result
  return nAmount;
}