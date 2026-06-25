import React, { useRef, useEffect, useContext, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'




const AudioBubble = ({ audioUrl, isSender, selectedUser, onDoubleClick, onTouchStart, onClick }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);

        if (audio.duration) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [audioUrl]);

    const togglePlay = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
        }
    };

    const handleProgressClick = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (clickX / width) * duration;
        audio.currentTime = newTime;
        setProgress((newTime / duration) * 100);
        setCurrentTime(newTime);
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <div 
            onDoubleClick={onDoubleClick}
            onTouchStart={onTouchStart}
            onClick={onClick}
            className={`flex items-center gap-3 p-3 bg-[#130a24]/85 border border-purple-500/30 rounded-2xl max-w-[245px] shadow-lg relative group overflow-hidden cursor-pointer ${isSender ? 'rounded-br-none' : 'rounded-bl-none'}`}
        >
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            
            {/* Play/Pause Button */}
            <button 
                onClick={togglePlay} 
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-orange-400 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none z-10"
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
            </button>

            {/* Custom Soundwaves */}
            <div className="flex-1 flex flex-col gap-0.5 z-10" onClick={handleProgressClick}>
                <div className="flex items-end gap-[2px] h-6 px-1 justify-center">
                    {[6, 12, 18, 10, 16, 22, 14, 8, 12, 20, 10, 14, 18, 8, 12, 6].map((h, i) => {
                        const isPast = progress > (i / 16) * 100;
                        return (
                            <div 
                                key={i} 
                                className={`w-[2.5px] rounded-full transition-all duration-300 ${
                                    isPast ? 'bg-[#d946ef]' : 'bg-gray-600/80'
                                }`} 
                                style={{ 
                                    height: `${h}px`,
                                    animation: isPlaying && isPast ? 'wave-beat 1.0s infinite ease-in-out' : 'none',
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 px-1 font-light">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};

const ChatContainer= () => {

  const {messages,selectedUser,setSelectedUser,sendMessage,getMessages,reactToMessage} = useContext(ChatContext)

  const {authUser,onlineUsers}  = useContext(AuthContext)
  
  const scrollEnd = useRef()

  const [input,setInput] = useState('');
  const [activeMessageReactionsId, setActiveMessageReactionsId] = useState(null);
  const lastTapRef = useRef(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
  
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
      return () => {
          if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
          }
          if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
              audioCtxRef.current.close();
          }
      };
  }, []);

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

          // Setup real-time visualization canvas with slight delay to ensure DOM is rendered
          setTimeout(() => {
              try {
                  const canvas = canvasRef.current;
                  if (canvas) {
                      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                      const analyser = audioCtx.createAnalyser();
                      analyser.fftSize = 64;
                      const source = audioCtx.createMediaStreamSource(stream);
                      source.connect(analyser);
                      
                      audioCtxRef.current = audioCtx;
                      analyserRef.current = analyser;

                      const ctx = canvas.getContext("2d");
                      const bufferLength = analyser.frequencyBinCount;
                      const dataArray = new Uint8Array(bufferLength);
                      
                      const draw = () => {
                          if (!canvasRef.current) return;
                          animationFrameRef.current = requestAnimationFrame(draw);
                          
                          analyser.getByteFrequencyData(dataArray);
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          
                          const barWidth = (canvas.width / bufferLength) * 1.5;
                          let barHeight;
                          let x = 0;
                          
                          for (let i = 0; i < bufferLength; i++) {
                              barHeight = (dataArray[i] / 255) * canvas.height * 0.95;
                              if (barHeight < 3) barHeight = 3;
                              
                              const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
                              grad.addColorStop(0, '#7c3aed'); // purple
                              grad.addColorStop(0.4, '#d946ef'); // pink
                              grad.addColorStop(0.8, '#f472b6'); // light pink
                              grad.addColorStop(1, '#67e8f9'); // cyan
                              
                              ctx.fillStyle = grad;
                              const y = (canvas.height - barHeight) / 2;
                              
                              ctx.beginPath();
                              if (ctx.roundRect) {
                                  ctx.roundRect(x, y, barWidth - 2.5, barHeight, 2);
                              } else {
                                  ctx.rect(x, y, barWidth - 2.5, barHeight);
                              }
                              ctx.fill();
                              
                              x += barWidth;
                          }
                      };
                      draw();
                  }
              } catch (audioErr) {
                  console.error("Audio Context setup error:", audioErr);
              }
          }, 100);

      } catch (error) {
          toast.error("Unable to access microphone: " + error.message);
      }
  };

  const discardRecording = () => {
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
      }
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
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
      }
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
          <AudioBubble 
            audioUrl={msg.audio} 
            isSender={msg.senderId === authUser._id} 
            selectedUser={selectedUser} 
            onDoubleClick={() => reactToMessage(msg._id, "❤️")}
            onTouchStart={() => handleDoubleTap(msg._id)}
            onClick={() => setActiveMessageReactionsId(activeMessageReactionsId === msg._id ? null : msg._id)}
          />
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

<div className='absolute bottom-0 right-0 left-0 flex items-center gap-3 p-3 z-50'>
<div className='flex-1 flex items-center bg-cyan-900/40 backdrop-blur-md border border-cyan-500/30 px-3 rounded-full relative'> 
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
  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="mr-2 cursor-pointer focus:outline-none text-gray-400 hover:text-purple-400 transition-colors p-1" title="Emojis">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
  </button>
  <button onClick={startRecording} className="mr-1 cursor-pointer focus:outline-none text-gray-400 hover:text-purple-400 transition-colors p-1" title="Record voice">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
  </button>
  
  {/* Emoji Picker Popup */}
  {showEmojiPicker && (
    <div className="absolute bottom-14 right-10 z-50 bg-[#0d081e]/95 border border-purple-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-bounce-subtle flex flex-col gap-2 w-64 max-h-[250px]">
      <div className="flex justify-between items-center px-1 border-b border-white/10 pb-2">
        <span className="text-white text-sm font-medium">Emojis</span>
        <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white cursor-pointer focus:outline-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 p-1">
        {[
          "😀", "😂", "🥺", "🥰", "❤️", "🔥", "✨", "😍", "🙏", "😊",
          "😭", "💀", "👍", "🤣", "💕", "💯", "🎉", "😎", "😔", "😘",
          "😁", "🙌", "😌", "😅", "✌️", "😜", "😉", "👀", "💔", "😏",
          "😇", "🤭", "🙄", "🤩", "🤗", "🤔", "💪", "😋", "👏", "💋",
          "🥱", "😤", "🤤", "😡", "🥳", "👻", "🤡", "👽", "💩", "💤"
        ].map(emoji => (
          <button 
            key={emoji} 
            onClick={() => {
              sendMessage({text: emoji});
              setShowEmojiPicker(false);
            }}
            className="hover:scale-125 transition-transform text-xl cursor-pointer focus:outline-none flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
<div onClick={handleSendMessage} className='bg-cyan-500 hover:bg-cyan-400 p-3 rounded-full cursor-pointer flex items-center justify-center transition-colors'>
  <img src={assets.send_button} alt="" className='w-5'/>
</div>

{/* Voice Recording Modal Popup */}
{isRecording && (
  <div className="absolute inset-0 bg-[#030014]/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md">
    <div className="w-full max-w-sm bg-[#0d081e] border border-purple-500/40 rounded-2xl py-3 px-4 flex flex-col items-center gap-2.5 shadow-2xl relative animate-bounce-subtle">
      <h3 className="text-white text-xs font-medium tracking-wide">Recording Voice...</h3>
      
      {/* Visual Ripple and Microphone */}
      <div className="flex items-center justify-center gap-3 w-full px-1">
        {/* Glowing Microphone Ripple Container */}
        <div className="relative flex items-center justify-center mr-2">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 opacity-20 animate-ping"></div>
          <div className="absolute -inset-2 rounded-full border border-pink-500/30 animate-pulse"></div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-orange-400 text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </div>
        </div>

        {/* Real-time Dynamic Canvas Visualizer */}
        <div className="flex-1 h-8 border-l border-purple-500/20 pl-3 flex items-center justify-center">
          <canvas ref={canvasRef} width="160" height="32" className="w-full h-full rounded-md" />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 w-full justify-center pt-1">
        {/* Cancel/Discard Button */}
        <button 
          onClick={discardRecording} 
          className="flex-1 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-gray-300 hover:text-red-400 rounded-full text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2 focus:outline-none border border-white/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          Discard
        </button>

        {/* Send Button */}
        <button 
          onClick={stopAndSendRecording} 
          className="flex-1 py-1.5 bg-gradient-to-tr from-pink-500 to-orange-400 hover:brightness-110 text-white rounded-full text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send
        </button>
      </div>
    </div>
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