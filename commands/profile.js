const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const ADMIN_ROLE_ID = "1519406529495961873";
const OWNER_ROLE_ID = "1519408960803700948";

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  return `${days}d ${hrs % 24}h ${min % 60}m`;
}

function getPage1(user, member, userData) {
  let roleName = "Passenger";

  if (member) {
    const roles = member.roles.cache
      .filter(r => r.name !== "@everyone")
      .sort((a, b) => b.position - a.position);

    if (roles.first()) roleName = roles.first().name;
  }

  const activeBookings = Object.keys(userData.bookings || {}).length;

  return `👤 **User:** ${user.username}
👨‍✈️ **Role:** ${roleName}
🎟 **Active Bookings:** ${activeBookings}

📄 Page 1/2`;
}

function getPage2(user, data, userData) {
  const userTx = (data.transactions || []).filter(t => t.userId === user.id);

  const spent = userTx
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const tickets = userTx.filter(t =>
    t.type === "seat_booking" ||
    t.type === "cabin_booking"
  ).length;

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
      option
        .setName("user")
        .setDescription("User (Admin/Owner only)")
        .setRequired(false)
    ),

  async execute(interaction, { data, getUser }) {
    const targetUser =
      interaction.options.getUser("user") || interaction.user;

    const requester =
      interaction.guild.members.cache.get(interaction.user.id);

    const canViewOthers =
      requester.roles.cache.has(ADMIN_ROLE_ID) ||
      requester.roles.cache.has(OWNER_ROLE_ID);

    if (
      targetUser.id !== interaction.user.id &&
      !canViewOthers
    ) {
      return interaction.reply({
        content: "❌ You can only view your own profile.",
        ephemeral: true
      });
    }

    const userData = getUser(targetUser.id);

    if (!userData.joinedAt) userData.joinedAt = Date.now();
    if (!userData.bookings) userData.bookings = {};

    const targetMember =
      interaction.guild.members.cache.get(targetUser.id);

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
      content: getPage1(targetUser, targetMember, userData),
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = msg.createMessageComponentCollector({
      time: 120000
    });

    collector.on("collect", async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "❌ You didn't open this profile.",
          ephemeral: true
        });
      }

      if (i.customId === "profile_next") page = 2;
      if (i.customId === "profile_prev") page = 1;

      await i.update({
        content:
          page === 1
            ? getPage1(targetUser, targetMember, userData)
            : getPage2(targetUser, data, userData),
        components: [row]
      });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({
          components: []
        });
      } catch {}
    });
  }
};
