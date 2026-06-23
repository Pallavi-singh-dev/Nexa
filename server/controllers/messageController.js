import Message from "../models/message.js"
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js"
import {io,userSocketMap} from "../server.js"
//  get all users except the logged in user (and hidden ones)
export const getUsersForSidebar = async(req,res)=>{
    try{
       const userId = req.user._id;
       const currentUser = await User.findById(userId);
       const hiddenUsers = currentUser.hiddenUsers || [];
       const filteredUsers = await User.find({
           _id: { $ne: userId, $nin: hiddenUsers }
       }).select("-password");

    //    count no if messages not seen
    const unseenMessages = {}
    const promises = filteredUsers.map(async (user)=>{
        const messages = await Message.find({senderId: user._id,receiverId:userId , seen: false})
        if(messages.length > 0 ){
            unseenMessages[user._id] = messages.length;
        }
    })
          
    await Promise.all(promises);
    res.json({
        success:true, users:filteredUsers , unseenMessages
    })

    }catch(error){
       console.log(error.message);
       res.json({
        success:false, message : error.message
    })
    }
}

// get all messages for selected user
export const getMessages = async(req,res)=>{
 try{
    const {id:selectedUserId} = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
        $or: [
            {senderId: myId , receiverId:selectedUserId},
            {senderId: selectedUserId , receiverId:myId},
        ]
    })
     

    await Message.updateMany({senderId: selectedUserId, receiverId: myId },
        {seen:true}
    );

     res.json({
        success : true , messages
     })

 }

 catch(error){

    console.log(error.message);
    res.json({
        success:false , message:error.message
    })
 }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req,res) =>{
    try{
       const {id} = req.params;
       await Message.findByIdAndUpdate(id,{seen:true})
       res.json({
        success:true,
       })

    }
    catch(error){
        console.log(error.message);
    res.json({
        success:false , message:error.message
    })
    }
}

// Send message to selected user

export const sendMessage = async (req,res) => {
    try{
       const {text, image, audio} = req.body;

       const receiverId = req.params.id;
       const senderId = req.user._id;

       let imageUrl;
       if(image) {
           const uploadResponse = await cloudinary.uploader.upload(image)
           imageUrl = uploadResponse.secure_url
       }

       let audioUrl;
       if(audio) {
           const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "auto" });
           audioUrl = uploadResponse.secure_url;
       }

        const newMessage = await Message.create({
            senderId , receiverId , text , 
            image : imageUrl,
            audio : audioUrl
        })

        // Emit the new message to the receiver's socket 

        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.json({
            success :true , newMessage
        });

    } catch (error){
        console.log(error.message);
    res.json({
        success:false , message:error.message
    })
    }
}

// Hide a user from the sidebar feed
export const hideUser = async (req, res) => {
    try {
        const { id: userToHideId } = req.params;
        const myId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            myId,
            { $addToSet: { hiddenUsers: userToHideId } },
            { new: true }
        ).select("-password");

        res.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// React to a message
export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        // Find existing reaction from this user
        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // If same emoji, remove it (toggle off)
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // If different emoji, update it
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        // Emit the reaction update via socket.io to both sender and receiver
        const receiverId = message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;
        const receiverSocketId = userSocketMap[receiverId];
        const senderSocketId = userSocketMap[userId];

        const socketPayload = { messageId, reactions: message.reactions };

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReaction", socketPayload);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageReaction", socketPayload);
        }

        res.json({
            success: true,
            reactions: message.reactions
        });

    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
}