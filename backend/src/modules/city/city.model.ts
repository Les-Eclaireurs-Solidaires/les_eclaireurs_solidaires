import type { ICity } from "./city.interface.js";

export class City{
    private id: number;
    private name: string;
    private zip: string;
    
    constructor(param:ICity){
        this.id = param.id;
        this.name = param.name;
        this.zip = param.zip;
    }

}