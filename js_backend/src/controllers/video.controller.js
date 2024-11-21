import {uploadOnCloudinary, deleteVideoFromCloudinary} from "../utils/cloudinary.js"
import {Video} from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose, { mongo, Mongoose } from "mongoose"

const uploadVideo = asyncHandler ( async(req, res) => {

    const {title, description, isPublished} = req.body
    const user = req.user
    //console.log({title, description, isPublished});
    if(!user){
        return new ApiError(401, "user not found!")

        
    }

    if(!title || !description){

        return new ApiError(400, "Title and description are required")

    }

    // console.log(req.files?.videoFile[0].path);
    // console.log(req.files?.thumbnail[0].path);
    
    
    const VideoLocalPath = req.files?.videoFile[0].path
    const ThumbnailLocalPath = req.files?.thumbnail[0].path
    //console.log(VideoLocalPath);
    

    if(!VideoLocalPath){
        return new ApiError(400, "Video file is required")
    }

    if(!ThumbnailLocalPath){
                   
        return new ApiError(400, "Thumbnail is required")
    }

    const duration = 0
    //upload video to cloudinary

    const video = await uploadOnCloudinary(VideoLocalPath)
    const thumbnail = await uploadOnCloudinary(ThumbnailLocalPath)
    
    //console.log(video);
    

    const newVideo = new Video({

        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        title: title,
        description: description,
        duration: video?.duration,
        owner: user._id,
        isPublished: isPublished
        
    })

    await newVideo.save()

    return res.status(201).json(new ApiResponse(201, "video uploaded successfully", {video: newVideo}))


})

//get video by id
const watchVideo = asyncHandler(async(req, res) => {
        
    const videoId = req.params.id

    const video = await Video.aggregate([

        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId) 
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                   {
                        $project: {

                            fullName: 1,
                            username: 1,
                            avatar: 1

                        }
                   }
                ]
            }
        }
    ])

    if(!video)
    {
        new ApiError(404, "Video not found")
    }

    return res.status(200).json(new ApiResponse(200, "video fetched successfully", {video: video}))


})

//delete video by id
const deleteVideo = asyncHandler(async(req, res) => {
        
    try {
        //user from middleware
        const user = req.user

        if(!user){
            return new ApiError(401, "please login to remove video")
        }
        //console.log(user._id.toString());

        const userId = req.user?._id.toString()
        
        //video id from params
        const videoId = req.params.id
        //console.log(videoId);
        
    
        const video = await Video.findById(videoId)
        //console.log(video);
        const ownerId = video?.owner.toString()
        //console.log(ownerId.toString());
        
        
        //check if user is authorized to remove video
        if(userId !== ownerId){
            return new ApiError(401, "you are not authorized to remove this video")
        }
    
    
        if(!videoId){
            return new ApiError(400, "no video found")
        }

        const oldVideoPath = video?.videoFile
    
        const extractPublicIdFromUrl = (url) => {
            const regex = /\/upload\/(?:v\d+\/)?([^\/\.]+)/;
            const match = url.match(regex);
            return match ? match[1] : null;
          };
    
        const publicId = extractPublicIdFromUrl(oldVideoPath)
        //console.log(publicId);
        //calling deleteVideoFromCludinary to remove video from cloudinary
        const removeFromCloudinary = await deleteVideoFromCloudinary(publicId)
        //console.log(removeFromCloudinary);
        
    
        if(!removeFromCloudinary){
            
            return new ApiError(500, "error removing video")
        }
    
        //remove video from db
        const response = await Video.findByIdAndDelete(videoId)
    
        if(!response){
            return new ApiError(404, "video not found")
        }
    
        //delete video from cloudinary
    
        //extract public id from video url
        
        
        return res.status(200).json(new ApiResponse(200, "video removed successfully"))
    
    } catch (error) {
        return new ApiError(500, "error removing video")
        
    }

})

//update video details
const updateVideoDetails = asyncHandler( async(req, res) => {

    const {title, description} = req.body
    const videoId = req.params.id

    const user = req.user;
    const userId = user?._id.toString()
    //console.log(userId);
    

    const getVideoDetails = await Video.findById(videoId)
    //console.log(getVideoDetails);
    
    const videoOwnerId = getVideoDetails?.owner.toString()
    //console.log(videoOwnerId);
    

    if( userId !== videoOwnerId )
    {
        return new ApiError(401, "unauthorized user");
    }

    if(!title && !description)
    {
        return new ApiError(400, "details can not be empty")
    }

    const video = await Video.findByIdAndUpdate( 
        videoId, 
        {
            $set: {
                title,
                description,
            }
    });

    console.log(video);
    

    return res.status(200)
    .json(new ApiResponse(200, "Video details updated successfully", video))


})

const getVideo = asyncHandler( async(req, res) => {

    try {
        
        const videos = await Video.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails'
              }
            },
        ]);

        //console.log(videos);

        return res.status(200)
        .json(new ApiResponse(200, "videos fetched successfully", {videos: videos}))
        

    } catch (error) {
        return new ApiError(500, "error fetching videos")
    }

})
export {
    uploadVideo,
    getVideo,
    watchVideo,
    deleteVideo,
    updateVideoDetails
}