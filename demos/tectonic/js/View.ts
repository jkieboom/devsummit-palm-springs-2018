
/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

// esri
import Map = require("esri/Map");
import { Polyline, SpatialReference } from "esri/geometry";

// esri.core
import watchUtils = require("esri/core/watchUtils");
import Accessor = require("esri/core/Accessor");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri.layers
import TileLayer = require("esri/layers/TileLayer");
import FeatureLayer = require("esri/layers/FeatureLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");

// esri.renderers
import SimpleRenderer = require("esri/renderers/SimpleRenderer");

// esri.symbols
import FillSymbol3DLayer = require("esri/symbols/FillSymbol3DLayer");
import MeshSymbol3D = require("esri/symbols/MeshSymbol3D");

// esri.symbols.edges
import SolidEdges3D = require("esri/symbols/edges/SolidEdges3D");
import SketchyEdges3D = require("esri/symbols/edges/SketchyEdges3D");

// esri.views
import SceneView = require("esri/views/SceneView");

// app
import { BlendLayer } from "./BlendLayer";
import { Viewport } from "./Viewport";
import { LavaRenderer } from "./LavaRenderer";
import { TectonicPlatesLayer } from "./TectonicPlatesLayer";
import { PlateBoundaryLayer } from "./PlateBoundaryLayer";
import { ExaggerationElevationLayer } from "./ExaggerationElevationLayer";

@subclass()
export class View extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  initialize() {
    this._set("viewport", new Viewport());
    this.createView();
    this.createPlateBoundaryLayer();

    // Step 5: tectonic plates subdiction
    //
    this.createTectonicPlatesLayer();

    // Step 7: finishing touches
    //
    this.createLavaRenderer();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  view
  //----------------------------------

  @property({ readOnly: true })
  readonly view: SceneView;

  //----------------------------------
  //  viewport
  //----------------------------------

  @property({ readOnly: true })
  readonly viewport: Viewport;

  //----------------------------------
  //  tectonicPlateBoundaryLine
  //----------------------------------

  @property({ constructOnly: true })
  readonly tectonicPlateBoundaryLine: Polyline;

  //----------------------------------
  //  hillShadingEnabled
  //----------------------------------

  @property({ readOnly: true })
  readonly hillShadeLayer: TileLayer;

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private lavaRenderer: LavaRenderer;

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private async createPlateBoundaryLayer() {
    // Step 4: Elevation profile along boundary
    //

    // await this.createPlateBoundaryLayerSimple();
    await this.createPlateBoundaryLayerProfile();
  }

  private async createPlateBoundaryLayerSimple() {
    const renderer = new SimpleRenderer({
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            size: 5,
            material: {
              color: [100, 255, 255, 0.5]
            }
          }
        ]
      }
    });

    const layer = new FeatureLayer({
      url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0",
      definitionExpression: "Name = 'EU-IN'",
      renderer
    });

    this.view.map.add(layer);
  }

  private async createPlateBoundaryLayerProfile() {
    await watchUtils.whenOnce(this.view, "groundView.elevationSampler");

    // Basic mesh symbol with white 3px edges
    const symbol = new MeshSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: {
            color: [100, 255, 255, 0.5]
          },
          edges: new SolidEdges3D({
            color: "white",
            size: "3px"
          })
        })
      ]
    });

    // Initial clipping area
    const clippingArea = this.view.clippingArea;

    // Elevation sampler from the ground view
    const elevationSampler = this.view.groundView.elevationSampler;

    // Plate boundary layer
    const layer = new PlateBoundaryLayer({
      clippingArea,
      symbol,
      elevationSampler,

      height: 1000,

      lines: [this.tectonicPlateBoundaryLine]
    });

    this.view.map.add(layer);

    // Make sure the clipping area synchronizes from the view to the layer
    this.syncClippingArea(layer);

    // TODO: this is a hack required for smooth updates
    const ret = await this.view.whenLayerView(layer).then(layerView => ({ layerView }));
    (ret.layerView as any).updateClippingExtent = () => true;
  }

  private syncClippingArea(layer: PlateBoundaryLayer | TectonicPlatesLayer) {
    this.view.watch("clippingArea", clippingArea => {
      layer.clippingArea = clippingArea;
    });
  }

  // Create a local view with the provided map and clipping area
  private createView() {
    const map = this.createMap();

    const view = new SceneView({
      container: "viewDiv",
      map,
      viewingMode: "local",

      camera: {
        position: { x: 87.22524752, y: 27.18392724, z: 26046.80071 },
        heading: 127.73,
        tilt: 61.54
      },

      clippingArea: this.viewport.clippingArea,

      ui: {
        components: ["attribution"]
      }
    });

    this._set("view", view);
  }

  // Create the basic map with custom layers that improve perception
  // of mountains and ridges:
  //
  // 1. A basmap containing a custom layer that blends
  //    hill shading on top of satellite imagery
  // 2. A ground containing a custom elevation layer that exaggerates
  //    elevation
  private createMap() {
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
            // multiplyLayers: [ baseImageLayer ]
            multiplyLayers: [ baseImageLayer, hillShadeLayer ]
          })
        ]
      },

      ground: {
        layers: [
          new ExaggerationElevationLayer({
            // exaggerationFactor: 1,
            exaggerationFactor: 2,
            elevationLayer: worldElevationLayer
          })
        ]
      }
    });
  }





  private async createTectonicPlatesLayer() {
    await watchUtils.whenOnce(this.view, "groundView.elevationSampler");

    // Basic mesh symbol with sketchy edges
    const symbolBand = new MeshSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          edges: new SketchyEdges3D({ size: "1px", extensionLength: "5px" })
        })
      ]
    });

    const symbolEarth = new MeshSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: {
            color: "white"
          }
        })
      ]
    });

    // Initial clipping area
    const clippingArea = this.view.clippingArea;

    // Elevation sampler from the ground view
    const elevationSampler = this.view.groundView.elevationSampler;

    const layer = new TectonicPlatesLayer({
      clippingArea,
      symbolBand,
      symbolEarth,
      elevationSampler
    });

    this.view.map.add(layer);

    // TODO: this is a hack required for smooth updates
    const ret = await this.view.whenLayerView(layer).then(layerView => ({ layerView }));
    (ret.layerView as any).updateClippingExtent = () => true;

    // Make sure the clipping area synchronizes from the view to the layer
    this.syncClippingArea(layer);
  }






  private createLavaRenderer() {
    this.lavaRenderer = new LavaRenderer({ view: this.view, top: -4000, bottom: -8000 });

    // Add ability to pause/resume the lava animation with pressing Space
    this.view.on("key-down", ev => {
      if (ev.key === " ") {
        this.lavaRenderer.playing = !this.lavaRenderer.playing;
      }
    });
  }
}

export default View;
