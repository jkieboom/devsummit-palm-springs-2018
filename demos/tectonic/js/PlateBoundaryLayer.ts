/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

// esri
import Graphic = require("esri/Graphic");
import { Polyline, Extent, Mesh } from "esri/geometry";

// esri.core
import Accessor = require("esri/core/Accessor");
import Collection = require("esri/core/Collection");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri.geometry
import geometryEngine = require("esri/geometry/geometryEngine");

// esri.layers
import GraphicsLayer = require("esri/layers/GraphicsLayer");

const PolylineCollection = Collection.ofType(Polyline);

/**
 *
 */
@subclass()
export class PlateBoundaryLayer extends declared(GraphicsLayer) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.lines.on("change", ev => {
      this.update();
    });

    this.elevationSampler.on("changed", () => this.scheduleUpdate());
    this.update();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  clippingArea
  //----------------------------------

  @property()
  set clippingArea(value: Extent) {
    this._set("clippingArea", value);
    this.update();
  }

  //----------------------------------
  // lines
  //----------------------------------

  @property({ constructOnly: true, type: PolylineCollection })
  readonly lines: Collection<Polyline> = new PolylineCollection();

  //----------------------------------
  //  elevationSampler
  //----------------------------------

  @property({ constructOnly: true })
  readonly elevationSampler: esri.ElevationSampler;

  //----------------------------------
  //  symbol
  //----------------------------------

  @property()
  set symbol(value: esri.MeshSymbol3D) {
    this._set("symbol", value);
    this.update();
  }

  //----------------------------------
  //  height
  //----------------------------------

  @property()
  height: number = 50;

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private updateId: number = 0;

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Schedules an update in the next frame.
   */
  private scheduleUpdate() {
    if (!this.updateId) {
      this.updateId = setTimeout(() => {
        this.updateId = 0;
        this.update();
      }, 0);
    }
  }

  /**
   * Creates a mesh geometry that follows the line representing
   * a plate boundary. The line is clipped to the clipping area,
   * densified, enriched with z-values from the ground surface
   * and then tesselated to create the mesh.
   *
   * @param line the line.
   */
  private createPathGeometry(line: Polyline) {
    // Clip against clipping area using geometry engine
    const clipped = this.clipLine(line);

    // Create a simple "curtain" by densifying the line and extruding it up
    const densified = this.densifyLine(clipped);

    // Add elevation values from the elevation sampler
    const withElevation = this.elevationSampler.queryElevation(densified) as Polyline;

    const mesh = this.createExtrudedMesh(withElevation);
    return mesh;
  }

  /**
   * Clips a line against the clipping area.
   *
   * @param line the line to clip.
   */
  private clipLine(line: Polyline): Polyline {
    if (this.clippingArea) {
      const expandedClippingArea = this.clippingArea.clone().expand(1.1);
      return geometryEngine.clip(line, expandedClippingArea) as Polyline;
    }
    else {
      return line;
    }
  }

  /**
   * Densifies a line such that there are approximately
   * 50 segments covering the clipping area size.
   *
   * @param line the line to densify.
   */
  private densifyLine(line: Polyline): Polyline {
    if (this.clippingArea) {
      const dim = Math.max(this.clippingArea.width, this.clippingArea.height);
      return geometryEngine.densify(line, dim / 50, "meters") as Polyline;
    }
    else {
      return line;
    }
  }

  /**
   * Create the extruded vertex position attribute for
   * a given line. The line is expected to have z-values
   * that coincide with the ground surface. The line is
   * extruded upwards by [height](#height).
   *
   * @param line the line.
   */
  private createExtrudedPositionAttribute(line: Polyline) {
    // NOTE: we only take the first path. Multi-path lines
    // are currently not supported (but the below can be
    // easily adapted if so needed).

    const path = line.paths[0];
    const position = new Float64Array(path.length * 2 * 3);
    let positionPtr = 0;

    for (let i = 0; i < path.length; i++) {
      position[positionPtr++] = path[i][0];
      position[positionPtr++] = path[i][1];
      position[positionPtr++] = path[i][2];

      position[positionPtr++] = path[i][0];
      position[positionPtr++] = path[i][1];
      position[positionPtr++] = path[i][2] + this.height;
    }

    return position;
  }

  /**
   * Create an extruded mesh geometry along the line. This method
   * assumes the line has z-values that coincide with the ground
   * surface.
   *
   * @param line the line.
   */
  private createExtrudedMesh(line: Polyline) {
    const position = this.createExtrudedPositionAttribute(line);

    const path = line.paths[0];
    const nSegments = path.length - 1;

    const faces = new Uint32Array(nSegments * 2 * 3);
    let facePtr = 0;
    let vertexPtr = 0;

    // Create two triangle faces between each consecutive
    // pair of vertices in the line.
    for (let i = 0; i < nSegments; i++) {
      faces[facePtr++] = vertexPtr;
      faces[facePtr++] = vertexPtr + 3;
      faces[facePtr++] = vertexPtr + 1;

      faces[facePtr++] = vertexPtr;
      faces[facePtr++] = vertexPtr + 2;
      faces[facePtr++] = vertexPtr + 3;

      vertexPtr += 2;
    }

    return new Mesh({
      vertexAttributes: {
        position
      },

      components: [{
        faces
      }],

      spatialReference: line.spatialReference
    });
  }

  /**
   * Updates the geometry when elevation or the clipping area has
   * changed.
   */
  private update() {
    this.graphics.removeAll();

    // Create a path geometry for plate boundary
    const graphics = this.lines.map(line => {
      const geometry = this.createPathGeometry(line);

      return new Graphic({
        geometry,
        symbol: this.symbol
      });
    });

    this.graphics.addMany(graphics);
  }
}

interface ConstructProperties {
  symbol: esri.MeshSymbol3D;
  clippingArea: Extent;
  elevationSampler: esri.ElevationSampler;

  lines?: Collection<Polyline> | Polyline[];
  height?: number;
}

export default PlateBoundaryLayer;
