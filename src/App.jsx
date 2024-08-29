import { useState, useEffect, useRef } from 'react'
import HomePage from './Components/HomePage'
import Header from './Components/Header'
import FileDisplay from './Components/FileDisplay'
import Information from './Components/Information'
import Transcribing from './Components/Transcribing'
import { MessageTypes } from './utils/preset'
function App() {
  const [file, setFile] = useState(0)
  const [audioStream, setAudioStream] = useState(0)
  const isAudioAvaiable = file || audioStream
  const [output, setOutput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dowloading, setDowloading] = useState(false)
  const [finish, setFinish] = useState(false)
  function handleAudioReset () {
    setFile(null)
    setAudioStream(null)
  }
  // useEffect(() => {
  //   console.log(audioStream)
  // }, [audioStream])

  const worker = useRef(null)

  useEffect(() => {
    if(!worker.current) {
      worker.current = new Worker(new URL('./utils/whisper.worker.js', import.meta.url), {
        type: 'module'
      })
    }
    const onMessageReceived = async (e) => {
      switch (e.data.type) {
        case 'DOWLOADING':
          setDowloading(true)
          console.log('DOWLOADING')
          break;

        case 'LOADING':
          setLoading(true)
          console.log('LOADING')
          break;

        case 'RESULT':
          setOutput(e.data.results)
          break;

        case 'INFERENT_DONE':
          setFinish(true)
          console.log('DONE')
          break;
          
      }
    }

    worker.current.addEventListener('message', onMessageReceived)
    return () => worker.current.removeEventListener('message', onMessageReceived)

  })

  async function readAudioFrom(file) {
    const sampling_rate = 16000
    const audioCTX = new AudioContext({sampleRate:sampling_rate})
    const response = await file.arrayBuffer()
    const decoded = await audioCTX.decodeAudioData(response)
    const audio = decoded.getChannelData(0)
    return audio
  }

  async function handleFormSubmission() {
    if(!file && !audioStream) {return}
    let audio = await readAudioFrom(file ? file : audioStream)
    const model_name = `openai/whisper-tiny.en`
    worker.current.postMessage({
      type: MessageTypes.INFERENCE_REQUEST,
      audio,
      model_name
    })
  }

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
