const noti = (() => {

	const toggleDisplay = (ele) => {
		ele.css("display", ele.css("display") === 'none' ? 'block' : 'none')
	};

	const toggleActionAll = (ele, that) => {

    	const notiItems = $('ul '+ele).children('.media').length;

    	$('.noti-all').css('display', 'none');
		$(that).tab('show');

		// Unset all action-buttons
		$('.notifications-controls:not(noti-all)').css('display', 'none');
		
		if(notiItems > 1) toggleDisplay($('.noti-all'));
	};

	const updateNotiCount = (id) => {

		const labels = $('ul li .label', id);
		const len 	 = labels.length;
		let sum = 0;

		for(let i=0;i<len;i++){
			const target = $(labels[i]).parent().data('target');
			const count  = $('.media', target).length;

			if(!count){
				$(labels[i]).css('display', 'none');
			} else {
				$(labels[i]).css('display', 'block');
				$(labels[i]).text(count);
			}

			sum += count;
		}

		// Update main-count too
		if(!sum){
			$(id).prev().find('span').css('display', 'none');
		} else {
			$(id).prev().find('span').css('display', 'block');
			$(id).prev().find('span').text(sum);
		}

	};


	const addNotifications = async() => {

		let notifications = await browser.storage.local.get('notifications');
			notifications = notifications.notifications;

		$('#market').html(notifications.market.join(''));
		$('#trades').html(notifications.trades.join(''));
		$('#gifts').html(notifications.gifts.join(''));

		updateNotiCount('#notifications');

		return notifications;
	};



	const sendConfirmation = async(action, element) => {


		const target = $(element);
		const items = $('.tab-pane.active .media');
		const confid = target.parent().prev().data('confid');
		const ckey = target.parent().prev().data('key');
		var confirmations = [];

		if(!confid){
			items.map((i, item) => {
				confirmations.push({
					ck: $(item).data('key'),
					cid: $(item).data('confid')
				});
			})
		} else {
			confirmations.push({
				ck: ckey,
				cid: confid
			});
		}

		console.log(`${action}ing confirmations: `, confirmations);

		// show some visible processing
		// ToDo: Add to tasks-list
		$('#reloadNotifications i').addClass('fa-spin');
		
		// all data collected, start processing
		browser.runtime.sendMessage({
			process: 'processConfirmation', 
			action: 'start',
			parameters: [action, confirmations]
		});

	};



	const sendConfirmationModal = (action, element) => {

		const action_text = 
			(action === 'allow') 
			? trn("index_confirm_all") 
			: trn("index_decline_all");


		// this dialog can't be created with promises or such
		// to not block the code
		bootbox.confirm({
		    title: "Confirmations",
		    message: action_text,
		    buttons: {
		        cancel: {
		            label: `<i class="fa fa-times"></i> ${trn("inventory_cancel_btn")}`
		        },
		        confirm: {
		            label: `<i class="fa fa-check"></i> ${trn("inventory_okay_btn")}`
		        }
		    },
		    callback: function (result) {
		    	if(result){
					sendConfirmation(action, element);

		    	}
		    }
		});
	}



	const firstLoad = async(id) => {

		// set one Tab active
		await addNotifications();
		$('#notifications .nav li:eq(0) a').click();
		updateNotiCount(id);

	};


	return {
		addNotifications,
		firstLoad,
		sendConfirmation,
		sendConfirmationModal,
		toggleActionAll,
		toggleDisplay,
		updateNotiCount
	};


})();

$('#notifications ul li i label')

$(document).ready(()=>{

	noti.firstLoad('#notifications');

	// prevent dropdown from closing
	$(document).on('click', '.dropdown-menu a, .media, .noti-all', function(e){
	    
	    const that = this;
	    const dropdownid = $(this).attr('id');
	    const dropdownaction = $(this).data('action');
	   	const dropdowntarget = $(this).data('target');

	    if(dropdowntarget){

	    	noti.toggleActionAll(dropdowntarget, this);

	    } else if(['allow', 'details', 'cancel'].indexOf(dropdownaction) > -1){
	    	
	    	if(dropdownaction === 'details'){ window.open($(this).data('link'),'_blank'); return; }
	    	noti.sendConfirmationModal(dropdownaction, that)

		} else if(dropdownid === 'reloadNotifications'){

			browser.runtime.sendMessage({process: 'reloadNotifications', action: 'start'});
			$('#reloadNotifications i').addClass('fa-spin');

		} else {

			noti.toggleDisplay($(this).closest('.media').next());

		}
	    e.stopPropagation();
	});
});


// Add Listeners for communication with background-page
browser.runtime.onMessage.addListener(function(msg, sender){

	if(sender.id == browser.runtime.id && !("url" in sender)){
		if(msg.process === "notificationsTrades"){

			noti.addNotifications();
			$('#reloadNotifications i').removeClass('fa-spin');
			return false;

		} else if(msg.process === "removeNotification"){

			if(msg.status === 'done'){
				$('#reloadNotifications i').removeClass('fa-spin');
				return false;
			}

			// Remove the latest removed item when it was succesfully confirmed
			$('.media[data-confid="'+msg.parameters.cid+'"][data-key="'+msg.parameters.ck+'"]')
			.fadeOut(400, function(){
				$(this).remove();
				$(this).next().remove(); // also remove buttons
				noti.updateNotiCount('#notifications');
			});
			return false;

		} else if(msg.action === "UpdateProgress"){

			updateProgress(msg.percentage, msg.message);
			if(msg.status === 'done'){
				setTimeout(()=>{
					$("#dialog").ejDialog("close");
					$(msg.process).removeClass('og-active');

					const datatable = $('#db_frontend_content').data('table');
					const grid = $('#db_frontend_content').ejGrid('instance');
					idb.fillGrid(datatable).done(function(data){
						grid.dataSource(data);
					});
				}, 5000);	
			}
			return false;

		} else {
			console.log(trn("index_listener_malformed"), msg);
		}
	}


});