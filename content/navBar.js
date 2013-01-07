var PAGE_LATEST_VERSION_LINK;
for( var i=PAGE_MILESTONES.milestones.length-1,e=0; i>=e; i-- ){
  var link = PAGE_MILESTONES.milestones[i].link;
  if( typeof link !== 'undefined' && link !== null && link.length > 0 ){
    PAGE_LATEST_VERSION_LINK = link;
    break;
  }
} 

var PAGE_NAVBAR = {
  links:[
    { name:"GoogleCode Repo", link:"http://code.google.com/p/cwtactics/" },
    { name:"GitHub Repo", link:"http://github.com/ctomni231/cwtactics" },
    { name:"Issues", link:"http://github.com/ctomni231/cwtactics/issues" },
    { name:"Twitter", link:"http://twitter.com/CustomWarsTacti" },
    { name:"Blog", link:"http://cwtactics.blogspot.de/" },
    { name:"<span class='playButton'>Play Cwt</span>", link:PAGE_LATEST_VERSION_LINK }
  ]
};