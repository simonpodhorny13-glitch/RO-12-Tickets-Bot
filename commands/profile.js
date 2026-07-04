const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  return `${days}d ${hrs % 24}h ${min % 60}m`;
}

function getPage1(user, member, data, userData) {
  let roleName = "Passenger";

  if (member) {
    const roles = member.roles.cache
      .filter(r => r.name !== "@everyone")
      .sort((a, b) => b.position - a.position);

    if (roles.first()) roleName = roles.first().name;
  }

  const activeBookings = data.voyages
    ? Object.values(data.voyages).filter(v =>
        v.bookings?.some(b => b.userId === user.id)
      ).length
    : 0;

  return `👤 **User:** ${user.username}
👨‍✈️ **Role:** ${roleName}
🎟 **Active Bookings:** ${activeBookings}

📄 Page 1/2`;
}

function getPage2(user, data, userData) {
  const userTx = data.transactions.filter(t => t.userId === user.id);

  const spent = userTx
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const tickets = userTx.filter(t => t.type === "ticket_purchase").length;

  const timeInServer = Date.now() - userData.joinedAt;

  return `📊 **Stats for ${user.username}**

💸 Total cash spent: $${spent.toLocaleString()}
🎟 Tickets booked: ${tickets}
⏱ In-server time: ${formatDuration(timeInServer)}

📄 Page 2/2`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your profile")
    .addUserOption(option =>
      option.setName("user").setDescription("User").setRequired(false)
    ),

  async execute(interaction, { data, getUser }) {
    const user = interaction.options.getUser("user") || interaction.user;
    const userData = getUser(user.id);

    if (!userData.joinedAt) userData.joinedAt = Date.now();

    const member = interaction.guild.members.cache.get(user.id);

    let page = 1;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("profile_prev")
        .setLabel("⬅️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("profile_next")
        .setLabel("➡️")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.reply({
      content: getPage1(user, member, data, userData),
      components: [row],
      ephemeral: true
    });

    const collector = msg.createMessageComponentCollector({
      time: 120000
    });

    collector.on("collect", async i => {
      if (i.user.id !== user.id) {
        return i.reply({
          content: "❌ This profile isn’t yours to control.",
          ephemeral: true
        });
      }

      if (i.customId === "profile_next") page = 2;
      if (i.customId === "profile_prev") page = 1;

      const newContent =
        page === 1
          ? getPage1(user, member, data, userData)
          : getPage2(user, data, userData);

      await i.update({
        content: newContent,
        components: [row]
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  }
};
