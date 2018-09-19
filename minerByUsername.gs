//this is just part of the code. 
//full build is under development

var ss = SpreadsheetApp.openById("YOUR_SheetID_g03s_here");
var s1 = ss.getSheetByName("Sheet1");

//the github ids you want to scrape go here. 
var githubIdArray = ["alintz","andrebradshaw"]; 
//Github will throw a 429 code ("kindly stop spamming us") if you pass more than 25 at a time. I need to think through a scalable solution for this. 

function grp(elm,n){if(elm != null){return elm[n];}else{return '';}} //regex utility

function miner(){
  var output = getHTML();
  var lr = s1.getLastRow();
  s1.getRange((lr+1),1,output.length,output[0].length).setValues(output)
}

function getHTML() {
  var callUrls = githubIdArray.map(function(id){
    return "https://github.com/"+id+"?from=2018-09-01&to=2018-09-19";
  });
  var respArr = UrlFetchApp.fetchAll(callUrls);
  var output = [];
  for(r=0; r<respArr.length; r++){
    var resp = respArr[r].toString().replace(/\n|\r/g, '');
    var fullname = grp(/p-name vcard-fullname d-block overflow-hidden" itemprop="name">(.+?)</.exec(resp),1);
    
    var pinnedRepos = getPinnedRepos(resp); //returns an array of paths to pinned repos
    var commitsCalendar = getCommitsData(resp); //returns a JSON string with number of commits by date for the calendar year
  
    var followerCount = grp(/followers.+?Counter">\s+(\S+)/.exec(resp),1);
    var location = grp(/<span class="p-label">(.+?)</.exec(resp),1);
    var joinDate = grp(/(\d+-\d+-\d+)#contribution-joined-github/.exec(resp),1);
    
    var out = new Array(githubIdArray[r],fullname,location,joinDate,followerCount,pinnedRepos,commitsCalendar);
    output.push(out);
  }
  return output;
}


function getPinnedRepos(html){
  var regXp = 'li class="pinned-repo-item.+?<a href="(.+?)".+?<\\/li';
  var regXpinned_g = new RegExp(regXp, "g");
  var regXpinned = new RegExp(regXp);
  var pinnedList = html.match(regXpinned_g);
  var pinnedArr = [];
  for(m=0; m<pinnedList.length; m++){
    var isFork = /Forked from/.test(pinnedList[m]);
    if(isFork === false){
      pinnedArr.push('"'+regXpinned.exec(pinnedList[m])[1]+'"')
    }
  }
  return '['+pinnedArr.toString()+']';
}


function getCommitsData(html){
  var regXc = 'data-count="(\\d+)" data-date="(\\d+-\\d+-\\d+)';
  var regXcells_g = new RegExp(regXc, "g");
  var regXcells = new RegExp(regXc);
  var commitCells = html.match(regXcells_g);
  var commitsArr = [];
  for(m=0; m<commitCells.length; m++){
    var numCommit = regXcells.exec(commitCells[m])[1];
    var date = new Date(regXcells.exec(commitCells[m])[2]).getTime();
    commitsArr.push('{"num":'+numCommit+',"date":'+date+'}');
  }
  return '['+commitsArr.toString()+']';
}


