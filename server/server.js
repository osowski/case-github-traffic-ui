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
const serviceManager = require('./services/service-manager');
//require('./services/index')(app);
require('./routers/index')(app, server);

// Add your code here
var IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init();

//Establish initial db connectivity here
const ibmdb = require('ibm_db');
const dbCreds = IBMCloudEnv.getDictionary("backend-sql-credentials");
console.log(dbCreds);

ibmdb.open(dbCreds.dsn, function (err,conn) {
  if (err) return console.log(err);
  
  conn.query('select 1 from sysibm.sysdummy1', function (err, data) {
    if (err) console.log(err);
    else console.log(data);
 
    conn.close(function () {
      console.log('done');
    });
  });
});

app.set('view engine', 'pug');
app.set('views', './views')

app.get('/view-count/:subset?/:timeslice?', function(req, res){
  //TODO Turn into module callable from /stats
  //subset can be 'topten' or 'all', default to 'topten'
  //timeslice can be one of [7,14,21,28], default to 14
  res.send("hello world from views, with subset=\"" + req.params.subset + "\" and timeslice=\"" + req.params.timeslice+"\"");
});

app.get('/clone-count', function(req, res){
  //TODO Turn into module callable from /stats
  res.send('hello world from clones');
});

app.get('/stats/:stat_type?/:subset?/:timeslice?', function(req, res){
  
  var_stat_type = req.params.stat_type;
  //console.log(req.params.stat_type);
  if(var_stat_type==undefined){
    var_stat_type = "views";
  }
  
  var_subset = req.params.subset;
  if(var_subset==undefined){
    var_subset = "topten";
  }
  
  var_timeslice = req.params.timeslice;
  if(var_timeslice==undefined){
    var_timeslice = "14";
  }
  
  res.render('stats', { title: 'Hey', message: 'Hello there!', 
    stat_type: var_stat_type, 
    subset: var_subset, 
    timeslice: var_timeslice });
    
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
