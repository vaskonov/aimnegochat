var azure = require('azure');
var fs = require('fs');
var _ = require('underscore')._;

  //, uuid = require('node-uuid');
 // , async = require('async')


module.exports = Questionnaire;


function Questionnaire(questionnaireModel) {
  this.questionnaireModel = questionnaireModel;
}

Questionnaire.prototype = {
  listAll: function(req, res, types,country) {
    self = this;
    var query = azure.TableQuery
      .select()
      .from(self.questionnaireModel.tableName);
      //.where('datastatus eq ?', 0);
    self.questionnaireModel.find(query, function itemsFound(err, items) {
      res.render('questionnaireData',{title: 'Questionnaire List', questionnaireList: items ,gametype: req.params.gametype,  gametypes: types,country:country});
    });
  },

  listAllInfo: function(req, res, types,country) {
    self = this;
    var query = azure.TableQuery
      .select()
      .from(self.questionnaireModel.tableName);
      //.where('datastatus eq ?', 0);
    self.questionnaireModel.find(query, function itemsFound(err, items) {
      res.render('questionnaireDataInfo',{title: 'Questionnaire List', questionnaireList: items ,gametype: req.params.gametype,  gametypes: types,country:country});
    });
  },
  

  makeQestionnaire: function(req, res){
    var self = this;      
    var item = {};
    item.RowKey = req.session.data.userid;
    item.userid = req.session.data.userid;
    item.gametype = req.session.data.gametype;
    item.country1 = req.session.data.country;
    item.browserType = req.session.data.browserType + req.session.data.browserVersion;
    if(!req.session.data.canPlay)
      req.session.data.canPlay = true;
    //item.gameid = req.session.data.gameid ? req.session.data.gameid : NaN; // doesn't work either - why?
    item.assignmentId = req.session.data.assignmentId ? req.session.data.assignmentId : NaN; //null throw the program. undefine ignore it. mayby to put some string like "no amazonTurk"
    item.hitId = req.session.data.hitId ? req.session.data.hitId : NaN;
    item.workerId = req.session.data.workerId ? req.session.data.workerId : NaN; 
    self.questionnaireModel.add(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      //res.redirect('/PostQuestionnaireA');
      return;
    });
  },

  addQuestionnaire: function(item,req,res) {
    var self = this;      
    var item = item;
    var userid = req.session.data.userid;
    

    var questionnaires = JSON.parse(fs.readFileSync(__dirname+"/../questionnaires.json"))
      if (!(userid in questionnaires))
    questionnaires[userid] = {}

    questionnaires[userid] = _.extend(questionnaires[userid], item) 
    fs.writeFileSync(__dirname+"/../questionnaires.json", JSON.stringify(questionnaires, null, 4), 'utf-8')
      
    //item.userid = req.session.data.userid;
    //item.gametype = req.session.data.gametype;
    //item.browserType = req.session.data.browserType + req.session.data.browserVersion;
    //item.gameid = req.session.data.gameid ? req.session.data.gameid : NaN; // doesn't work either - why?
    //item.assignmentId = req.session.data.assignmentId ? req.session.data.assignmentId : NaN; //null throw the program. undefine ignore it. mayby to put some string like "no amazonTurk"
    //item.hitId = req.session.data.hitId ? req.session.data.hitId : NaN;
    //item.workerId = req.session.data.workerId ? req.session.data.workerId : NaN; 
    
    item.RowKey = req.session.data.userid;
    
    self.questionnaireModel.updateItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }

      // {"gender":"Male","age":"11-20","education":"High school","field":"qwe","birth_country":"ew","RowKey":"84.228.147.166:2015-08-21T13:01:46.670Z","PartitionKey":"gameid"}
      
      //res.redirect('/PostQuestionnaireA');
      res.redirect('/PreQuestionnaireExam');
    });
  },
  
  demographyQuestionnaire: function(req,res) {
    console.log("canPlay1:" +req.session.data.canPlay1);
    if(req.session.data.canPlay1 == true)
      res.render("PreQuestionnaireDemographyA", {gametype: req.params.gametype, canPlay: true, country:req.session.data.country});
    else
      res.render("PreQuestionnaireDemographyA", {gametype: req.params.gametype, canPlay: false, country:req.session.data.country});
  },

  deleteQuestionnaireTable: function(req,res) {
    var self = this;
    self.questionnaireModel.deleteTable();
    
    res.redirect('/listAllQuestionnaire');
  },

  activeQuestionnaire: function(req,res) {
    var self = this;
    var item = req.body.item;
    item.RowKey = req.session.data.userid;
    self.questionnaireModel.updateItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      // log
      var questionnaires = JSON.parse(fs.readFileSync(__dirname+"/../questionnaires.json"))

      if (!(item['RowKey'] in questionnaires))
        questionnaires[item['RowKey']] = {}

      questionnaires[item['RowKey']]['happy'] = item['happy']
      questionnaires[item['RowKey']]['instructions'] = item['instructions']
      questionnaires[item['RowKey']]['fairness'] = item['fairness']
      questionnaires[item['RowKey']]['computer_program'] = item['computer_program']
      questionnaires[item['RowKey']]['feedback'] = item['feedback']

      fs.writeFileSync(__dirname+"/../questionnaires.json", JSON.stringify(questionnaires, null, 4), 'utf-8')

      // if(req.session.data.country == "egypt"){
      // res.redirect('/PostQuestionnaire-egypt');
      // }
      // else{
      if (!req.session.data.assignmentId)
        res.redirect('/ThankYou');
      else
        res.redirect('/ThankYouAmazon');
      // }
    });
  },

  deleteItem: function(req,res){
    var self = this;
    var gametype = req.params.gametype;
    var partition = req.params.PartitionKey;
    var row = req.params.RowKey;
    var item = {};
    item.PartitionKey = partition;
    item.RowKey = row;
    self.questionnaireModel.deleteItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      res.redirect('/'+gametype+'/listAllQuestionnaire');
    });
  }

}
