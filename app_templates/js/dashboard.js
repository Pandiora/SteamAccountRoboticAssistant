getMasterGamesWidget();
getAccountLevelsWidget();

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
console.log(res);
			var ctx 						= $('#accountLevelChart').get(0).getContext('2d');
			var data 						= response[1];
				data.data.labels 			= res.labels;
				data.data.datasets[0].data 	= res.data;
				data.data.datasets[0].backgroundColor = res.backgroundColor,
				data.options.legendCallback = function(data) {
		            var legendHtml = [];
		            legendHtml.push('<ul class="chart-legend">');
		            var item = data.data.datasets[0];
		            for (var i=0; i < item.data.length; i++) {
		                legendHtml.push('<li>');
		                legendHtml.push('<span style="width: 10px;background-color:' + item.backgroundColor[i] +'"></span>');
   		                legendHtml.push('<span>'+data.data.labels[i]+'</span>');
		                legendHtml.push('</li>');
		            }

		            legendHtml.push('</ul>');
		            return legendHtml.join("");
		        };


/*<ul class=\"chart-legend\">
	<% for (var i=0; i<segments.length; i++){%>
		<li>
			<span class=\"fa fa-circle-o\" style=\"color:<%=segments[i].fillColor%>;\"></span>
			<%if(segments[i].label){%><%=segments[i].label%><%}%>
		</li>
	<%}%>
</ul>*/

console.log(data);
	    		pieChart 	= new Chart(ctx, data);
$('#js-legend').html(pieChart.generateLegend());
			//$('#js-legend').append(pieChart.generateLegend());

		});
	});
}

