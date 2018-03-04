/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import Accessor = require("esri/core/Accessor");
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import Graphic = require("esri/Graphic");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import { Polyline, Extent, Mesh, Point, SpatialReference } from "esri/geometry";
import Collection = require("esri/core/Collection");
import geometryEngine = require("esri/geometry/geometryEngine");
import QueryTask = require("esri/tasks/QueryTask");
import ImageMeshColor = require("esri/geometry/support/ImageMeshColor");
import { vec3, vec2 } from "gl-matrix";

const PolylineCollection = Collection.ofType(Polyline);

@subclass()
export class TectonicPlatesLayer extends declared(GraphicsLayer) {
  @property()
  set clippingArea(value: Extent) {
    this._set("clippingArea", value);
    this.update();
  }

  @property({ constructOnly: true })
  readonly elevationSampler: esri.ElevationSampler;

  @property()
  set symbol(value: esri.MeshSymbol3D) {
    this._set("symbol", value);
    this.update();
  }

  @property()
  height: number = 50;

  private measurements: Measurement[] = null;

  private texturePlate1 = new ImageMeshColor({
    url: "./img/TexturesCom_SoilRough0039_1_seamless_S.jpg"
  });

  private texturePlate2 = new ImageMeshColor({
    url: "./img/TexturesCom_SoilMud0004_1_seamless_S.jpg"
  });

  private textureEarth = new ImageMeshColor({
    url: "./img/TexturesCom_SandPebbles0060_1_seamless_S.jpg"
  });

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.elevationSampler.on("changed", () => this.scheduleUpdate());
    this.fetchData();
  }

  private async fetchData() {
    const query = new QueryTask({
      url: "https://services2.arcgis.com/cFEFS0EWrhfDeVw9/ArcGIS/rest/services/PB2002_steps/FeatureServer/0"
    });

    const featureSet = await query.execute({
      where: "PLATEBOUND = 'EU-IN'",
      returnGeometry: false,
      outFields: ["STARTLONG", "STARTLAT", "FINALLONG", "FINALLAT", "VELOCITYAZ", "VELOCITYDI", "VELOCITYRI"],
      orderByFields: ["SEQNUM"]
    });

    let measurements: Measurement[] = [];

    for (let i = 0; i < featureSet.features.length; i++) {
      const feature = featureSet.features[i];
      const attr = feature.attributes;

      const start = this.getStartLocation(feature);
      const end = this.getEndLocation(feature);

      const location = new Point({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        spatialReference: start.spatialReference
      });

      const velocity = this.calculateVelocity(feature);

      if (measurements.length > 0) {
        const previous = measurements[measurements.length - 1];
        measurements.push({ location: start, velocity: this.calculateVelocityBetween(previous.velocity, velocity) })
      }

      measurements.push({ location, velocity });
    }

    this.measurements = measurements;
    this.update();
  }

  private getStartLocation(feature: Graphic) {
    const attr = feature.attributes;
    const pt = new Point({ spatialReference: SpatialReference.WebMercator });
    pt.longitude = attr["STARTLONG"];
    pt.latitude = attr["STARTLAT"];

    return pt;
  }

  private getEndLocation(feature: Graphic) {
    const attr = feature.attributes;
    const pt = new Point({ spatialReference: SpatialReference.WebMercator });
    pt.longitude = attr["FINALLONG"];
    pt.latitude = attr["FINALLAT"];

    return pt;
  }

  private calculateVelocityVector(v: Velocity) {
    const vec = vec3.fromValues(0, -v.y, -v.z);
    return vec3.rotateZ(vec3.create(), vec, [0, 0, 0], v.dir);
  }

  private calculateVelocity(feature: Graphic): Velocity {
    const attr = feature.attributes;

    const dir = attr["VELOCITYAZ"] / 180 * Math.PI;
    const y = Math.abs(attr["VELOCITYDI"]);
    const z = Math.abs(attr["VELOCITYRI"]);

    return { dir, y, z };
  }

  private calculateVelocityBetween(v1: Velocity, v2: Velocity, f: number = 0.5): Velocity {
    return {
      dir: this.lerp(v1.dir, v2.dir, f),
      y: this.lerp(v1.y, v2.y, f),
      z: this.lerp(v1.z, v2.z, f),
    };
  }

  private lerp(a: number, b: number, f: number): number {
    return a + (b - a) * f;
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

  private intersectLineLine(a: number, c: number, b: number, d: number) {
    const x = (d - c) / (a - b);
    return [x, a * x + c];
  }

  private createMeshSlice(measurement: Measurement) {
    const velocity = this.calculateVelocityVector(measurement.velocity);

    // Interested in projection on X
    const velYZ = vec2.fromValues(velocity[1], velocity[2]);
    const norm = vec2.normalize(vec2.create(), velYZ);

    const mx = measurement.location.x;
    const my = measurement.location.y;
    const z = 0;

    const { ymin, ymax } = this.clippingArea;
    const l = vec2.length(velYZ) * 100;
    const h = 1000;

    // y = a * x + b
    const pto = [my + norm[0] * h, z + -norm[1] * h];
    const a = norm[1] / norm[0];
    const c = pto[1] - a * pto[0];

    const [ cy1, ] = this.intersectLineLine(a, c, 0, z + h);
    const [ cy2, ] = this.intersectLineLine(a, c, 0, z);

    const dy = my + norm[0] * l;
    const dz = z + norm[1] * l;

    const zd = 4000;

    const position = [
      mx, ymin, z + h,
      mx, cy1, z + h,
      mx, ymax, z + h,

      mx, ymin, z,
      mx, my, z,
      mx, cy2, z,
      mx, ymax, z,

      mx, dy, dz,
      mx, dy - norm[1] * h, dz + norm[0] * h,

      mx, ymin, z - zd,
      mx, ymax, z - zd
    ];

    const nElevSamples = 50;

    const pt = new Point({ spatialReference: measurement.location.spatialReference });

    for (let i = 0; i < nElevSamples; i++) {
      pt.x = mx;
      pt.y = i / (nElevSamples - 1) * (ymax - ymin) + ymin;
      pt.z = this.elevationSampler.elevationAt(pt);

      position.push(pt.x, pt.y, pt.z);
      position.push(pt.x, pt.y, z + h);
    }

    for (let i = 0; i < position.length; i += 3) {
      position[i + 1] = Math.min(Math.max(ymin, position[i + 1]), ymax);
    }

    const uv = [];
    const zmax = 8000;
    const zmin = z - zd;

    for (let i = 0; i < position.length; i += 3) {
      const u = (position[i + 1] - ymin) / (ymax - ymin);
      const v = (position[i + 2] - zmin) / (zmax - zmin);

      uv.push(u, v);
    }

    const band = new Mesh({
      vertexAttributes: {
        position,
        uv
      },

      components: [
        {
          faces: [
            0, 3, 1,
            3, 4, 1,
            4, 5, 1,
            4, 8, 5,
            4, 7, 8
          ],

          material: {
            color: this.texturePlate1
          }
        },
        {
          faces: [
            1, 5, 2,
            5, 6, 2
          ],

          material: {
            color: this.texturePlate2
          }
        }
      ],

      spatialReference: measurement.location.spatialReference
    });

    const earthFaces = [
      3, 9, 4,
      9, 7, 4,
      9, 10, 7,
      7, 10, 8,
      8, 10, 6,
      5, 8, 6
    ];

    let facePtr = 11;

    // Add top connecting to the surface
    for (let i = 0; i < nElevSamples - 1; i++) {
      earthFaces.push(facePtr, facePtr + 1, facePtr + 2);
      earthFaces.push(facePtr + 1, facePtr + 3, facePtr + 2);
      facePtr += 2;
    }

    const earth = new Mesh({
      vertexAttributes: {
        position,
        uv
      },

      components: [
        {
          faces: earthFaces,

          material: {
            color: this.textureEarth
          }
        }
      ],

      spatialReference: measurement.location.spatialReference
    });

    return [ band, earth ];
  }

  private update() {
    // Remove all graphics and recreate them.
    this.graphics.removeAll();

    if (!this.measurements) {
      return;
    }

    const nSlices: number = 5;
    const clip = this.clippingArea;

    for (let i = 0; i < nSlices; i++) {
      const dx = nSlices === 1 ? 0 : i / (nSlices - 1);
      const x = clip.xmin + dx * clip.width;

      // Figure out the position and velocity of a measurment that crosses
      // through this x coordinate
      const measurement = this.findMeasurementAt(x, clip.ymin, clip.ymax);

      if (!measurement) {
        continue;
      }

      // Generate mesh out of slice to represent the tectonic movement
      const gg = this.createMeshSlice(measurement);

      const g2 = new Graphic({
        geometry: gg[0],
        symbol: this.symbol
      });

      this.graphics.add(g2);

      const g3 = new Graphic({
        geometry: gg[1],
        symbol: this.symbol
      });

      this.graphics.add(g3);
    }
  }

  private findMeasurementAt(x: number, ymin: number, ymax: number): Measurement {
    for (let i = 1; i < this.measurements.length; i++) {
      const current = this.measurements[i];
      const previous = this.measurements[i - 1];

      const crossesX1 = previous.location.x <= x && current.location.x >= x;
      const crossesX2 = current.location.x <= x && previous.location.x >= x;
      const crossesY1 = previous.location.y <= ymax && current.location.y >= ymin;
      const crossesY2 = current.location.y <= ymax && previous.location.y >= ymin;

      if ((crossesX1 || crossesX2) && (crossesY1 || crossesY2)) {
        const f = (x - previous.location.x) / (current.location.x - previous.location.x);
        const y = previous.location.y + (current.location.y - previous.location.y) * f;

        if (y < ymin || y > ymax) {
          return null;
        }

        // Measurement is crossing the segment we want to visualize, return
        // exact measurement
        return {
          location: new Point({ x, y, spatialReference: current.location.spatialReference  }),
          velocity: this.calculateVelocityBetween(previous.velocity, current.velocity, f)
        };
      }
    }

    return null;
  }
}

interface ConstructProperties {
  symbol: esri.MeshSymbol3D;
  clippingArea: Extent;
  elevationSampler: esri.ElevationSampler;
}

interface Measurement {
  location: Point;
  velocity: Velocity;
}

interface Velocity {
  dir: number;
  y: number;
  z: number;
}

export default TectonicPlatesLayer;
