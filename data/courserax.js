// courserax.js - mcguy's module
// author: mcguy

function updateObj(context_obj){
    var n=0;
     for(i=0;i<context_obj.links.length;i++){
        for(j=0;j< context_obj.links[i].slinks.length;j++){
            var chk = document.getElementById("checkbox_"+i+"_"+j);
            context_obj.links[i].slinks[j][3]=chk.checked;
            if(chk.checked===true)n++;
        }
    }
    //console.log("Emitting selectedLinks. n=",n);
    self.port.emit("selectedLinks",context_obj);
}


function init(){
    vl  = document.getElementById("mp4links");
    vl.innerHTML = "<input type='checkbox'> No link yet";
    var checkall = document.getElementById("checkall");
    checkall.checked=true;
    checkall.onchange = function(e){
        var myNodeList = document.querySelectorAll(".link-checkbox");
        for (var i = 0; i < myNodeList.length; ++i) {
          myNodeList[i].checked = checkall.checked;
        }
    };
    
}


window.onload=init;
//var context_obj;

self.port.on("progressinfo", function(pi){
    for(i=0;i<pi.length;i++){
        for(j=0;j<pi[i].length;j++){
          if( pi[i][j]>0){
            var progressBar = document.getElementById("progress_"+i+"_"+j);
            progressBar.value =  pi[i][j];
            progressBar.getElementsByTagName('span')[0].textContent =  pi[i][j];
          }
        }
    }

});


self.port.on("noLinks", function() {
       vl  = document.getElementById("mp4links");
       vl.textContent = "---";
       //console.log("noLinks...");
});

self.port.on("showLinks", function(obj) {
   vl  = document.getElementById("mp4links");
   if(obj && obj.links && obj.links.length>0){
       //context_obj = obj;
       //vl.innerHTML = "";
       var innerHTML = "<table border='0'>";
       for(i=0;i<obj.links.length;i++){
            var section = obj.links[i];
            innerHTML += "<tr><td colspan='2'><h4>"+section.name+"</h4></td></tr>";
            for(j=0;j<section.slinks.length;j++){
                innerHTML += "<tr>";
                var link = section.slinks[j];
                var fname = (section.name+"--"+link[0]+".mp4").replace(/[\|\<\>\"\'\:\?\/\*\\\n\t]/g,'_');
                innerHTML += "<td><input type='checkbox' checked='true' class='link-checkbox' id='checkbox_"+i+"_"+j+"'/>"+link[0]+"</td>";
                innerHTML += "<td><progress  max='100' id='progress_"+i+"_"+j+"'><span>0</span>%</progress></td>";
                innerHTML += "</tr>"
            }
        }
       innerHTML += "</table>"
       buttonsHTML ="<button class='sendselected' value='Download video only' >Download </button> with <input type='checkbox' checked='true' id='subtitles'>subtitles</input><input type='checkbox' checked='true' id='pdf'>pdf</input><br/>";
       innerHTML = buttonsHTML + innerHTML + buttonsHTML;
       vl.innerHTML= innerHTML;

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

   //console.log("shown links "+obj);

});
