//This is the client- side script
const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form') //name convention done as such so that we can distinguish its a dom element
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//receiving the event sent by the server. The name of the event specified in the client script should be same as the server script 
// socket.on('countUpdated', (cont) => {
//     console.log('The count has been updated', cont)
// })
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('click')
//     socket.emit('increment')
// })
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})  //location is a global made available. .search returns the query parameters

const autoscroll = () => {
    //New message Element
    const $newMessage = $messages.lastElementChild  //gets the newest element

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin //doesn't take into account the height of margin

    //visisble height => the height that is visible to us
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight  //total height which we can scroll

    //How far has the user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight  //scrollTop returns amount of distance we scrolled from the top

    if(containerHeight - newMessageHeight <= scrollOffset){  //to know whether we have truly reached the bottom of the container before the new message is added. If true then we are going to autoscroll otherwise no autoscroll
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message) => {  //Printing Welcome every time a new user connects
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //t prevent full browser page refresh
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value  //accessing the html element from its name 
    socket.emit('sendMessage', message, (error) => { // the last parameter is the callback function that we send for acknoledgment that out 'message' was received
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position.coords.latitude, position.coords.longitude)
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', coords, (loct) => {
            console.log(loct)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const  html = Mustache.render(locationMessageTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})