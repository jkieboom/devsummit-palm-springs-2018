/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

// esri
import Map = require("esri/Map");
import { Polyline, Point, SpatialReference } from "esri/geometry";

// esri.core
import watchUtils = require("esri/core/watchUtils");

// esri.layers
import TileLayer = require("esri/layers/TileLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");

// esri.renderers
import SimpleRenderer = require("esri/renderers/SimpleRenderer");

// esri.symbols
import FillSymbol3DLayer = require("esri/symbols/FillSymbol3DLayer");
import MeshSymbol3D = require("esri/symbols/MeshSymbol3D");

// esri.symbols.edges
import SolidEdges3D = require("esri/symbols/edges/SolidEdges3D");
import SketchyEdges3D = require("esri/symbols/edges/SketchyEdges3D");

// esri.tasks
import QueryTask = require("esri/tasks/QueryTask");

// esri.views
import SceneView = require("esri/views/SceneView");

// app
import { BlendLayer } from "./BlendLayer";
import { ExaggerationElevationLayer } from "./ExaggerationElevationLayer";
import { Viewport } from "./Viewport";
import { ScrollAlong } from "./ScrollAlong";
import { DOMElement3D } from "./DOMElement3D";
import { LavaRenderer } from "./LavaRenderer";
import { PlateBoundaryLayer } from "./PlateBoundaryLayer";
import { TectonicPlatesLayer } from "./TectonicPlatesLayer";
import { Overview } from "./Overview";
import { View } from "./View";

export async function run() {
  const tectonicPlateBoundaryLine = await getTectonicPlateBoundaryLine();

  // Setup the basic view
  const view = new View({ tectonicPlateBoundaryLine });

  // Step 2: Overview map
  //
  // createOverview(view);

  // Step 3: Custom 2.5D dom
  //
  // create3DDOMElements(view);

  // Step 6: Camera updates
  //
  // createScrollAlong(view, tectonicPlateBoundaryLine);

  window.view = view;
}

function createOverview(view: View) {
  return new Overview({ viewport: view.viewport });
}

function createScrollAlong(view: View, path: Polyline) {
  return new ScrollAlong({ view: view.view, viewport: view.viewport, path });
}

function create3DDOMElements(view: View) {
  create3DDOMTitle(view);
  create3DDOMDescription(view);
}

function create3DDOMDescription(view: View) {
  const titleElement = document.getElementById("description");
  const domElement = new DOMElement3D({ view: view.view, element: titleElement, heading: 90 });

  watchUtils.init(view.viewport, "clippingArea", () => {
    const clip = view.viewport.clippingArea;
    const spatialReference = clip.spatialReference;

    // Position the element in between the ymin segment of the clipping area
    const location = new Point({ x: clip.xmax, y: (clip.ymin + clip.ymax) / 2, z: 6500, spatialReference });
    domElement.location = location;
  });
}

function create3DDOMTitle(view: View) {
  const titleElement = document.getElementById("title");
  const domElement = new DOMElement3D({ view: view.view, element: titleElement, heading: -180 });

  watchUtils.init(view.viewport, "clippingArea", () => {
    const clip = view.viewport.clippingArea;
    const spatialReference = clip.spatialReference;

    // Position the element in between the ymin segment of the clipping area
    const location = new Point({ x: (clip.xmin + clip.xmax) / 2, y: clip.ymin, z: 8000, spatialReference });
    domElement.location = location;
  });
}

async function getTectonicPlateBoundaryLine() {
  const query = new QueryTask({
    url: boundariesServiceUrl
  });

  const featureSet = await query.execute({
    where: "Name = 'EU-IN'",
    returnGeometry: true
  });

  return featureSet.features[1].geometry as Polyline;
}

const boundariesServiceUrl = "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0";
