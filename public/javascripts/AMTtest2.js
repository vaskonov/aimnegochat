
function canIplay(){
	var workers = (document.getElementById("workers").value).split(",");
    console.log(workers);
	if (!document.getElementById("workerid").value){
		
	}
	else{
		var workerid = document.getElementById("workerid").value;
		var excist = false;
		for(worker in workers){
			mystring = workers[worker];
			if((mystring == (workerid + "\n")) || (mystring == workerid) || (mystring == (workerid + "\n\r")) || (mystring == (workerid + "\r")))
				excist = true;
		}
		if(excist){
			document.getElementById("cannotPlay").style.display = "block";
			document.getElementById("canPlay").style.display = "none";
		}
		else{
			document.getElementById("canPlay").style.display = "block";
			document.getElementById("cannotPlay").style.display = "none";

		}
	}
}

