import { useState, useEffect } from 'react'
import HomePage from './Components/HomePage'
import Header from './Components/Header'
import FileDisplay from './Components/FileDisplay'
import Information from './Components/Information'
import Transcribing from './Components/Transcribing'
function App() {
  const [file, setFile] = useState(0)
  const [audioStream, setAudioStream] = useState(0)
  const isAudioAvaiable = file || audioStream
  const [output, setOutput] = useState(null)
  const [loading, setLoading] = useState(true)
  function handleAudioReset () {
    setFile(null)
    setAudioStream(null)
  }
  useEffect(() => {
    console.log(audioStream)
  }, [audioStream])
  return (
   <div className='flex flex-col max-w-[1000px] mx-auto w-full'>
    <section className='min-h-screen flex flex-col'>
      <Header/>
      {
        output ? (
          <Information/>

        ) : loading ? (
          <Transcribing/>
        ) : isAudioAvaiable ? (
          <FileDisplay handleAudioReset={handleAudioReset} file={file} audioStream = {setAudioStream}/>
        ) : (
          <HomePage setFile = {setFile} setAudioStream = {setAudioStream}/>
        )
      }
    </section>
     <h1 className='text-green-400'>Hello</h1>
     <footer>

     </footer>
   </div>
  )
}

export default App
