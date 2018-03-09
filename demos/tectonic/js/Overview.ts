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

// esri.renderers
import SimpleRenderer = require("esri/renderers/SimpleRenderer");

// esri.symbols
import FillSymbol3DLayer = require("esri/symbols/FillSymbol3DLayer");

// esri.views
import MapView = require("esri/views/MapView");

// app
import { BlendLayer } from "./BlendLayer";
import { Viewport } from "./Viewport";

@subclass()
export class Overview extends declared(Accessor) {
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    const map = this.createMap();
    this._set("view", this.createView(map, this.viewport));
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
  readonly view: MapView;

  //----------------------------------
  //  viewport
  //----------------------------------

  @property({ constructOnly: true })
  readonly viewport: Viewport;

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  private createMap() {
    const map = new Map({
      basemap: "topo-vector"
    });

    const renderer = new SimpleRenderer({
      symbol: {
        type: "simple-line",
        width: "5px",
        color: [100, 255, 255, 0.5]
      }
    });

    const layer = new FeatureLayer({
      url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_boundaries/FeatureServer/0",
      definitionExpression: "Name = 'EU-IN'",
      renderer
    });

    map.add(layer);
    return map;
  }

  private createView(map: Map, viewport: Viewport) {
    const view = new MapView({
      container: "overviewDiv",
      map,
      ui: { components: [] }
    });

    view.when(() => {
      // Synchronize the view to the viewport clipping area
      watchUtils.init(viewport, "clippingArea", () => {
        view.goTo({
          target: viewport.clippingArea.center,
          scale: 3000000
        });
      });
    });
  }
}

interface ConstructProperties {
  viewport: Viewport;
}
