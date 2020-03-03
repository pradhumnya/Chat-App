const users = []

const addUser = ({ id, username, room}) => {     //Every connection to the socket has an unique id assigned to it
    //Cleaning the Data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate the Data
    if(!username || !room) {
        return {
            error: 'Username and Room are required'
        }
    }

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //Validate username
    if(existingUser){
        return {
            error: 'Username already in use!!'
        }
    }

    //Store User
    const user = {id, username, room}
    users.push(user)
    return {user}

}

const removeUser = (id) => {
    const index = users.findIndex((user) => {  //findIndex return -1 if no match is found else 0 or number greater than that
        return user.id === id
    })

    if(index !== -1){
        return users.splice(index, 1)[0]  //can return an array so we take only the first element of it
    }
}

const getUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if(index === -1){
        return undefined
    }

    return users[index]
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    const usersInRoom = users.filter((user) => {
        return user.room === room 
    })

    if(!usersInRoom){
        return []
    }
    return usersInRoom
}

module.exports = {
    addUser,
    getUser,
    removeUser,
    getUsersInRoom
}