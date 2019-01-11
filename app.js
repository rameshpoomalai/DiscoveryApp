/**
 * Module dependencies.
 */
 // Load env
 require('dotenv').load();
var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');
var Cloudant = require('cloudant');
const requestAPI = require('request');
var app = express();

var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
    dbName: process.env.CLOUDANT_DB_NAME
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
const syncservice = require('./discoveryServiceHelper');
var htmlToText = require('html-to-text');





// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

function getDBCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);
    // Pattern match to find the first instance of a Cloudant service in
    // VCAP_SERVICES. If you know your service key, you can access the
    // service credentials directly by using the vcapServices object.
    for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}

function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    // if (process.env.VCAP_SERVICES) {
    //     dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
    // } else { //When running locally, the VCAP_SERVICES will not be set
    //
    //     // When running this app locally you can get your Cloudant credentials
    //     // from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
    //     // Variables section for an app in the Bluemix console dashboard).
    //     // Once you have the credentials, paste them into a file called vcap-local.json.
    //     // Alternately you could point to a local database here instead of a
    //     // Bluemix service.
    //     // url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
    //     //dbCredentials.url = getDBCredentialsUrl(fs.readFileSync("vcap-local.json", "utf-8"));
    //     dbCredentials.url = "https://c49bae80-39fb-40d9-85f8-4cfd9586104a-bluemix:137252d7873a272ffab743df0ea8f2f2c83e18d3d4610981f9dbde53e21b9846@c49bae80-39fb-40d9-85f8-4cfd9586104a-bluemix.cloudant.com"
    // }


    //dbCredentials.url = "https://740ce983-c605-45cf-96c3-3c6d2dc1fbb5-bluemix:0ba9c7ac8ca19b03c63e844f8c143ddf59eb3f415d9ae1cc33aa836a8c883a69@740ce983-c605-45cf-96c3-3c6d2dc1fbb5-bluemix.cloudant.com"



     cloudant = new Cloudant({ url: process.env.CLOUDANT_URL, plugins: { iamauth: { iamApiKey: process.env.CLOUDANT_APIKEY } } });




    db = cloudant.use(dbCredentials.dbName);
    // var topic = {name:'topic', type:'json', index:{fields:['topic']}}
    // db.index(topic, function(er, response) {
    //   if (er) {
    //     throw er;
    //   }
    //
    //   console.log('Index creation result: %s', response.result);
    // });

}

initDBConnection();

app.get('/', routes.index);

function createResponseData(id, url,document_detail,rev, attachments) {

    var responseData = {
        id: id,
        url:sanitizeInput(url),
        document_detail:document_detail,
        rev:rev,
        attachements: []
    };
    return responseData;
}

function sanitizeInput(str) {
    return String(str).replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var saveDocument = function(id, name, value, response) {

    if (id === undefined) {
        // Generated random id
        id = '';
    }

    db.insert({
        name: name,
        value: value
    }, id, function(err, doc) {
        if (err) {
            console.log(err);
            response.sendStatus(500);
        } else
            response.sendStatus(200);
        response.end();
    });

}
app.get('/api/search', function(request, response) {
    console.log("get latest News ")
    let username = process.env.DISCOVERY_USERNAME;
    let password = process.env.DISCOVERY_PASSWORD;
    let baseURL = process.env.DISCOVERY_URL;
    let baseQuery = '/query?version='+process.env.DISCOVERY_API_VERSION+'&deduplicate=true&deduplicate.field=text&highlight=true&count=5&return=highlight,extracted_metadata,passages&passages=true&&passages.count=20&passages.fields=text&natural_language_query=';
    //let baseQuery = '/query?version=2018-08-01&deduplicate=true&deduplicate.field=text&highlight=true&count=5&return=highlight,extracted_metadata&natural_language_query=';
    let url = baseURL +process.env.DISCOVERY_ENVIRONMENT_ID+'/collections/'+process.env.DISCOVERY_COLLECTION_ID+baseQuery+request.query.topic;
    let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    console.log(url);
    requestAPI(
      {
        url : url,
        headers : {
            "Authorization" : auth
        }
      }, function (error, restresponse, body) {
      console.log('error:'+ error); // Print the error if one occurred
      console.log('statusCode:'+ restresponse && restresponse.statusCode); // Print the response status code if a response was received
      var items=[];
      if(!error)
      {
        var receivedItems = JSON.parse(body);
        for (i = 0; i < receivedItems.results.length; ++i) {

            var item = receivedItems.results[i].highlight.text;
            var docname = receivedItems.results[i].extracted_metadata.filename;
            var doctype = receivedItems.results[i].extracted_metadata.file_type;
            var docid = receivedItems.results[i].id;
            var passages ={};
            var passagesFound = false;

            for(pcount=0;((pcount<receivedItems.passages.length) && (passagesFound == false));pcount++)
            {
                if(docid == receivedItems.passages[pcount].document_id)
                {
                    passagesFound = true;
                    var passagetext = htmlToText.fromString(receivedItems.passages[pcount].passage_text, {
                      wordwrap: 130
                    });
                    passages= {"filename":docname, "type":doctype,"resulttext":passagetext};
                    items.push(passages);
                    console.log("Passages found:"+pcount+" parent"+i);

                }
            }
            if(item)
            {
              for (j = 0; j < item.length; ++j) {
                var displayText = item[j].replace(/\<em\>/gi, 'mynodejsmarkersstart');
                displayText = displayText.replace(/\<\/em\>/gi, 'mynodejsmarkersend');

                var passagetext = htmlToText.fromString(displayText, {
                  wordwrap: 130
                });
                passagetext = passagetext.replace(/mynodejsmarkersstart/gi, '<em>');
                passagetext = passagetext.replace(/mynodejsmarkersend/gi, '</em>');

                var lineItem = {"filename":docname, "type":doctype,"resulttext":passagetext };
                items.push(lineItem);

              }
            }


        }
      }

      response.write(JSON.stringify( items));
      console.log('ending response...');
      response.end();
    });

});
app.get('/api/getDocument', function(request, response) {

    console.log(request.query.fileName);
    console.log(request.query.fileType);
    var fileName = request.query.fileName;
    var fileType = request.query.fileType;

    // if(fileType=="getPassageDocument")
    // {
    //   let username = process.env.DISCOVERY_USERNAME;
    //   let password = process.env.DISCOVERY_PASSWORD;
    //   let baseURL = 'https://gateway.watsonplatform.net/discovery/api/v1/environments/';
    //   let baseQuery = '/documents/'+fileName+'?version=2018-08-01'
    //   let url = baseURL +process.env.DISCOVERY_ENVIRONMENT_ID+'/collections/'+process.env.DISCOVERY_COLLECTION_ID+baseQuery
    //   let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    //   console.log(url);
    //   requestAPI(
    //     {
    //       url : url,
    //       headers : {
    //           "Authorization" : auth
    //       }
    //     }, function (error, restresponse, body) {
    //     console.log('error:', error); // Print the error if one occurred
    //     console.log('statusCode:', restresponse && restresponse.statusCode); // Print the response status code if a response was received
    //     console.log(body);
    //     if(!error)
    //     {
    //       const document = JSON.parse(body);
    //       fileName = document.filename;
    //       fileType = document.file_type;
    //       db.attachment.get(fileName, fileName, function(err, content) {
    //           if (!err) {
    //
    //               response.header('Content-disposition', 'inline; filename=\"' + fileName+"\"");
    //               response.header('Content-type', 'application/'+fileType);
    //               response.write(content);
    //               response.end();
    //           }
    //           else {
    //                   console.log("error reading attachment",err,fileName,  fileType);
    //                   response.write("Error Received from server:"+err);
    //                   response.end();
    //           }
    //       });
    //     }
    //
    //
    //   });
    //
    //
    // }
    // else {
      db.attachment.get(fileName, fileName, function(err, content) {
          if (!err) {

              response.header('Content-disposition', 'inline; filename=\"' + fileName+"\"");
              response.header('Content-type', 'application/'+fileType);
              response.write(content);
              response.end();
          }
          else {
                  console.log("error reading attachment",err,fileName,  fileType);
                  response.write("Error Received from server:"+err);
                  response.end();
          }
      });
    //}





});

http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port ' + app.get('port'));
});
