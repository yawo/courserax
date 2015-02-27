

exports.main = function() {

  // The main module of the mcguy Add-on.

  var { ActionButton } = require("sdk/ui/button/action");
  //var Widget  = require("sdk/widget").Widget;
  var tabs    = require('sdk/tabs');
  var self    = require("sdk/self");
  var data    = self.data;
  var Panel   = require("sdk/panel").Panel;
  var pageMod = require("sdk/page-mod");

  var { Class }     = require('sdk/core/heritage');
  var { Unknown }   = require('sdk/platform/xpcom');
  var { Cc, Ci,Cu } = require('chrome');
  var utils         = require('sdk/window/utils');
  var workers       = [];

  var worker;


  Cu.import("resource://gre/modules/FileUtils.jsm");


  var linksPanel =  Panel({
        width:700,
        height:800,
        position: {
              right: 0,
              bottom:0
        },
        focus: false,
        contentURL: data.url("mypanel.html"),
        contentScriptFile: data.url("courserax.js")
  });

  function showLinksTabs(){
    var videoLectureTabIndex  = tabs.activeTab.index;
    var videoLectureDocument  = tabs.activeTab.window.document;
    tabs.open({
      url       :  data.url("mypanel.html"),
      //isPinned  :  true,
      onReady: function(tab) {
        tab.attach({
          contentScriptFile: data.url("courserax.js"),
          contentScriptOptions: {
            videoLectureTabIndex: videoLectureTabIndex,
            videoLectureDocument: videoLectureDocument
          }
        });
        //tabs[videoLectureTabIndex].activate();
      }
    });
  }

  linksPanel.port.on("selectedLinks", function(obj) {
      if(obj && obj.links && obj.links.length>0){
        downloadLinks(obj);            //linksPanel.hide();
        linksPanel.show();
        //showLinksTabs();

      }
  });

  var widget =  ActionButton({
          id: "courserax-widget-1",
          label: "Courserax",
          icon: {
            "16": "./coursera-icon.png"
          },
          onClick: function(event) {
              linksPanel.show();
              //showLinksTabs();
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
      var ctx     = utils.getWindowLoadingContext(utils.getMostRecentBrowserWindow());
      var fld = getFolder();
      if(fld==null || fld==undefined) return;

      var pi = [];

      //Inner helper function persistLink
      function persistLink(section,i,j,linkSuffix,linkUrl){
        try{
              var targetFile = fld.clone();
              targetFile.append(i+"--"+section.name.replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_'));
              var fname = (i+"."+j+"--"+section.name+"--"+linkSuffix).replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_');
              console.log("Suggested name:",fname);
              targetFile.append(fname);
              targetFile.createUnique(targetFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
              var persist     = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Ci.nsIWebBrowserPersist );
              persist.persistFlags = persist.PERSIST_FLAGS_FROM_CACHE | persist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
              var uriToSave = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(linkUrl, null, null);
              pi[i][j]=0;
              persist.progressListener = {
                onProgressChange: (function(a,b){return function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
                  var percentComplete = Math.round((aCurTotalProgress / aMaxTotalProgress) * 100);
                  pi[a][b] = percentComplete,
                    linksPanel.port.emit("progressinfo",pi);
                }})(i,j),
                onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
                  // do something
                }
              };
              persist.saveURI(uriToSave, null, null, null, "", targetFile, ctx);
              //End inner function
        }catch(e){
          console.log("Cant get link "+linkUrl+ " . Exception is :  "+e.message);
        }

      }

      console.log("obj.links",obj.links.length);
      for(i=0;i<obj.links.length;i++){
          var section = obj.links[i];
          console.log("sec.links",section.slinks.length);
          pi[i]=[];
          for(j=0;j<section.slinks.length;j++){
              var link = section.slinks[j];
              if(link[3]===true){
                var link = section.slinks[j];
                console.log("link",link[0]);
                persistLink(section,i,j,link[0]+".mp4",link[2]);
                if(obj.withSubtitles){
                  persistLink(section,i,j,link[0]+".srt",link[4]);
                }
                if(obj.withPdf && link[5]){
                  persistLink(section,i,j,link[0]+".pdf",link[5]);
                }
              }
          }
      }
  }


var lastTab = null;
  function doWorker(){
    if(lastTab ==  tabs.activeTab.url){
      return;
    }
    lastTab =  tabs.activeTab.url;
      console.log("New worker");
      for(var i=0;i<workers.length;i++){
          workers[i].destroy();
          workers[i].port.on('detach',function(){
              workers[i]=null;
          });
      }
      worker = tabs.activeTab.attach({
        contentScriptFile: self.data.url("course-links.js")
      });
      worker.port.on("gotLinks", function(obj) {
        console.log("Links found "+obj);
        linksPanel.port.emit("showLinks",obj);
      });
      worker.port.on("noLinks", function() {
        console.log("No Links found ");
        linksPanel.port.emit("showLinks",null);
      });
      workers.push(worker);
      worker.port.emit("getLinks");
  }

};
