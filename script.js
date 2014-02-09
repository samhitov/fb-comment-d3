// Set up handlers
$(document).ready(function(){
	$('#search').click(function(){getComments();});
	$('#term').keyup(function(event){
		if(event.keyCode == 13){
			getComments();
		}
	});
});

// Basic form error checking, then get the JSON and pass to a handler
var getComments = function(){
	var url = $('#term').val();

	if(url == '') {
		$('#comments').html("<h2>Whoops, did you mean to enter a blank url?</h2>");
	}
	else {
		$.getJSON("http://graph.facebook.com/comments/?filter=stream&limit=20&ids=" + url, onLoadJSON);
	}
}


//    $.getJSON("http://graph.facebook.com/comments/?ids=http://developers.facebook.com/docs/reference/plugins/comments", onLoadJSON);

// This is the taskmaster. Wipe the screen, then call appropriate builders.
var onLoadJSON = function(json) {
	console.log(json);

	$('#comments, #graphs').empty();

	$('#comments').append("<ul id='names'</ul>");
	$.each(json[$('#term').val()]["comments"]["data"], function(i, item){
		$('ul#names').append("<li>"+item.from.name+"</li>");
	});
	buildCharts(json);
}

var buildCharts = function(json) {
	barChart(json);
}

var barChart = function(json) {
		//Width and height
		var w = 500;
		var h = 50;
		var barPadding = 1;

		var dataset = [];

		$.each(json[$('#term').val()]["comments"]["data"], function(i, item){
			dataset.push(item["message"].length);
		});

		var svg = d3.select("#graphs").append("svg").attr("width", w).attr("height", h); // <-- and here!

		svg.selectAll("rect")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("x", function(d, i) {
			return i * (w / dataset.length);
		})
		.attr("y", function(d) {
			return h - d;
		})
		.attr("width", w / dataset.length - barPadding)
		.attr("height", function(d) {
				return d;  //Just the data value
			});
	}
//});
/*
function onLoadJSON(json) {
    $.each(json["http://developers.facebook.com/docs/reference/plugins/comments"].comments.data, function(i, item){ 
       $('ul').append("<li>"+item.from.name+"</li>");
    });
}
*/

//http://developers.facebook.com/docs/reference/plugins/comments
