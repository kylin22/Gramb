import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { ShopStats } from "../schemas/Shop";
import { PlayerStats } from "../schemas/PlayerStats";
import Item from "../classes/Item";
import itemsMap from "../config/items";
import { Tier, Tiers } from "../classes/Tiers";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Visit the local Shop"),
    execute: async (interaction) => {
        try {
            const playerStats = await PlayerStats.getStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
                });
                return;
            }

            const currentRegion = regions.find(region => region.id === playerStats?.currentRegion)!;
            if (currentRegion.id !== "mineEntrance") {
                await interaction.reply({
                    content: "You can't do that in this region, the shop is located in Mine Entrance."
                });
                return;
            }

            const shopStats = await ShopStats.getStats("mineEntranceShop");

            if (!shopStats) {
                await ShopStats.createWithDefaults("mineEntranceShop");
                await interaction.reply({
                    content: "The shop is gone: Recreating Shop for debug purposes..."
                });
                return;
            }

            let activeResources: Item[] = [];
            //TODO create pages if exceeding limit

            Object.entries(playerStats.resources).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    activeResources.push(itemsMap.get(itemId)!);
                }
            });
            activeResources = Tier.sortTiers(activeResources);

            let description = "";
            activeResources.forEach((item) => {
                const emoji = Tier.tierEmoji[item.tier];
                const prices = shopStats.price[item.id].sellPrice;
                let priceDescription = "";
                //TODO implement multiple currencies
                Object.entries(prices).forEach(([currency, price]) => {
                    priceDescription += `${price.toFixed(2)} ${currency}`;
                });
                description += `> ${emoji} **${item.name}** (${playerStats.resources[item.id]}): ${priceDescription}\n`
            });
            
            interaction.reply(
                `## __Shop__\n\nWelcome to the Shop <@${interaction.member!.user.id}>\nuse /shop_sell to sell items\n### Sell >>>\n${description}`
            );
        } catch (error) {
            console.error(`Failed to handle grank command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;