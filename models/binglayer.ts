import { ILayerOptions } from "../interfaces/ilayeroptions";
import { Layer } from "./layer";
import { Marker } from "./marker";
import { InfoWindow } from "./infowindow";
import { BingMapService } from "../services/bingmapservice";
import { MapService} from "../services/mapservice";

/**
 * Concrete implementation of a map layer for the Bing Map Provider.
 * 
 * @export
 * @class BingLayer
 * @implements {Layer}
 */
export class BingLayer implements Layer {
    
    ///
    /// Property definitions
    ///

    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.Layer.
     * 
     * @memberof BingLayer
     */
    public get NativePrimitve(): any {
        return this._layer;
    }

    ///
    /// Constructor
    ///

    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer. 
     * 
     * @memberof BingLayer   
     */
    constructor(private _layer: Microsoft.Maps.Layer, private _maps: MapService){ }


    ///
    /// Public methods, Layer interface implementation
    ///

    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native 
     * layer supports.
     * @param fn function. Handler to call when the event occurs. 
     * 
     * @memberof BingLayer
     */
    public AddListener(eventType: string, fn: Function): void {
        Microsoft.Maps.Events.addHandler(this._layer, eventType, (e) => {
            fn(e);
        });
    }

    /**
     * Adds an entity to the layer.
     *
     * @param entity Marker|InfoWindow|any. Entity to add to the layer.
     * 
     * @memberof BingLayer
     */
    public AddEntity(entity: Marker|InfoWindow|any): void {
        if(entity.NativePrimitve) this._layer.add(entity.NativePrimitve);
    }

    /**
     * Deletes the layer.
     * 
     * @memberof BingLayer
     */
    public Delete(): void{
        this._maps.DeleteLayer(this);
        this._layer.dispose();
    }
    
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     * 
     * @memberof BingLayer
     */
    public GetOptions(): ILayerOptions{
        let o: ILayerOptions = {
            id: Number(this._layer.getId())
        };
        return o;
    }

    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     * 
     * @memberof BingLayer
     */
    public GetVisible(): boolean  {
        return this._layer.getVisible();
    }

    /**
     * Removes an entity from the cluster layer. 
     *
     * @param entity Marker|InfoWindow|any Entity to be removed from the layer.
     * 
     * @memberof BingLayer
     */
    public RemoveEntity(entity: Marker|InfoWindow|any): void {
        if(entity.NativePRimitive) this._layer.remove(entity.NativePrimitve);
    }

    /**
     * Sets the entities for the cluster layer. 
     *
     * @param entities Array<Marker>|Array<InfoWindow>|Array<any> containing the entities to add to the cluster. This replaces any existing entities.
     * 
     * @memberof BingLayer
     */
    public SetEntities(entities: Array<Marker>|Array<InfoWindow>|Array<any>): void {
        let p: Array<Microsoft.Maps.IPrimitive> = new Array<Microsoft.Maps.IPrimitive>();
        (<Array<any>>entities).forEach((e:any) => { if(e.NativePrimitve) p.push(<Microsoft.Maps.IPrimitive>e.NativePrimitve); }); 
        this._layer.setPrimitives(p);
    }
    
    /**
     * Sets the options for the cluster layer. 
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     * 
     * @memberof BingLayer
     */
    public SetOptions(options: ILayerOptions){
        this._layer.id = options.id.toString();
    }

    /**
     * Toggles the cluster layer visibility. 
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     * 
     * @memberof BingClusterLayer
     */
    public SetVisible(visible: boolean): void {
        this._layer.setVisible(visible);
    }

}