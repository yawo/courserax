/*
* Course links
*/
self.port.on("getLinks", function() {
  
  var hdS=".course-item-list-header h3";
  var csS=".course-item-list-section-list"
  var slS="li"
  var headers   = document.querySelectorAll(hdS);
  var sections  = document.querySelectorAll(csS);
  var links = [];
  for (i=0;i<sections.length;i++){

        var sec = new Object();
        sec['name']=headers[i].textContent ;
        sec['slinks']=[];
        lis = sections[i].querySelectorAll(slS);
        if(lis){
          map = Array.prototype.map;
          slinks = map.call(lis,function(el){
            return [
                el.querySelector("a.lecture-link").textContent ,
                el.querySelector("a.lecture-link").getAttribute('data-lecture-id'),
                el.querySelector(".course-lecture-item-resource a:last-child").getAttribute('href'), //mp4
                true,
                getHref(el.querySelector(".course-lecture-item-resource a[title='Subtitles (srt)']")), //srt
                getHref(el.querySelector(".course-lecture-item-resource a[href$='.pdf']")) //pdf
              ]
          });
          sec['slinks']=slinks;
        }
        //console.log("sec",sec.slinks.length);

        links.push(sec);
  }
  ////console.log("sections",sections.length,"links",links);
  if(links && links.length>0){
    modifyPage(links);
    self.port.emit("gotLinks", {"links":links,"window":null});
    ////console.log("course-links",element);
  }
});

function getHref(elmt){
  if(elmt) return elmt.getAttribute('href');
  else return null;
}

function modifyPage(links){
 
  //We know the coursera page is using bootstrap and jquery.
  var parent        = $(".coursera-page").parent();
  var main          = $(".coursera-page");
  var tabContent    = 
    '<div id="tabpanel" role="tabpanel">'+
      '<ul class="nav nav-tabs" role="tablist" style="padding-left: 40%;">'+
        '<li role="presentation" ><a aria-controls="mylectures" role="tab" href="#mylectures"   data-toggle="tooltip" title="Your downloads links are here" data-toggle="tab">Back to Lectures</a></li>'+
        '<li role="presentation" class="active"><a aria-controls="downloads" role="tab" href="#downloads" id="downloadTabLink" data-toggle="tooltip" title="Your downloads links are here"  data-toggle="tab">Your Downloads</a></li>'+
      '</ul>'+
      '<div class="tab-content">'+
         '<div  role="tabpanel" class="tab-pane" id="mylectures">'+main.html()+'</div>'+
         '<div  role="tabpanel" class="container tab-pane active " id="downloads">'+
            '<h2><input id="checkall"  type="checkbox"/> All Course Lectures</h2>'+
            '<div id="mp4links"></div>'+
          '</div>'+
      '</div>'+
    '</div>'
    ;
  main.remove();
  parent.html(parent.html()+tabContent);
  /*$('.nav .nav-tabs a').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
  });
  $('.nav .nav-tabs a:last').tab('show');*/
  $( "#tabpanel" ).tabs({
    active: 1
  });
  showLinks({links:links});
}

function updateObj(context_obj){
    var n=0;
     for(i=0;i<context_obj.links.length;i++){
        for(j=0;j< context_obj.links[i].slinks.length;j++){
            var chk = document.getElementById("checkbox_"+i+"_"+j);
            context_obj.links[i].slinks[j][3]=chk.checked;
            if(chk.checked===true){n++;
              $("#alertTD_"+i+"_"+j).html("<div style='margin: 0px;' class='alert alert-danger alert-dismissible fade in'> launched <button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>×</span></button></div>");
            }
        }
    }
    self.port.emit("selectedLinks",context_obj);
}

function showLinks(obj){
  vl  = document.getElementById("mp4links");
  var checkall = document.getElementById("checkall");
  //checkall.checked=true;
  checkall.onchange = function(e){
      var myNodeList = document.querySelectorAll(".link-checkbox");
      for (var i = 0; i < myNodeList.length; ++i) {
        myNodeList[i].checked = checkall.checked;
      }
  };
  if(obj && obj.links && obj.links.length>0){
       //context_obj = obj;
       //vl.innerHTML = "";
       var innerHTML = "<table class='table table-striped'>";
       for(i=0;i<obj.links.length;i++){
            var section = obj.links[i];
            innerHTML += "<tr><td colspan='2'><h4><br/> "+section.name+"</h4></td></tr>";
            for(j=0;j<section.slinks.length;j++){
                innerHTML += "<tr>";
                var link = section.slinks[j];
                var fname = (section.name+"--"+link[0]+".mp4").replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_');
                var chk = document.getElementById("checkbox_"+i+"_"+j);
                innerHTML += "<td><input type='checkbox' "+((chk && chk.checked===true)?" checked='true' ":"")+" class='link-checkbox' id='checkbox_"+i+"_"+j+"'/>"+link[0]+"</td>";
                var alertTD = document.getElementById("alertTD_"+i+"_"+j);
                innerHTML += "<td id='alertTD_"+i+"_"+j+"'>"+(chk?$(alertTD).html():"")+"</td>";
                innerHTML += "</tr>"
            }
        }
       innerHTML += "</table>"
       buttonsHTML ="<button class='sendselected btn btn-primary' value='Download video only' >Download </button> with <input type='checkbox' checked='true' id='subtitles'> <b> subtitles </b></input><input type='checkbox' checked='true' id='pdf'> <b> pdf </b></input><br/><br/>";
       innerHTML = buttonsHTML + innerHTML + buttonsHTML;
       $(vl).html(innerHTML);

       downloadHandler = (function(co){
          return function(){
              co.withSubtitles=document.getElementById('subtitles').checked;
              co.withPdf=document.getElementById('pdf').checked;
              updateObj(co);
          };
      })(obj);
       btns = document.getElementsByClassName("sendselected");
       btns[0].onclick = btns[1].onclick = downloadHandler;

  }else{
       vl.textContent="Oops ! No <b>Coursera course link</b> found.";
  }
}