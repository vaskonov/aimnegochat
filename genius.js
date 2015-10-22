/**
 * Classes related to GENIUS (domains and utility spaces).
 * @author Erel Segal-Halevi
 * @since 2013-02
 */


var xml2js = require('xml2js')
	, fs	 = require('fs')
	, path = require('path')
	, util = require('util')
	;


//
// Domain
//

exports.Domain = function (pathToXmlFile) {
	var parser = new xml2js.Parser();
	var description = null, utility_space = null;
	parser.parseString(fs.readFileSync(pathToXmlFile), function (err, result) {
		description = result.negotiation_template.description[0].trim();
		utility_space = result.negotiation_template.utility_space[0];
	});
	this.description= description;
	
	// Initialize issues:
	this.issues = utility_space.objective[0].issue;

	// Initialize agents and their utility spaces:
	var agents = utility_space.agent;
	var agentsByOwnerAndPersonality = {};
	for (var i in agents) {
		var agent = agents[i].$	// utility_space, owner, personality;
		var path_to_utility_space = path.resolve(path.dirname(pathToXmlFile), agent.utility_space);
		//console.log(path_to_utility_space);
		agent.utility_space_object = new UtilitySpace(path_to_utility_space);
		if (!agentsByOwnerAndPersonality[agent.owner])
			agentsByOwnerAndPersonality[agent.owner] = {};
		agentsByOwnerAndPersonality[agent.owner][agent.personality] = agent;
	}
	
	this.agentsByOwnerAndPersonality = agentsByOwnerAndPersonality;	
}

exports.Domain.prototype.agentOfRoleAndPersonality = function(role, personality) {
	var agentsOfRole = this.agentsByOwnerAndPersonality[role];
	if (!agentsOfRole)
		throw new Error("No agents of role '"+role+"'. Known agents are: "+Object.keys(this.agentsByOwnerAndPersonality));
	return agentsOfRole[personality];
};

exports.Domain.prototype.agentsOfRole = function(role) {
	return this.agentsByOwnerAndPersonality[role];
};

exports.Domain.prototype.agentsOfOtherRole = function(role) {
	var agents = [];
	for (var otherRole in this.agentsByOwnerAndPersonality) {
		if (otherRole!=role) {
			var agentsObject = this.agentsByOwnerAndPersonality[otherRole];
			for (var i in agentsObject) 
				agents.push(agentsObject[i]);
		}
	}
	return agents;
};


//
// UtilitySpace
//

var UtilitySpace = function (pathToXmlFile) {
	var parser = new xml2js.Parser();
	var utility_space = null;
	parser.parseString(fs.readFileSync(pathToXmlFile), function (err, result) {
		utility_space = result.utility_space;
	});

	// Initialize simple parameters:
	this.reservation =	parseInt(utility_space.reservation[0].$.value);
	this.optout = parseInt(utility_space.optout[0].$.value);
	this.timeeffect =	parseInt(utility_space.timeeffect? utility_space.timeeffect[0].$.value: 0);
	this.weightmultiplyer =	parseInt(utility_space.weightmultiplyer[0].$.value);

	// Initialize weights and issues:
	var weightByIndex = {};	
	var weights = utility_space.objective[0].weight;
	for (var i in weights) {
		var weightRaw = weights[i].$;
		weightByIndex[weightRaw.index] = weightRaw.value;
	}
	
	this.issueByIndex = {};
	var issues = utility_space.objective[0].issue;
	this.maxUtilityBid = {};
	for (i in issues) {
		var issueRaw = issues[i];
		var issue = issueRaw.$;
		issue.valueByIndex = {};
		issue.values = [];
		var items = issueRaw.item;
		
		items.sort(function(a,b) { // sort from the best value to the worst value:
			return parseInt(b.$.evaluation)-parseInt(a.$.evaluation);
		});

		for (var j in items) {
			var item = items[j].$;
			issue.valueByIndex[item.index] = item;
			issue.values.push(item.value);
		}
		issue.bestValue = issue.values[0];
		this.maxUtilityBid[issue.name] = issue.bestValue;

		issue.weight = weightByIndex[issue.index];
		this.issueByIndex[issue.index] = issue;
	}
}

UtilitySpace.prototype.getUtilityWithoutDiscount = function(bid) {
	var utility = 0;
	for (var iIssue in this.issueByIndex) {
		var issue = this.issueByIndex[iIssue];
		var valueInBid = bid[issue.name];
		for (iValue in issue.valueByIndex) {
			var value = issue.valueByIndex[iValue];
			if (valueInBid===value.value)
				utility += (value.evaluation * issue.weight * this.weightmultiplyer);
		}
	}
	return utility;
};

UtilitySpace.prototype.getUtilityWithDiscount = function(utility, roundsFromStart) {
	return utility + roundsFromStart * this.timeeffect;
}


UtilitySpace.prototype.getMaxUtilityBid = function() {
	return this.maxUtilityBid;
}

UtilitySpace.prototype.getMaxUtility = function() {
	return this.getUtilityWithoutDiscount(this.maxUtilityBid);
}



function jadeTemplate(jadeFileName) {
	var pathToJade = path.join(__dirname,"views",jadeFileName);
	return jade.compile(fs.readFileSync(pathToJade), {pretty:true, filename:pathToJade});
}

if (process.argv[1] === __filename) {
	console.log("genius.js unitest start");
	
	var jade = require('jade');
	
	var domain, agent, utilitySpace, offer;
	
	/* files for rendering: */
	var GeniusUtilityOfCurrent = jadeTemplate("GeniusUtilityOfCurrent.jade");
	var GeniusUtilityOfPartner = jadeTemplate("GeniusUtilityOfPartner.jade");
	var GeniusIssuesAndValues = jadeTemplate("GeniusIssuesAndValues.jade");

	var pathToJade = path.join(__dirname,"views","GeniusUtilityOfPartner.jade");
	var fn = jade.compile(fs.readFileSync(pathToJade), {pretty:true, filename:pathToJade});
	

	/* test job candidate domain: */
	domain = new exports.Domain(path.join(__dirname,'domains','JobCandiate','JobCanDomain.xml'));
	console.log("This is a domain of negotiation "+domain.description);
	agent = domain.agentOfRoleAndPersonality('employer', 'comp-romise');
	utilitySpace = agent.utility_space_object;
	offer = {Salary: '7,000 NIS', 'Job Description': 'QA'};
	console.log("utility of "+JSON.stringify(offer)+"="+utilitySpace.getUtilityWithoutDiscount(offer));
	console.log("Best bid is  "+JSON.stringify(utilitySpace.maxUtilityBid)+"="+utilitySpace.getUtilityWithoutDiscount(utilitySpace.maxUtilityBid));
	console.log("Best bid is  "+JSON.stringify(utilitySpace.getMaxUtilityBid())+"="+utilitySpace.getMaxUtility());
	var otheragents = domain.agentsOfOtherRole('employer');
	//console.dir(utilitySpace.issueByIndex);
	//console.log(GeniusIssuesAndValues({agent: agent}));

	/* test neighbours domain: */
	domain = new exports.Domain(path.join(__dirname,'domains','neighbours_alex_deniz','neighbours_domain.xml'));
	console.log("This is a domain of negotiation "+domain.description);
	agent = domain.agentOfRoleAndPersonality('alex', 'A');
	utilitySpace = agent.utility_space_object;
	offer = {'Basketball court': 'Alex will not use court on Saturday', Noise: 'Deniz will be quiet after 11pm'};
	console.log("utility of "+JSON.stringify(offer)+"="+utilitySpace.getUtilityWithoutDiscount(offer));
	//console.log(GeniusIssuesAndValues({agent: agent}));

	//console.log(util.inspect(Domain,true,1000,true));
	
	// domain = new exports.Domain(path.join(__dirname,'domains','Kitchen','Kitchen-domain.xmll'));
	// console.log("This is a domain of negotiation "+domain.description);
	// console.log("genius.js unitest end");
}
