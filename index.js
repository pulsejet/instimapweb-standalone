var InstiMap = require('instimapweb');
var autocomplete = require('autocomplete.js')
var Fuse = require('fuse.js');
var Hammer = require('hammerjs');

var locations = [];
var fuse;

var fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    tokenize: true,
    location: 0,
    distance: 7,
    maxPatternLength: 10,
    minMatchCharLength: 1,
    keys: [
      'name',
      'short_name'
    ]
  };

function locSearch(query, cb) {
    cb(fuse.search(query).slice(0, 10))
}

/** Gets a URL passable string after stripping spaces and special characters */
function getPassable(str) {
  return str.toLowerCase().replace(' ', '-').replace(/^A-Za-z0-9\\-/, '');
}

/** Get value of query parameter from key */
function getQueryStringValue(key) {
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

/** Get location from passable name */
function locationFromPassable(query) {
  for (var i = 0; i < locations.length; i++) {
    if (getPassable(locations[i].short_name) == query) {
      return locations[i];
    }
  }
  return undefined;
}

/** Move the marker to location from passable name */
function moveToPassable(query) {
  var loc = locationFromPassable(query);
  if (loc != undefined) {
    InstiMap.moveToLocation(loc);
    locationSelected(loc);
  }
}

autocomplete('#search', { hint: true }, [
    {
      source: locSearch,
      displayKey: 'short_name',
      templates: {
        suggestion: function(suggestion) {
          return suggestion.short_name;
        }
      }
    }
  ]).on('autocomplete:selected', function(event, suggestion, dataset, context) {
    InstiMap.moveToLocation(suggestion);
    locationSelected(suggestion);
  });

function locationSelected(loc) {
    if (loc == undefined) {
        document.getElementById('infobox').style.opacity = 0;
        document.getElementById('locfab').classList.remove('translate');
        setTimeout(function() {
            document.getElementById('infobox').style.display = 'none';
            document.getElementById('locname').innerText = '';
            document.getElementById('locdesc').innerText = '';
        }, 300);
    } else {
        document.getElementById('infobox').style.display = 'block';
        document.getElementById('locfab').classList.add('translate');
        setTimeout(function() {
            document.getElementById('infobox').style.opacity = 1;
        }, 100);
        document.getElementById('locname').innerText = loc.name;
        document.getElementById('locdesc').innerText = loc.description;
    }
}

fetch('https://api.insti.app/api/locations')
  .then(function(response) {
    return response.json();
  })
  .then(function(jsonResponse) {
    locations = jsonResponse;
    fuse = new Fuse(locations, fuse_options);

    InstiMap.getMap({
        mapPath: 'assets/map.jpg',
        mapMinPath: 'assets/map-min.jpg',
        markersBase: 'assets/map/',
        attributions:'<a href="http://mrane.com/" target="_blank">Prof. Mandar Rane</a>',
        map_id: 'map',
        marker_id: 'marker',
        user_marker_id: 'user-marker',
    }, locations, function(location) {
      /* Location selected callback */
      locationSelected(location);
    }, function() {
      /* Done loading */
      document.querySelector('.loading-fader').style.display = 'none';
      document.querySelectorAll('.hide-till-load').forEach(function(elem) {
        elem.classList.remove('hide-till-load');
      });
      document.body.style.background = '#666'

      /* Check for initial location */
      var query = getQueryStringValue('location')
      if (query != null && query != undefined) {
        moveToPassable(query);
      }
    });
  });

/* Infobox animation */
var squares = document.querySelector('#infobox, #infobox *');
var square = document.querySelector('#infobox');
var manager = new Hammer.Manager(squares);
var Swipe = new Hammer.Swipe();
manager.add(Swipe);
manager.on('swipe', function(e) {
    var direction = e.offsetDirection;
    if (direction === 8) {
        square.classList.add("expanded");
    } else if (direction == 16) {
        square.classList.remove("expanded");
    }
});

document.getElementById('locfab').addEventListener('click', function() {
    InstiMap.getGPS();
});
