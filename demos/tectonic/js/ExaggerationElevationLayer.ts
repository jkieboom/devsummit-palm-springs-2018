/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
/// <amd-dependency path="esri/core/tsSupport/generatorHelper" name="__generator" />
/// <amd-dependency path="esri/core/tsSupport/awaiterHelper" name="__awaiter" />

import { subclass, property, declared } from "esri/core/accessorSupport/decorators";

import promiseUtils = require("esri/core/promiseUtils");
import BaseElevationLayer = require("esri/layers/BaseElevationLayer");
import ElevationLayer = require("esri/layers/ElevationLayer");

@subclass()
export class ExaggerationElevationLayer extends declared(BaseElevationLayer) {
  @property({ constructOnly: true })
  readonly elevationLayer: ElevationLayer;

  @property({ constructOnly: true })
  readonly exaggerationFactor: number | ((level: number) => number);

  constructor(obj?: ConstructProperties) {
    super();
  }

  load(): IPromise<any> {
    this._set("elevationLayer", new ElevationLayer({
      url: "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/TopoBathy3D/ImageServer"
    }));

    // wait for the elevation layer to load before resolving load()
    this.addResolvingPromise(this.elevationLayer.load());
    return;
  }

  fetchTile(level: number, row: number, col: number) {
    return this._fetchTile(level, row, col) as any;
  }

  private async _fetchTile(level: number, row: number, col: number) {
    const data = await this.elevationLayer.fetchTile(level, row, col);

    const multiplier = (
        typeof this.exaggerationFactor === "function"
      ? this.exaggerationFactor(level)
      : this.exaggerationFactor || 1
    );

    for (var i = 0; i < data.values.length; i++) {
      data.values[i] *= multiplier;
    }

    return data;
  }
}

interface ConstructProperties {
  elevationLayer: ElevationLayer;
  exaggerationFactor?: number | ((level: number) => number);
}

export default ExaggerationElevationLayer;
