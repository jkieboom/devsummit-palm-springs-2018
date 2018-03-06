/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

// esri.core
import promiseUtils = require("esri/core/promiseUtils");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri.layers
import BaseElevationLayer = require("esri/layers/BaseElevationLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");

/**
 * An elevation layer that exaggerates a source elevation layer
 * by multiplying elevation values by a constant.
 */
@subclass()
export class ExaggerationElevationLayer extends declared(BaseElevationLayer) {

  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(obj?: ConstructProperties) {
    super();
  }

  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------

  //----------------------------------
  //  elevationLayer
  //----------------------------------

  @property({ constructOnly: true })
  readonly elevationLayer: ElevationLayer;

  //----------------------------------
  //  exaggerationFactornts
  //----------------------------------

  @property({ constructOnly: true })
  readonly exaggerationFactor: number;

  //--------------------------------------------------------------------------
  //
  //  Public methods
  //
  //--------------------------------------------------------------------------

  load(): IPromise<any> {
    // wait for the elevation layer to load before resolving load()
    this.addResolvingPromise(this.elevationLayer.load());
    return;
  }

  /**
   * Fetches a single tile. This method is simply a wrapper around
   * the actual implementation that uses async/await.
   *
   * @param level the tile level.
   * @param row the tile row.
   * @param col the tile column.
   */
  fetchTile(level: number, row: number, col: number) {
    return this._fetchTile(level, row, col) as any;
  }

  //--------------------------------------------------------------------------
  //
  //  Private methods
  //
  //--------------------------------------------------------------------------

  /**
   * Fetches the tile at the specified level/row/col. The tile will
   * be composed of the tile from the underlying elevation layer,
   * with values exaggerated with the exaggeration factor.
   *
   * @param level the tile level.
   * @param row the tile row.
   * @param col the tile column.
   */
  private async _fetchTile(level: number, row: number, col: number) {
    const data = await this.elevationLayer.fetchTile(level, row, col);

    for (var i = 0; i < data.values.length; i++) {
      data.values[i] *= this.exaggerationFactor;
    }

    return data;
  }
}

interface ConstructProperties {
  elevationLayer: ElevationLayer;
  exaggerationFactor?: number;
}

export default ExaggerationElevationLayer;
