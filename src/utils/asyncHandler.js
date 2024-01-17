// const asynchandler =(fn)=>async(req,res,next)=>{
//     try {
//         await fn (req,res,next)
//     } catch (error) {
//         res.status(error.code||500).json({
//             sucess:false,
//             messsage:error.messsage
//         })
//     }
// }


const asynchandler =(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}
export {asynchandler}