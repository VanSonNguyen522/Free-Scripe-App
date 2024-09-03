import {pipeline} from '@xenova/transformers'
import { MessageTypes } from './preset'

class MyTranscriptionPipeLine {
    static task = 'automatic-speech-recognition'
    static model = 'openai/whisper-tiny.en'
    static instance = null

    static async getInstance(process_callBack = null)
    {   if(this.instance === null)
        {
            this.instance = await pipeline(this.task, null, {progress_callback})
        }
        return this.instance
    }
}

self.addEventListener('message', async (event) => {
    const {type, audio} = event.data
    if(type === MessageTypes.INFERENCE_REQUEST)
        await transcribe(audio)
})

async function transcribe(audio) {
    sendLoadingMessage('Loading')
    
    let pipeline

    try {
        pipeline = await MyTranscriptionPipeLine.getInstance(load_model_callBack)
    }
    catch(err)
    {
        console.log(err.message)
    }

    sendLoadingMessage('Success')

    const stride_length_s = 5
    const generationTracker = new GenerationTracker(pipeline, stride_length_s)
    await pipeline(audio, {
        top_k: 0,
        do_sample: false,
        chunk_length_s: 30,
        stride_length_s,
        return_timestamps:true,
        callback_function: generationTracker.callbackFunction.bind(generationTracker),
        chunk_callback: generationTracker.chunkCallBack.bind(generationTracker)

    })
    generationTracker.sendFinalResult()
}

async function load_model_callBack(data)
{
    const {status} = data
    if(status === 'process')
    {
        const {file, process, loaded, total} = data
        sendDowloadingMessage(file, process, loaded, total) 
    }
}

function sendDowloadingMessage(status)
{
    self.postMessage({
        type: MessageTypes.LOADING,
        status
    })
}

async function sendLoadingMessage(file, process, loaded, total)
{
    self.postMessage({
        type: MessageTypes.DOWNLOADING,
        file,
        process,
        loaded,
        total
    })
}

class GenerationTracker{
    constructor(pipeline, stride_length_s)
    {
        this.pipeline = pipeline
        this.stride_length_s = stride_length_s
        this.chunks = []
        this.time_precision = pipeline?.processor.feature_extractor.config.chunk_length / pipeline.model.config.max_source_positions
        this.processed_chunks = []
        this.callbackFunctionCounter =  0
    }

    sendFinalResult() {
        self.postMessage({type: MessageTypes.INFERENCE_DONE})
    }

    callbackFunction(beams){
        this.callbackFunctionCounter += 1
        if(this.callbackFunctionCounter % 10 !== 0) {
            return
        }

        const bestBeams =  beams[0]
        let text = this.pipeline.tokenizer.decode(bestBeams, output_token_ids,{
            skip_special_tokens: true
        })

        const result = {
            text,
            start: this.getLastChunkTimestamp(),
            end: undefined
        }

        createPartiaResultMessage(result)
    }
    chunkCallBack(data) {
        this.chunks.push(data)
        const [text, {chunks}] = this.pipeline.tokenizer._decode_asr(
            this.chunks, 
            {
                time_precision: this.time_precision,
                return_timestamps: true,
                force_full_sequence: false
            }
        )

        this.processed_chunks = chunks.map((chunk, index) => {
            return this.processed_chunks(chunk, index)
        })

        createResultMessage(
            this.processed_chunks, false, this.getLastChunkTimestamp()
        )

       
    }

    getLastChunkTimestamp() {
        if(this.processed_chunks.length === 0)
        {
            return 0
        }
    }
    processChunk(chunk, index) {
        const{text, timestamp} = chunk
        const[start, end ] = timestamp
        
        return {
            
        }
    }

}