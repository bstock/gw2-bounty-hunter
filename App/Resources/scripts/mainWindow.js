
var Bounties = function() {
  var o = {};

  o.states = {
    SEARCHING:"Searching",
    FOUND:"Found",
    BOUNTY:"Bounty",
    KILLED:"Killed",
    FAILED:"Failed" };

  o._bounties = {
    mul2: { name:"2-MULT", map:"Timberline Falls" },
    anww: { name:"Ander 'Wildman' Westward", map:"Southsun Cove" },
    bima: { name:"Big Mayana", map:"Sparkfly Fen" },
    bobw: { name:"Bookworm Bwikki", map:"Lornar's Pass" },
    brek: { name:"Brekkabek", map:"Harathi Hinterlands" },
    crmi: { name:"Crusader Michiele", map:"Sparkfly Fen" },
    debr: { name:"'Deputy' Brooke", map:"Snowden Drifts" },
    dete: { name:"Devious Teesa", map:"Frostgorge Sound" },
    dita: { name:"Diplomat Tarban", map:"Brisban Wildlands" },
    habk: { name:"Half-Baked Komali", map:"Mount Maelstrom" },
    poob: { name:"Poobadoo", map:"Kessex Hills" },
    pr14: { name:"Prisoner 1141", map:"Iron Marshes" },
    shar: { name:"Shaman Arderus", map:"Fireheart Rise" },
    shff: { name:"Short-Fuse Felix", map:"Diessa Plateau" },
    sosc: { name:"Sotzz the Scallywag", map:"Gendarran Fields" },
    trtr: { name:"Tricksy Trekksa", map:"Blazeridge Steppes" },
    trmi: { name:"Trillia Midwell", map:"Fields of Ruin" },
    yarw: { name:"Yanonka the Rat-Wrangler", map:"Fields of Ruin" }};

  var i = 0;
  for (var b in o._bounties) {
    i += 1;
    o._bounties[b]['found'] = false;
    o._bounties[b]['state'] = o.states.SEARCHING;
  }
  o.totalBounties = i;

  o.getBounties = function() {
    return this._bounties;
  };

  o.getBounty = function(id) {
    return (id in this._bounties ? this._bounties[id] : null);
  };

  o.getTotalFound = function() {
    var f = 0;
    for (var b in this._bounties) {
      if (this._bounties[b].found) f++;
    }
    return f;
  };
  
  return o;
}();

var MainWindow = function() {

  var o = {};

  var mapWindow = null;

  o.showPathingMap = function(bid) {

    var bounty = Bounties.getBounty(bid);

    // Create map window if not already present.
    if (mapWindow === null) {
      var width = 300, height = 300;
      var x = (window.screen.width - width) / 2;
      var y = (window.screen.height - height) / 2;
      
      mapWindow = Ti.UI.createWindow({
        id: "MapWindow",
        url: "app://mapWindow.html",
        title: "Pathing Map",
        transparency: 0.7,
        transparentBackground: false,
        x: x,
        y: y,
        width: width,
        minWidth: 100,
        maxWidth: 1000,
        height: height,
        minHeight: 100,
        maxHeight: 1000,
        maximizable: false,
        minimizable: false,
        closeable: true,
        resizable: true,
        fullscreen: false,
        maximized: false,
        minimized: false,
        usingChrome: true,
        topMost: true
      });
      
      mapWindow.open();
      
      // Add event listener to catch the close event, and hide the window instead.
      mapWindow.addEventListener(mapWindow.CLOSE, function(e) {
        e.preventDefault();
        mapWindow.hide();
      });
      
      // Defer showMap call until DOM ready.
      mapWindow.addEventListener(mapWindow.PAGE_LOADED, function() {
        mapWindow.getDOMWindow().MapWindow.showMap(bid, bounty);
      });
    }
    
    // Otherwise if hidden, show the map window and make showMap call immidiately.
    else {
      if (!mapWindow.isVisible()) {
        mapWindow.show();
      }
      mapWindow.getDOMWindow().MapWindow.showMap(bid, bounty);
    }
  };

  o.collapseContent = function() {
    $("#collapseBtn").css("background-position", "-96px -192px");
    $("#contentContainer").slideUp("slow", function() {
      $("#collapseBtn").off("click");
      $("#collapseBtn").on("click", function() { MainWindow.uncollapseContent(); });
      Ti.UI.getCurrentWindow().setHeight(65);
    });
  };

  o.uncollapseContent = function() {
    Ti.UI.getCurrentWindow().setHeight(655);
    $("#collapseBtn").css("background-position", "-64px -192px");
    $("#contentContainer").slideDown("slow", function() {
      $("#collapseBtn").off("click");
      $("#collapseBtn").on("click", function() { MainWindow.collapseContent(); });
    });
  };

  o.setRowSelection = function(rowId, isSelected) {
    if (isSelected) {
      $("#" + rowId).addClass("selected");
    } else {
      $("#" + rowId).removeClass("selected");
    }
  };

  o.showOnlySelectedRows = function() {
    $(".bountyRow:has(.bountySelect:checked)").slideDown();
    $(".bountyRow:not(:has(.bountySelect:checked))").slideUp();
    $(".bountySelect").css("opacity", "0.7");
    $(".bountySelect").attr("disabled", "disabled");
  };

  o.showOnlyBountyRows = function() {
    $(".bountyRow.isBounty, .bountyRow.isKilled, .bountyRow.isFailed").slideDown();
    $(".bountyRow.isSearching, .bountyRow.isFound").slideUp();
    $(".bountySelect").css("opacity", "0.5");
    $(".bountySelect").attr("disabled", "disabled");
  };

  o.showAllRows = function() {
    $(".bountyRow").slideDown();
    $(".bountySelect").css("opacity", "1.0");
    $(".bountySelect").removeAttr("disabled");
  };

  var bountyWindowInMins = 15; // Length of bounty in minutes.
  var bountyTimerVar = "";
  var bountyTimerCounter = 0;

  o.setupBountyTimerBtn = function() {
    $("#startTimerBtn").click(function() {
      $("#startTimerBtn").text("Cancel");
      $("#startTimerBtn").off("click");
      $("#startTimerBtn").click(function() { MainWindow.resetBountyTimer(); });
      MainWindow.startBountyTimer(false);
    });
  };

  o.resetBountyTimer = function() {
    clearInterval(bountyTimerVar);
    bountyTimerCounter = 0;
    $("#startTimerBtn").text("Start Bounty");
    $("#timerTxt").text("");
    $("#timerProgressFill").css("width", 0);
    this.setupBountyTimerBtn();
  };

  o.startBountyTimer = function(isLastMin) {
    clearInterval(bountyTimerVar);
    bountyTimerCounter = 0;

    var increment = (100 / bountyWindowInMins) / ( isLastMin ? 60 : 6 );
    if (isLastMin) {
      // Maybe set timer text to red here?
      var switchOverWidth = (100 / bountyWindowInMins) * (bountyWindowInMins - 1);
      bountyTimerVar = setInterval(
        function() { MainWindow.handleBountyTimer1sCall(increment, switchOverWidth); }, 
        1000);
    } else {
      $("#timerTxt").text(bountyWindowInMins + "m");
      var switchOver = (bountyWindowInMins - 1) * 6;
      bountyTimerVar = setInterval(
        function() { MainWindow.handleBountyTimer10sCall(increment, switchOver); },
        10000);
    }
  };

  o.handleBountyTimer10sCall = function(increment, switchOver) {
    bountyTimerCounter += 1;
    $("#timerProgressFill").css("width", (bountyTimerCounter * increment) + "%");
    if (bountyTimerCounter == switchOver) {
      this.startBountyTimer(true);
    } else if (bountyTimerCounter % 6 === 0) {
      $("#timerTxt").text((bountyWindowInMins - (bountyTimerCounter / 6)) + "m");
    }
  };

  o.handleBountyTimer1sCall = function(increment, switchOverWidth) {
    bountyTimerCounter += 1;
    $("#timerProgressFill").css("width", switchOverWidth + (bountyTimerCounter * increment) + "%");
    $("#timerTxt").text((60 - bountyTimerCounter) + "s");
    if (bountyTimerCounter == 60) {
      clearInterval(bountyTimerVar);
      $("#timerProgressFill").css("width", "100%");
      $("#startTimerBtn").text("Reset");
      // do something to alert that timer has run out ..?
    }
  };

  o.onBountyStateChange = function(id, newState) {
    var bounty = Bounties.getBounty(id);
    var oldState = bounty.state;

    // Exit if no actual change.
    if (newState == oldState) return;

    var ft = $("#foundTotal");
    if (newState == Bounties.states.FOUND && !bounty.found) {
      bounty.found = true;
      ft.text(parseInt(ft.text(), 10) + 1);
    } else if (newState == Bounties.states.SEARCHING && bounty.found) {
      bounty.found = false;
      ft.text(parseInt(ft.text(), 10) - 1);
    }
    
    var kt = $("#killedTotal");
    if (newState == Bounties.states.KILLED) {
      kt.text(parseInt(kt.text(), 10) + 1);
    } else if (oldState == Bounties.states.KILLED) {
      kt.text(parseInt(kt.text(), 10) - 1);
    }

    bounty.state = newState;
    $("#"+id).attr("class", "bountyRow is" + newState);
    $("#"+id+"-state .stateTxt").text(newState);
  };

  var aboutWindow = null;

  o.openAboutWindow = function() {
    if (aboutWindow === null) {
      var width = 300, height = 330;
      var x = (window.screen.width - width) / 2;
      var y = (window.screen.height - height) / 2; 
      aboutWindow = Ti.UI.createWindow({
        id: "AboutWindow",
        url: "app://aboutWindow.html",
        title: "About",
        x: x,
        y: y,
        width: width,
        height: height,
        resizable: false,
        maximizable: false,
        minimizable: false,
        closeable: true,
        usingChrome: true,
        topMost: true
      });
      aboutWindow.open();

      aboutWindow.addEventListener(aboutWindow.CLOSE, function(e) {
        e.preventDefault();
        aboutWindow.hide();
      });
    }
    
    else if (!aboutWindow.isVisible()) {
      aboutWindow.show();
    }
  };

  return o;
}();

  
$(document).ready(function() {
  
  if (typeof(Ti) != "undefined") {
    var win = Ti.UI.getMainWindow();
    //  Commented out for the moment as for whatever reason when transpararent-background = true, attempting to
    //  use a context menu consistently crashes the app. Added a button to open about window instead.
    //var contextMenu = Ti.UI.createMenu();
    //contextMenu.addItem("About", function() { MainWindow.openAboutWindow(); });
    //win.setContextMenu(contextMenu);
    win.setTopMost(true);
  }
  $("#bountyTotal").text(Bounties.totalBounties);
  MainWindow.setupBountyTimerBtn();

  //
  // Create a row for each bounty.
  //
  function appendBountyRow(container, bid) {
    var s = Bounties.states;
    container.append(
      b.DIV({ id:bid, 'class':'bountyRow isSearching' }, [
        b.INPUT({ id:bid+'-select', type:'checkbox', 'class':'bountySelect' }),
        b.DIV({ id:bid+'-name', 'class':'bountyName textShadow', click:function() { MainWindow.showPathingMap(bid); } },
              [ Bounties.getBounty(bid).name ]),
        b.UL({ 'class':'bountyState' }, [
          b.LI({ id:bid+'-state', 'class':'bountyStateInner' }, [
            b.SPAN({ 'class':'stateTxt' }, [ s.SEARCHING ]),
            b.SPAN({ 'class':'menuIcon' }),
            b.DIV({ 'class':'stateMenuContainer' }, [
              b.DIV({ 'class':'stateMenu' }, [
                b.DIV({ 'class':'menuTriangle' }),
                b.UL([
                  b.LI({ click:function() { MainWindow.onBountyStateChange(bid, s.SEARCHING); }}, [ s.SEARCHING ]),
                  b.LI({ click:function() { MainWindow.onBountyStateChange(bid, s.FOUND); }}, [ s.FOUND ]),
                  b.LI({ click:function() { MainWindow.onBountyStateChange(bid, s.BOUNTY); }}, [ s.BOUNTY ]),
                  b.LI({ click:function() { MainWindow.onBountyStateChange(bid, s.KILLED); }}, [ s.KILLED ]),
                  b.LI({ click:function() { MainWindow.onBountyStateChange(bid, s.FAILED); }}, [ s.FAILED ])
                ])
              ])
            ])
          ])
        ])
      ]));
  }
  
  var b = App.util.domBuilder;
  var container = $("#mainSection");
  var i = 0;

  for (var bid in Bounties.getBounties()) {
    appendBountyRow(container, bid);
    $("#"+bid+"-select").click((function(bid) {
      return function() { MainWindow.setRowSelection(bid, this.checked); }; })(bid));
    if (i < Bounties.totalBounties - 1) {
      $('#'+bid).append( b.HR({ 'class':'divider' }) );
    }
    i += 1;
  }

  //
  // Set up drag + drop
  //
  var isDragging = false;
  var dragPoint = { x:0, y:0 };
  
  $("#topBar").mousedown(
    function(event) {
      isDragging = true;
      dragPoint.x = event.pageX;
      dragPoint.y = event.pageY;
      event.preventDefault();
    });
  
  $("#topBar").mouseup( function(event) {
    isDragging = false;
  });
  
  $("#topBar").mousemove( function(event) {
    if (isDragging) {
      window.moveTo(event.screenX - dragPoint.x, event.screenY - dragPoint.y);
    }
  });

  //
  // Bind functions to various UI buttons.
  //
  $("#aboutBtn").click( function() {
    MainWindow.openAboutWindow();
  });
  $("#collapseBtn").click( function() {
    MainWindow.collapseContent();
  });
  $("#closeBtn").click( function() {
    Ti.App.exit();
  });
  
  $("#showAll").click(MainWindow.showAllRows);
  $("#showSelected").click(MainWindow.showOnlySelectedRows);
  $("#showBounties").click(MainWindow.showOnlyBountyRows);
  
});
