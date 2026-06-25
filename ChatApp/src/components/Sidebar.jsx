import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import {useNavigate} from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { ThemeContext } from '../context/ThemeContext';


const Sidebar = () => {
     const {getUsers,users,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages,hideUserFromFeed}=useContext(ChatContext)
    const {logout,onlineUsers,authUser} = useContext(AuthContext)
    const {isLightMode, setIsLightMode} = useContext(ThemeContext)
    const[input,setInput]=useState(false);
    const[showThemeDialog, setShowThemeDialog] = useState(false);
// for new page
    const navigate = useNavigate();

    const filteredUsers = input ? users.filter((user)=>user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

   useEffect(()=>{  
       getUsers();
   },[onlineUsers])
    
  return (
    <div className={`bg-[#818582]/10 h-full p-5 rounded-r-xl
    overflow-y-scroll text-white ${selectedUser ? "max-md:hidden":''}`}> 
        <div className='pb-5'>
            <div className='flex justify-between items-center w-full'>
               <div className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity' onClick={() => setShowThemeDialog(true)}>
                 <img src={assets.logo_icon} alt="logo" className='max-w-10'/>
                 <span className='text-2xl font-bold text-white tracking-widest'>Nexa</span>
               </div>
            
            <div className="relative py-2 group flex items-center gap-3">
               <span className="text-sm font-medium hidden md:block">{authUser?.fullName}</span>
               <img src={authUser?.profilePic || assets.avatar_icon} alt="Profile" className='w-8 h-8 rounded-full border border-gray-500'/>
               <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer ml-1'/>
            
            <div className='absolute top-full right-0 z-20 w-32 p-5
            rounded-md bg-[#282142] border border-gray-600 text-gray-100
            hidden group-hover:block'>
                <p onClick={()=>navigate('/profile')}className='cursor-pointer text-sm'> Edit Profile</p>
                <hr className="my-2 border-t border-gray-500"/>
                <p onClick={()=>logout()}className='cursor-pointer text-sm'>
                    Logout
                </p>
            </div>
        </div>
        </div>
        <div className='bg-cyan-900/30 backdrop-blur-md border border-cyan-500/30 rounded-full flex items-center gap-2 py-3 px-4
        mt-5'>
            <img src={assets.search_icon} alt="Search" className='w-3'/>
            <input onChange={(e)=>setInput(e.target.value)}
            type="text" className='bg-transparent border-none outline-none
            text-white text-xs placeholder-[#cBcBcB] flex-1' placeholder='Search User...'/>
        </div>

        </div>
        <div className='flex flex-col      '>
          {filteredUsers.map((user,index)=>(
            <div onClick={()=>{setSelectedUser(user)}}
            key={index} className={`relative flex items-center justify-between
             gap-2 p-2 px-4 rounded cursor-pointer max-sm:text-sm ${selectedUser?._id === user._id && 
             'bg-[#282142]/50'}`}> 
              <div className='flex items-center gap-3'>
                <img src={user?.profilePic|| assets.avatar_icon} alt="" 
                className='w-[35px] aspect-[1/1] rounded-full'/>
                <div className='flex flex-col leading-5'>

  <p> {user.fullName}</p>
  {
      onlineUsers.includes(user._id)
      ? <span className='text-green-400 text-xs'>
          Online
      </span> : <span className='text-neutral-400 text-xs'> Offline</span>
  }

                 </div>
              </div>

              <div className='flex items-center gap-3'>
                  {unseenMessages[user._id] >0 && <p className='text-xs
                    h-5 w-5 flex justify-center items-center rounded-full
                  bg-cyan-500/70'> {unseenMessages[user._id]} </p>}
                  
                  {selectedUser?._id === user._id && (
                     <button onClick={(e) => { e.stopPropagation(); hideUserFromFeed(user._id); }} className='p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors' title="Delete user from feed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                     </button>
                  )}
              </div>
            </div>
            

          ))}
       
        </div>
        
        {/* Slide-out Theme Settings Dialog */}
        <div className={`fixed inset-y-0 left-0 w-72 bg-[#0d081e]/95 backdrop-blur-xl border-r border-purple-500/30 z-[60] transform transition-transform duration-300 ease-in-out ${showThemeDialog ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowThemeDialog(false)} className="text-gray-400 hover:text-white cursor-pointer p-2 rounded-full hover:bg-white/5 transition-colors focus:outline-none">
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-6 flex-1">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h3 className="text-white font-medium">Theme</h3>
                  <p className="text-xs text-gray-400 mt-1">{isLightMode ? 'Light Mode' : 'Dark Mode'}</p>
                </div>
                
                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isLightMode} 
                    onChange={() => setIsLightMode(!isLightMode)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-orange-400"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-auto">
              <p className="text-center text-xs text-gray-500">Nexa v1.0</p>
            </div>
          </div>
        </div>
        
        </div>
  )
}

export default Sidebar