import React from 'react'
import brain from './brain.png'
import './logo.css'
import Tilt from 'react-parallax-tilt';

const Logo=()=>{
    return(
        <div className='ma4 mt0 grow w-50 center'>
            <Tilt reverse axis="x" scale={1.2} perspective={700} reset={false}>
                <div className="Tilt-inner pa3">
                    <img alt='logo' width="128" height="128" src={brain}></img>
                </div>
            </Tilt>
        </div>
    )
}

export default Logo