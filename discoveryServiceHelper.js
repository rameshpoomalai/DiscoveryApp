'use strict';

// Load env
// require('dotenv').load({ silent: true });
(function() {
  const syncservice = {};
  const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
  syncservice.syncService = function(queryStr,callback) {
    // Set config
    let DISCOVERY_USERNAME ;
    let DISCOVERY_PASSWORD ;
    let DISCOVERY_URL;
    let DISCOVERY_COLLECTION_ID;
    let DISCOVERY_CONFIGURATION_ID;
    let DISCOVERY_ENVIRONMENT_ID;

    if (process.env.DISCOVERY_USERNAME) {
      DISCOVERY_USERNAME = process.env.DISCOVERY_USERNAME;
    }
    if (process.env.DISCOVERY_PASSWORD) {
      DISCOVERY_PASSWORD = process.env.DISCOVERY_PASSWORD;
    }
    if (process.env.DISCOVERY_URL) {
      DISCOVERY_URL = process.env.DISCOVERY_URL;
    }
    if (process.env.DISCOVERY_COLLECTION_ID) {
      DISCOVERY_COLLECTION_ID = process.env.DISCOVERY_COLLECTION_ID;
    }
    if (process.env.DISCOVERY_CONFIGURATION_ID) {
      DISCOVERY_CONFIGURATION_ID = process.env.DISCOVERY_CONFIGURATION_ID;
    }
    if (process.env.DISCOVERY_ENVIRONMENT_ID) {
      DISCOVERY_ENVIRONMENT_ID = process.env.DISCOVERY_ENVIRONMENT_ID;
    }

    const discovery = new DiscoveryV1({
      username: DISCOVERY_USERNAME,
      password: DISCOVERY_PASSWORD,
      version_date: '2017-09-01',
      url: 'https://gateway.watsonplatform.net/discovery/api/'
  //          https://gateway.watsonplatform.net/discovery/api/v1/environments/0de1f9a3-fbb9-46c8-8c95-25d7542b5494/collections/312ddfac-65e8-4ce8-aebc-82a4b9c8c98b/query?version=2018-08-01&deduplicate=false&highlight=true&passages=true&passages.count=5&natural_language_query=listed%20company%20is%20bse
    });

    discovery.query(
      {
        environment_id: DISCOVERY_ENVIRONMENT_ID,
        configuration_id: DISCOVERY_CONFIGURATION_ID,
        collection_id: DISCOVERY_COLLECTION_ID,
        natural_language_query:queryStr,
        //return: 'text, title, extracted_metadata, highlight',
        highlight: true //if you want to enable highlight
      },
      function(error, data) {
        console.log('discovery service callback .....');

        if (error) {
          console.log('Error:', error);
        } else {
          // console.log("Data::"+JSON.stringify(data));
          // console.log(JSON.stringify(data, null, 2));
          // Session for Graph DB
          callback(data);
        }
      }
    ); // Discover.query

    console.log('Called discovery.....');
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = syncservice;
  }
})();
