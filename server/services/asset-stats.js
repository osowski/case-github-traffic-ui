
const ibmdb = require('ibm_db');

var _initialized = false;
var _dbDSN = "";

exports.initialized = function(dsn){
  this._initialized = true;
  this._dbDSN = dsn;
}

exports.isInitialized = function(){
  return this._initialized;
}

exports.getStats = function(stat_type, subset, timeslice, callback){
  console.log("asset-stats", "Entering", "getStats", stat_type, subset, timeslice);
  
  switch (stat_type){
    case "clones":
      break;
    case "views":
      break;
    case undefined:
    default:
      stat_type = "views";
      break;
  }
  
  switch (subset){
    case "all":
      break;
    case "topten":
      break;
    case undefined:
    default:
      subset = "topten";
    break;
  }
  
  if ( !( Number.parseInt(timeslice, 10) > 0 && Number.isSafeInteger(Number.parseInt(timeslice, 10) ) ) )  {
    timeslice = "14";
  }
  
  var _queryString = "";
  
  //var _viewsQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.VUNIQUES) AS UNIQUES FROM DASH5891.REPOTRAFFIC, DASH5891.REPOS WHERE REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE BETWEEN CURRENT_DATE - {TIMESLICE} AND CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY VIEWS DESC";
  var _viewsQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.VUNIQUES) AS UNIQUES FROM REPOTRAFFIC, REPOS WHERE REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE BETWEEN CURRENT_DATE - {TIMESLICE} AND CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY VIEWS DESC";
  
  //var _clonesQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES, SUM(REPOTRAFFIC.CUNIQUES) AS UNIQUES FROM DASH5891.REPOTRAFFIC, DASH5891.REPOS WHERE REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE BETWEEN CURRENT_DATE- {TIMESLICE} AND CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY CLONES DESC";
  var _clonesQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES, SUM(REPOTRAFFIC.CUNIQUES) AS UNIQUES FROM REPOTRAFFIC, REPOS WHERE REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE BETWEEN CURRENT_DATE- {TIMESLICE} AND CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY CLONES DESC";

  
  if(stat_type=="views"){
    _queryString = _viewsQueryString;
  } else if(stat_type=="clones"){
    _queryString = _clonesQueryString;
  }
  
  _queryString = _queryString.replace("{TIMESLICE}", timeslice);
  if(subset=="topten"){
    _queryString += " FETCH FIRST 10 ROWS ONLY";
  }

  var statsData = [];
    
  ibmdb.open(this._dbDSN, function (err,conn) {
    if (err) return console.log(err);
    
    conn.query(_queryString, function (err, data) {
      if (err) console.log(err);
      else {
        //console.log(data);
        statsData = data;
      }
      
      conn.close(function () {
        //console.log('done');
        callback(statsData);
      });
    });
  });
};
  
exports.getRepos = function(callback){
  console.log("asset-stats", "Entering", "getRepos");
  
  var _queryString = "SELECT REPOS.RNAME AS REPOSITORY FROM REPOS ORDER BY REPOSITORY";

  var statsData = [];
    
  ibmdb.open(this._dbDSN, function (err,conn) {
    if (err) return console.log(err);
    
    conn.query(_queryString, function (err, data) {
      if (err) console.log(err);
      else {
        //console.log(data);
        statsData = data;
      }
      
      conn.close(function () {
        //console.log('done');
        callback(statsData);
      });
    });
  });

};
