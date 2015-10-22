var azure = require('azure');
  //, uuid = require('node-uuid');
 // , async = require('async')


module.exports = Answer;


function Answer(answerModel) {
  this.answerModel = answerModel;
}

Answer.prototype = {
  listAll: function(req, res, types,country) {
    self = this;
    var query = azure.TableQuery
      .select()
      .from(self.answerModel.tableName);
      //.where('datastatus eq ?', 0);
    self.answerModel.find(query, function itemsFound(err, items) {
      res.render('answerData',{title: 'Answer List', answerList: items ,gametype: req.params.gametype,  gametypes: types,country:country});
    });
  },

  listAllInfo: function(req, res, types,country) {
    self = this;
    var query = azure.TableQuery
      .select()
      .from(self.answerModel.tableName);
      //.where('datastatus eq ?', 0);
    self.answerModel.find(query, function itemsFound(err, items) {
      res.render('answerDataInfo',{title: 'Answer List', answerList: items ,gametype: req.params.gametype,  gametypes: types,country:country});
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
    self.answerModel.add(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      //res.redirect('/PostQuestionnaireA');
      return;
    });
  },

    
  demographyAnswer: function(req,res) {
    console.log("canPlay1:" +req.session.data.canPlay1);
    if(req.session.data.canPlay1 == true)
      res.render("PreAnswerDemographyA", {gametype: req.params.gametype, canPlay: true, country:req.session.data.country});
    else
      res.render("PreAnswerDemographyA", {gametype: req.params.gametype, canPlay: false, country:req.session.data.country});
  },

  deleteAnswerTable: function(req,res) {
    var self = this;
    self.answerModel.deleteTable();
    
    res.redirect('/listAllAnswer');
  },

  addAnswer: function(item,req,res) {
    var self = this;
    var item = item;
    for(i in item){
      item[i] = item[i].toString();
    }
    item.PartitionKey = req.session.data.gameid? req.session.data.gameid: "answer";
    item.RowKey = req.session.data.userid;
    self.answerModel.updateItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      res.redirect('/ThankYou');

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
    self.answerModel.deleteItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      res.redirect('/'+gametype+'/listAllAnswer');
    });
  }

}