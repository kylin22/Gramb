import itemsMap from "../config/items";
import Item from "./Item";

export default class ResourcePool {
    private entries: {item: Item, weight: number}[] = [];
    public displayChances: {[itemId: string]: number} = {};
    private accumulatedWeight = 0.0;

    public addEntry(itemId: string, weight: number) {
        const foundItem = itemsMap.get(itemId);
        if (!foundItem) {
            console.error(`Could not find item ${itemId}`);
            return;
        }

        this.displayChances[foundItem.id] = weight;
        this.accumulatedWeight += 1 / weight;
        this.entries.push({ item: foundItem, weight: this.accumulatedWeight });
    }

    public getRandom() {
        const seed = Math.random() * this.accumulatedWeight;
        return this.entries.find(function(entry) {
            return entry.weight >= seed;
        })!.item;
    }

    public calculateChances(): Record<string, string> {
        const totalWeight = this.accumulatedWeight;
        const chances: Record<string, string> = {};

        this.entries.forEach(({ item, weight }) => {
            const chance = ((weight / totalWeight) * 100);
            chances[item.id] = chance.toFixed(2); // Round to two decimal places
        });

        return chances;
    }
}