import React from 'react'
import './Particle.css'

const Particle = () =>{
    return(
        <Particles className='particle'
                params={{
                "particles": {
                    "number": {
                        "value": 50
                    },
                    "size": {
                        "value": 3
                    }
                },
                "interactivity": {
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "repulse"
                        }
                    }
                }
            }} 
      />
    )
}

export default Particle