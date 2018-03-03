/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import Accessor = require("esri/core/Accessor");
import { Extent } from "esri/geometry";
import { Viewport } from "./Viewport";

@subclass()
export class ScrollAlong extends declared(Accessor) {
  @property({ constructOnly: true })
  readonly view: esri.SceneView;

  @property({ constructOnly: true })
  readonly viewport: Viewport;

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.view.on("mouse-wheel", ev => this.onMouseWheel(ev));
    this.viewport.watch("clippingArea", (newValue, oldValue) => this.update(newValue, oldValue));
  }

  private onMouseWheel(ev: esri.SceneViewMouseWheelEvent) {
    // Allow by-passing of scroll hijack by Ctrl key
    if (ev.native.ctrlKey) {
      return;
    }

    const moveVelocity = 10;
    this.viewport.offset(0, ev.deltaY * moveVelocity);
    ev.stopPropagation();
  }

  private update(newValue: Extent, oldValue: Extent) {
    const dx = newValue.center.x - oldValue.center.x;
    const dy = newValue.center.y - oldValue.center.y;

    const camera = this.view.camera.clone();
    camera.position.x += dx;
    camera.position.y += dy;

    this.view.clippingArea = this.viewport.clippingArea;
    this.view.camera = camera;
  }
}

interface ConstructProperties { 
  view: esri.SceneView;
  viewport: Viewport;
}

export default ScrollAlong;
