/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

import esri = __esri;

// esri.core
import promiseUtils = require("esri/core/promiseUtils");

// esri.core.accessorSupport
import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

// esri.layers
import BaseTileLayer = require("esri/layers/BaseTileLayer");

/**
 * Tile layer that blends multiple tile layers together using
 * a multiply operation. This is particularly useful to combine
 * a mask layer (such as a hillshade layer) with a basemap
 * layer (such as satellite imagery or a topographic layer).
 */
@subclass()
export class BlendLayer extends declared(BaseTileLayer) {
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
  //  multiplyLayers
  //----------------------------------

  @property({ constructOnly: true })
  readonly multiplyLayers: esri.TileLayer[];

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  load(): IPromise<any> {
    for (const layer of this.multiplyLayers) {
      this.addResolvingPromise(layer.load());
    }

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
    // Requires an any cast due to type incompatibility between
    // dojo promises and native promises.
    return this._fetchTile(level, row, col) as any;
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Fetches the tile at the specified level/row/col. The tile will
   * be composed of tiles fetched from the underlying layers by
   * the multiply operator.
   *
   * @param level the tile level.
   * @param row the tile row.
   * @param col the tile column.
   */
  private async _fetchTile(level: number, row: number, col: number) {
    const tilePromises = this.multiplyLayers.map(layer => {
      // calls fetchTile() on the tile layers returned in multiplyLayers property
      // for the tiles visible in the view. Wrap result in a native promise.
      return new Promise<HTMLImageElement | HTMLCanvasElement>((resolve, reject) => {
        layer.fetchTile(level, row, col, { allowImageDataAccess: true })
            .then(resolve, reject)
      });
    });

    // Wait for all images to resolve. Note that fetching happens in
    // parallel
    const images = await Promise.all(tilePromises);

    // Create a canvas to composite the images on
    var width = this.tileInfo.size[0];
    var height = this.tileInfo.size[0];
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    // Use multiply compositing
    context.globalCompositeOperation = "multiply";

    // Composite each of the images
    for (const image of images) {
      context.drawImage(image, 0, 0, width, height);
    }

    return canvas;
  }
}

interface ConstructProperties {
  multiplyLayers: esri.TileLayer[];
}

export default BlendLayer;
