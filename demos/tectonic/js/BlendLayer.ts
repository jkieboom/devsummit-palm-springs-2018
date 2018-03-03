/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

import esri = __esri;

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import promiseUtils = require("esri/core/promiseUtils");
import BaseTileLayer = require("esri/layers/BaseTileLayer");

@subclass()
export class BlendLayer extends declared(BaseTileLayer) {
  @property({ constructOnly: true })
  readonly multiplyLayers: esri.TileLayer[];

  constructor(obj?: ConstructProperties) {
    super();
  }

  load(): IPromise<any> {
    for (const layer of this.multiplyLayers) {
      this.addResolvingPromise(layer.load());
    }

    return;
  }

  // Fetches the tile(s) visible in the view
  fetchTile(level: number, row: number, col: number) {
    return promiseUtils.resolve()
        .then(() => this._fetchTile(level, row, col));
  }

  private async _fetchTile(level: number, row: number, col: number) {
    const tilePromises = this.multiplyLayers.map(layer => {
      // calls fetchTile() on the tile layers returned in multiplyLayers property
      // for the tiles visible in the view
      return layer.fetchTile(level, row, col, { allowImageDataAccess: true });
    });

    const images = await Promise.all(tilePromises);

    // create a canvas
    var width = this.tileInfo.size[0];
    var height = this.tileInfo.size[0];
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    context.globalCompositeOperation = "multiply";

    images.forEach(function (image) {
      context.drawImage(image, 0, 0, width, height);
    });

    return canvas;
  }
}

interface ConstructProperties {
  multiplyLayers: esri.TileLayer[];
}

export default BlendLayer;
