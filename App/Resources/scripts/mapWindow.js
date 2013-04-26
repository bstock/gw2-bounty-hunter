
var MapWindow = function() {
  var o = {};

  o._transparent = true;

  o.toggleTransparency = function() {
    Ti.UI.getCurrentWindow().setTransparency(( this._transparent ? 1 : 0.7 ));
    this._transparent = !this._transparent;
  };
  
  o.showMap = function(bid, bounty) {
    Ti.UI.getCurrentWindow().setTitle(bounty.map + "  (" + bounty.name + ")");
    var imgSrc = "imgs/maps/" + bid + ".jpg";
    $("#imageContainer").html('<img src="' + imgSrc + '" />');
  };
  
  return o;
}();

$(document).ready(
  function() {
    var contextMenu = Ti.UI.createMenu();
    contextMenu.addItem("Close", function() { Ti.UI.getCurrentWindow().hide(); });
    contextMenu.addItem("Toggle transparency", function() { MapWindow.toggleTransparency(); });
    Ti.UI.getCurrentWindow().setContextMenu(contextMenu);
  });
