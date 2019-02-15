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
    results = fuse.search(query).slice(0, 10);
    cb(results)
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
      locationSelected(location);
    }, function() {
      console.log('map loaded');
    });
  });

/* Infobox animation */
var square = document.querySelector('#infobox');
var manager = new Hammer.Manager(square);
var Swipe = new Hammer.Swipe();
manager.add(Swipe);
manager.on('swipe', function(e) {
var direction = e.offsetDirection;
    if (direction === 8) {
        e.target.classList.add("expanded");
    } else if (direction == 16) {
        e.target.classList.remove("expanded");
    }
});

document.getElementById('locfab').addEventListener('click', function() {
    InstiMap.getGPS();
})
