/**
 * Socket.io connection handler.
 * Each client joins a private room keyed by its userId (for targeted
 * notifications) and a shared 'all' room (for broadcasts).
 */
module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      socket.join('all');
    });

    socket.on('disconnect', () => {});
  });
};
