import "dotenv/config";
import { SimplePool } from "nostr-tools/pool";
import { finalizeEvent, getPublicKey } from "nostr-tools";
import { scheduleJob } from "node-schedule";

const privateKey = process.env.PRIVATE_KEY;
const publicKey = getPublicKey(privateKey);
const relays = process.env.RELAYS.split(",");

const getRandomCatPic = async () => {
  const resp = await fetch("https://api.thecatapi.com/v1/images/search", {
    headers: { "x-api-key": process.env.CAT_API_KEY },
  });
  const data = await resp.json();
  return data[0].url;
};

async function publishEvent(catPicUrl) {
  const pool = new SimplePool();
  try {
    const eventTemplate = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "#catstr #cats #cute #funny #catmemes #catposting \n" + catPicUrl,
    };

    const signedEvent = finalizeEvent(eventTemplate, privateKey);
    await Promise.any(pool.publish(relays, signedEvent));
    console.log(`Posted: ${catPicUrl}`);
  } catch (error) {
    console.error("Error publishing event:", error);
  } finally {
    pool.close(relays);
  }
}

// cron job to post every 2 hours
const job = scheduleJob("0 */2 * * *", async () => {
  const catPicUrl = await getRandomCatPic();
  console.log(catPicUrl);
  await publishEvent(catPicUrl);
});

// Log bot startup
console.log(`Nostr bot started. Public key: ${publicKey}`);
console.log("Waiting for scheduled posts...");
