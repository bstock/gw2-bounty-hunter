
var App = {};

/* ######################################################################
 * # Core functions
 * ######################################################################
 */
App.requireNs = function (ns) {
  var target = this;
  var parts = ns.split('.');
  for (var i = 0; i < parts.length; i++) {
    if (!target[parts[i]]) {
      target[parts[i]] = {};
    }
    target = target[parts[i]];
  }
};

App.log = function(msg) {
  if (App.env.debug) {
    if (window.console && window.console.log) {
      console.log('APP> ' + msg);
    } else {
      alert('APP: ' + msg);
    }
  }
};


/* ######################################################################
 * # Environment stuff
 * ######################################################################
 */
App.requireNs('env');
App.env.debug = false;


/* ######################################################################
 * # Utilities / tools
 * ######################################################################
 */
App.requireNs('util');

App.util.isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

App.util.prototypeFrom = function(prototypeObject) {
  var blankSlate = function(){};
  blankSlate.prototype = prototypeObject;
  return new blankSlate();
};

App.requireNs('util.domBuilder');
(function() {
  var tags = ['a', 'abbr', 'acronym', 'address', 'area', 'b', 'base', 'bdo',
              'big', 'blockquote', 'body', 'br', 'button', 'caption', 'cite',
              'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'div', 'dl',
              'dt', 'em', 'fieldset', 'form', 'h1', 'h2', 'h3', 'h4', 'h5',
              'h6', 'head', 'html', 'hr', 'i', 'img', 'input', 'ins', 'kbd',
              'label', 'legend', 'li', 'link', 'map', 'meta', 'noscript',
              'object', 'ol', 'optgroup', 'option', 'p', 'param', 'pre', 'q',
              'samp', 'script', 'select', 'small', 'span', 'strong', 'style',
              'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
              'thead', 'title', 'tr', 'tt', 'ul', 'var'];

  function createBuilder(tagName) {
    return function() {
      return createNode(tagName, $.makeArray(arguments));
    };
  }

  function createNode(tagName, args) {
    var i, k, ele = $(document.createElement(tagName));
    var arg0 = args[0], arg1 = args[1];
    try {
      if (args.length > 0) {        
        if (App.util.isArray(arg0)) {
          appendContent(ele, arg0);
        } else if (typeof(arg0) == 'object') {
          applyAttrs(ele, arg0);
          if (args.length > 1) {
            if (App.util.isArray(arg1)) {
              appendContent(ele, arg1);
            } else {
              App.log('WARNING: Dom builder: ignoring content parameter as not an array (' + arg1 + ')');
            }
          }
        } else {
          App.log('WARNING: Dom builder: ignoring parameter as neither array or object (' + arg0 + ')');
        }
      }
      return ele;
    } catch(ex) {
      App.log('Dom Builder failed to create requested element, make sure content is passed as an array. (' + ex + ')');
      return '';
    }
  }

  function applyAttrs(ele, attrs) {
    var k, val;
    for (k in attrs) {
      val = attrs[k];
      if (typeof(val) === 'undefined' || val === null) { continue; }
      if ($.isFunction(val)) {
        ele.bind(k, val);
      } else {
        ele.attr(k, val);
      }
    }
  }

  function appendContent(ele, content) {
    if (App.util.isArray(content)) {
      for (var i = 0; i < content.length; i++) {
        ele.append(content[i]);
      }
    } else {
      ele.append(content);
    }
  }

  for (var i = 0; i < tags.length; i++) {
    App.util.domBuilder[tags[i].toUpperCase()] = createBuilder(tags[i]);
  }
})();
