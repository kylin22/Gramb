import { SlashCommandBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { getThemeColor } from "../utils/util";
import { SlashCommand } from "../types";
import regions from "../config/regions";
import { ShopStats } from "../schemas/Shop";
import { PlayerStats } from "../schemas/PlayerStats";


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

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Shop Information")
                    .setDescription(`Welcome to the Shop <@${interaction.member!.user.id}>`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setImage(currentRegion.image) //TODO shop sprite
                    .setColor(getThemeColor("text"))
                ]
            });
        } catch (error) {
            console.error(`Failed to handle grank command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;