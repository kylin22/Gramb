export default class Region {
    public id: string;
    public name: string;
    public description: string;
    public travelPrice: number;
    public image: string;

    constructor( id: string, name: string, travelPrice: number, description: string, image: string) {
        this.id = id;
        this.name = name;
        this.travelPrice = travelPrice;
        this.description = description;
        this.image = image;
    }
}