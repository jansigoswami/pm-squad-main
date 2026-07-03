const cron = require('node-cron');
const Reminder = require('../models/Reminder');

/**
 * Reminder scheduler.
 * Runs every minute, finds active reminders whose `time` matches the current
 * HH:MM, decides whether they should fire based on their repeat rule, and
 * emits 'reminder:fire' to the right socket room(s).
 */
module.exports = (io) => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${HH}:${MM}`;
      const day = now.getDay();
      const date = now.getDate();

      const reminders = await Reminder.find({
        isActive: true,
        time: currentTime,
      }).populate('owner');

      for (const rem of reminders) {
        const shouldFire = checkShouldFire(
          rem.repeat,
          day,
          date,
          rem.lastFired
        );
        if (!shouldFire) continue;

        const payload = { id: rem._id, title: rem.title, time: rem.time };

        if (rem.forAll) {
          io.emit('reminder:fire', payload);
        } else if (rem.owner) {
          io.to(rem.owner._id.toString()).emit('reminder:fire', payload);
        }

        await Reminder.findByIdAndUpdate(rem._id, { lastFired: now });
        if (rem.repeat === 'once') {
          await Reminder.findByIdAndUpdate(rem._id, { isActive: false });
        }
      }
    } catch (error) {
      console.error(`Reminder job error: ${error.message}`);
    }
  });
};

/**
 * Decide whether a reminder should fire right now given its repeat rule.
 */
function checkShouldFire(repeat, day, date, lastFired) {
  if (repeat === 'daily') return true;
  if (repeat === 'weekdays') return day >= 1 && day <= 5;
  if (repeat === 'weekly') return day === 1;
  if (repeat === 'biweekly') {
    if (day !== 1) return false;
    if (!lastFired) return true;
    const diff = Date.now() - new Date(lastFired).getTime();
    return diff >= 12 * 24 * 60 * 60 * 1000;
  }
  if (repeat === 'monthly') return date === 1;
  if (repeat === 'once') return true;
  return false;
}
