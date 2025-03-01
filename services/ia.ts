const {GoogleGenerativeAI} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function prompt(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({model: process.env.GEMINI_MODEL});
    const result = await model.generateContent(prompt);
    return result.response.text()
}


async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
    const model = genAI.getGenerativeModel({model: process.env.GEMINI_EMBED_MODEL});
    const embeddings: number[][] = [];

    for (const chunk of chunks) {
        const result = await model.embedContent(chunk);
        embeddings.push(result.embedding.values);
    }

    return embeddings;
}


function splitTextIntoChunks(text: string, chunkSize: number = 1000, overlapSize: number = 200): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += (chunkSize - overlapSize)) {
        chunks.push(text.slice(i, i + chunkSize));
        if (i + chunkSize >= text.length) break;
    }

    return chunks;
}

interface DocumentChunk {
    text: string;
    embedding: number[];
    metadata?: {
        position: number;
        source?: string;
        created?: Date;
    };
}

async function processDocumentForRAG(text: string, metadata?: any): Promise<DocumentChunk[]> {    // 1. Dividir en chunks
    const chunks = splitTextIntoChunks(text, 500, 100);

    const embeddings = await generateEmbeddings(chunks);

    return chunks.map((chunk, index) => ({
        text: chunk,
        embedding: embeddings[index],
        metadata: {
            position: index,
            ...metadata,
            created: new Date()
        }
    }));
}

export async function indexDocumentForRAG(documentText: string, documentMetadata?: any): Promise<void> {
    const chunks = await processDocumentForRAG(
        documentText,
        documentMetadata
    );

    // Guardar en base de datos
    //await saveToVectorDB(chunks);

    console.log(chunks);
}