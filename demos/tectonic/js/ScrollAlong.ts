/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

// esri
import { Extent, Polyline, Point } from "esri/geometry";

// esri.core
import Accessor = require("esri/core/Accessor");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// app
import { Viewport } from "./Viewport";
import { CatmullRom } from "./CatmullRom";
import { vec2 } from "gl-matrix";

@subclass()
export class ScrollAlong extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.view.on("mouse-wheel", ev => this.onMouseWheel(ev));
    this.viewport.watch("clippingArea", () => this.updateViewCamera());

    const path = this.path.paths[0];

    this.interpolatedPath = new CatmullRom({ points: path });
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  view
  //----------------------------------

  @property({ constructOnly: true })
  readonly view: esri.SceneView;

  //----------------------------------
  //  viewport
  //----------------------------------

  @property({ constructOnly: true })
  readonly viewport: Viewport;

  //----------------------------------
  //  path
  //----------------------------------

  @property({ constructOnly: true })
  readonly path: Polyline;

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  private interpolatedPath: CatmullRom;
  private positionOnPath = 0;
  private userHeadingDelta = 0;

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Handle a mouse wheel event by updating the viewport so that
   * we scroll through a slice of the terrain, following the
   * provided path.
   *
   * @param ev mouse wheel event.
   */
  private onMouseWheel(ev: esri.SceneViewMouseWheelEvent) {
    // Allow by-passing of scroll hijack by Ctrl key
    if (ev.native.ctrlKey) {
      return;
    }

    const moveVelocity = 0.0001;
    this.moveAlongPath(ev.deltaY * moveVelocity);

    // Avoid regular navigation (zoom) from mouse wheel.
    ev.stopPropagation();
  }

  /**
   * Move the viewport along the path by the provided delta.
   *
   * @param delta normalized path delta (from 0 to 1)
   */
  private moveAlongPath(delta: number) {
    // Calculate the desired heading along the path
    const pathHeading = this.calculatePathHeading(this.positionOnPath);

    // Store the delta between the desired and current heading
    // so we preserve heading offset caused by user interaction
    const userHeadingDelta = this.view.camera.heading - pathHeading;

    // Update userHeadingDelta with a threshold to avoid drifting
    // caused by numerical errors.
    if (Math.abs(userHeadingDelta - this.userHeadingDelta) > 1) {
      this.userHeadingDelta = userHeadingDelta;
    }

    // Update positionOnPath (between - and 1)
    const newPosition = this.positionOnPath + delta;
    this.positionOnPath = Math.min(Math.max(0, newPosition), 1);

    // Evaluate the interpolated path
    const center = this.interpolatedPath.evaluateAt(this.positionOnPath);

    // Update the viewport center with the new center
    this.viewport.center = new Point({
      x: center[0],
      y: center[1],
      spatialReference: this.path.spatialReference
    });
  }

  /**
   * Calculates the heading of the path at the provided position
   * by taking a three point average of the path.
   *
   * @param t the position on the path.
   */
  private calculatePathHeading(t: number) {
    // Three point average heading at the interpolated path
    const p0 = this.interpolatedPath.evaluateAt(t - 0.001);
    const p1 = this.interpolatedPath.evaluateAt(t);
    const p2 = this.interpolatedPath.evaluateAt(t + 0.001);

    const h1 = this.computeHeading(p0, p1);
    const h2 = this.computeHeading(p1, p2);
    return (h1 + h2) / 2;
  }

  // Compute heading from a vector specified by two points
  private computeHeading(pt1: ArrayLike<number>, pt2: ArrayLike<number>) {
    const dir = vec2.normalize(vec2.create(), vec2.subtract(vec2.create(), pt2 as any, pt1 as any));
    const heading = Math.atan2(dir[0], dir[1]);

    // Convert to degrees
    return heading / Math.PI * 180;
  }

  /**
   * Update the view camera when the clipping area changes. This
   * updates both the view clipping area from the viewport clipping area,
   * and the camera to center on the new clipping area and preserve
   * the heading along the path.
   */
  private updateViewCamera() {
    const heading = this.calculatePathHeading(this.positionOnPath) + this.userHeadingDelta;

    this.view.clippingArea = this.viewport.clippingArea;

    const center = this.viewport.clippingArea.center.clone();
    center.z = 1500;

    this.view.goTo({
      target: center,
      scale: 171502,
      heading
    }, { animate: false });
  }
}

interface ConstructProperties {
  view: esri.SceneView;
  viewport: Viewport;
  path: Polyline;
}

export default ScrollAlong;
