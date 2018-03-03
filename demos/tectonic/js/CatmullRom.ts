/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

// import esri = __esri;

import Accessor = require("esri/core/Accessor");
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

@subclass()
export class CatmullRom extends declared(Accessor) {
  private segments: Segment[];

  @property({ constructOnly: true })
  readonly points: ArrayLike<P>;

  @property({ constructOnly: true })
  readonly lengthNormalizationPoints: ArrayLike<P>;

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.computeSegments();
  }

  evaluateAt(t: number): ArrayLike<number> {
    for (const segment of this.segments) {
      if (t <= segment.end) {
        const trel = (t - segment.start) / (segment.end - segment.start);
        return this.evaluateSegment(segment, trel);
      }
    }

    return null;
  }

  private evaluateSegment(segment: Segment, t: number): number[] {
    return segment.coefficients.map(coefficients => this.evaluateCoefficients(coefficients, t));
  }

  private evaluateCoefficients(coefficients: number[], t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;

    return t3 * coefficients[0] + t2 * coefficients[1] + t * coefficients[2] + coefficients[3];
  }

  private computeSegments() {
    let totalLength = 0;
    let segments: Segment[] = [];

    const lengthNormalizationPoints = this.lengthNormalizationPoints || this.points;

    // Ignore start/end, generate coefficients for all segments in between
    for (let i = 1; i < this.points.length - 2; i++) {
      const p0 = this.points[i - 1];
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const p3 = this.points[i + 2];

      const l1 = lengthNormalizationPoints[i];
      const l2 = lengthNormalizationPoints[i + 1];

      const length = this.dist(l1, l2);
      const coefficients = this.computeCoefficients(p0, p1, p2, p3);

      segments.push({ start: totalLength, end: totalLength + length, coefficients });
      totalLength += length;
    }

    for (let segment of segments) {
      segment.start /= totalLength;
      segment.end /= totalLength;
    }

    this.segments = segments;
  }

  private dist(p1: ArrayLike<number>, p2: ArrayLike<number>): number {
    let s = 0;

    for (let i = 0; i < p1.length; i++) {
      const d = p1[i] - p2[i];
      s += d * d;
    }

    return Math.sqrt(s);
  }

  private computeCoefficients(p0: P, p1: P, p2: P, p3: P): Coefficients[] {
    const coefficients: Coefficients[] = [];

    for (let i = 0; i < p0.length; i++) {
      const coefficient = this.computeCoefficient1D(p0, p1, p2, p3, i);
      coefficients.push(coefficient);
    }

    return coefficients;
  }

  private computeCoefficient1D(p0: P, p1: P, p2: P, p3: P, i: number): Coefficients {
    const a = -p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i];
    const b = 2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i];
    const c = p2[i] - p0[i];
    const d = 2 * p1[i];

    return [0.5 * a, 0.5 * b, 0.5 * c, 0.5 * d];
  }
}

export type P = ArrayLike<number>;
type Coefficients = [number, number, number, number];

interface ConstructProperties {
  points: ArrayLike<P>;
  lengthNormalizationPoints?: ArrayLike<P>;
}

interface Segment {
  coefficients: Coefficients[];

  start: number;
  end: number;
}

export default CatmullRom;
