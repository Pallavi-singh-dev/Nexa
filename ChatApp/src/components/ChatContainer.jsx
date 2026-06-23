import React, { useRef, useEffect, useContext, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'




const ChatContainer= () => {

  const {messages,selectedUser,setSelectedUser,sendMessage,getMessages,reactToMessage} = useContext(ChatContext)

  const {authUser,onlineUsers}  = useContext(AuthContext)
  
  const scrollEnd = useRef()

  const [input,setInput] = useState('');
  const [activeMessageReactionsId, setActiveMessageReactionsId] = useState(null);
  const lastTapRef = useRef(0);

  const handleDoubleTap = (msgId) => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
          reactToMessage(msgId, "❤️");
      }
      lastTapRef.current = now;
  };

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks = [];
          
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: "audio/webm" });
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64Audio = reader.result;
                  await sendMessage({ audio: base64Audio });
              };
              stream.getTracks().forEach((track) => track.stop());
          };
          
          recorder.start();
          setMediaRecorder(recorder);
          setIsRecording(true);
      } catch (error) {
          toast.error("Unable to access microphone: " + error.message);
      }
  };

  const discardRecording = () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.onstop = () => {
              mediaRecorder.stream.getTracks().forEach((track) => track.stop());
          };
          mediaRecorder.stop();
      }
      setIsRecording(false);
      setMediaRecorder(null);
  };

  const stopAndSendRecording = () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
      }
      setIsRecording(false);
      setMediaRecorder(null);
  };

  const openCamera = async () => {
      try {
          setCapturedImage(null);
          setIsCameraOpen(true);
          const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user" },
              audio: false
          });
          setVideoStream(stream);
          setTimeout(() => {
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
              }
          }, 100);
      } catch (error) {
          toast.error("Unable to access camera: " + error.message);
          setIsCameraOpen(false);
      }
  };

  const capturePhoto = () => {
      if (videoRef.current) {
          const video = videoRef.current;
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setCapturedImage(dataUrl);
          
          if (videoStream) {
              videoStream.getTracks().forEach((track) => track.stop());
          }
      }
  };

  const retakePhoto = async () => {
      setCapturedImage(null);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user" },
              audio: false
          });
          setVideoStream(stream);
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (error) {
          toast.error("Unable to access camera: " + error.message);
      }
  };

  const sendCapturedPhoto = async () => {
      if (capturedImage) {
          await sendMessage({ image: capturedImage });
          closeCamera();
      }
  };

  const closeCamera = () => {
      setIsCameraOpen(false);
      setCapturedImage(null);
      if (videoStream) {
          videoStream.getTracks().forEach((track) => track.stop());
          setVideoStream(null);
      }
  };

  useEffect(() => {
      return () => {
          if (videoStream) {
              videoStream.getTracks().forEach((track) => track.stop());
          }
      };
  }, [videoStream]);


  // handle sending a message
  const handleSendMessage = async (e)=>{
      e.preventDefault();
      if(input.trim()=="") return null;
      await sendMessage({text: input.trim()});
      setInput("")
  }

  const handleSendImage = async (e) =>{
      const file = e.target.files[0];
      if(!file || !file.type.startsWith("image/")){
        toast.error("select an image file")
        return;
      }
      const reader =  new FileReader();

      reader.onloadend = async ()=>{
        await sendMessage({image: reader.result})
        e.target.value = ""
      }
      reader.readAsDataURL(file)
  }

  useEffect(()=>{
     if(selectedUser){
        getMessages(selectedUser._id)
     }
  },[selectedUser])

 useEffect(()=>{
  if(scrollEnd.current && messages){
    scrollEnd.current.scrollIntoView({behavior:"smooth"})
  }
 },[messages])


  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* ----------header-------------- */}
        <div className='flex items-center gap-3 py-3 mx-4
        border-b border-stone-500'>
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt=" " className="w-8 rounded-full"/>
            <p className='flex-1 text-lg text-white flex items-center gap-2'>{selectedUser.fullName}
                {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full
                 bg-green-500"></span>}
                 </p>
                 <img onClick={()=> setSelectedUser(null)

                 }src={assets.arrow_icon} alt="" 
                 className='md:hidden max-w-7'/>
                 <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
        </div>
{/*  chat area */}
<div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3
pb-6'>
{messages.map((msg,index)=>(
    <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>

      <div className="relative group max-w-[70%] mb-8">
        {msg.image ? (
          <img src={msg.image} alt="" 
            className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden cursor-pointer'
            onDoubleClick={() => reactToMessage(msg._id, "❤️")}
            onTouchStart={() => handleDoubleTap(msg._id)}
            onClick={() => setActiveMessageReactionsId(activeMessageReactionsId === msg._id ? null : msg._id)}
          />
        ) : msg.audio ? (
          <div 
            className="p-2 border border-purple-500/20 bg-[#160c2c]/75 rounded-lg max-w-[240px] cursor-pointer"
            onDoubleClick={() => reactToMessage(msg._id, "❤️")}
            onTouchStart={() => handleDoubleTap(msg._id)}
            onClick={() => setActiveMessageReactionsId(activeMessageReactionsId === msg._id ? null : msg._id)}
          >
            <audio controls src={msg.audio} className="w-full h-8 outline-none" />
          </div>
        ) : (
          <p 
            className={`p-2.5 max-w-[200px] md:text-sm font-light rounded-lg break-all bg-cyan-700/60 text-white cursor-pointer select-none ${
              msg.senderId === authUser._id ? 'rounded-br-none' 
              : 'rounded-bl-none'
            }`}
            onDoubleClick={() => reactToMessage(msg._id, "❤️")}
            onTouchStart={() => handleDoubleTap(msg._id)}
            onClick={() => setActiveMessageReactionsId(activeMessageReactionsId === msg._id ? null : msg._id)}
          >
            {msg.text}
          </p>
        )}

        {/* Reaction picker menu */}
        {activeMessageReactionsId === msg._id && (
          <div className="absolute -top-11 left-0 z-30 bg-[#0d081e]/95 border border-purple-500/50 backdrop-blur-md rounded-full px-2.5 py-1.5 flex items-center gap-2 shadow-lg animate-bounce-subtle">
            {["❤️", "👍", "😂", "😮", "😢", "🙏"].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  reactToMessage(msg._id, emoji);
                  setActiveMessageReactionsId(null);
                }}
                className="cursor-pointer hover:scale-130 transition-transform text-sm md:text-base focus:outline-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reaction badges */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`absolute -bottom-3.5 ${msg.senderId === authUser._id ? 'right-2' : 'left-2'} z-10 flex items-center gap-0.5 bg-[#170a2d]/95 border border-purple-500/30 rounded-full px-1.5 py-0.5 shadow-md`}>
            {msg.reactions.map((reaction, i) => (
              <span key={i} title={reaction.userId === authUser._id ? "You" : selectedUser.fullName} className="text-xs">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className='text-center text-xs'>
          <img
  src={
    msg.senderId === authUser._id
      ? authUser?.profilePic || assets.avatar_icon
      : selectedUser?.profilePic || assets.avatar_icon
  }
 alt ="" className='
          w-7 rounded-full' />

          <p className='text-gray-500'>
            {formatMessageTime(msg.createdAt)
             }
          </p>

        </div>
        </div>
))}

<div ref={scrollEnd}>       

</div>
</div>

<div className='absolute bottom-0 right-0 left-0 flex items-center gap-3 p-3'>
<div className='flex-1 flex items-center bg-cyan-900/40 backdrop-blur-md border border-cyan-500/30 px-3 rounded-full'> 
  {isRecording ? (
    <div className="flex-1 flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2 text-red-500 animate-pulse text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        Recording Voice...
      </div>
      <div className="flex items-center gap-3">
        {/* Discard/Delete Recording */}
        <button onClick={discardRecording} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1.5 focus:outline-none" title="Discard recording">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
        {/* Send Recording */}
        <button onClick={stopAndSendRecording} className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer p-1.5 focus:outline-none" title="Send recording">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  ) : (
    <>
      <button onClick={openCamera} className="mr-2 cursor-pointer focus:outline-none text-gray-400 hover:text-purple-400 transition-colors p-1" title="Open camera">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
      </button>
      <input onChange={(e)=> setInput(e.target.value)} value={input} 
      onKeyDown={(e)=>e.key === "Enter"? handleSendMessage(e):null}type="text"  placeholder="Send a message" className='flex-1 
      text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent'/>
      <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
      <label htmlFor="image"> 
        <img src={assets.gallery_icon} alt="" className="w-5 mr-2 cursor-pointer"/>
      </label>
      <button onClick={startRecording} className="mr-1 cursor-pointer focus:outline-none text-gray-400 hover:text-purple-400 transition-colors p-1" title="Record voice">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      </button>
    </>
  )}
</div>
{!isRecording && (
  <div onClick={handleSendMessage} className='bg-cyan-500 hover:bg-cyan-400 p-3 rounded-full cursor-pointer flex items-center justify-center transition-colors'>
    <img src={assets.send_button} alt="" className='w-5'/>
  </div>
)}

{/* Camera modal */}
{isCameraOpen && (
  <div className="absolute inset-0 bg-[#030014]/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md">
    <div className="w-full max-w-md bg-[#0d081e] border border-purple-500/30 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl relative animate-bounce-subtle">
      <h3 className="text-white text-lg font-semibold">Capture Photo</h3>
      
      {capturedImage ? (
        <div className="w-full flex flex-col items-center gap-4">
          <img src={capturedImage} alt="Captured" className="w-full max-h-[260px] rounded-lg object-cover border border-purple-500/20" />
          <div className="flex gap-4 w-full">
            <button onClick={retakePhoto} className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-sm font-medium cursor-pointer transition-colors focus:outline-none">
              Retake
            </button>
            <button onClick={sendCapturedPhoto} className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white rounded-full text-sm font-medium cursor-pointer transition-colors shadow-md focus:outline-none">
              Send Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-[260px] rounded-lg object-cover border border-purple-500/20 bg-black animate-fade-in" />
          <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center cursor-pointer shadow-lg focus:outline-none">
            <div className="w-10 h-10 rounded-full border border-black/20 bg-white"></div>
          </button>
        </div>
      )}
      
      <button onClick={closeCamera} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer text-xl focus:outline-none">
        ✕
      </button>
    </div>
  </div>
)}
</div>
</div>
  ) : (
    <div className='flex flex-col items-center justify-center
    gap-2 text-gray-500 bg-white/10 max-md:hidden'>
        <img src={assets.logo_icon}  className="max-w-16 "  alt=" " />
        <p className='text-lg font-medium text-white'>
            Chat Anytime Anywhere
        </p>
    </div>
  )
}

export default ChatContainer