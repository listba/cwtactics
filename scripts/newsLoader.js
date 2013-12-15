PAGE_PROG.registerSection({
  
  id: "news",
  element: "sectionNews",
  
  dataLoader: function( section, cb, after ){

    function render(){  
      cb( section, JSON.parse( localStorage.dataNews ) );

      // CONVERT RSS DATES TO HUMAN READABLE TIME
      $(".newsDate").each(function(i,element){
        element.innerHTML = moment( 
        element.innerHTML, "YYYY-MM-DD HH:mm:ss.SSS-Z,ZZ").fromNow();
      });
    }
    
    // UP TO DATE DATA IN STORAGE ?  
    if( localStorage.endDateNews === undefined || 
        moment().isAfter(localStorage.endDateNews) ){
            
      var url = "https://www.googleapis.com/blogger/v3/blogs/8771777547738195480/posts?"+
                "fetchBodies=false&fetchImages=false&maxResults=10&"+
                "key=AIzaSyBeLzkUGTUFQ0z5yEGeuF4c0d0i5Vhgc1Y";

      $.getJSON( url, function( respone ){
          
          var data = {
            news:[]
          };

          var items = respone.items;
          for( var i=0,e=items.length; i<e; i++ ){
            var item = items[i];
            data.news.push({
              title: item.title,
              date : item.published
            });
          }
          
          // SAVE DATA AS CACHE FOR THE NEXT HOUR
          localStorage.dataNews    = JSON.stringify( data );
          localStorage.endDateNews = moment().add('m', 360);
          
          // RENDER IT 
          render();
        }
      );
    }
    else render();
  },

  template: [
    "<h1>Recent News</h1>",
    "{{#news}}",
      "<div class=\"newsDate\">",
        "{{date}}",
      "</div >",
      "<div class=\"newsTitle pure-u-3-4\" >",
        "{{title}}",
      "</div>",
    "{{/news}}"
  ].join(""),
  
  partials:{}
});