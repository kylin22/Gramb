export default class Region {
    public id: string;
    public name: string;
    public description: string;
    public travelPrice: number;
    public image: string;
    public grankImage?: string;
    public shopImage?: string;

    constructor( id: string, name: string, travelPrice: number, description: string, image: string, grankImage?: string, shopImage?: string) {
        this.id = id;
        this.name = name;
        this.travelPrice = travelPrice;
        this.description = description;
        this.image = image;
        this.grankImage = grankImage;
        this.shopImage = shopImage;
    }
}