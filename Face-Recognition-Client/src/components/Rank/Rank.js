import React, { useEffect, useState } from 'react';
import moment from 'moment';
import './Rank.css';
import { capitalizeFirstLetter } from '../../helpers/general';

const Rank = ({ user, pointsEarned }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (pointsEarned !== 0) {
            setAnimate(true);

            const timer = setTimeout(() => {
                setAnimate(false);
            }, 2000); // Adjust the duration to match your animation's duration

            return () => clearTimeout(timer);
        }
    }, [user.score]);

    return (
        <div className='ma4 mt0'>
            <div className='white f3'>
                {`Hello ${capitalizeFirstLetter(user.name)}, you have logged in ${user.entries} times, you joined since ${moment(user.joined).format('MMMM Do YYYY')}`}
            </div>
            <div className='rank white f1'>
                {`Your rank is #${user.score}`}
                {animate && (
                    <h1 className={`rotate-and-scale hoverOver press-start-2p`}><span className='changeColor press-start-2p'>+{pointsEarned}</span></h1>
                )}
            </div>
        </div>
    );
};

export default Rank;
