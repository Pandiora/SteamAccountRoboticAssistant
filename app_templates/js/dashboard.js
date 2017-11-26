$(function(){

    var option = {
	    	responsive: true,
	    	animation: true,
			tooltipFontSize: 12,
			tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %> games added",
			pointHitDetectionRadius : 1
    	},
    	data = {
	    	datasets: [
		        {
		            label: "My First dataset",
		            fillColor: "rgba(151,187,205,0.2)",
		            strokeColor: "rgba(151,187,205,1)",
		            pointColor: "rgba(151,187,205,1)",
		            pointStrokeColor: "#fff",
		            pointHighlightFill: "#fff",
		            pointHighlightStroke: "rgba(151,187,205,1)"
		        }
	        ]
    	},
		ctx = document.getElementById("masterGamesChart").getContext('2d'),
    	masterGamesChart;

	idb.getMasterGamesWidget(24, 'month').done(function(res){

		// Add data to our chart
		data.labels = res.label; 
		data.datasets[0].data = res.count;

	    // create Canvas
	    masterGamesChart = new Chart(ctx).Line(data, option);
	});

	$(document).on('click', '.masterGamesTime', function(){

		var count = $(this).data('count'),
			scale = $(this).data('scale');

		idb.getMasterGamesWidget(count, scale).done(function(res){

			// Add data to our chart
			data.labels = res.label; 
			data.datasets[0].data = res.count;

			// destroy & create canvas
			masterGamesChart.destroy();
			masterGamesChart = new Chart(ctx).Line(data, option);

		});
	});

});

$(function(){

    /*var data = {
      datasets: [
        {
          label               : 'Count',
          fillColor           : 'rgba(210, 214, 222, 1)',
          strokeColor         : 'rgba(210, 214, 222, 1)',
          pointColor          : 'rgba(210, 214, 222, 1)',
          pointStrokeColor    : '#c1c7d1',
          pointHighlightFill  : '#fff',
          pointHighlightStroke: 'rgba(220,220,220,1)'
        },
        {
          label               : 'Purchased',
          fillColor           : 'rgba(60,141,188,0.9)',
          strokeColor         : 'rgba(60,141,188,0.8)',
          pointColor          : '#3b8bba',
          pointStrokeColor    : 'rgba(60,141,188,1)',
          pointHighlightFill  : '#fff',
          pointHighlightStroke: 'rgba(60,141,188,1)'
        }
      ]
    };
	
	var options = {
	  scaleBeginAtZero        : true,
	  scaleShowGridLines      : true,
	  scaleGridLineColor      : 'rgba(0,0,0,.05)',
	  scaleGridLineWidth      : 1,
	  scaleShowHorizontalLines: true,
	  scaleShowVerticalLines  : true,
	  barShowStroke           : true,
	  barStrokeWidth          : 2,
	  barValueSpacing         : 5,
	  barDatasetSpacing       : 1,
	  responsive              : true,
	  maintainAspectRatio     : true,
	  tooltipTemplate: "Level <%if (label){%><%=label%>: <%}%><%= value %>",
	};

	idb.getAccountLevelsWidget().done(function(res){

		// Add data to our chart
		data.labels = res.level; 
		data.datasets[0].data = res.count;
		data.datasets[1].data = res.activated;

	    // create Canvas
		var ctx = $('#accountLevelChart').get(0).getContext('2d'),
		accountLevelChart = new Chart(ctx).Bar(data, options);
	});*/

    var pieOptions     = {
      segmentShowStroke    : true,
      segmentStrokeColor   : '#fff',
      segmentStrokeWidth   : 2,
      percentageInnerCutout: 50,
      animationSteps       : 100,
      animationEasing      : 'easeOutBounce',
      animateRotate        : true,
      animateScale         : false,
      responsive           : true,
      maintainAspectRatio  : true,
      legendTemplate       : '<ul class="chart-legend"><% for (var i=0; i<segments.length; i++){%><li><span class="fa fa-circle-o" style="color:<%=segments[i].fillColor%>;"></span> <%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>',
      tooltipTemplate	   : "<%if (label){%><%=label%>: <%}%><%= value %> account(s) \nBla",
    }
    //Create pie or douhnut chart
    // You can switch between pie and douhnut using the method below.

	idb.getAccountLevelsWidget().done(function(res){

	    var ctx = $('#accountLevelChart').get(0).getContext('2d'),
	    	pieChart = new Chart(ctx).Doughnut(res, pieOptions);
		$('#js-legend').append(pieChart.generateLegend());

	});
});
