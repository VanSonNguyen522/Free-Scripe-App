// import { pipeline } from '@xenova/transformers'
import { pipeline } from '@xenova/transformers';
import { MessageTypes } from './presets';

// Sử dụng mô hình từ Hugging Face
const textGenerationPipeline = await pipeline('text-generation', 'gpt2');

// Hàm main để bao bọc await
async function main(retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = 60000; // 60 giây

    try {
        const response = await textGenerationPipeline('Say this is a test');
        console.log("Generated text:", response);
    } catch (error) {
        if (error.message.includes('Rate limit exceeded')) {
            console.error("Rate limit exceeded. Please try again later.");

            if (retryCount < maxRetries) {
                console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => main(retryCount + 1), retryDelay);
            } else {
                console.error("Max retries reached. Please try again later.");
            }
        } else {
            console.error("An error occurred:", error);
        }
    }
}

main().catch(console.error);


class MyTranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'gpt-2'; // Cập nhật mô hình nếu cần
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            try {
                console.log("Initializing pipeline with model:", this.model);
                this.instance = await pipeline(this.task, this.model, { progress_callback });
                console.log("Pipeline initialized with model:", this.model);
            } catch (error) {
                console.error("Pipeline initialization failed:", error);
            }
        }

        if (!this.instance) {
            console.error("Pipeline instance is still null after initialization.");
        }

        return this.instance;
    }
}

async function getModelJSON(modelURL) {
    try {
        const response = await fetch(modelURL);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Kiểm tra xem phản hồi có phải là JSON không
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Expected JSON, but received something else.');
        }
    } catch (error) {
        console.error("Error fetching model JSON:", error);
    }
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data
    if (type === MessageTypes.INFERENCE_REQUEST) {
        await transcribe(audio)
    }
})

async function transcribe(audio) {
    sendLoadingMessage('loading')

    let pipeline;

    try {
        pipeline = await MyTranscriptionPipeline.getInstance(load_model_callback);
    } catch (err) {
        console.log(err.message);
    }

    sendLoadingMessage('success');

    const stride_length_s = 5;

    const generationTracker = new GenerationTracker(pipeline, stride_length_s);
    await pipeline(audio, {
        top_k: 0,
        do_sample: false,
        chunk_length: 30,
        stride_length_s,
        return_timestamps: true,
        callback_function: generationTracker.callbackFunction.bind(generationTracker),
        chunk_callback: generationTracker.chunkCallback.bind(generationTracker)
    });
    generationTracker.sendFinalResult();
}

async function load_model_callback(data) {
    const { status } = data;
    if (status === 'progress') {
        const { file, progress, loaded, total } = data;
        sendDownloadingMessage(file, progress, loaded, total);
    }
}

function sendLoadingMessage(status) {
    self.postMessage({
        type: MessageTypes.LOADING,
        status
    });
}

async function sendDownloadingMessage(file, progress, loaded, total) {
    self.postMessage({
        type: MessageTypes.DOWNLOADING,
        file,
        progress,
        loaded,
        total
    });
}

class GenerationTracker {
    constructor(pipeline, stride_length_s) {
        this.pipeline = pipeline;
        this.stride_length_s = stride_length_s;
        this.chunks = [];
        this.time_precision = pipeline?.processor.feature_extractor.config.chunk_length / pipeline.model.config.max_source_positions;
        this.processed_chunks = [];
        this.callbackFunctionCounter = 0;
    }

    sendFinalResult() {
        self.postMessage({ type: MessageTypes.INFERENCE_DONE });
    }

    callbackFunction(beams) {
        this.callbackFunctionCounter += 1;
        if (this.callbackFunctionCounter % 10 !== 0) {
            return;
        }

        const bestBeam = beams[0];
        let text = this.pipeline.tokenizer.decode(bestBeam.output_token_ids, {
            skip_special_tokens: true
        });

        const result = {
            text,
            start: this.getLastChunkTimestamp(),
            end: undefined
        };

        createPartialResultMessage(result);
    }

    chunkCallback(data) {
        this.chunks.push(data);
        const [text, { chunks }] = this.pipeline.tokenizer._decode_asr(
            this.chunks,
            {
                time_precision: this.time_precision,
                return_timestamps: true,
                force_full_sequence: false
            }
        );

        this.processed_chunks = chunks.map((chunk, index) => {
            return this.processChunk(chunk, index);
        });

        createResultMessage(
            this.processed_chunks, false, this.getLastChunkTimestamp()
        );
    }

    getLastChunkTimestamp() {
        if (this.processed_chunks.length === 0) {
            return 0;
        }
    }

    processChunk(chunk, index) {
        const { text, timestamp } = chunk;
        const [start, end] = timestamp;

        return {
            index,
            text: `${text.trim()}`,
            start: Math.round(start),
            end: Math.round(end) || Math.round(start + 0.9 * this.stride_length_s)
        };
    }
}

function createResultMessage(results, isDone, completedUntilTimestamp) {
    self.postMessage({
        type: MessageTypes.RESULT,
        results,
        isDone,
        completedUntilTimestamp
    });
}

function createPartialResultMessage(result) {
    self.postMessage({
        type: MessageTypes.RESULT_PARTIAL,
        result
    });
}
