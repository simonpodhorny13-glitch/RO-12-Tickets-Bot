const fs = require("fs");

const OWNER_ROLE_ID = "1519408960803700948";
const ADMIN_ROLE_ID = "1519406529495961873";
const CAPTAIN_ROLE_ID = "1519409864185614467";
const SENIOR_CAPTAIN_ROLE_ID = "1521172459385126922";

const STAFF_CHANNEL_ID = "1519551586999730236";
const VOYAGES_CHANNEL_ID = "1519404986079903854";

module.exports = {
  name: "cancelvoyage",

  execute(message, args) {

    // 📍 CHANNEL LOCK
    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ You can only use this command in #staff.");
    }

    const member = message.member;

    const hasPermission =
      member.roles.cache.has(OWNER_ROLE_ID) ||
      member.roles.cache.has(ADMIN_ROLE_ID) ||
      member.roles.cache.has(CAPTAIN_ROLE_ID) ||
      member.roles.cache.has(SENIOR_CAPTAIN_ROLE_ID);

    if (!hasPermission) {
      return message.reply("❌ You don't have permission to cancel voyages.");
    }

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      return message.reply("❌ Data file error.");
    }

    if (!data.voyages) data.voyages = {};
    if (!data.users) data.users = {};
    if (!data.transactions) data.transactions = [];

    const voyageId = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (!voyageId) {
      return message.reply("❌ Usage: !cancelvoyage <voyageId|all> [reason]");
    }

    const refundPercent = data.settings?.refundPercent ?? 90;

    const refundUser = (user, paid) => {
      const refund = Math.floor(paid * (refundPercent / 100));
      user.balance = (user.balance || 0) + refund;

      data.transactions.push({
        type: "refund",
        amount: refund,
        reason: "voyage_cancel",
        timestamp: new Date().toISOString()
      });
    };

    const cancelVoyage = (id) => {
      const v = data.voyages[id];
      if (!v || v.cancelled) return false;

      v.salesOpen = false;
      v.cancelled = true;
      v.status = "cancelled";

      // refund passengers
      for (const uid in data.users) {
        const user = data.users[uid];

        if (user.bookings && user.bookings[id]) {
          refundUser(user, user.bookings[id].paid);
          delete user.bookings[id];
        }
      }

      return v;
    };

    // =========================
    // 🚫 CANCEL ALL
    // =========================
    if (voyageId.toLowerCase() === "all") {

      let found = false;

      for (const id in data.voyages) {
        const cancelled = cancelVoyage(id);
        if (cancelled) found = true;
      }

      if (!found) {
        return message.reply("❌ No active voyages to cancel.");
      }

      data.transactions.push({
        type: "cancel_all_voyages",
        reason,
        cancelledBy: message.author.id,
        timestamp: new Date().toISOString()
      });

      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

      const voyagesChannel = message.guild.channels.cache.get(VOYAGES_CHANNEL_ID);
      if (voyagesChannel) {
        voyagesChannel.send(`🚫 **ALL VOYAGES CANCELLED**\n\nReason: ${reason}`);
      }

      return message.channel.send(`🚫 All voyages cancelled.\nReason: ${reason}`);
    }

    // =========================
    // 🚫 CANCEL SINGLE
    // =========================
    const voyage = cancelVoyage(voyageId);

    if (!voyage) {
      return message.reply("❌ No active voyage found.");
    }

    data.transactions.push({
      type: "voyage_cancel",
      voyageId,
      reason,
      cancelledBy: message.author.id,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    const voyagesChannel = message.guild.channels.cache.get(VOYAGES_CHANNEL_ID);
    if (voyagesChannel) {
      voyagesChannel.send(
`🚫 **VOYAGE ${voyageId} CANCELLED**

📍 Route: ${voyage.from} → ${voyage.to}
❌ Reason: ${reason}
`
      );
    }

    message.channel.send(
`🚫 VOYAGE CANCELLED

Voyage ID: ${voyageId}
Reason: ${reason}
Refund: ${refundPercent}%`
    );
  }
};
