// Client side support for the RoomForNegoChat.jade template
// -------------------

// This file contains all of the relevant client side code to communicate through 
// `socket.io` to the server, and in turn all other connected clients

// Wait for the DOM to load before taking action


$(function() {
	// Setup
	// -----
	// Create the socket connection object, as well as the references to our DOM 
	// handlers for input and recording output
	// {'connect timeout': 1000}
	var role = null;
	var gametype = null;
	
	if (session_data) {              // the session data is inserted to the layout.jade template by the server.
		socket.emit('start_session', session_data);
		role = session_data.role;
		$("#typegame").val(session_data.gametype);
	} else {
		role = 'Unknown';
	}

	setUpHistoryTable(null);	// in datatable.js

	/*function bye() {  // go to the next screen
		alert($("form#nextAction").value);
		window.location = $("form#nextAction").attr("action");
	}*/

	// When the user clicks the "sign agreement" button, send the current agreement to the server:
	$("#sendOffer").click(function() {
		/* simple conversion - to a JSON Object: */
		/*var agreement = {};
		$("select.issue").each(function() {
			var issue = $(this).attr('title');
			var value = $(this).val();
			if (value)
				agreement[issue] = value;
		});
		var action = {'offer': agreement};*/

		/* complex conversion - to a JSON Array - for testing only: */
		var action = [];
		$("select.issue").each(function() {
			var issue = $(this).attr('title');
			var value = $(this).val();
			var issuevalue = {}; issuevalue[issue]=value;
			if (value)
				action.push({'Offer': issuevalue});
		});

		socket.emit('negoactions', action);
	});
	
	$("#Accept").click(function() {
		socket.emit('negoactions', {'Accept': 'previous'});
	});
	
	$("#Reject").click(function() {
		socket.emit('negoactions', {'Reject': 'previous'});
	});

	// The server tells us that there is agreement/disagreement on a certain issue:
	socket.on('issueAgreed', function (data) {
		var pathToIssue = "#"+data.issue.replace(/[^a-z]/ig,"_") + "_label";
		var element = $(pathToIssue);
		if (data.agreed) {
			element.css("color","green");
		} else {
			element.css("color","");
		}
		if (data.allAgreed) {
			$("#signAgreement").removeAttr('disabled');
		} else {
			$("#signAgreement").attr('disabled', 'disabled');
			$("#signatures").html(""); // all signatures are void
		}
	});

	socket.on('negoactions', function (data) {
	});


	function enableGUI() { 
		$('#btnSendChat').removeAttr('disabled');
		$('#chatMessage').removeAttr('disabled');
		//$('select.issue').removeAttr('disabled');
		//$('#btnOptOut').removeAttr('disabled');
	}

		// When the user clicks the "sign agreement" button, send the current agreement to the server:
	$("#signAgreement").click(function() {
		var agreement = {};
		$("select.issue").each(function() {
			agreement[$(this).attr('title')] = $(this).val();
		});
		socket.emit('sign', agreement);
	});
	var partiesThatSigned = {};
	
	socket.on('status', function (keyvalue) {
		if (keyvalue.key=='phase' && keyvalue.value=='') // game started
			enableGUI();
	});
	
	
	// The server tells us that there is agreement/disagreement on a certain issue:
	socket.on('issueAgreed', function (data) {
		var pathToIssue = "#"+data.issue.replace(/[^a-z]/ig,"_") + "_label";
		var element = $(pathToIssue);
		if (data.agreed) {
			element.css("color","green");
		} else {
			element.css("color","");
		}
		if (data.allAgreed) {
			$("#signAgreement").removeAttr('disabled');
		} else {
			$("#signAgreement").attr('disabled', 'disabled');
			$("#signatures").html(""); // all signatures are void
		}
	});
	
	socket.on('sign', function (data) {
		var proposer = data.id + (data.you? " (You)": "");
		$("<div>Signed by "+proposer+"</div>").appendTo("#signatures");
		partiesThatSigned[proposer] = true;
		if (data.you)
				alert("Your final score is " + data.score);
		if (Object.keys(partiesThatSigned).length>=2){
			bye();
		}
			
		addDataToHistoryTable({			
			proposerClass: data.id + (data.you? " You": " Partner"),
			proposer: proposer,
			action: "Sign",
			util: "",
			bid: "Signing the following agreement: "+JSON.stringify(data.agreement),
			answered: "no"
		});
	});

	
});

