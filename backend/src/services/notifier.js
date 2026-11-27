const events = require('../utils/events');
const Notification = require('../models/Notification');

const label = (s) => s.replace('_', ' ');

async function notify(io, userId, grievance, type, message) {
  if (!userId) return;
  try {
    const n = await Notification.create({ user: userId, grievance: grievance._id, type, message });
    io.to(`user:${userId}`).emit('notification', n); // live push
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
}

// Subscribes to the EventEmitter events and turns them into saved + live notifications
function init(io) {
  events.on('grievance:created', async (g) => {
    await notify(io, g.complainant, g, 'submitted', `Your grievance ${g.ticketId} was submitted.`);
    await notify(io, g.assignedOfficer, g, 'assigned', `New ${g.priority} priority grievance ${g.ticketId} assigned to you.`);
  });
  events.on('grievance:assigned', async (g) => {
    await notify(io, g.assignedOfficer, g, 'assigned', `Grievance ${g.ticketId} has been assigned to you.`);
  });
  events.on('grievance:statusChanged', async ({ grievance: g }) => {
    await notify(io, g.complainant, g, 'status', `Your grievance ${g.ticketId} is now ${label(g.status)}.`);
  });
  events.on('grievance:remarked', async ({ grievance: g }) => {
    await notify(io, g.complainant, g, 'remark', `A new remark was added to your grievance ${g.ticketId}.`);
  });
}

module.exports = { init };
