$(document).ready(function(){

	// Autologin with one click on accountname
	///////////////////////////////////////////////////////
	$(document).on('click', '.names', function(e){

		var name = $(this).text(),
			that = $(this);

		handleActions(name, e, that);
	});

	async function handleActions(name, e, that){

		// remove name from list
		if(!e.target.className){
			const b = await browser.runtime.sendMessage({
			  action: 'start',
			  process: 'userSkip',
			  parameters: name
			});
			if(b.status == 1) $(that).remove();
			return;
		}

		$('.names').removeClass('active-green');
		$(that).addClass('active-green');

		// display loading-indicator
		$('#gwrapper').css('visibility', 'visible');

		// login User via background-page
		const res = await browser.runtime.sendMessage({
			process: 'loginUser',
			parameters: name
		});

		if(res.action === 'done'){
			document.location.reload();
		} else {
			console.log(res);
		}

	}


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

	$(document).on('click', '#task_action_btn', function(e){
		handleTasks();
	});

	async function handleTasks(){

		/*
			C O N F I G
			should send [actionname]+'Bit'
		*/
		const option = $('#login_tasks option:selected').attr('id'),
			  input  = $('.tasks_inputs1').val();

		const objSelected = {
			discoveryQueue: {
				getTaskInput: 0,
				redirectTo: `https://store.steampowered.com/login/?redir=explore%2F%3Fl%3Denglish`
			},
			addFreeLicense: {
				getTaskInput: 1,
				redirectTo: `https://store.steampowered.com/login/?redir=app%2F${input}%2F`
			},
			automatedNomination: {
				getTaskInput: 1,
				redirectTo: 'https://store.steampowered.com//login/?redir=SteamAwardNominations%2F%3Fl%3Denglish'
			},
			winterNomination: {
				getTaskInput: 0,
				redirectTo: 'https://store.steampowered.com//login/'
			},
			cozyCottage: {
				getTaskInput: 0,
				redirectTo: 'https://store.steampowered.com//login/'
			}
		};

		// uncatched options are used for skips
		if(Object.keys(objSelected).indexOf(option) < 0){
			const s = await browser.runtime.sendMessage({process: option});
			if(s.status === 1){
				location.reload();
			}
			return;
		}


		// use object for data to be send, action+process is mandatory
		let message = {
		  action: 'start',
		  process: `${option}Bit`,
		  parameters: { appid: '' }
		};

		// action requires input
		if(objSelected[option].getTaskInput === 1){
			if(input !== ''){ message.parameters.appid = input; } 
			else 			{ alert('Input is empty!'); return; }
		}

		const k = await browser.runtime.sendMessage(message);
		if(k.status == 1) document.location.href = objSelected[option].redirectTo;

	}

});