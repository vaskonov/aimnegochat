var azure = require('azure')
  , uuid = require('node-uuid');
 // , async = require('async')


module.exports = Games;


function Games(GamesModel) {
  this.GamesModel = GamesModel;
  this.RowKey;
  this.PartitionKey;
}

Games.prototype = {

  addGames: function(gametype, gameid, startTime, unverified, game) {
    var self = this;      
    if (self.PartitionKey == gameid){
      return;
    }
    var item = new Object();
    item.PartitionKey = gameid;
    self.PartitionKey = item.PartitionKey;
    item.RowKey = uuid();
    game.RowKey = item.RowKey;
    item.gametype = gametype;
    item.startTime = JSON.stringify(startTime);
    item.active = true;
    item.unverified = JSON.stringify(unverified);
    item.country = game.country;
    item.partnerType = game.partnerType;
    item.agentRoleType = game.agentRoleType;
    console.log('game.newType  ' + game.newType );
    item.newType = game.newType? game.newType:"type";
   
    self.GamesModel.add(item, function itemAdded(error) {
      if(error) {
        throw error;
      }
    });
  },


  listAll: function(req, res,types,country,domain,gametype,newNavBar,domains,  gameServers) {
    var self = this;
    var games = {};
    for( game in gameServers){
      if(gameServers[game].data.agentType == gametype.split("_")[0])
        games[game] = 1;
    }
    var query = azure.TableQuery
      .select()
      .from(self.GamesModel.tableName);
      //.where('datastatus eq ?', 0);
    self.GamesModel.find(query, function itemsFound(error, items) {
      // Erel: sort games by increasing timestamp:
      items.sort(function(a, b){
            return new Date(a.Timestamp) - new Date(b.Timestamp);
      });
      //console.dir(gameServers)
      res.render('gamesData',{
        title: 'Games List', 
        gamesList: items, 
        country: country, 
        gametypes: newNavBar,
        domains: domains,
        domain: domain,
        gamest:games,
        gameServers: gameServers,
        gametype : gametype});

    });
  },

  
  activeGames: function(gameid, endedIn, endTime, RowKey) {
    var self = this;
    var item = {};
    if (!RowKey){
      item.RowKey = uuid();
      return;
      //throw new Error("self does not contain RowKey: "+JSON.stringify(self));
    }
    item.RowKey = RowKey;
    item.PartitionKey = gameid;
    item.endTime = JSON.stringify(endTime);
    if (endedIn){
      item.endedIn = endedIn;
    }
    else{
      item.endedIn = "Disconnect";
    }
    
    self.GamesModel.updateItem(item, function itemAdded(error) {
      if(error) {
        throw error;
      }
    });
  },

  deleteItem: function(req,res){
    var self = this;
    var domain = req.params.domain;
    var gametype = req.params.gametype;
    var partition = req.params.PartitionKey;
    var row = req.params.RowKey;
    var item = {};
    item.PartitionKey = partition;
    item.RowKey = row;
    self.GamesModel.deleteItem(item, function itemAdded(err) {
      if(err) {
        throw err;
      }
      res.redirect('/'+gametype+'/listAllGames/'+domain);
    });
  }

}