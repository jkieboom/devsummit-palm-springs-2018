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

    this.update();

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
  //  location
  //----------------------------------

  @property()
  set location(value: Point) {
    this._set("location", value);
    this.update();
  }

  //----------------------------------
  //  element
  //----------------------------------

  @property({ constructOnly: true })
  readonly element: HTMLElement;

  @property({ value: 0 })
  set heading(value: number) {
    this._set("heading", value);
    this.update();
  }

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
    if (!this.view.ready || !this.location) {
      return;
    }

    if (!this.element.classList.contains("make-visible")) {
      this.element.classList.add("make-visible");
    }

    const screenLocation = this.view.toScreen(this.location);

    // Figure out the absolute translation to position the bottom center
    // of the element in between s1 and s2
    const translationX = -this.element.clientWidth / 2 + screenLocation.x;
    const translationY = screenLocation.y - this.element.clientHeight;

    // Figure out the rotation based on the heading and tilt of the camera
    const heading = this.view.camera.heading - this.heading;

    // Heading translates to rotation around the Y axis. Since we are positioning
    // the element on the ymin plane of the clipping area, we add 180 degrees
    // to the camera heading. We also have to rotate in the opposite direction
    // as the camera heading since the element is facing the camera.
    const rotationY = -(heading < 180 ? heading + 360 : heading);

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
  element: HTMLElement;
  location?: Point;
  heading?: number;
}

export default DOMElement3D;
