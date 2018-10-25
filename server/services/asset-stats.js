
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
  
  //TODO validate subset is either topten or all, default to topten
  
  //TODO validate timeslice is a positive integer
  
  //TODO Extrapolate out SCHEMA name
  //TODO Add general and unique to both query strings
  
  var _queryString = "";
  
  var _viewsQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES from DASH5891.REPOTRAFFIC, DASH5891.REPOS where REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE between CURRENT_DATE - {TIMESLICE} and CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY VIEWS DESC";
  
  var _clonesQueryString = "SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES from DASH5891.REPOTRAFFIC, DASH5891.REPOS where REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE between CURRENT_DATE- {TIMESLICE} and CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY CLONES DESC";

  
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


/*
SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES  from DASH5891.REPOTRAFFIC, DASH5891.REPOS where REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE between CURRENT_DATE-7 and CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY VIEWS DESC;

SELECT REPOS.RNAME AS REPOSITORY, SUM(REPOTRAFFIC.VIEWCOUNT) AS VIEWS, SUM(REPOTRAFFIC.CLONECOUNT) AS CLONES  from DASH5891.REPOTRAFFIC, DASH5891.REPOS where REPOS.RID=REPOTRAFFIC.RID AND (REPOTRAFFIC.TDATE between CURRENT_DATE-7 and CURRENT_DATE) GROUP BY REPOS.RNAME ORDER BY CLONES DESC;
*/
