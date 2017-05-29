﻿import { Injectable, NgZone } from "@angular/core";
import { Observer } from "rxjs/Observer";
import { Observable } from "rxjs/Observable";

import { MapService } from "./mapservice";
import { MapAPILoader } from "./mapapiloader";
import { BingMapAPILoader, BingMapAPILoaderConfig } from "./bingmapapiloader"
import { BingConversions } from "./bingconversions"
import { Marker } from "../models/marker";
import { MarkerTypeId } from "../models/markertypeid";
import { InfoWindow } from "../models/infowindow"
import { BingMarker } from "../models/bingmarker";
import { Layer } from "../models/layer";
import { BingLayer } from "../models/binglayer";
import { BingClusterLayer } from "../models/bingclusterlayer";
import { BingInfoWindow } from "../models/binginfowindow";
import { ILayerOptions} from "../interfaces/ilayeroptions"; 
import { IClusterOptions } from "../interfaces/iclusteroptions";
import { IMapOptions } from "../interfaces/imapoptions";
import { ILatLong } from "../interfaces/ilatlong";
import { IPoint } from "../interfaces/ipoint";
import { IMarkerOptions } from "../interfaces/imarkeroptions";
import { IMarkerIconInfo } from "../interfaces/imarkericoninfo";
import { IInfoWindowOptions } from "../interfaces/iinfowindowoptions";

/**
 * Concrete implementation of the MapService abstract implementing a Bin Map V8 provider
 * 
 * @export
 * @class BingMapService
 * @implements {MapService}
 */
@Injectable()
export class BingMapService implements MapService {

    ///
    /// Field Declarations
    ///

    private _map: Promise<Microsoft.Maps.Map>;
    private _mapInstance: Microsoft.Maps.Map;
    private _mapResolver: (value?: Microsoft.Maps.Map) => void;
    private _config: BingMapAPILoaderConfig;

    ///
    /// Property Definitions
    ///


    /**
     * Gets the Bing Map control instance underlying the implementation
     * 
     * @readonly
     * @type {Microsoft.Maps.Map}
     * @memberof BingMapService
     */
    public get MapInstance():Microsoft.Maps.Map {return this._mapInstance; }

    /**
     * Gets a Promise for a Bing Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you 
     * are not sure if and when the instance will be created. 
     * @readonly
     * @type {Promise<Microsoft.Maps.Map>}
     * @memberof BingMapService
     */
    public get MapPromise():Promise<Microsoft.Maps.Map> { return this._map; }

    ///
    /// Constructor
    ///

    /**
     * Creates an instance of BingMapService.
     * @param {MapAPILoader} _loader MapAPILoader instance implemented for Bing Maps. This instance will generally be injected. 
     * @param {NgZone} _zone NgZone object to enable zone aware promises. This will generally be injected. 
     * 
     * @memberof BingMapService
     */
    constructor(private _loader: MapAPILoader, private _zone: NgZone) {
        this._map = new Promise<Microsoft.Maps.Map>((resolve: () => void) => { this._mapResolver = resolve; });
        this._config = (<BingMapAPILoader>this._loader).Config;
    }

    ///
    /// Public methods and MapService interface implementation
    ///

    /**
     * Creates a Bing map cluster layer within the map context
     * 
     * @param {IClusterOptions} options - Options for the layer. See {@link IClusterOptions}.
     * @returns {Promise<Layer>} - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.ClusterLayer object. 
     * 
     * @memberof BingMapService
     */
    public CreateClusterLayer(options: IClusterOptions): Promise<Layer> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            let p: Promise<Layer> = new Promise<Layer>( resolve => {
                Microsoft.Maps.loadModule("Microsoft.Maps.Clustering", () => {
                    let o:Microsoft.Maps.IClusterLayerOptions = BingConversions.TranslateClusterOptions(options);
                    let layer: Microsoft.Maps.ClusterLayer = new Microsoft.Maps.ClusterLayer( new Array<Microsoft.Maps.Pushpin>(), o);
                    let bl:BingClusterLayer;
                    map.layers.insert(layer);
                    bl = new BingClusterLayer(layer, this);
                    bl.SetOptions(options);
                    resolve(bl);
                });
            });
            return p;
        });
    }

    /**
     * Creates an information window for a map position
     * 
     * @param {IInfoWindowOptions} [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns {Promise<InfoWindow>} - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object. 
     * 
     * @memberof BingMapService
     */
    public CreateInfoWindow(options?: IInfoWindowOptions): Promise<InfoWindow> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            let loc: Microsoft.Maps.Location;
            if (options.position == null) loc = map.getCenter();
            else {
                loc = new Microsoft.Maps.Location(options.position.latitude, options.position.longitude);
            }
            let infoBox: Microsoft.Maps.Infobox = new Microsoft.Maps.Infobox(loc, BingConversions.TranslateInfoBoxOptions(options));
            infoBox.setMap(map);
            return new BingInfoWindow(infoBox);
        });
    }

    /**
     * Creates a map layer within the map context
     * 
     * @param {ILayerOptions} options - Options for the layer. See {@link ILayerOptions}
     * @returns {Promise<Layer>} - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object. 
     * 
     * @memberof BingMapService
     */
    public CreateLayer(options: ILayerOptions): Promise<Layer> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            let layer: Microsoft.Maps.Layer = new Microsoft.Maps.Layer(options.id.toString());
            map.layers.insert(layer);
            return new BingLayer(layer, this);
        });
    }

    /**
     * Creates a map instance
     * 
     * @param {HTMLElement} el - HTML element to host the map. 
     * @param {IMapOptions} mapOptions - Map options
     * @returns {Promise<void>} - Promise fullfilled once the map has been created. 
     * 
     * @memberof BingMapService
     */
    public CreateMap(el: HTMLElement, mapOptions: IMapOptions): Promise<void> {
        return this._loader.Load().then(() => {
            if (this._mapInstance != null) this.DisposeMap();
            let o: Microsoft.Maps.IMapLoadOptions = BingConversions.TranslateLoadOptions(mapOptions);
            if (!o.credentials) o.credentials = this._config.apiKey;
            let map = new Microsoft.Maps.Map(el, o);
            this._mapInstance = map;
            this._mapResolver(map);
            return;
        });
    }

    /**
     * Creates a Bing map marker within the map context
     * 
     * @param {IMarkerOptions} [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns {Promise<Marker>} - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object. 
     * 
     * @memberof BingMapService
     */
    public CreateMarker(options: IMarkerOptions = <IMarkerOptions>{}): Promise<Marker> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            let loc: Microsoft.Maps.Location = BingConversions.TranslateLocation(options.position);
            let o: Microsoft.Maps.IPushpinOptions = BingConversions.TranslateMarkerOptions(options);
            if (o.icon == null) {
                let s: number = 48;
                let iconInfo: IMarkerIconInfo = {
                    markerType: MarkerTypeId.CanvasMarker,
                    rotation: 45,
                    drawingOffset: { x: 24, y: 0 },
                    points: [
                        { x: 10, y: 40 },
                        { x: 24, y: 30 },
                        { x: 38, y: 40 },
                        { x: 24, y: 0 }
                    ],
                    color: "#f00",
                    size: { width: s, height: s }
                };
                o.icon = Marker.CreateMarker(iconInfo);
                o.anchor = new Microsoft.Maps.Point(iconInfo.size.width * 0.75, iconInfo.size.height * 0.25);
                o.textOffset = new Microsoft.Maps.Point(0, iconInfo.size.height * 0.66);
            }
            let pushpin: Microsoft.Maps.Pushpin = new Microsoft.Maps.Pushpin(loc, o);
            map.entities.push(pushpin);
            return new BingMarker(pushpin);
        });
    }

    /**
     * Deletes a layer from the map.
     * 
     * @param {Layer} layer - Layer to delete. See {@link Layer}. This method expects the Bing specific Layer model implementation. 
     * @returns {Promise<void>} - Promise fullfilled when the layer has been removed. 
     * 
     * @memberof BingMapService
     */
    public DeleteLayer(layer: Layer): Promise<void> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            map.layers.remove(layer.NativePrimitve);
        });        
    }

    /**
     * Dispaose the map and associated resoures.
     * 
     * @returns {void} 
     * 
     * @memberof BingMapService
     */
    public DisposeMap(): void {
        if (this._map == null && this._mapInstance == null) return;
        if (this._mapInstance != null) {
            this._mapInstance.dispose();
            this._mapInstance = null;
            this._map = new Promise<Microsoft.Maps.Map>((resolve: () => void) => { this._mapResolver = resolve; });
        } 
    }

    /**
     * Gets the geo coordinates of the map center
     * 
     * @returns {Promise<ILatLong>} - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}. 
     * 
     * @memberof BingMapService
     */
    public GetCenter(): Promise<ILatLong> {
        return this._map.then((map: Microsoft.Maps.Map) => {
            let center = map.getCenter();
            return <ILatLong>{
                latitude: center.latitude,
                longitude: center.longitude
            };
        });
    }

    /**
     * Gets the current zoom level of the map. 
     * 
     * @returns {Promise<number>} - A promise that when fullfilled contains the zoom level. 
     * 
     * @memberof BingMapService
     */
    public GetZoom(): Promise<number> {
        return this._map.then((map: Microsoft.Maps.Map) => map.getZoom());
    }

    /**
     * Provides a conversion of geo coordinates to pixels on the map control. 
     * 
     * @param {ILatLong} loc - The geo coordinates to translate.
     * @returns {Promise<IPoint>} - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null 
     * if the goe coordinates are not in the view port. 
     * 
     * @memberof BingMapService
     */
    public LocationToPoint(loc: ILatLong): Promise<IPoint> {
        return this._map.then((m: Microsoft.Maps.Map) => {
            let l: Microsoft.Maps.Location = BingConversions.TranslateLocation(loc);
            let p: Microsoft.Maps.Point = <Microsoft.Maps.Point>m.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
            if (p != null) return { x: p.x, y: p.y };
            return null;
        })
    }

    /**
     * Centers the map on a geo location. 
     * 
     * @param {ILatLong} latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns {Promise<void>} - Promise that is fullfilled when the center operations has been completed.
     * 
     * @memberof BingMapService
     */
    public SetCenter(latLng: ILatLong): Promise<void> {
        return this._map.then((map: Microsoft.Maps.Map) => map.setView({
            center: BingConversions.TranslateLocation(latLng)
        }));
    }

    /**
     * Sets the generic map options. 
     * 
     * @param {IMapOptions} options - Options to set.
     * 
     * @memberof BingMapService
     */
    public SetMapOptions(options: IMapOptions) {
        this._map.then((m: Microsoft.Maps.Map) => {
            let o: Microsoft.Maps.IMapOptions = BingConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }

    /**
     * Sets the view options of the map. 
     * 
     * @param {IMapOptions} options - Options to set.
     * 
     * @memberof BingMapService
     */
    public SetViewOptions(options: IMapOptions) {
        this._map.then((m: Microsoft.Maps.Map) => {
            let o: Microsoft.Maps.IViewOptions = BingConversions.TranslateViewOptions(options);
            m.setView(o);
        });
    }

    /**
     * Sets the zoom level of the map. 
     * 
     * @param {number} zoom - Zoom level to set. 
     * @returns {Promise<void>} - A Promise that is fullfilled once the zoom operation is complete. 
     * 
     * @memberof BingMapService
     */
    public SetZoom(zoom: number): Promise<void> {
        return this._map.then((map: Microsoft.Maps.Map) => map.setView({
            zoom: zoom
        }));
    }

    /**
     * Creates an event subscription
     * 
     * @template E - Generic type of the underlying event. 
     * @param {string} eventName - The name of the event (e.g. "click")
     * @returns {Observable<E>} - An observable of tpye E that fires when the event occurs. 
     * 
     * @memberof BingMapService
     */
    public SubscribeToMapEvent<E>(eventName: string): Observable<E> {
        return Observable.create((observer: Observer<E>) => {
            this._map.then((m: Microsoft.Maps.Map) => {
                Microsoft.Maps.Events.addHandler(m, eventName, (e: any) => {
                    this._zone.run(() => observer.next(e));
                });
            });
        });
    }

    /**
     * Triggers the given event name on the map instance.
     * 
     * @param {string} eventName - Event to trigger.
     * @returns {Promise<void>} - A promise that is fullfilled once the event is triggered. 
     * 
     * @memberof BingMapService
     */
    public TriggerMapEvent(eventName: string): Promise<void> {
        return this._map.then((m) => Microsoft.Maps.Events.invoke(m, eventName, null));
    }

}