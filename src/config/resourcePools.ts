import items from "./items";
import Item from "../classes/Item";
import regions from "./regions";
import ResourcePool from "../classes/ResourcePool";

const chasmResourcePool = createResourcePool(
    //Common
    ["stone", 1],
    ["grass", 3],
    ["coal", 10],
    ["copper", 22],
    ["iron", 28],
    ["silver", 56],
    ["amber", 80],
    //Uncommon
    ["obsidian", 140],
    ["amethyst", 164],
    ["titanium", 205],
    ["onyx", 340],
    ["quartz", 425],
    ["palladium", 680],
    //Rare
    ["luminarium", 2300],
    ["obsidian", 2300],
    ["aetherflux", 4500],
    ["cadmium", 4750],
    ["platinum", 6700],
    ["frostglass", 8900],
    //Epic
    ["gold", 10050],
    ["eclipseOrb", 12300],
    ["celestialTapestry", 14000],
    ["moltenCore", 18700],
    ["dreamweaversLoom", 28000],
    ["chronal", 46000],
    //Legendary
    ["apoptosis", 150000],
    ["singularity", 185000],
    ["myceliumNexus", 230000],
    ["twistedFlesh", 400000],
)

function createResourcePool(...entries: [string, number][]): ResourcePool {
    let pool = new ResourcePool();
    entries.forEach(([itemId, weight]) => {
        pool.addEntry(itemId, weight);
    });
    return pool;
}

const resourcePools: Record<string, ResourcePool> = {
    "chasm": chasmResourcePool,
}

export default resourcePools;