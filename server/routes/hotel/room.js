const express = require('express');
const { upload } = require('../../aws/upload');
const router = express.Router()
const rooms = require('../../controllers/hotel/room')

router.post("/create-a-room-to-your-hotel", upload, rooms.createRooms); // on panel
router.get("/get-list-of/rooms", rooms.getRoomsByEmailId); //on panel
router.patch("/update-your/room", upload, rooms.updateRoomsByRoomId);
router.delete("/delete-rooms-by-id", rooms.deleteRoomByRoomId); //on panel
router.patch('/decrease/room/count/by/one',rooms.decreaseRoomCountByOne)
module.exports=router