const mongoose = require('mongoose');
const ContestType = require('../models/ContestType');
const Contest = require('../models/Contest');
const Tournament = require('../models/Tournament');

const CONTEST_TYPES = [
  { name: 'Free Match',       entry: 0,   payout: 0,   platform: 0  },
  { name: 'Quick Match ₹7',   entry: 7,   payout: 12,  platform: 2  },
  { name: 'Quick Match ₹10',  entry: 10,  payout: 18,  platform: 2  },
  { name: 'Battle ₹25',       entry: 25,  payout: 45,  platform: 5  },
  { name: 'Battle ₹40',       entry: 40,  payout: 70,  platform: 10 },
  { name: 'Classic ₹50',      entry: 50,  payout: 90,  platform: 10 },
  { name: 'Pro ₹80',          entry: 80,  payout: 144, platform: 16 },
  { name: 'Elite ₹100',       entry: 100, payout: 180, platform: 20 },
];

const seedContests = async () => {
  try {
    for (const ctData of CONTEST_TYPES) {
      let ct = await ContestType.findOne({ name: ctData.name });
      if (!ct) {
        ct = await ContestType.create(ctData);
        console.log(`[seed] Created contest type: ${ct.name}`);
      }

      const openCount = await Contest.countDocuments({
        contestType: ct._id,
        status: 'open'
      });

      if (openCount < 3) {
        const toCreate = 3 - openCount;
        for (let i = 0; i < toCreate; i++) {
          await Contest.create({ contestType: ct._id, status: 'open' });
        }
        console.log(`[seed] Created ${toCreate} open slots for ${ct.name}`);
      }
    }

    // Seed Tournaments if none exist
    const tCount = await Tournament.countDocuments();
    if (tCount === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(20, 0, 0, 0); // 8 PM tomorrow

      await Tournament.create([
        {
          name: 'Grand Master Open',
          entryFee: 500,
          prizePool: 7000,
          maxPlayers: 16,
          startTime: tomorrow,
          status: 'upcoming'
        },
        {
          name: 'Weekend Blitz Battle',
          entryFee: 100,
          prizePool: 1400,
          maxPlayers: 16,
          startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 10 PM tomorrow
          status: 'upcoming'
        }
      ]);
      console.log('[seed] Created 2 initial tournaments');
    }
  } catch (err) {
    console.error('[seed error]', err);
  }
};

const replenishContests = async (contestTypeId) => {
  try {
    const openCount = await Contest.countDocuments({
      contestType: contestTypeId,
      status: 'open'
    });
    if (openCount < 3) {
      const toCreate = 3 - openCount;
      for (let i = 0; i < toCreate; i++) {
        await Contest.create({ contestType: contestTypeId, status: 'open' });
      }
    }
  } catch (err) {
    console.error('[replenish error]', err);
  }
};

module.exports = { seedContests, replenishContests };
