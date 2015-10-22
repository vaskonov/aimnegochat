// Client side support for the self/partner utility buttons
$(function() {
	// When the user clicks on of the "show score" buttons - show the utility table in a dialog box:
	var utilityDiv = $("<div/>");
	var utilityOptions = { /* no options */ };
	var helpOptions = { width:300 };
	var utilityPosition = {
		my: "left top",
		at: "right top",
		of: $("#mainStatusRow")};
	$(".btnUtility").click(function() {
		var id = $(this).attr('id');
		var utilityUrl = '/'+id+'/'+session_data.domain+"/"+session_data.role+"/"+session_data.personality;
		// load the utility table to a hidden div:...
		utilityDiv.load(utilityUrl, function() {   
			// ... after it is loaded, make it a dialog and put it in the correct position:
			utilityDiv.dialog(utilityOptions).dialog('widget').position(utilityPosition); 
		}); 
		return false;
	});
	$(".btnHelp").click(function() {
		var utilityUrl = '/Help/'+session_data.gametype+"/"+session_data.domain+"/"+session_data.role;
		utilityDiv.load(utilityUrl, function() { utilityDiv.dialog(helpOptions).dialog('widget').position(utilityPosition); }); 
		return false;
	});

	 $(".btnUtility").click()
});
