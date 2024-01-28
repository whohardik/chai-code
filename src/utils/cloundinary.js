import { v2 as cloudinary } from "cloudinary";

import fs from "fs"; 


          
cloudinary.config({ 
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUNDINARY_API_KEY, 
  api_secret: process.env.CLOUNDINARY_API_SECRET
});


const uploadCloundinary= async (localFilePath) =>{
    try {
        
        if(!localFilePath ) return null
      const response=await cloudinary.uploader.upload(localFilePath,{
            resourse_type:"auto"
        })
        fs.unlinkSync(localFilePath)
console.log("upload file sucessfuly on cloundinary",response);
return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove local save temporay file when opreation faild
        return null
    }
}

export {uploadCloundinary}
