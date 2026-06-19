import mongoose from "mongoose";


// function to connect to the mongodb database
export const connectDB = async () =>{
    try{

      mongoose.connection.on('connected',()=>console.log('Database Connected'));
      const url = process.env.MONGODB_URL;
      const uri = url.includes('?') ? url.replace('/?', '/ChatApp?') : `${url}/ChatApp`;
      await mongoose.connect(uri)
    } catch (error) {
         console.log(error);
    }
}
