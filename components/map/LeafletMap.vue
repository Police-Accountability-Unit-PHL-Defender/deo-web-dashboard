<template>
  <div class="map" id="map"/>
</template>

<style>
  .map {
    width: 100%;
    height: 100%;
  }
</style>

<script setup>
const config = useRuntimeConfig()

const props = defineProps(['geoAggregation', 'modelValue'])
const emit = defineEmits(['update:modelValue'])

const mapObj = ref()
const mapsLoaded = ref()
const addressSelection = ref()
// const selectedFeature = ref()

// Options Setting
const options = {
  center: [40.0, -75.12],
  zoom: 11,
  selectedFeatureStyle: {
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7,
  },
};
const geoAggregations = {
  psa: {
    url: "https://opendata.arcgis.com/datasets/8dc58605f9dd484295c7d065694cdc0f_0.geojson",
    legendSelectedTextFunction: (obj) =>
      `<b>District:${obj.PSA_NUM.substr(0, 2)} PSA:${obj.PSA_NUM[2]}</b>`,
    tooltipFunction: (obj) => obj.PSA_NUM.substr(0, 2) + '-' + obj.PSA_NUM.substr(2),
  },
  district: {
    url: "https://opendata.arcgis.com/datasets/62ec63afb8824a15953399b1fa819df2_0.geojson",
    legendSelectedTextFunction: (obj) => `<b>District:${obj.DIST_NUM}</b>`,
    tooltipFunction: (obj) => obj.DIST_NUMC,
  },
  division: {
    url: "https://opendata.arcgis.com/datasets/4333983fd1e1449ca7fc2d63ad7e0076_0.geojson",
    legendSelectedTextFunction: (obj) => `<b>Division:${obj.DIV_NAME}</b>`,
    tooltipFunction: (obj) => obj.DIV_NAME,
  },
  city: {
    url: "https://opendata.arcgis.com/datasets/405ec3da942d4e20869d4e1449a2be48_0.geojson",
    legendSelectedTextFunction: (obj) => "<b>Philadelphia</b>",
    tooltipFunction: (obj) => "Philadelphia",
  },
};

function updateSelectedFeature(featureProperties) {
  let featureName = 'Philadelphia';
  if (featureProperties.DIST_NUM) {
    featureName = `District ${featureProperties.DIST_NUM}`
  } else if (featureProperties.DIV_NAME) {
    featureName = `Division ${featureProperties.DIV_NAME}`
  } else if (featureProperties.PSA_NUM) {
    featureName = `PSA ${featureProperties.PSA_NUM}`
  }
  emit("update:modelValue", featureName);
}

let L = {};
var selectedInfoControlDiv;
var getTextFromSelectedFeatureProperties;
var selectedGeojsonLayer = null;
let map = "";

let {
  zoom = 11,
  maxZoom = 19,
  minZoom = 11,
  mapID = "map",
  attributionControl = true,
  center = [0, 0],
  scrollWheelZoom = false,
  selectedFeatureStyle = null,
  tilelayers = [
    {
      url: 'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ],
  controls = {
    zoomControl: true,
    position: "topleft",
    scale: false,
  },
} = options;

let icon;
let markersArray = {};
let bounds;

function initialise() {
  setTimeout(async () => {
    L = window["L"];
    createMap();
    updateGeojsonUrlLayer(geoAggregations[props.geoAggregation]);
  }, 1);
}

const addMarker = (obj) => {
  obj.markers.map((e, i) => {
    icon = e.icon ? L.icon(e.icon) : null;
    let marker = new L.marker([e.lat, e.lng], icon).addTo(map);
    marker.addTo(map);
    markersArray[marker._leaflet_id] = marker;
  });
};
const removeMarkers = () => {
  Object.values(markersArray).forEach((marker) => {
    map.removeLayer(marker);
    markersArray = {};
  });
};
const updateMarkers = (obj) => {
  removeMarkers();
  addMarker(obj);
};

function createMap() {
  map = L.map(mapID, {
    attributionControl,
    zoomControl: controls.zoomControl,
    minZoom,
    maxZoom,
  }).setView(center, zoom);

  const northEast = L.latLng(40.15, -74.941);
  const southWest = L.latLng(39.86, -75.298);
  const bounds = L.latLngBounds(southWest, northEast);
  map.setMaxBounds(bounds);

  selectedInfoControlDiv = L.control();
  selectedInfoControlDiv.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
    this._div.style = "color:black";
    // this.update("Hover over a geography");
    return this._div;
  };

  selectedInfoControlDiv = L.control();
  // method that we will use to update the control based on feature properties passed
  selectedInfoControlDiv.update = function (text) {
    this._div.innerHTML = text;
  };
  selectedInfoControlDiv.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
    this._div.style = "color:black";
    // this.update("Hover over a geography");
    return this._div;
  };

  selectedInfoControlDiv.addTo(map);

  if (tilelayers) {
    tilelayers.map((e) => {
      L.tileLayer(e.url, {
        ...e,
      }).addTo(map);
    });
  }
  resizeMap();
  return map;
}

function selectGeojsonUrlFeatureFromMarker(marker) {
  function isMarkerInsidePolygon(marker, layerFeature) {
    let polyPoints = layerFeature.feature.geometry.coordinates[0];
    var x = marker.lat,
      y = marker.lng;

    var inside = false;
    for (
      var i = 0, j = polyPoints.length - 1;
      i < polyPoints.length;
      j = i++
    ) {
      var xi = polyPoints[i][1],
        yi = polyPoints[i][0];
      var xj = polyPoints[j][1],
        yj = polyPoints[j][0];

      var intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    if (inside) {
      zoomAndHighlightFeature(selectedGeojsonLayer, layerFeature);
    }

    return inside;
  }
  Object.values(selectedGeojsonLayer._layers).forEach((layerFeature) =>
    isMarkerInsidePolygon(marker, layerFeature)
  );
}
function zoomAndHighlightFeature(geojsonLayer, layerFeature) {
  geojsonLayer.resetStyle();
  map.fitBounds(layerFeature.getBounds());
  layerFeature.setStyle(options.selectedFeatureStyle);
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layerFeature.bringToFront();
  }
  selectedInfoControlDiv.update(
    getTextFromSelectedFeatureProperties(layerFeature.feature.properties)
  );
  updateSelectedFeature(layerFeature.feature.properties)
}
function updateGeojsonUrlLayer(geojsonLayerProperties) {
  if (selectedGeojsonLayer) {
    map.removeLayer(selectedGeojsonLayer);
  }
  addGeojsonUrlLayer(geojsonLayerProperties);
}
function addGeojsonUrlLayer(geojsonLayerProperties) {
  const geojsonLayerUrl = geojsonLayerProperties.url;
  // set the function for getting the text in the map legend
  getTextFromSelectedFeatureProperties = geojsonLayerProperties.legendSelectedTextFunction;

  // add the url layer and set the tooltip function to that layer
  fetch(geojsonLayerUrl)
    .then((response) => response.json())
    .then((geojsonLayer) => {
      let thisGeojsonLayer = L.geoJSON(geojsonLayer, {
        onEachFeature: onEachFeature,
      });
      thisGeojsonLayer.addTo(map);
      selectedGeojsonLayer = thisGeojsonLayer;

      function onEachFeature(feature, layer) {
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bindTooltip(
            geojsonLayerProperties.tooltipFunction(feature.properties)
          );
        }
        // https://leafletjs.com/examples/choropleth/
        function zoomAndHighlightFeatureFromClick(e) {
          // TODO: we could pass through the text function, but
          // zoomAndHighlightFeature can also be called on search,
          // in which case it would need to know the text function to use
          zoomAndHighlightFeature(thisGeojsonLayer, e.target);
          removeMarkers();
        }
        layer.on({
          click: zoomAndHighlightFeatureFromClick,
        });
      }
    });
}
function resizeMap() {
  if (map) {
    let nMarkers = Object.keys(markersArray).length;
    if (nMarkers == 1) {
      map.panTo(
        L.latLng(
          Object.values(markersArray)[0]._latlng,
          Object.values(markersArray)[0]._latlng
        )
      );
    } else if (nMarkers > 1) {
      bounds = new L.LatLngBounds(
        Object.values(markersArray).map((marker) => marker._latlng)
      );
      map.fitBounds(bounds);
    }
  }
}

watch(
  () => props.geoAggregation,
  (newValue) => {
    updateGeojsonUrlLayer(geoAggregations[newValue]);
  }
);

onMounted(() => {
  initialise();
})
</script>