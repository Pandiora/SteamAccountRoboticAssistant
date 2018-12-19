$(document).ready(function(){

	$('body').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 200);
	$('.names:odd').css("background-color","rgba(0,0,0,0.2)");

	// Autologin with one click on accountname
	///////////////////////////////////////////////////////
	$(document).on('click', '.names', function(){

		// Use clicked name for further processing
		var name = $(this).text();

		$('.names').removeClass('active-green');
		$(this).addClass('active-green');

		// login User via background-page
		chrome.runtime.sendMessage({
			process: 'loginUser',
			parameters: name
		}, (res)=>{
			if(res.action === 'done'){
				document.location.reload();
			} else {
				console.log(res);
			}
		});
		/*chrome.runtime.sendMessage({process: 'getUserDataFor'+name},function(user){
			chrome.runtime.sendMessage({process: 'deleteCookies'},function(response){
				console.log(response.farewell);
			});

			$('#steamAccountName, #input_username').val(name);
			$('#steamPassword, #input_password').val(user[0]['pw']);

			// Set the Cookie for this user to avoid Trade-Restrictions
			if(typeof user[0]['steamMachine'] != 'undefined' && user[0]['steamMachine'] != ''){
				chrome.runtime.sendMessage({greeting: 'steamMachineAuth'+user[0]['steamid']+';'+user[0]['steamMachine']}, function(cookieres) {
					console.log(cookieres.farewell);

					// Now Log In
					$('#login_btn_signin button, #SteamLogin').click();

					// Use Helper to wait until Auth-Window exists/is shown
					$(document).arrive('.responsive_page #twofactorcode_entry', function(){
						if($('.loginTwoFactorCodeModal').is(':visible')){
							console.log('2FA needed');

							$('#twofactorcode_entry').val(generateAuthCode(user[0]['secret'], 0));
							$('div[data-modalstate="submit"]').click();

						} else {
							// Removed SteamGuard-Code Treatment
						}
					});

				});
			} else {
				console.log(chrome.i18n.getMessage("steam_login_error_no_cookie"));
			}
		});*/
	});

	// Prevent scrolling of body if list is scrolled with mousewheel
	///////////////////////////////////////////////////////
	/*$('.loginbox_right').on('mouseover mouseout', function(e){
		if(e.type == 'mouseover'){
			$('body').css({'overflow': 'hidden'});
		} else {
			$('body').css({'overflow': 'auto'});
		}
	});*/


	// SEARCH-FUNCTION N STUFF FOR AUTOLOGIN
	///////////////////////////////////////////////////////
	timer = 0, exec_exp = 0;
	function mySearch(){
		// Make contains case-insensitive, only execute this one time
		exec_exp++;
		if(exec_exp == 1){
			jQuery.expr[':'].contains = function(a, i, m) {
			 return jQuery(a).text().toUpperCase()
					 .indexOf(m[3].toUpperCase()) >= 0;
			};
		}
		// Hide or show matching entrys
		var xx = $('.names-input').val();
		$('.names:not(:contains("'+xx+'"))').addClass('names-none');
		$('.names:contains("'+xx+'")').removeClass('names-none');
		$('.names').css("background-color","rgba(0,0,0,0)");
		$('.names:contains("'+xx+'"):odd').css("background-color","rgba(0,0,0,0.2)");
	}

	$('.names-input').on('keyup', function(e){
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(mySearch, 400);
	});

	// Display Input for AppID if we wanna add free license or start nomination-queue and Input should be visible
	$("#login_tasks").on('change', function() {
		if(["addFreeLicense","automatedNomination"].indexOf($('option:selected', this).attr('id')) > -1){
			$('.tasks_inputs:eq(0)').show();
		} else {
			$('.tasks_inputs:eq(0)').hide();
		}
	});

	$(document).on('click', '#task_action_btn', function(){

		/*
			C O N F I G
			should send [actionname]+'Bit'
		*/
		const objSelected = {
			discoveryQueue: {
				getTaskInput: 0,
				redirectTo: `https://store.steampowered.com/login/?redir=explore%2F%3Fl%3Denglish`
			},
			addFreeLicense: {
				getTaskInput: 1,
				redirectTo: `https://store.steampowered.com/login/?redir=app%2F${license_appid}%2F`
			},
			automatedNomination: {
				getTaskInput: 1,
				redirectTo: 'https://store.steampowered.com//login/?redir=SteamAwardNominations%2F%3Fl%3Denglish'
			}
		};

		//console.log('clicked');
		const option = $('#login_tasks option:selected').attr('id'),
			  input  = $('.tasks_inputs1').val();

		// use object for data to be send, action+process is mandatory
		let message = {
		  action: 'start',
		  process: `${option}Bit`,
		  parameters: { appid: '' }
		};

		if(objSelected[option].getTaskInput === 1){
			if(input !== ''){ message.parameters.appid = input; } 
			else 			{ alert('Input is empty!'); return; }
		}

		// uncatched options are used for skips
		if(Object.keys(objSelected).indexOf(option)){
			chrome.runtime.sendMessage(message, function(r){
				if(r === 1) document.location.href = objSelected[option].redirectTo;
			});
		} else {
			chrome.runtime.sendMessage({process: selected_option},function(r){
				if(r.status === 1){
					location.reload();
				}
			});
		}
	});
});