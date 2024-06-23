import React from 'react'
import  './FaceRecognition.css'

const FaceRecognition = ({imageSrc, boxes})=>{
    return(
        <div className='center ma'>
            <div className='absolute mt2'>
               
                {imageSrc ? 
                    (
                        <img
                            className='image border border-1 rounded'
                            id='inputImage'
                            alt=''
                            src={imageSrc}
                            width='500'
                            height='auto'
                        />
                    ) : null
                }
                
                {
                    boxes?.length > 0 ? boxes.map((box, index) => {
                        return (
                            <div key={index} className="bounding-box" style={{top: box.topRow, right:box.rightCol, bottom:box.bottomRow, left:box.leftCol}}></div>
                        );
                    }) :
                    <div></div>
                }
                
               
            </div>
        </div>
    )
}

export default FaceRecognition