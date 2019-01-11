// index.js

var REST_DATA = 'api/search';
var REST_GET_DOCUMENT = 'api/getDocument';
var KEY_ENTER = 13;
var defaultItems = [

];

function encodeUriAndQuotes(untrustedStr) {
    return encodeURI(String(untrustedStr)).replace(/'/g, '%27').replace(')', '%29');
}
function reset()
{
  document.getElementById('searchFilter').value = "";
  var table = document.getElementById('notes');
  while(table.rows.length > 0) {
    table.deleteRow(0);
  }
}
function loadItems() {
    var table = document.getElementById('notes');
    while(table.rows.length > 0) {
      table.deleteRow(0);
    }
    showLoadingMessage();
    var topic = document.getElementById('searchFilter').value;

    xhrGet(REST_DATA+"?topic="+topic, function(data) {

        // var newRow = document.createElement('tr');
        // newRow.innerHTML="<td width=20%><div class='contentHeader'><h3>Results:</h3></div></td><td width=80%><div class='contentHeader'></div></td>";
        // newRow.className = "tableRows";
        // document.getElementById('notes').lastChild.appendChild(newRow);
        stopLoadingMessage();

        var receivedItems = data || [];
        var items = [];
        var passages = [];
        var i;
        var altColumn = false;
        var newRow = document.createElement('tr');
        newRow.innerHTML="<td width=20%><div class='contentHeader'>Doc Name</div></td><td width=80%><div class='contentHeader'>Results</div></td>";
        newRow.className = "alttableRows";
        document.getElementById('notes').lastChild.appendChild(newRow);
        var predocname="";
        for (i = 0; i < receivedItems.length; ++i) {

            var item = receivedItems[i].resulttext
            var docname = receivedItems[i].filename;
            var doctype = receivedItems[i].type;
            if(docname != predocname)
            {
                altColumn = !altColumn;
                predocname = docname;
            }
            else {
              docname = "";
            }

            var lineItem = {"docname":docname, "doctype":doctype,"highlight":item,"altColumn":altColumn,"passage":false};
            items.push(lineItem);

        }


        var hasItems = items.length;
        if (!hasItems) {
            items = defaultItems;
        }
        var pre_docname = ""
        var dontPrint = false;
        for (i = 0; i < items.length; ++i) {

           addItem(items[i], !hasItems);
        }
        if (!hasItems) {
            var table = document.getElementById('notes');
            var nodes = [];
            for (i = 0; i < table.rows.length; ++i) {
                nodes.push(table.rows[i].firstChild.firstChild);
            }
        }
    }, function(err) {
        console.error(err);
    });
}

function startProgressIndicator(row) {
    row.innerHTML = "<td class='content'>Uploading file... <img height=\"50\" width=\"50\" src=\"images/loading.gif\"></img></td>";
}

function removeProgressIndicator(row) {
    row.innerHTML = "<td class='content'>uploaded...</td>";
}

function addNewRow(table) {
    var newRow = document.createElement('tr');
    table.appendChild(newRow);
    return table.lastChild;
}


function setRowContent(item, row) {

    var innerHTML = "<td><div class='contentTiles'>";
    if (item.docname!="")
    {
      if(item.passage==true)
      {
        innerHTML = innerHTML+"<a href=\"/api/getDocument?fileName=" + encodeURI(item.docname) +
        "&fileType=getPassageDocument\" target=\"_blank\">Get Document</a></div></td>" ;
      }
      else {
        innerHTML = innerHTML+"<a href=\"/api/getDocument?fileName=" + encodeURI(item.docname) +
        "&fileType="+item.doctype+"\" target=\"_blank\">"+ item.docname +"</a></div></td>" ;
      }

    }

    //var innerHTML = "<td><div class='contentTiles'>"+ item.text + "</a></div></td>";
      var displayText = item.highlight.replace(/\<em\>/gi, '<em><b>');
      displayText = displayText.replace(/\<\/em\>/gi, '</b></em>');

      if (displayText[0]=="\"")
      {
        displayText=displayText.substr(1);
      }
      if (displayText[0]==">")
      {
        displayText=displayText.substr(1);
      }
    // displayText = displayText.replace(/\<p\>/gi, '');
    // displayText = displayText.replace(/\<h1\>/gi, '');
    // displayText = displayText.replace(/\<\/h1\>/gi, '');
    // displayText = displayText.replace(/\<h2\>/gi, '');
    // displayText = displayText.replace(/\<\/h2\>/gi, '');
    // displayText = displayText.replace(/\<h3\>/gi, '');
    // displayText = displayText.replace(/\<\/h3\>/gi, '');
    //
    // displayText = displayText.replace(/\<h4\>/gi, '');
    // displayText = displayText.replace(/\<\/h4\>/gi, '');
    //
    // displayText = displayText.replace(/\<h5\>/gi, '');
    // displayText = displayText.replace(/\<\/h5\>/gi, '');
    //
    // displayText = displayText.replace(/\<p dir\=\"ltr\"\>/gi, '');
    // displayText = displayText.replace(/\<h1 dir\=\"ltr\"\>/gi, '');
    //
    // displayText = displayText.replace(/\<h2 dir\=\"ltr\"\>/gi, '');
    // displayText = displayText.replace(/\<h3 dir\=\"ltr\"\>/gi, '');
    // displayText = displayText.replace(/\<h4 dir\=\"ltr\"\>/gi, '');
    // displayText = displayText.trim();



    innerHTML = innerHTML + "<td><div>"+displayText+"</div></td>";
    row.innerHTML = innerHTML;

}

function addItem(item, isNew) {

    var row = document.createElement('tr');

    if(item.altColumn)
    {
      row.className = "tableRows";
    }
    else {
      row.className = "alttableRows";
    }


    var id = item && item.id;
    if (id) {
        row.setAttribute('data-id', id);
    }



    if (item) // if not a new row
    {
        setRowContent(item, row);
    }

    var table = document.getElementById('notes');
    table.lastChild.appendChild(row);
    row.isNew = !item || isNew;

    if (row.isNew) {
        var textarea = row.firstChild.firstChild;
        textarea.focus();
    }

}


function saveChange(contentNode, callback) {

}



function showLoadingMessage() {
    document.getElementById('loadingImage').style.display = '';
    document.getElementById('loadingImage').innerHTML = "Loading data " + "<img height=\"100\" width=\"100\" src=\"images/loading.gif\"></img>";
}

function stopLoadingMessage() {
    document.getElementById('loadingImage').innerHTML = "";
}

var input = document.getElementById("searchFilter");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function(event) {
  // Cancel the default action, if needed
  event.preventDefault();
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Trigger the button element with a click
    document.getElementById("btnSearch").click();
  }
});


function showDetails(detailsId)
{
  document.getElementById('myModal').style.display = "block";
  document.getElementById("detailContent").innerHTML = document.getElementById(detailsId).innerHTML
}

// When the user clicks on <span> (x), close the modal
function closeModelDialog() {
    document.getElementById('myModal').style.display = "none";
    document.getElementById("detailContent").innerHTML = "";
}
