import TileLayer = require("esri/layers/TileLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");
import Map = require("esri/Map");
import SceneView = require("esri/views/SceneView");

import { BlendLayer } from "./BlendLayer";
import { ExaggerationElevationLayer } from "./ExaggerationElevationLayer";
import { Viewport } from "./Viewport";
import { ScrollAlong } from "./ScrollAlong";
import { IntegratedTitle } from "./IntegratedTitle";
import { LavaRenderer } from "./LavaRenderer";

//let scrollAlong: ScrollAlong;
let view: SceneView;
let lavaRenderer: LavaRenderer;
//let title: IntegratedTitle;

export function run() {
  const map = createMap();
  const viewport = new Viewport();
  
  view = createView({ map, viewport });
  new ScrollAlong({ view, viewport });

  const titleElement = document.getElementById("title");
  new IntegratedTitle({ view, viewport, element: titleElement, elevation: 14000 });

  lavaRenderer = new LavaRenderer({ view });
  lavaRenderer;

  window["view"] = view;
}

function createView(params: { map: Map; viewport: Viewport }) {
  return new SceneView({
    container: "viewDiv",
    map: params.map,
    viewingMode: "local",
    camera: {
      position: { x: -69.79518411, y: -30.76825783, z: 14861.17659 },
      heading: 330.31,
      tilt: 82.12
    },
    environment: {
      atmosphere: { 
        quality: "high"
      }
    },
    clippingArea: params.viewport.clippingArea
  });
}

function createMap() {
  const hillShadeLayer = new TileLayer({
    url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"
  });

  hillShadeLayer;

  const baseImageLayer = new TileLayer({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
  });

  const worldElevationLayer = new ElevationLayer({
    url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
  });

  return new Map({
    basemap: {
      baseLayers: [
        new BlendLayer({
          multiplyLayers: [ baseImageLayer ] //, hillShadeLayer ]
        })
      ]
    },

    ground: {
      layers: [
        new ExaggerationElevationLayer({
          exaggerationFactor: 2,
          elevationLayer: worldElevationLayer
        })
      ]
    }
  });
}
