/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

import TileLayer = require("esri/layers/TileLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Map = require("esri/Map");
import SceneView = require("esri/views/SceneView");
import { Polyline, SpatialReference } from "esri/geometry";

import { BlendLayer } from "./BlendLayer";
import { ExaggerationElevationLayer } from "./ExaggerationElevationLayer";
import { Viewport } from "./Viewport";
import { ScrollAlong } from "./ScrollAlong";
import { IntegratedTitle } from "./IntegratedTitle";
import { LavaRenderer } from "./LavaRenderer";

let scrollAlong: ScrollAlong;
let view: SceneView;
let lavaRenderer: LavaRenderer;
//let title: IntegratedTitle;

export async function run() {
  const layer = new FeatureLayer({
    url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0",
    definitionExpression: "Name = 'EU-IN'",
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            size: 5,
            material: {
              color: "red"
            }
          }
        ]
      }
    } as any
  });

  const tectonicPath = await getTectonicPath(layer);

  const map = createMap();
  map.layers.add(layer);

  const viewport = new Viewport();
  
  view = createView({ map, viewport });
  scrollAlong = new ScrollAlong({ view, viewport, path: tectonicPath });

  const titleElement = document.getElementById("title");
  new IntegratedTitle({ view, viewport, element: titleElement, elevation: 10000 });

  lavaRenderer = new LavaRenderer({ view, bottom: -4000 });

  view.on("key-down", ev => {
    if (ev.key === " ") {
      lavaRenderer.playing = !lavaRenderer.playing;
    }
  })

  window["view"] = view;

  scrollAlong;
}

async function getTectonicPath(layer: FeatureLayer) {
  const featureSet = await layer.queryFeatures({
    where: "Name = 'EU-IN'",
    returnGeometry: true,
    outSpatialReference: SpatialReference.WebMercator
  });

  return featureSet.features[1].geometry as Polyline;
}

function createView(params: { map: Map; viewport: Viewport }) {
  return new SceneView({
    container: "viewDiv",
    map: params.map,
    viewingMode: "local",
    camera: {
      position: { x: 72.76947985, y: 34.40839622, z: 24469.61681 },
      heading: 137.25,
      tilt: 62.75
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
          multiplyLayers: [ baseImageLayer, hillShadeLayer ]
        })
      ]
    },

    ground: {
      layers: [
        new ExaggerationElevationLayer({
          exaggerationFactor: 3,
          elevationLayer: worldElevationLayer
        })
      ]
    }
  });
}
