import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { PlayerStats } from "../schemas/PlayerStats";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { getThemeColor } from "../utils/util";
import { ShopStats } from "../schemas/Shop";
import { Currencies } from "../classes/Currencies";
import itemsMap from "../config/items";
import Item from "../classes/Item";
import { Tier } from "../classes/Tiers";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("shop_sell")
    .setDescription("Sell an item at the currently listed Shop price.")
    .addStringOption(option => option
        .setName("item")
        .setDescription("The item to be sold")
        .setRequired(true)
        .setAutocomplete(true))
    .addIntegerOption(option => option
        .setName("amount")
        .setDescription("Amount to sell")
        .setMinValue(0))
    .addBooleanOption(option => option
        .setName("sell_all")
        .setDescription("Sell all items")),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices: string[] = [];
        const playerStats = await PlayerStats.getStats(interaction.member!.user.id);
		if (focusedOption.name === "item" && playerStats) {
            let activeResources: Item[] = [];

            Object.entries(playerStats.resources).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    activeResources.push(itemsMap.get(itemId)!);
                }
            });
            activeResources = Tier.sortTiers(activeResources);
			choices = activeResources.map(item => item.name);
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    },
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

            const item = interaction.options.getString("item")!;
            let amount = interaction.options.getInteger("amount");
            const sellMax = interaction.options.getBoolean("sell_all");

            if (!amount && !sellMax) {
                await interaction.reply({
                    content: "Provide either 'amount' or 'sell_max' options when using this command."
                });
                return;
            }

            const toCamelCase = (pascalCaseString: string): string => {
                const words = pascalCaseString.split(' ');
                for (let i = 0; i < words.length; i++) {
                    // Lowercase the first character of the first word
                    if (i === 0 && words[i].length > 0) {
                        words[i] = words[i].charAt(0).toLowerCase() + words[i].slice(1);
                    }
                    // Capitalize the first letter of subsequent words
                    else if (i > 0 && words[i].length > 0) {
                        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
                    }
                }
                return words.join('');
            }

            const itemId = toCamelCase(item);
            const shopStats = await ShopStats.getStats("mineEntranceShop");
            
            if (!shopStats?.price.hasOwnProperty(itemId)) {
                await interaction.reply({
                    content: `Could not find item: ${item}`
                });
                return;
            }
            const itemName = itemsMap.get(itemId)?.name

            if (sellMax) {
                amount = playerStats.resources[itemId];
            }

            if (playerStats.resources[itemId] < amount!) {
                await interaction.reply({
                    content: `You cannot sell more than you have: ${itemName} (${playerStats.resources[itemId]})`
                });
                return;
            }

            let description = "";

            await PlayerStats.updateInventory(playerStats.userId, itemId, -amount!);
            for (const [currency, price] of Object.entries(shopStats.price[itemId].sellPrice)) {
                const payout = Math.round(price * amount!);
                await PlayerStats.updateStats(playerStats.userId, payout, Currencies[currency as keyof typeof Currencies]);
                description = `${amount} ${itemName} has been sold for ${payout} ${currency}\n\n **New Balance**: ${playerStats.CP + payout} CP`;
            }
            
            
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sell ${itemName}`)
                    .setDescription(description)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.shopImage!)
                    .setColor(getThemeColor("text"))
                    .setTimestamp()
                ]
            });
        } catch (error) {
            console.error(`Failed to handle shop_sell command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;