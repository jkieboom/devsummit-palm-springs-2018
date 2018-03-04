/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import Accessor = require("esri/core/Accessor");
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import Graphic = require("esri/Graphic");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import { Polyline, Extent, Mesh } from "esri/geometry";
import Collection = require("esri/core/Collection");
import geometryEngine = require("esri/geometry/geometryEngine");

const PolylineCollection = Collection.ofType(Polyline);

@subclass()
export class PathLayer extends declared(GraphicsLayer) {
  @property()
  set clippingArea(value: Extent) {
    this._set("clippingArea", value);
    this.update();
  }

  @property({ constructOnly: true, type: PolylineCollection })
  readonly lines: Collection<Polyline> = new PolylineCollection();

  @property({ constructOnly: true })
  readonly elevationSampler: esri.ElevationSampler;

  @property()
  set symbol(value: esri.MeshSymbol3D) {
    this._set("symbol", value);
    this.update();
  }

  @property()
  height: number = 50;

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

  private updateId: number = 0;

  private scheduleUpdate() {
    if (!this.updateId) {
      this.updateId = setTimeout(() => {
        this.updateId = 0;
        this.update();
      }, 0);
    }
  }

  private update() {
    // Remove all graphics and recreate them.
    this.graphics.removeAll();

    this.lines.forEach(line => {
      const geometry = this.createPathGeometry(line);

      const graphic = new Graphic({
        geometry,
        symbol: this.symbol
      });

      this.graphics.add(graphic);
    });
  }

  private clipLine(line: Polyline): Polyline {
    if (this.clippingArea) {
      const expandedClippingArea = this.clippingArea.clone().expand(1.1);
      return geometryEngine.clip(line, expandedClippingArea) as Polyline;
    }
    else {
      return line;
    }
  }

  private densifyLine(line: Polyline): Polyline {
    if (this.clippingArea) {
      const dim = Math.max(this.clippingArea.width, this.clippingArea.height);
      return geometryEngine.densify(line, dim / 50, "meters") as Polyline;
    }
    else {
      return line;
    }
  }

  private createExtrudedPositionAttribute(line: Polyline) {
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

  private createExtrudedMesh(line: Polyline) {
    const position = this.createExtrudedPositionAttribute(line);

    const path = line.paths[0];
    const nSegments = path.length - 1;

    const faces = new Uint32Array(nSegments * 2 * 3);
    let facePtr = 0;
    let vertexPtr = 0;

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
}

interface ConstructProperties {
  symbol: esri.MeshSymbol3D;
  clippingArea: Extent;
  elevationSampler: esri.ElevationSampler;

  lines?: Collection<Polyline>;
  height?: number;
}

export default PathLayer;
