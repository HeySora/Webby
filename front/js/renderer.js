$(document).foundation();

function resize() {
	$('#elements').height( $('#sidebar').innerHeight() - $('#sidebar-title').outerHeight() - 32 );
}

$(window).resize(resize);
resize();