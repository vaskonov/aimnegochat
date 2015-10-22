var azure = require('azure');
 // , uuid = require('node-uuid');
var err = require('../error');
module.exports = FinalAgreementModel;


function FinalAgreementModel(storageClient, tableName) {
  this.storageClient = storageClient;
  this.tableName = tableName;


  this.storageClient.createTableIfNotExists(tableName, 
    function tableCreated(error) {
      if(error) {
        //throw error;
        err.writeJsonError("error", error, tableName, "Cannot create table");
        console.log("can't create table");
      }
    });
};

FinalAgreementModel.prototype.add = function(item, callback) {
	var self = this;
  self.storageClient.insertOrReplaceEntity(self.tableName, item, 
    function entityInserted(error) {
      if(error){  
        err.writeJsonError("error", error, self.tableName, item);
        console.log("Cannot add to table: "+self.tableName + JSON.stringify(error));
        //callback(error + self.tableName);
      }
      callback(null);
    });
};

FinalAgreementModel.prototype.find = function(query, callback) {
	var self = this;
  self.storageClient.queryEntities(query, 
    function entitiesQueried(error, entities){
      if(error) {
        console.log("Cannot find table: "+ self.tableName +JSON.stringify(error));
        err.writeJsonError("error", error, self.tableName, item);
        //callback(error + self.tableName);
      } else {
        callback(null, entities);
      }
    });
};

FinalAgreementModel.prototype.updateItem = function(item, callback) {
  var self = this;
    self.storageClient.insertOrMergeEntity (self.tableName, item, 
    function entityInserted(error) {
      if(error){  
        console.log("Cannot find update to table: "+ self.tableName+JSON.stringify(error));
        err.writeJsonError("error", error, self.tableName, item);
        //callback(error + self.tableName);
      }
      callback(null);
    });
};
 
 FinalAgreementModel.prototype.deleteItem = function(item, callback) {
  var self = this;
  self.storageClient.deleteEntity (self.tableName, item, 
    function entityDeleted(error) {
      if(error){  
        
        err.writeJsonError("error", error, self.tableName, item);
        console.log("Cannot delete from table: "+self.tableName+JSON.stringify(error));
        //callback(error + this.tableName);
      }
      callback(null);
    });
};