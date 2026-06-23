import { createContext, useState,useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({children})=>{
    const[messages , setMessages] = useState([]);
    const[users,setUsers]=useState([]);
    const[selectedUser,setSelectedUser]=useState(null);
    const[unseenMessages,setUnseenMessages]=useState({});


    const {socket,axios} = useContext(AuthContext);
    //  function to get all user for sidebar

    const getUsers = async () => {
        try{
         const {data} = await axios.get("/api/messages/users");
          if(data.success)
          {
            setUsers(data.users)
            setUnseenMessages(data.unseenMessages)
          }
        }
        catch (error){
            toast.error(error.message)
        }
    }

    // function to get meaasage for selected user
    const getMessages = async (userId) =>{
        try{
           const { data}= await axios.get(`/api/messages/${userId}`);
           if(data.success){
            setMessages(data.messages)
           }
        } catch(error){
             toast.error(error.message)
        }
    }

    // 
    const sendMessage = async (messageData)=>{
       try{
          const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
          if(data.success){
            setMessages((prevMessages)=>[...prevMessages,data.newMessage])
          }else{
            toast.error(data.message);
          }

       } catch(error){
             toast.error(error.message);
       }
    }

    const hideUserFromFeed = async (userId) => {
        try {
            const { data } = await axios.put(`/api/messages/hide/${userId}`);
            if (data.success) {
                setUsers(prev => prev.filter(u => u._id !== userId));
                if (selectedUser && selectedUser._id === userId) {
                    setSelectedUser(null);
                }
                toast.success("User removed from feed");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const reactToMessage = async (messageId, emoji) => {
        try {
            const { data } = await axios.put(`/api/messages/react/${messageId}`, { emoji });
            if (data.success) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
                    )
                );
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to subsribe to messages for selected user
const subscribeToMessages =  () =>{
    if(!socket) return;
      
    socket.on("newMessage", (newMessage)=>{
        if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.seen = true;
           setMessages((prevMessages)=>[...prevMessages,newMessage]);
           axios.put(`/api/messages/mark/${newMessage._id}`);
        }else{
            setUnseenMessages((prevUnseenMessages)=>({
                ...prevUnseenMessages , [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1 : 1
            })
            )
        }
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg._id === messageId ? { ...msg, reactions } : msg
            )
        );
    });
}

// function to unsubscribe from messages 
    
const unsubscribeFromMessages = () => {
    if(socket) {
        socket.off("newMessage");
        socket.off("messageReaction");
    }
}


useEffect(()=>{
    subscribeToMessages();
    return () => unsubscribeFromMessages();
},[socket,selectedUser])


    const value = {
        messages,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,
        unseenMessages,setUnseenMessages,hideUserFromFeed,reactToMessage
    }
    return (<ChatContext.Provider value={value}>
         {children}
    </ChatContext.Provider>
    )
}