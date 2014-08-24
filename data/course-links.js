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
                el.querySelector(".course-lecture-item-resource a[title='Subtitles (srt)']").getAttribute('href')] //srt
          });
          sec['slinks']=slinks;
        }
        console.log("sec",sec.slinks.length);

        links.push(sec);
  }
  //console.log("sections",sections.length,"links",links);
  if(links && links.length>0){
    self.port.emit("gotLinks", {"links":links,"window":null});
    //console.log("course-links",element);
  }
});

