setInterval(function(){
   if(!$J('.market_listing_table_header span input:eq(0)').is(":checked")){
      $J('.market_listing_table_header span input:eq(0)').trigger('click');       
      setTimeout(function(){ $J('.inventory_filters .item_market_action_button_green:eq(1)').click() }, 1000);
   }
}, 5000)
