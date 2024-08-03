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
    }

    private static readonly TierColors: { [tier in keyof typeof Tiers]: RGBTuple } = {
        [Tiers.Common]: [255, 255, 255],
        [Tiers.Uncommon]: [176, 252, 108],
        [Tiers.Rare]: [88, 156, 204],
        [Tiers.Epic]: [104, 76, 204],
        [Tiers.Legendary]: [256, 196, 76],
        [Tiers.Mythic]: [256, 68, 148],
        [Tiers.Exotic]: [256, 4, 4]
    }

    public static readonly tierEmoji: {[tier in keyof typeof Tiers]: string} = {
        [Tiers.Common]: "<:common:1269283882071625820>",
        [Tiers.Uncommon]: "<:uncommon:1269283906755231837>",
        [Tiers.Rare]: "<:rare:1269283923066880074>",
        [Tiers.Epic]: "<:epic:1269283935838539776>",
        [Tiers.Legendary]: "<:legendary:1269283947465019483>",
        [Tiers.Mythic]: "<:mythic:1269283960509173861>",
        [Tiers.Exotic]: "<:exotic:1269283972442226771>"
    }

    public static getTierColor(tier: keyof typeof Tiers): RGBTuple | undefined {
        return Tier.TierColors[tier];
    }

    public static sortTiers(tiers: Item[]) {
        return tiers.sort((a, b) => Tier.tiersSort[a.tier] - Tier.tiersSort[b.tier]);
    }
}

export { Tier, Tiers };