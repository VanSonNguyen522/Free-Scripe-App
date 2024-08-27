import React, {useState, useEffect, useRef} from 'react'

const FileDisplay = (props) => {
    const {handleAudioReset, file, audiStream} = props
   
  return (
    <main className='flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 md:gap-5 justify-center pb-20 w-72 max-w-full mx-auto'>
      <h1 className='font-semibold text-5xl sm:text-6xl md:text-7xl'>Your<span className='text-blue-400 bold'>File
      </span></h1>  
      <div className='flex flex-col text-left my-4'>
        <h3 className='font-semibold'>
            Name 
        </h3>
        <p> {file? file?.name : 'Custom audio'}</p>
        
      </div>
      <div className='flex items-center justify-between gap-4'>
            <button onClick={handleAudioReset} className='text-slate-400 hover:text-blue-400 duration-200'>Reset</button>
            <button className='specialBtn p-2 px-3 rounded-lg text-blue-400 flex items-center gap-2 font-medium'>
                <p>Transcribe</p>
                <i className="fa-solid fa-pen-nib"></i>
            </button>
        </div>
    </main>
  )
}

export default FileDisplay
