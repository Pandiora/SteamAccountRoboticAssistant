// Action: i18n-translation-placeholder
const options = {
  resetLoginSkip: 'steam_login_input_reset_skip',
  communitySkip: 'steam_login_input_skip_community',
  purchasedSkip: 'steam_login_input_skip_purchase',
  nonPurchasedSkip: 'steam_login_input_skip_nonpurchase',
  underEightPurchasedSkip: 'steam_login_input_under_eight',
  discoveryQueue: 'Discovery Queue Automated',
  addFreeLicense: 'steam_login_input_license_bulk',
  winterNomination: 'Winter 2018 Nomination',
  cozyCottage: 'Cozy Cottage 2018'
  //automatedNomination: 'Automated Nomination'
}

// Build Dropdown
const buildOptions = (obj)=>{
  const arr = Object.keys(obj);
  let string = '';
  for(let i=0; i<arr.length;i++){
    let translated = '';
    if(obj[arr[i]].indexOf('_') > 1){
      translated = browser.i18n.getMessage(obj[arr[i]]);
    } else { translated = obj[arr[i]]; }
    string += `<option id="${arr[i]}">${translated}</option>`
  }
  return string;
}


document.arrive(".loginbox_right, .mainLoginRightPanel", { onceOnly:true }, async(e)=>{

  e.innerHTML = `
  <div class="heady">Autologin
      <input class="textField cip-ui-autocomplete-input names-input" placeholder="${browser.i18n.getMessage("steam_login_search")}" type="text" />
  </div>
  <div class="names-line">
      <div></div>
  </div>
  <div class="names-container"></div>
  <div>
      <select id="login_tasks">
          ${buildOptions(options)}
      </select>
      <div id="tasks_inputs">
          <div class="tasks_inputs">
              <input class="tasks_inputs1" placeholder="${browser.i18n.getMessage(" steam_login_input_appid ")}" type="text" />
          </div>
          <div class="tasks_inputs">
              <div class="btn_green_white_innerfade tasks_inputs2" id="task_action_btn">${browser.i18n.getMessage("steam_login_start_btn")}</div>
          </div>
      </div>
  </div>
  <div id="gwrapper">
    <div class="G"></div>
  </div>`;

  const res = await browser.runtime.sendMessage({process: 'getNamesForLogin'});

  // Append div´s including the names
  // Use doc.fragment for faster iteration
  var frag = document.createDocumentFragment();

  for(var i=0;i<res.parameters.length;i++){
    var cancel = document.createElement('div');
    var div = document.createElement('div');
    div.className = 'names';
    div.innerHTML = res.parameters[i];
    div.appendChild(cancel);
    frag.appendChild(div);
  }

  document.getElementsByClassName('names-container')[0].appendChild(frag);

});
