/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

// esri
import Collection = require("esri/core/Collection");
import Graphic = require("esri/Graphic");
import { Polyline, Extent, Mesh, Point, SpatialReference } from "esri/geometry";

// esri.core
import Accessor = require("esri/core/Accessor");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri.geometry
import geometryEngine = require("esri/geometry/geometryEngine");

// esri.geometry.support
import ImageMeshColor = require("esri/geometry/support/ImageMeshColor");

// esri.layers
import GraphicsLayer = require("esri/layers/GraphicsLayer");

// esri.tasks
import QueryTask = require("esri/tasks/QueryTask");

// app
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
  set symbolBand(value: esri.MeshSymbol3D) {
    this._set("symbolBand", value);
    this.update();
  }

  @property()
  set symbolEarth(value: esri.MeshSymbol3D) {
    this._set("symbolEarth", value);
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
      outFields: ["STARTLONG", "STARTLAT", "FINALLONG", "FINALLAT", "VELOCITYAZ", "VELOCITYDI", "VELOCITYRI", "AZIMUTHCEN"],
      orderByFields: ["SEQNUM"]
    });

    const measurements: Measurement[] = [];

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
        measurements.push({ location: start, velocity: this.calculateVelocityBetween(previous.velocity, velocity) });
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
    return [ v.length * Math.cos(v.angle), v.length * Math.sin(v.angle) ];
  }

  private calculateVelocity(feature: Graphic): Velocity {
    const attr = feature.attributes;

    const a1 = attr["AZIMUTHCEN"] / 180 * Math.PI;
    const a2 = attr["VELOCITYAZ"] / 180 * Math.PI;

    const v1 = [Math.cos(a1), Math.sin(a1)];
    const v2 = [Math.cos(a2), Math.sin(a2)];
    let d = v1[0] * v2[0] + v1[1] * v2[1];

    if (d < 0) {
      d = -d;
    }

    const dangle = Math.acos(d) / Math.PI * 180;

    const minAngle = 30;
    const maxAngle = 80;
    const angle = minAngle + (maxAngle - minAngle) * ((90 - dangle) / 90);
    const angleRad = angle / 180 * Math.PI;

    const l = Math.abs(attr["VELOCITYDI"]);

    return { length: l, angle: angleRad };
  }

  private calculateVelocityBetween(v1: Velocity, v2: Velocity, f: number = 0.5): Velocity {
    return {
      length: this.lerp(v1.length, v2.length, f),
      angle: this.lerp(v1.angle, v2.angle, f)
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

  private meshSlicePlateHeight = 1000;
  private meshSliceHeight = 4000;

  private createMeshSlice(measurement: Measurement, p: number, axis: number) {
    const velocity = measurement ? this.calculateVelocityVector(measurement.velocity) : [0, 0];

    // Interested in projection on X
    const velYZ = vec2.fromValues(velocity[0], -velocity[1]);
    const norm = vec2.normalize(vec2.create(), velYZ);

    const nElevSamples = 50;

    const mx = measurement ? measurement.location.x : p;
    const my = measurement ? measurement.location.y : this.clippingArea.ymin;
    const z = 0;

    let ymin: number, ymax: number;

    if (axis === 0) {
      ymin = this.clippingArea.ymin;
      ymax = this.clippingArea.ymax;
    }
    else {
      ymin = this.clippingArea.xmin;
      ymax = this.clippingArea.xmax;
    }

    const l = vec2.length(velYZ) * 100;
    const h = this.meshSlicePlateHeight;

    // y = a * x + b
    const pto = [my + norm[0] * h, z + -norm[1] * h];
    const a = norm[1] / norm[0];
    const c = pto[1] - a * pto[0];

    const [ cy1 ] = this.intersectLineLine(a, c, 0, z + h);
    const [ cy2 ] = this.intersectLineLine(a, c, 0, z);

    const dy = my + norm[0] * l;
    const dz = z + norm[1] * l;

    const zd = this.meshSliceHeight;

    const gap = 400;

    const position = [
      mx, ymin, z + h,
      mx, cy1, z + h,
      mx, cy1 + gap, z + h,
      mx, ymax, z + h,

      mx, ymin, z,
      mx, my, z,
      mx, cy2, z,
      mx, cy2 + gap, z,
      mx, ymax, z,

      mx, dy, dz,
      mx, dy - norm[1] * h, dz + norm[0] * h,

      mx, ymin, z - zd,
      mx, ymax, z - zd
    ];

    const pt = new Point({ spatialReference: this.clippingArea.spatialReference });

    for (let i = 0; i < nElevSamples; i++) {
      pt.x = mx;
      pt.y = i / (nElevSamples - 1) * (ymax - ymin) + ymin;

      if (axis === 1) {
        [pt.x, pt.y] = [pt.y, pt.x];
      }

      pt.z = this.elevationSampler.elevationAt(pt);

      if (axis === 1) {
        [pt.x, pt.y] = [pt.y, pt.x];
      }

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

    if (axis === 1) {
      // Swap x/y in vertex attributes
      for (let i = 0; i < position.length; i += 3) {
        const x = position[i + 0];
        const y = position[i + 1];

        position[i + 0] = y;
        position[i + 1] = x;
      }
    }

    let band: Mesh = null;
    let earthFaces: number[];

    if (measurement) {
      band = new Mesh({
        vertexAttributes: {
          position,
          uv
        },

        components: [
          {
            faces: [
              0, 4, 1,
              4, 5, 1,
              5, 6, 1,
              5, 9, 6,
              6, 9, 10
            ],

            material: {
              color: this.texturePlate1
            }
          },
          {
            faces: [
              3, 7, 2,
              3, 8, 7
            ],

            material: {
              color: this.texturePlate2
            }
          }
        ],

        spatialReference: this.clippingArea.spatialReference
      });

      earthFaces = [
        4, 5, 11,
        5, 9, 11,
        9, 12, 11,
        10, 12, 9,
        10, 8, 12,
        7, 8, 10,
        6, 7, 10,
        2, 7, 6,
        2, 6, 1
      ];
    }
    else {
      earthFaces = [
        0, 3, 11,
        11, 3, 12
      ];
    }

    let facePtr = 13;

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

      spatialReference: this.clippingArea.spatialReference
    });

    return { band, earth } as any;
  }

  private update() {
    if (!this.measurements) {
      this.graphics.removeAll();
      return;
    }

    const currentGraphics = this.graphics.toArray();

    const nSlices: number = 2;
    const clip = this.clippingArea;

    for (let i = 0; i < nSlices; i++) {
      const dx = nSlices === 1 ? 0 : i / (nSlices - 1);
      const x = clip.xmin + dx * clip.width;

      // Figure out the position and velocity of a measurment that crosses
      // through this x coordinate
      const measurement = this.findMeasurementAt(x, clip.ymin, clip.ymax);

      // Generate mesh out of slice to represent the tectonic movement
      const sliceMeshes = this.createMeshSlice(measurement, x, 0);

      if (sliceMeshes.band) {
        const graphic = new Graphic({
          geometry: sliceMeshes.band,
          symbol: this.symbolBand
        });

        this.graphics.add(graphic);
      }

      if (sliceMeshes.earth) {
        const graphic = new Graphic({
          geometry: sliceMeshes.earth,
          symbol: this.symbolEarth
        });

        this.graphics.add(graphic);
      }
    }

    // Add meshes to close the box
    this.graphics.add(new Graphic({
      geometry: this.createMeshSlice(null, this.clippingArea.ymin, 1).earth,
      symbol: this.symbolEarth
    }));

    this.graphics.add(new Graphic({
      geometry: this.createMeshSlice(null, this.clippingArea.ymax, 1).earth,
      symbol: this.symbolEarth
    }));

    this.graphics.removeMany(currentGraphics);
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
  symbolBand: esri.MeshSymbol3D;
  symbolEarth: esri.MeshSymbol3D;
  clippingArea: Extent;
  elevationSampler: esri.ElevationSampler;
}

interface Measurement {
  location: Point;
  velocity: Velocity;
}

interface Velocity {
  angle: number;
  length: number;
}

export default TectonicPlatesLayer;
