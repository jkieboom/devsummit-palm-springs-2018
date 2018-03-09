/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

// esri
import { Point, Extent, SpatialReference } from "esri/geometry";

// esri.core
import Accessor = require("esri/core/Accessor");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

/**
 * Represents the viewport of the slice of surface that we want to view.
 * The viewport computes a clipping area based on the center of the
 * viewport and a fixed size.
 */
@subclass()
export class Viewport extends declared(Accessor) {

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  size
  //----------------------------------

  @property()
  size = 20000;

  //----------------------------------
  //  center
  //----------------------------------

  @property()
  center: Point = new Point({
    x: 9745688.759045323,
    y: 3118756.1269532256,
    spatialReference: SpatialReference.WebMercator
  });

  //----------------------------------
  //  clippingArea
  //----------------------------------

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

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Applies an offset to the center of the viewport.
   *
   * @param x the x offset.
   * @param y the y offset.
   */
  offset(dx: number, dy: number) {
    const { x, y, spatialReference } = this.center;
    this.center = new Point({ x: x + dx, y: y + dy, spatialReference });
  }
}

export default Viewport;
