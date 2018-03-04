/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

import TileLayer = require("esri/layers/TileLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import Map = require("esri/Map");
import SceneView = require("esri/views/SceneView");
import { Polyline, SpatialReference } from "esri/geometry";
import watchUtils = require("esri/core/watchUtils");
import FillSymbol3DLayer = require("esri/symbols/FillSymbol3DLayer");
import MeshSymbol3D = require("esri/symbols/MeshSymbol3D");
import SolidEdges3D = require("esri/symbols/edges/SolidEdges3D");
import SketchyEdges3D = require("esri/symbols/edges/SketchyEdges3D");

import { BlendLayer } from "./BlendLayer";
import { ExaggerationElevationLayer } from "./ExaggerationElevationLayer";
import { Viewport } from "./Viewport";
import { ScrollAlong } from "./ScrollAlong";
import { IntegratedTitle } from "./IntegratedTitle";
import { LavaRenderer } from "./LavaRenderer";
import { PathLayer } from "./PathLayer";
import { TectonicPlatesLayer } from "./TectonicPlatesLayer";

let scrollAlong: ScrollAlong;
let view: SceneView;
let lavaRenderer: LavaRenderer;

export async function run() {
  const tectonicPaths = await getTectonicPaths();

  const map = createMap();

  const viewport = new Viewport();

  view = createView({ map, viewport });
  scrollAlong = new ScrollAlong({ view, viewport, path: tectonicPaths[1] });

  const titleElement = document.getElementById("title");
  new IntegratedTitle({ view, viewport, element: titleElement, elevation: 10000 });

  if (0) {
    lavaRenderer = new LavaRenderer({ view, bottom: -4000 });

    view.on("key-down", ev => {
      if (ev.key === " ") {
        lavaRenderer.playing = !lavaRenderer.playing;
      }
    });
  }

  let pathLayer: PathLayer;
  let platesLayer: TectonicPlatesLayer;

  view.watch("clippingArea", clippingArea => {
    if (pathLayer) {
      pathLayer.clippingArea = clippingArea;
      platesLayer.clippingArea = clippingArea;
    }
  });

  createOverviewView({
    map: createOverviewMap(),
    viewport
  });

  watchUtils.whenOnce(view, "groundView.elevationSampler")
      .then(() => {
        pathLayer = new PathLayer({
          clippingArea: view.clippingArea,
          symbol: new MeshSymbol3D({
            symbolLayers: [
              new FillSymbol3DLayer({
                material: {
                  color: [100, 100, 255, 0.5]
                },
                edges: new SolidEdges3D({
                  color: "white",
                  size: "3px"
                })
              })
            ]
          }),
          elevationSampler: view.groundView.elevationSampler,
          height: 1000
        });

        pathLayer.lines.add(tectonicPaths[1]);
        map.add(pathLayer);

        platesLayer = new TectonicPlatesLayer({
          clippingArea: view.clippingArea,
          symbol: new MeshSymbol3D({
            symbolLayers: [
              new FillSymbol3DLayer({
                edges: new SketchyEdges3D({ size: "1px", extensionLength: "5px" })
              })
            ]
          }),
          elevationSampler: view.groundView.elevationSampler
        });

        map.add(platesLayer);
      });

  window.view = view;

  scrollAlong;
}

const boundariesServiceUrl = "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0";

async function getTectonicPaths() {
  const layer = new FeatureLayer({
    url: boundariesServiceUrl
  });

  const featureSet = await layer.queryFeatures({
    where: "Name = 'EU-IN'",
    returnGeometry: true,
    outSpatialReference: SpatialReference.WebMercator
  });

  return featureSet.features.map(feature => feature.geometry as Polyline);
}

function createOverviewMap() {
  const hillShadeLayer = new TileLayer({
    url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer"
  });

  const baseImageLayer = new TileLayer({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
  });

  const map = new Map({
    basemap: {
      baseLayers: [
        new BlendLayer({
          multiplyLayers: [ baseImageLayer, hillShadeLayer ]
        })
      ]
    },
  });

  const layer = new FeatureLayer({
    url: boundariesServiceUrl,
    definitionExpression: "Name = 'EU-IN'",
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "path",
            size: 5000,
            material: {
              color: [100, 100, 255, 0.5]
            }
          }
        ]
      }
    } as any
  });

  map.add(layer);
  return map;
}

function createOverviewView(params: { map: Map; viewport: Viewport }) {
  const view = new SceneView({
    container: "overviewDiv",
    map: params.map,
    ui: {
      components: []
    }
  });

  function syncView() {
    view.goTo({
      target: params.viewport.clippingArea.center,
      scale: 3000000
    }, { duration: 100 });
  }

  params.viewport.watch("clippingArea", syncView);
  syncView();
}

// Create a local view with the provided map and clipping area
function createView(params: { map: Map; viewport: Viewport }) {
  const view = new SceneView({
    container: "viewDiv",
    map: params.map,
    viewingMode: "local",

    camera: {
      position: { x: 72.82262538, y: 34.53997748, z: 20154.72966 },
      heading: 154.86,
      tilt: 71.97
    },

    clippingArea: params.viewport.clippingArea,

    ui: {
      components: ["attribution"]
    }
  });

  return view;
}

// Create the basic map with custom layers that improve perception
// of mountains and ridges:
//
// 1. A basmap containing a custom layer that blends
//    hill shading on top of satellite imagery
// 2. A ground containing a custom elevation layer that exaggerates
//    elevation
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
