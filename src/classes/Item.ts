import { Tiers } from "./Tiers";
import { Currencies, Prices } from "./Currencies";

export default class Item {
    public id: string;
    public name: string;
    public tier: Tiers;
    public description: string;
    public image: string;
    public baseSellPrice: Prices = {};
    
    public constructor(id: string, name: string, tier: Tiers, description: string, image: string, baseSellPrice: { currency: Currencies, amount: number }) {
        this.id = id;
        this.name = name;
        this.tier = tier;
        this.description = description;
        this.image = image;
        this.baseSellPrice[baseSellPrice.currency] = baseSellPrice.amount;
    }

    public static initializeResourceQuantities(resourceMap: Map<string, Item>): { [itemId: string]: number } {
        const resources: { [itemId: string]: number } = {};
        resourceMap.forEach((value, key) => {
            resources[key] = 0;
        });
        return resources;
    }

    public static initializeResourcePrices(resourceMap: Map<string, Item>): { [itemId: string]: { sellPrice: Prices } } {
        const resources: { [itemId: string]: { sellPrice: Prices } } = {};
        resourceMap.forEach((value, key) => {
            resources[key] = { sellPrice: value.baseSellPrice };
        });
        return resources;
    }
}
