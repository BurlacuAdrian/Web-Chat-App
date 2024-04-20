const TwoWayMap = {
  socketIdToUsernameMap: {},
  usernameToSocketIdMap: {},

  add(socketId, username) {
      this.socketIdToUsernameMap[socketId] = username
      this.usernameToSocketIdMap[username] = socketId
  },

  getUsernameFromSocketId(socketId) {
      return this.socketIdToUsernameMap[socketId]
  },

  getSocketIdFromUsername(username) {
      return this.usernameToSocketIdMap[username]
  },

  delete(socketId) {
      const username = this.socketIdToUsernameMap[socketId]
      delete this.socketIdToUsernameMap[socketId]
      delete this.usernameToSocketIdMap[username]
  },

  online(username) {
    return username in this.usernameToSocketIdMap
  }
};

const ONLINE_USERS = Object.create(TwoWayMap)

export default ONLINE_USERS