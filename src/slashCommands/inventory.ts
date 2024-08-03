import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor, getPlayerStats } from "../utils/util";
import { SlashCommand } from "../types";
import itemsMap from "../config/items";
import Item from "../classes/Item";
import { Tier } from "../classes/Tiers";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory."),
    execute: async (interaction) => {
        try {
            const playerStats = await getPlayerStats(interaction.member!.user.id);

            if (!playerStats) {
                await interaction.reply({
                    content: "Use /gramble first"
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
                description += `[[${item.tier}]] **${item.name}**: ${playerStats.resources[item.id]}\n`
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Inventory")
                    .setDescription(description)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(getThemeColor("text"))
                ]
            });
        } catch (error) {
            console.error(`Failed to handle inventory command: ${error.message}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;
