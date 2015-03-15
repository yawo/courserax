

exports.main = function() {

  // The main module of the mcguy Add-on.

  var { ActionButton }  = require("sdk/ui/button/action");
  //var Widget  = require("sdk/widget").Widget;
  var tabs              = require('sdk/tabs');
  var self              = require("sdk/self");
  var data              = self.data;
  var Panel             = require("sdk/panel").Panel;
  var pageMod           = require("sdk/page-mod");
    
  var { Class }         = require('sdk/core/heritage');
  var { Unknown }       = require('sdk/platform/xpcom');
  var { Cc, Ci,Cu }     = require('chrome');
  var utils             = require('sdk/window/utils');
  var workers           = [];
  var prefs             = require("sdk/preferences/service");
  var worker;    
  var downloadList      = [];

  Cu.import("resource://gre/modules/FileUtils.jsm");
  Cu.import("resource://gre/modules/Downloads.jsm");
  Cu.import("resource://gre/modules/osfile.jsm")
  prefs.set("extensions.sdk.console.logLevel","info");
  //contentStyleFile: [data.url("jquery.ui.css")]
  pageMod.PageMod({
    include: "*.coursera.org",
    contentScriptFile: [data.url("jquery.min.js"),data.url("jquery.ui.min.js")],
    contentStyleFile: [data.url("jquery.ui.css")]
  });

  Downloads.getList(Downloads.ALL).then(function(list){downloadList = list;});

  var widget =  ActionButton({
          id: "courserax-widget-1",
          label: "Courserax",
          icon: {
            "16": "./coursera-icon.png"
          },
          onClick: function(event) {
              doWorker();
          }
      });

  function getFolder(){
      var win     = utils.getMostRecentBrowserWindow();
      var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
      fp.init(win, "Select Destination Folder", Ci.nsIFilePicker.modeGetFolder);
      fp.appendFilters(Ci.nsIFilePicker.filterAll | Ci.nsIFilePicker.filterText);
      var rv = fp.show();
      if (rv == Ci.nsIFilePicker.returnOK || rv == Ci.nsIFilePicker.returnReplace) {
        var file = fp.file;
        // Get the path as string. Note that you usually won't
        // need to work with the string paths.
        var path = fp.file.path;
        // work with returned nsILocalFile...
        return file;
      }
  }



  function downloadLinks(obj){
      var ctx = utils.getWindowLoadingContext(utils.getMostRecentBrowserWindow());
      var fld = getFolder();
      if(fld==null || fld==undefined) return;

      var pi = [];
      //Inner helper function persistLink
      function persistLink(section,i,j,linkSuffix,linkUrl){
        try{
              var targetFile = fld.clone();
              targetFile.append(i+"--"+section.name.replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_'));
              var fname = (i+"."+j+"--"+section.name+"--"+linkSuffix).replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_');
              //console.log("Suggested name:",fname);
              targetFile.append(fname);
              targetFile.createUnique(targetFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
              Downloads.createDownload({
                source: linkUrl,
                target: targetFile
              }).then(function(download){
                downloadList.add(download);
                download.start().then(null, function(err){console.error(err);downloadList.remove(download);download.finalize(true);Cu.reportError(err)});  
              },function(err){
                console.error(err);
              });
              
        }catch(e){
          console.error("Cant get link "+linkUrl+ " . Exception is :  "+e.message);
        }

      }
      //End inner function

      //console.log("obj.links",obj.links.length);
      for(i=0;i<obj.links.length;i++){
          var section = obj.links[i];
          //console.log("sec.links",section.slinks.length);
          pi[i]=[];
          for(j=0;j<section.slinks.length;j++){
              var link = section.slinks[j];
              if(link[3]===true){
                var link = section.slinks[j];
                //console.log("link",link[0]);
                persistLink(section,i,j,link[0]+".mp4",link[2]);
                if(obj.withSubtitles){
                  if(link[4]){
                    persistLink(section,i,j,link[0]+".srt",link[4]);
                  }
                  if(link[9]){
                    persistLink(section,i,j,link[0]+".txt",link[9]);
                  }
                }
                if(obj.withPdf){
                  if(link[5]){
                    persistLink(section,i,j,link[0]+".pdf",link[5]);
                  }
                  if(link[6]){
                    persistLink(section,i,j,link[0]+".pdf",link[6]);
                  }
                  if(link[7]){
                    persistLink(section,i,j,link[0]+".pdf",link[7]);
                  }
                  if(link[8]){
                    persistLink(section,i,j,link[0]+".pdf",link[8]);
                  }
                }
                if(obj.withPptx){
                  if(link[10]){
                    persistLink(section,i,j,link[0]+".pdf",link[10]);
                  }
                }
              }
          }
      }
  }


  function doWorker(downloadList){
      //console.log("New worker");
      for(var i=0;i<workers.length;i++){
          workers[i].destroy();
          workers[i].port.on('detach',function(){
              workers[i]=null;
          });
      }
      worker = tabs.activeTab.attach({
        contentScriptFile: [data.url("jquery.min.js"),data.url("jquery.ui.min.js"),data.url("course-links.js")]
      });
      worker.port.on("selectedLinks", function(obj) {
        if(obj && obj.links && obj.links.length>0){
          downloadLinks(obj); 
        }
      });

      workers.push(worker);
      worker.port.emit("getLinks");
  }

};
