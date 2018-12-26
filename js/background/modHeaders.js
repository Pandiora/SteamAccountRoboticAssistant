const mod = (() => {

  let vars = {
    confLink: ''
  };

  const modConfirmationHeaders = (details) => {
    // Add Referer to emulate site-request
    //////////////////////////////////////
    var headers = details.requestHeaders,
    blockingResponse = {};

    for( var i = 0, l = headers.length; i < l; ++i ) {
      if(headers[i].name == 'Cookie'){
        headers[i].value = headers[i].value+" mobileClientVersion=0 (2.1.3); mobileClient=android; Steam_Language=english; dob=;";
      } else if(headers[i].name == 'User-Agent'){
        headers[i].value = "Mozilla/5.0 (Linux; Android 6.0; Nexus 6P Build/XXXXX; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/47.0.2526.68 Mobile Safari/537.36";
      }
    }

    var b = new Object();
    b.name = 'Referer';
    b.value = vars.confLink;
    headers.push(b);

    blockingResponse.requestHeaders = headers;
    return blockingResponse;
  };

  const execModConfHeader = (url, action) => {

      vars.confLink = url;

      if(action === 'start')
        browser.webRequest.onBeforeSendHeaders
        .addListener(modConfirmationHeaders, {
          urls: ["https://steamcommunity.com/mobileconf/ajaxop?*"]
        }, ['requestHeaders', 'blocking']);

      if(action === 'stop')
        browser.webRequest.onBeforeRequest
        .removeListener(modConfirmationHeaders);

  };


  return {
    execModConfHeader
  }

})();


function modLoginHeaders(details){

  /* E X A M P L E
    Host: store.steampowered.com
    Origin: https://store.steampowered.com
    Referrer: https://store.steampowered.com/login/
  */
  const headers          = details.requestHeaders;
  const seturl           = /(.*\.com)\//.exec(details.url)[1];
  let   blockingResponse = {};

  for(let i = 0, l = headers.length; i < l; ++i ) {
    if(headers[i].name == 'Origin'){
      headers[i].value = seturl;
    } else if(headers[i].name == 'Accept'){
      headers[i].value = 'text/javascript, text/html, application/xml, text/xml, */*';
    }
  }

  headers.push({name: 'Referer', value: `${seturl}/login/?redir=&redir_ssl=1`});
  headers.push({name: 'X-Requested-With', value: 'XMLHttpRequest'});

  blockingResponse.requestHeaders = headers;
  return blockingResponse;

}

//
// Replace Headers to retrieve mobile-conf
////////////////////////////////////////////////////////////////////
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  var headers = details.requestHeaders,
  blockingResponse = {};

  //console.log('Replacing Headers for Tradeoffer.');

  for( var i = 0, l = headers.length; i < l; ++i ) {
    if(headers[i].name == 'Origin') headers[i].value = 'https://steamcommunity.com';
  }

  headers.push({name: 'X-Requested-With', value: 'com.valvesoftware.android.steam.community'});

  blockingResponse.requestHeaders = headers;
  return blockingResponse;
},{urls: [ "https://steamcommunity.com/mobileconf/*" ]},['requestHeaders','blocking']);


//
// Replace Header-Origin and -Referer to accept trades automatically
////////////////////////////////////////////////////////////////////
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  var headers = details.requestHeaders,
  blockingResponse = {};

  //console.log('Replacing Headers for Tradeoffer.');

  for( var i = 0, l = headers.length; i < l; ++i ) {
    if(headers[i].name == 'Origin') headers[i].value = 'https://steamcommunity.com';
  }

  headers.push({name: 'Referer', value: 'https://steamcommunity.com/tradeoffer/'});

  blockingResponse.requestHeaders = headers;
  return blockingResponse;
},{urls: [ "https://steamcommunity.com/tradeoffer/*" ]},['requestHeaders','blocking']);


//
// Replace Header-Origin and -Referer to send Market-Listings
/////////////////////////////////////////////////////////////
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  // Only replace requests from our extension
  if(details.tabId === -1){

    var headers = details.requestHeaders,
    blockingResponse = {};

    //console.log('Replacing Headers for Sellitem.');

    for( var i = 0, l = headers.length; i < l; ++i ) {
      if(headers[i].name == 'Origin') headers[i].value = inventoryLink;
    }

    headers.push({name: 'Referer', value: 'https://steamcommunity.com/market/sellitem/'});

    blockingResponse.requestHeaders = headers;
    return blockingResponse;

  }
},{urls: ["https://steamcommunity.com/market/sellitem/"]},['requestHeaders','blocking']);

// EDIT: Can be solved by calling ?l=english as url-param
// Add Cookie to Headers for retrieving license-data (added)
/////////////////////////////////////////////////////////////
/*
chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  // Only replace requests from our extension
  if(details.tabId === -1){

    var headers = details.requestHeaders,
    blockingResponse = {};

    // Replacing the language-cookie to get one and the same date-format
    for( var i = 0, l = headers.length; i < l; ++i ) {
      if(headers[i].name == 'Cookie'){

        if(/Steam_Language/.test(headers[i].value)){
          console.log(headers[i].value);
          var lang = /.*Steam_Language=([^;\s]+).*|.+/.exec(headers[i].value)[1];

          if(lang !== 'english'){
            headers[i].value = headers[i].value.replace('Steam_Language='+lang, 'Steam_Language=english');
          }
        } else {
          headers[i].value = headers[i].value+" Steam_Language=english;";
        }
      }
    }

    blockingResponse.requestHeaders = headers;
    return blockingResponse;

  }
},{urls: ["https://store.steampowered.com/account/licenses/"]},['requestHeaders','blocking']);

*/


// Replacing CSP-Headers - see https://matthewspencer.github.io/browser-extensions-and-csp-headers/
// Needed to automate Community-Badge crafting due to some tasks rely on
// store.steampowered.com - which is not part of the Standard-CSP-Headers
// @see https://developer.mozilla.org/en-US/docs/Web/Security/CSP
///////////////////////////////////////////////////////////////////////////////////////////////////

let cspHeaders = ['content-security-policy','x-webkit-csp'];
// @see https://developer.mozilla.org/en-US/docs/Web/Security/CSP/CSP_policy_directives

let cspSources = ['connect-src','default-src','font-src','frame-src','img-src','media-src','object-src','script-src','style-src'];

function isCspHeader(headerName) {
  return cspHeaders.includes(headerName.toLowerCase());
}

function modifyCspHeaders(details) {
  details.responseHeaders.forEach((responseHeader) => {
    if (!isCspHeader(responseHeader.name)) {
      return;
    }
    let csp = responseHeader.value;
    cspSources.forEach((cspSource) => {
      csp = csp.replace(cspSource, cspSource + ' http://*.steampowered.com https://*.steampowered.com');
    });
    responseHeader.value = csp;
  });
  return { responseHeaders: details.responseHeaders };
}

chrome.webRequest.onHeadersReceived.addListener(
  modifyCspHeaders,
  {
    urls : [ 'http://*/*', 'https://*/*' ],
    types: [ 'main_frame' ]
  },
  ['responseHeaders','blocking']
);