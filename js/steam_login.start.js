document.addEventListener("animationstart", function(e) {
    if (e.animationName == "nodeReady") {

      removeElementsByClass('whyJoinLeft');
      removeElementsByClass('whyJoinRight');
      e.target.innerHTML = ' \
      <div class="heady">Autologin \
        <input class="textField cip-ui-autocomplete-input names-input" placeholder="'+chrome.i18n.getMessage("steam_login_search")+'" type="text" /> \
      </div> \
      <div class="names-line"> \
        <div></div> \
      </div> \
      <div class="names-container"></div> \
      <div> \
        <select id="login_tasks"> \
          <option id="reset_skip_login">'+chrome.i18n.getMessage("steam_login_input_reset_skip")+'</option> \
          <option id="reset_community_skip">'+chrome.i18n.getMessage("steam_login_input_skip_community")+'</option> \
          <option id="set_purchased_skip">'+chrome.i18n.getMessage("steam_login_input_skip_purchase")+'</option> \
          <option id="set_non_purchased_skip">'+chrome.i18n.getMessage("steam_login_input_skip_nonpurchase")+'</option> \
          <option id="set_under_eight_purchased_skip">'+chrome.i18n.getMessage("steam_login_input_under_eight")+'</option> \
          <option id="start_discovery_queue">'+chrome.i18n.getMessage("steam_login_input_disc_queue")+'</option> \
          <option id="adding_free_license">'+chrome.i18n.getMessage("steam_login_input_license_bulk")+'</option> \
          <option id="craft_sticker_badge">Craft Sticker-Badge</option> \
          <option id="automated_nomination">Automated Nomination</option> \
          <option id="get_minigame_token">Get Minigame-Tokens</option> \
        </select> \
        <div id="tasks_inputs"> \
          <div class="tasks_inputs"> \
            <input class="tasks_inputs1" placeholder="'+chrome.i18n.getMessage("steam_login_input_appid")+'" type="text"/> \
          </div> \
          <div class="tasks_inputs"> \
            <div class="btn_green_white_innerfade tasks_inputs2" id="task_action_btn">'+chrome.i18n.getMessage("steam_login_start_btn")+'</div> \
          </div> \
        <div> \
      </div>';

    } else if (e.animationName == "namesReady") {

      chrome.runtime.sendMessage({greeting: 'getNamesForLogin'},function(response){
    		// Append div´s including the names
        // Use doc.fragment for faster iteration
        var frag = document.createDocumentFragment();

        for(var i=0;i<response.names.length;i++){
        	var div = document.createElement('div');
          div.className = 'names';
        	div.innerHTML = response.names[i];
        	frag.appendChild(div);
        }

        document.getElementsByClassName('names-container')[0].appendChild(frag);
    	});

    } else if(e.animationName == "bodyReady"){
      //document.body.style.visibility = 'hidden';
    }
}, false);

function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}
