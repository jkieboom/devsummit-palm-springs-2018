/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import Accessor = require("esri/core/Accessor");
import { Point } from "esri/geometry";
import { Viewport } from "./Viewport";
import { whenOnce } from "esri/core/watchUtils";

@subclass()
export class IntegratedTitle extends declared(Accessor) {
  @property({ constructOnly: true })
  readonly view: esri.SceneView;

  @property({ constructOnly: true })
  readonly viewport: Viewport;

  @property({ constructOnly: true })
  readonly element: HTMLElement;

  @property({ constructOnly: true })
  readonly elevation: number;

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

  private update() {
    if (!this.view.ready) {
      return;
    }

    const clip = this.view.clippingArea;
    const pt1 = new Point({ x: clip.xmin, y: clip.ymax, z: this.elevation, spatialReference: clip.spatialReference });
    const pt2 = new Point({ x: clip.xmax, y: clip.ymax, z: this.elevation, spatialReference: clip.spatialReference });

    const s1 = this.view.toScreen(pt1);
    const s2 = this.view.toScreen(pt2);

    const dx = -this.element.clientWidth / 2 + ((s1.x + s2.x) / 2);
    const dy = ((s1.y + s2.y) / 2);

    const heading = this.view.camera.heading;
    const ry = -(heading < 180 ? heading + 360 : heading);

    const translate = "translate(" + dx + "px, " + dy + "px)";
    const rotate = "rotateX(" +(90 - this.view.camera.tilt) + "deg) rotateY(" + ry + "deg)"

    this.element.style.transform = translate + rotate;
  }
}

interface ConstructProperties {
  view: esri.SceneView;
  viewport: Viewport;
  elevation: number;
  element: HTMLElement;
}

export default IntegratedTitle;
