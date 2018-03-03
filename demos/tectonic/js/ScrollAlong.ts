/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import Accessor = require("esri/core/Accessor");
import { Extent, Polyline, Point } from "esri/geometry";
import { Viewport } from "./Viewport";
import { CatmullRom } from "./CatmullRom";
import { vec2 } from "gl-matrix";

@subclass()
export class ScrollAlong extends declared(Accessor) {
  private interpolatedPath: CatmullRom;
  // private interpolatedHeading: CatmullRom;
  private positionOnPath = 0;

  @property({ constructOnly: true })
  readonly view: esri.SceneView;

  @property({ constructOnly: true })
  readonly viewport: Viewport;

  @property({ constructOnly: true })
  readonly path: Polyline;

  constructor(obj?: ConstructProperties) {
    super();
  }

  initialize() {
    this.view.on("mouse-wheel", ev => this.onMouseWheel(ev));
    this.viewport.watch("clippingArea", (newValue, oldValue) => this.update(newValue, oldValue));

    const path = this.path.paths[0];
    
    this.interpolatedPath = new CatmullRom({ points: path });
    
    // const headings = this.pathToHeadings(path);
    // this.interpolatedHeading = new CatmullRom({ points: headings, lengthNormalizationPoints: path });
  }

  // private pathToHeadings(path: ArrayLike<ArrayLike<number>>) {
  //   const headings: ArrayLike<number>[] = [0];
    
  //   for (let i = 0; i < path.length - 1; i++) {
  //     headings.push([this.computeHeading(path[i], path[i + 1])]);
  //   }

  //   headings.push(headings[headings.length - 1]);
  //   return headings;
  // }

  private computeHeading(pt1: ArrayLike<number>, pt2: ArrayLike<number>) {
    const dir = vec2.normalize(vec2.create(), vec2.subtract(vec2.create(), pt2 as any, pt1 as any));
    const heading = Math.atan2(dir[0], dir[1]);

    return heading;
  }

  private onMouseWheel(ev: esri.SceneViewMouseWheelEvent) {
    // Allow by-passing of scroll hijack by Ctrl key
    if (ev.native.ctrlKey) {
      return;
    }

    const moveVelocity = 0.0001;
    this.moveAlongPath(ev.deltaY * moveVelocity);
    ev.stopPropagation();
  }

  private moveAlongPath(delta: number) {
    const newPosition = this.positionOnPath + delta;
    this.positionOnPath = Math.min(Math.max(0, newPosition), 1);

    const center = this.interpolatedPath.evaluateAt(this.positionOnPath);

    this.viewport.center = new Point({
      x: center[0],
      y: center[1],
      spatialReference: this.path.spatialReference
    });
  }

  private update(newValue: Extent, oldValue: Extent) {
    // const dx = newValue.center.x - oldValue.center.x;
    // const dy = newValue.center.y - oldValue.center.y;

    const p0 = this.interpolatedPath.evaluateAt(this.positionOnPath - 0.001);
    const p1 = this.interpolatedPath.evaluateAt(this.positionOnPath);
    const p2 = this.interpolatedPath.evaluateAt(this.positionOnPath + 0.001);

    const h1 = this.computeHeading(p0, p1);
    const h2 = this.computeHeading(p1, p2);
    const heading = (h1 + h2) / 2 / Math.PI * 180;

    this.view.clippingArea = this.viewport.clippingArea;

    const center = this.viewport.clippingArea.center.clone();
    center.z = 2500;

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
