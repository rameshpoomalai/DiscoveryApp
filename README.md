
This application is an intelligent search application that uses Watson Discovery to search for information hidden inside documents.  The UI returns the results from Discovery app as well as returning a link to the actual (original) document in the original format (pdf/word/html).

Here are the steps to set it up:
1. Upload documents in WDS and Cloudant by running Upload_Docs_WDS.ipynb and Cloudant-Upload.ipynb
2. Modify .env to add your Cloudant and WDS credentials
3. npm install
4. npm start
