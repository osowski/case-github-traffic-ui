// Uncomment following to enable zipkin tracing, tailor to fit your network configuration:
// var appzip = require('appmetrics-zipkin')({
//     host: 'localhost',
//     port: 9411,
//     serviceName:'frontend'
// });

/**
Add back to package.json
"appmetrics-dash": "^4.0.0",
"appmetrics-prometheus": "^2.0.0",
"appmetrics-zipkin": "^1.0.4",
**/

//require('appmetrics-dash').attach();
//require('appmetrics-prometheus').attach();
const appName = require('./../package').name;
const http = require('http');
const express = require('express');
const log4js = require('log4js');
const localConfig = require('./config/local.json');
const path = require('path');

const logger = log4js.getLogger(appName);
const app = express();
const server = http.createServer(app);

app.use(log4js.connectLogger(logger, { level: process.env.LOG_LEVEL || 'info' }));
//const serviceManager = require('./services/service-manager');
//require('./services/index')(app);
require('./routers/index')(app, server);

// Add your code here
var IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init();

//Establish initial db connectivity here
const ibmdb = require('ibm_db');
const dbCreds = IBMCloudEnv.getDictionary("backend-sql-credentials");

const assetStats = require('./services/asset-stats');
var dbInit = false;
ibmdb.open(dbCreds.dsn, function (err,conn) {
  if (err) return console.log(err);
  
  conn.query('select 1 from sysibm.sysdummy1', function (err, data) {
    if (err) console.log(err);
    else {
      console.log("db init successful");
      dbInit = true;
      assetStats.initialized(dbCreds.dsn);
    }
    
    conn.close(function () {
      console.log('done');
    });
  });
});

app.set('view engine', 'pug');
app.set('view options', {debug:  true});
app.set('views', './views');

app.disable('view cache');

app.get('/stats/:stat_type?/:subset?/:timeslice?', function(req, res){
  
  var stat_type = req.params.stat_type;
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
  
  var subset = req.params.subset;
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
  
  var timeslice = req.params.timeslice;
  if ( !( Number.parseInt(timeslice, 10) > 0 && Number.isSafeInteger(Number.parseInt(timeslice, 10) ) ) )  {
    timeslice = "14";
  }
  
  assetStats.getStats(stat_type, subset, timeslice, function(_data){
    console.log("server.js", "In", "/stats", "Entering", "render");
    res.render('stats', {
      stat_type: stat_type, 
      subset: subset, 
      timeslice: timeslice,
      stats: _data,
      debug: true });
  });
  
});

app.get('/repos', function(req, res){
  assetStats.getRepos(function(_data){
    console.log("server.js", "In", "/repos", "Entering", "render");
    res.render('repos', {
      repos: _data,
      debug: true });
  });
});
// END Add your code here

const port = process.env.PORT || localConfig.port || 3000;
server.listen(port, function(){
  logger.info(`casegithubtrafficui listening on http://localhost:${port}/appmetrics-dash`);
  logger.info(`casegithubtrafficui listening on http://localhost:${port}`);
});

app.use(function (req, res, next) {
    res.sendFile(path.join(__dirname, '../public', '404.html'));
});

app.use(function (err, req, res, next) {
    res.sendFile(path.join(__dirname, '../public', '500.html'));
});
module.exports = server;
