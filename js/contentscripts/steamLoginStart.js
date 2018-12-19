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
          <option id="loginSkip">'+chrome.i18n.getMessage("steam_login_input_reset_skip")+'</option> \
          <option id="communitySkip">'+chrome.i18n.getMessage("steam_login_input_skip_community")+'</option> \
          <option id="purchasedSkip">'+chrome.i18n.getMessage("steam_login_input_skip_purchase")+'</option> \
          <option id="nonPurchasedSkip">'+chrome.i18n.getMessage("steam_login_input_skip_nonpurchase")+'</option> \
          <option id="underEightPurchasedSkip">'+chrome.i18n.getMessage("steam_login_input_under_eight")+'</option> \
          <option id="discoveryQueue">'+chrome.i18n.getMessage("steam_login_input_disc_queue")+'</option> \
          <option id="addFreeLicense">'+chrome.i18n.getMessage("steam_login_input_license_bulk")+'</option> \
          <option id="automatedNomination">Automated Nomination</option> \
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

      chrome.runtime.sendMessage({process: 'getNamesForLogin'},function(res){

    		// Append div´s including the names
        // Use doc.fragment for faster iteration
        var frag = document.createDocumentFragment();

        for(var i=0;i<res.parameters.length;i++){
        	var div = document.createElement('div');
          div.className = 'names';
        	div.innerHTML = res.parameters[i];
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
