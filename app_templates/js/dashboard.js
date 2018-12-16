getAccountLevelsWidget();
getMasterGamesWidget();

$('.dropdown-menu').on('click', '.masterGamesTime', function(){

	var count = $(this).data('count'),
		scale = $(this).data('scale');

	getMasterGamesWidget(count, scale);
});

var masterGamesChart;
function getMasterGamesWidget(count, scale){

	count 	= (count) ? count : 24,
	scale 	= (scale) ? scale : 'month';

	var ctx = $('#masterGamesChart').get(0).getContext('2d');


	idb.getMasterGamesWidget(count, scale).then(function(res){
		$.get('app_templates/js/dashboard.widget.scheme.json').then((response)=>{

			// Add data to our chart
			var data 						= response[0];
				data.data.labels 			= res.label;
				data.data.datasets[0].data 	= res.count;

			// destroy & create canvas
			if(typeof masterGamesChart !== 'undefined') masterGamesChart.destroy();
			masterGamesChart = new Chart(ctx, data);
		});
	});

}


function getAccountLevelsWidget(){

	idb.getAccountLevelsWidget().done(function(res){
		$.get('app_templates/js/dashboard.widget.scheme.json').then((response)=>{

			const ctx 					= $('#accountLevelChart').get(0).getContext('2d');
			let data 					= response[1];
			let item 					= data.data.datasets[0];
				item.data 				= res.data;
			let legendHtml 				= '';
				data.data.labels 		= res.labels;
				item.backgroundColor 	= res.backgroundColor;
				item.borderColor 		= "rgba(34,36,42,1)";

			data.options.legendCallback = (data)=>{
	            for (var i=0; i < item.data.length; i++) {
	            	legendHtml +=`<li><span style="width:10px;background-color:
	            	${item.backgroundColor[i]}"></span><span>${data.data.labels[i]}</span></li>`;
	            }
	            return `<ul class="chart-legend">${legendHtml}</ul>`;
	        };
	        data.options.tooltips.callbacks.title = (tooltipItem, data)=>{
				return data['labels'][tooltipItem[0]['index']];
			}
	        data.options.tooltips.callbacks.label = (tooltipItem, data)=>{ 
	        	return ` ${data['datasets'][0]['data'][tooltipItem['index']]} account(s)`;
	        };

    		pieChart = new Chart(ctx, data);
			$('#js-legend').html(pieChart.generateLegend());
		});
	});
}

