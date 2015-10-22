/**
 * Translate text to semantic representation using a grammar-based translation server.
 */
var HOST=process.env.TRANSLATION_SERVER_HOST || "http://irsrv2.cs.biu.ac.il";
var SETTINGS = {
	port: process.env.TRANSLATION_SERVER_PORT || 9994, 
	'force new connection': true, 
	'sync disconnect on unload': true
};

var fs=require('fs'), path=require('path');
var DEFAULT_GRAMMAR_PATH = path.join(__dirname,"maps","NegotiationGrammarJson.txt");

function logWithTimestamp(message) {
	console.log(new Date().toISOString()+" "+message);
}

exports.Translator = function(translatorName, pathToGrammarFile) {
	logWithTimestamp(translatorName+" tries to connect to translation server at "+HOST+":"+SETTINGS.port);
	this.translatorName = translatorName;
	this.grammar = fs.readFileSync(pathToGrammarFile? pathToGrammarFile: DEFAULT_GRAMMAR_PATH, 'utf8');
	this.translationSocket = require('socket.io-client').connect(HOST, SETTINGS); 
	this.translationHandlers = [  /* initialize with a default handler */
		function (text, translations) {
			logWithTimestamp(translatorName + " receives "+translations.length+" translations to '"+text + "': "+JSON.stringify(translations));
		}
	];

	this.translationSocket.on('connect', function () { 
		logWithTimestamp(translatorName+" connected to translation server at "+HOST+":"+SETTINGS.port);
	});
	
	var translator = this;
	this.translationSocket.on('translation', function (result) {
			for (var i=0; i<translator.translationHandlers.length; ++i) 
				translator.translationHandlers[i](result.text, result.translations);
	});
}


exports.Translator.prototype.sendToTranslationServer = function(text, forward) {
	logWithTimestamp(this.translatorName+" asks: '" + text + "'");
	this.translationSocket.emit("translate", {
		text: text,
		forward: forward,
		grammar: this.grammar,
		numOfThreads: /*keep current number of threads*/ 0,
		entailmentProbabilityThreshold: /* keep current threshold */ 0,
		entailmentModel: /* keep current model */ undefined
		}
		);
}

exports.Translator.prototype.onTranslation = function(translationHandler) {
	this.translationHandlers.push(translationHandler);
}


//
// UNITEST
//

if (process.argv[1] === __filename) {
	if (process.argv[2]) HOST = process.argv[2];
	if (process.argv[3]) SETTINGS.port = process.argv[3];
	logWithTimestamp("translation.js unitest start");
	var translator1 = new exports.Translator("translator1");
	var translator2 = new exports.Translator("translator2");
	translator1.translationSocket.on('connect', function() {
		translator1.sendToTranslationServer("I offer a salary of 10000 and a car.", true);
	});
	translator2.sendToTranslationServer("I offer a salary of 20000 and a car.", true);

	// After several seconds, you should see only 2 results:
	//   "TranslationServer: 2 translations to 'I offer a salary of 10000...
	//   "TranslationServer: 2 translations to 'I offer a salary of 20000...
	
	logWithTimestamp("translation.js unitest end");
}
