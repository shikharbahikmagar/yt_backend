import { Router } from "express";
import { 
            uploadVideo, 
            getVideo, 
            deleteVideo, 
            updateVideoDetails,
            watchVideo

        } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


    const router = Router();

    router.route("/upload-video").post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            }
        ]),
        verifyJWT,
        uploadVideo,
    )

    //get videos
    router.route("/get-videos").get(getVideo)

    //get video by id
    router.route("/watch/:id").get(
        watchVideo
    )

    //delete video by id
    router.route("/delete-video/:id").delete(
        verifyJWT,
        deleteVideo
    )

    //update video by id
    router.route("/update-video/:id").put(
        verifyJWT,
        updateVideoDetails
    )


export default router;