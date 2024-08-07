import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, ChannelType, TextChannel, EmbedBuilder, MessageComponentInteraction, messageLink, GuildMember } from "discord.js"
import { PlayerStats } from "../schemas/PlayerStats";
import { SlashCommand } from "../types";
import { getThemeColor } from "../utils/util";
import { Currencies } from "../classes/Currencies";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer CP to another player.")
    .addUserOption(option => option
        .setName("target")
        .setDescription("The player you want to transfer to")
        .setRequired(true))
    .addIntegerOption(option => option
        .setName("amount")
        .setDescription("Amount to transfer")
        .setRequired(true)
        .setMinValue(0)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
		let choices: string[] = [];

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

            const target = interaction.options.getUser("target")!;
            const amount = interaction.options.getInteger("amount")!;

            const targetPlayerStats = await PlayerStats.getStats(target.id);
            if (!targetPlayerStats) {
                await interaction.reply({
                    content: `Cannot transfer, ${target.username} has not registered.`
                });
                return;
            }

            if (amount > playerStats.CP) {
                await interaction.reply({
                    content: `You do not have enough CP for this transfer (${playerStats.CP} CP)`
                });
                return;
            }

            await PlayerStats.updateStats(playerStats.userId, -amount, Currencies.CP);
            await PlayerStats.updateStats(target.id, amount, Currencies.CP);

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle("Transfer")
                    .setDescription(`<@${interaction.member!.user.id}> has transferred ${amount} CP to <@${target.id}> \n\n **New Balance**: ${playerStats.CP - amount} CP`)
                    .setAuthor({ name: interaction.member!.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(getThemeColor("text"))
                    .setTimestamp()
                ]
            });
        } catch (error) {
            console.error(`Failed to handle grankRepay command: ${error.stack}`);
            await interaction.reply({ content: "Ping me if you see this.", ephemeral: true });
        }
    },
    cooldown: 6
}

export default command;