import React from 'react';
import './ImageInputForm.css';

const ImageInputForm = ({loading, imageUrl, onURLchange, onFileChange, onLinkSubmition, onFileUpload }) => {

    return (
        <div className='form-group'>
            <div className='form-group'>
                <p>
                    {'This Magic Brain A will detect faces in your pictures via URL link for '}
                    <span className='text-warning font-weight-bold' style={{ fontSize: '40px' }}>{'1'}</span>
                    {' point per face recognized'}
                </p>
                <input  aria-label='url input' className='form-control w-50 center' type='text' id="formUrl" style={{ WebkitBorderRadius: '5px' }} value={imageUrl} onChange={onURLchange} />
                <button
                    onClick={onLinkSubmition}
                    className={`m-2 grow f4 link ph3 pv2 dib white bg-light-purple button-150`}
                    style={{ WebkitBorderRadius: '5px' }}
                    disabled={loading}
                >
                    {loading && imageUrl ? (
                        <span className="mt-2 mb-3 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <span><i className="fa-solid fa-link"></i> Detect via url link</span>
                    )}
                </button>

                <div className="mt-5">
                    <p>
                        {'This Magic Brain B will detect faces in your pictures via file uploading for '}
                        <span className='text-danger font-weight-bold' style={{ fontSize: '40px' }}>2</span>
                        {' points per face recognized'}
                    </p>
                    <input  aria-label='image file input' className="center form-control w-50" type="file" id="formFile" accept="image/png, image/jpeg, image/jpg" onChange={onFileChange}/>
                </div>
                <button
                    onClick={onFileUpload}
                    className={`m-2 grow f4 link ph3 pv2 dib white bg-light-purple button-150`}
                    style={{ WebkitBorderRadius: '5px' }}
                    disabled={loading}
                >
                    {loading && !imageUrl? (
                        <span className="mt-2 mb-3 spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <span><i className="fa fa-file-arrow-up" aria-hidden="true"></i> Detect via file</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ImageInputForm;
