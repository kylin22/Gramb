// enum Tiers {
//     Common,
//     Human,
//     Thyme,
//     SeranadeForStringsInEMajorIIWaltzOp22,
//     WaltzInCSharpMinorOp64No2,
//     JesusPaidItAll,
//     Pranked
// }

import { RGBTuple } from "discord.js";
import Item from "./Item";

enum Tiers {
    Common = "Common",
    Uncommon = "Uncommon",
    Rare = "Rare",
    Epic = "Epic",
    Legendary = "Legendary",
    Mythic = "Mythic",
    Exotic = "Exotic"
}

class Tier {
    public static readonly tiersSort: { [key: string]: number } = {
        "Common": 0,
        "Uncommon": 1,
        "Rare": 2,
        "Epic": 3,
        "Legendary": 4,
        "Mythic": 5,
        "Exotic": 6
    };

    private static readonly TierColors: { [tier in keyof typeof Tiers]: RGBTuple } = {
        [Tiers.Common]: [128, 128, 128], // Gray
        [Tiers.Uncommon]: [255, 0, 0], // Red
        [Tiers.Rare]: [0, 128, 255], // Blue
        [Tiers.Epic]: [128, 0, 255], // Purple
        [Tiers.Legendary]: [255, 128, 0], // Orange
        [Tiers.Mythic]: [255, 0, 255], // Magenta
        [Tiers.Exotic]: [255, 255, 0] // Yellow
    };

    public static getTierColor(tier: keyof typeof Tiers): RGBTuple | undefined {
        return Tier.TierColors[tier];
    }

    public static sortTiers(tiers: Item[]) {
        return tiers.sort((a, b) => Tier.tiersSort[a.tier] - Tier.tiersSort[b.tier]);
    }
}

export { Tier, Tiers };