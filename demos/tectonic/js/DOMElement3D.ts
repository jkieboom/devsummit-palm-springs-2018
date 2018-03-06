/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

// esri
import { Point } from "esri/geometry";

// esri.core
import Accessor = require("esri/core/Accessor");
import { whenOnce } from "esri/core/watchUtils";

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// app
import { Viewport } from "./Viewport";

/**
 * A DOM element that is positioned in 3D by tracking
 * a point on the viewport.
 */
@subclass()
export class DOMElement3D extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.view.watch(["camera", "size"], () => this.update());
    this.viewport.watch("clippingArea", () => this.update());

    this.update();
    this.element.classList.add("make-visible");

    whenOnce(this.view, "ready", () => this.update());
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
  //  element
  //----------------------------------

  @property({ constructOnly: true })
  readonly element: HTMLElement;

  //----------------------------------
  //  elevation
  //----------------------------------

  @property({ constructOnly: true })
  readonly elevation: number;

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Updates the position and orientation of the DOM element. This is
   * called whenever the view or the clipping area has changed.
   */
  private update() {
    if (!this.view.ready) {
      return;
    }

    const clip = this.view.clippingArea;
    const spatialReference = clip.spatialReference;

    // Position the element in between the ymin segment of the clipping area
    const pt1 = new Point({ x: clip.xmin, y: clip.ymin, z: this.elevation, spatialReference });
    const pt2 = new Point({ x: clip.xmax, y: clip.ymin, z: this.elevation, spatialReference });

    // Convert the map points to screen coordinates
    const s1 = this.view.toScreen(pt1);
    const s2 = this.view.toScreen(pt2);

    // Figure out the absolute translation to position the bottom center
    // of the element in between s1 and s2
    const translationX = (-this.element.clientWidth + s1.x + s2.x) / 2;
    const translationY = (s1.y + s2.y) / 2;

    // Figure out the rotation based on the heading and tilt of the camera
    const heading = this.view.camera.heading;

    // Heading translates to rotation around the Y axis. Since we are positioning
    // the element on the ymin plane of the clipping area, we add 180 degrees
    // to the camera heading. We also have to rotate in the opposite direction
    // as the camera heading since the element is facing the camera.
    const rotationY = -(heading < 180 ? heading + 360 : heading) + 180;

    // Tilt translates to rotation around the X axis, 90deg camera tilt means
    // 0 degree CSS rotation, so that the element is standing up from the surface
    const rotationX = 90 - this.view.camera.tilt;

    const translate = `translate(${translationX}px, ${translationY}px)`;
    const rotate = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

    this.element.style.transform = `${translate} ${rotate}`;
  }
}

interface ConstructProperties {
  view: esri.SceneView;
  viewport: Viewport;
  elevation: number;
  element: HTMLElement;
}

export default DOMElement3D;
