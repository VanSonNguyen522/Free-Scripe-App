import { useState } from "react"
import React from 'react'
import Translation from "./Translation"
import Transciption from "./Transciption"

const Information = () => {
  const [tab, setTab] = useState('transcription')
  return (
    <main className='flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 max-w-prose w-full mx-auto whitespace-nowrap'>
      <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl'>Your <span className='text-blue-400 bold'>Transciption
      </span></h1> 
      <div className='grid grid-cols-2 mx-auto bg-white shadow rounded-full overflow-hidden items-center'>
        <button onClick={() => setTab ('transcription')} className={'px-4 duration-200 py-1 font-medium' + (tab === 'transcription' ? ' bg-blue-400 text-white' : ' text-blue-400 hover:text-blue-600')}>Transcription</button>
        <button onClick={() => setTab ('translation')} className={'px-4 duration-200 py-1 font-medium' + (tab === 'translation' ? ' bg-blue-400 text-white' : ' text-blue-400 hover:text-blue-600')}>Translattion</button>
      </div>
      {tab === 'transcription' ? (
        <Transciption/>
      ): (
        <Translation/>
      )}
    </main>
  )
}

export default Information
