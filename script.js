// Set up handlers
$(document).ready(function(){
//	$('#graphs').tabs({collapsible: true});
	$('#search').click(function(){getComments();});
	$('#term').keyup(function(event){
		if(event.keyCode == 13){
			getComments();
		}
	});
});

// Basic form error checking, then pass to the chart builder.
var getComments = function(){
	var url = $('#term').val();

	if(url == '') {
		$('#comments').html("<h2>Whoops, did you mean to enter a blank url?</h2>");
	}
	else {
		buildGraphs(url);
//		$.getJSON("http://graph.facebook.com/comments/?filter=stream&limit=20&ids=" + url, onLoadJSON);
	}
}

var buildGraphs = function(url) {
	//topCommenters(url);
	scatter(url);
	// this one is just a silly bar graph to test JQuery tabs
	addTab('bar');
	$.getJSON("http://graph.facebook.com/comments/?filter=stream&limit=20&ids=" + url, onLoadJSON);
	$('#tabs').tabs({collapsible: true});
}

var addTab = function(id) {
	console.log("appending tab");
	$('#graphtabs').append('<li><a href="#' + id + '">' + id + '</a></li>');
	$('#tabs').append('<div id="' + id + '"></div>');	
}

/* Scatter plot graph:
 * X: time of post (minutes after the hour)
 * Y: time of post (seconds after the minute)
 * @TODO: On mouseover: tooltip with information about the comment
 *
 * params:
 * url: URL of webpage containing facebook comments
 */
var scatter = function(url) {
	// Add a tab for the graph
	addTab('scatter');

	/* Build the query using FQL (https://developers.facebook.com/docs/reference/fql/‎)
	 *
	 * select: an array of fields to select
	 * from: FQL table
	 * 
	 * @TODO:\ for readability, maybe use ' ' instead of '+' while building, then swap in the '+' before getJSON()
	 * @TODO: replace with helper function
	 */
	var select = ['id', 'time'];
	var from = 'comment';
	var query = 'http://graph.facebook.com/fql?q='
		+ 'SELECT+' + select.join(',')
		+ '+FROM+' + from
		+ '+WHERE+object_id+IN+(SELECT+comments_fbid+FROM+link_stat+WHERE+url+="'+ url + '")';
	console.log(query);

	$.getJSON(query, function(json) {
		console.log(json);

		// Prepare dataset and build the graph
		var dataset = scatterPrepareData(json);
		scatterGraph(dataset);
	});
}

/* Prepare dataset for the scatterplot graph:
 * 
 * convert timestamp into day of week (x) and seconds after start of day (y)
 * note: multiply initial timestamp by 1000, because javascript Date uses milliseconds
 * note: I got boring data using [day, timeInSeconds], so for now I'm using [minutes, seconds]
 *
 * @return: array of objects {
 *   'id': FQL comment ID
 *   'time': FQL timestamp
 *   'day': day of week (0-6) -- new property -- y axis
 *   'seconds': seconds after start of day -- new property -- x axis
 * }
 */
var scatterPrepareData = function(json) {
	 var dataset = json['data'];
	 for (index in dataset) {
	 	var date = new Date(1000 * dataset[index]['time']);
	 	dataset[index]['day'] = date.getDay();
	 	dataset[index]['seconds'] = (3600 * date.getHours() + 60 * date.getMinutes() + date.getSeconds());
	 	// the data above wasn't spread out. As a proof of concept, try just using minutes & seconds
	 	dataset[index]['x'] = date.getMinutes();
	 	dataset[index]['y'] = date.getSeconds();
	 }
	 return dataset;
}

/* Build scatter plot graph from a prepared dataset.
 *
 * X: time of post (minutes after the hour)
 * Y: time of post (seconds after the minute)
 * @TODO: On mouseover: tooltip with information about the comment
 */
var scatterGraph = function(dataset) {
	console.log('building "scatter", the scatter plot');
	console.log(dataset);
	// use this width and height for minutes / seconds
	var width = 600;
	var height = 300;

	// Define scales
	var xAxisScale = d3.scale.linear()
		.domain([0,60])
		.range([0,width]);
	var yAxisScale = d3.scale.linear()
		.domain([0,60])
		.range([0,height]);

	// Define X axis
	var xAxis = d3.svg.axis()
		.scale(xAxisScale)
		.orient("bottom")
		.ticks(10);

	// Define Y axis
	var yAxis = d3.svg.axis()
		.scale(yAxisScale)
		.orient("left")
		.ticks(10);

	// Create svg
	var svg = d3.select("#scatter")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// Add data points
	svg.selectAll("circle")
		.data(dataset)
		.enter()
		.append("circle")
		.attr("cx", function(d) {
			// hack together a scale until I learn how to properly do it
			return d['x'] * 10;
		})
		.attr("cy", function(d) {
			// hack together a scale until I learn how to properly do it
			return d['y'] * 5;
		})
		.attr("r", function(d) {
	   		return 1;
   		});

	// Create X axis
   	svg.append("g")
		.call(xAxis);

	// Create Y axis
	svg.append("g")
		.call(yAxis);

}

/* @TODO: Will give information on the top commenters, by number of posts
 */
var topCommenters = function(url) {
	$.getJSON('http://graph.facebook.com/fql?q=SELECT+fromid+FROM+comment+WHERE+object_id+IN+(SELECT+comments_fbid+FROM+link_stat+WHERE+url+="' + url + '")', function(json) {
		console.log(json);
		var commenters = {};
		console.log(commenters);
		for (index in json['data']) {
			var id = json['data'][index]['fromid'];
			if (commenters.hasOwnProperty(id)) {
				commenters[id]++;
			} else {
				commenters[id] = 1;
			}
		}
		console.log(commenters);
	});
}

/*
1. array[{key, value}, {key, value}]
2. {value: valueCount, value: valueCount} O(n)
3. array[{value, count}, {value, count}] O(n)
4. sort ^ O(log(n))

function prepareDataSet(data) {
	// 1 -> 2
	var tmpobject = {};
	var dataset = [];
	for (index in data) {
		var id = data[index]['fromid'];
		if (tmpobject.hasOwnProperty(id)) {
			tmpobject[id]++;
		} else {
			tmpobject[id] = 1;
		}
	}

	// 2 -> 3
	for (prop in tmpobject) {
		dataset.push({"user id": prop, "comment count": tmpobject[prop]});
	}

	// 3 -> 4
	dataset.sort(function(a, b){return a['comment count'] - b['comment count']});
}


	});
}

// note: this is just an example of FQL, for me to copy/paste as needed while testing
http://graph.facebook.com/fql?q=SELECT+fromid+FROM+comment+WHERE+object_id+IN+(SELECT+comments_fbid+FROM+link_stat+WHERE+url+='http://developers.facebook.com/blog/post/472')
*/
//    $.getJSON("http://graph.facebook.com/comments/?ids=http://developers.facebook.com/docs/reference/plugins/comments", onLoadJSON);

// This is the taskmaster. Wipe the screen, then call appropriate builders.
// @TODO: get rid of this asap
var onLoadJSON = function(json) {
	console.log(json);

	$('#comments, #graphs').empty();

/*
	$('#comments').append("<ul id='names'</ul>");
	$.each(json[$('#term').val()]["comments"]["data"], function(i, item){
		$('ul#names').append("<li>"+item.from.name+"</li>");
	});
*/
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

		var svg = d3.select("#bar").append("svg").attr("width", w).attr("height", h); // <-- and here!

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

// note: this is an ok URL to pull comments from for testing
//http://developers.facebook.com/docs/reference/plugins/comments
