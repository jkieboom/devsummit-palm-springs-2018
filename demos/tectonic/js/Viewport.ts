/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";
import Accessor = require("esri/core/Accessor");

import { Point, Extent, SpatialReference } from "esri/geometry";

@subclass()
export class Viewport extends declared(Accessor) {
  @property()
  size = 20000;

  @property()
  center: Point = new Point({
    x: -7792590.411313316,
    y: -3559092.9854301936,
    spatialReference: SpatialReference.WebMercator
  })

  @property({ dependsOn: ["size", "center"], readOnly: true })
  get clippingArea(): Extent {
    const halfSize = this.size / 2;
    const center = this.center;

    return new Extent({
      xmin: center.x - halfSize,
      xmax: center.x + halfSize,
      ymin: center.y - halfSize,
      ymax: center.y + halfSize,

      spatialReference: SpatialReference.WebMercator
    });
  }

  offset(x: number, y: number) {
    this.center = new Point({ x: this.center.x + x, y: this.center.y + y, spatialReference: this.center.spatialReference });
  }
}

export default Viewport;
