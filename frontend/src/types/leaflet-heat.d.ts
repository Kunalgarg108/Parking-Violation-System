import * as L from 'leaflet';

declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]> | Array<L.LatLng>,
    options?: HeatLayerOptions
  ): HeatLayer;

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number]> | Array<L.LatLng>): this;
    addLatLng(latlng: [number, number, number] | L.LatLng): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }
}
