<template>
  <div class="border border-neutral-400 my-6 pt-4 box-border">
    <div class="w-full text-center mt-1 mb-6 text-body-2 font-semibold text-primary-800 max-w-[800px] mx-auto px-4">
      <slot></slot>
    </div>
    <div class="h-[360px] md:h-[480px] relative z-0">
      <div class="map" id="map" ref="mapElement"/>
    </div>
    <svg width="0" height="0">
      <defs>
        <pattern id="O-pattern-blue" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path stroke="#60D9FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
          <path stroke="#fff" stroke-opacity="0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
        </pattern>
        <pattern id="O-pattern-red" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <path stroke="#F94C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
          <path stroke="#fff" stroke-opacity="0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
        </pattern>
        <pattern id="O-pattern-both" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path stroke="#60D9FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
          <path stroke="#fff" stroke-opacity="0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2h8"/>
          <path stroke="#F94C4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2v8"/>
          <path stroke="#fff" stroke-opacity="0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" pointer-events="none" d="M0 2v8"/>
        </pattern>
      </defs>
    </svg>
    <div v-if="props.mapLegend" class="text-caption p-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center">
      <div class="flex gap-1 items-top">
        <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" class="pattern-fill-blue" stroke="#393939" stroke-width="2"/>
        </svg>
        <div class="mt-[2px]">{{ props.mapLegend[0] }}</div>
      </div>
      <div class="flex gap-1 items-top">
        <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" class="pattern-fill-red" stroke="#393939" stroke-width="2"/>
        </svg>
        <div class="mt-[2px]">{{ props.mapLegend[1] }}</div>
      </div>
      <div v-if="props.mapLegend.length > 2 && containsPatternBothRegion" class="flex gap-1 items-top">
        <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" class="pattern-fill-both" stroke="#393939" stroke-width="2"/>
        </svg>
        <div class="mt-[2px]">{{ props.mapLegend[2] }}</div>
      </div>
    </div>
    <div v-if="props.hinLegend" class="text-caption p-4 text-neutral-800 flex gap-x-8 gap-y-2 flex-wrap md:justify-center">
      <div class="flex gap-1 items-center">
        <div class="bg-yellowgreen rounded-full w-2 h-2"></div>
        <div>Traffic stop on the HIN</div>
      </div>
      <div class="flex gap-1 items-center">
        <div class="bg-purple rounded-full w-2 h-2"></div>
        <div>Traffic stop not on the HIN</div>
      </div>
      <div class="flex gap-1 items-center">
        <div class="bg-neutral-800 rounded-full w-4 h-[1.5px]"></div>
        <div>HIN Roads</div>
      </div>
    </div>
  </div>
</template>

<style>
  .map {
    width: 100%;
    height: 100%;
  }
  .pattern-fill-both {
    fill: url(#O-pattern-both);
  }
  .pattern-fill-blue {
    fill: url(#O-pattern-blue);
  }
  .pattern-fill-red {
    fill: url(#O-pattern-red);
  }
</style>

<script setup>
const config = useRuntimeConfig()
const props = defineProps(['geoAggregation', 'mapLegend', 'hinLegend'])

const mapElement = ref(null)

const mapObj = ref()
const mapsLoaded = ref()
const addressSelection = ref()
const containsPatternBothRegion = ref(false)
// const selectedFeature = ref()

// Options Setting
const options = {
  center: [40.0, -75.12],
  zoom: 11,
  // selectedFeatureStyle: {
  //   weight: 5,
  //   color: "#364ED7",
  //   dashArray: "",
  //   fillOpacity: 0.7,
  // },
};

const geojsonMarkerOptions = {
  radius: 2,
  fillColor: "#F94C4C",
  color: "#F94C4C",
  weight: 1,
  opacity: 1,
  fillOpacity: 1
}

function polystyle(feature) {
  if (feature.geometry.type === "Point") {
    const pointColor = feature.properties.name === "Traffic stop on the HIN" ? "#88C715" : "#644CF9"
    return {
      radius: 3,
      fillColor: pointColor,
      color: pointColor,
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    };
  } else if (feature.geometry.type === "LineString") {
    return {
      weight: 1,
      color: "#393939"
    };
  } else if (feature.geometry.type === "Polygon") {
    return {
      color: "#393939",
      weight: 1,
      fillOpacity: 1
    }
  }
}

let L = {};
var selectedInfoControlDiv;
var getTextFromSelectedFeatureProperties;
var selectedGeojsonLayer = null;
let map = "";

let {
  zoom = 13,
  maxZoom = 19,
  minZoom = 10,
  // mapID = "map",
  attributionControl = true,
  center = [0, 0],
  scrollWheelZoom = false,
  selectedFeatureStyle = null,
  tilelayers = [
    {
      url: 'https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // tileSize: 256,
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
    updateGeojsonLayer(props.geoAggregation);
  }, 1);
}
const removeMarkers = () => {
  Object.values(markersArray).forEach((marker) => {
    map.removeLayer(marker);
    markersArray = {};
  });
};

function createMap() {
  map = L.map(mapElement.value, {
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
  // updateSelectedFeature(layerFeature.feature.properties)
}
function updateGeojsonLayer(geojsonLayerProperties) {
  if (selectedGeojsonLayer) {
    map.removeLayer(selectedGeojsonLayer);
  }
  addGeojsonLayer(geojsonLayerProperties);
}
function addGeojsonLayer(geojsonLayerProperties) {
  // const geojsonLayerUrl = geojsonLayerProperties.url;
  // set the function for getting the text in the map legend
  getTextFromSelectedFeatureProperties = geojsonLayerProperties.legendSelectedTextFunction;

  // add the url layer and set the tooltip function to that layer
  let thisGeojsonLayer = L.geoJSON(geojsonLayerProperties.data, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    style: polystyle,
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
    if (feature.geometry.type === "Polygon") {
      if (feature.properties.is_top_n_stopped_change && feature.properties.is_top_n_shootings_change) {
        containsPatternBothRegion.value = true;
        layer.options.className = "pattern-fill-both";
      } else if (feature.properties.is_top_n_shootings_change) {
        layer.options.className = "pattern-fill-red";
      } else if (feature.properties.is_top_n_stopped_change) {
        layer.options.className = "pattern-fill-blue";
      }
    }
  }
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
    updateGeojsonLayer(newValue);
  }
);

onMounted(() => {
  initialise();
})
</script>