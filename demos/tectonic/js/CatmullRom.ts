/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

// esri.core
import Accessor = require("esri/core/Accessor");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

/**
 * Implements catmull rom piecewise interpolation of a given
 * set of points. The resulting interpolation is normalized between
 * 0 and 1 where each segment is proportional to its relative
 * euclidean length.
 */
@subclass()
export class CatmullRom extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.computeSegments();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  points
  //----------------------------------

  /** The list of points to interpolate. */
  @property({ constructOnly: true })
  readonly points: ArrayLike<P>;

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private segments: Segment[];

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  evaluateAt(t: number): ArrayLike<number> {
    for (const segment of this.segments) {
      if (t <= segment.end) {
        const trel = (t - segment.start) / (segment.end - segment.start);
        return this.evaluateSegment(segment, trel);
      }
    }

    return null;
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Evaluates the coefficients that belong to a segment to interpolate
   * between its two end-points.
   *
   * @param segment the segment to evaluate.
   * @param t the position at which to evaluate (0 to 1)
   */
  private evaluateSegment(segment: Segment, t: number): number[] {
    return segment.coefficients.map(coefficients => this.evaluateCoefficients(coefficients, t));
  }

  /**
   * Evaluates the Catmull Rom coefficients.
   *
   * @param coefficients the coefficients.
   * @param t the position at which to evaluate (0 to 1)
   */
  private evaluateCoefficients(coefficients: number[], t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;

    return t3 * coefficients[0] + t2 * coefficients[1] + t * coefficients[2] + coefficients[3];
  }

  /**
   * Computes piecewise interpolated segments by calculating
   * Catmull Rom coefficients between each consequtive point.
   */
  private computeSegments() {
    let totalLength = 0;
    let segments: Segment[] = [];

    // Ignore start/end, generate coefficients for all segments in between
    for (let i = 1; i < this.points.length - 2; i++) {
      const p0 = this.points[i - 1];
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const p3 = this.points[i + 2];

      const length = this.dist(p1, p2);
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

  /**
   * Calculates the euclidean distance between two points
   * of the same dimension.
   *
   * @param p1 the first point.
   * @param p2 the second point.
   */
  private dist(p1: ArrayLike<number>, p2: ArrayLike<number>): number {
    let s = 0;

    for (let i = 0; i < p1.length; i++) {
      const d = p1[i] - p2[i];
      s += d * d;
    }

    return Math.sqrt(s);
  }

  /**
   * Computes the Catmull Rom coefficients for a multi-dimensional point.
   * This will simply calculate the coefficients for each dimension
   * separately (@see [computeCoefficients1D](#computeCoefficients1D)).
   *
   * @param p0 the first point.
   * @param p1 the second point.
   * @param p2 the third point.
   * @param p3 the fourth point.
   */
  private computeCoefficients(p0: P, p1: P, p2: P, p3: P): Coefficients[] {
    const coefficients: Coefficients[] = [];

    for (let i = 0; i < p0.length; i++) {
      const coefficient = this.computeCoefficient1D(p0[i], p1[i], p2[i], p3[i]);
      coefficients.push(coefficient);
    }

    return coefficients;
  }

  /**
   * Calculates the Catmull Rom coefficients between
   * p1 and p2. The resulting coefficients can be interpolated
   * between 0 and 1 to interpolate between p1 and p2.
   *
   * @param p0 the first coordinate.
   * @param p1 the second coordinate.
   * @param p2 the third coordinate.
   * @param p3 the fourth coordinate.
   */
  private computeCoefficient1D(p0: number, p1: number, p2: number, p3: number): Coefficients {
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 2 * p0 - 5 * p1 + 4 * p2 - p3;
    const c = p2 - p0;
    const d = 2 * p1;

    return [0.5 * a, 0.5 * b, 0.5 * c, 0.5 * d];
  }
}

export type P = ArrayLike<number>;
type Coefficients = [number, number, number, number];

interface ConstructProperties {
  points: ArrayLike<P>;
}

interface Segment {
  coefficients: Coefficients[];

  start: number;
  end: number;
}

export default CatmullRom;
